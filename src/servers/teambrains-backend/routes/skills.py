from flask import Blueprint, request, jsonify
from models import db, User, Skill, UserSkill
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_, and_

skills_bp = Blueprint('skills', __name__, url_prefix='/skills')

@skills_bp.route('/create', methods=['POST'])
@jwt_required()
def create_skill():
    """Créer une nouvelle compétence dans le système"""
    data = request.json
    
    if not data or not 'name' in data:
        return jsonify({"error": "Le nom de la compétence est requis"}), 400
    
    existing_skill = Skill.query.filter_by(name=data['name']).first()
    if existing_skill:
        return jsonify({"error": "Cette compétence existe déjà"}), 409
    
    skill = Skill(
        name=data['name'],
        category=data.get('category'),
        description=data.get('description')
    )
    
    db.session.add(skill)
    db.session.commit()
    
    return jsonify({
        "message": "Compétence créée avec succès",
        "skill": skill.to_dict()
    }), 201

@skills_bp.route('/list', methods=['GET'])
@jwt_required()
def get_all_skills():
    """Récupérer toutes les compétences disponibles"""
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = Skill.query.filter_by(is_active=True)
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        query = query.filter(Skill.name.ilike(f'%{search}%'))
    
    skills = query.order_by(Skill.name).all()
    
    return jsonify({
        "skills": [skill.to_dict() for skill in skills]
    }), 200

@skills_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_skill_categories():
    """Récupérer toutes les catégories de compétences"""
    categories = db.session.query(Skill.category).filter(
        Skill.category.isnot(None),
        Skill.is_active == True
    ).distinct().all()
    
    category_list = [cat[0] for cat in categories if cat[0]]
    
    return jsonify({
        "categories": sorted(category_list)
    }), 200

@skills_bp.route('/user/add', methods=['POST'])
@jwt_required()
def add_user_skill():
    """Ajouter une compétence à un utilisateur"""
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or not 'skill_id' in data:
        return jsonify({"error": "L'ID de la compétence est requis"}), 400
    
    if 'level' in data and data['level'] not in ['débutant', 'intermédiaire', 'avancé']:
        return jsonify({"error": "Le niveau doit être 'débutant', 'intermédiaire' ou 'avancé'"}), 400
    
    skill = Skill.query.get(data['skill_id'])
    if not skill:
        return jsonify({"error": "La compétence spécifiée n'existe pas"}), 404
    
    existing_user_skill = UserSkill.query.filter_by(
        user_id=current_user_id,
        skill_id=data['skill_id']
    ).first()
    
    if existing_user_skill:
        return jsonify({"error": "Vous avez déjà cette compétence"}), 409
    
    if 'self_assessment' in data:
        if not isinstance(data['self_assessment'], int) or not (1 <= data['self_assessment'] <= 10):
            return jsonify({"error": "L'auto-évaluation doit être un nombre entre 1 et 10"}), 400
    
    user_skill = UserSkill(
        user_id=current_user_id,
        skill_id=data['skill_id'],
        level=data.get('level', 'débutant'),
        experience_years=data.get('experience_years'),
        self_assessment=data.get('self_assessment'),
        notes=data.get('notes')
    )
    
    db.session.add(user_skill)
    db.session.commit()
    
    return jsonify({
        "message": "Compétence ajoutée avec succès",
        "user_skill": user_skill.to_dict()
    }), 201

