import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import SortBy from './SortBy';
import Checkbox from './Checkbox';


const Projects = () => {
    
    const { currentUser, logout } = useAuth();
    const [projects, setProjects] = useState([]);
    const [isExpandedProfile, setIsExpandedProfile] = useState(true);
    const [isExpandedLangage, setIsExpandedLangage] = useState(true);
    const [sortOrder, setSortOrder] = useState('newest');
    const navigate = useNavigate();
    const [selectedProfiles, setSelectedProfiles] = useState({
        FullStack: false,
        BackEnd: false,
        FrontEnd: false,
        Designer: false
    });

    const [selectedLanguages, setSelectedLanguages] = useState({
        Javascript: false,
        Python: false,
        PHP: false,
        Ruby: false
    });

    const sortedProjects = projects.sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.creation_date) - new Date(a.creation_date);
        } else {
            return new Date(a.creation_date) - new Date(b.creation_date);
        }
    });

    const handleProjectClick = (slug) => {
        navigate(`/projets/${slug}`);
    };

    const toggleExpandedProfile = () => {
        setIsExpandedProfile(!isExpandedProfile);
    };

    const toggleExpandedLangage = () => {
        setIsExpandedLangage(!isExpandedLangage);
    };

    const mapRolesToMembers = (members) => {
        const roles = {
            'FullStack': 'Disponible',
            'BackEnd': 'Disponible',
            'FrontEnd': 'Disponible',
            'Designer': 'Disponible'
        };
    
        if (members) {
            members.forEach(member => {
                const cleanedRole = member.role.replace(/['"\\]+/g, ''); // Supprime les guillemets et les caractères d'échappement
                if (roles.hasOwnProperty(cleanedRole)) {
                    roles[cleanedRole] = member.name;
                }
            });
        }
        
        return roles;
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
                console.log(response.data)
            } catch (error) {
                console.error("Erreur lors de la récupération des projets", error);
            }
        };

        fetchProjects();
    }, []);

    const formatDate = (isoDate) => {
        const date = parseISO(isoDate);
        let formattedDate = format(date, "d MMMM yyyy", { locale: fr });
        return formattedDate.replace(/^(.)|\s+(.)/g, c => c.toUpperCase());  // Capitalise chaque mot
    };
    
    const filteredProjects = sortedProjects.filter(project => {
        // Si aucun profil n'est sélectionné, on montre tous les projets
        const hasSelectedProfiles = Object.values(selectedProfiles).some(value => value);
        if (!hasSelectedProfiles) return true;

        // On vérifie si au moins un des profils sélectionnés est disponible dans le projet
        return Object.entries(selectedProfiles).some(([profile, isSelected]) => {
            if (!isSelected) return false;
            
            // On vérifie si le profil est disponible dans le projet
            const members = project.members || [];
            const roleIsFree = !members.some(member => 
                member.role.replace(/['"\\]+/g, '') === profile
            );
            
            return roleIsFree;
        });
    });
    
    return (
        <div className="mx-12 p-12 flex">
            <div className="w-1/4 h-screen overflow-auto sticky top-0 mr-4">
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
                            {Object.entries(selectedProfiles).map(([profile, checked]) => (
                                <Checkbox
                                    key={profile}
                                    label={profile}
                                    checked={checked}
                                    onChange={() => setSelectedProfiles(prev => ({
                                        ...prev,
                                        [profile]: !prev[profile]
                                    }))}
                                />
                            ))}
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
                            {Object.entries(selectedLanguages).map(([language, checked]) => (
                                <Checkbox
                                    key={language}
                                    label={language}
                                    checked={checked}
                                    onChange={() => setSelectedLanguages(prev => ({
                                        ...prev,
                                        [language]: !prev[language]
                                    }))}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-3/4 ml-8">
                <div className="mb-8 flex">
                    <div>
                        <h1 className="text-3xl font-semibold">Rejoindre un projet</h1>
                        <p className="text-sm text-gray-500 font-light mt-1 w-4/5">Explorez les projets actuels à la recherche de talents. Faites votre choix et contribuez à des initiatives innovantes.</p>
                    </div>

                    {currentUser && currentUser.role === "businessman" && (
                    <div>
                        <NavLink to="/projets/nouveau-projet" className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600 mt-4 inline-block text-sm">
                            Créer un projet
                        </NavLink>
                    </div>
                    )}
                    
                </div>
                
                <div className='flex justify-between mb-2'>
                    <p>
                        <span className='font-semibold text-green-tb'>{filteredProjects.length}</span>
                        <span className='font-light'> projets</span>
                    </p>
                    <SortBy 
                        value={sortOrder} 
                        onChange={e => setSortOrder(e.target.value)} 
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProjects.map((project) => {
                        const roles = mapRolesToMembers(project.members);

                        return (
                            <div
                                key={project.id}
                                className="cursor-pointer bg-white rounded-lg shadow p-5 transition duration-300 ease-in-out hover:shadow-lg hover:border-2 hover:border-green-500"
                                onClick={() => handleProjectClick(project.project_slug)}
                            >
                                <div className='flex items-center'>
                                    <span className={`inline-block h-2.5 w-2.5 mr-2 rounded-full ${
                                        project.status === 'in_progress' ? 'bg-orange-500' : project.status === 'not_started' ? 'bg-green-500' : 'bg-gray-500'
                                    }`}></span>
                                    <h2 className="font-bold text-xl">{project.name}</h2>
                                </div>
                                <p className="text-gray-500 text-base mb-2">{formatDate(project.creation_date)}</p>
                                <p className="text-gray-700 text-base mb-4">{project.description}</p>
                                <div>
                                    <h3 className="text-gray-800 font-semibold mb-1">Équipe</h3>
                                    <ul className='font-light text-sm'>
                                        {Object.entries(roles).map(([role, name]) => (
                                            <li key={role}>
                                                • {role}: {name === 'Disponible' ? <span className="text-green-500">{name}</span> : name}
                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Projects;
