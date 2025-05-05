from flask import Blueprint, request, jsonify
from models import db, Project, Task
from flask_jwt_extended import jwt_required, get_jwt_identity

sprint_bp = Blueprint('sprint', __name__, url_prefix='/sprint')

@sprint_bp.route('/<int:project_id>/list', methods=['GET'])
@jwt_required()
def get_available_sprints(project_id):
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    tasks = Task.query.filter_by(project_id=project_id).all()
    available_sprints = set(task.sprint for task in tasks if task.sprint)
    
    return jsonify({
        "sprints": list(available_sprints)
    }), 200

@sprint_bp.route('/<int:project_id>/filter', methods=['GET'])
@jwt_required()
def filter_tasks(project_id):
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    sprint = request.args.get('sprint')
    priority = request.args.get('priority')
    
    query = Task.query.filter_by(project_id=project_id)
    
    if sprint:
        query = query.filter_by(sprint=sprint)
    
    if priority:
        query = query.filter_by(priority=priority)
    
    tasks = query.all()
    
    return jsonify({
        "tasks": [task.to_dict() for task in tasks]
    }), 200

@sprint_bp.route('/<int:project_id>/stats', methods=['GET'])
@jwt_required()
def get_sprint_stats(project_id):
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    sprint_stats = {}
    for task in tasks:
        if task.sprint:
            if task.sprint not in sprint_stats:
                sprint_stats[task.sprint] = {
                    "total": 0,
                    "completed": 0,
                    "completion_percentage": 0
                }
            
            sprint_stats[task.sprint]["total"] += 1
            if task.percent_completion == 100:
                sprint_stats[task.sprint]["completed"] += 1
    
    for sprint in sprint_stats:
        if sprint_stats[sprint]["total"] > 0:
            sprint_stats[sprint]["completion_percentage"] = (
                sprint_stats[sprint]["completed"] / sprint_stats[sprint]["total"]) * 100
    
    priority_stats = {
        "haute": {"total": 0, "completed": 0},
        "moyenne": {"total": 0, "completed": 0},
        "basse": {"total": 0, "completed": 0}
    }
    
    for task in tasks:
        if task.priority in priority_stats:
            priority_stats[task.priority]["total"] += 1
            if task.percent_completion == 100:
                priority_stats[task.priority]["completed"] += 1
    
    for priority in priority_stats:
        if priority_stats[priority]["total"] > 0:
            priority_stats[priority]["completion_percentage"] = (
                priority_stats[priority]["completed"] / priority_stats[priority]["total"]) * 100
        else:
            priority_stats[priority]["completion_percentage"] = 0
    
    return jsonify({
        "sprint_stats": sprint_stats,
        "priority_stats": priority_stats
    }), 200

@sprint_bp.route('/<int:project_id>/create_sprint', methods=['POST'])
@jwt_required()
def create_sprint(project_id):
    data = request.json
    
    if not data or not 'sprint_name' in data:
        return jsonify({"error": "Le nom du sprint est requis"}), 400
    
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    sprint_name = data['sprint_name']
    task_ids = data.get('task_ids', [])
    
    if task_ids:
        tasks = Task.query.filter(Task.id.in_(task_ids)).all()
        
        for task in tasks:
            if task.project_id == project_id:
                task.sprint = sprint_name
        
        db.session.commit()
    
    return jsonify({
        "message": f"Sprint '{sprint_name}' créé avec succès",
        "tasks_assigned": len(task_ids)
    }), 201

@sprint_bp.route('/<int:task_id>/set_priority', methods=['PUT'])
@jwt_required()
def set_task_priority(task_id):
    data = request.json
    
    if not data or not 'priority' in data:
        return jsonify({"error": "La priorité est requise"}), 400
    
    priority = data['priority'].lower()
    
    if priority not in ['haute', 'moyenne', 'basse']:
        return jsonify({"error": "La priorité doit être 'haute', 'moyenne' ou 'basse'"}), 400
    
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    task.priority = priority
    db.session.commit()
    
    return jsonify({
        "message": f"Priorité de la tâche définie sur '{priority}'",
        "task": task.to_dict()
    }), 200

@sprint_bp.route('/<int:task_id>/set_sprint', methods=['PUT'])
@jwt_required()
def set_task_sprint(task_id):
    data = request.json
    
    if not data or not 'sprint' in data:
        return jsonify({"error": "Le nom du sprint est requis"}), 400
    
    sprint = data['sprint']
    
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    task.sprint = sprint
    db.session.commit()
    
    return jsonify({
        "message": f"Tâche assignée au sprint '{sprint}'",
        "task": task.to_dict()
    }), 200

@sprint_bp.route('/<int:project_id>/bulk_update', methods=['PUT'])
@jwt_required()
def bulk_update_tasks(project_id):
    data = request.json
    
    if not data or not 'task_ids' in data or not (('priority' in data) or ('sprint' in data)):
        return jsonify({"error": "Les IDs des tâches et soit la priorité soit le sprint sont requis"}), 400
    
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    task_ids = data['task_ids']
    tasks = Task.query.filter(Task.id.in_(task_ids), Task.project_id == project_id).all()
    
    updated_count = 0
    
    for task in tasks:
        if 'priority' in data and data['priority'] in ['haute', 'moyenne', 'basse']:
            task.priority = data['priority']
            updated_count += 1
        
        if 'sprint' in data:
            task.sprint = data['sprint']
            updated_count += 1
    
    db.session.commit()
    
    return jsonify({
        "message": f"{updated_count} tâches mises à jour avec succès",
        "tasks": [task.to_dict() for task in tasks]
    }), 200