from flask import Blueprint, jsonify, request
from models import db, User, Project 
from flask_jwt_extended import jwt_required, get_jwt_identity
from decorators import role_required

users = Blueprint('users', __name__)

@users.route('/current_user', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    return jsonify({
        "id": user.id,
        "prenom": user.prenom,
        "nom": user.nom
    }), 200

@users.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    return jsonify({
        "prenom": user.prenom,
        "nom": user.nom,
        "role": user.role,
        "email": user.email,
        "typeDeveloppeur": user.typeDeveloppeur,
        "technologies": user.technologies.split(',') if user.technologies else []
    }), 200

@users.route('/profile/<string:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Récupérer le profil public d'un utilisateur"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    # Profil public - ne pas exposer l'email et d'autres infos sensibles
    profile_data = {
        "id": user.id,
        "prenom": user.prenom,
        "nom": user.nom,
        "role": user.role,
        "typeDeveloppeur": user.typeDeveloppeur,
        "technologies": user.technologies.split(',') if user.technologies else [],
        "etudes": user.etudes,
        "ambitions": user.ambitions,
        "linkedin_url": user.linkedin_url,
        "portfolio_url": user.portfolio_url,
        "github_url": user.github_url
    }
    
    # Si c'est un étudiant, inclure les infos de l'école
    if user.role == 'student' and user.school_id:
        from models import School
        school = School.query.get(user.school_id)
        if school:
            profile_data["school"] = {
                "id": school.id,
                "name": school.name
            }

    return jsonify(profile_data), 200

@users.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    data = request.get_json()
    user.prenom = data.get("prenom", user.prenom)
    user.nom = data.get("nom", user.nom)
    user.email = data.get("email", user.email)
    user.typeDeveloppeur = data.get("typeDeveloppeur", user.typeDeveloppeur)
    user.technologies = ','.join(data.get("technologies", user.technologies.split(',')))
    
    # Permettre la mise à jour du school_id pour les étudiants
    if 'school_id' in data and user.role == 'student':
        user.school_id = data.get("school_id")

    try:
        db.session.commit()
        return jsonify({
            "prenom": user.prenom,
            "nom": user.nom,
            "role": user.role,
            "email": user.email,
            "typeDeveloppeur": user.typeDeveloppeur,
            "technologies": user.technologies.split(','),
            "school_id": user.school_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Erreur lors de la mise à jour des données utilisateur.", "error": str(e)}), 500

@users.route('/all_users', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_all_users():
    users = User.query.all()
    users_data = [{
        "id": user.id,
        "nom": user.nom,
        "prenom": user.prenom,
        "role": user.role,
        "email": user.email,
        "typeDeveloppeur": user.typeDeveloppeur
    } for user in users]

    return jsonify(users_data), 200

@users.route('/delete_account', methods=['DELETE'])
@jwt_required()
def delete_own_account():
    """Permet à un utilisateur de supprimer son propre compte (RGPD) avec anonymisation"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    # Vérifier le mot de passe pour sécuriser l'opération
    data = request.get_json()
    password = data.get('password')
    
    if not password:
        return jsonify({"message": "Mot de passe requis pour supprimer le compte"}), 400
    
    # Vérifier le mot de passe (utiliser bcrypt comme dans les autres routes)
    import bcrypt
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"message": "Mot de passe incorrect"}), 400

    try:
        # Importer les modèles nécessaires pour l'anonymisation
        from models import Task, project_members
        import uuid
        
        # Vérifier si l'utilisateur participe à des projets/tâches
        has_project_data = db.session.query(project_members).filter_by(user_id=user_id).count() > 0
        has_tasks = Task.query.filter_by(assignee_id=user_id).count() > 0
        
        if has_project_data or has_tasks:
            # ANONYMISATION : remplacer les données personnelles par des données anonymes
            anonymous_id = f"utilisateur-supprime-{str(uuid.uuid4())[:8]}"
            
            user.prenom = "Utilisateur"
            user.nom = "Supprimé"
            user.email = f"{anonymous_id}@supprime.local"
            user.password = "COMPTE_SUPPRIME"
            user.technologies = ""
            user.typeDeveloppeur = ""
            
            # Anonymiser aussi les données CV stockées dans le modèle User
            user.etudes = ""
            user.ambitions = ""
            user.linkedin_url = ""
            user.portfolio_url = ""
            user.github_url = ""
            
            # Note: is_active n'existe pas dans le modèle User, on le retire
            
            # Conserver les associations aux projets et tâches mais avec utilisateur anonymisé
            db.session.commit()
            
            return jsonify({
                "message": "Compte supprimé avec succès. Vos données personnelles ont été effacées et vos contributions aux projets ont été anonymisées conformément au RGPD."
            }), 200
            
        else:
            # SUPPRESSION COMPLETE : pas de données collaboratives
            db.session.delete(user)
            db.session.commit()
            
            return jsonify({
                "message": "Compte supprimé avec succès. Toutes vos données ont été effacées conformément au RGPD."
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Erreur lors de la suppression du compte", 
            "error": str(e)
        }), 500

@users.route('/delete_user/<string:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Utilisateur supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Impossible de supprimer l'utilisateur.", "error": str(e)}), 500
