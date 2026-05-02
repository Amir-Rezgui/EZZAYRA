import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("hack-9a814-firebase-adminsdk-fbsvc-df38c2cd41.json")

# Prevent initializing twice
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()