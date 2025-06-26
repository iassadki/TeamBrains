import React, { useState, useEffect } from 'react';
import { Filter, X, Edit2, Trash2, User, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { format, parseISO, isToday, isThisWeek, isPast, isAfter, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskFilters = ({
    filters,
    setFilters,
    projectMembers,
    showFilters,
    setShowFilters
}) => {
    const { slug } = useParams();
    const [project, setProject] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Récupération du projet
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/projects/get_project/${slug}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                setProject(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération du projet:', error);
                setError("Impossible de charger les détails du projet");
            }
        };

        if (slug) {
            fetchProject();
        }
    }, [slug]);

    // Récupération des tâches
    useEffect(() => {
        const fetchTasks = async () => {
            if (project?.id) {
                try {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:5001/planification/${project.id}/tasks`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                    setAllTasks(response.data.tasks);
                    setLoading(false);
                } catch (error) {
                    console.error('Erreur lors de la récupération des tâches:', error);
                    setError("Impossible de charger les tâches");
                    setLoading(false);
                }
            }
        };

        fetchTasks();
    }, [project]);

    // Application des filtres
    useEffect(() => {
        let filtered = [...allTasks];

        // Filtre par assigné
        if (filters.assignee) {
            filtered = filtered.filter(task => task.assignee_id === filters.assignee);
        }

        // Filtre par sprint (ajouté pour la cohérence, même si non utilisé ici)
        // if (filters.sprint) {
        //     filtered = filtered.filter(task => task.sprint_id === filters.sprint);
        // }

        // Filtre par statut
        if (filters.status) {
            filtered = filtered.filter(task => {
                if (filters.status === 'to-do') {
                    return task.percent_completion === 0;
                } else if (filters.status === 'in-progress') {
                    return task.percent_completion > 0 && task.percent_completion < 100;
                } else if (filters.status === 'done') {
                    return task.percent_completion === 100;
                }
                return true;
            });
        }

        // Filtre par échéance
        if (filters.dueDate) {
            const today = new Date();
            const endOfThisWeek = endOfWeek(today, { locale: fr });
            
            filtered = filtered.filter(task => {
                const dueDate = parseISO(task.due_date);
                
                if (filters.dueDate === 'today') {
                    return isToday(dueDate);
                } else if (filters.dueDate === 'week') {
                    return isThisWeek(dueDate, { locale: fr });
                } else if (filters.dueDate === 'overdue') {
                    return isPast(dueDate) && task.percent_completion < 100;
                } else if (filters.dueDate === 'upcoming') {
                    return isAfter(dueDate, endOfThisWeek);
                }
                return true;
            });
        }

        setFilteredTasks(filtered);
    }, [allTasks, filters]);

    // Gérer les changements de filtres
    const handleFilterChange = (type, value) => {
        setFilters({ ...filters, [type]: value });
    };

    // Réinitialiser tous les filtres
    const resetFilters = () => {
        setFilters({
            assignee: '',
            status: '',
            dueDate: ''
        });
    };

    // Obtenir le nom d'un membre à partir de son ID
    const getMemberName = (userId) => {
        const member = projectMembers.find(m => m.user_id === userId || m.user_id === parseInt(userId));
        return member ? member.name : "Non assigné";
    };

    // Formater la date
    const formatDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            return format(date, "d MMMM yyyy", { locale: fr });
        } catch (e) {
            return dateString;
        }
    };

    // Obtenir la couleur du statut
    const getStatusColor = (task) => {
        if (task.percent_completion === 100) {
            return 'bg-green-100 text-green-800 border-green-200';
        } else if (task.percent_completion > 0) {
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        } else {
            return 'bg-red-100 text-red-800 border-red-200';
        }
    };

    // Obtenir le texte du statut
    const getStatusText = (task) => {
        if (task.percent_completion === 100) {
            return 'Terminé';
        } else if (task.percent_completion > 0) {
            return 'En cours';
        } else {
            return 'À faire';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-32">Chargement des tâches...</div>;
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>;
    }

    return (
        <div className="mb-4">
            {/* Bouton pour afficher/masquer les filtres sur mobile */}
            <div className="md:hidden mb-2">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center p-2 bg-gray-100 rounded-md"
                >
                    {showFilters ? <X size={16} /> : <Filter size={16} />}
                    <span className="ml-2 text-sm">{showFilters ? 'Masquer les filtres' : 'Filtrer les tâches'}</span>
                </button>
            </div>

            {/* Filtres */}
            <div className={`${showFilters ? 'block' : 'hidden md:flex'} md:flex md:space-x-4 bg-white rounded-lg p-3 shadow-sm mb-6`}>
                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigné à</label>
                    <select
                        value={filters.assignee}
                        onChange={(e) => handleFilterChange('assignee', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        <option value="">Tous</option>
                        {projectMembers.map(member => (
                            <option key={member.user_id} value={member.user_id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sprint</label>
                    <select
                        value={filters.sprint}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        {/* Iterer sur les sprints ?? */}
                        <option value="">Tous les sprints</option>
                        <option value="">Sprint n</option>
                    </select>
                </div>

                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        <option value="">Tous</option>
                        <option value="to-do">À faire</option>
                        <option value="in-progress">En cours</option>
                        <option value="done">Terminé</option>
                    </select>
                </div>

                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Échéance</label>
                    <select
                        value={filters.dueDate}
                        onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        <option value="">Toutes les dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="upcoming">Prochainement</option>
                        <option value="overdue">En retard</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={resetFilters}
                        className="text-sm p-1.5 text-gray-500 hover:text-gray-700"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Résultats des filtres */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium flex items-center">
                        <Filter className="mr-2" size={18} />
                        Tâches filtrées ({filteredTasks.length})
                    </h3>
                    {(filters.assignee || filters.status || filters.dueDate) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {filters.assignee && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <User size={12} className="mr-1" />
                                    Assigné: {getMemberName(filters.assignee)}
                                </span>
                            )}
                            {filters.status && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Clock size={12} className="mr-1" />
                                    Statut: {filters.status === 'to-do' ? 'À faire' : filters.status === 'in-progress' ? 'En cours' : 'Terminé'}
                                </span>
                            )}
                                                         {filters.dueDate && (
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                     <Calendar size={12} className="mr-1" />
                                     Échéance: {
                                         filters.dueDate === 'today' ? "Aujourd'hui" : 
                                         filters.dueDate === 'week' ? 'Cette semaine' : 
                                         filters.dueDate === 'upcoming' ? 'Prochainement' :
                                         'En retard'
                                     }
                                 </span>
                             )}
                        </div>
                    )}
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">Aucune tâche trouvée</p>
                            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div key={task.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task)}`}>
                                                {getStatusText(task)}
                                            </span>
                                        </div>
                                        
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                        )}
                                        
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <div className="flex items-center">
                                                <User size={12} className="mr-1" />
                                                {getMemberName(task.assignee_id)}
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar size={12} className="mr-1" />
                                                {formatDate(task.due_date)}
                                            </div>
                                            {task.percent_completion > 0 && task.percent_completion < 100 && (
                                                <div className="flex items-center">
                                                    <Clock size={12} className="mr-1" />
                                                    {task.percent_completion}%
                                                </div>
                                            )}
                                        </div>

                                        {task.percent_completion > 0 && task.percent_completion < 100 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-blue-500 h-1.5 rounded-full"
                                                        style={{ width: `${task.percent_completion}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskFilters;