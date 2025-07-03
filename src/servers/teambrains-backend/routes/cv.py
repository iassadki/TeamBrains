from flask import Blueprint, request, jsonify
from models import db, User, Project, CVProject, project_members, Task
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import table

cv_bp = Blueprint('cv', __name__, url_prefix='/cv')

@cv_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_cv_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    return jsonify({
        "etudes": user.etudes,
        "ambitions": user.ambitions,
        "linkedin_url": user.linkedin_url,
        "portfolio_url": user.portfolio_url,
        "github_url": user.github_url
    }), 200

@cv_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_cv_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    data = request.get_json()
    user.etudes = data.get('etudes', user.etudes)
    user.ambitions = data.get('ambitions', user.ambitions)
    user.linkedin_url = data.get('linkedin_url', user.linkedin_url)
    user.portfolio_url = data.get('portfolio_url', user.portfolio_url)
    user.github_url = data.get('github_url', user.github_url)

    try:
        db.session.commit()
        return jsonify({"message": "Profil CV mis à jour avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@cv_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_cv_projects():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    include_hidden = request.args.get('include_hidden', 'false').lower() == 'true'
    
    query = CVProject.query.filter_by(user_id=user_id)
    
    # if not include_hidden:
    #     query = query.filter_by(is_visible=True) Décommenter
    
    cv_projects = query.all()
    cv_projects_list = []
    
    for cv_project in cv_projects:
        project_dict = cv_project.to_dict()
        
        # Si l'utilisateur est l'entrepreneur/créateur du projet, montrer toutes les tâches
        project = Project.query.get(cv_project.project_id)
        if user and user.role == 'businessman' and project and project.creator_id == user_id:
            user_tasks = Task.query.filter_by(project_id=cv_project.project_id).all()
        else:
            # Sinon, ne montrer que les tâches assignées à l'utilisateur
            user_tasks = Task.query.filter_by(
                project_id=cv_project.project_id,
                assignee_id=user_id
            ).all()
        
        project_dict['tasks'] = [task.to_dict() for task in user_tasks]
        cv_projects_list.append(project_dict)
    
    if user and user.role == 'businessman':
        created_projects = Project.query.filter_by(creator_id=user_id).all()
        
        existing_project_ids = {cv_proj.project_id for cv_proj in cv_projects}
        
        for project in created_projects:
            if project.id not in existing_project_ids:
                team_size = db.session.query(project_members).filter_by(project_id=project.id).count()
                
                # Pour les entrepreneurs/créateurs, récupérer TOUTES les tâches du projet
                user_tasks = Task.query.filter_by(project_id=project.id).all()
                
                created_cv_project = {
                    'id': f"created_{project.id}",
                    'user_id': user_id,
                    'project_id': project.id,
                    'project_name': project.name,
                    'role': 'Créateur/Entrepreneur',
                    'start_date': project.creation_date.isoformat(),
                    'end_date': None,
                    'team_size': team_size,
                    'description': project.description,
                    # 'is_visible': True,  Décommenter
                    'tasks': [task.to_dict() for task in user_tasks]
                }
                cv_projects_list.append(created_cv_project)
    
    return jsonify({
        "projects": cv_projects_list
    }), 200

@cv_bp.route('/projects/user/<string:user_id>', methods=['GET'])
@jwt_required()
def get_user_cv_projects(user_id):
    """Récupérer les projets CV d'un utilisateur spécifique (profil public)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    # Récupérer les projets CV existants
    cv_projects = CVProject.query.filter_by(user_id=user_id).all()
    cv_projects_list = []
    
    for cv_project in cv_projects:
        project_dict = cv_project.to_dict()
        
        # Si l'utilisateur est l'entrepreneur/créateur du projet, montrer toutes les tâches
        project = Project.query.get(cv_project.project_id)
        if user and user.role == 'businessman' and project and project.creator_id == user_id:
            user_tasks = Task.query.filter_by(project_id=cv_project.project_id).all()
        else:
            # Sinon, ne montrer que les tâches assignées à l'utilisateur
            user_tasks = Task.query.filter_by(
                project_id=cv_project.project_id,
                assignee_id=user_id
            ).all()
        
        project_dict['tasks'] = [task.to_dict() for task in user_tasks]
        cv_projects_list.append(project_dict)
    
    # Pour les entrepreneurs, ajouter automatiquement leurs projets créés
    if user and user.role == 'businessman':
        created_projects = Project.query.filter_by(creator_id=user_id).all()
        
        # IDs des projets déjà dans le CV
        existing_project_ids = {cv_proj.project_id for cv_proj in cv_projects}
        
        for project in created_projects:
            if project.id not in existing_project_ids:
                # Calculer la taille de l'équipe
                team_size = db.session.query(project_members).filter_by(project_id=project.id).count()
                
                # Pour les entrepreneurs/créateurs, récupérer TOUTES les tâches du projet
                user_tasks = Task.query.filter_by(project_id=project.id).all()
                
                # Créer l'entrée CV pour le projet créé
                created_cv_project = {
                    'id': f"created_{project.id}",  # ID unique pour différencier
                    'user_id': user_id,
                    'project_id': project.id,
                    'project_name': project.name,
                    'role': 'Créateur/Entrepreneur',
                    'start_date': project.creation_date.isoformat(),
                    'end_date': None,  # Projet en cours
                    'team_size': team_size,
                    'description': project.description,
                    'tasks': [task.to_dict() for task in user_tasks]
                }
                cv_projects_list.append(created_cv_project)
    
    return jsonify({
        "projects": cv_projects_list
    }), 200


@cv_bp.route('/projects/<int:project_id>', methods=['POST'])
@jwt_required()
def add_project_to_cv(project_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Projet non trouvé"}), 404
    
    # Vérifier si l'utilisateur est membre du projet
    member_role = db.session.query(project_members.c.role).filter_by(
        project_id=project_id,
        user_id=user_id
    ).first()
    
    if not member_role:
        return jsonify({"error": "Vous n'êtes pas membre de ce projet"}), 403
    
    # Vérifier si le projet est déjà dans le CV
    existing_cv_project = CVProject.query.filter_by(
        user_id=user_id,
        project_id=project_id
    ).first()
    
    if existing_cv_project:
        return jsonify({"error": "Ce projet est déjà dans votre CV"}), 400
    
    try:
        # Récupérer le nombre de membres dans le projet
        team_size = db.session.query(project_members).filter_by(project_id=project_id).count()
        
        new_cv_project = CVProject(
            user_id=user_id,
            project_id=project_id,
            role=member_role[0],  # Rôle de l'utilisateur dans le projet
            start_date=project.creation_date,  # Date de création du projet
            end_date=datetime.utcnow(),  # Date actuelle comme date de fin
            team_size=team_size,
            description=project.description
        )
        
        db.session.add(new_cv_project)
        db.session.commit()
        
        return jsonify({
            "message": "Projet ajouté au CV avec succès",
            "project": new_cv_project.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@cv_bp.route('/projects/<int:cv_project_id>', methods=['DELETE'])
@jwt_required()
def remove_project_from_cv(cv_project_id):
    user_id = get_jwt_identity()
    cv_project = CVProject.query.get(cv_project_id)
    
    if not cv_project:
        return jsonify({"error": "Projet CV non trouvé"}), 404
    
    if cv_project.user_id != user_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à supprimer ce projet"}), 403
    
    try:
        db.session.delete(cv_project)
        db.session.commit()
        return jsonify({"message": "Projet supprimé du CV avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
