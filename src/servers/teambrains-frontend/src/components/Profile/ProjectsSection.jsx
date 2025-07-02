import React from 'react';
import ProjectVisibilityToggle from './ProjectVisibiltyToggle';

const ProjectCard = ({ project, onProjectClick, formatDate, getTaskStatusColor, getTaskStatusLabel, onVisibilityChange }) => (
    <div
        className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
    >
        {/* Header cliquable pour les détails */}
        <div
            className="cursor-pointer"
            onClick={() => onProjectClick(project.project_id)}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                    {project.project_name}
                </h3>
                <span className="text-sm text-gray-500">
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                </span>
            </div>

            <div className="flex items-center space-x-4 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {project.role}
                </span>
                <span className="text-sm text-gray-600">
                    Équipe de {project.team_size} personne{project.team_size > 1 ? 's' : ''}
                </span>
            </div>

            {project.description && (
                <p className="text-gray-700 text-sm mb-3">{project.description}</p>
            )}

            {/* Tâches de l'utilisateur */}
            {project.tasks && project.tasks.length > 0 && (
                <div className="mt-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        Mes tâches ({project.tasks.length})
                    </h4>
                    <div className="space-y-2">
                        {project.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-gray-100">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                    {task.description && (
                                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                    )}
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
                        ))}
                    </div>
                </div>
            )}

            {/* Indicateur cliquable */}
            <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs text-blue-600 font-medium">
                    👁️ Cliquez pour voir les détails du projet
                </p>
            </div>
        </div>

        {/* Section Visibilité - Non cliquable */}
        <div className="mt-3 pt-3 border-t border-gray-200">
            <ProjectVisibilityToggle
                project={project}
                onVisibilityChange={onVisibilityChange}
            />
        </div>
    </div>
);

const EmptyProjectsState = () => (
    <div className="text-center py-8">
        <p className="text-gray-500">Aucun projet TeamBrains dans votre CV pour le moment.</p>
        <p className="text-sm text-gray-400 mt-2">
            Rejoignez des projets pour enrichir automatiquement votre CV !
        </p>
    </div>
);

const ProjectsSection = ({
    cvProjects,
    handleProjectClick,
    formatDate,
    getTaskStatusColor,
    getTaskStatusLabel,
    onProjectVisibilityChange
}) => {
    const handleVisibilityChange = (projectId, isVisible) => {
        // Callback pour mettre à jour l'état parent si nécessaire
        if (onProjectVisibilityChange) {
            onProjectVisibilityChange(projectId, isVisible);
        }

        // Optionnel : afficher une notification
        console.log(`Projet ${projectId} ${isVisible ? 'rendu public' : 'rendu privé'}`);
    };

    return (
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Expérience Projets</h2>
                <div className="text-sm text-gray-500">
                    {cvProjects.filter(p => p.is_visible).length} sur {cvProjects.length} visible{cvProjects.length > 1 ? 's' : ''} publiquement
                </div>
            </div>

            {cvProjects.length > 0 ? (
                <div className="space-y-4">
                    {cvProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onProjectClick={handleProjectClick}
                            formatDate={formatDate}
                            getTaskStatusColor={getTaskStatusColor}
                            getTaskStatusLabel={getTaskStatusLabel}
                            onVisibilityChange={handleVisibilityChange}
                        />
                    ))}
                </div>
            ) : (
                <EmptyProjectsState />
            )}

            {/* Info sur la visibilité publique */}
            {cvProjects.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <div className="text-blue-600 mt-0.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-800">À propos de la visibilité publique</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Les projets marqués comme "publics" apparaîtront sur votre CV public accessible via un lien partageable.
                                Les projets privés ne sont visibles que dans votre espace personnel.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsSection;