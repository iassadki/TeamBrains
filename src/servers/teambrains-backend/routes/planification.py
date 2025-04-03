from flask import Blueprint, request, jsonify
from models import db, Project, Task
from flask_jwt_extended import jwt_required, get_jwt_identity

planification_bp = Blueprint('planification', __name__, url_prefix='/planification')

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
        assignee_id=data['assignee_id'] if 'assignee_id' in data else get_jwt_identity()
    )

    db.session.add(new_task)
    db.session.commit()

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
    task.percent_completion = data['percent_completion'] if 'percent_completion' in data else 0
    task.assignee_id = data['assignee_id'] if 'assignee_id' in data else get_jwt_identity()
    
    db.session.commit()

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
    
    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Tâche supprimée avec succès"}), 200