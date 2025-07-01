# models/user.py
from .base import db, get_uuid
from datetime import datetime

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

class Skill(db.Model):
    __tablename__ = 'skills'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    category = db.Column(db.String(50), nullable=True)  # ex: 'frontend', 'backend', 'database', 'devops'
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

class UserSkill(db.Model):
    __tablename__ = 'user_skills'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False)
    level = db.Column(db.String(20), nullable=False, default='débutant')  
    experience_years = db.Column(db.Integer, nullable=True)  
    self_assessment = db.Column(db.Integer, nullable=True)  
    acquired_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)  
    
    # Relations
    user = db.relationship('User', backref=db.backref('user_skills', lazy=True, cascade='all, delete-orphan'))
    skill = db.relationship('Skill', backref=db.backref('skill_users', lazy=True))
    
    # Contrainte d'unicité pour éviter les doublons
    __table_args__ = (db.UniqueConstraint('user_id', 'skill_id', name='unique_user_skill'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else "Inconnu",
            'skill_category': self.skill.category if self.skill else None,
            'level': self.level,
            'experience_years': self.experience_years,
            'self_assessment': self.self_assessment,
            'acquired_date': self.acquired_date.isoformat(),
            'last_updated': self.last_updated.isoformat(),
            'notes': self.notes
        }

class CVVisibility(db.Model):
    __tablename__ = 'cv_visibility'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    is_public = db.Column(db.Boolean, nullable=False, default=False)  
    show_personal_info = db.Column(db.Boolean, nullable=False, default=True)  
    show_contact_info = db.Column(db.Boolean, nullable=False, default=True)  
    show_skills = db.Column(db.Boolean, nullable=False, default=True)  
    show_projects = db.Column(db.Boolean, nullable=False, default=True)  
    last_updated = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('cv_visibility', uselist=False, cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'is_public': self.is_public,
            'show_personal_info': self.show_personal_info,
            'show_contact_info': self.show_contact_info,
            'show_skills': self.show_skills,
            'show_projects': self.show_projects,
            'last_updated': self.last_updated.isoformat()
        }