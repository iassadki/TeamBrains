import React from 'react';
import { ArrowLeft, ExternalLink, Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const CVViewer = ({ studentData, onBack }) => {
    const { student, projects } = studentData;

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

    return (
        <div className="space-y-6">
            {/* En-tête avec bouton retour */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={onBack}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        CV de {student.prenom} {student.nom}
                    </h2>
                    <p className="text-gray-600">{student.email}</p>
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
                                <p className="text-sm font-medium text-gray-500">Type de développeur</p>
                                <p className="text-base text-gray-900">{student.typeDeveloppeur || 'Non défini'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="text-base text-gray-900">{student.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Technologies */}
                    {student.technologies && student.technologies.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétences Techniques</h3>
                            <div className="flex flex-wrap gap-2">
                                {student.technologies.map((tech) => (
                                    <span
                                        key={tech}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Liens */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liens</h3>
                        <div className="space-y-3">
                            {student.linkedin_url && (
                                <a
                                    href={student.linkedin_url.startsWith('http') ? student.linkedin_url : `https://${student.linkedin_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                    LinkedIn <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                            )}
                            {student.portfolio_url && (
                                <a
                                    href={student.portfolio_url.startsWith('http') ? student.portfolio_url : `https://${student.portfolio_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-purple-600 hover:text-purple-800"
                                >
                                    Portfolio <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                            )}
                            {student.github_url && (
                                <a
                                    href={student.github_url.startsWith('http') ? student.github_url : `https://${student.github_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-gray-700 hover:text-gray-900"
                                >
                                    GitHub <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                            )}
                            {!student.linkedin_url && !student.portfolio_url && !student.github_url && (
                                <p className="text-gray-500 text-sm">Aucun lien renseigné</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Colonne de droite - Contenu principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Formation */}
                    {student.etudes && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Formation</h3>
                            <p className="text-gray-700">{student.etudes}</p>
                        </div>
                    )}

                    {/* Objectifs */}
                    {student.ambitions && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs Professionnels</h3>
                            <p className="text-gray-700">{student.ambitions}</p>
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

                                        {/* Tâches de l'étudiant */}
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
                                <p className="text-gray-500">Aucun projet TeamBrains pour cet étudiant</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVViewer;