from flask import Blueprint, request, jsonify
from models import db, User, Project 
from flask_jwt_extended import jwt_required, get_jwt_identity

projects = Blueprint('projects', __name__)

@projects.route('/create_projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()  # Obtenez l'ID de l'utilisateur connecté
    data = request.get_json()
    new_project = Project(
        name=data['name'],
        status=data['status'],
        description=data['description'],
        creator_id=user_id
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify({"message": "Projet créé avec succès", "project_id": new_project.id}), 201


@projects.route('/list_projects', methods=['GET'])
def list_projects():
    # Récupérez tous les projets de la base de données
    all_projects = Project.query.all()
    
    # Convertissez chaque projet en dictionnaire pour faciliter la sérialisation en JSON
    projects_list = [{
        'id': project.id,
        'name': project.name,
        'status': project.status,
        'description': project.description,
        'creation_date': project.creation_date.isoformat(),  # Convertit datetime en string
        'creator_id': project.creator_id
    } for project in all_projects]
    
    return jsonify(projects_list), 200