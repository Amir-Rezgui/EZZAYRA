# app.py — FastAPI avec modèle global

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pickle
import numpy as np
import pandas as pd
import ee
from shapely.geometry import Polygon as ShapelyPolygon
import uvicorn

import requests
from firebase_config import db

db.collection("users").document("user1").set({
    "name": "Hedi"
})

def get_historical_weather(lat, lng, date_str):
    """
    Récupère la météo réelle via Open-Meteo pour une date et un lieu donnés.
    Retourne (pluie_cumul, temp_cumul) sur les 7 derniers jours.
    """
    end_date = pd.Timestamp(date_str)
    start_date = end_date - pd.Timedelta(days=7)
    
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "daily": ["precipitation_sum", "temperature_2m_max"],
        "timezone": "auto"
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        if "daily" in data:
            pluie_cumul = sum(data["daily"]["precipitation_sum"])
            # TEMPÉRATURE CUMULÉE (et non le MAX, comme demandé)
            temp_cumul = sum(data["daily"]["temperature_2m_max"])
            return pluie_cumul, temp_cumul
    except Exception as e:
        print(f"⚠️ Erreur météo: {e}")
    
    # Valeurs de secours si l'API échoue
    return 5.0, 200.0

def get_gee_ndvi_history(coords_list, end_date_str):
    """
    Récupère l'historique NDVI réel sur Google Earth Engine (Sentinel-2)
    pour les 3 dernières semaines et renvoie une liste de 5 valeurs (interpolées ou paddées).
    """
    try:
        # Formater les coordonnées pour GEE : liste de [lng, lat]
        coords = [[c.lng, c.lat] for c in coords_list]
        if coords[0] != coords[-1]:
            coords.append(coords[0]) # Fermer le polygone
            
        geom = ee.Geometry.Polygon([coords])
        
        end_date = pd.Timestamp(end_date_str)
        start_date = end_date - pd.Timedelta(days=25) 
        
        # Sentinel-2 Surface Reflectance
        collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                      .filterBounds(geom)
                      .filterDate(start_date.strftime('%Y-%m-%d'), (end_date + pd.Timedelta(days=1)).strftime('%Y-%m-%d'))
                      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))
                      
        def calculate_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return image.addBands(ndvi)
            
        with_ndvi = collection.map(calculate_ndvi)
        
        def get_mean_ndvi(image):
            mean_dict = image.select('NDVI').reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=geom,
                scale=10,
                maxPixels=1e9
            )
            return image.set('mean_ndvi', mean_dict.get('NDVI'))
            
        processed = with_ndvi.map(get_mean_ndvi)
        ndvi_values = processed.aggregate_array('mean_ndvi').getInfo()
        
        # Nettoyer les valeurs None et arrondir
        ndvi_clean = [round(v, 3) for v in ndvi_values if v is not None]
        
        # Le but est d'avoir 5 valeurs pour la démo. 
        # Si on n'en a pas trouvé 5, on duplique la dernière pour combler.
        if len(ndvi_clean) == 0:
            print("⚠️ Aucun passage nuageux dégagé trouvé sur GEE pour cette période.")
            return None
            
        # Si plus de 5, on prend les 5 dernières
        if len(ndvi_clean) > 5:
            ndvi_clean = ndvi_clean[-5:]
        # Si moins de 5, on padde au début
        while len(ndvi_clean) < 5:
            ndvi_clean.insert(0, ndvi_clean[0])
            
        return ndvi_clean

    except Exception as e:
        print(f"⚠️ Erreur lors de la récupération GEE: {e}")
        return None

