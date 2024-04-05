from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User

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