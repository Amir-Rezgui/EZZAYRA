# AGENT PROMPT — Plateforme EZZAYRA

# Pour : VS Code AI Agent (GPT / Copilot Workspace)

# Mission : Frontend React + PWA + Chatbot Whisper + Backend FastAPI stub

---

## CONTEXTE PROJET

Tu développes une plateforme web complète pour l'analyse intelligente des oliveraies tunisiennes dans le cadre d'un hackathon. Le projet sera présenté à un jury qui doit pouvoir tester tout depuis **une seule URL**, sans installation, en moins de 60 secondes.

Le projet est développé en équipe :

- **Toi (ce prompt)** : Dashboard web, carte, chatbot vocal, interface complète, backend stub avec placeholders
- **Tes collègues** : Ils brancheront les vrais modèles IA (classification Sentinel-2, CNN maladies feuille, NDVI anomalie, RAG corpus PDF) dans les placeholders que tu vas laisser

**CONTRAINTE ABSOLUE** : Tout doit être 100% gratuit, sans carte bancaire, sans compte payant.

---

## STACK TECHNIQUE IMPOSÉE

### Frontend

- React 18 + Vite
- TypeScript
- Tailwind CSS v3
- React Router v6 (SPA)
- Leaflet.js + react-leaflet + leaflet-draw (carte + polygone)
- Axios (appels API)
- Recharts (graphiques NDVI)
- shadcn/ui (composants)
- file-saver (export GeoJSON)

### Backend

- Python 3.11 + FastAPI
- Pydantic v2 (schémas)
- openai-whisper (ASR local — modèle "small")
- gTTS (Google Text-to-Speech, gratuit sans CC)
- LangChain + ChromaDB (RAG — placeholders pour les collègues)
- python-multipart (upload fichiers)
- uvicorn

### Base de données

- Supabase (PostgreSQL + PostGIS) — tier gratuit sans CC
- Supabase Storage pour les images/audio

### Déploiement

- Frontend : Vercel (gratuit)
- Backend : Render.com (gratuit)
- Modèles lourds : HuggingFace Spaces (gratuit)

---

## STRUCTURE DU PROJET À GÉNÉRER

```
/EZZAYRA
├── /frontend                          # React PWA
│   ├── /src
│   │   ├── /pages
│   │   │   ├── MapPage.tsx            # Carte principale + polygone
│   │   │   ├── ChatbotPage.tsx        # Interface chatbot vocal
│   │   │   ├── AnalysesPage.tsx       # Liste analyses
│   │   │   ├── AnomaliesPage.tsx      # Dashboard NDVI
│   │   │   └── DemoPage.tsx           # Démo 1-clic jury
│   │   ├── /components
│   │   │   ├── LeafletMap.tsx
│   │   │   ├── PolygonDrawer.tsx
│   │   │   ├── ParcelCard.tsx
│   │   │   ├── AnomalyBadge.tsx
│   │   │   ├── VoiceChatbot.tsx       # LE COMPOSANT CLÉ
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── CameraCapture.tsx
│   │   │   └── GeoJsonExporter.tsx
│   │   ├── /services
│   │   │   └── api.ts                 # Tous les appels backend
│   │   ├── /hooks
│   │   │   ├── useAudioRecorder.ts
│   │   │   └── useCamera.ts
│   │   └── /data
│   │       └── demo-parcelles.json    # Données démo pré-chargées
│   ├── manifest.json                  # PWA manifest
│   └── vite.config.ts
│
├── /backend                           # FastAPI
│   ├── main.py
│   ├── /routers
│   │   ├── analyze.py
│   │   ├── chat.py
│   │   ├── anomaly.py
│   │   └── export.py
│   ├── /services
│   │   ├── whisper_service.py         # ASR darija
│   │   ├── tts_service.py             # gTTS arabe
│   │   ├── rag_service.py             # RAG stub — placeholder collègues
│   │   └── /placeholders
│   │       ├── classification_stub.py  # STUB — collègues remplissent
│   │       ├── segmentation_stub.py    # STUB — collègues remplissent
│   │       ├── anomaly_stub.py         # STUB — collègues remplissent
│   │       └── README_STUBS.md        # Instructions pour les collègues
│   ├── /models
│   │   └── schemas.py
│   └── requirements.txt
│
└── README.md
```

---

## INSTRUCTIONS DE DÉVELOPPEMENT DÉTAILLÉES

### 1. BACKEND — main.py et structure FastAPI

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, chat, anomaly, export

