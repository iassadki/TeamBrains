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
    is_public = db.Column(db.Boolean, nullable=False, default=False)  
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'project_slug': self.project_slug,
            'creation_date': self.creation_date.isoformat(),
            'status': self.status,
            'description': self.description,
            'creator_id': self.creator_id,
            'progress': self.progress,
            'is_public': self.is_public
        }


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
            'file_name': self.file_name,
            'assigned_students': [ts.to_dict() for ts in self.task_students] if hasattr(self, 'task_students') else [],
            'subtasks_count': len(self.subtasks) if hasattr(self, 'subtasks') else 0
        }
    
    def get_assigned_students(self):
        """Méthode helper pour récupérer les étudiants assignés"""
        return [ts.student for ts in self.task_students]

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
    is_visible = db.Column(db.Boolean, nullable=False, default=True)  # Visible par défaut dans le CV
    
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
            'description': self.description,
            'is_visible': self.is_visible
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
    
    # Nouveaux champs pour la gestion des échecs de paiement  
    payment_failed_count = db.Column(db.Integer, nullable=True, default=0)
    last_payment_failed_at = db.Column(db.DateTime, nullable=True)
    last_payment_retry_at = db.Column(db.DateTime, nullable=True)
    payment_method_action_required = db.Column(db.Boolean, nullable=True, default=False)
    unpaid_invoice_id = db.Column(db.String(255), nullable=True)  # ID de la facture impayée
    
    # Nouveaux champs pour la facturation hybride écoles
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=True)  # École associée
    base_plan_amount = db.Column(db.Integer, nullable=True, default=12000)  # Montant de base en centimes (120€)
    student_price_per_month = db.Column(db.Integer, nullable=True, default=200)  # Prix par étudiant/mois (2€)
    current_student_count = db.Column(db.Integer, nullable=True, default=0)  # Nombre d'étudiants actuel
    last_student_count_update = db.Column(db.DateTime, nullable=True)  # Dernière mise à jour du compteur
    total_monthly_amount = db.Column(db.Integer, nullable=True)  # Montant total calculé en centimes
    
    # Relations
    user = db.relationship('User', backref=db.backref('subscription', uselist=False))
    school = db.relationship('School', backref=db.backref('subscription', uselist=False))
    
    def to_dict(self):
        # Calculer le montant total pour les écoles
        calculated_total = None
        if self.plan_type == 'school' and self.school_id:
            base_amount = self.base_plan_amount or 12000  # 120€ par défaut
            student_price = self.student_price_per_month or 200  # 2€ par défaut
            student_count = self.current_student_count or 0
            calculated_total = base_amount + (student_price * student_count)
        
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'stripe_customer_id': self.stripe_customer_id,
            'plan_type': self.plan_type,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat(),
            'current_period_end': self.current_period_end.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'payment_failed_count': self.payment_failed_count or 0,
            'last_payment_failed_at': self.last_payment_failed_at.isoformat() if self.last_payment_failed_at else None,
            'last_payment_retry_at': self.last_payment_retry_at.isoformat() if self.last_payment_retry_at else None,
            'payment_method_action_required': self.payment_method_action_required or False,
            'unpaid_invoice_id': self.unpaid_invoice_id,
            'has_payment_issues': (self.payment_failed_count or 0) > 0 or (self.payment_method_action_required or False)
        }
        
        # Ajouter les champs spécifiques aux écoles
        if self.plan_type == 'school':
            result.update({
                'school_id': self.school_id,
                'base_plan_amount': self.base_plan_amount or 12000,
                'base_plan_amount_euros': (self.base_plan_amount or 12000) / 100,
                'student_price_per_month': self.student_price_per_month or 200,
                'student_price_per_month_euros': (self.student_price_per_month or 200) / 100,
                'current_student_count': self.current_student_count or 0,
                'last_student_count_update': self.last_student_count_update.isoformat() if self.last_student_count_update else None,
                'total_monthly_amount': calculated_total,
                'total_monthly_amount_euros': calculated_total / 100 if calculated_total else None,
                'total_yearly_amount': calculated_total * 12 if calculated_total else None,
                'total_yearly_amount_euros': (calculated_total * 12) / 100 if calculated_total else None
            })
        
        return result

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
    
class TaskStudent(db.Model):
    __tablename__ = 'task_students'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(100), nullable=True, default='développeur')
    assigned_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relations
    task = db.relationship('Task', backref=db.backref('task_students', lazy=True, cascade='all, delete-orphan'))
    student = db.relationship('User', backref=db.backref('student_tasks', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'student_id': self.student_id,
            'student_name': f"{self.student.prenom} {self.student.nom}" if self.student else "Inconnu",
            'student_email': self.student.email if self.student else None,
            'role': self.role,
            'assigned_date': self.assigned_date.isoformat()
        }

class SubTask(db.Model):
    __tablename__ = 'subtasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    percent_completion = db.Column(db.Integer, nullable=False, default=0)
    priority = db.Column(db.String(20), nullable=False, default='moyenne')
    status = db.Column(db.String(50), nullable=False, default='pending')
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    assigned_student_id = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=True)
    created_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relations
    task = db.relationship('Task', backref=db.backref('subtasks', lazy=True, cascade='all, delete-orphan'))
    assigned_student = db.relationship('User', backref=db.backref('assigned_subtasks', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'percent_completion': self.percent_completion,
            'priority': self.priority,
            'status': self.status,
            'task_id': self.task_id,
            'assigned_student_id': self.assigned_student_id,
            'assigned_student_name': f"{self.assigned_student.prenom} {self.assigned_student.nom}" if self.assigned_student else None,
            'created_date': self.created_date.isoformat()
        }
    
class SubTaskValidation(db.Model):
    __tablename__ = 'subtask_validations'
    
    id = db.Column(db.Integer, primary_key=True)
    subtask_id = db.Column(db.Integer, db.ForeignKey('subtasks.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    feedback = db.Column(db.Text, nullable=True)
    validator_id = db.Column(db.String(100), db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relations
    subtask = db.relationship('SubTask', backref=db.backref('validations', lazy=True, cascade='all, delete-orphan'))
    validator = db.relationship('User', backref=db.backref('subtask_validations', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'subtask_id': self.subtask_id,
            'status': self.status,
            'feedback': self.feedback,
            'validator_id': self.validator_id,
            'validator_name': f"{self.validator.prenom} {self.validator.nom}" if self.validator else "Inconnu",
            'timestamp': self.timestamp.isoformat()
        }

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