# models/project.py
from .base import db
from datetime import datetime

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


# Table d'association pour les membres de projet
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