app = FastAPI(title="EZZAYRA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod : URL Vercel spécifique
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/analyze")
app.include_router(chat.router, prefix="/api/chat")
app.include_router(anomaly.router, prefix="/api/anomaly")
app.include_router(export.router, prefix="/api/export")

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
```

### 2. ENDPOINTS REST À IMPLÉMENTER

#### POST /api/analyze/polygon

- Input : `{ "geojson": {...}, "zone_name": "string" }`
- Appelle `segmentation_stub.py` (placeholder collègues)
- Retourne :

```json
{
  "job_id": "uuid",
  "status": "completed",
  "parcelles": [
    {
      "id": "uuid",
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "classification": "extensif | intensif | hyper-intensif",
      "ndvi_score": 0.72,
      "anomaly_status": "normal | warning | critical",
      "confidence": 0.89
    }
  ]
}
```

#### POST /api/chat/voice

- Input : `multipart/form-data` avec `audio: File` (WAV/WebM) + optionnel `image: File`
- Pipeline :
  1. Whisper transcrit l'audio darija → texte
  2. Si image fournie → appelle `classification_stub.py` (placeholder)
  3. RAG sur corpus PDF (placeholder) → réponse texte
  4. Score de pertinence calculé (cosine similarity)
  5. Si score < 0.35 → message de refus pré-défini en darija
  6. gTTS convertit réponse → MP3
- Retourne :

```json
{
  "transcription": "...",
  "response_text": "...",
  "response_audio_url": "/api/chat/audio/uuid.mp3",
  "relevance_score": 0.82,
  "refused": false,
  "result_image_url": null
}
```

#### GET /api/anomaly/{parcel_id}

- Appelle `anomaly_stub.py` (placeholder)
- Retourne score NDVI + statut + historique 12 mois

#### GET /api/export/geojson/{job_id}

- Retourne GeoJSON complet annoté téléchargeable
- Header : `Content-Disposition: attachment; filename="ezzayra_{job_id}.geojson"`

### 3. WHISPER SERVICE — whisper_service.py

```python
# Implémenter exactement ce service :
import whisper
import tempfile, os
from pathlib import Path

class WhisperService:
    def __init__(self):
        # Charger modèle "small" au démarrage (244M params, tourne sur CPU)
        self.model = whisper.load_model("small")

    def transcribe(self, audio_bytes: bytes, ext: str = "wav") -> dict:
        # Sauvegarder en temp, transcrire, retourner résultat
        # Langue : "ar" pour arabe (inclut darija tunisien)
        # fp16=False pour CPU
        pass

    def get_language_hint(self) -> str:
        return "ar"  # Arabe — couvre le dialecte tunisien

# Singleton
whisper_service = WhisperService()
```

### 4. TTS SERVICE — tts_service.py

```python
# gTTS — Google Text To Speech, GRATUIT sans CC
from gtts import gTTS
import io, uuid, os

class TTSService:
    def __init__(self):
        self.audio_dir = Path("static/audio")
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def synthesize(self, text: str, lang: str = "ar") -> str:
        # Générer MP3, sauvegarder, retourner URL relative
        # Langue "ar" pour arabe/darija
        # Nettoyer les fichiers > 1h pour ne pas saturer le stockage
        pass

tts_service = TTSService()
```

### 5. PLACEHOLDERS POUR COLLÈGUES — /backend/services/placeholders/

Chaque stub doit avoir exactement cette structure :

```python
# classification_stub.py
"""
==========================================================
PLACEHOLDER — Classification oliveraies (Sentinel-2 + CNN)
==========================================================
Ce fichier est un STUB. Ton collègue doit :
1. Remplacer la fonction `classify_parcel` avec son modèle réel
2. Respecter exactement la signature et le format de retour
3. Ne pas modifier les imports ni la structure
==========================================================
"""

from typing import Dict, Any
import numpy as np

def classify_parcel(geojson_geometry: dict, ndvi_array: np.ndarray = None) -> Dict[str, Any]:
    """
    Classifie une parcelle d'oliveraie.

    Args:
        geojson_geometry: Géométrie GeoJSON de la parcelle
        ndvi_array: Array numpy NDVI (optionnel, fourni par segmentation_stub)

    Returns:
        {
            "classification": "extensif" | "intensif" | "hyper-intensif",
            "confidence": float (0.0 - 1.0),
            "features": {
                "canopy_density": float,
                "tree_count_estimate": int,
                "avg_ndvi": float
            }
        }

    STUB ACTUEL : Retourne des données simulées réalistes pour la démo.
    Remplacer par le vrai modèle CNN entraîné sur Sentinel-2.
    """
    # --- STUB DEMO : données simulées ---
    import random
    classifications = ["extensif", "intensif", "hyper-intensif"]
    chosen = random.choice(classifications)
    return {
        "classification": chosen,
        "confidence": round(random.uniform(0.75, 0.95), 2),
        "features": {
            "canopy_density": round(random.uniform(0.3, 0.8), 2),
            "tree_count_estimate": random.randint(50, 500),
            "avg_ndvi": round(random.uniform(0.4, 0.75), 2)
        }
    }
    # --- FIN STUB --- Remplacer tout ce qui est au-dessus par le vrai modèle
```

```python
# segmentation_stub.py
"""
PLACEHOLDER — Segmentation oliveraies depuis Sentinel-2
Même structure. La fonction principale :
def segment_zone(geojson_polygon: dict) -> Dict[str, Any]
Retourne : { "parcelles": [liste de géométries GeoJSON], "ndvi_arrays": [...] }
"""

# anomaly_stub.py
"""
PLACEHOLDER — Détection anomalie NDVI
def detect_anomaly(parcel_id: str, ndvi_series: list) -> Dict[str, Any]
Retourne : { "status": "normal|warning|critical", "score": float, "history": [...] }
"""

# rag_stub.py
"""
PLACEHOLDER — RAG sur corpus PDF (FAO, EPPO, CIHEAM)
def query_corpus(question: str, image_analysis: dict = None) -> Dict[str, Any]
Retourne : { "answer": str, "sources": [...], "relevance_score": float }
"""
```

### 6. README_STUBS.md pour les collègues

Créer `/backend/services/placeholders/README_STUBS.md` avec :

- Comment brancher leur modèle
- La signature exacte de chaque fonction à respecter
- Comment tester que ça marche avec le backend
- Les types attendus (avec exemples)

---

### 7. FRONTEND — Composant VoiceChatbot.tsx (LE PLUS IMPORTANT)

Ce composant est la pièce maîtresse. Il doit :

```typescript
// VoiceChatbot.tsx — Interface agriculteur
// États possibles : idle | recording | processing | responding | refused

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "refused";
  transcription?: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string; // image résultat analyse
  timestamp: Date;
}

