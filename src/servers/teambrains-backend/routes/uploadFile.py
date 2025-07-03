from flask import Blueprint, request, jsonify, current_app, send_from_directory, url_for
from models import db, Project, FileDocument
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
import datetime
import mimetypes

upload_bp = Blueprint('upload', __name__, url_prefix='/upload')

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_secure_filename(filename):
    secure_name = secure_filename(filename)
    unique_id = str(uuid.uuid4())
    ext = secure_name.rsplit('.', 1)[1].lower() if '.' in secure_name else ''
    return f"{unique_id}.{ext}" if ext else unique_id

def get_upload_path():
    return current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))

def save_file_record(filename, original_filename, file_path, file_size, file_type, user_id, project_id=None):
    expiration_date = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    
    new_file = FileDocument(
        filename=filename,
        original_filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        upload_date=datetime.datetime.utcnow(),
        uploader_id=user_id,
        project_id=project_id,
        expiration_date=expiration_date
    )
    
    db.session.add(new_file)
    db.session.commit()
    
    return new_file

@upload_bp.route('/file', methods=['POST'])
@jwt_required()
def upload_file():
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier n'a été fourni"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "Aucun fichier sélectionné"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Type de fichier non autorisé"}), 400
    
    project_id = request.form.get('project_id')
    
    if project_id:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    secure_name = generate_secure_filename(file.filename)
    
    upload_folder = get_upload_path()
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, secure_name)
    
    file.save(file_path)
    
    file_type = mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
    
    file_record = save_file_record(
        filename=secure_name,
        original_filename=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        file_type=file_type,
        user_id=current_user_id,
        project_id=project_id
    )
    
    download_url = url_for('upload.download_file', file_id=file_record.id, _external=True)
    
    return jsonify({
        "message": "Fichier téléchargé avec succès",
        "file": {
            "id": file_record.id,
            "filename": file_record.original_filename,
            "size": file_record.file_size,
            "type": file_record.file_type,
            "upload_date": file_record.upload_date.isoformat(),
            "download_url": download_url,
            "expiration_date": file_record.expiration_date.isoformat()
        }
    }), 201

@upload_bp.route('/<int:project_id>/files', methods=['GET'])
@jwt_required()
def get_project_files(project_id):
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    files = FileDocument.query.filter_by(project_id=project_id).all()
    
    return jsonify({
        "files": [{
            "id": file.id,
            "filename": file.original_filename,
            "size": file.size,
            "type": file.file_type,
            "upload_date": file.upload_date.isoformat(),
            "uploader_id": file.uploader_id,
            "download_url": url_for('upload.download_file', file_id=file.id, _external=True),
            "expiration_date": file.expiration_date.isoformat() if file.expiration_date else None
        } for file in files]
    }), 200

@upload_bp.route('/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(file_id):
    file = FileDocument.query.get(file_id)
    
    if not file:
        return jsonify({"error": "Le fichier spécifié n'existe pas"}), 404
    
    if file.expiration_date and file.expiration_date < datetime.datetime.utcnow():
        return jsonify({"error": "Le lien de téléchargement a expiré"}), 403
    
    if not os.path.exists(file.file_path):
        return jsonify({"error": "Le fichier n'existe plus sur le serveur"}), 404
    
    directory = os.path.dirname(file.file_path)
    filename = os.path.basename(file.file_path)
    
    return send_from_directory(
        directory, 
        filename, 
        as_attachment=True,
        download_name=file.original_filename
    )