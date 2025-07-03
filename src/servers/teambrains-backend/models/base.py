# models/base.py
from flask_sqlalchemy import SQLAlchemy
from uuid import uuid4

# Instance SQLAlchemy partagée
db = SQLAlchemy()

def get_uuid():
    """Générateur d'UUID pour les clés primaires"""
    return uuid4().hex 