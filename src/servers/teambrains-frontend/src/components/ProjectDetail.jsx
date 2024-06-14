import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const ProjectDetail = () => {
    const { slug } = useParams();
    const [project, setProject] = useState(null);

    const mapRolesToMembers = (members) => {
        const roles = {
            'FullStack': 'Disponible',
            'Backend': 'Disponible',
            'Frontend': 'Disponible',
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
            }
        };

        fetchProject();
    }, [slug]);

    const formatDate = (isoDate) => {
        const date = parseISO(isoDate);
        let formattedDate = format(date, "d MMMM yyyy", { locale: fr });
        return formattedDate.replace(/^(.)|\s+(.)/g, c => c.toUpperCase());  // Capitalise chaque mot
    };

    return (
        <div className="mx-12 my-12 p-12 bg-white shadow-lg rounded">
            {project ? (
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-sm text-gray-500 mb-4">{formatDate(project.creation_date)}</p>
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
                    <button className='mt-4 bg-green-tb text-white py-2 px-4 rounded-md'>
                        Rejoindre l'équipe
                    </button>
                </div>
            ) : (
                <p>Chargement des détails du projet...</p>
            )}
        </div>
    );
};

export default ProjectDetail;