// Le composant doit :
// 1. Afficher un grand bouton micro (appuyer et maintenir pour parler)
// 2. Afficher un bouton caméra (capture photo)
// 3. Montrer un indicateur visuel pendant l'enregistrement (waveform animée CSS)
// 4. Envoyer audio + image optionnelle au backend POST /api/chat/voice
// 5. Jouer automatiquement l'audio de réponse
// 6. Afficher l'image résultat si fournie par le backend
// 7. En cas de refus (relevance_score < 0.35), afficher message spécial
//    "Aasif, ma 3andich maâlouma kefaya f'had el mawdouâ" + audio
// 8. Garder un historique de la conversation dans un scroll
// 9. Fonctionner 100% dans le navigateur mobile (PWA)
```

**Design du bouton micro** : Grand cercle vert olive (couleur #4a7c59), pulse animation pendant l'enregistrement, texte "اضغط وتكلم" (appuie et parle) en dessous en arabe.

### 8. CARTE LEAFLET — LeafletMap.tsx + PolygonDrawer.tsx

```typescript
// LeafletMap.tsx
// - Tiles : OpenStreetMap (gratuit)
// - Centré sur la Tunisie : lat: 33.8869, lng: 9.5375, zoom: 7
// - Affiche les parcelles analysées colorées selon statut anomalie :
//   vert (#22c55e) = normal, orange (#f97316) = warning, rouge (#ef4444) = critical
// - Popup au clic sur parcelle : classification + NDVI + bouton "Voir détails"
// - PolygonDrawer : leaflet-draw pour dessiner une zone
// - Bouton "Analyser zone" visible dès qu'un polygone est tracé
// - Bouton "Exporter GeoJSON" toujours visible (exporte les parcelles affichées)
```

### 9. PAGE DÉMO — DemoPage.tsx (CRITIQUE POUR LE JURY)

```typescript
// DemoPage.tsx
// Un bouton unique "Lancer la démo complète" qui :
// 1. Charge les données pré-configurées de /data/demo-parcelles.json
// 2. Affiche la carte avec les parcelles de la région de Sfax
// 3. Lance automatiquement une simulation d'analyse (avec loading)
// 4. Colore les parcelles selon les résultats
// 5. Joue automatiquement un audio de démonstration en darija
// 6. Affiche un bouton "Exporter GeoJSON" pré-rempli
// Total : 45 secondes de bout en bout, aucune action du jury requise
```

### 10. DONNÉES DÉMO — demo-parcelles.json

Créer un fichier JSON avec 8 parcelles fictives réalistes dans la région de Sfax (lat ~34.7, lng ~10.7) avec :

- Géométries GeoJSON valides (polygones de 0.5 à 3 hectares)
- Classifications variées (2 extensif, 4 intensif, 2 hyper-intensif)
- Statuts anomalie variés (4 normal, 2 warning, 2 critical)
- Scores NDVI réalistes (0.35 à 0.78)
- Historique NDVI 12 mois simulé

---

### 11. PWA MANIFEST — manifest.json

```json
{
  "name": "EZZAYRA — Analyse intelligente",
  "short_name": "EZZAYRA",
  "description": "Plateforme d'analyse des oliveraies tunisiennes par satellite et IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f0f4e8",
  "theme_color": "#4a7c59",
  "icons": [...]
}
```

### 12. API SERVICE — /frontend/src/services/api.ts

```typescript
// Centraliser tous les appels API ici
// Base URL depuis variable d'environnement : VITE_API_URL
// Toutes les fonctions doivent avoir des types TypeScript stricts
// Gestion d'erreurs explicite
// Timeout de 30s pour les appels avec modèles IA

