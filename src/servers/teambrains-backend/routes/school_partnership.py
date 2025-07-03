from flask import Blueprint, request, jsonify
from models import db, User, School, SchoolRegistrationToken, Subscription, CVProject, Task, Project, project_members
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import datetime, timedelta
from extensions import bcrypt
import secrets
import logging

school_partnership_bp = Blueprint('school_partnership', __name__, url_prefix='/api/partnership')

# ===============================
# GESTION DES ÉCOLES PARTENAIRES
# ===============================

@school_partnership_bp.route('/school/register', methods=['POST'])
def register_school():
    """Inscription d'une nouvelle école dans l'espace partenariat"""
    data = request.get_json()
    
    required_fields = ['name', 'contact_email', 'admin_firstname', 'admin_lastname', 'admin_email', 'admin_password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ {field} est requis"}), 400
    
    # Vérifier que l'école n'existe pas déjà
    existing_school = School.query.filter_by(name=data['name']).first()
    if existing_school:
        return jsonify({"error": "Une école avec ce nom existe déjà"}), 400
    
    # Vérifier que l'email admin n'est pas déjà utilisé
    existing_user = User.query.filter_by(email=data['admin_email']).first()
    if existing_user:
        return jsonify({"error": "Un utilisateur avec cet email existe déjà"}), 400
    
    try:
        # Créer l'école
        new_school = School(
            name=data['name'],
            description=data.get('description'),
            contact_email=data['contact_email'],
            website=data.get('website')
        )
        db.session.add(new_school)
        db.session.flush()  # Pour obtenir l'ID de l'école
        
        # Créer l'utilisateur administrateur de l'école
        admin_user = User(
            role='school_admin',
            nom=data['admin_lastname'],
            prenom=data['admin_firstname'],
            email=data['admin_email'],
            password=bcrypt.generate_password_hash(data['admin_password']).decode('utf-8'),
            school_id=new_school.id
        )
        db.session.add(admin_user)
        db.session.commit()
        
        return jsonify({
            "message": "École enregistrée avec succès",
            "school": new_school.to_dict(),
            "admin": {
                "id": admin_user.id,
                "nom": admin_user.nom,
                "prenom": admin_user.prenom,
                "email": admin_user.email,
                "role": admin_user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de l'enregistrement de l'école: {str(e)}")
        return jsonify({"error": "Erreur lors de l'enregistrement de l'école"}), 500

@school_partnership_bp.route('/school/login', methods=['POST'])
def school_admin_login():
    """Connexion pour les administrateurs d'école"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email et mot de passe requis"}), 400
    
    try:
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or user.role != 'school_admin':
            return jsonify({"error": "Identifiants invalides ou accès non autorisé"}), 401
        
        # Vérification exactement comme dans auth.py
        logging.info(f"Tentative de connexion pour {user.email}")
        logging.info(f"Hash du mot de passe (premiers caractères): {user.password[:50]}...")
        
        if not bcrypt.check_password_hash(user.password, data['password']):
            return jsonify({"error": "Identifiants invalides"}), 401
        
        # Vérifier que l'école est active
        if not user.school or not user.school.is_active:
            return jsonify({"error": "École inactive"}), 403
        
        # Créer le token JWT
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "message": "Connexion réussie",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "nom": user.nom,
                "prenom": user.prenom,
                "email": user.email,
                "role": user.role,
                "school": user.school.to_dict() if user.school else None
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la connexion: {str(e)}")
        return jsonify({"error": "Erreur lors de la connexion"}), 500

# ===============================
# GESTION DES TOKENS D'INSCRIPTION
# ===============================

@school_partnership_bp.route('/school/registration-tokens', methods=['GET'])
@jwt_required()
def list_registration_tokens():
    """Lister tous les tokens d'inscription de l'école"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'school_admin' or not user.school_id:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    tokens = SchoolRegistrationToken.query.filter_by(school_id=user.school_id).order_by(SchoolRegistrationToken.created_at.desc()).all()
    
    return jsonify({
        "tokens": [token.to_dict() for token in tokens],
        "school": user.school.to_dict() if user.school else None
    }), 200

@school_partnership_bp.route('/school/registration-tokens', methods=['POST'])
@jwt_required()
def create_registration_token():
    """Créer un nouveau token d'inscription pour l'école"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'school_admin' or not user.school_id:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    data = request.get_json()
    
    required_fields = ['name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ {field} est requis"}), 400
    
    try:
        # Créer le token avec expiration optionnelle
        expires_at = None
        if 'expires_in_days' in data and data['expires_in_days']:
            expires_at = datetime.utcnow() + timedelta(days=data['expires_in_days'])
        
        new_token = SchoolRegistrationToken(
            school_id=user.school_id,
            name=data['name'],
            description=data.get('description'),
            max_uses=data.get('max_uses'),
            expires_at=expires_at,
            created_by=user_id
        )
        
        db.session.add(new_token)
        db.session.commit()
        
        return jsonify({
            "message": "Token d'inscription créé avec succès",
            "token": new_token.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la création du token: {str(e)}")
        return jsonify({"error": "Erreur lors de la création du token"}), 500

@school_partnership_bp.route('/school/registration-tokens/<int:token_id>', methods=['PUT'])
@jwt_required()
def update_registration_token(token_id):
    """Modifier un token d'inscription"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'school_admin' or not user.school_id:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    token = SchoolRegistrationToken.query.filter_by(id=token_id, school_id=user.school_id).first()
    if not token:
        return jsonify({"error": "Token non trouvé"}), 404
    
    data = request.get_json()
    
    try:
        # Mettre à jour les champs modifiables
        if 'name' in data:
            token.name = data['name']
        if 'description' in data:
            token.description = data['description']
        if 'max_uses' in data:
            token.max_uses = data['max_uses']
        if 'is_active' in data:
            token.is_active = data['is_active']
        if 'expires_in_days' in data:
            if data['expires_in_days']:
                token.expires_at = datetime.utcnow() + timedelta(days=data['expires_in_days'])
            else:
                token.expires_at = None
        
        db.session.commit()
        
        return jsonify({
            "message": "Token mis à jour avec succès",
            "token": token.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la mise à jour du token: {str(e)}")
        return jsonify({"error": "Erreur lors de la mise à jour du token"}), 500

@school_partnership_bp.route('/school/registration-tokens/<int:token_id>', methods=['DELETE'])
@jwt_required()
def delete_registration_token(token_id):
    """Supprimer un token d'inscription"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'school_admin' or not user.school_id:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    token = SchoolRegistrationToken.query.filter_by(id=token_id, school_id=user.school_id).first()
    if not token:
        return jsonify({"error": "Token non trouvé"}), 404
    
    try:
        db.session.delete(token)
        db.session.commit()
        
        return jsonify({"message": "Token supprimé avec succès"}), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la suppression du token: {str(e)}")
        return jsonify({"error": "Erreur lors de la suppression du token"}), 500

# ===============================
# INSCRIPTION DES ÉTUDIANTS
# ===============================

@school_partnership_bp.route('/student/verify-token', methods=['POST'])
def verify_student_token():
    """Vérifier si un token d'inscription est valide"""
    data = request.get_json()
    
    if not data.get('token'):
        return jsonify({"error": "Token requis"}), 400
    
    token = SchoolRegistrationToken.query.filter_by(token=data['token'].upper()).first()
    
    if not token:
        return jsonify({"error": "Token invalide"}), 404
    
    if not token.can_be_used():
        reason = "Token expiré" if token.expires_at and token.expires_at < datetime.utcnow() else \
                "Token inactif" if not token.is_active else \
                "Nombre maximum d'utilisations atteint"
        return jsonify({"error": f"Token non utilisable: {reason}"}), 400
    
    return jsonify({
        "valid": True,
        "school": token.school.to_dict(),
        "token_info": {
            "name": token.name,
            "description": token.description,
            "remaining_uses": token.remaining_uses if token.max_uses else "Illimité",
            "expires_at": token.expires_at.isoformat() if token.expires_at else None
        }
    }), 200

@school_partnership_bp.route('/student/check-email', methods=['POST'])
def check_student_email():
    """Vérifier si un étudiant avec cet email existe déjà"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('token'):
        return jsonify({"error": "Email et token requis"}), 400
    
    # Vérifier le token
    token = SchoolRegistrationToken.query.filter_by(token=data['token'].upper()).first()
    if not token or not token.can_be_used():
        return jsonify({"error": "Token invalide ou non utilisable"}), 400
    
    # Vérifier si l'utilisateur existe
    existing_user = User.query.filter_by(email=data['email']).first()
    
    if not existing_user:
        return jsonify({
            "exists": False,
            "can_register": True,
            "message": "Email disponible"
        }), 200
    
    # L'utilisateur existe - vérifier s'il a déjà une école
    if not existing_user.school_id:
        return jsonify({
            "exists": True,
            "has_school": False,
            "can_join": True,
            "user_info": {
                "nom": existing_user.nom,
                "prenom": existing_user.prenom,
                "email": existing_user.email
            },
            "target_school": token.school.to_dict(),
            "message": f"Un compte existe déjà pour {existing_user.email} mais n'est rattaché à aucune école. Voulez-vous rejoindre l'école {token.school.name} ?"
        }), 200
    
    # L'utilisateur a déjà une école
    current_school = existing_user.school
    if current_school.id == token.school_id:
        return jsonify({
            "exists": True,
            "has_school": True,
            "same_school": True,
            "message": f"Vous êtes déjà inscrit dans l'école {current_school.name}"
        }), 400
    
    return jsonify({
        "exists": True,
        "has_school": True,
        "same_school": False,
        "can_transfer": True,
        "user_info": {
            "nom": existing_user.nom,
            "prenom": existing_user.prenom,
            "email": existing_user.email
        },
        "current_school": current_school.to_dict(),
        "target_school": token.school.to_dict(),
        "message": f"Vous êtes actuellement dans l'école {current_school.name}. Voulez-vous transférer vers {token.school.name} ?"
    }), 200

@school_partnership_bp.route('/student/register', methods=['POST'])
def register_student_with_token():
    """Inscription d'un étudiant avec un token d'école"""
    data = request.get_json()
    
    required_fields = ['token', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ {field} est requis"}), 400
    
    # Vérifier le token
    token = SchoolRegistrationToken.query.filter_by(token=data['token'].upper()).first()
    
    if not token or not token.can_be_used():
        return jsonify({"error": "Token invalide ou non utilisable"}), 400
    
    # Vérifier si l'utilisateur existe
    existing_user = User.query.filter_by(email=data['email']).first()
    
    if existing_user:
        # Gestion des utilisateurs existants
        confirm_transfer = data.get('confirm_transfer', False)
        
        if existing_user.school_id == token.school_id:
            return jsonify({"error": "Vous êtes déjà inscrit dans cette école"}), 400
        
        if existing_user.school_id and not confirm_transfer:
            return jsonify({
                "error": "Confirmation requise", 
                "requires_confirmation": True,
                "message": f"Vous êtes déjà dans l'école {existing_user.school.name}. Confirmez le transfert."
            }), 400
        
        # Vérifier le mot de passe pour les utilisateurs existants
        if not data.get('password'):
            return jsonify({"error": "Mot de passe requis pour les comptes existants"}), 400
        
        # Vérifier que le typeDeveloppeur est fourni si l'utilisateur n'en a pas
        if not existing_user.typeDeveloppeur and not data.get('typeDeveloppeur'):
            return jsonify({"error": "Vous devez définir votre type de développeur pour rejoindre une école"}), 400
        
        # Validation du typeDeveloppeur si fourni
        if data.get('typeDeveloppeur'):
            valid_types = ['FrontEnd', 'BackEnd', 'FullStack', 'Designer']
            if data['typeDeveloppeur'] not in valid_types:
                return jsonify({"error": f"Type de développeur invalide. Valeurs autorisées: {', '.join(valid_types)}"}), 400
        
        # Vérification exactement comme dans auth.py
        logging.info(f"Tentative de liaison pour {existing_user.email}")
        logging.info(f"Hash du mot de passe (premiers caractères): {existing_user.password[:50]}...")
        
        if not bcrypt.check_password_hash(existing_user.password, data['password']):
            return jsonify({"error": "Mot de passe incorrect"}), 401
        
        try:
            # Mettre à jour l'école de l'utilisateur existant
            old_school_name = existing_user.school.name if existing_user.school_id else "aucune école"
            existing_user.school_id = token.school_id
            
            # Mettre à jour les autres informations si fournies
            if data.get('typeDeveloppeur'):
                existing_user.typeDeveloppeur = data['typeDeveloppeur']
            if data.get('technologies'):
                existing_user.technologies = ','.join(data['technologies'])
            if data.get('etudes'):
                existing_user.etudes = data['etudes']
            if data.get('ambitions'):
                existing_user.ambitions = data['ambitions']
            if data.get('linkedin_url'):
                existing_user.linkedin_url = data['linkedin_url']
            if data.get('portfolio_url'):
                existing_user.portfolio_url = data['portfolio_url']
            if data.get('github_url'):
                existing_user.github_url = data['github_url']
            
            # Incrémenter le compteur d'utilisation du token
            token.use_token()
            
            db.session.commit()
            
            # Créer le token JWT pour la connexion automatique
            access_token = create_access_token(identity=existing_user.id)
            
            action = "transféré" if old_school_name != "aucune école" else "ajouté"
            
            return jsonify({
                "message": f"Compte {action} avec succès vers l'école {token.school.name}",
                "access_token": access_token,
                "user": {
                    "id": existing_user.id,
                    "nom": existing_user.nom,
                    "prenom": existing_user.prenom,
                    "email": existing_user.email,
                    "role": existing_user.role,
                    "school": token.school.to_dict()
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erreur lors du transfert de l'étudiant: {str(e)}")
            return jsonify({"error": "Erreur lors du transfert"}), 500
    
    else:
        # Nouvel utilisateur - vérifier les champs requis
        required_new_fields = ['nom', 'prenom', 'password', 'typeDeveloppeur']
        for field in required_new_fields:
            if field not in data:
                field_name = "type de développeur" if field == 'typeDeveloppeur' else field
                return jsonify({"error": f"Le champ {field_name} est requis pour un nouveau compte"}), 400
        
        # Validation supplémentaire pour typeDeveloppeur
        valid_types = ['FrontEnd', 'BackEnd', 'FullStack', 'Designer']
        if data['typeDeveloppeur'] not in valid_types:
            return jsonify({"error": f"Type de développeur invalide. Valeurs autorisées: {', '.join(valid_types)}"}), 400
    
        try:
            # Créer l'étudiant
            new_student = User(
                role='student',
                nom=data['nom'],
                prenom=data['prenom'],
                email=data['email'],
                password=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
                school_id=token.school_id,
                typeDeveloppeur=data.get('typeDeveloppeur'),
                technologies=','.join(data.get('technologies', [])) if data.get('technologies') else None,
                etudes=data.get('etudes'),
                ambitions=data.get('ambitions'),
                linkedin_url=data.get('linkedin_url'),
                portfolio_url=data.get('portfolio_url'),
                github_url=data.get('github_url')
            )
            
            db.session.add(new_student)
            
            # Incrémenter le compteur d'utilisation du token
            token.use_token()
            
            db.session.commit()
            
            # Créer le token JWT pour la connexion automatique
            access_token = create_access_token(identity=new_student.id)
            
            return jsonify({
                "message": f"Inscription réussie dans l'école {token.school.name}",
                "access_token": access_token,
                "user": {
                    "id": new_student.id,
                    "nom": new_student.nom,
                    "prenom": new_student.prenom,
                    "email": new_student.email,
                    "role": new_student.role,
                    "school": token.school.to_dict()
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erreur lors de l'inscription de l'étudiant: {str(e)}")
            return jsonify({"error": "Erreur lors de l'inscription"}), 500

# ===============================
# STATISTIQUES POUR L'ÉCOLE
# ===============================

@school_partnership_bp.route('/school/students', methods=['GET'])
@jwt_required()
def list_school_students():
    """Obtenir la liste des étudiants de l'école"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'school_admin' or not user.school_id:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        
        # Query de base
        query = User.query.filter_by(school_id=user.school_id, role='student')
        
        # Filtrage par recherche
        if search:
            query = query.filter(
                db.or_(
                    User.nom.ilike(f'%{search}%'),
                    User.prenom.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )
        
        # Pagination
        students_pagination = query.order_by(User.prenom, User.nom).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        students_data = []
        for student in students_pagination.items:
            student_dict = {
                'id': student.id,
                'nom': student.nom,
                'prenom': student.prenom,
                'email': student.email,
                'formation': student.etudes,
                'niveau_etudes': student.typeDeveloppeur,
                'technologies': student.technologies.split(',') if student.technologies else [],
                'linkedin_url': student.linkedin_url,
                'portfolio_url': student.portfolio_url,
                'github_url': student.github_url,
                'created_at': student.id  # Approximation, pas de champ created_at dans User
            }
            
            # Compter les projets de l'étudiant
            project_count = len(student.projects.all())
            student_dict['project_count'] = project_count
            
            students_data.append(student_dict)
        
        return jsonify({
            "students": students_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": students_pagination.total,
                "pages": students_pagination.pages,
                "has_next": students_pagination.has_next,
                "has_prev": students_pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des étudiants: {str(e)}")
        return jsonify({"error": "Erreur lors de la récupération des étudiants"}), 500

@school_partnership_bp.route('/school/stats', methods=['GET'])
@jwt_required()
def get_school_stats():
    """Obtenir les statistiques de l'école"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'school_admin' or not user.school_id:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    try:
        # Compter les étudiants
        total_students = User.query.filter_by(school_id=user.school_id, role='student').count()
        
        # Compter les tokens
        total_tokens = SchoolRegistrationToken.query.filter_by(school_id=user.school_id).count()
        active_tokens = SchoolRegistrationToken.query.filter_by(school_id=user.school_id, is_active=True).count()
        
        # Compter les projets créés par les étudiants de l'école
        students = User.query.filter_by(school_id=user.school_id, role='student').all()
        total_projects = 0
        for student in students:
            total_projects += len(student.projects.all())
        
        return jsonify({
            "total_students": total_students,
            "active_tokens": active_tokens,
            "total_tokens": total_tokens,
            "total_projects": total_projects
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({"error": "Erreur lors de la récupération des statistiques"}), 500

@school_partnership_bp.route('/school/student/<string:student_id>/profile', methods=['GET'])
@jwt_required()
def get_student_profile(student_id):
    """Récupérer le profil d'un étudiant pour l'école"""
    try:
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(current_user_id)
        
        if not admin_user or admin_user.role != 'school_admin' or not admin_user.school_id:
            return jsonify({"error": "Accès non autorisé"}), 403
        
        school = School.query.get(admin_user.school_id)
        if not school:
            return jsonify({"error": "École non trouvée"}), 404
        
        # Vérifier que l'étudiant appartient à cette école
        student = User.query.filter_by(id=student_id, school_id=school.id, role='student').first()
        if not student:
            return jsonify({"error": "Étudiant non trouvé ou n'appartient pas à cette école"}), 404
        
        profile_data = {
            "id": student.id,
            "prenom": student.prenom,
            "nom": student.nom,
            "role": student.role,
            "email": student.email,  # L'école peut voir l'email de ses étudiants
            "typeDeveloppeur": student.typeDeveloppeur,
            "technologies": student.technologies.split(',') if student.technologies else [],
            "etudes": student.etudes,
            "ambitions": student.ambitions,
            "linkedin_url": student.linkedin_url,
            "portfolio_url": student.portfolio_url,
            "github_url": student.github_url,
            "school": {
                "id": school.id,
                "name": school.name
            }
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@school_partnership_bp.route('/school/student/<string:student_id>/cv-projects', methods=['GET'])
@jwt_required()
def get_student_cv_projects(student_id):
    """Récupérer les projets CV d'un étudiant pour l'école"""
    try:
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(current_user_id)
        
        if not admin_user or admin_user.role != 'school_admin' or not admin_user.school_id:
            return jsonify({"error": "Accès non autorisé"}), 403
        
        school = School.query.get(admin_user.school_id)
        if not school:
            return jsonify({"error": "École non trouvée"}), 404
        
        # Vérifier que l'étudiant appartient à cette école
        student = User.query.filter_by(id=student_id, school_id=school.id, role='student').first()
        if not student:
            return jsonify({"error": "Étudiant non trouvé ou n'appartient pas à cette école"}), 404
        
        # Récupérer les projets CV
        cv_projects = CVProject.query.filter_by(user_id=student_id).all()
        cv_projects_list = []
        
        for cv_project in cv_projects:
            project_dict = cv_project.to_dict()
            
            # Si l'étudiant est l'entrepreneur/créateur du projet, montrer toutes les tâches
            project = Project.query.get(cv_project.project_id)
            if student and student.role == 'businessman' and project and project.creator_id == student_id:
                user_tasks = Task.query.filter_by(project_id=cv_project.project_id).all()
            else:
                # Sinon, ne montrer que les tâches assignées à l'étudiant
                user_tasks = Task.query.filter_by(
                    project_id=cv_project.project_id,
                    assignee_id=student_id
                ).all()
            
            project_dict['tasks'] = [task.to_dict() for task in user_tasks]
            cv_projects_list.append(project_dict)
        
        # Pour les entrepreneurs, ajouter automatiquement leurs projets créés
        if student.role == 'businessman':
            created_projects = Project.query.filter_by(creator_id=student_id).all()
            
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
                        'id': f"created_{project.id}",
                        'user_id': student_id,
                        'project_id': project.id,
                        'project_name': project.name,
                        'role': 'Créateur/Entrepreneur',
                        'start_date': project.creation_date.isoformat(),
                        'end_date': None,
                        'team_size': team_size,
                        'description': project.description,
                        'tasks': [task.to_dict() for task in user_tasks]
                    }
                    cv_projects_list.append(created_cv_project)
        
        return jsonify({"projects": cv_projects_list}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500 