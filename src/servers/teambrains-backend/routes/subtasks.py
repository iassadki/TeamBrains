from flask import Blueprint, request, jsonify
from models import db, Task, SubTask, SubTaskValidation, User, Project, TaskStudent
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

subtasks_bp = Blueprint('subtasks', __name__, url_prefix='/subtasks')

@subtasks_bp.route('/task/<int:task_id>/create', methods=['POST'])
@jwt_required()
def create_subtask(task_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or not 'title' in data:
        return jsonify({"error": "Le titre de la sous-tâche est requis"}), 400
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    project = Project.query.get(task.project_id)
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à créer des sous-tâches pour ce projet"}), 403
    
    subtask = SubTask(
        title=data['title'],
        description=data.get('description'),
        due_date=datetime.fromisoformat(data['due_date']) if 'due_date' in data else None,
        priority=data.get('priority', 'moyenne'),
        task_id=task_id,
        assigned_student_id=data.get('assigned_student_id')
    )
    
    db.session.add(subtask)
    db.session.commit()
    
    return jsonify({
        "message": "Sous-tâche créée avec succès",
        "subtask": subtask.to_dict()
    }), 201

@subtasks_bp.route('/task/<int:task_id>/list', methods=['GET'])
@jwt_required()
def get_task_subtasks(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    subtasks = SubTask.query.filter_by(task_id=task_id).all()
    
    return jsonify({
        "task_id": task_id,
        "task_title": task.title,
        "subtasks": [subtask.to_dict() for subtask in subtasks]
    }), 200

@subtasks_bp.route('/task/<int:task_id>/validated', methods=['GET'])
@jwt_required()
def get_validated_subtasks_with_feedback(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    validated_subtasks = SubTask.query.filter_by(task_id=task_id, status='validated').all()
    
    result = []
    for subtask in validated_subtasks:
        last_validation = SubTaskValidation.query.filter_by(
            subtask_id=subtask.id, 
            status='validated'
        ).order_by(SubTaskValidation.timestamp.desc()).first()
        
        subtask_data = subtask.to_dict()
        subtask_data['validation_info'] = last_validation.to_dict() if last_validation else None
        
        result.append(subtask_data)
    
    return jsonify({
        "task_id": task_id,
        "task_title": task.title,
        "validated_subtasks": result
    }), 200

@subtasks_bp.route('/<int:subtask_id>/validate', methods=['POST'])
@jwt_required()
def validate_subtask(subtask_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or 'status' not in data:
        return jsonify({"error": "Le statut de validation est requis"}), 400
    
    status = data['status'].lower()
    if status not in ['validated', 'rejected', 'pending']:
        return jsonify({"error": "Le statut doit être 'validated', 'rejected' ou 'pending'"}), 400
    
    subtask = SubTask.query.get(subtask_id)
    if not subtask:
        return jsonify({"error": "La sous-tâche spécifiée n'existe pas"}), 404
    
    task = Task.query.get(subtask.task_id)
    project = Project.query.get(task.project_id)
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à valider cette sous-tâche"}), 403
    
    validation = SubTaskValidation(
        subtask_id=subtask_id,
        status=status,
        feedback=data.get('feedback'),
        validator_id=current_user_id
    )
    
    subtask.status = status
    if status == 'validated':
        subtask.percent_completion = 100
    elif status == 'rejected' and subtask.percent_completion == 100:
        subtask.percent_completion = 90
    
    db.session.add(validation)
    db.session.commit()
    
    return jsonify({
        "message": f"Sous-tâche {status}",
        "subtask": subtask.to_dict(),
        "validation": validation.to_dict()
    }), 201

@subtasks_bp.route('/<int:subtask_id>/assign-student', methods=['POST'])
@jwt_required()
def assign_student_to_subtask(subtask_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or 'student_id' not in data:
        return jsonify({"error": "L'ID de l'étudiant est requis"}), 400
    
    subtask = SubTask.query.get(subtask_id)
    if not subtask:
        return jsonify({"error": "La sous-tâche spécifiée n'existe pas"}), 404
    
    student = User.query.get(data['student_id'])
    if not student:
        return jsonify({"error": "L'étudiant spécifié n'existe pas"}), 404
    
    subtask.assigned_student_id = data['student_id']
    db.session.commit()
    
    return jsonify({
        "message": "Étudiant assigné à la sous-tâche avec succès",
        "subtask": subtask.to_dict()
    }), 200

@subtasks_bp.route('/task/<int:task_id>/assign-students', methods=['POST'])
@jwt_required()
def assign_students_to_task(task_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or 'student_ids' not in data:
        return jsonify({"error": "La liste des IDs des étudiants est requise"}), 400
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "La tâche spécifiée n'existe pas"}), 404
    
    project = Project.query.get(task.project_id)
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à assigner des étudiants à cette tâche"}), 403
    
    student_ids = data['student_ids']
    students = User.query.filter(User.id.in_(student_ids)).all()
    
    if len(students) != len(student_ids):
        return jsonify({"error": "Certains étudiants spécifiés n'existent pas"}), 404
    
    # Supprimer les anciens assignements
    TaskStudent.query.filter_by(task_id=task_id).delete()
    
    # Ajouter les nouveaux assignements
    for student_id in student_ids:
        role = data.get('roles', {}).get(student_id, 'développeur')
        task_student = TaskStudent(
            task_id=task_id,
            student_id=student_id,
            role=role
        )
        db.session.add(task_student)
    
    db.session.commit()
    
    # Recharger la tâche pour obtenir les nouvelles relations
    task = Task.query.get(task_id)
    
    return jsonify({
        "message": f"{len(student_ids)} étudiants assignés à la tâche",
        "task": task.to_dict()
    }), 200

@subtasks_bp.route('/project/<int:project_id>/students-tasks', methods=['GET'])
@jwt_required()
def get_project_students_tasks(project_id):
    current_user_id = get_jwt_identity()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à voir les informations de ce projet"}), 403
    
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    result = {
        "project_id": project_id,
        "project_name": project.name,
        "tasks": []
    }
    
    for task in tasks:
        task_data = {
            "task_id": task.id,
            "task_title": task.title,
            "task_description": task.description,
            "task_priority": task.priority,
            "task_sprint": task.sprint,
            "task_completion": task.percent_completion,
            "assigned_students": [ts.to_dict() for ts in task.task_students],
            "subtasks": []
        }
        
        # Récupérer les sous-tâches de la tâche
        subtasks = SubTask.query.filter_by(task_id=task.id).all()
        for subtask in subtasks:
            subtask_data = subtask.to_dict()
            last_validation = SubTaskValidation.query.filter_by(
                subtask_id=subtask.id
            ).order_by(SubTaskValidation.timestamp.desc()).first()
            
            if last_validation:
                subtask_data['last_validation'] = last_validation.to_dict()
            
            task_data["subtasks"].append(subtask_data)
        
        result["tasks"].append(task_data)
    
    return jsonify(result), 200

@subtasks_bp.route('/student/<student_id>/tasks', methods=['GET'])
@jwt_required()
def get_student_tasks(student_id):
    current_user_id = get_jwt_identity()
    
    if current_user_id != student_id:
        pass
    
    student = User.query.get(student_id)
    if not student:
        return jsonify({"error": "L'étudiant spécifié n'existe pas"}), 404
    
    # Récupérer les tâches assignées via TaskStudent
    task_assignments = TaskStudent.query.filter_by(student_id=student_id).all()
    assigned_tasks = [ts.task for ts in task_assignments]
    
    # Récupérer les sous-tâches assignées
    assigned_subtasks = SubTask.query.filter_by(assigned_student_id=student_id).all()
    
    result = {
        "student_id": student_id,
        "student_name": f"{student.prenom} {student.nom}",
        "assigned_tasks": [task.to_dict() for task in assigned_tasks],
        "assigned_subtasks": [subtask.to_dict() for subtask in assigned_subtasks],
        "task_assignments": [ts.to_dict() for ts in task_assignments]
    }
    
    return jsonify(result), 200

@subtasks_bp.route('/task-student/<int:assignment_id>', methods=['PUT'])
@jwt_required()
def update_task_student_assignment(assignment_id):
    """Mettre à jour un assignement tâche-étudiant"""
    current_user_id = get_jwt_identity()
    data = request.json
    
    assignment = TaskStudent.query.get(assignment_id)
    if not assignment:
        return jsonify({"error": "L'assignement spécifié n'existe pas"}), 404
    
    # Vérifier l'autorisation
    task = assignment.task
    project = Project.query.get(task.project_id)
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à modifier cet assignement"}), 403
    
    if 'role' in data:
        assignment.role = data['role']
    
    db.session.commit()
    
    return jsonify({
        "message": "Assignement mis à jour avec succès",
        "assignment": assignment.to_dict()
    }), 200

@subtasks_bp.route('/task-student/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_task_student_assignment(assignment_id):
    """Supprimer un assignement tâche-étudiant"""
    current_user_id = get_jwt_identity()
    
    assignment = TaskStudent.query.get(assignment_id)
    if not assignment:
        return jsonify({"error": "L'assignement spécifié n'existe pas"}), 404
    
    # Vérifier l'autorisation
    task = assignment.task
    project = Project.query.get(task.project_id)
    is_member = current_user_id in [member.id for member in project.members]
    is_creator = project.creator_id == current_user_id
    
    if not (is_member or is_creator):
        return jsonify({"error": "Vous n'êtes pas autorisé à supprimer cet assignement"}), 403
    
    db.session.delete(assignment)
    db.session.commit()
    
    return jsonify({"message": "Assignement supprimé avec succès"}), 200