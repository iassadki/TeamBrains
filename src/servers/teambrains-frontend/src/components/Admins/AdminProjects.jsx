import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const AdminProjects = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:5001/projects/list_projects', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setProjects(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des projets:', error);
        }
    };

    const deleteProject = async (projectId) => {
        // Demande de confirmation
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
            try {
                await axios.delete(`http://localhost:5001/projects/delete_project/${projectId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                fetchProjects();  // Re-fetch projects to update the list
            } catch (error) {
                console.error('Erreur lors de la suppression du projet:', error);
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'not_started':
                return <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />;
            case 'in_progress':
                return <span className="inline-block w-3 h-3 bg-orange-500 rounded-full" />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4">
            <h2 className='text-2xl font-semibold mb-4'>Gestion des Projets</h2>
            <div className="overflow-x-auto">
                <table className='w-full text-left shadow-lg bg-white rounded-lg'>
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-3 text-center">Statut</th>
                            <th className="p-3">Nom</th>
                            <th className="p-3">Date de Création</th>
                            <th className="p-3">Membres</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project, index) => (
                            <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                                <td className="p-3 text-center">{getStatusStyle(project.status)}</td>
                                <td className="p-3">{project.name}</td>
                                <td className="p-3">{format(parseISO(project.creation_date), 'dd/MM/yyyy')}</td>
                                <td className="p-3">
                                    {project.members.map(member => (
                                        <div key={member.user_id}>
                                            {member.name} ({member.role})
                                        </div>
                                    ))}
                                </td>
                                <td className="p-3 align-center">
                                    <button 
                                        onClick={() => deleteProject(project.id)}
                                        className="bg-red-400 rounded p-1 px-4 text-white hover:text-white hover:bg-red-500"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProjects;
