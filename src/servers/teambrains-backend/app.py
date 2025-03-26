from flask import Flask
from flask_cors import CORS
import logging
from models import db, User, Project
from routes.auth import auth
from routes.users import users
from routes.projects import projects
from dotenv import load_dotenv
import os
from extensions import bcrypt, mail
from flask_jwt_extended import JWTManager
from routes.contact import contact_bp
from routes.chat import chat_bp

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
bcrypt.init_app(app)
#CORS(app, supports_credentials=True, origins=["http://localhost:5173/"])


app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(users, url_prefix='/users')
app.register_blueprint(projects, url_prefix='/projects')
app.register_blueprint(contact_bp)
app.register_blueprint(chat_bp, url_prefix='/chat')

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['JWT_SECRET_KEY'] = 'wdgQWWUKwT17lCz1'
app.config['MAIL_SERVER'] = 'mailpit'
app.config['MAIL_PORT'] = 1025
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False

db.init_app(app)

jwt = JWTManager(app)

mail.init_app(app)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

with app.app_context():
    db.create_all()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
