import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Users, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';

const ProjectDetailModal = ({ isOpen, onClose, projectId }) => {
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
            setSubtasks(subtasksResponse.data.tasks);

            // Récupérer les tâches en attente de validation
            const pendingResponse = await axios.get(`http://localhost:5001/validation/project/${projectId}/pending`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setFeedback(pendingResponse.data.pending_tasks);
            setProjectDetails(pendingResponse.data);

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
                        Détails du projet: {projectDetails?.project_name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
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
                                        <p className="text-2xl font-bold text-blue-600">{validationStats.total_tasks}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-green-800">Validées</h4>
                                        <p className="text-2xl font-bold text-green-600">{validationStats.validated_tasks}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-red-800">Rejetées</h4>
                                        <p className="text-2xl font-bold text-red-600">{validationStats.rejected_tasks}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-yellow-800">En attente</h4>
                                        <p className="text-2xl font-bold text-yellow-600">{validationStats.pending_tasks}</p>
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
                                    {subtasks.map((task) => (
                                        <div key={task.task_id} className="border border-gray-200 p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-gray-800">{task.task_title}</h4>
                                                <span className={`px-2 py-1 text-xs rounded-full ${task.task_completion === 100 ? 'bg-green-100 text-green-800' :
                                                    task.task_completion > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {task.task_completion}% complété
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
                                    ))}
                                </div>
                            </div>

                            {/* Section Feedback client */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <MessageSquare className="w-6 h-6 text-green-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">Feedback client</h3>
                                </div>

                                {/* Tâches en attente de validation */}
                                {feedback.length > 0 && (
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
                                {validationStats && (
                                    <div className="space-y-4">
                                        {/* Tâches validées */}
                                        {validationStats.validation_history.validated.length > 0 && (
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
                                        {validationStats.validation_history.rejected.length > 0 && (
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

                                {feedback.length === 0 && (!validationStats ||
                                    (validationStats.validation_history.validated.length === 0 &&
                                        validationStats.validation_history.rejected.length === 0)) && (
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
                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
    const [userInfo, setUserInfo] = useState({
        prenom: '',
        nom: '',
        role: '',
        email: '',
        typeDeveloppeur: '',
        technologies: []
    });

    const [cvProfile, setCvProfile] = useState({
        etudes: '',
        ambitions: '',
        linkedin_url: '',
        portfolio_url: '',
        github_url: ''
    });

    const [cvProjects, setCvProjects] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [skillCategories, setSkillCategories] = useState([]);
    const [showAddSkillModal, setShowAddSkillModal] = useState(false);
    const [showEditSkillModal, setShowEditSkillModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [skillFormData, setSkillFormData] = useState({
        skill_id: '',
        level: 'débutant',
        experience_years: '',
        self_assessment: '',
        notes: ''
    });
    const [originalUserInfo, setOriginalUserInfo] = useState({});
    const [originalCvProfile, setOriginalCvProfile] = useState({});
    const [isEditable, setIsEditable] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('🔄 Début du chargement des données...');

                // Récupérer les informations utilisateur
                const userResponse = await axios.get('http://localhost:5001/users/profile', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                console.log('✅ User data loaded:', userResponse.data);
                setUserInfo(userResponse.data);
                setOriginalUserInfo(userResponse.data);

                // Récupérer le profil CV
                const cvProfileResponse = await axios.get('http://localhost:5001/cv/profile', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                console.log('✅ CV profile loaded:', cvProfileResponse.data);
                setCvProfile(cvProfileResponse.data);
                setOriginalCvProfile(cvProfileResponse.data);

                // Récupérer les projets CV
                const cvProjectsResponse = await axios.get('http://localhost:5001/cv/projects', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                console.log('✅ CV projects loaded:', cvProjectsResponse.data);
                setCvProjects(cvProjectsResponse.data.projects);

                // Récupérer les compétences de l'utilisateur
                const userSkillsResponse = await axios.get('http://localhost:5001/skills/user/list', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                console.log('✅ User skills loaded:', userSkillsResponse.data);
                setUserSkills(userSkillsResponse.data.user_skills);

                // Récupérer toutes les compétences disponibles
                console.log('🔍 Tentative de chargement des compétences disponibles...');
                const availableSkillsResponse = await axios.get('http://localhost:5001/skills/list', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                console.log('📦 Raw available skills response:', availableSkillsResponse);
                console.log('📋 Available skills data:', availableSkillsResponse.data);

                const skillsData = availableSkillsResponse.data.skills || availableSkillsResponse.data || [];
                console.log('🎯 Final skills data to set:', skillsData);
                setAvailableSkills(skillsData);

                // Récupérer les catégories de compétences
                const categoriesResponse = await axios.get('http://localhost:5001/skills/categories', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                console.log('✅ Categories loaded:', categoriesResponse.data);
                setSkillCategories(categoriesResponse.data.categories);

                console.log('🎉 Toutes les données ont été chargées avec succès !');

            } catch (error) {
                console.error("❌ Erreur lors de la récupération des données", error);

                // Log détaillé de l'erreur
                if (error.response) {
                    console.error("📄 Response data:", error.response.data);
                    console.error("📊 Response status:", error.response.status);
                    console.error("📋 Response headers:", error.response.headers);
                } else if (error.request) {
                    console.error("📡 Request error:", error.request);
                } else {
                    console.error("⚙️ Setup error:", error.message);
                }
            }
        };

        if (currentUser) {
            console.log('👤 Current user exists, fetching data...');
            fetchData();
        } else {
            console.log('❌ No current user, skipping data fetch');
        }
    }, [currentUser]);

    // Fonction pour ouvrir la modale d'ajout de compétence
    const openAddSkillModal = () => {
        setSkillFormData({
            skill_id: '',
            level: 'débutant',
            experience_years: '',
            self_assessment: '',
            notes: ''
        });
        setShowAddSkillModal(true);
    };

    // Fonction pour gérer les changements dans le formulaire de compétence
    const handleSkillFormChange = (e) => {
        const { name, value } = e.target;
        setSkillFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Fonction pour ajouter une nouvelle compétence
    const handleAddSkill = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5001/skills/user/add', skillFormData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // Rafraîchir la liste des compétences utilisateur
            const userSkillsResponse = await axios.get('http://localhost:5001/skills/user/list', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setUserSkills(userSkillsResponse.data.user_skills);

            // Fermer la modale et réinitialiser le formulaire
            setShowAddSkillModal(false);
            setSkillFormData({
                skill_id: '',
                level: 'débutant',
                experience_years: '',
                self_assessment: '',
                notes: ''
            });

            console.log('Compétence ajoutée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la compétence:', error);
            alert('Erreur lors de l\'ajout de la compétence');
        }
    };

    // Fonction pour ouvrir la modale de modification de compétence
    const openEditSkillModal = (userSkill) => {
        setSelectedSkill(userSkill);
        setSkillFormData({
            skill_id: userSkill.skill_id,
            level: userSkill.level,
            experience_years: userSkill.experience_years || '',
            self_assessment: userSkill.self_assessment || '',
            notes: userSkill.notes || ''
        });
        setShowEditSkillModal(true);
    };

    // Fonction pour mettre à jour une compétence
    const handleUpdateSkill = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(
                `http://localhost:5001/skills/user/update/${selectedSkill.id}`,
                skillFormData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );

            // Rafraîchir la liste des compétences utilisateur
            const userSkillsResponse = await axios.get('http://localhost:5001/skills/user/list', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setUserSkills(userSkillsResponse.data.user_skills);

            // Fermer la modale et réinitialiser
            setShowEditSkillModal(false);
            setSelectedSkill(null);
            setSkillFormData({
                skill_id: '',
                level: 'débutant',
                experience_years: '',
                self_assessment: '',
                notes: ''
            });

            console.log('Compétence mise à jour avec succès');
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la compétence:', error);
            alert('Erreur lors de la mise à jour de la compétence');
        }
    };

    // Fonction pour supprimer une compétence
    const handleDeleteSkill = async (userSkillId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5001/skills/user/remove/${userSkillId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // Rafraîchir la liste des compétences utilisateur
            const userSkillsResponse = await axios.get('http://localhost:5001/skills/user/list', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setUserSkills(userSkillsResponse.data.user_skills);

            console.log('Compétence supprimée avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression de la compétence:', error);
            alert('Erreur lors de la suppression de la compétence');
        }
    };

    const handleEdit = () => {
        setIsEditable(true);
    };

    const handleCancel = () => {
        setUserInfo(originalUserInfo);
        setCvProfile(originalCvProfile);
        setIsEditable(false);
    };

    const handleSave = async () => {
        try {
            // Sauvegarder les informations utilisateur
            const userResponse = await axios.put('http://localhost:5001/users/profile', userInfo, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setUserInfo(userResponse.data);
            setOriginalUserInfo(userResponse.data);

            // Sauvegarder le profil CV
            await axios.put('http://localhost:5001/cv/profile', cvProfile, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setOriginalCvProfile(cvProfile);

            setIsEditable(false);
        } catch (error) {
            console.error("Erreur lors de la mise à jour des données", error);
        }
    };

    const handleProjectClick = (projectId) => {
        setSelectedProjectId(projectId);
        setShowProjectModal(true);
    };

    const displayRole = (role) => {
        if (role === 'businessman') {
            return 'Entrepreneur';
        } else if (role === 'student') {
            return 'Étudiant';
        }
        return role;
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

    const normalizeUrl = (url) => {
        if (!url) return '';
        // Retirer le protocole s'il existe déjà pour éviter les doublons
        let cleanUrl = url.replace(/^https?:\/\//, '');
        return cleanUrl;
    };

    const handleUrlChange = (field, value) => {
        const normalizedValue = normalizeUrl(value);
        setCvProfile({ ...cvProfile, [field]: normalizedValue });
    };

    const technologies = {
        FrontEnd: ["HTML", "CSS", "JavaScript", "React", "Vue"],
        BackEnd: ["Node.js", "Python", "Java", "PHP", "Ruby", "MongoDB", "SQL"],
        FullStack: ["HTML", "CSS", "JavaScript", "Node.js", "React", "MongoDB", "SQL", "Ruby", "PHP", "Java", "Python", "Vue"],
        Designer: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
    };

    const handleSelectTech = (tech) => {
        if (!isEditable) return;
        const newSelectedTechs = userInfo.technologies.includes(tech)
            ? userInfo.technologies.filter(t => t !== tech)
            : [...userInfo.technologies, tech];
        setUserInfo({ ...userInfo, technologies: newSelectedTechs });
    };

    const techsToDisplay = technologies[userInfo.typeDeveloppeur] || [];

    // Obtenir la couleur du niveau de compétence
    const getSkillLevelColor = (level) => {
        switch (level) {
            case 'avancé':
                return 'bg-green-100 text-green-800';
            case 'intermédiaire':
                return 'bg-yellow-100 text-yellow-800';
            case 'débutant':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Grouper les compétences par catégorie
    const groupSkillsByCategory = () => {
        const grouped = {};
        userSkills.forEach(userSkill => {
            const skill = availableSkills.find(s => s.id === userSkill.skill_id);
            if (skill) {
                const category = skill.category || 'Autres';
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push({
                    ...userSkill,
                    skill_name: skill.name,
                    skill_description: skill.description
                });
            }
        });
        return grouped;
    };

    return (
        <>
            <div className="max-w-6xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg mb-10">
                {/* En-tête du CV */}
                <div className="border-b-2 border-green-600 pb-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                {userInfo.prenom} {userInfo.nom}
                            </h1>
                            <p className="text-xl text-green-600 font-semibold mb-2">
                                {displayRole(userInfo.role)} {userInfo.typeDeveloppeur && `• ${userInfo.typeDeveloppeur}`}
                            </p>
                            <p className="text-gray-600">{userInfo.email}</p>

                            {/* Liens sociaux */}
                            <div className="flex space-x-4 mt-3">
                                {cvProfile.linkedin_url && (
                                    <a href={cvProfile.linkedin_url.startsWith('http') ? cvProfile.linkedin_url : `https://${cvProfile.linkedin_url}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800">
                                        LinkedIn
                                    </a>
                                )}
                                {cvProfile.portfolio_url && (
                                    <a href={cvProfile.portfolio_url.startsWith('http') ? cvProfile.portfolio_url : `https://${cvProfile.portfolio_url}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-purple-600 hover:text-purple-800">
                                        Portfolio
                                    </a>
                                )}
                                {cvProfile.github_url && (
                                    <a href={cvProfile.github_url.startsWith('http') ? cvProfile.github_url : `https://${cvProfile.github_url}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-gray-800 hover:text-gray-600">
                                        GitHub
                                    </a>
                                )}
                            </div>
                        </div>

                        {!isEditable && (
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Modifier le CV
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne de gauche */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Informations personnelles */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Informations</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                    <input
                                        type="text"
                                        value={userInfo.prenom}
                                        onChange={(e) => setUserInfo({ ...userInfo, prenom: e.target.value })}
                                        disabled={!isEditable}
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                                    <input
                                        type="text"
                                        value={userInfo.nom}
                                        onChange={(e) => setUserInfo({ ...userInfo, nom: e.target.value })}
                                        disabled={!isEditable}
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="text"
                                        value={userInfo.email}
                                        disabled={!isEditable}
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Liens */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Liens</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            https://
                                        </span>
                                        <input
                                            type="text"
                                            value={cvProfile.linkedin_url}
                                            onChange={(e) => handleUrlChange('linkedin_url', e.target.value)}
                                            disabled={!isEditable}
                                            placeholder="linkedin.com/in/votre-profil"
                                            className={`flex-1 rounded-none rounded-r-md border-gray-300 ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Portfolio</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            https://
                                        </span>
                                        <input
                                            type="text"
                                            value={cvProfile.portfolio_url}
                                            onChange={(e) => handleUrlChange('portfolio_url', e.target.value)}
                                            disabled={!isEditable}
                                            placeholder="votre-portfolio.com"
                                            className={`flex-1 rounded-none rounded-r-md border-gray-300 ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">GitHub</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            https://
                                        </span>
                                        <input
                                            type="text"
                                            value={cvProfile.github_url}
                                            onChange={(e) => handleUrlChange('github_url', e.target.value)}
                                            disabled={!isEditable}
                                            placeholder="github.com/votre-username"
                                            className={`flex-1 rounded-none rounded-r-md border-gray-300 ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technologies */}
                        {userInfo.role !== 'businessman' && (
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences Techniques</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de développeur</label>
                                    {isEditable ? (
                                        <select
                                            value={userInfo.typeDeveloppeur}
                                            onChange={(e) => setUserInfo({ ...userInfo, typeDeveloppeur: e.target.value })}
                                            className="mb-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
                                        >
                                            <option value="FrontEnd">FrontEnd</option>
                                            <option value="BackEnd">BackEnd</option>
                                            <option value="FullStack">FullStack</option>
                                            <option value="Designer">Designer</option>
                                        </select>
                                    ) : (
                                        <p className="mb-4 text-gray-700 font-medium">{userInfo.typeDeveloppeur}</p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {techsToDisplay.map((tech, index) => (
                                            <span
                                                key={index}
                                                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${userInfo.technologies.includes(tech)
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    } ${isEditable ? 'hover:shadow-md' : 'cursor-default'}`}
                                                onClick={() => handleSelectTech(tech)}
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                    {isEditable && <p className="text-sm text-gray-500 mt-2">Cliquez sur les technologies pour les ajouter ou les supprimer.</p>}
                                </div>
                            </div>
                        )}

                        {/* Compétences */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences</h2>

                            {Object.entries(groupSkillsByCategory()).length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(groupSkillsByCategory()).map(([category, skills]) => (
                                        <div key={category}>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">{category}</h3>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {skills.map((userSkill) => (
                                                    <div key={userSkill.id} className="group relative">
                                                        <div className="flex items-center">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillLevelColor(userSkill.level)}`}>
                                                                {userSkill.skill_name}
                                                            </span>

                                                            {/* Boutons d'action */}
                                                            <div className="ml-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => openEditSkillModal(userSkill)}
                                                                    className="p-1 text-blue-600 hover:text-blue-800"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSkill(userSkill.id)}
                                                                    className="p-1 text-red-600 hover:text-red-800"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Tooltip avec détails */}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                            <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                                                                <div className="font-semibold">{userSkill.skill_name}</div>
                                                                <div>Niveau: {userSkill.level}</div>
                                                                {userSkill.self_assessment && (
                                                                    <div>Auto-évaluation: {userSkill.self_assessment}/10</div>
                                                                )}
                                                                {userSkill.experience_years && (
                                                                    <div>Expérience: {userSkill.experience_years} ans</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 text-sm">Aucune compétence ajoutée</p>
                                    <button
                                        onClick={openAddSkillModal}
                                        className="mt-2 text-green-600 text-sm hover:text-green-700"
                                    >
                                        + Ajouter vos premières compétences
                                    </button>
                                </div>
                            )}

                            {/* Bouton d'ajout si des compétences existent déjà */}
                            {userSkills.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={openAddSkillModal}
                                        className="w-full py-2 px-4 border border-green-600 text-green-600 rounded-md hover:bg-green-50 text-sm"
                                    >
                                        + Ajouter une compétence
                                    </button>
                                </div>
                            )}

                            {/* Statistiques rapides */}
                            {userSkills.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Total: {userSkills.length} compétences</span>
                                        <div className="flex space-x-3">
                                            <span className="text-green-600">
                                                Avancé: {userSkills.filter(s => s.level === 'avancé').length}
                                            </span>
                                            <span className="text-yellow-600">
                                                Intermédiaire: {userSkills.filter(s => s.level === 'intermédiaire').length}
                                            </span>
                                            <span className="text-blue-600">
                                                Débutant: {userSkills.filter(s => s.level === 'débutant').length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne de droite */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ambitions */}
                        <div className="bg-white border border-gray-200 p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Objectifs Professionnels</h2>
                            <textarea
                                value={cvProfile.ambitions}
                                onChange={(e) => setCvProfile({ ...cvProfile, ambitions: e.target.value })}
                                disabled={!isEditable}
                                placeholder="Décrivez vos ambitions et objectifs de carrière..."
                                rows={4}
                                className={`w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                            />
                        </div>

                        {/* Études */}
                        <div className="bg-white border border-gray-200 p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Formation</h2>
                            <textarea
                                value={cvProfile.etudes}
                                onChange={(e) => setCvProfile({ ...cvProfile, etudes: e.target.value })}
                                disabled={!isEditable}
                                placeholder="Décrivez votre parcours éducatif..."
                                rows={4}
                                className={`w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                            />
                        </div>

                        {/* Projets */}
                        <div className="bg-white border border-gray-200 p-6 rounded-lg">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Expérience Projets</h2>
                            {cvProjects.length > 0 ? (
                                <div className="space-y-4">
                                    {cvProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="border border-gray-200 p-4 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleProjectClick(project.project_id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600">
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
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Mes tâches ({project.tasks.length})</h4>
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
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Aucun projet TeamBrains dans votre CV pour le moment.</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Rejoignez des projets pour enrichir automatiquement votre CV !
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                {isEditable && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Enregistrer les modifications
                        </button>
                    </div>
                )}
            </div>

            {/* Modale de détail du projet */}
            <ProjectDetailModal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                projectId={selectedProjectId}
            />

            {/* Modale d'ajout de compétence */}
            {showAddSkillModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Ajouter une compétence</h2>
                            <button
                                onClick={() => setShowAddSkillModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSkill} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Compétence</label>
                                <select
                                    name="skill_id"
                                    value={skillFormData.skill_id}
                                    onChange={handleSkillFormChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Sélectionner une compétence</option>
                                    {console.log('Available skills in select:', availableSkills)}
                                    {availableSkills && availableSkills.length > 0 ? (
                                        availableSkills
                                            .filter(skill => !userSkills.some(us => us.skill_id === skill.id))
                                            .map(skill => (
                                                <option key={skill.id} value={skill.id}>
                                                    {skill.name} {skill.category && `(${skill.category})`}
                                                </option>
                                            ))
                                    ) : (
                                        <option disabled>Chargement des compétences...</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                                <select
                                    name="level"
                                    value={skillFormData.level}
                                    onChange={handleSkillFormChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="débutant">🔽 Débutant</option>
                                    <option value="intermédiaire">➡️ Intermédiaire</option>
                                    <option value="avancé">🚀 Avancé</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                                <input
                                    type="number"
                                    name="experience_years"
                                    value={skillFormData.experience_years}
                                    onChange={handleSkillFormChange}
                                    min="0"
                                    max="50"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Ex: 3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-évaluation (1-10)</label>
                                <input
                                    type="number"
                                    name="self_assessment"
                                    value={skillFormData.self_assessment}
                                    onChange={handleSkillFormChange}
                                    min="1"
                                    max="10"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Ex: 7"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={skillFormData.notes}
                                    onChange={handleSkillFormChange}
                                    rows="3"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Projets réalisés, certifications..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSkillModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modale de modification de compétence */}
            {showEditSkillModal && selectedSkill && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                Modifier: {availableSkills.find(s => s.id === selectedSkill.skill_id)?.name}
                            </h2>
                            <button
                                onClick={() => setShowEditSkillModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSkill} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                                <select
                                    name="level"
                                    value={skillFormData.level}
                                    onChange={handleSkillFormChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="débutant">🔽 Débutant</option>
                                    <option value="intermédiaire">➡️ Intermédiaire</option>
                                    <option value="avancé">🚀 Avancé</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                                <input
                                    type="number"
                                    name="experience_years"
                                    value={skillFormData.experience_years}
                                    onChange={handleSkillFormChange}
                                    min="0"
                                    max="50"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Ex: 3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-évaluation (1-10)</label>
                                <input
                                    type="number"
                                    name="self_assessment"
                                    value={skillFormData.self_assessment}
                                    onChange={handleSkillFormChange}
                                    min="1"
                                    max="10"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Ex: 7"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={skillFormData.notes}
                                    onChange={handleSkillFormChange}
                                    rows="3"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Projets réalisés, certifications..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditSkillModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Modifier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Profile;