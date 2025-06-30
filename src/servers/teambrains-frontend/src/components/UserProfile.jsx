import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { User, MapPin, BookOpen, Target, ExternalLink, Github, Linkedin } from 'lucide-react';

const UserProfile = () => {
    const { userId } = useParams();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5001/users/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            setUserProfile(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            setError('Utilisateur non trouvé ou erreur lors du chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-tb"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">{error}</div>
                    <button 
                        onClick={() => window.history.back()}
                        className="bg-green-tb text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return null;
    }

    const getRoleDisplayName = (role) => {
        const roleNames = {
            'student': 'Étudiant',
            'businessman': 'Entrepreneur',
            'admin': 'Administrateur'
        };
        return roleNames[role] || role;
    };

    const getTypeDevDisplayName = (type) => {
        const typeNames = {
            'FullStack': 'Développeur Full-Stack',
            'BackEnd': 'Développeur Back-End',
            'FrontEnd': 'Développeur Front-End',
            'Designer': 'Designer'
        };
        return typeNames[type] || type;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* En-tête du profil */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-6">
                            <div className="flex-shrink-0">
                                <div className="h-20 w-20 bg-green-tb rounded-full flex items-center justify-center">
                                    <User size={40} className="text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {userProfile.prenom} {userProfile.nom}
                                </h1>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {getRoleDisplayName(userProfile.role)}
                                    </span>
                                    {userProfile.typeDeveloppeur && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            {getTypeDevDisplayName(userProfile.typeDeveloppeur)}
                                        </span>
                                    )}
                                </div>
                                {userProfile.school && (
                                    <div className="flex items-center mt-3 text-gray-600">
                                        <MapPin size={16} className="mr-2" />
                                        <span>{userProfile.school.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Liens sociaux */}
                    {(userProfile.linkedin_url || userProfile.portfolio_url || userProfile.github_url) && (
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Liens</h3>
                            <div className="flex flex-wrap gap-4">
                                {userProfile.linkedin_url && (
                                    <a
                                        href={userProfile.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <Linkedin size={16} className="mr-2" />
                                        LinkedIn
                                        <ExternalLink size={14} className="ml-2" />
                                    </a>
                                )}
                                {userProfile.github_url && (
                                    <a
                                        href={userProfile.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                                    >
                                        <Github size={16} className="mr-2" />
                                        GitHub
                                        <ExternalLink size={14} className="ml-2" />
                                    </a>
                                )}
                                {userProfile.portfolio_url && (
                                    <a
                                        href={userProfile.portfolio_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                    >
                                        <ExternalLink size={16} className="mr-2" />
                                        Portfolio
                                        <ExternalLink size={14} className="ml-2" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Contenu principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne principale */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Ambitions */}
                        {userProfile.ambitions && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <Target size={20} className="text-green-tb mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">Ambitions</h2>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{userProfile.ambitions}</p>
                            </div>
                        )}

                        {/* Études */}
                        {userProfile.etudes && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <BookOpen size={20} className="text-green-tb mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">Études</h2>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{userProfile.etudes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Technologies */}
                        {userProfile.technologies && userProfile.technologies.length > 0 && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Technologies</h3>
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.technologies.map((tech, index) => (
                                        tech.trim() && (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                                            >
                                                {tech.trim()}
                                            </span>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Informations complémentaires */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations</h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                                    <dd className="text-sm text-gray-900">{getRoleDisplayName(userProfile.role)}</dd>
                                </div>
                                {userProfile.typeDeveloppeur && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Spécialité</dt>
                                        <dd className="text-sm text-gray-900">{getTypeDevDisplayName(userProfile.typeDeveloppeur)}</dd>
                                    </div>
                                )}
                                {userProfile.school && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">École</dt>
                                        <dd className="text-sm text-gray-900">{userProfile.school.name}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Bouton retour */}
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => window.history.back()}
                        className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                    >
                        Retour
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 