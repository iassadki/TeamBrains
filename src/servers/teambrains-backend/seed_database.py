#!/usr/bin/env python3
"""
Script de seed automatique pour TeamBrains
S'exécute automatiquement après les migrations pour peupler la base de données
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import text
import random

# Ajouter le répertoire courant au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import (
    User, School, Skill, UserSkill, CVVisibility, Project, project_members,
    Task, SubTask, TaskValidation, SubTaskValidation, TaskStudent, Message,
    FileDocument, CVProject, SchoolToken, SchoolRegistrationToken,
    SchoolUsage, SchoolInvoice, Subscription, Invoice
)
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

def hash_pwd(pwd):
    return bcrypt.generate_password_hash(pwd).decode('utf-8')

# Technologies par type (depuis StepFour.jsx)
technologies = {
    'FrontEnd': ["HTML", "CSS", "JavaScript", "React", "Vue"],
    'BackEnd': ["Node.js", "Python", "Java", "PHP", "Ruby", "MongoDB", "SQL"],
    'FullStack': ["HTML", "CSS", "JavaScript", "Node.js", "React", "MongoDB", "SQL", "Ruby", "PHP", "Java", "Python", "Vue"],
    'Designer': ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
}
valid_types = ['FrontEnd', 'BackEnd', 'FullStack', 'Designer']

def random_type_and_techs(type_hint=None):
    """Retourne un typeDeveloppeur et une liste de technos cohérente (sous forme de string)"""
    if type_hint in valid_types:
        t = type_hint
    else:
        t = random.choice(valid_types)
    techs = random.sample(technologies[t], k=min(2, len(technologies[t])))
    return t, ','.join(techs)

def seed_database():
    """Insère le jeu de données complet dans la base"""
    print("🌱 Début du seeding de la base de données...")
    
    try:
        with app.app_context():
            # Vérifier si des données existent déjà
            if User.query.first():
                print("⚠️  Des données existent déjà, skipping le seed...")
                return
            
            print("📚 Création des écoles...")
            # Écoles
            school1 = School(
                id=1,
                name="École Polytechnique",
                description="Grande école d'ingénieurs",
                contact_email="contact@polytechnique.fr",
                website="https://polytechnique.fr",
                created_at=datetime.utcnow(),
                is_active=True
            )
            
            school2 = School(
                id=2,
                name="HEC Paris",
                description="École de commerce",
                contact_email="contact@hec.fr",
                website="https://hec.fr",
                created_at=datetime.utcnow(),
                is_active=True
            )
            
            db.session.add_all([school1, school2])
            db.session.commit()
            
            print("👥 Création des utilisateurs...")
            # Utilisateurs
            users = [
                User(id="u1", role="student", nom="Dupont", prenom="Alice", 
                     email="alice@polytechnique.fr", password=hash_pwd("alice123"), school_id=1, 
                     typeDeveloppeur="FrontEnd", technologies=','.join(technologies['FrontEnd'])),
                User(id="u2", role="student", nom="Martin", prenom="Bob", 
                     email="bob@polytechnique.fr", password=hash_pwd("bob123"), school_id=1, 
                     typeDeveloppeur="BackEnd", technologies=','.join(technologies['BackEnd'])),
                User(id="u3", role="student", nom="Durand", prenom="Chloé", 
                     email="chloe@hec.fr", password=hash_pwd("chloe123"), school_id=2, 
                     typeDeveloppeur="FullStack", technologies=','.join(technologies['FullStack'])),
                User(id="u4", role="admin", nom="Admin", prenom="Super", 
                     email="admin@teambrains.fr", password=hash_pwd("admin123"), school_id=None, 
                     typeDeveloppeur=None, technologies=None),
                User(id="u5", role="school_admin", nom="Admin", prenom="Polytechnique", 
                     email="admin.polytechnique@polytechnique.fr", password=hash_pwd("polytech123"), school_id=1, 
                     typeDeveloppeur="Designer", technologies=','.join(technologies['Designer'])),
                User(id="u6", role="school_admin", nom="Admin", prenom="HEC", 
                     email="admin.hec@hec.fr", password=hash_pwd("hec123"), school_id=2, 
                     typeDeveloppeur="BackEnd", technologies=','.join(technologies['BackEnd'])),
                User(id="u7", role="entrepreneur", nom="Lemoine", prenom="Paul", 
                     email="paul.lemoine@entrepreneurs.com", password=hash_pwd("paul123"), school_id=None, 
                     typeDeveloppeur="FullStack", technologies=','.join(technologies['FullStack'])),
            ]
            
            db.session.add_all(users)
            db.session.commit()
            
            print("💡 Création des compétences...")
            # Compétences
            skills = [
                Skill(id=1, name="Python", category="backend", description="Programmation Python", 
                      created_at=datetime.utcnow(), is_active=True),
                Skill(id=2, name="React", category="frontend", description="Développement React", 
                      created_at=datetime.utcnow(), is_active=True),
                Skill(id=3, name="SQL", category="database", description="Gestion de base de données", 
                      created_at=datetime.utcnow(), is_active=True),
                Skill(id=4, name="Full Stack", category="fullstack", description="Développement Full Stack", 
                      created_at=datetime.utcnow(), is_active=True)
            ]
            
            db.session.add_all(skills)
            db.session.commit()
            
            print("🔗 Création des associations utilisateur-compétences...")
            # UserSkill
            user_skills = [
                UserSkill(user_id="u1", skill_id=1, level="avancé", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u1", skill_id=2, level="avancé", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u2", skill_id=2, level="débutant", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u3", skill_id=3, level="intermédiaire", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u3", skill_id=4, level="avancé", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u7", skill_id=1, level="débutant", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow())
            ]
            
            db.session.add_all(user_skills)
            db.session.commit()
            
            print("📋 Création des projets...")
            # Projets créés par l'entrepreneur (non lancés)
            projects = [
                Project(id=1, name="Projet IA", project_slug="projet-ia", creation_date=datetime.utcnow(), 
                       status="brouillon", description="Projet d'intelligence artificielle", creator_id="u7", progress=0),
                Project(id=2, name="Plateforme Web", project_slug="plateforme-web", creation_date=datetime.utcnow(), 
                       status="brouillon", description="Développement d'une plateforme web", creator_id="u7", progress=0)
            ]
            
            db.session.add_all(projects)
            db.session.commit()
            
            print("👥 Ajout des membres de projet...")
            # Aucun membre pour les projets non lancés
            # Pour lancer un projet, il faut au moins un full stack ou un front + un back
            # Exemple de projet lancé :
            launched_project = Project(id=3, name="Projet Data Science", project_slug="projet-ds", creation_date=datetime.utcnow(), 
                       status="en cours", description="Projet Data Science lancé", creator_id="u7", progress=10)
            db.session.add(launched_project)
            db.session.commit()
            # Membres : u1 (front), u3 (fullstack)
            db.session.execute(text("""
                INSERT INTO project_members (project_id, user_id, role) VALUES 
                (3, 'u1', 'front'), (3, 'u3', 'fullstack'), (3, 'u7', 'entrepreneur')
            """))
            db.session.commit()
            
            print("📝 Création des tâches...")
            # Tâches
            tasks = [
                Task(id=1, title="Collecte de données", description="Rassembler les datasets", 
                     due_date=datetime.utcnow() + timedelta(days=7), percent_completion=20, 
                     assignee_id="u1", project_id=3, priority="haute", sprint="Sprint 1"),
                Task(id=2, title="Déploiement", description="Déployer sur le cloud", 
                     due_date=datetime.utcnow() + timedelta(days=14), percent_completion=100, 
                     assignee_id="u3", project_id=3, priority="moyenne", sprint="Sprint 2")
            ]
            
            db.session.add_all(tasks)
            db.session.commit()
            
            print("🔧 Création des sous-tâches...")
            # Sous-tâches
            subtasks = [
                SubTask(id=1, title="Télécharger dataset", description="Télécharger depuis Kaggle", 
                       due_date=datetime.utcnow() + timedelta(days=2), percent_completion=100, 
                       priority="haute", status="done", task_id=1, assigned_student_id="u1", created_date=datetime.utcnow()),
                SubTask(id=2, title="Nettoyer données", description="Supprimer les valeurs manquantes", 
                       due_date=datetime.utcnow() + timedelta(days=4), percent_completion=0, 
                       priority="moyenne", status="pending", task_id=1, assigned_student_id="u3", created_date=datetime.utcnow())
            ]
            
            db.session.add_all(subtasks)
            db.session.commit()
            
            print("✅ Création des validations...")
            # Validations
            task_validations = [
                TaskValidation(id=1, task_id=1, status="validé", comment="OK", 
                              validator_id="u1", timestamp=datetime.utcnow())
            ]
            
            subtask_validations = [
                SubTaskValidation(id=1, subtask_id=1, status="validé", feedback="Bien joué", 
                                 validator_id="u1", timestamp=datetime.utcnow())
            ]
            
            db.session.add_all(task_validations + subtask_validations)
            db.session.commit()
            
            print("👨‍🎓 Attribution des tâches aux étudiants...")
            # Attribution tâche-étudiant
            task_students = [
                TaskStudent(id=1, task_id=1, student_id="u1", role="développeur", assigned_date=datetime.utcnow())
            ]
            
            db.session.add_all(task_students)
            db.session.commit()
            
            print("💬 Création des messages...")
            # Messages
            messages = [
                Message(id=1, content="Bienvenue sur le projet Data Science !", project_id=3, 
                       sender_id="u7", timestamp=datetime.utcnow()),
                Message(id=2, content="Déploiement terminé.", project_id=3, 
                       sender_id="u3", timestamp=datetime.utcnow())
            ]
            
            db.session.add_all(messages)
            db.session.commit()
            
            print("📁 Création des fichiers...")
            # Fichiers
            files = [
                FileDocument(id=1, filename="dataset.csv", original_filename="dataset.csv", 
                           file_path="/files/dataset.csv", file_size=2048, file_type="csv", 
                           upload_date=datetime.utcnow(), uploader_id="u1", project_id=3)
            ]
            
            db.session.add_all(files)
            db.session.commit()
            
            print("👁️ Configuration de la visibilité CV...")
            # Visibilité CV
            cv_visibility = [
                CVVisibility(id=1, user_id="u1", is_public=True, show_personal_info=True, 
                           show_contact_info=True, show_skills=True, show_projects=True, last_updated=datetime.utcnow())
            ]
            
            db.session.add_all(cv_visibility)
            db.session.commit()
            
            print("📄 Création des projets CV...")
            # CVProject
            cv_projects = [
                CVProject(id=1, user_id="u1", project_id=3, role="Chef de projet", 
                         start_date=datetime.utcnow() - timedelta(days=30), end_date=datetime.utcnow(), 
                         team_size=2, description="Pilotage du projet Data Science")
            ]
            
            db.session.add_all(cv_projects)
            db.session.commit()
            
            print("🎫 Création des tokens d'école...")
            # Tokens écoles (1 token = 1 étudiant)
            school_tokens = [
                SchoolToken(id=1, school_id=1, token="TOKENALICE", name="Token Alice", 
                           created_at=datetime.utcnow(), is_active=True),
                SchoolToken(id=2, school_id=1, token="TOKENBOB", name="Token Bob", 
                           created_at=datetime.utcnow(), is_active=True),
                SchoolToken(id=3, school_id=2, token="TOKENCHLOE", name="Token Chloé", 
                           created_at=datetime.utcnow(), is_active=True)
            ]
            
            db.session.add_all(school_tokens)
            db.session.commit()
            
            print("🎓 Création des tokens d'inscription...")
            # Tokens d'inscription (1 token = 1 étudiant)
            registration_tokens = [
                SchoolRegistrationToken(id=1, school_id=1, token="REGALICE", name="Token Alice", 
                                       max_uses=1, current_uses=0, created_at=datetime.utcnow(), is_active=True, created_by="u5"),
                SchoolRegistrationToken(id=2, school_id=1, token="REGBOB", name="Token Bob", 
                                       max_uses=1, current_uses=0, created_at=datetime.utcnow(), is_active=True, created_by="u5"),
                SchoolRegistrationToken(id=3, school_id=2, token="REGCHLOE", name="Token Chloé", 
                                       max_uses=1, current_uses=0, created_at=datetime.utcnow(), is_active=True, created_by="u6")
            ]
            
            db.session.add_all(registration_tokens)
            db.session.commit()
            
            print("📊 Création des données d'usage...")
            # Usage écoles
            school_usage = [
                SchoolUsage(id=1, school_id=1, usage_date=datetime.utcnow().date(), 
                           active_students_count=2, recorded_at=datetime.utcnow())
            ]
            
            db.session.add_all(school_usage)
            db.session.commit()
            
            print("💰 Création des factures d'école...")
            # Factures écoles
            school_invoices = [
                SchoolInvoice(id=1, school_id=1, billing_year=2024, billing_month=6, 
                             total_amount_centimes=10000, days_billed=30, student_days=60, 
                             average_students=2, invoice_date=datetime.utcnow())
            ]
            
            db.session.add_all(school_invoices)
            db.session.commit()
            
            print("💳 Création des abonnements...")
            # Abonnements
            subscriptions = [
                Subscription(id=1, user_id="u1", stripe_subscription_id="sub_123", 
                           stripe_customer_id="cus_123", plan_type="student", status="active", 
                           current_period_start=datetime.utcnow(), current_period_end=datetime.utcnow() + timedelta(days=30), 
                           created_at=datetime.utcnow(), updated_at=datetime.utcnow())
            ]
            
            db.session.add_all(subscriptions)
            db.session.commit()
            
            print("🧾 Création des factures...")
            # Factures
            invoices = [
                Invoice(id=1, user_id="u1", subscription_id=1, stripe_invoice_id="inv_123", 
                       amount_paid=1000, currency="eur", status="paid", 
                       invoice_date=datetime.utcnow(), created_at=datetime.utcnow())
            ]
            
            db.session.add_all(invoices)
            db.session.commit()
            
            print("✅ Seeding terminé avec succès !")
            print(f"📊 Données créées : {len(users)} utilisateurs, {len(projects)+1} projets, {len(tasks)} tâches")
            
    except Exception as e:
        print(f"❌ Erreur lors du seeding : {e}")
        db.session.rollback()
        raise

if __name__ == "__main__":
    seed_database() 