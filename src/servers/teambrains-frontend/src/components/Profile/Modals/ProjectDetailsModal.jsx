import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const ProjectDetailsModal = ({ isOpen, onClose, projectId }) => {
    const [projectDetails, setProjectDetails] = useState(null);
    const [subtasks, setSubtasks] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [validationStats, setValidationStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchProjectDetails();
        }
    }, [isOpen, projectId]);

    const fetchProjectDetails = async () => {
        setLoading(true);
        try {
            // Récupérer les sous-tâches et assignements
            const subtasksResponse = await axios.get(`http://localhost:5001/subtasks/project/${projectId}/students-tasks`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setSubtasks(subtasksResponse.data.tasks || []);

            // Récupérer les tâches en attente de validation
            const pendingResponse = await axios.get(`http://localhost:5001/validation/project/${projectId}/pending`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setFeedback(pendingResponse.data.pending_tasks || []);

            // Récupérer les statistiques de validation
            const statsResponse = await axios.get(`http://localhost:5001/validation/stats/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setValidationStats(statsResponse.data.stats);

            // Récupérer les détails du projet avec les membres
            const projectResponse = await axios.get(`http://localhost:5001/projects/list_projects`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // Trouver le projet correspondant dans la liste
            const currentProject = projectResponse.data.find(p => p.id === projectId);
            if (currentProject) {
                setProjectDetails(prev => ({
                    ...prev,
                    members: currentProject.members,
                    project_name: currentProject.name
                }));
            }

        } catch (error) {
            console.error('Erreur lors de la récupération des détails:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'validated':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'validated':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Détails du projet: {projectDetails?.project_name || 'Chargement...'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-lg text-gray-600">Chargement...</div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">
                            {/* Statistiques générales */}
                            {validationStats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-blue-800">Total tâches</h4>
                                        <p className="text-2xl font-bold text-blue-600">{validationStats.total_tasks || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-green-800">Validées</h4>
                                        <p className="text-2xl font-bold text-green-600">{validationStats.validated_tasks || 0}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-red-800">Rejetées</h4>
                                        <p className="text-2xl font-bold text-red-600">{validationStats.rejected_tasks || 0}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-yellow-800">En attente</h4>
                                        <p className="text-2xl font-bold text-yellow-600">{validationStats.pending_tasks || 0}</p>
                                    </div>
                                </div>
                            )}

                            {/* Section Composition de l'équipe */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <Users className="w-6 h-6 text-blue-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">Composition de l'équipe</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {projectDetails?.members && projectDetails.members.length > 0 ? (
                                        projectDetails.members.map((member) => (
                                            <div key={member.user_id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">{member.name}</h4>
                                                        <p className="text-sm text-gray-600">{member.role}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${member.role === 'BackEnd' ? 'bg-blue-100 text-blue-800' :
                                                            member.role === 'FrontEnd' ? 'bg-green-100 text-green-800' :
                                                                member.role === 'FullStack' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        {member.role === 'BackEnd' ? '⚙️' :
                                                            member.role === 'FrontEnd' ? '🎨' :
                                                                member.role === 'FullStack' ? '🚀' : '✨'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-8">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucun membre dans l'équipe</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section Sous-tâches */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Sous-tâches du projet</h3>

                                <div className="space-y-4">
                                    {subtasks && subtasks.length > 0 ? (
                                        subtasks.map((task) => (
                                            <div key={task.task_id} className="border border-gray-200 p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold text-gray-800">{task.task_title}</h4>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${task.task_completion === 100 ? 'bg-green-100 text-green-800' :
                                                            task.task_completion > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.task_completion || 0}% complété
                                                    </span>
                                                </div>

                                                {task.task_description && (
                                                    <p className="text-gray-600 text-sm mb-3">{task.task_description}</p>
                                                )}

                                                {/* Badges priorité et sprint */}
                                                <div className="flex gap-2 mb-3">
                                                    {task.task_priority && (
                                                        <span className={`px-2 py-1 text-xs rounded-full ${task.task_priority === 'haute' ? 'bg-red-100 text-red-800' :
                                                                task.task_priority === 'basse' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {task.task_priority === 'haute' ? '🔥' :
                                                                task.task_priority === 'basse' ? '🔽' : '➡️'}
                                                            {task.task_priority}
                                                        </span>
                                                    )}
                                                    {task.task_sprint && (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                                                            🏃 {task.task_sprint}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Sous-tâches */}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                                            Sous-tâches ({task.subtasks.length})
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {task.subtasks.map((subtask) => (
                                                                <div key={subtask.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{subtask.title}</p>
                                                                        {subtask.description && (
                                                                            <p className="text-xs text-gray-600">{subtask.description}</p>
                                                                        )}
                                                                        {subtask.assigned_student_name && (
                                                                            <p className="text-xs text-blue-600">
                                                                                Assigné à: {subtask.assigned_student_name}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        {getStatusIcon(subtask.status)}
                                                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subtask.status)}`}>
                                                                            {subtask.status || 'en cours'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Aucune sous-tâche disponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section Feedback client */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <MessageSquare className="w-6 h-6 text-green-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">Feedback client</h3>
                                </div>

                                {/* Tâches en attente de validation */}
                                {feedback && feedback.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-gray-800 mb-3">Tâches en attente de validation</h4>
                                        <div className="space-y-3">
                                            {feedback.map((item) => (
                                                <div key={item.task.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="font-medium text-gray-800">{item.task.title}</h5>
                                                        <span className="text-xs text-yellow-600">En attente</span>
                                                    </div>
                                                    {item.task.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{item.task.description}</p>
                                                    )}
                                                    {item.last_validation && item.last_validation.comment && (
                                                        <div className="bg-white p-3 rounded border">
                                                            <p className="text-sm text-gray-700">
                                                                <strong>Commentaire:</strong> {item.last_validation.comment}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Historique des validations */}
                                {validationStats && validationStats.validation_history && (
                                    <div className="space-y-4">
                                        {/* Tâches validées */}
                                        {validationStats.validation_history.validated && validationStats.validation_history.validated.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-green-700 mb-2">
                                                    ✅ Tâches validées ({validationStats.validation_history.validated.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {validationStats.validation_history.validated.slice(0, 3).map((item) => (
                                                        <div key={item.task_id} className="bg-green-50 p-3 rounded border border-green-200">
                                                            <p className="font-medium text-green-800">{item.task_title}</p>
                                                            <p className="text-sm text-green-600">
                                                                Validé par {item.validator} le {new Date(item.validation_date).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tâches rejetées */}
                                        {validationStats.validation_history.rejected && validationStats.validation_history.rejected.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-red-700 mb-2">
                                                    ❌ Modifications demandées ({validationStats.validation_history.rejected.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {validationStats.validation_history.rejected.slice(0, 3).map((item) => (
                                                        <div key={item.task_id} className="bg-red-50 p-3 rounded border border-red-200">
                                                            <p className="font-medium text-red-800">{item.task_title}</p>
                                                            <p className="text-sm text-red-600">
                                                                Rejeté par {item.validator} le {new Date(item.validation_date).toLocaleDateString('fr-FR')}
                                                            </p>
                                                            {item.comment && (
                                                                <p className="text-sm text-gray-700 mt-1">
                                                                    <strong>Commentaire:</strong> {item.comment}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(!feedback || feedback.length === 0) && (!validationStats ||
                                    !validationStats.validation_history ||
                                    (validationStats.validation_history.validated?.length === 0 &&
                                        validationStats.validation_history.rejected?.length === 0)) && (
                                        <div className="text-center py-8">
                                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucun feedback client pour le moment</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsModal;