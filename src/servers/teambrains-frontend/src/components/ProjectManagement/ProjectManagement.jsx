import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import TaskBoard from './Tasks/TaskBoard';
import TaskProgress from './Tasks/TaskProgress';
import TaskFilters from './Tasks/TaskFilters';

const ProjectManagement = () => {
    const { slug } = useParams();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('board');
    const [project, setProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // États pour les filtres
    const [filters, setFilters] = useState({
        assignee: '',
        status: '',
        dueDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Fonction pour changer d'onglet avec debug
    const handleTabChange = (newTab) => {
        console.log('Changement d\'onglet vers:', newTab);
        setActiveTab(newTab);
    };

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
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors de la récupération du projet:', error);
                setError("Impossible de charger les détails du projet");
                setLoading(false);
            }
        };

        if (slug) {
            fetchProject();
        }
    }, [slug]);

    // Debug - afficher l'onglet actuel
    useEffect(() => {
        console.log('Onglet actuel:', activeTab);
    }, [activeTab]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-lg">Chargement du projet...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Navigation principale */}
            <div className="mb-6 bg-white rounded-lg shadow p-1">
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleTabChange('board')}
                        className={`flex-1 py-3 px-6 text-center rounded-md transition-colors ${
                            activeTab === 'board' 
                                ? 'bg-green-500 text-white shadow-sm' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Tableau de bord
                    </button>
                    <button
                        onClick={() => handleTabChange('progress')}
                        className={`flex-1 py-3 px-6 text-center rounded-md transition-colors ${
                            activeTab === 'progress' 
                                ? 'bg-green-500 text-white shadow-sm' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Progression
                    </button>
                    <button
                        onClick={() => handleTabChange('filters')}
                        className={`flex-1 py-3 px-6 text-center rounded-md transition-colors ${
                            activeTab === 'filters' 
                                ? 'bg-green-500 text-white shadow-sm' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Filtres
                    </button>
                </div>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'board' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4">
                        <h2 className="text-xl font-semibold mb-4">Tableau de bord des tâches</h2>
                        <TaskBoard />
                    </div>
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4">
                        <h2 className="text-xl font-semibold mb-4">Progression du projet</h2>
                        <TaskProgress />
                    </div>
                </div>
            )}

            {activeTab === 'filters' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Filtres et options de recherche
                    </h2>
                    <TaskFilters
                        filters={filters}
                        setFilters={setFilters}
                        projectMembers={projectMembers}
                        showFilters={true}
                        setShowFilters={setShowFilters}
                    />
                </div>
            )}
        </div>
    );
};

export default ProjectManagement;