# models/__init__.py
# Import de la base de données et utilitaires
from .base import db, get_uuid

# Import des modèles utilisateur
from .user import User

# Import des modèles de projet et tâches
from .project import Project, project_members, Message, Task, CVProject, TaskValidation

# Import des modèles de fichiers
from .file import FileDocument

# Import des modèles d'école
from .school import School, SchoolToken, SchoolRegistrationToken

# Import des modèles d'abonnement
from .subscription import Subscription, Invoice

# Export de tous les modèles pour maintenir la compatibilité
__all__ = [
    'db', 'get_uuid',
    'User',
    'Project', 'project_members', 'Message', 'Task', 'CVProject', 'TaskValidation',
    'FileDocument',
    'School', 'SchoolToken', 'SchoolRegistrationToken',
    'Subscription', 'Invoice'
] 