def get_gee_lst_history(coords_list, end_date_str):
    """
    Récupère l'historique de la température de surface (LST) sur Google Earth Engine (MODIS)
    pour les 3 dernières semaines et renvoie une liste de 5 valeurs en degrés Celsius.
    """
    try:
        coords = [[c.lng, c.lat] for c in coords_list]
        if coords[0] != coords[-1]:
            coords.append(coords[0])
            
        geom = ee.Geometry.Polygon([coords])
        
        end_date = pd.Timestamp(end_date_str)
        start_date = end_date - pd.Timedelta(days=25) 
        
        # MODIS LST (MOD11A2 - 8-day composite)
        collection = (ee.ImageCollection('MODIS/061/MOD11A2')
                      .filterBounds(geom)
                      .filterDate(start_date.strftime('%Y-%m-%d'), (end_date + pd.Timedelta(days=1)).strftime('%Y-%m-%d')))
                      
        # MODIS LST scale factor is 0.02, and it's in Kelvin. To convert to Celsius: (LST_Day_1km * 0.02) - 273.15
        def calculate_lst_celsius(image):
            lst_celsius = image.select('LST_Day_1km').multiply(0.02).subtract(273.15).rename('LST_C')
            return image.addBands(lst_celsius)
            
        with_lst = collection.map(calculate_lst_celsius)
        
        def get_mean_lst(image):
            mean_dict = image.select('LST_C').reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=geom,
                scale=1000, # MODIS resolution is 1km
                maxPixels=1e9
            )
            return image.set('mean_lst', mean_dict.get('LST_C'))
            
        processed = with_lst.map(get_mean_lst)
        lst_values = processed.aggregate_array('mean_lst').getInfo()
        
        lst_clean = [round(v, 2) for v in lst_values if v is not None]
        
        if len(lst_clean) == 0:
            print("⚠️ Aucune donnée LST trouvée sur GEE pour cette période.")
            return None
            
        if len(lst_clean) > 5:
            lst_clean = lst_clean[-5:]
        while len(lst_clean) < 5:
            lst_clean.insert(0, lst_clean[0])
            
        return lst_clean

    except Exception as e:
        print(f"⚠️ Erreur lors de la récupération GEE LST: {e}")
        return None

app = FastAPI(
    title="🫒 NDVI Anomaly Detection API",
    description="Détection d'anomalies sur oliveraies tunisiennes",
    version="2.0"
)

# ── Initialisation Earth Engine ────────────────────────
print("⏳ Initialisation Google Earth Engine...")
try:
    ee.Authenticate()
    ee.Initialize(project='hackathon-ndvi')
    print("✅ Google Earth Engine initialisé avec succès.")
except Exception as e:
    print(f"⚠️ Erreur GEE. Veuillez exécuter ee.Authenticate() localement. Détail: {e}")

# ── Charger le modèle au démarrage ──────────────────────
print("⏳ Chargement du modèle global...")
with open('model_global.pkl', 'rb') as f:
    bundle = pickle.load(f)

MODEL     = bundle['model']
ENCODER   = bundle['encoder']
STD_TABLE = bundle['std_table']
FEATURES  = bundle['features']
# --- LE FIX ICI ---
# On force l'apprentissage des classes si l'encodeur est vide
try:
    ENCODER.transform(['intensif'])
except:
    print("⚠️ L'encodeur n'était pas fitté. Réparation en cours...")
    ENCODER.fit(['extensif', 'intensif']) 
# ------------------

print(f"✅ Modèle chargé ! Classes connues : {ENCODER.classes_}")


# ── Schemas ─────────────────────────────────────────────
class Coordinate(BaseModel):
    lat: float
    lng: float

class Oliveraie(BaseModel):
    id: Optional[str] = None
    polygone: List[Coordinate]
    systeme: str

class DiagnosticRequest(BaseModel):
    oliveraie: Oliveraie
    date: str
    ndvi_observe: Optional[List[float]] = None  # Optionnel car on va le simuler s'il n'est pas fourni

