import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Paperclip } from 'lucide-react';

const TaskBoard = (projectId) => {
    const { slug } = useParams();
    const { currentUser } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        assignee_id: '',
        percent_completion: 0,
        file_url: '',
        file_name: '',
        priority: 'moyenne'
    });
    const [projectMembers, setProjectMembers] = useState([]);
    const [error, setError] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [projectProgress, setProjectProgress] = useState(0);

    // États pour organiser les tâches en colonnes
    const [columns, setColumns] = useState({
        'to-do': {
            name: 'À faire',
            items: []
        },
        'in-progress': {
            name: 'En cours',
            items: []
        },
        'done': {
            name: 'Terminé',
            items: []
        }
    });

    // Récupération des détails du projet
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/projects/get_project/${slug}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                setProject(response.data);
                setProjectMembers(response.data.members || []);
            } catch (error) {
                console.error('Erreur lors de la récupération du projet:', error);
                setError("Impossible de charger les détails du projet");
            }
        };

        fetchProject();
    }, [slug]);

    // Récupération des tâches du projet
    useEffect(() => {
        const fetchData = async () => {
            if (project) {
                try {
                    setLoading(true);

                    // Récupération des tâches
                    const tasksResponse = await axios.get(`http://localhost:5001/planification/${project.id}/tasks`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                    setTasks(tasksResponse.data.tasks);
                    organizeTasks(tasksResponse.data.tasks);

                    setLoading(false);
                } catch (error) {
                    console.error('Erreur lors de la récupération des tâches:', error);
                    setError("Impossible de charger les tâches");
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [project]);

    // Calcul de la progression du projet basée sur les tâches
    const calculateProjectProgress = (tasksList) => {
        if (tasksList.length === 0) {
            setProjectProgress(0);
            return;
        }

        const totalCompletion = tasksList.reduce((sum, task) => {
            return sum + (task.percent_completion || 0);
        }, 0);

        const averageProgress = totalCompletion / tasksList.length;
        setProjectProgress(Math.round(averageProgress));
    };

    // Organisation des tâches en colonnes selon leur avancement
    const organizeTasks = (tasksList) => {
        const taskColumns = {
            'to-do': {
                name: 'À faire',
                items: []
            },
            'in-progress': {
                name: 'En cours',
                items: []
            },
            'done': {
                name: 'Terminé',
                items: []
            }
        };

        tasksList.forEach(task => {
            if (task.percent_completion === 0) {
                taskColumns['to-do'].items.push(task);
            } else if (task.percent_completion === 100) {
                taskColumns['done'].items.push(task);
            } else {
                taskColumns['in-progress'].items.push(task);
            }
        });

        setColumns(taskColumns);

        // Calculer la progression du projet à chaque réorganisation
        calculateProjectProgress(tasksList);
    };

    // Gestion du drag and drop natif
    const handleDragStart = (e, task, sourceColumn) => {
        setDraggedTask({ task, sourceColumn });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedTask(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetColumn) => {
        e.preventDefault();

        if (!draggedTask || draggedTask.sourceColumn === targetColumn) {
            return;
        }

        const { task, sourceColumn } = draggedTask;

        // Mise à jour du pourcentage d'avancement selon la colonne de destination
        let newPercentCompletion = task.percent_completion;

        if (targetColumn === 'to-do') {
            newPercentCompletion = 0;
        } else if (targetColumn === 'in-progress') {
            newPercentCompletion = 50;
        } else if (targetColumn === 'done') {
            newPercentCompletion = 100;
        }

        try {
            const payload = {
                title: task.title,
                description: task.description || '',
                due_date: task.due_date,
                assignee_id: task.assignee_id,
                percent_completion: newPercentCompletion,
                file_url: task.file_url,
                file_name: task.file_name
            };

            await axios.put(
                `http://localhost:5001/planification/${task.id}/update`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );

            // Mise à jour de l'état local
            const updatedTasks = tasks.map(t =>
                t.id === task.id ? { ...t, percent_completion: newPercentCompletion } : t
            );
            setTasks(updatedTasks);
            organizeTasks(updatedTasks);

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la tâche:', error);
            setError("Impossible de mettre à jour le statut de la tâche");
        }
    };

    // Gestion du formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Fonction pour ajouter un fichier
    const handleUpload = async (file) => {
        const accessToken = localStorage.getItem('accessToken');

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        if (project) {
            formDataUpload.append('project_id', project.id);
        }

        try {
            const response = await axios.post('http://localhost:5001/upload/file', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            const fileData = response.data.file;
            const downloadUrl = fileData.download_url;
            const fileName = fileData.filename;

            console.log('Fichier envoyé !', fileData);

            // Mettre à jour formData avec les informations du fichier
            setFormData(prevFormData => ({
                ...prevFormData,
                file_url: downloadUrl,
                file_name: fileName
            }));

            alert(`Fichier "${fileName}" attaché avec succès. Il sera lié à la tâche après enregistrement.`);

        } catch (error) {
            console.error('Erreur lors de l\'upload', error.response?.data || error);
            alert("Erreur lors de l'envoi du fichier.");
        }
    };

    // Création d'une nouvelle tâche
    const handleCreateTask = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                due_date: formData.due_date,
                assignee_id: formData.assignee_id || currentUser.id,
                file_url: formData.file_url || null,
                file_name: formData.file_name || null,
                priority: formData.priority
            };

            console.log('Payload envoyé:', payload);

            const response = await axios.post(
                `http://localhost:5001/planification/${project.id}/create_task`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );

            // Ajouter la nouvelle tâche à l'état
            const newTask = response.data.task;
            setTasks([...tasks, newTask]);

            // Mettre à jour les colonnes
            const updatedColumns = { ...columns };
            updatedColumns['to-do'].items.push(newTask);
            setColumns(updatedColumns);

            // Réinitialiser le formulaire
            setFormData({
                title: '',
                description: '',
                due_date: '',
                assignee_id: '',
                percent_completion: 0,
                file_url: '',
                file_name: '',
                priority: 'moyenne'
            });
            setShowCreateForm(false);

        } catch (error) {
            console.error('Erreur lors de la création de la tâche:', error);
            setError("Impossible de créer la tâche");
        }
    };

    // Mise à jour d'une tâche existante
    const handleUpdateTask = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                due_date: formData.due_date,
                assignee_id: formData.assignee_id,
                percent_completion: parseInt(formData.percent_completion),
                file_url: formData.file_url || null,
                file_name: formData.file_name || null,
                priority: formData.priority
            };

            const response = await axios.put(
                `http://localhost:5001/planification/${currentTask.id}/update`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );

            // Mettre à jour la tâche dans l'état
            const updatedTask = response.data.task;
            const updatedTasks = tasks.map(task =>
                task.id === updatedTask.id ? updatedTask : task
            );
            setTasks(updatedTasks);

            // Réorganiser les tâches
            organizeTasks(updatedTasks);

            // Réinitialiser le formulaire
            setCurrentTask(null);
            setShowEditForm(false);

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la tâche:', error);
            setError("Impossible de mettre à jour la tâche");
        }
    };

    // Suppression d'une tâche
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5001/planification/${taskId}/delete`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // Supprimer la tâche de l'état
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            setTasks(updatedTasks);

            // Réorganiser les tâches
            organizeTasks(updatedTasks);

        } catch (error) {
            console.error('Erreur lors de la suppression de la tâche:', error);
            setError("Impossible de supprimer la tâche");
        }
    };

    // Ouverture du formulaire d'édition
    const openEditForm = (task) => {
        setCurrentTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            due_date: task.due_date.split('T')[0], // Format YYYY-MM-DD pour l'input date
            assignee_id: task.assignee_id,
            percent_completion: task.percent_completion,
            file_url: task.file_url || '',
            file_name: task.file_name || '',
            priority: task.priority || 'moyenne'
        });
        setShowEditForm(true);
    };

    // Format de date pour l'affichage
    const formatDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            return format(date, "d MMMM yyyy", { locale: fr });
        } catch (e) {
            return dateString;
        }
    };

    // Obtenir la couleur de la priorité
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'haute':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'basse':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default: // moyenne
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    // Obtenir l'icône de la priorité
    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'haute':
                return '🟥';
            case 'basse':
                return '🟦';
            default: // moyenne
                return '🟧';
        }
    };
    const getMemberName = (userId) => {
        const member = projectMembers.find(m => m.user_id === userId);
        return member ? member.name : "Non assigné";
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des tâches...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Gestion des tâches</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                >
                    <PlusCircle size={18} className="mr-2" />
                    Nouvelle tâche
                </button>
            </div>

            {/* Statistiques du projet */}
            {project && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-2">Progression du projet</h3>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                            {tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                            {projectProgress}% complété
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-green-500 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${projectProgress}%` }}
                        ></div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                        <div className="text-center">
                            <div className="font-medium text-red-600">{columns['to-do']?.items.length || 0}</div>
                            <div>À faire</div>
                        </div>
                        <div className="text-center">
                            <div className="font-medium text-yellow-600">{columns['in-progress']?.items.length || 0}</div>
                            <div>En cours</div>
                        </div>
                        <div className="text-center">
                            <div className="font-medium text-green-600">{columns['done']?.items.length || 0}</div>
                            <div>Terminées</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulaire de création de tâche */}
            {showCreateForm && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Créer une nouvelle tâche</h3>
                    <form onSubmit={handleCreateTask}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre*</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance*</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                                <select
                                    name="assignee_id"
                                    value={formData.assignee_id}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Sélectionner un membre</option>
                                    {projectMembers.map(member => (
                                        <option key={member.user_id} value={member.user_id}>
                                            {member.name} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Joindre un fichier</label>
                                <input
                                    type="file"
                                    id="fileInputCreate"
                                    className="hidden"
                                    onChange={(e) => handleUpload(e.target.files[0])}
                                />
                                <label htmlFor="fileInputCreate">
                                    <div className="flex items-center px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                                        <Paperclip className="w-4 h-4 mr-2" />
                                        {formData.file_name ? `Fichier: ${formData.file_name}` : 'Sélectionner un fichier'}
                                    </div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="basse">🟦 Basse</option>
                                    <option value="moyenne">🟧 Moyenne</option>
                                    <option value="haute">🟥 Haute</option>
                                </select>
                            </div>
 
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                Créer la tâche
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Formulaire d'édition de tâche */}
            {showEditForm && currentTask && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Modifier la tâche</h3>
                    <form onSubmit={handleUpdateTask}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre*</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance*</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                                <select
                                    name="assignee_id"
                                    value={formData.assignee_id}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Sélectionner un membre</option>
                                    {projectMembers.map(member => (
                                        <option key={member.user_id} value={member.user_id}>
                                            {member.name} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Joindre un fichier</label>
                                <input
                                    type="file"
                                    id="fileInputEdit"
                                    className="hidden"
                                    onChange={(e) => handleUpload(e.target.files[0])}
                                />
                                <label htmlFor="fileInputEdit">
                                    <div className="flex items-center px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                                        <Paperclip className="w-4 h-4 mr-2" />
                                        {formData.file_name ? `Fichier: ${formData.file_name}` : 'Sélectionner un fichier'}
                                    </div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="basse">🟦 Basse</option>
                                    <option value="moyenne">🟧 Moyenne</option>
                                    <option value="haute">🟥 Haute</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Progression (%)</label>
                                <input
                                    type="number"
                                    name="percent_completion"
                                    value={formData.percent_completion}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowEditForm(false)}
                                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tableau Kanban avec drag & drop natif */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(columns).map(([columnId, column]) => (
                    <div
                        key={columnId}
                        className="bg-white p-3 rounded-lg shadow"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, columnId)}
                    >
                        <h3 className="font-medium text-lg mb-3 flex items-center">
                            <span
                                className={`inline-block h-3 w-3 rounded-full mr-2 ${columnId === 'to-do' ? 'bg-red-500' :
                                        columnId === 'in-progress' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                            ></span>
                            {column.name}
                            <span className="ml-2 text-gray-500 text-sm">({column.items.length})</span>
                        </h3>
                        <div className="min-h-[300px]">
                            {column.items.map((task) => (
                                <div
                                    key={task.id}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, task, columnId)}
                                    onDragEnd={handleDragEnd}
                                    className={`p-3 mb-2 rounded-md border-l-4 bg-white shadow-sm cursor-move transition-shadow hover:shadow-md ${columnId === 'to-do' ? 'border-red-500' :
                                            columnId === 'in-progress' ? 'border-yellow-500' : 'border-green-500'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                            <h4 className="font-medium">{task.title}</h4>
                                            {task.file_url && (
                                                <Paperclip
                                                    size={14}
                                                    className="ml-2 text-gray-500"
                                                    title="Pièce jointe"
                                                />
                                            )}
                                        </div>
                                        <div className="flex">
                                            <button
                                                onClick={() => openEditForm(task)}
                                                className="text-gray-500 hover:text-blue-500 mr-2"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="text-gray-500 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {task.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                                    )}

                                    {/* Badges pour priorité */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {task.priority && (
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>
                                                {getPriorityIcon(task.priority)} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Affichage de la pièce jointe si elle existe */}
                                    {task.file_url && (
                                        <div className="mt-2">
                                            {task.file_name && /\.(jpg|jpeg|png|gif|webp)$/i.test(task.file_name) ? (
                                                <div className="mt-2">
                                                    <img
                                                        src={task.file_url}
                                                        alt={task.file_name}
                                                        className="max-w-full rounded-md max-h-32 object-contain mb-1"
                                                    />
                                                    <a
                                                        href={task.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 underline"
                                                    >
                                                        Voir l'image: {task.file_name}
                                                    </a>
                                                </div>
                                            ) : (
                                                <a
                                                    href={task.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 underline flex items-center"
                                                >
                                                    <Paperclip className="w-3 h-3 mr-1" />
                                                    {task.file_name || 'Fichier joint'}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between mt-3 text-xs text-gray-500">
                                        <div>
                                            Assigné: {getMemberName(task.assignee_id)}
                                        </div>
                                        <div>
                                            {formatDate(task.due_date)}
                                        </div>
                                    </div>
                                    {columnId === 'in-progress' && (
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-yellow-500 h-1.5 rounded-full"
                                                    style={{ width: `${task.percent_completion}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-right mt-0.5 text-xs text-gray-500">
                                                {task.percent_completion}%
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskBoard;