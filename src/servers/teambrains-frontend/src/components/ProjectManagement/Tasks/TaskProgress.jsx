import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, BarChart2 } from 'lucide-react';

const TaskProgress = () => {
    const { slug } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0
    });


    // Fonction pour calculer les statistiques des tâches (memoized)
    const calculateStats = useCallback((tasksList) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let completed = 0;
        let inProgress = 0;
        let pending = 0;
        let overdue = 0;

        tasksList.forEach(task => {
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);

            if (task.percent_completion === 100) {
                completed++;
            } else if (task.percent_completion > 0) {
                inProgress++;
                if (dueDate < today) {
                    overdue++;
                }
            } else {
                pending++;
                if (dueDate < today) {
                    overdue++;
                }
            }
        });

        setStats({
            total: tasksList.length,
            completed,
            inProgress,
            pending,
            overdue
        });
    }, []);

    // Récupération du projet - UNE SEULE FOIS
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
    }, [slug]); // Dépendance uniquement sur slug

    // Récupération des tâches et calcul des statistiques
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

                    const tasksList = response.data.tasks;
                    setTasks(tasksList);

                    // Calcul des statistiques
                    calculateStats(tasksList);

                    setLoading(false);
                } catch (error) {
                    console.error('Erreur lors de la récupération des tâches:', error);
                    setError("Impossible de charger les tâches");
                    setLoading(false);
                }
            }
        };

        fetchTasks();
    }, [project?.id, calculateStats]); // Dépendances optimisées



    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement...</div>;
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <BarChart2 className="mr-2" size={20} />
                Statistiques détaillées
            </h2>

            {/* Statistiques des tâches */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-blue-600 text-2xl font-bold">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total des tâches</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-green-600 text-2xl font-bold flex justify-center items-center">
                        <CheckCircle size={16} className="mr-1" />
                        {stats.completed}
                    </div>
                    <div className="text-sm text-gray-600">Terminées</div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-yellow-600 text-2xl font-bold flex justify-center items-center">
                        <Clock size={16} className="mr-1" />
                        {stats.inProgress}
                    </div>
                    <div className="text-sm text-gray-600">En cours</div>
                </div>

                <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-red-600 text-2xl font-bold flex justify-center items-center">
                        <AlertTriangle size={16} className="mr-1" />
                        {stats.overdue}
                    </div>
                    <div className="text-sm text-gray-600">En retard</div>
                </div>
            </div>

            {/* Graphique de répartition */}
            <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Répartition des tâches</h3>
                <div className="w-full h-6 bg-gray-200 rounded-full flex overflow-hidden">
                    {stats.total > 0 && (
                        <>
                            <div
                                className="bg-green-500 h-6"
                                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                                title={`${stats.completed} tâches terminées`}
                            ></div>
                            <div
                                className="bg-yellow-500 h-6"
                                style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                                title={`${stats.inProgress} tâches en cours`}
                            ></div>
                            <div
                                className="bg-gray-400 h-6"
                                style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                                title={`${stats.pending} tâches à faire`}
                            ></div>
                        </>
                    )}
                </div>
                <div className="flex justify-between mt-2 text-xs">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Terminées</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                        <span>En cours</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
                        <span>À faire</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskProgress;