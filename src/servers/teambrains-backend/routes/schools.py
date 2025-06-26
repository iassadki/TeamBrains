from flask import Blueprint, request, jsonify
from models import db, User, School, SchoolToken
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import secrets

schools_bp = Blueprint('schools', __name__, url_prefix='/api')

# Middleware pour vérifier les tokens d'école
def verify_school_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None, jsonify({"error": "Token d'école requis"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        school_token = SchoolToken.query.filter_by(token=token, is_active=True).first()
        
        if not school_token:
            return None, jsonify({"error": "Token d'école invalide"}), 401
            
        # Vérifier l'expiration si elle existe
        if school_token.expires_at and school_token.expires_at < datetime.utcnow():
            return None, jsonify({"error": "Token d'école expiré"}), 401
            
        return school_token, None, None
    except Exception as e:
        return None, jsonify({"error": "Erreur de vérification du token"}), 401

@schools_bp.route('/ecoles', methods=['GET'])
def list_schools():
    """Liste toutes les écoles actives"""
    schools = School.query.filter_by(is_active=True).all()
    return jsonify({
        "schools": [school.to_dict() for school in schools]
    }), 200

@schools_bp.route('/ecoles', methods=['POST'])
@jwt_required()
def create_school():
    """Créer une nouvelle école (admin seulement)"""
    data = request.get_json()
    
    # Vérifier que l'utilisateur est admin (à adapter selon votre système d'admin)
    # user_id = get_jwt_identity()
    
    required_fields = ['name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ {field} est requis"}), 400
    
    # Vérifier que l'école n'existe pas déjà
    existing_school = School.query.filter_by(name=data['name']).first()
    if existing_school:
        return jsonify({"error": "Une école avec ce nom existe déjà"}), 400
    
    try:
        new_school = School(
            name=data['name'],
            description=data.get('description'),
            contact_email=data.get('contact_email'),
            website=data.get('website')
        )
        
        db.session.add(new_school)
        db.session.commit()
        
        return jsonify({
            "message": "École créée avec succès",
            "school": new_school.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@schools_bp.route('/ecole/<int:school_id>/generate-token', methods=['POST'])
@jwt_required()
def generate_school_token(school_id):
    """Générer un token pour une école"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    school = School.query.get(school_id)
    if not school:
        return jsonify({"error": "École non trouvée"}), 404
    
    if not school.is_active:
        return jsonify({"error": "École désactivée"}), 400
    
    required_fields = ['name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ {field} est requis"}), 400
    
    try:
        # Créer le token avec expiration optionnelle
        expires_at = None
        if 'expires_in_days' in data:
            expires_at = datetime.utcnow() + timedelta(days=data['expires_in_days'])
        
        new_token = SchoolToken(
            school_id=school_id,
            name=data['name'],
            expires_at=expires_at,
            created_by=user_id
        )
        
        db.session.add(new_token)
        db.session.commit()
        
        return jsonify({
            "message": "Token généré avec succès",
            "token": new_token.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@schools_bp.route('/ecole/<int:school_id>/tokens', methods=['GET'])
@jwt_required()
def list_school_tokens(school_id):
    """Lister tous les tokens d'une école"""
    school = School.query.get(school_id)
    if not school:
        return jsonify({"error": "École non trouvée"}), 404
    
    tokens = SchoolToken.query.filter_by(school_id=school_id).all()
    return jsonify({
        "tokens": [token.to_dict() for token in tokens]
    }), 200

@schools_bp.route('/ecole/students', methods=['GET'])
def get_school_students():
    """Récupérer les étudiants d'une école via token"""
    school_token, error_response, status_code = verify_school_token()
    if error_response:
        return error_response, status_code
    
    # Récupérer les étudiants de l'école
    students = User.query.filter_by(
        school_id=school_token.school_id,
        role='student'
    ).all()
    
    students_data = []
    for student in students:
        student_data = {
            'id': student.id,
            'prenom': student.prenom,
            'nom': student.nom,
            'email': student.email,
            'typeDeveloppeur': student.typeDeveloppeur,
            'technologies': student.technologies.split(',') if student.technologies else [],
            'etudes': student.etudes,
            'ambitions': student.ambitions,
            'linkedin_url': student.linkedin_url,
            'portfolio_url': student.portfolio_url,
            'github_url': student.github_url
        }
        students_data.append(student_data)
    
    return jsonify({
        "school": school_token.school.to_dict(),
        "students": students_data,
        "total_students": len(students_data)
    }), 200

@schools_bp.route('/ecole/student/<student_id>/cv', methods=['GET'])
def get_student_cv(student_id):
    """Récupérer le CV d'un étudiant via token d'école"""
    school_token, error_response, status_code = verify_school_token()
    if error_response:
        return error_response, status_code
    
    # Vérifier que l'étudiant appartient à l'école
    student = User.query.filter_by(
        id=student_id,
        school_id=school_token.school_id,
        role='student'
    ).first()
    
    if not student:
        return jsonify({"error": "Étudiant non trouvé dans cette école"}), 404
    
    # Importer ici pour éviter les imports circulaires
    from routes.cv import get_cv_projects
    
    # Simuler une requête pour récupérer le CV
    # On pourrait factoriser cette logique dans une fonction séparée
    from models import CVProject, Task
    
    cv_projects = CVProject.query.filter_by(user_id=student_id).all()
    cv_projects_list = []
    
    for cv_project in cv_projects:
        project_dict = cv_project.to_dict()
        
        # Récupérer les tâches assignées à l'étudiant
        user_tasks = Task.query.filter_by(
            project_id=cv_project.project_id,
            assignee_id=student_id
        ).all()
        
        project_dict['tasks'] = [task.to_dict() for task in user_tasks]
        cv_projects_list.append(project_dict)
    
    return jsonify({
        "student": {
            'id': student.id,
            'prenom': student.prenom,
            'nom': student.nom,
            'email': student.email,
            'typeDeveloppeur': student.typeDeveloppeur,
            'technologies': student.technologies.split(',') if student.technologies else [],
            'etudes': student.etudes,
            'ambitions': student.ambitions,
            'linkedin_url': student.linkedin_url,
            'portfolio_url': student.portfolio_url,
            'github_url': student.github_url
        },
        "projects": cv_projects_list
    }), 200

@schools_bp.route('/ecole/token/<int:token_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_token(token_id):
    """Désactiver un token d'école"""
    token = SchoolToken.query.get(token_id)
    if not token:
        return jsonify({"error": "Token non trouvé"}), 404
    
    try:
        token.is_active = False
        db.session.commit()
        
        return jsonify({"message": "Token désactivé avec succès"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@schools_bp.route('/ecole/<int:school_id>/add-student', methods=['POST'])
@jwt_required()
def add_student_to_school(school_id):
    """Associer un étudiant à une école"""
    data = request.get_json()
    
    # Vérifier que l'école existe
    school = School.query.get(school_id)
    if not school:
        return jsonify({"error": "École non trouvée"}), 404
    
    if not school.is_active:
        return jsonify({"error": "École désactivée"}), 400
    
    # Récupérer l'étudiant par email
    student_email = data.get('student_email')
    if not student_email:
        return jsonify({"error": "Email de l'étudiant requis"}), 400
    
    student = User.query.filter_by(email=student_email, role='student').first()
    if not student:
        return jsonify({"error": "Étudiant non trouvé"}), 404
    
    try:
        # Associer l'étudiant à l'école
        student.school_id = school_id
        db.session.commit()
        
        return jsonify({
            "message": f"Étudiant {student.prenom} {student.nom} associé à l'école {school.name}",
            "student": {
                "id": student.id,
                "nom": student.nom,
                "prenom": student.prenom,
                "email": student.email,
                "school_id": student.school_id
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 