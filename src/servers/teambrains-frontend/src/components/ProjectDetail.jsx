import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import Chat from '../components/ProjectManagement/Chat/Chat';
import ProjectManagement from '../components/ProjectManagement/ProjectManagement';

const ProjectDetail = () => {
    const { slug } = useParams();
    const [project, setProject] = useState(null);
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('details'); // Nouvel état pour gérer les onglets

    const mapRolesToMembers = (members) => {
        const roles = {
            'FullStack': 'Disponible',
            'BackEnd': 'Disponible',
            'FrontEnd': 'Disponible',
            'Designer': 'Disponible'
        };

        members.forEach(member => {
            const cleanedRole = member.role.replace(/['"\\]+/g, ''); // Supprime les guillemets et les caractères d'échappement
            if (roles.hasOwnProperty(cleanedRole)) {
                roles[cleanedRole] = member.name;
            }
        });

        return roles;
    };

    const joinProject = async () => {
        try {
            const response = await axios.post(`http://localhost:5001/projects/join_project/${project.id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            alert(response.data.message);  // Afficher une alerte avec le message de réussite
            fetchProject();  // Rafraîchir les détails du projet
        } catch (error) {
            console.error('Erreur lors de la tentative de rejoindre le projet:', error.response.data.error);
            alert(error.response.data.error);  // Afficher une alerte avec le message d'erreur
        }
    };

    const leaveProject = async () => {
        try {
            const response = await axios.post(`http://localhost:5001/projects/leave_project/${project.id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            alert(response.data.message);
            fetchProject();
        } catch (error) {
            console.error('Erreur lors de la tentative de quitter le projet:', error.response.data.error);
            alert(error.response.data.error);
        }
    };

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
        }
    };

    const startProject = async () => {
        try {
            const response = await axios.post(`http://localhost:5001/projects/start_project/${project.id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            alert(response.data.message);
            fetchProject();
        } catch (error) {
            console.error('Erreur lors de la tentative de démarrer le projet:', error.response.data.error);
            alert(error.response.data.error);
        }
    };

    const checkMembership = () => {
        if (!project || !currentUser) {
            return false;
        }
        return project.members.some(member => member.user_id === currentUser.id);
    };

    const checkCreator = () => {
        if (!project || !currentUser) {
            return false;
        }
        return project.creator_id === currentUser.id;
    };

    const canStartProject = () => {
        if (!project) return false;

        const roles = project.members.map(member => member.role);
        return roles.includes('FullStack') || (roles.includes('BackEnd') && roles.includes('FrontEnd'));
    };

    useEffect(() => {
        fetchProject();
    }, [slug]);

    const formatDate = (isoDate) => {
        const date = parseISO(isoDate);
        let formattedDate = format(date, "d MMMM yyyy", { locale: fr });
        return formattedDate.replace(/^(.)|\s+(.)/g, c => c.toUpperCase());  // Capitalise chaque mot
    };

    // Fonction pour déterminer si un onglet est actif
    const isTabActive = (tab) => activeTab === tab;

    // Rendu conditionnel du contenu en fonction de l'onglet actif
    const renderTabContent = () => {
        switch (activeTab) {
            case 'details':
                return (
                    <div>
                        <p className="text-base text-gray-700">{project.description}</p>
                        <div className='mt-4'>
                            <h3 className="text-lg font-semibold mb-2">Équipe</h3>
                            <ul>
                                {Object.entries(mapRolesToMembers(project.members)).map(([role, name]) => (
                                    <li key={role} className="mb-1">
                                        {role}: {name === 'Disponible' ? <span className="text-green-500">{name}</span> : name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            case 'chat':
                // Onglet chat 
                return project && <Chat projectId={project.id} />;
            case 'tasks':
                // Onglet pour la gestion des tâches
                return project && project.status === "in_progress" && <ProjectManagement />;
            default:
                return <div>Contenu non disponible</div>;
        }
    };

    return (
        <div className="mx-12 my-12 p-12 bg-white shadow-lg rounded">
            {project ? (
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-sm text-gray-500 mb-4">{formatDate(project.creation_date)}</p>

                    {/* Navigation par onglets */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8 -mb-px">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${isTabActive('details')
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Détails
                            </button>

                            {/* N'afficher l'onglet chat que si l'utilisateur est membre ou créateur et que le projet est démarré */}
                            {(checkMembership() || checkCreator()) && project.status === "in_progress" && (
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${isTabActive('chat')
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Discussion
                                </button>
                            )}
                            {project.status === "in_progress" && (
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${isTabActive('tasks')
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Tâches
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Contenu de l'onglet actif */}
                    {renderTabContent()}

                    {/* Boutons d'action */}
                    <div className="mt-6">
                        {checkMembership() || checkCreator() ? (
                            <>
                                {checkMembership() && project.status === "not_started" && (
                                    <button className='mt-4 bg-red-600 text-white py-2 px-4 rounded-md' onClick={leaveProject}>
                                        Quitter l'équipe
                                    </button>
                                )}
                                {checkCreator() && (
                                    <>
                                        {project.status === "not_started" ? (
                                            <>
                                                {canStartProject() ? (
                                                    <button className='mt-4 bg-green-600 text-white py-2 px-4 rounded-md' onClick={startProject}>
                                                        Lancer le projet
                                                    </button>
                                                ) : (
                                                    <p className="mt-4 text-orange-600">
                                                        Le projet ne peut pas encore démarrer. Il faut au minimum un développeur FullStack ou un BackEnd et un FrontEnd.
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="mt-4 text-green-600 font-semibold">
                                                ✓ Le projet est en cours de développement
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <button className='mt-4 bg-green-600 text-white py-2 px-4 rounded-md' onClick={joinProject}>
                                Rejoindre l'équipe
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <p>Chargement des détails du projet...</p>
            )}
        </div>
    );
};

export default ProjectDetail;