import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [isExpandedProfile, setIsExpandedProfile] = useState(true);
    const [isExpandedLangage, setIsExpandedLangage] = useState(true);

    const toggleExpandedProfile = () => {
        setIsExpandedProfile(!isExpandedProfile);
    };

    const toggleExpandedLangage = () => {
        setIsExpandedLangage(!isExpandedLangage);
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get('http://localhost:5001/projects/list_projects', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });
                setProjects(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des projets", error);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div className="mx-12 p-12 flex">
            {/* Colonne de filtres avec position sticky */}
            <div className="w-1/4 h-screen overflow-auto sticky top-0 mr-4">
                {/* Votre contenu de filtrage ici */}
                <div className='flex'>
                    <SlidersHorizontal />
                    <h2 className="ml-2 text-xl font-semibold mb-4">Filtres</h2>
                </div>

                <hr className="border-t border-gray-300 mb-4" />

                <div>
                    <div className='flex justify-between items-center mb-4'>
                        <h2 className="text-xl font-semibold">Profile</h2>
                        <button onClick={toggleExpandedProfile}>
                            {isExpandedProfile ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </button>
                    </div>
            
                    {isExpandedProfile && (
                        <div>
                            {/* Liste des cases à cocher ici */}
                            <label className="block mb-2">
                                <input type="checkbox" className="mr-2" />
                                Full-stack
                            </label>
                            <label className="block mb-2">
                                <input type="checkbox" className="mr-2" />
                                Backend
                            </label>
                            <label className="block mb-2">
                                <input type="checkbox" className="mr-2" />
                                Frontend
                            </label>
                            <label className="block">
                                <input type="checkbox" className="mr-2" />
                                Designer
                            </label>
                        </div>
                    )}
                </div>

                <hr className="border-t border-gray-300 my-4" />

                <div>
                    <div className='flex justify-between items-center mb-4'>
                        <h2 className="text-xl font-semibold">Langage</h2>
                        <button onClick={toggleExpandedLangage}>
                            {isExpandedLangage ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </button>
                    </div>
            
                    {isExpandedLangage && (
                        <div>
                            {/* Liste des cases à cocher ici */}
                            <label className="block mb-2">
                                <input type="checkbox" className="mr-2" />
                                Javascript
                            </label>
                            <label className="block mb-2">
                                <input type="checkbox" className="mr-2" />
                                Python
                            </label>
                            <label className="block mb-2">
                                <input type="checkbox" className="mr-2" />
                                PHP
                            </label>
                            <label className="block">
                                <input type="checkbox" className="mr-2" />
                                Ruby
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Colonne principale pour le contenu des projets */}
            <div className="w-3/4 ml-8">
                <div className="mb-8 flex">
                    <div>
                        <h1 className="text-3xl font-semibold">Rejoindre un projet</h1>
                        <p className="text-sm text-gray-500 font-light mt-1 w-4/5">Explorez les projets actuels à la recherche de talents. Faites votre choix et contribuez à des initiatives innovantes.</p>
                    </div>
                    
                    <div>
                    <NavLink to="/projets/nouveau-projet" className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 mt-4 inline-block">
                        Créer un projet
                    </NavLink>
                    </div>
                    
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {projects.map((project) => (
        <div
            key={project.id}
            className="bg-white rounded-lg shadow p-5 transition duration-300 ease-in-out hover:shadow-lg hover:border-2 hover:border-green-500"
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
        >
            <h2 className="font-bold text-xl mb-2">{project.name}</h2>
            <p className="text-gray-700 text-base mb-4">{project.description}</p>
            <p className="text-gray-600 text-sm">Statut: {project.status}</p>
            {/* Bouton Découvrir ou toute autre action */}
        </div>
    ))}
</div>

            </div>
        </div>
    );
};

export default Projects;
