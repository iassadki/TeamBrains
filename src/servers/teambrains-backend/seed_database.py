#!/usr/bin/env python3
"""
Script de seed automatique pour TeamBrains
S'exécute automatiquement après les migrations pour peupler la base de données
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import text

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
                     email="alice@polytechnique.fr", password=hash_pwd("alice123"), school_id=1),
                User(id="u2", role="student", nom="Martin", prenom="Bob", 
                     email="bob@polytechnique.fr", password=hash_pwd("bob123"), school_id=1),
                User(id="u3", role="student", nom="Durand", prenom="Chloé", 
                     email="chloe@hec.fr", password=hash_pwd("chloe123"), school_id=2),
                User(id="u4", role="admin", nom="Admin", prenom="Super", 
                     email="admin@teambrains.fr", password=hash_pwd("admin123"), school_id=None),
                User(id="u5", role="school_admin", nom="Admin", prenom="Polytechnique", 
                     email="admin.polytechnique@polytechnique.fr", password=hash_pwd("polytech123"), school_id=1),
                User(id="u6", role="school_admin", nom="Admin", prenom="HEC", 
                     email="admin.hec@hec.fr", password=hash_pwd("hec123"), school_id=2)
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
                      created_at=datetime.utcnow(), is_active=True)
            ]
            
            db.session.add_all(skills)
            db.session.commit()
            
            print("🔗 Création des associations utilisateur-compétences...")
            # UserSkill
            user_skills = [
                UserSkill(user_id="u1", skill_id=1, level="avancé", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u2", skill_id=2, level="débutant", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow()),
                UserSkill(user_id="u3", skill_id=3, level="intermédiaire", acquired_date=datetime.utcnow(), last_updated=datetime.utcnow())
            ]
            
            db.session.add_all(user_skills)
            db.session.commit()
            
            print("📋 Création des projets...")
            # Projets
            projects = [
                Project(id=1, name="Projet IA", project_slug="projet-ia", creation_date=datetime.utcnow(), 
                       status="en cours", description="Projet d'intelligence artificielle", creator_id="u1", progress=50),
                Project(id=2, name="Plateforme Web", project_slug="plateforme-web", creation_date=datetime.utcnow(), 
                       status="terminé", description="Développement d'une plateforme web", creator_id="u3", progress=100)
            ]
            
            db.session.add_all(projects)
            db.session.commit()
            
            print("👥 Ajout des membres de projet...")
            # Membres de projet (via SQL direct pour la table d'association)
            db.session.execute(text("""
                INSERT INTO project_members (project_id, user_id, role) VALUES 
                (1, 'u1', 'chef'), (1, 'u2', 'membre'), 
                (2, 'u3', 'chef'), (2, 'u4', 'mentor')
            """))
            db.session.commit()
            
            print("📝 Création des tâches...")
            # Tâches
            tasks = [
                Task(id=1, title="Collecte de données", description="Rassembler les datasets", 
                     due_date=datetime.utcnow() + timedelta(days=7), percent_completion=20, 
                     assignee_id="u2", project_id=1, priority="haute", sprint="Sprint 1"),
                Task(id=2, title="Déploiement", description="Déployer sur le cloud", 
                     due_date=datetime.utcnow() + timedelta(days=14), percent_completion=100, 
                     assignee_id="u3", project_id=2, priority="moyenne", sprint="Sprint 2")
            ]
            
            db.session.add_all(tasks)
            db.session.commit()
            
            print("🔧 Création des sous-tâches...")
            # Sous-tâches
            subtasks = [
                SubTask(id=1, title="Télécharger dataset", description="Télécharger depuis Kaggle", 
                       due_date=datetime.utcnow() + timedelta(days=2), percent_completion=100, 
                       priority="haute", status="done", task_id=1, assigned_student_id="u2", created_date=datetime.utcnow()),
                SubTask(id=2, title="Nettoyer données", description="Supprimer les valeurs manquantes", 
                       due_date=datetime.utcnow() + timedelta(days=4), percent_completion=0, 
                       priority="moyenne", status="pending", task_id=1, assigned_student_id="u1", created_date=datetime.utcnow())
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
                TaskStudent(id=1, task_id=1, student_id="u2", role="développeur", assigned_date=datetime.utcnow())
            ]
            
            db.session.add_all(task_students)
            db.session.commit()
            
            print("💬 Création des messages...")
            # Messages
            messages = [
                Message(id=1, content="Bienvenue sur le projet IA !", project_id=1, 
                       sender_id="u1", timestamp=datetime.utcnow()),
                Message(id=2, content="Déploiement terminé.", project_id=2, 
                       sender_id="u3", timestamp=datetime.utcnow())
            ]
            
            db.session.add_all(messages)
            db.session.commit()
            
            print("📁 Création des fichiers...")
            # Fichiers
            files = [
                FileDocument(id=1, filename="dataset.csv", original_filename="dataset.csv", 
                           file_path="/files/dataset.csv", file_size=2048, file_type="csv", 
                           upload_date=datetime.utcnow(), uploader_id="u2", project_id=1)
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
                CVProject(id=1, user_id="u1", project_id=1, role="Chef de projet", 
                         start_date=datetime.utcnow() - timedelta(days=30), end_date=datetime.utcnow(), 
                         team_size=2, description="Pilotage du projet IA")
            ]
            
            db.session.add_all(cv_projects)
            db.session.commit()
            
            print("🎫 Création des tokens d'école...")
            # Tokens écoles
            school_tokens = [
                SchoolToken(id=1, school_id=1, token="TOKEN123", name="Token principal", 
                           created_at=datetime.utcnow(), is_active=True)
            ]
            
            db.session.add_all(school_tokens)
            db.session.commit()
            
            print("🎓 Création des tokens d'inscription...")
            # Tokens d'inscription
            registration_tokens = [
                SchoolRegistrationToken(id=1, school_id=1, token="REG2024", name="Promo 2024", 
                                       max_uses=100, current_uses=10, created_at=datetime.utcnow(), is_active=True)
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
            print(f"📊 Données créées : {len(users)} utilisateurs, {len(projects)} projets, {len(tasks)} tâches")
            
    except Exception as e:
        print(f"❌ Erreur lors du seeding : {e}")
        db.session.rollback()
        raise

if __name__ == "__main__":
    seed_database() 