@skills_bp.route('/user/update/<int:user_skill_id>', methods=['PUT'])
@jwt_required()
def update_user_skill(user_skill_id):
    """Mettre à jour une compétence de l'utilisateur"""
    current_user_id = get_jwt_identity()
    data = request.json
    
    user_skill = UserSkill.query.get(user_skill_id)
    if not user_skill:
        return jsonify({"error": "La compétence utilisateur spécifiée n'existe pas"}), 404
    
    if user_skill.user_id != current_user_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à modifier cette compétence"}), 403
    
    if 'level' in data and data['level'] not in ['débutant', 'intermédiaire', 'avancé']:
        return jsonify({"error": "Le niveau doit être 'débutant', 'intermédiaire' ou 'avancé'"}), 400
    
    if 'self_assessment' in data:
        if not isinstance(data['self_assessment'], int) or not (1 <= data['self_assessment'] <= 10):
            return jsonify({"error": "L'auto-évaluation doit être un nombre entre 1 et 10"}), 400
    
    if 'level' in data:
        user_skill.level = data['level']
    if 'experience_years' in data:
        user_skill.experience_years = data['experience_years']
    if 'self_assessment' in data:
        user_skill.self_assessment = data['self_assessment']
    if 'notes' in data:
        user_skill.notes = data['notes']
    
    user_skill.last_updated = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "message": "Compétence mise à jour avec succès",
        "user_skill": user_skill.to_dict()
    }), 200

@skills_bp.route('/user/remove/<int:user_skill_id>', methods=['DELETE'])
@jwt_required()
def remove_user_skill(user_skill_id):
    """Supprimer une compétence de l'utilisateur"""
    current_user_id = get_jwt_identity()
    
    user_skill = UserSkill.query.get(user_skill_id)
    if not user_skill:
        return jsonify({"error": "La compétence utilisateur spécifiée n'existe pas"}), 404
    
    if user_skill.user_id != current_user_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à supprimer cette compétence"}), 403
    
    db.session.delete(user_skill)
    db.session.commit()
    
    return jsonify({"message": "Compétence supprimée avec succès"}), 200

@skills_bp.route('/user/list', methods=['GET'])
@jwt_required()
def get_user_skills():
    """Récupérer toutes les compétences de l'utilisateur connecté"""
    current_user_id = get_jwt_identity()
    
    user_skills = UserSkill.query.filter_by(user_id=current_user_id).all()
    
    return jsonify({
        "user_skills": [user_skill.to_dict() for user_skill in user_skills]
    }), 200

@skills_bp.route('/user/<user_id>/list', methods=['GET'])
@jwt_required()
def get_other_user_skills(user_id):
    """Récupérer les compétences d'un autre utilisateur"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "L'utilisateur spécifié n'existe pas"}), 404
    
    user_skills = UserSkill.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        "user_id": user_id,
        "user_name": f"{user.prenom} {user.nom}",
        "user_skills": [user_skill.to_dict() for user_skill in user_skills]
    }), 200

@skills_bp.route('/user/by-level/<level>', methods=['GET'])
@jwt_required()
def get_user_skills_by_level(level):
    """Récupérer les compétences de l'utilisateur par niveau"""
    current_user_id = get_jwt_identity()
    
    if level not in ['débutant', 'intermédiaire', 'avancé']:
        return jsonify({"error": "Le niveau doit être 'débutant', 'intermédiaire' ou 'avancé'"}), 400
    
    user_skills = UserSkill.query.filter_by(
        user_id=current_user_id,
        level=level
    ).all()
    
    return jsonify({
        "level": level,
        "user_skills": [user_skill.to_dict() for user_skill in user_skills]
    }), 200

@skills_bp.route('/search-users', methods=['GET'])
@jwt_required()
def search_users_by_skills():
    """Rechercher des utilisateurs par compétences"""
    skill_names = request.args.getlist('skills')  
    level = request.args.get('level')  
    
    if not skill_names:
        return jsonify({"error": "Au moins une compétence doit être spécifiée"}), 400
    
    if level and level not in ['débutant', 'intermédiaire', 'avancé']:
        return jsonify({"error": "Le niveau doit être 'débutant', 'intermédiaire' ou 'avancé'"}), 400
    
    query = db.session.query(User).join(UserSkill).join(Skill)
    
    skill_conditions = [Skill.name.in_(skill_names)]
    query = query.filter(and_(*skill_conditions))
    
    if level:
        level_order = {'débutant': 1, 'intermédiaire': 2, 'avancé': 3}
        min_level_value = level_order[level]
        
        level_conditions = []
        for lvl, value in level_order.items():
            if value >= min_level_value:
                level_conditions.append(UserSkill.level == lvl)
        
        query = query.filter(or_(*level_conditions))
    
    users = query.distinct().all()
    
    result = []
    for user in users:
        user_data = {
            "user_id": user.id,
            "user_name": f"{user.prenom} {user.nom}",
            "user_email": user.email,
            "matching_skills": []
        }
        
        matching_user_skills = UserSkill.query.join(Skill).filter(
            UserSkill.user_id == user.id,
            Skill.name.in_(skill_names)
        ).all()
        
        for user_skill in matching_user_skills:
            user_data["matching_skills"].append(user_skill.to_dict())
        
        result.append(user_data)
    
    return jsonify({
        "searched_skills": skill_names,
        "minimum_level": level,
        "users_found": len(result),
        "users": result
    }), 200