export const api = {
  analyzePolygon: (geojson: GeoJSON) => Promise<AnalysisResult>,
  sendVoiceMessage: (audio: Blob, image?: File) => Promise<ChatResponse>,
  getAnomaly: (parcelId: string) => Promise<AnomalyResult>,
  exportGeoJSON: (jobId: string) => Promise<Blob>,
  getDemoParcelles: () => Promise<Parcelle[]>,
};
```

---

## DESIGN & UX

### Palette de couleurs (thème oliveraies Tunisie)

```css
:root {
  --olive-dark: #2d4a1e;
  --olive-mid: #4a7c59;
  --olive-light: #8fb87e;
  --soil-warm: #c4956a;
  --sky-tunisia: #87ceeb;
  --sand: #f5e6c8;
  --bg: #f8f5ef;
}
```

### Navigation

- Sidebar gauche fixe sur desktop, bottom nav sur mobile
- Icônes : Lucide React (gratuit)
- Responsive complet — le jury peut tout tester depuis son téléphone

### Langue

- Interface en **français** (pour le jury)
- Textes dans le chatbot en **arabe** (pour l'agriculteur)
- Les réponses audio sont en **darija tunisien**

---

## VARIABLES D'ENVIRONNEMENT

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_DEMO_MODE=true
```

### Backend (.env)

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
WHISPER_MODEL=small
TTS_LANG=ar
RELEVANCE_THRESHOLD=0.35
CORS_ORIGINS=http://localhost:5173,https://ezzayra.vercel.app
```

---

## REQUIREMENTS.TXT BACKEND

```
fastapi==0.111.0
uvicorn==0.30.0
python-multipart==0.0.9
openai-whisper==20231117
gTTS==2.5.1
langchain==0.2.0
langchain-community==0.2.0
chromadb==0.5.0
supabase==2.4.0
pydantic==2.7.0
numpy==1.26.4
python-dotenv==1.0.1
httpx==0.27.0
```

---

## PACKAGE.JSON FRONTEND (dépendances clés)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "leaflet-draw": "^1.0.4",
    "@react-leaflet/core": "^2.1.0",
    "axios": "^1.7.0",
    "recharts": "^2.12.0",
    "file-saver": "^2.0.5",
    "lucide-react": "^0.383.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0"
  }
}
```

---

## CE QUE TU NE DOIS PAS FAIRE (laisse aux collègues)

- Ne pas implémenter le vrai modèle CNN de classification Sentinel-2
- Ne pas entraîner ou charger un modèle de détection de maladies de feuille
- Ne pas implémenter la vraie logique NDVI avec les vraies données satellitaires Copernicus
- Ne pas implémenter le vrai RAG sur les PDFs FAO/EPPO/CIHEAM
- Ne pas configurer Whisper pour fine-tuning darija (le modèle `small` de base suffit)

**À la place** : laisser des stubs clairs, documentés, avec des données simulées réalistes pour que la démo jury soit convaincante même sans les vrais modèles.

---

## ORDRE DE DÉVELOPPEMENT (priorité démo jury)

1. Structure projet + variables env
2. Backend FastAPI skeleton + health endpoint
3. Stubs placeholders avec données simulées
4. Whisper service (transcrire audio)
5. TTS service (gTTS arabe)
6. Endpoints REST complets (avec stubs)
7. Frontend : carte Leaflet + polygone + affichage parcelles
8. Frontend : composant VoiceChatbot complet
9. Données démo pré-chargées (demo-parcelles.json)
10. Page démo 1-clic (DemoPage.tsx)
11. PWA manifest + responsive mobile
12. Export GeoJSON fonctionnel
13. README déploiement Vercel + Render

---

## LIVRABLES ATTENDUS

À la fin tu dois fournir :

- [ ] Projet complet fonctionnel (`npm run dev` + `uvicorn main:app`)
- [ ] Demo mode opérationnel depuis `http://localhost:5173`
- [ ] Chatbot vocal fonctionnel (enregistrement → transcription Whisper → réponse TTS)
- [ ] Carte Leaflet avec parcelles colorées + dessin polygone + export GeoJSON
- [ ] Stubs documentés prêts pour les collègues
- [ ] README.md avec instructions de setup en 5 commandes
- [ ] Instructions déploiement Vercel + Render
