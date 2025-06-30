import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    const [originalUserInfo, setOriginalUserInfo] = useState({});
    const [originalCvProfile, setOriginalCvProfile] = useState({});
    const [isEditable, setIsEditable] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Récupérer les informations utilisateur
                const userResponse = await axios.get('http://localhost:5001/users/profile', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                setUserInfo(userResponse.data);
                setOriginalUserInfo(userResponse.data);

                // Récupérer le profil CV
                const cvProfileResponse = await axios.get('http://localhost:5001/cv/profile', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                setCvProfile(cvProfileResponse.data);
                setOriginalCvProfile(cvProfileResponse.data);

                // Récupérer les projets CV
                const cvProjectsResponse = await axios.get('http://localhost:5001/cv/projects', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                setCvProjects(cvProjectsResponse.data.projects);
            } catch (error) {
                console.error("Erreur lors de la récupération des données", error);
            }
        };

        fetchData();
    }, [currentUser]);

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

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            alert('Veuillez entrer votre mot de passe pour confirmer la suppression.');
            return;
        }

        if (!window.confirm('Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement supprimées.')) {
            return;
        }

        try {
            const response = await axios.delete('http://localhost:5001/users/delete_account', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                data: {
                    password: deletePassword
                }
            });

            if (response.status === 200) {
                alert(response.data.message || 'Votre compte a été traité avec succès. Vous allez être déconnecté.');
                logout(); // Déconnecter l'utilisateur
                navigate('/'); // Rediriger vers la page d'accueil
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                alert(`Erreur: ${error.response.data.message}`);
            } else {
                alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
            }
            console.error("Erreur lors de la suppression du compte", error);
        }
    };

    const techsToDisplay = technologies[userInfo.typeDeveloppeur] || [];

    return (
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
                                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                                                userInfo.technologies.includes(tech) 
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
                                    <div key={project.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">{project.project_name}</h3>
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

            {/* Zone de danger - Suppression du compte */}
            {!isEditable && (
                <div className="mt-12 pt-8 border-t border-red-200">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-lg font-medium text-red-800">Zone de danger</h3>
                                <p className="mt-2 text-sm text-red-700">
                                    La suppression de votre compte est irréversible. Vos données personnelles et informations 
                                    de CV seront définitivement supprimées. Si vous participez à des projets collaboratifs, 
                                    votre profil sera anonymisé pour préserver l'intégrité des projets conformément au RGPD.
                                </p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Supprimer mon compte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Confirmer la suppression du compte
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Cette action supprimera définitivement vos données personnelles. Si vous participez 
                                            à des projets, votre profil sera anonymisé. Pour confirmer, veuillez entrer votre mot de passe.
                                        </p>
                                        <div className="mt-4">
                                            <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700">
                                                Mot de passe
                                            </label>
                                            <input
                                                type="password"
                                                id="delete-password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm px-3 py-2"
                                                placeholder="Entrez votre mot de passe"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Supprimer définitivement
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                    }}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
