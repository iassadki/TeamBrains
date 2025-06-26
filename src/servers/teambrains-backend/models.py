from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from uuid import uuid4
import secrets

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


class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    project_slug = db.Column(db.String(255), unique=True, nullable=False)
    creation_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    creator_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    members = db.relationship('User', secondary='project_members', backref=db.backref('projects', lazy='dynamic'))
    progress = db.Column(db.Integer, nullable=False, default=0, server_default='0')


project_members = db.Table('project_members',
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id'), primary_key=True),
    db.Column('user_id', db.String(100), db.ForeignKey('users.id'), primary_key=True),  
    db.Column('role', db.String(100), nullable=False) 
)

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    sender_id = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Nouveaux champs pour les pièces jointes
    file_url = db.Column(db.Text, nullable=True)
    file_name = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'project_id': self.project_id,
            'sender_id': self.sender_id,
            'timestamp': self.timestamp.isoformat(),
            'file_url': self.file_url,
            'file_name': self.file_name
        }
    

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
    percent_completion = db.Column(db.Integer, nullable=False, default=0)
    assignee_id = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    priority = db.Column(db.String(20), nullable=True, default='moyenne')  
    sprint = db.Column(db.String(100), nullable=True) 

    # Nouveaux champs pour les pièces jointes
    file_url = db.Column(db.Text, nullable=True)
    file_name = db.Column(db.String(255), nullable=True)

    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat(),
            'percent_completion': self.percent_completion,
            'assignee_id': self.assignee_id,
            'project_id': self.project_id,
            'priority': self.priority,
            'sprint': self.sprint,
            'file_url': self.file_url,
            'file_name': self.file_name
        }

class CVProject(db.Model):
    __tablename__ = 'cv_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    team_size = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    project = db.relationship('Project', backref=db.backref('cv_projects', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'project_name': self.project.name,
            'role': self.role,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'team_size': self.team_size,
            'description': self.description
        }
    
class FileDocument(db.Model):
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(255))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    expiration_date = db.Column(db.DateTime, nullable=True)
    
    uploader_id = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=False)  
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    
    # Relations
    uploader = db.relationship('User', backref=db.backref('uploaded_files', lazy=True))
    project = db.relationship('Project', backref=db.backref('files', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.original_filename,
            'size': self.file_size,
            'type': self.file_type,
            'upload_date': self.upload_date.isoformat(),
            'uploader_id': self.uploader_id,
            'project_id': self.project_id,
            'expiration_date': self.expiration_date.isoformat() if self.expiration_date else None
        }
    
class TaskValidation(db.Model):
    __tablename__ = 'task_validations'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(50), nullable=False) 
    comment = db.Column(db.Text, nullable=True)
    validator_id = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    task = db.relationship('Task', backref=db.backref('validations', lazy=True, cascade='all, delete-orphan'))
    validator = db.relationship('User', backref=db.backref('task_validations', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'status': self.status,
            'comment': self.comment,
            'validator_id': self.validator_id,
            'validator_name': f"{self.validator.prenom} {self.validator.nom}" if self.validator else "Inconnu",
            'timestamp': self.timestamp.isoformat()
        }

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

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    stripe_subscription_id = db.Column(db.String(255), nullable=False, unique=True)
    stripe_customer_id = db.Column(db.String(255), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)  # 'student' ou 'school'
    status = db.Column(db.String(50), nullable=False)  # 'active', 'canceled', 'past_due', etc.
    current_period_start = db.Column(db.DateTime, nullable=False)
    current_period_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('subscription', uselist=False))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'stripe_customer_id': self.stripe_customer_id,
            'plan_type': self.plan_type,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat(),
            'current_period_end': self.current_period_end.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=True)
    stripe_invoice_id = db.Column(db.String(255), nullable=False, unique=True)
    amount_paid = db.Column(db.Integer, nullable=False)  # en centimes
    currency = db.Column(db.String(3), nullable=False, default='eur')
    status = db.Column(db.String(50), nullable=False)  # 'paid', 'open', 'void', etc.
    invoice_pdf = db.Column(db.String(500), nullable=True)  # URL du PDF
    hosted_invoice_url = db.Column(db.String(500), nullable=True)  # URL Stripe
    invoice_date = db.Column(db.DateTime, nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('invoices', lazy=True))
    subscription = db.relationship('Subscription', backref=db.backref('invoices', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subscription_id': self.subscription_id,
            'stripe_invoice_id': self.stripe_invoice_id,
            'amount_paid': self.amount_paid,
            'amount_paid_euros': self.amount_paid / 100,  # conversion en euros
            'currency': self.currency,
            'status': self.status,
            'invoice_pdf': self.invoice_pdf,
            'hosted_invoice_url': self.hosted_invoice_url,
            'invoice_date': self.invoice_date.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat()
        }