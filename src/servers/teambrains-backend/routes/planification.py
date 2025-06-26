from flask import Blueprint, request, jsonify
from models import db, User, Project, Task, CVProject
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

planification_bp = Blueprint('planification', __name__, url_prefix='/planification')

def update_project_progress(project_id):
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    if not tasks:
        return 0
    
    total_progress = sum(task.percent_completion for task in tasks)
    total_tasks = len(tasks)
    
    project_progress = total_progress / total_tasks
    
    project = Project.query.get(project_id)
    if project:
        project.progress = project_progress
        db.session.commit()
    
    return project_progress

def add_project_to_cv_if_completed(project_id, user_id):
    # Vérifier si toutes les tâches du projet sont complétées
    tasks = Task.query.filter_by(project_id=project_id).all()
    if not tasks:
        return False
    
    all_tasks_completed = all(task.percent_completion == 100 for task in tasks)
    
    if all_tasks_completed:
        # Vérifier si le projet est déjà dans le CV
        existing_cv_project = CVProject.query.filter_by(
            user_id=user_id,
            project_id=project_id
        ).first()
        
        if not existing_cv_project:
            project = Project.query.get(project_id)
            if project:
                # Récupérer le rôle de l'utilisateur dans le projet
                member_role = db.session.query(project_members.c.role).filter_by(
                    project_id=project_id,
                    user_id=user_id
                ).first()
                
                if member_role:
                    role = member_role[0]
                    # Ajouter le projet au CV
                    new_cv_project = CVProject(
                        user_id=user_id,
                        project_id=project_id,
                        role=role,
                        start_date=project.creation_date,
                        end_date=datetime.utcnow(),
                        team_size=len(project.members),
                        description=project.description
                    )
                    db.session.add(new_cv_project)
                    db.session.commit()
                    return True
    return False

@planification_bp.route('/<int:project_id>/create_task', methods=['POST'])
@jwt_required()
def create_task(project_id):
    data = request.json
    
    if not data or not 'title' in data or not 'due_date' in data:
        return jsonify({"error": "Les champs 'title' et 'due_date' sont requis"}), 400
    
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    new_task = Task(
        title=data['title'],
        description=data['description'] if 'description' in data else None,
        due_date=data['due_date'],
        project_id=project_id,
        percent_completion=0,
        assignee_id=data['assignee_id'] if 'assignee_id' in data else get_jwt_identity(),
        priority=data.get('priority', 'moyenne'),
        sprint=data.get('sprint'),
        file_url=data.get('file_url'),
        file_name=data.get('file_name')
    )

    db.session.add(new_task)
    db.session.commit()
    
    update_project_progress(project_id)

    return jsonify({
        "message": "Tâche créée avec succès",
        "task": new_task.to_dict()
    }), 201

@planification_bp.route('/<int:project_id>/tasks', methods=['GET'])
@jwt_required()
def get_tasks(project_id):
    project = Project.query.get(project_id)

    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    tasks = Task.query.filter_by(project_id=project_id).all()

    return jsonify({
        "tasks": [task.to_dict() for task in tasks]
    }), 200

@planification_bp.route('/<int:task_id>/update', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    data = request.json
    
    if not data or not 'title' in data or not 'description' in data or not 'due_date' in data:
        return jsonify({"error": "Les champs 'title', 'description' et 'due_date' sont requis"}), 400
    
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    task.title = data['title']
    task.description = data['description'] if 'description' in data else None
    task.due_date = data['due_date']
    task.percent_completion = data['percent_completion'] if 'percent_completion' in data else task.percent_completion
    task.assignee_id = data['assignee_id'] if 'assignee_id' in data else get_jwt_identity()
    task.priority = data.get('priority', task.priority)
    task.sprint = data.get('sprint', task.sprint)
    task.file_url = data.get('file_url', task.file_url)
    task.file_name = data.get('file_name', task.file_name)
    
    db.session.commit()
    
    update_project_progress(task.project_id)
    
    if task.percent_completion == 100:
        add_project_to_cv_if_completed(task.project_id, task.assignee_id)

    return jsonify({
        "message": "Tâche mise à jour avec succès",
        "task": task.to_dict()
    }), 200

@planification_bp.route('/<int:task_id>/delete', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    project_id = task.project_id
    db.session.delete(task)
    db.session.commit()
    
    # Mettre à jour la progression du projet
    update_project_progress(project_id)

    return jsonify({"message": "Tâche supprimée avec succès"}), 200

# Optionnel : Endpoint pour obtenir la progression d'un projet
@planification_bp.route('/<int:project_id>/progress', methods=['GET'])
@jwt_required()
def get_project_progress(project_id):
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    progress = update_project_progress(project_id)
    
    return jsonify({
        "project_id": project_id,
        "progress": progress
    }), 200