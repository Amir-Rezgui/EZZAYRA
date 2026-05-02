# 🫒 Plateforme EZZAYRA - Guide d'Exécution pour le Jury

Bienvenue dans le guide de démarrage rapide de la plateforme **EZZAYRA**. Ce projet a été développé pour offrir une solution complète de suivi agricole (analyse NDVI via Google Earth Engine) et un assistant intelligent (Voice Chatbot & CNN) pour les agriculteurs.

Ce document vous explique comment lancer facilement toutes les composantes du projet pour votre démonstration.

---

## 📂 Architecture du Projet

Le projet est divisé en **3 composants principaux** :

1. **`ezzayra-platform/frontend/`** : L'interface utilisateur principale (React / Vite / Tailwind).
2. **`Sujet3Back/`** : Le backend d'analyse de données satellitaires (FastAPI + Google Earth Engine + Modèle ML).
3. **`voice-agent/`** : Le backend de l'assistant IA (Reconnaissance vocale Whisper, Chatbot RAG, et diagnostic de maladies des plantes CNN).

---

## 🚀 Étape 1 : Lancer le Backend d'Analyse Spatiale (Sujet3Back)

Ce serveur récupère les données satellitaires NDVI depuis Google Earth Engine et calcule les scores d'anomalie.

1. Ouvrez un terminal.
2. Naviguez vers le dossier backend principal :
   ```bash
   cd Sujet3Back
   ```
3. *(Si nécessaire)* Activez votre environnement virtuel Python.
4. Lancez le serveur :
   ```bash
   python server.py
   ```
> **Note :** Le serveur démarrera sur `http://localhost:8000`. Assurez-vous d'avoir exécuté `ee.Authenticate()` au préalable si la session Google Earth Engine a expiré.

---

## 🎙️ Étape 2 : Lancer l'Assistant IA et Chatbot (voice-agent)

Ce module fait tourner 3 micro-services IA en parallèle : ASR (Speech-to-Text), RAG (Génération de réponses) et CNN (Classification d'images).

1. Ouvrez un nouveau terminal.
2. Naviguez vers le dossier de l'agent vocal :
   ```bash
   cd voice-agent
   ```
3. Lancez le script de démarrage automatisé (Windows) :
   ```cmd
   dev.bat
   ```
> **Note :** Ce script lancera les serveurs en arrière-plan sur les ports `8001` (ASR), `8002` (RAG) et `8003` (CNN).

---

## 💻 Étape 3 : Lancer l'Interface Utilisateur Frontend

Une fois les backends démarrés, vous pouvez lancer l'interface web.

1. Ouvrez un nouveau terminal.
2. Naviguez vers le frontend React :
   ```bash
   cd ezzayra-platform/frontend
   ```
3. *(Si c'est la première fois)* Installez les dépendances :
   ```bash
   npm install
   ```
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
5. Ouvrez votre navigateur à l'adresse indiquée (généralement `http://localhost:5173`).

---

## 🎯 Scénario de Démonstration (À montrer au Jury)

Pour une présentation fluide, voici le parcours idéal :

1. **Onglet "Anomalies" (Page d'accueil par défaut)**
   - Montrez la carte interactive avec les zones délimitées.
   - Montrez la détection en temps réel des alertes (Normal, Attention, Critique).
   - Cliquez sur une parcelle (ou utilisez la liste latérale) pour afficher les détails, les courbes d'évolution NDVI et la température de surface (LST).
   - *Prouvez l'interactivité en utilisant les filtres par Gouvernorat ou par Système (Intensif/Extensif).*

2. **Onglet "Analyses" (Statistiques Globales)**
   - Montrez le tableau de bord récapitulatif généré dynamiquement.
   - Mettez en avant le score NDVI moyen global et la liste de toutes les parcelles, avec la barre de recherche fonctionnelle.

3. **Onglet "Chatbot" (مساعد الزيتون)**
   - Démonstration de l'intégration pure du Chatbot dans l'interface globale.
   - Simulez l'importation ou la capture d'une photo d'une feuille d'olivier malade (le modèle CNN identifiera la maladie).
   - Maintenez le bouton de microphone enfoncé pour poser une question vocale en darija.
   - Observez la transcription (ASR) puis écoutez la réponse vocale (TTS) fournie par le système RAG.

---

### 💡 Dépannage Rapide en pleine démo
- **Erreur CORS** : Vérifiez que les scripts Python tournent bien sur les bons ports (`8000`, `8001`, `8002`, `8003`).
- **Absence de micro/caméra** : Assurez-vous d'accorder les permissions au navigateur lorsque la page Chatbot est ouverte.
- **GEE Authentication Failed** : Tuez le processus `server.py`, lancez la commande `python -c "import ee; ee.Authenticate()"` dans `Sujet3Back` et suivez les instructions du navigateur, puis relancez `server.py`.

Bon courage pour votre présentation ! 🎉
