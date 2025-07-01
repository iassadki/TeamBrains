# SAUVEGARDE DE L'ANCIEN FICHIER MODELS.PY
# Date de sauvegarde: $(date)
# Ce fichier contient la version originale avant la refactorisation modulaire

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from uuid import uuid4
import secrets
import random
import string

db = SQLAlchemy()

def get_uuid():
    return uuid4().hex

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(100), primary_key=True, unique=True, default=get_uuid)
    role = db.Column(db.String(50), nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    typeDeveloppeur = db.Column(db.String(100), nullable=True)

    # Pour les technologies, puisqu'il s'agit d'une liste, nous devons gérer cela différemment.
    # Une approche consiste à stocker les technologies comme une chaîne de texte séparée par des virgules.

    technologies = db.Column(db.String(255), nullable=True)
    
    # Nouveaux champs pour le profil
    etudes = db.Column(db.Text, nullable=True)
    ambitions = db.Column(db.Text, nullable=True)
    linkedin_url = db.Column(db.String(255), nullable=True)
    portfolio_url = db.Column(db.String(255), nullable=True)
    github_url = db.Column(db.String(255), nullable=True)
    
    # Champ pour l'école de l'étudiant
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=True)

# ... (reste du contenu de l'ancien models.py)
# Note: Contenu complet disponible dans models_backup.py si nécessaire 