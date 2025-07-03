import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ExternalLink, Calendar, Users, CheckCircle, Clock, AlertCircle, Github, Linkedin, User, MapPin } from 'lucide-react';

const UserProfile = ({ userId: propUserId, isModal = false, isSchoolView = false }) => {
    const { userId: paramUserId } = useParams();
    const userId = propUserId || paramUserId;
    const [profileData, setProfileData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            
            // Déterminer quels endpoints et token utiliser
            const token = isSchoolView 
                ? localStorage.getItem('partnershipToken')
                : localStorage.getItem('accessToken');
            
            const profileEndpoint = isSchoolView
                ? `http://localhost:5001/api/partnership/school/student/${userId}/profile`
                : `http://localhost:5001/users/profile/${userId}`;
            
            const projectsEndpoint = isSchoolView
                ? `http://localhost:5001/api/partnership/school/student/${userId}/cv-projects`
                : `http://localhost:5001/cv/projects/user/${userId}`;
            
            // Récupérer le profil utilisateur
            const userResponse = await axios.get(profileEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setProfileData(userResponse.data);

            // Récupérer les projets CV de l'utilisateur
            try {
                const projectsResponse = await axios.get(projectsEndpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setProjects(projectsResponse.data.projects || []);
            } catch (projectError) {
                // Si pas de projets ou erreur, on continue avec un tableau vide
                console.log('Pas de projets trouvés:', projectError);
                setProjects([]);
            }

        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            setError('Utilisateur non trouvé ou erreur lors du chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'En cours';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
    };

    const getTaskStatusColor = (percentCompletion) => {
        if (percentCompletion === 100) return 'bg-green-100 text-green-800';
        if (percentCompletion >= 50) return 'bg-yellow-100 text-yellow-800';
        if (percentCompletion > 0) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getTaskStatusLabel = (percentCompletion) => {
        if (percentCompletion === 100) return 'Terminée';
        if (percentCompletion >= 50) return 'En cours';
        if (percentCompletion > 0) return 'Démarrée';
        return 'À faire';
    };

    const getTaskStatusIcon = (percentCompletion) => {
        if (percentCompletion === 100) return CheckCircle;
        if (percentCompletion >= 50) return Clock;
        if (percentCompletion > 0) return AlertCircle;
        return Clock;
    };

    const getRoleDisplayName = (role) => {
        const roleNames = {
            'student': 'Étudiant',
            'businessman': 'Entrepreneur',
            'admin': 'Administrateur'
        };
        return roleNames[role] || role;
    };

    const getTypeDevDisplayName = (type) => {
        const typeNames = {
            'FullStack': 'Développeur Full-Stack',
            'BackEnd': 'Développeur Back-End',
            'FrontEnd': 'Développeur Front-End',
            'Designer': 'Designer'
        };
        return typeNames[type] || type;
    };

    if (!userId) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="text-gray-600 text-xl mb-4">Aucun utilisateur sélectionné</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex justify-center items-center ${isModal ? 'min-h-96' : 'min-h-screen'}`}>
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-tb"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex justify-center items-center ${isModal ? 'min-h-96' : 'min-h-screen'}`}>
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">{error}</div>
                    {!isModal && (
                        <button 
                            onClick={() => window.history.back()}
                            className="bg-green-tb text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Retour
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!profileData) {
        return null;
    }

    return (
        <div className={isModal ? "bg-gray-50" : "min-h-screen bg-gray-50"}>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isModal ? 'py-4' : 'py-8'}`}>
                <div className="space-y-6">
                    {/* En-tête avec bouton retour */}
                    <div className="flex items-center space-x-4">
                        {!isModal && (
                            <button
                                onClick={() => window.history.back()}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                {profileData.prenom} {profileData.nom}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {getRoleDisplayName(profileData.role)}
                                </span>
                                {profileData.typeDeveloppeur && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        {getTypeDevDisplayName(profileData.typeDeveloppeur)}
                                    </span>
                                )}
                            </div>
                            {profileData.school && (
                                <div className="flex items-center mt-3 text-gray-600">
                                    <MapPin size={16} className="mr-2" />
                                    <span>{profileData.school.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Colonne de gauche - Informations personnelles */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Informations de base */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Rôle</p>
                                        <p className="text-base text-gray-900">{getRoleDisplayName(profileData.role)}</p>
                                    </div>
                                    {profileData.typeDeveloppeur && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Spécialité</p>
                                            <p className="text-base text-gray-900">{getTypeDevDisplayName(profileData.typeDeveloppeur)}</p>
                                        </div>
                                    )}
                                    {profileData.school && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">École</p>
                                            <p className="text-base text-gray-900">{profileData.school.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Technologies */}
                            {profileData.technologies && profileData.technologies.length > 0 && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétences Techniques</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.technologies.map((tech, index) => (
                                            tech.trim() && (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {tech.trim()}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Liens sociaux */}
                            {(profileData.linkedin_url || profileData.portfolio_url || profileData.github_url) && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Liens</h3>
                                    <div className="space-y-3">
                                        {profileData.linkedin_url && (
                                            <a
                                                href={profileData.linkedin_url.startsWith('http') ? profileData.linkedin_url : `https://${profileData.linkedin_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-blue-600 hover:text-blue-800"
                                            >
                                                <Linkedin className="h-4 w-4 mr-2" />
                                                LinkedIn <ExternalLink className="h-4 w-4 ml-2" />
                                            </a>
                                        )}
                                        {profileData.portfolio_url && (
                                            <a
                                                href={profileData.portfolio_url.startsWith('http') ? profileData.portfolio_url : `https://${profileData.portfolio_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-purple-600 hover:text-purple-800"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Portfolio <ExternalLink className="h-4 w-4 ml-2" />
                                            </a>
                                        )}
                                        {profileData.github_url && (
                                            <a
                                                href={profileData.github_url.startsWith('http') ? profileData.github_url : `https://${profileData.github_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-gray-700 hover:text-gray-900"
                                            >
                                                <Github className="h-4 w-4 mr-2" />
                                                GitHub <ExternalLink className="h-4 w-4 ml-2" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Colonne de droite - Contenu principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Formation */}
                            {profileData.etudes && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Formation</h3>
                                    <p className="text-gray-700">{profileData.etudes}</p>
                                </div>
                            )}

                            {/* Objectifs */}
                            {profileData.ambitions && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs Professionnels</h3>
                                    <p className="text-gray-700">{profileData.ambitions}</p>
                                </div>
                            )}

                            {/* Projets */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Expérience Projets</h3>
                                {projects && projects.length > 0 ? (
                                    <div className="space-y-6">
                                        {projects.map((project) => (
                                            <div key={project.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-lg font-semibold text-gray-800">{project.project_name}</h4>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(project.start_date)} - {formatDate(project.end_date)}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-4 mb-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {project.role}
                                                    </span>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Users className="h-4 w-4 mr-1" />
                                                        Équipe de {project.team_size} personne{project.team_size > 1 ? 's' : ''}
                                                    </div>
                                                </div>

                                                {project.description && (
                                                    <p className="text-gray-700 text-sm mb-4">{project.description}</p>
                                                )}

                                                {/* Tâches de l'utilisateur */}
                                                {project.tasks && project.tasks.length > 0 && (
                                                    <div className="mt-4">
                                                        <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Tâches réalisées ({project.tasks.length})
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {project.tasks.map((task) => {
                                                                const StatusIcon = getTaskStatusIcon(task.percent_completion);
                                                                return (
                                                                    <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-100">
                                                                        <div className="flex items-center flex-1">
                                                                            <StatusIcon className={`h-4 w-4 mr-3 ${
                                                                                task.percent_completion === 100 ? 'text-green-600' :
                                                                                task.percent_completion >= 50 ? 'text-yellow-600' :
                                                                                task.percent_completion > 0 ? 'text-blue-600' : 'text-gray-600'
                                                                            }`} />
                                                                            <div className="flex-1">
                                                                                <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                                                                {task.description && (
                                                                                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2 ml-3">
                                                                            <span className="text-xs text-gray-500">
                                                                                {task.percent_completion}%
                                                                            </span>
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.percent_completion)}`}>
                                                                                {getTaskStatusLabel(task.percent_completion)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        {/* Statistiques des tâches */}
                                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                            <div className="grid grid-cols-4 gap-4 text-center">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Total</p>
                                                                    <p className="text-sm font-semibold text-gray-900">{project.tasks.length}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Terminées</p>
                                                                    <p className="text-sm font-semibold text-green-600">
                                                                        {project.tasks.filter(t => t.percent_completion === 100).length}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">En cours</p>
                                                                    <p className="text-sm font-semibold text-yellow-600">
                                                                        {project.tasks.filter(t => t.percent_completion > 0 && t.percent_completion < 100).length}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Progression</p>
                                                                    <p className="text-sm font-semibold text-blue-600">
                                                                        {Math.round(project.tasks.reduce((acc, task) => acc + task.percent_completion, 0) / project.tasks.length)}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 mb-4">
                                            <Calendar className="mx-auto h-12 w-12" />
                                        </div>
                                        <p className="text-gray-500">Aucun projet TeamBrains dans le CV</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 