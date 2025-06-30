from flask import Blueprint, request, jsonify
from models import db, User, Project, School, project_members, Task, Message
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

search_bp = Blueprint('search', __name__)

@search_bp.route('/global', methods=['GET'])
@jwt_required()
def global_search():
    try:
        # Récupérer l'utilisateur actuel
        current_user_id = get_jwt_identity()
        current_user = db.session.query(User).filter(User.id == current_user_id).first()
        
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'results': []})
        
        # 1. Recherche directe dans les projets
        projects_direct = db.session.query(Project).filter(
            or_(
                Project.name.ilike(f'%{query}%'),
                Project.description.ilike(f'%{query}%'),
                Project.status.ilike(f'%{query}%')
            )
        ).all()
        
        # 2. Recherche dans les projets via les noms des membres
        projects_via_members = db.session.query(Project).join(
            project_members, Project.id == project_members.c.project_id
        ).join(
            User, User.id == project_members.c.user_id
        ).filter(
            or_(
                User.nom.ilike(f'%{query}%'),
                User.prenom.ilike(f'%{query}%'),
                db.func.concat(User.prenom, ' ', User.nom).ilike(f'%{query}%'),
                db.func.concat(User.nom, ' ', User.prenom).ilike(f'%{query}%')
            )
        ).all()
        
        # Combiner et dédupliquer les projets
        all_projects = {p.id: p for p in projects_direct + projects_via_members}
        projects = list(all_projects.values())[:10]  # Limiter à 10
        
        # 3. Recherche exhaustive dans les utilisateurs
        users = db.session.query(User).filter(
            or_(
                User.nom.ilike(f'%{query}%'),
                User.prenom.ilike(f'%{query}%'),
                User.typeDeveloppeur.ilike(f'%{query}%'),
                User.technologies.ilike(f'%{query}%'),
                User.etudes.ilike(f'%{query}%'),
                User.ambitions.ilike(f'%{query}%'),
                # Recherche combinée nom + prénom dans les deux sens
                db.func.concat(User.prenom, ' ', User.nom).ilike(f'%{query}%'),
                db.func.concat(User.nom, ' ', User.prenom).ilike(f'%{query}%')
            )
        ).limit(10).all()
        
        # 4. Recherche dans les tâches (seulement pour les projets où l'utilisateur participe)
        tasks = []
        user_project_ids = []
        if current_user:
            # Récupérer les projets de l'utilisateur
            user_projects = db.session.query(project_members.c.project_id).filter_by(user_id=current_user_id).all()
            user_project_ids = [p[0] for p in user_projects]
            
            if user_project_ids:
                tasks = db.session.query(Task).filter(
                    and_(
                        Task.project_id.in_(user_project_ids),
                        or_(
                            Task.title.ilike(f'%{query}%'),
                            Task.description.ilike(f'%{query}%'),
                            Task.priority.ilike(f'%{query}%'),
                            Task.sprint.ilike(f'%{query}%')
                        )
                    )
                ).limit(5).all()

        # 5. Recherche dans les messages (seulement pour les projets où l'utilisateur participe)
        messages = []
        if current_user and user_project_ids:
            messages = db.session.query(Message).filter(
                and_(
                    Message.project_id.in_(user_project_ids),
                    Message.content.ilike(f'%{query}%')
                )
            ).limit(5).all()

        # 6. Recherche dans les écoles (si accessible)
        schools = []
        if current_user and current_user.role == 'admin':
            schools = db.session.query(School).filter(
                or_(
                    School.name.ilike(f'%{query}%'),
                    School.description.ilike(f'%{query}%'),
                    School.contact_email.ilike(f'%{query}%')
                )
            ).limit(5).all()
        
        # Formatage des résultats
        results = {
            'projects': [],
            'users': [],
            'tasks': [],
            'messages': [],
            'schools': []
        }
        
        # Projets
        for project in projects:
            # Récupérer les membres du projet
            members = db.session.query(User, project_members.c.role).join(
                project_members, (User.id == project_members.c.user_id)
            ).filter(project_members.c.project_id == project.id).all()
            
            project_members_list = []
            for user, role in members:
                project_members_list.append({
                    'user_id': user.id,
                    'name': f"{user.prenom} {user.nom}",
                    'role': role
                })
            
            results['projects'].append({
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'status': project.status,
                'creation_date': project.creation_date.isoformat() if project.creation_date else None,
                'project_slug': project.project_slug,
                'members': project_members_list,
                'type': 'project'
            })
        
        # Utilisateurs
        for user in users:
            results['users'].append({
                'id': user.id,
                'nom': user.nom,
                'prenom': user.prenom,
                'typeDeveloppeur': user.typeDeveloppeur,
                'technologies': user.technologies,
                'etudes': user.etudes,
                'type': 'user'
            })
        
        # Tâches
        for task in tasks:
            # Récupérer le projet associé
            project = Project.query.get(task.project_id)
            results['tasks'].append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'priority': task.priority,
                'sprint': task.sprint,
                'percent_completion': task.percent_completion,
                'project_id': task.project_id,
                'project_name': project.name if project else 'Projet inconnu',
                'project_slug': project.project_slug if project else None,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'type': 'task'
            })
        
        # Messages
        for message in messages:
            # Récupérer le projet et l'expéditeur
            project = Project.query.get(message.project_id)
            sender = User.query.get(message.sender_id)
            results['messages'].append({
                'id': message.id,
                'content': message.content[:200] + '...' if len(message.content) > 200 else message.content,  # Tronquer le contenu
                'project_id': message.project_id,
                'project_name': project.name if project else 'Projet inconnu',
                'project_slug': project.project_slug if project else None,
                'sender_name': f"{sender.prenom} {sender.nom}" if sender else 'Utilisateur inconnu',
                'timestamp': message.timestamp.isoformat() if message.timestamp else None,
                'type': 'message'
            })
        
        # Écoles (admin seulement)
        for school in schools:
            results['schools'].append({
                'id': school.id,
                'name': school.name,
                'description': school.description,
                'contact_email': school.contact_email,
                'type': 'school'
            })
        
        return jsonify({
            'query': query,
            'results': results,
            'total': len(projects) + len(users) + len(tasks) + len(messages) + len(schools)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 