from flask import Flask
from flask_cors import CORS
import logging
from models import db, User, Project
from routes.auth import auth
from routes.users import users
from routes.projects import projects
from routes.cv import cv_bp
from dotenv import load_dotenv
import os
from extensions import bcrypt, mail
from flask_jwt_extended import JWTManager
from routes.contact import contact_bp
from routes.chat import chat_bp
from routes.planification import planification_bp
from flask_migrate import Migrate
from routes.uploadFile import upload_bp
from routes.sprint import sprint_bp
from routes.validation import validation_bp
from routes.schools import schools_bp
from routes.school_partnership import school_partnership_bp
from routes.stripe_partnership import stripe_partnership_bp
from routes.search import search_bp
from routes.subtasks import subtasks_bp
from routes.skills import skills_bp
from routes.visibility import visibility_bp


load_dotenv()

# Configuration du logging avec fichier
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)
bcrypt.init_app(app)
#CORS(app, supports_credentials=True, origins=["http://localhost:5173/"])


app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(users, url_prefix='/users')
app.register_blueprint(projects, url_prefix='/projects')
app.register_blueprint(cv_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(planification_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(sprint_bp)
app.register_blueprint(validation_bp)
app.register_blueprint(schools_bp)
app.register_blueprint(school_partnership_bp)
app.register_blueprint(stripe_partnership_bp)
app.register_blueprint(search_bp, url_prefix='/search')
app.register_blueprint(subtasks_bp)
app.register_blueprint(skills_bp)
app.register_blueprint(visibility_bp)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['MAIL_SERVER'] = 'mailpit'
app.config['MAIL_PORT'] = 1025
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limite la taille des fichiers à 16 Mo

db.init_app(app)

# Initialiser Flask-Migrate
migrate = Migrate(app, db)

jwt = JWTManager(app)

mail.init_app(app)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

with app.app_context():
    db.create_all()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
