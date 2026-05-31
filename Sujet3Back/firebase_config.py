import firebase_admin
from firebase_admin import credentials, firestore

import os
from dotenv import load_dotenv

load_dotenv()

# Récupération du nom du fichier depuis le .env
cred_path = os.getenv("FIREBASE_CREDENTIALS", "hack-9a814-firebase-adminsdk-fbsvc-497c2419dd.json")
cred = credentials.Certificate(cred_path)

# Prevent initializing twice
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()