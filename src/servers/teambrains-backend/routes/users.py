from flask import Blueprint, jsonify, request
from models import db, User, Project 
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User
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
        "typeDeveloppeur": user.typeDeveloppeur 
    }), 200


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

@users.route('/delete_user/<string:user_id>', methods=['DELETE'])
@role_required('admin') 
@jwt_required()
def delete_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"message": "Utilisateur non trouvé"}), 404
    
    # Tentative de suppression de l'utilisateur
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Utilisateur supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Impossible de supprimer l'utilisateur.", "error": str(e)}), 500
