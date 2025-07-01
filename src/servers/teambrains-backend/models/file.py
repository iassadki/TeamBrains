# models/file.py
from .base import db
from datetime import datetime

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