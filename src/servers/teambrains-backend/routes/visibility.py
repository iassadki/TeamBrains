from flask import Blueprint, request, jsonify
from models import db, User, Project, CVProject, CVVisibility, UserSkill
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

visibility_bp = Blueprint('visibility', __name__, url_prefix='/visibility')

@visibility_bp.route('/project/<int:project_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_project_visibility(project_id):
    """Activer/désactiver la visibilité publique d'un projet"""
    current_user_id = get_jwt_identity()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    if project.creator_id != current_user_id:
        return jsonify({"error": "Seul le créateur du projet peut modifier sa visibilité"}), 403
    
    data = request.json
    if 'is_public' not in data:
        return jsonify({"error": "Le champ 'is_public' est requis"}), 400
    
    project.is_public = data['is_public']
    db.session.commit()
    
    status = "public" if project.is_public else "privé"
    
    return jsonify({
        "message": f"Projet mis en {status} avec succès",
        "project": project.to_dict()
    }), 200

@visibility_bp.route('/project/<int:project_id>/status', methods=['GET'])
@jwt_required()
def get_project_visibility(project_id):
    """Obtenir le statut de visibilité d'un projet"""
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Le projet spécifié n'existe pas"}), 404
    
    return jsonify({
        "project_id": project_id,
        "project_name": project.name,
        "is_public": project.is_public,
        "creator_id": project.creator_id
    }), 200

@visibility_bp.route('/cv/toggle', methods=['PUT'])
@jwt_required()
def toggle_cv_visibility():
    """Activer/désactiver la visibilité publique du CV"""
    current_user_id = get_jwt_identity()
    data = request.json
    
    if 'is_public' not in data:
        return jsonify({"error": "Le champ 'is_public' est requis"}), 400
    
    cv_visibility = CVVisibility.query.filter_by(user_id=current_user_id).first()
    
    if not cv_visibility:
        cv_visibility = CVVisibility(user_id=current_user_id)
        db.session.add(cv_visibility)
    
    cv_visibility.is_public = data['is_public']
    
    if 'show_personal_info' in data:
        cv_visibility.show_personal_info = data['show_personal_info']
    if 'show_contact_info' in data:
        cv_visibility.show_contact_info = data['show_contact_info']
    if 'show_skills' in data:
        cv_visibility.show_skills = data['show_skills']
    if 'show_projects' in data:
        cv_visibility.show_projects = data['show_projects']
    
    db.session.commit()
    
    status = "public" if cv_visibility.is_public else "privé"
    
    return jsonify({
        "message": f"CV mis en {status} avec succès",
        "cv_visibility": cv_visibility.to_dict()
    }), 200

@visibility_bp.route('/cv/settings', methods=['GET'])
@jwt_required()
def get_cv_visibility_settings():
    """Récupérer les paramètres de visibilité du CV"""
    current_user_id = get_jwt_identity()
    
    cv_visibility = CVVisibility.query.filter_by(user_id=current_user_id).first()
    
    if not cv_visibility:
        cv_visibility = CVVisibility(user_id=current_user_id)
        db.session.add(cv_visibility)
        db.session.commit()
    
    return jsonify({
        "cv_visibility": cv_visibility.to_dict()
    }), 200

@visibility_bp.route('/cv/project/<int:cv_project_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_cv_project_visibility(cv_project_id):
    """Activer/désactiver la visibilité d'un projet dans le CV"""
    current_user_id = get_jwt_identity()
    
    cv_project = CVProject.query.get(cv_project_id)
    if not cv_project:
        return jsonify({"error": "Le projet CV spécifié n'existe pas"}), 404
    
    if cv_project.user_id != current_user_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à modifier ce projet"}), 403
    
    data = request.json
    if 'is_visible' not in data:
        return jsonify({"error": "Le champ 'is_visible' est requis"}), 400
    
    cv_project.is_visible = data['is_visible']
    db.session.commit()
    
    status = "visible" if cv_project.is_visible else "masqué"
    
    return jsonify({
        "message": f"Projet {status} dans le CV avec succès",
        "cv_project": cv_project.to_dict()
    }), 200

@visibility_bp.route('/projects/public', methods=['GET'])
def get_public_projects():
    """Récupérer tous les projets publics (accessible sans authentification)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    per_page = min(per_page, 50)
    
    query = Project.query.filter_by(is_public=True)
    
    if search:
        query = query.filter(
            db.or_(
                Project.name.ilike(f'%{search}%'),
                Project.description.ilike(f'%{search}%')
            )
        )
    
    paginated_projects = query.order_by(Project.creation_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    projects_list = []
    for project in paginated_projects.items:
        creator = User.query.get(project.creator_id)
        
        project_data = project.to_dict()
        project_data['creator_name'] = f"{creator.prenom} {creator.nom}" if creator else "Inconnu"
        project_data['member_count'] = len(project.members)
        
        projects_list.append(project_data)
    
    return jsonify({
        "projects": projects_list,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": paginated_projects.total,
            "pages": paginated_projects.pages,
            "has_next": paginated_projects.has_next,
            "has_prev": paginated_projects.has_prev
        }
    }), 200

@visibility_bp.route('/cv/<user_id>/public', methods=['GET'])
def get_public_cv(user_id):
    """Récupérer le CV public d'un utilisateur (accessible sans authentification)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404
    
    cv_visibility = CVVisibility.query.filter_by(user_id=user_id).first()
    
    if not cv_visibility or not cv_visibility.is_public:
        return jsonify({"error": "Ce CV n'est pas public"}), 403
    
    cv_data = {
        "user_id": user_id,
        "visibility_settings": cv_visibility.to_dict()
    }
    
    if cv_visibility.show_personal_info:
        cv_data["personal_info"] = {
            "prenom": user.prenom,
            "nom": user.nom,
            "role": user.role,
            "typeDeveloppeur": user.typeDeveloppeur,
            "etudes": user.etudes,
            "ambitions": user.ambitions
        }
    
    if cv_visibility.show_contact_info:
        cv_data["contact_info"] = {
            "email": user.email,
            "linkedin_url": user.linkedin_url,
            "portfolio_url": user.portfolio_url,
            "github_url": user.github_url
        }
    
    if cv_visibility.show_skills:
        user_skills = UserSkill.query.filter_by(user_id=user_id).all()
        cv_data["skills"] = [skill.to_dict() for skill in user_skills]
    
    if cv_visibility.show_projects:
        cv_projects = CVProject.query.filter_by(user_id=user_id, is_visible=True).all()
        projects_list = []
        
        for cv_project in cv_projects:
            project_data = cv_project.to_dict()
            
            if cv_project.project and cv_project.project.is_public:
                project_data["project_is_public"] = True
                project_data["project_status"] = cv_project.project.status
            else:
                project_data["project_is_public"] = False
            
            projects_list.append(project_data)
        
        cv_data["projects"] = projects_list
    
    return jsonify({
        "cv": cv_data
    }), 200

@visibility_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_visibility_stats():
    """Obtenir des statistiques sur la visibilité des projets et CVs"""
    current_user_id = get_jwt_identity()
    
    user_projects = Project.query.filter_by(creator_id=current_user_id).all()
    public_projects_count = sum(1 for p in user_projects if p.is_public)
    
    cv_visibility = CVVisibility.query.filter_by(user_id=current_user_id).first()
    cv_projects = CVProject.query.filter_by(user_id=current_user_id).all()
    visible_cv_projects_count = sum(1 for p in cv_projects if p.is_visible)
    
    total_public_projects = Project.query.filter_by(is_public=True).count()
    total_public_cvs = CVVisibility.query.filter_by(is_public=True).count()
    
    return jsonify({
        "user_stats": {
            "total_projects_created": len(user_projects),
            "public_projects": public_projects_count,
            "private_projects": len(user_projects) - public_projects_count,
            "cv_is_public": cv_visibility.is_public if cv_visibility else False,
            "total_cv_projects": len(cv_projects),
            "visible_cv_projects": visible_cv_projects_count,
            "hidden_cv_projects": len(cv_projects) - visible_cv_projects_count
        },
        "global_stats": {
            "total_public_projects": total_public_projects,
            "total_public_cvs": total_public_cvs
        }
    }), 200

@visibility_bp.route('/cv/bulk-toggle', methods=['PUT'])
@jwt_required()
def bulk_toggle_cv_projects():
    """Modifier la visibilité de plusieurs projets CV en une fois"""
    current_user_id = get_jwt_identity()
    data = request.json
    
    if not data or 'project_ids' not in data or 'is_visible' not in data:
        return jsonify({"error": "Les champs 'project_ids' et 'is_visible' sont requis"}), 400
    
    project_ids = data['project_ids']
    is_visible = data['is_visible']
    
    cv_projects = CVProject.query.filter(
        CVProject.id.in_(project_ids),
        CVProject.user_id == current_user_id
    ).all()
    
    if len(cv_projects) != len(project_ids):
        return jsonify({"error": "Certains projets spécifiés ne vous appartiennent pas"}), 403
    
    for cv_project in cv_projects:
        cv_project.is_visible = is_visible
    
    db.session.commit()
    
    status = "visibles" if is_visible else "masqués"
    
    return jsonify({
        "message": f"{len(cv_projects)} projets rendus {status} dans le CV",
        "updated_projects": [cv_project.to_dict() for cv_project in cv_projects]
    }), 200