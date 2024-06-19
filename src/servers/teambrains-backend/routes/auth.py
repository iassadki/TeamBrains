from flask import Flask, Blueprint, request, jsonify, current_app, session
from extensions import bcrypt
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User 
import jwt
import datetime
from flask_jwt_extended import create_access_token, set_access_cookies

auth = Blueprint('auth', __name__)

@auth.route('/signup', methods=['POST'])
def register():
    data = request.json
    user_data = data['data']
    current_app.logger.info(data)
    
    user_exists = User.query.filter_by(email=user_data['email']).first() is not None
 
    if user_exists:
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')

    technologies_str = ','.join(user_data['technologies']) if 'technologies' in user_data and user_data['technologies'] else ''
    
    new_user = User(
        role=user_data['role'],
        nom=user_data['nom'],
        prenom=user_data['prenom'],
        email=user_data['email'],
        password=hashed_password,
        typeDeveloppeur=user_data.get('typeDeveloppeur'),
        technologies=technologies_str
    )
    
    db.session.add(new_user)
    
    try:
        db.session.commit()

        additional_claims = {"role": new_user.role}
        access_token = create_access_token(identity=str(new_user.id), additional_claims=additional_claims, expires_delta=datetime.timedelta(minutes=120))

        return jsonify({
            "accessToken": access_token
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error('Erreur lors de l\'enregistrement de l\'utilisateur : %s', e)
        return jsonify({'message': 'Erreur lors de l\'enregistrement de l\'utilisateur'}), 500


@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user is None:
        return jsonify({"error": "Unauthorized Access"}), 401

    if not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"error": "Unauthorized"}), 401

    additional_claims = {"role": user.role}
    # Générer le token avec les claims personnalisés
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims, expires_delta=datetime.timedelta(minutes=120))
                                       
    return jsonify({
        "accessToken": access_token
    }), 200