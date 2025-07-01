# models/school.py
from .base import db
from datetime import datetime
import secrets
import random
import string

class School(db.Model):
    __tablename__ = 'schools'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Relations
    students = db.relationship('User', backref=db.backref('school', lazy=True))
    tokens = db.relationship('SchoolToken', backref=db.backref('school', lazy=True), cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contact_email': self.contact_email,
            'website': self.website,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'student_count': len(self.students)
        }


class SchoolToken(db.Model):
    __tablename__ = 'school_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)  # Nom descriptif du token
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # Optionnel: date d'expiration
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_by = db.Column(db.String(100), nullable=True)  # Qui a créé le token
    
    def __init__(self, **kwargs):
        super(SchoolToken, self).__init__(**kwargs)
        if not self.token:
            self.token = secrets.token_urlsafe(32)
    
    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'token': self.token,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'created_by': self.created_by
        }


class SchoolRegistrationToken(db.Model):
    """Tokens pour l'inscription des étudiants via l'espace partenariat écoles"""
    __tablename__ = 'school_registration_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)  # Nom descriptif du token (ex: "Promotion 2024")
    description = db.Column(db.Text, nullable=True)  # Description optionnelle
    max_uses = db.Column(db.Integer, nullable=True)  # Nombre maximum d'utilisations (optionnel)
    current_uses = db.Column(db.Integer, nullable=False, default=0)  # Utilisations actuelles
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # Date d'expiration optionnelle
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_by = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=True)  # Admin qui a créé le token
    
    # Relations
    school = db.relationship('School', backref=db.backref('registration_tokens', lazy=True))
    creator = db.relationship('User', backref=db.backref('created_registration_tokens', lazy=True))
    
    def __init__(self, **kwargs):
        super(SchoolRegistrationToken, self).__init__(**kwargs)
        if not self.token:
            # Générer un code plus court et lisible pour les étudiants (ex: ABC123)
            self.token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    def can_be_used(self):
        """Vérifier si le token peut encore être utilisé"""
        if not self.is_active:
            return False
        
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
            
        if self.max_uses and self.current_uses >= self.max_uses:
            return False
            
        return True
    
    def use_token(self):
        """Incrémenter le compteur d'utilisation"""
        self.current_uses += 1
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'school_name': self.school.name if self.school else None,
            'token': self.token,
            'name': self.name,
            'description': self.description,
            'max_uses': self.max_uses,
            'current_uses': self.current_uses,
            'remaining_uses': (self.max_uses - self.current_uses) if self.max_uses else None,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'can_be_used': self.can_be_used(),
            'created_by': self.created_by,
            'creator_name': f"{self.creator.prenom} {self.creator.nom}" if self.creator else None
        } 