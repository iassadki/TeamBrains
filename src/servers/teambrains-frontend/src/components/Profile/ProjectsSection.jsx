import React from 'react';

const ProjectCard = ({ project, onProjectClick, formatDate, getTaskStatusColor, getTaskStatusLabel }) => (
    <div
        className="border border-gray-200 p-4 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
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
    getTaskStatusLabel
}) => {
    return (
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Expérience Projets</h2>
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
                        />
                    ))}
                </div>
            ) : (
                <EmptyProjectsState />
            )}
        </div>
    );
};

export default ProjectsSection;