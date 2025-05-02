import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskBoard = () => {
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
        percent_completion: 0
    });
    const [projectMembers, setProjectMembers] = useState([]);
    const [error, setError] = useState(null);

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
        const fetchTasks = async () => {
            if (project) {
                try {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:5001/planification/${project.id}/tasks`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                    setTasks(response.data.tasks);
                    organizeTasks(response.data.tasks);
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
    };

    // Gestion du formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Création d'une nouvelle tâche
    const handleCreateTask = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                due_date: formData.due_date,
                assignee_id: formData.assignee_id || currentUser.id
            };

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
                percent_completion: 0
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
                percent_completion: parseInt(formData.percent_completion)
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
            percent_completion: task.percent_completion
        });
        setShowEditForm(true);
    };

    // Gestion du drag and drop
    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) {
            // Réorganisation dans la même colonne
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);

            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...column,
                    items: copiedItems
                }
            });
        } else {
            // Changement de colonne = changement de statut
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [removed] = sourceItems.splice(source.index, 1);

            // Mise à jour du pourcentage d'avancement selon la colonne de destination
            let newPercentCompletion = removed.percent_completion;

            if (destination.droppableId === 'to-do') {
                newPercentCompletion = 0;
            } else if (destination.droppableId === 'in-progress') {
                newPercentCompletion = 50; // Valeur par défaut pour "En cours"
            } else if (destination.droppableId === 'done') {
                newPercentCompletion = 100;
            }

            // Mise à jour de la tâche dans l'API
            try {
                const taskToUpdate = { ...removed, percent_completion: newPercentCompletion };
                const payload = {
                    title: taskToUpdate.title,
                    description: taskToUpdate.description || '',
                    due_date: taskToUpdate.due_date,
                    assignee_id: taskToUpdate.assignee_id,
                    percent_completion: newPercentCompletion
                };

                await axios.put(
                    `http://localhost:5001/planification/${taskToUpdate.id}/update`,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    }
                );

                // Mise à jour de l'élément avant de l'ajouter à la nouvelle colonne
                removed.percent_completion = newPercentCompletion;
                destItems.splice(destination.index, 0, removed);

                setColumns({
                    ...columns,
                    [source.droppableId]: {
                        ...sourceColumn,
                        items: sourceItems
                    },
                    [destination.droppableId]: {
                        ...destColumn,
                        items: destItems
                    }
                });

                // Mettre à jour la liste de tâches
                const updatedTasks = tasks.map(task =>
                    task.id === removed.id ? { ...task, percent_completion: newPercentCompletion } : task
                );
                setTasks(updatedTasks);

            } catch (error) {
                console.error('Erreur lors de la mise à jour de la tâche:', error);
                setError("Impossible de mettre à jour le statut de la tâche");
                // Rétablir l'état précédent en cas d'erreur
                organizeTasks(tasks);
            }
        }
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

    // Obtenir le nom d'un membre à partir de son ID
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
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-green-500 h-4 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                        ></div>
                    </div>
                    <div className="text-right mt-1 text-sm text-gray-600">
                        {Math.round(project.progress || 0)}% complété
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

            {/* Tableau Kanban */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <div key={columnId} className="bg-white p-3 rounded-lg shadow">
                            <h3 className="font-medium text-lg mb-3 flex items-center">
                                <span
                                    className={`inline-block h-3 w-3 rounded-full mr-2 ${columnId === 'to-do' ? 'bg-red-500' :
                                            columnId === 'in-progress' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                ></span>
                                {column.name}
                                <span className="ml-2 text-gray-500 text-sm">({column.items.length})</span>
                            </h3>
                            <Droppable droppableId={columnId}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-50' : ''
                                            }`}
                                    >
                                        {column.items.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-3 mb-2 rounded-md border-l-4 bg-white shadow-sm ${snapshot.isDragging ? 'shadow-md' : ''
                                                            } ${columnId === 'to-do' ? 'border-red-500' :
                                                                columnId === 'in-progress' ? 'border-yellow-500' : 'border-green-500'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-medium">{task.title}</h4>
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
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default TaskBoard;