# ── Helper ──────────────────────────────────────────────
def predict_ndvi(polygone, systeme, end_date_str, ndvi_observe=None):
    end_date = pd.Timestamp(end_date_str)
    
    # 1. GÉNÉRER LA FENÊTRE DE 3 SEMAINES (J-20, J-15, J-10, J-5, J-0)
    dates_historique = [end_date - pd.Timedelta(days=i*5) for i in range(4, -1, -1)]

    # Centroïde et surface
    coords  = [(c.lng, c.lat) for c in polygone]
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    poly    = ShapelyPolygon(coords)
    lat     = poly.centroid.y
    lng     = poly.centroid.x
    area_ha = abs(poly.area) * 111320 * 111320 / 10000

    systeme_enc = ENCODER.transform([systeme])[0]
    
    ndvi_attendu_list = []

    # 2. RÉCUPÉRATION MÉTÉO ET NDVI POUR CHAQUE DATE 🌧️
    for d in dates_historique:
        doy = d.dayofyear
        pluie, temp_cumul = get_historical_weather(lat, lng, d)
        
        X = np.array([[
            np.sin(2 * np.pi * doy / 365),
            np.cos(2 * np.pi * doy / 365),
            np.sin(4 * np.pi * doy / 365),
            np.cos(4 * np.pi * doy / 365),
            doy,
            d.month,
            d.year,
            (d - pd.Timestamp('2020-01-01')).days / 365,
            systeme_enc,
            lat,
            lng,
            area_ha, pluie,  
            temp_cumul       
        ]])

        val_attendu = float(np.clip(MODEL.predict(X)[0], 0.05, 0.95))
        ndvi_attendu_list.append(round(val_attendu, 4))
    
    print(f"☁️ Météo (Fin: {end_date.date()}): {pluie:.1f}mm, cumul temp {temp_cumul:.1f}°C")

    # --- RÉCUPÉRATION NDVI RÉEL SUR GOOGLE EARTH ENGINE ---
    # Si le client ne fournit pas explicitement 'ndvi_observe', on le récupère sur GEE
    if not ndvi_observe or len(ndvi_observe) != 5:
        print("📡 Interrogation de Google Earth Engine pour le NDVI réel...")
        gee_ndvi = get_gee_ndvi_history(polygone, end_date_str)
        
        if gee_ndvi:
            ndvi_observe = gee_ndvi
            print(f"✅ Données GEE récupérées : {ndvi_observe}")
        else:
            # L'utilisateur demande des données réelles, on ne simule pas les données
            print("⚠️ GEE indisponible ou pas de données NDVI, données manquantes...")
            ndvi_observe = []

    # --- RÉCUPÉRATION LST RÉEL SUR GOOGLE EARTH ENGINE ---
    print("📡 Interrogation de Google Earth Engine pour le LST réel (Bonus)...")
    lst_observe = get_gee_lst_history(polygone, end_date_str)
    
    if not lst_observe:
        # L'utilisateur a demandé des données réelles uniquement, on ne simule pas les données
        print("⚠️ LST indisponible, données manquantes...")
        lst_observe = []
    else:
        print(f"✅ Données LST GEE récupérées : {lst_observe}")

    # 3. CALCUL DU SCORE D'ANOMALIE (sur la FENÊTRE GLISSANTE DE 3 SEMAINES)
    score   = None
    statut  = 'inconnu'
    residual = None
    mean_attendu = None

    if ndvi_observe is not None and len(ndvi_observe) > 0:
        # Moyennes sur la fenêtre de 3 semaines (5 points)
        mean_attendu = sum(ndvi_attendu_list) / len(ndvi_attendu_list)
        mean_observe = sum(ndvi_observe) / len(ndvi_observe)
        
        residual = mean_observe - mean_attendu
        
        # 4. SEUILLAGE DYNAMIQUE basé sur la table (quantiles historiques)
        std_row  = STD_TABLE[
            (STD_TABLE['systeme'] == systeme) &
            (STD_TABLE['month']   == end_date.month)
        ]
        
        if len(std_row) > 0:
            std = float(std_row['std_residual'].iloc[0])
            std = max(std, 0.03) # Seuil miminum de sensibilité
        else:
            std = 0.05
            
        score  = residual / std
        statut = 'rouge' if score < -2 else 'orange' if score < -1 else 'vert'

    return {
        "lat":           round(lat, 4),
        "lng":           round(lng, 4),
        "area_ha":       round(area_ha, 2),
        "ndvi_attendu":  ndvi_attendu_list,
        "ndvi_observe":  ndvi_observe,
        "lst_observe":   lst_observe,
        "residual":      round(residual, 4) if residual is not None else None,
        "anomaly_score": round(abs(score), 2) if score is not None else None, # On renvoie une valeur absolue pour correspondre à l'image ex: 2.4
        "statut":        statut,
        "mean_attendu":  mean_attendu
    }

# ── Routes ──────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "api":     "NDVI Anomaly Detection",
        "version": "2.0",
        "routes":  ["/api/diagnostic-anomalie", "/use-cases", "/docs"]
    }


@app.post("/api/diagnostic-anomalie")
def diagnostic(req: DiagnosticRequest):
    """
    Diagnostic principal — accepte n'importe quelle parcelle
    """
    if req.oliveraie.systeme not in ['intensif', 'extensif']:
        raise HTTPException(400, "systeme doit être 'intensif' ou 'extensif'")
    if len(req.oliveraie.polygone) < 3:
        raise HTTPException(400, "polygone doit avoir au moins 3 points")

    result = predict_ndvi(
        req.oliveraie.polygone,
        req.oliveraie.systeme,
        req.date,
        req.ndvi_observe
    )

    # Explication textuelle dynamique
    statut = result['statut']
    score  = result['anomaly_score']
    res    = result['residual']
    mean_attendu = result.pop('mean_attendu', 0)

    # Calcul du pourcentage de baisse
    pourcentage_baisse = 0
    if mean_attendu and res:
        pourcentage_baisse = round(abs(res) / mean_attendu * 100)

    if statut == 'rouge':
        result['explication']    = (
            f"NDVI {pourcentage_baisse}% en dessous attendu sur 3 semaines. "
            f"Stress probable important - vérifier irrigation."
        )
        result['recommandation'] = "Inspection visuelle urgente dans 48h"

    elif statut == 'orange':
        result['explication']    = (
            f"NDVI {pourcentage_baisse}% en dessous attendu sur 3 semaines. "
            f"Début de stress détecté, malgré une météo normale."
        )
        result['recommandation'] = "Inspection visuelle dans 48h"

    else:
        result['explication']    = (
            f"NDVI conforme à l'attendu sur 3 semaines."
        )
        result['recommandation'] = "Aucune action requise"

    return result


@app.get("/use-cases")
def use_cases():
    """
    Cas d'usage préfabriqués pour tester l'API
    Rouge et Vert avec vraies coordonnées EZZAYRA
    """
    return {
        "cas_rouge": {
            "description": "Oliveraie intensif en stress hydrique sévère",
            "curl": """curl -X POST http://localhost:8000/api/diagnostic-anomalie \\
  -H "Content-Type: application/json" \\
  -d '{
    "oliveraie": {
      "id": "0_2026_307",
      "polygone": [
        {"lat": 36.448, "lng": 10.015},
        {"lat": 36.451, "lng": 10.008},
        {"lat": 36.450, "lng": 10.008},
        {"lat": 36.449, "lng": 10.008},
        {"lat": 36.448, "lng": 10.015}
      ],
      "systeme": "intensif"
    },
    "date": "2025-07-15",
    "ndvi_observe": [0.28, 0.26, 0.24, 0.22, 0.21]
  }'""",
            "explication": "NDVI observé 0.21 très bas pour un intensif en juillet → ROUGE"
        },
        "cas_vert": {
            "description": "Oliveraie extensif saine en juin",
            "curl": """curl -X POST http://localhost:8000/api/diagnostic-anomalie \\
  -H "Content-Type: application/json" \\
  -d '{
    "oliveraie": {
      "id": "1_2025_011",
      "polygone": [
        {"lat": 35.292, "lng": 10.609},
        {"lat": 35.294, "lng": 10.613},
        {"lat": 35.295, "lng": 10.617},
        {"lat": 35.294, "lng": 10.618},
        {"lat": 35.292, "lng": 10.609}
      ],
      "systeme": "extensif"
    },
    "date": "2025-06-10",
    "ndvi_observe": [0.38, 0.39, 0.40, 0.41, 0.41]
  }'""",
            "explication": "NDVI observé 0.41 normal pour un extensif en juin → VERT"
        }
    }


@app.post("/batch")
def batch_diagnostic(parcelles: List[DiagnosticRequest]):
    """
    Diagnostic sur plusieurs parcelles en une seule requête
    Utile pour le dashboard
    """
    if len(parcelles) > 50:
        raise HTTPException(400, "Maximum 50 parcelles par batch")

    results = []
    for req in parcelles:
        try:
            result = predict_ndvi(
                req.oliveraie.polygone,
                req.oliveraie.systeme,
                req.date,
                req.ndvi_observe
            )
            results.append({"status": "ok", **result})
        except Exception as e:
            results.append({"status": "error", "detail": str(e)})

    summary = {
        "total":  len(results),
        "vert":   sum(1 for r in results if r.get('statut') == 'vert'),
        "orange": sum(1 for r in results if r.get('statut') == 'orange'),
        "rouge":  sum(1 for r in results if r.get('statut') == 'rouge'),
    }

    return {"summary": summary, "results": results}
if __name__ == "__main__":
    print("Starting the server! It will stay open until you press CTRL+C.")
    uvicorn.run(app, host="127.0.0.1", port=8000)