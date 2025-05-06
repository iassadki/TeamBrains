from flask import Blueprint, request, jsonify
from models import db, Task, TaskValidation, User, Project
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

validation_bp = Blueprint('validation', __name__, url_prefix='/validation')

@validation_bp.route('/task/<int:task_id>', methods=['POST'])
@jwt_required()
def validate_task(task_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or 'status' not in data:
        return jsonify({"error": "Le statut de validation est requis"}), 400
    
    status = data['status'].lower()
    
    if status not in ['validated', 'rejected', 'pending']:
        return jsonify({"error": "Le statut doit être 'validated', 'rejected' ou 'pending'"}), 400
    
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    project = Project.query.get(task.project_id)
    if not project:
        return jsonify({"error": "Le projet associé à cette tâche n'existe pas"}), 404
    
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à valider cette tâche"}), 403
    
    validation = TaskValidation(
        task_id=task_id,
        status=status,
        comment=data.get('comment'),
        validator_id=current_user_id
    )
    
    db.session.add(validation)
    
    if status == 'validated':
        task.percent_completion = 100
    elif status == 'rejected':
        if task.percent_completion == 100:
            task.percent_completion = 90
    
    db.session.commit()
    
    return jsonify({
        "message": f"Statut de la tâche mis à jour: {status}",
        "validation": validation.to_dict(),
        "task": task.to_dict()
    }), 201

@validation_bp.route('/task/<int:task_id>/history', methods=['GET'])
@jwt_required()
def get_validation_history(task_id):
    current_user_id = get_jwt_identity()
    
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    project = Project.query.get(task.project_id)
    if not project:
        return jsonify({"error": "Le projet associé à cette tâche n'existe pas"}), 404
    
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à voir l'historique de cette tâche"}), 403
    
    validations = TaskValidation.query.filter_by(task_id=task_id).order_by(TaskValidation.timestamp.desc()).all()
    
    return jsonify({
        "task_id": task_id,
        "task_title": task.title,
        "validations": [validation.to_dict() for validation in validations]
    }), 200

@validation_bp.route('/project/<int:project_id>/pending', methods=['GET'])
@jwt_required()
def get_pending_validations(project_id):
    current_user_id = get_jwt_identity()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à voir les validations de ce projet"}), 403
    
    from sqlalchemy import func, and_, or_
    
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    pending_tasks = []
    for task in tasks:
        last_validation = TaskValidation.query.filter_by(task_id=task.id).order_by(TaskValidation.timestamp.desc()).first()
        
        if (task.percent_completion == 100 and not last_validation) or \
           (last_validation and last_validation.status == 'rejected') or \
           (last_validation and last_validation.status == 'pending'):
            pending_tasks.append({
                "task": task.to_dict(),
                "last_validation": last_validation.to_dict() if last_validation else None
            })
    
    return jsonify({
        "project_id": project_id,
        "project_name": project.name,
        "pending_tasks": pending_tasks
    }), 200

@validation_bp.route('/stats/<int:project_id>', methods=['GET'])
@jwt_required()
def get_validation_stats(project_id):
    current_user_id = get_jwt_identity()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à voir les statistiques de ce projet"}), 403
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    stats = {
        "total_tasks": len(tasks),
        "completed_tasks": 0,
        "validated_tasks": 0,
        "rejected_tasks": 0,
        "pending_tasks": 0,
        "validation_rate": 0,
        "rejection_rate": 0,
        "average_validations_per_task": 0, 
        "validation_history": {
            "validated": [],
            "rejected": [],
            "pending": []
        }
    }
    
    total_validations = 0
    for task in tasks:
        if task.percent_completion == 100:
            stats["completed_tasks"] += 1
        
        last_validation = TaskValidation.query.filter_by(task_id=task.id).order_by(TaskValidation.timestamp.desc()).first()
        
        if last_validation:
            if last_validation.status == 'validated':
                stats["validated_tasks"] += 1
                stats["validation_history"]["validated"].append({
                    "task_id": task.id,
                    "task_title": task.title,
                    "validation_date": last_validation.timestamp.isoformat(),
                    "validator": f"{last_validation.validator.prenom} {last_validation.validator.nom}" if last_validation.validator else "Inconnu"
                })
            elif last_validation.status == 'rejected':
                stats["rejected_tasks"] += 1
                stats["validation_history"]["rejected"].append({
                    "task_id": task.id,
                    "task_title": task.title,
                    "validation_date": last_validation.timestamp.isoformat(),
                    "validator": f"{last_validation.validator.prenom} {last_validation.validator.nom}" if last_validation.validator else "Inconnu",
                    "comment": last_validation.comment
                })
            elif last_validation.status == 'pending':
                stats["pending_tasks"] += 1
                stats["validation_history"]["pending"].append({
                    "task_id": task.id,
                    "task_title": task.title,
                    "validation_date": last_validation.timestamp.isoformat(),
                    "validator": f"{last_validation.validator.prenom} {last_validation.validator.nom}" if last_validation.validator else "Inconnu"
                })
        
        total_task_validations = TaskValidation.query.filter_by(task_id=task.id).count()
        total_validations += total_task_validations
    
    if stats["completed_tasks"] > 0:
        stats["validation_rate"] = (stats["validated_tasks"] / stats["completed_tasks"]) * 100
        stats["rejection_rate"] = (stats["rejected_tasks"] / stats["completed_tasks"]) * 100
    
    if len(tasks) > 0:
        stats["average_validations_per_task"] = total_validations / len(tasks)
    
    return jsonify({
        "project_id": project_id,
        "project_name": project.name,
        "stats": stats
    }), 200

@validation_bp.route('/task/<int:task_id>/status', methods=['GET'])
@jwt_required()
def get_task_validation_status(task_id):
    current_user_id = get_jwt_identity()
    
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    last_validation = TaskValidation.query.filter_by(task_id=task_id).order_by(TaskValidation.timestamp.desc()).first()
    
    validation_status = {
        "task_id": task_id,
        "task_title": task.title,
        "completion_percentage": task.percent_completion,
        "current_status": "not_started" 
    }
    
    if task.percent_completion == 0:
        validation_status["current_status"] = "not_started"
    elif task.percent_completion < 100:
        validation_status["current_status"] = "in_progress"
    elif task.percent_completion == 100 and not last_validation:
        validation_status["current_status"] = "completed_pending_validation"
    elif last_validation:
        validation_status["current_status"] = last_validation.status
        validation_status["last_validation"] = last_validation.to_dict()
    
    return jsonify(validation_status), 200