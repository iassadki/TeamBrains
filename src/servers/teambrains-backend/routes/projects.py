from flask import Blueprint, request, jsonify
from models import db, User, Project, project_members, CVProject
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from dateutil import parser
from dateutil.tz import UTC
from slugify import slugify
from sqlalchemy.orm import joinedload

projects = Blueprint('projects', __name__)

@projects.route('/create_projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    project_name = data.get('name')

    project_slug = slugify(project_name)

    existing_project = Project.query.filter_by(name=project_name).first()
    if existing_project:
        return jsonify({"error": "Un projet avec ce nom existe déjà"}), 400

    new_project = Project(
        name=project_name,
        status=data['status'],
        description=data['description'],
        creator_id=user_id,
        project_slug=project_slug,
        is_public=data.get('is_public', False)  
    )
    db.session.add(new_project)
    db.session.commit()
    
    return jsonify({
        "message": "Projet créé avec succès", 
        "project_id": new_project.id,
        "project": new_project.to_dict()
    }), 201
@projects.route('/list_projects', methods=['GET'])
def list_projects():
    all_projects = Project.query.options(joinedload(Project.members)).all()
    projects_list = []

    for project in all_projects:
        members = db.session.query(User, project_members.c.role).join(
            project_members, (User.id == project_members.c.user_id)
        ).filter(project_members.c.project_id == project.id).all()

        members_list = [
            {
                'user_id': member.User.id,
                'name': f"{member.User.prenom} {member.User.nom}",
                'role': member.role
            } for member in members
        ]

        project_dict = {
            'id': project.id,
            'name': project.name,
            'project_slug': project.project_slug,
            'status': project.status,
            'description': project.description,
            'creation_date': project.creation_date.isoformat(),
            'creator_id': project.creator_id,
            'members': members_list
        }
        projects_list.append(project_dict)

    return jsonify(projects_list), 200

@projects.route('/get_project/<slug>', methods=['GET'])
def get_project(slug):
    project = Project.query.filter_by(project_slug=slug).first()
    if not project:
        return jsonify({"error": "Projet non trouvé"}), 404

    members = db.session.query(User, project_members.c.role).join(
        project_members, (User.id == project_members.c.user_id)
    ).filter(project_members.c.project_id == project.id).all()

    members_list = [
        {
            'user_id': member.User.id,
            'name': f"{member.User.prenom} {member.User.nom}",
            'role': member.role
        } for member in members
    ]

    project_data = {
        'id': project.id,
        'name': project.name,
        'project_slug': project.project_slug,
        'status': project.status,
        'description': project.description,
        'creation_date': project.creation_date.isoformat(),
        'creator_id': project.creator_id,
        'members': members_list
    }

    return jsonify(project_data), 200

@projects.route('/join_project/<int:project_id>', methods=['POST'])
@jwt_required()
def join_project(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Projet non trouvé"}), 404

    # Vérifiez si l'utilisateur est déjà membre du projet
    if db.session.query(project_members).filter_by(project_id=project_id, user_id=user_id).first():
        return jsonify({"error": "Utilisateur déjà membre du projet"}), 400
    
    role = user.typeDeveloppeur

    if role == "FullStack":
        backend_existe = db.session.query(project_members).filter_by(project_id=project_id, role="BackEnd").first() is not None
        frontend_existe = db.session.query(project_members).filter_by(project_id=project_id, role="FrontEnd").first() is not None
        fullstack_existe = db.session.query(project_members).filter_by(project_id=project_id, role="FullStack").first() is not None

        if fullstack_existe:
            if backend_existe and frontend_existe:
                return jsonify({"error": f"Tous les rôles sont déjà pris dans ce projet"}), 400
            elif backend_existe:
                role = "FrontEnd"
            elif frontend_existe:
                role = "BackEnd"     
            else:
                role = "BackEnd"
        else:
            role = "FullStack"
    else:
        existing_member = db.session.query(project_members).filter_by(project_id=project_id, role=role).first()
        if existing_member:
            return jsonify({"error": f"Le rôle {role} est déjà pris dans ce projet"}), 400

    # Ajoutez l'utilisateur au projet avec le rôle correspondant
    stmt = project_members.insert().values(project_id=project_id, user_id=user_id, role=role)
    db.session.execute(stmt)
    
    # Ajouter automatiquement le projet au CV
    team_size = db.session.query(project_members).filter_by(project_id=project_id).count()
    new_cv_project = CVProject(
        user_id=user_id,
        project_id=project_id,
        role=role,
        start_date=project.creation_date,
        end_date=datetime.utcnow(),
        team_size=team_size,
        description=project.description
    )
    db.session.add(new_cv_project)
    
    db.session.commit()

    return jsonify({
        "message": "Utilisateur ajouté au projet avec succès et projet ajouté au CV",
        "project": new_cv_project.to_dict()
    }), 200

@projects.route('/leave_project/<int:project_id>', methods=['POST'])
@jwt_required()
def leave_project(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Projet non trouvé"}), 404

    # Vérifiez si l'utilisateur est membre du projet
    if not db.session.query(project_members).filter_by(project_id=project_id, user_id=user_id).first():
        return jsonify({"error": "Utilisateur n'est pas membre du projet"}), 400

    # Retirez l'utilisateur du projet
    stmt = project_members.delete().where(project_members.c.project_id == project_id, project_members.c.user_id == user_id)
    db.session.execute(stmt)
    db.session.commit()

    return jsonify({"message": "Utilisateur retiré du projet avec succès"}), 200

@projects.route('/delete_project/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Projet supprimé avec succès"}), 200

@projects.route('/start_project/<int:project_id>', methods=['POST'])
@jwt_required()
def start_project(project_id):
    project = Project.query.get_or_404(project_id)
    member_roles = db.session.query(project_members.c.role).filter_by(project_id=project_id).all()
    roles = [role for (role,) in member_roles]

    if 'FullStack' in roles or ('BackEnd' in roles and 'FrontEnd' in roles):
        project.status = "in_progress"
        db.session.commit()
        return jsonify({"message": "Projet démarré avec succès"}), 200
    else:
        missing_roles = []
        if 'BackEnd' in roles or 'FrontEnd' in roles:
            if 'BackEnd' not in roles:
                missing_roles.append("un BackEnd")
            if 'FrontEnd' not in roles:
                missing_roles.append("un FrontEnd")            
            error_message = "Le projet ne peut être démarré car il manque les rôles nécessaires : " + ", ".join(missing_roles) + " ou un Fullstack" + "."
            return jsonify({"error": error_message}), 400
