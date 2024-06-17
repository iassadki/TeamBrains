from flask import Blueprint, request, jsonify
from models import db, User, Project 
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from dateutil import parser
from dateutil.tz import UTC
from slugify import slugify



projects = Blueprint('projects', __name__)


@projects.route('/create_projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    project_name = data.get('name')
    end_date = data.get('endDate')

    project_slug = slugify(project_name)

    existing_project = Project.query.filter_by(name=project_name).first()
    if existing_project:
        return jsonify({"error": "Un projet avec ce nom existe déjà"}), 400

    if end_date:
        try:
            end_date = parser.isoparse(end_date)
            # Assurez-vous que l'objet datetime est naïf en utilisant la fonction replace pour supprimer les informations de fuseau horaire
            if end_date.tzinfo is not None:
                end_date = end_date.astimezone(UTC).replace(tzinfo=None)

            if end_date <= datetime.utcnow():
                return jsonify({"error": "La date de fin de projet doit être future à la date d'aujourd'hui."}), 400
        except ValueError:
            return jsonify({"error": "Format de date invalide."}), 400

    new_project = Project(
        name=project_name,
        status=data['status'],
        description=data['description'],
        creator_id=user_id,
        # end_date=end_date,
        project_slug=project_slug
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify({"message": "Projet créé avec succès", "project_id": new_project.id}), 201





@projects.route('/list_projects', methods=['GET'])
def list_projects():
    # Récupérez tous les projets de la base de données
    all_projects = Project.query.all()
    
    # Convertissez chaque projet en dictionnaire pour faciliter la sérialisation en JSON
    projects_list = []
    for project in all_projects:
        # Liste des membres et leurs rôles dans le projet
        members = []
        for team_role in project.team_roles:
            member_info = {
                'user_id': team_role.user_id,
                'name': f"{team_role.user.prenom} {team_role.user.nom}",
                'role': team_role.role
            }
            members.append(member_info)
        
        # Créez le dictionnaire de projet avec les membres inclus
        project_dict = {
            'id': project.id,
            'name': project.name,
            'project_slug': project.project_slug,
            'status': project.status,
            'description': project.description,
            'creation_date': project.creation_date.isoformat(),  # Convertit datetime en string
            'creator_id': project.creator_id,
            'members': members  # Ajoutez les membres ici
        }
        projects_list.append(project_dict)
    
    return jsonify(projects_list), 200


@projects.route('/get_project/<slug>', methods=['GET'])
def get_project(slug):
    project = Project.query.filter_by(project_slug=slug).first()
    if not project:
        return jsonify({"error": "Projet non trouvé"}), 404

    # Récupérer les membres et leurs rôles associés à ce projet
    members = []
    for team_role in project.team_roles:
        user = User.query.get(team_role.user_id)
        if user:
            members.append({
                "user_id": user.id,
                "name": f"{user.prenom} {user.nom}",
                "role": team_role.role
            })

    project_data = {
        'id': project.id,
        'name': project.name,
        'project_slug': project.project_slug,
        'status': project.status,
        'description': project.description,
        'creation_date': project.creation_date.isoformat(),
        'creator_id': project.creator_id,
        'members': members  # Ajout des membres du projet
    }

    return jsonify(project_data), 200


@projects.route('/delete_project/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Projet supprimé avec succès"}), 200
