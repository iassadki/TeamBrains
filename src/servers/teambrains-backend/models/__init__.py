# models/__init__.py
# Import de la base de données et utilitaires
from .base import db, get_uuid

# Import des modèles utilisateur
from .user import User, Skill, UserSkill, CVVisibility

# Import des modèles de projet et tâches
from .project import Project, project_members, Message, Task, CVProject, TaskValidation, SubTask, SubTaskValidation, TaskStudent

# Import des modèles de fichiers
from .file import FileDocument

# Import des modèles d'école
from .school import School, SchoolToken, SchoolRegistrationToken

# Import des modèles d'abonnement
from .subscription import Subscription, Invoice

# Import des modèles d'usage
from .school_usage import SchoolUsage, SchoolInvoice


# Export de tous les modèles pour maintenir la compatibilité
__all__ = [
    'db', 'get_uuid',
    'User', 'Skill', 'UserSkill', 'CVVisibility',
    'Project', 'project_members', 'Message', 'Task', 'CVProject', 'TaskValidation', 'SubTask', 'SubTaskValidation', 'TaskStudent',
    'FileDocument',
    'School', 'SchoolToken', 'SchoolRegistrationToken',
    'Subscription', 'Invoice',
    'SchoolUsage', 'SchoolInvoice'
] 