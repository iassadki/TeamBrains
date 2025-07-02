import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Composants Profile
import ProfileHeader from './Profile/ProfileHeader';
import PersonalInfoSection from './Profile/PersonalInfoSection';
import SocialLinksSection from './Profile/SocialLinksSection';
import TechnicalSkillsSection from './Profile/TechnicalSkillsSection';
// import SkillsManagementSection from './Profile/SkillsManagementSection';
import ObjectivesSection from './Profile/ObjectivesSection';
import EducationSection from './Profile/EducationSection';
import ProjectsSection from './Profile/ProjectsSection';
import ActionButtons from './Profile/ActionButtons';
import DangerZone from './Profile/DangerZone';

// Modals
import DeleteAccountModal from './Profile/Modals/DeleteAccountModal';
import ProjectDetailsModal from './Profile/Modals/ProjectDetailsModal';

const Profile = () => {
    // États principaux
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

    // États de contrôle
    const [originalUserInfo, setOriginalUserInfo] = useState({});
    const [originalCvProfile, setOriginalCvProfile] = useState({});
    const [isEditable, setIsEditable] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);

    // Hooks
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // Chargement des données
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

        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    // Fonctions utilitaires
    const displayRole = (role) => {
        if (role === 'businessman') return 'Entrepreneur';
        if (role === 'student') return 'Étudiant';
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
        return url.replace(/^https?:\/\//, '');
    };

    // Gestionnaires d'événements
    const handleEdit = () => setIsEditable(true);

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

    const handleProjectVisibilityChange = (cvProjectId, isVisible) => {
        // Mettre à jour l'état local des projets CV
        setCvProjects(prevProjects =>
            prevProjects.map(project =>
                project.id === cvProjectId
                    ? { ...project, is_visible: isVisible }
                    : project
            )
        );

        console.log(`Projet CV ${cvProjectId} mis à jour: ${isVisible ? 'visible' : 'masqué'}`);
    };

    const handleUrlChange = (field, value) => {
        const normalizedValue = normalizeUrl(value);
        setCvProfile({ ...cvProfile, [field]: normalizedValue });
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
                data: { password: deletePassword }
            });

            if (response.status === 200) {
                alert(response.data.message || 'Votre compte a été traité avec succès. Vous allez être déconnecté.');
                logout();
                navigate('/');
            }
        } catch (error) {
            if (error.response?.data?.message) {
                alert(`Erreur: ${error.response.data.message}`);
            } else {
                alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
            }
            console.error("Erreur lors de la suppression du compte", error);
        }
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletePassword('');
    };

    return (
        <>
            <div className="max-w-6xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg mb-10">
                {/* En-tête du CV */}
                <ProfileHeader
                    userInfo={userInfo}
                    cvProfile={cvProfile}
                    isEditable={isEditable}
                    onEdit={handleEdit}
                    displayRole={displayRole}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne de gauche */}
                    <div className="lg:col-span-1 space-y-6">
                        <PersonalInfoSection
                            userInfo={userInfo}
                            setUserInfo={setUserInfo}
                            isEditable={isEditable}
                        />

                        <SocialLinksSection
                            cvProfile={cvProfile}
                            handleUrlChange={handleUrlChange}
                            isEditable={isEditable}
                        />

                        <TechnicalSkillsSection
                            userInfo={userInfo}
                            setUserInfo={setUserInfo}
                            isEditable={isEditable}
                            handleSelectTech={handleSelectTech}
                        />

                        {/* Nouvelle section de gestion des compétences - COMMENTÉE */}
                        {/* <SkillsManagementSection
                            userInfo={userInfo}
                        /> */}
                    </div>

                    {/* Colonne de droite */}
                    <div className="lg:col-span-2 space-y-6">
                        <ObjectivesSection
                            cvProfile={cvProfile}
                            setCvProfile={setCvProfile}
                            isEditable={isEditable}
                        />

                        <EducationSection
                            cvProfile={cvProfile}
                            setCvProfile={setCvProfile}
                            isEditable={isEditable}
                        />

                        <ProjectsSection
                            cvProjects={cvProjects}
                            handleProjectClick={handleProjectClick}
                            formatDate={formatDate}
                            getTaskStatusColor={getTaskStatusColor}
                            getTaskStatusLabel={getTaskStatusLabel}
                            onProjectVisibilityChange={handleProjectVisibilityChange}
                        />
                    </div>
                </div>

                {/* Boutons d'action */}
                <ActionButtons
                    isEditable={isEditable}
                    onCancel={handleCancel}
                    onSave={handleSave}
                />

                {/* Zone de danger */}
                <DangerZone
                    isEditable={isEditable}
                    onShowDeleteModal={() => setShowDeleteModal(true)}
                />

                {/* Modal de suppression */}
                <DeleteAccountModal
                    isOpen={showDeleteModal}
                    deletePassword={deletePassword}
                    setDeletePassword={setDeletePassword}
                    onConfirm={handleDeleteAccount}
                    onCancel={handleCloseDeleteModal}
                />
            </div>

            {/* Modal de détails du projet */}
            <ProjectDetailsModal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                projectId={selectedProjectId}
            />
        </>
    );
};

export default Profile;