@skills_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_skills_stats():
    """Obtenir des statistiques sur les compétences"""
    current_user_id = get_jwt_identity()
    
    total_skills = Skill.query.filter_by(is_active=True).count()
    user_skills_count = UserSkill.query.filter_by(user_id=current_user_id).count()
    
    level_stats = {}
    for level in ['débutant', 'intermédiaire', 'avancé']:
        count = UserSkill.query.filter_by(user_id=current_user_id, level=level).count()
        level_stats[level] = count
    
    category_stats = db.session.query(
        Skill.category,
        db.func.count(UserSkill.id)
    ).join(UserSkill).filter(
        UserSkill.user_id == current_user_id
    ).group_by(Skill.category).all()
    
    category_dict = {cat: count for cat, count in category_stats if cat}
    
    popular_skills = db.session.query(
        Skill.name,
        db.func.count(UserSkill.id).label('user_count')
    ).join(UserSkill).group_by(Skill.id, Skill.name).order_by(
        db.func.count(UserSkill.id).desc()
    ).limit(10).all()
    
    return jsonify({
        "total_available_skills": total_skills,
        "user_skills_count": user_skills_count,
        "completion_percentage": (user_skills_count / total_skills * 100) if total_skills > 0 else 0,
        "level_distribution": level_stats,
        "category_distribution": category_dict,
        "most_popular_skills": [
            {"skill_name": skill, "user_count": count}
            for skill, count in popular_skills
        ]
    }), 200

@skills_bp.route('/bulk-add', methods=['POST'])
@jwt_required()
def bulk_add_skills():
    """Ajouter plusieurs compétences en une fois"""
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or not 'skills' in data or not isinstance(data['skills'], list):
        return jsonify({"error": "Une liste de compétences est requise"}), 400
    
    added_skills = []
    errors = []
    
    for skill_data in data['skills']:
        try:
            if not 'skill_id' in skill_data:
                errors.append(f"ID de compétence manquant pour une entrée")
                continue
            
            existing = UserSkill.query.filter_by(
                user_id=current_user_id,
                skill_id=skill_data['skill_id']
            ).first()
            
            if existing:
                errors.append(f"Compétence avec l'ID {skill_data['skill_id']} déjà présente")
                continue
            
            level = skill_data.get('level', 'débutant')
            if level not in ['débutant', 'intermédiaire', 'avancé']:
                errors.append(f"Niveau invalide pour la compétence {skill_data['skill_id']}")
                continue
            
            user_skill = UserSkill(
                user_id=current_user_id,
                skill_id=skill_data['skill_id'],
                level=level,
                experience_years=skill_data.get('experience_years'),
                self_assessment=skill_data.get('self_assessment'),
                notes=skill_data.get('notes')
            )
            
            db.session.add(user_skill)
            added_skills.append(skill_data['skill_id'])
            
        except Exception as e:
            errors.append(f"Erreur pour la compétence {skill_data.get('skill_id', 'inconnue')}: {str(e)}")
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de l'enregistrement: {str(e)}"}), 500
    
    return jsonify({
        "message": f"{len(added_skills)} compétences ajoutées avec succès",
        "added_skills": added_skills,
        "errors": errors
    }), 201 if len(added_skills) > 0 else 400