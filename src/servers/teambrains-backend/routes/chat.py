from flask import Blueprint, request, jsonify
from models import db, Project, Message
from flask_jwt_extended import jwt_required, get_jwt_identity


chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

@chat_bp.route('/<int:project_id>/send', methods=['POST'])
@jwt_required()
def create_message(project_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or not 'content' in data:
        return jsonify({"error": "Le contenu de la message est requis"}), 400
    
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    message = Message(
        content=data['content'],
        project_id=project_id,
        sender_id=current_user_id
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        "message": message.to_dict()
    }), 201

@chat_bp.route('/<int:project_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(project_id):
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    messages = Message.query.filter_by(project_id=project_id).order_by(Message.timestamp.asc()).all()
    
    return jsonify({
        "messages": [message.to_dict() for message in messages]
    }), 200
    
    
    
    

    
    
    