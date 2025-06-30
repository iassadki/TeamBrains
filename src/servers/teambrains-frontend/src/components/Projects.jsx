import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
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
    const location = useLocation();
    const [showFilters, setShowFilters] = useState(false);
    const [showMyProjectsOnly, setShowMyProjectsOnly] = useState(false);
    const [showAvailableProjectsOnly, setShowAvailableProjectsOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
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

    const toggleFilters = () => {
        setShowFilters(!showFilters);
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
        // Gérer les paramètres de recherche depuis l'URL
        const searchParams = new URLSearchParams(location.search);
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchQuery(searchFromUrl);
        }

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
    }, [location.search]);

    const formatDate = (isoDate) => {
        const date = parseISO(isoDate);
        let formattedDate = format(date, "d MMMM yyyy", { locale: fr });
        return formattedDate.replace(/^(.)|\s+(.)/g, c => c.toUpperCase());  // Capitalise chaque mot
    };

    const filteredProjects = sortedProjects.filter(project => {
        // Filtre de recherche textuelle
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const nameMatch = project.name.toLowerCase().includes(query);
            const descriptionMatch = project.description && project.description.toLowerCase().includes(query);
            const statusMatch = project.status && project.status.toLowerCase().includes(query);
            
            if (!nameMatch && !descriptionMatch && !statusMatch) {
                return false;
            }
        }

        // Filtre "Mes projets" - vérifie si l'utilisateur est membre du projet ou créateur
        if (showMyProjectsOnly) {
            const isCreator = currentUser && project.creator_id === currentUser.id;
            const isMember = project.members && project.members.some(member => 
                currentUser && member.user_id === currentUser.id
            );
            if (!isCreator && !isMember) return false;
        }

        // Filtre "Projets disponibles" - vérifie si l'utilisateur peut s'inscrire
        if (showAvailableProjectsOnly) {
            if (!currentUser) return false;
            
            // Vérifier si l'utilisateur est déjà créateur ou membre
            const isCreator = project.creator_id === currentUser.id;
            const isMember = project.members && project.members.some(member => 
                member.user_id === currentUser.id
            );
            
            // Si déjà inscrit, ne pas afficher
            if (isCreator || isMember) return false;
            
            // Pour les entrepreneurs, ils peuvent rejoindre n'importe quel projet
            if (currentUser.role === 'businessman') return true;
            
            // Pour les autres utilisateurs, vérifier s'il y a des rôles disponibles
            const userRole = currentUser.typeDeveloppeur;
            const members = project.members || [];
            
            if (userRole === "FullStack") {
                // Un FullStack peut prendre BackEnd, FrontEnd ou FullStack si disponible
                const backendTaken = members.some(member => member.role.replace(/['"\\]+/g, '') === "BackEnd");
                const frontendTaken = members.some(member => member.role.replace(/['"\\]+/g, '') === "FrontEnd");
                const fullstackTaken = members.some(member => member.role.replace(/['"\\]+/g, '') === "FullStack");
                
                // Si FullStack est libre, ou si seulement BackEnd ou FrontEnd est pris
                return !fullstackTaken || (!backendTaken || !frontendTaken);
            } else {
                // Pour les autres rôles, vérifier si le rôle spécifique est libre
                const roleTaken = members.some(member => 
                    member.role.replace(/['"\\]+/g, '') === userRole
                );
                return !roleTaken;
            }
        }

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
        <div className="mx-4 md:mx-8 lg:mx-12 p-4 md:p-8 lg:p-12 flex flex-col md:flex-row">
            {/* Mobile filter button */}
            <div className="md:hidden mb-4 flex justify-end">
                <button
                    onClick={toggleFilters}
                    className="flex items-center p-2 bg-gray-100 rounded-md"
                >
                    {showFilters ? <X size={20} /> : <Filter size={20} />}
                    <span className="ml-2">{showFilters ? 'Fermer' : 'Filtres'}</span>
                </button>
            </div>

            {/* Sidebar filter section */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-1/4 lg:h-screen md:overflow-auto md:sticky md:top-0 md:mr-4 bg-white z-10 p-4 md:p-0 ${showFilters ? 'fixed top-0 left-0 h-screen overflow-auto' : ''}`}>
                <div className='flex'>
                    <SlidersHorizontal />
                    <h2 className="ml-2 text-xl font-semibold mb-4">Filtres</h2>
                </div>

                <hr className="border-t border-gray-300 mb-4" />

                {/* Filtre Mes projets */}
                <div className="mb-4">
                    <Checkbox
                        label="Mes projets uniquement"
                        checked={showMyProjectsOnly}
                        onChange={() => setShowMyProjectsOnly(!showMyProjectsOnly)}
                    />
                </div>

                {/* Filtre Projets disponibles */}
                <div className="mb-6">
                    <Checkbox
                        label="Projets où je peux m'inscrire"
                        checked={showAvailableProjectsOnly}
                        onChange={() => setShowAvailableProjectsOnly(!showAvailableProjectsOnly)}
                    />
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

                {/* Close button for mobile */}
                <div className="md:hidden mt-6">
                    <button
                        onClick={toggleFilters}
                        className="w-full py-2 bg-gray-200 rounded-md text-center"
                    >
                        Appliquer les filtres
                    </button>
                </div>
            </div>

            <div className="w-full md:w-3/4 md:ml-8">
                <div className="mb-8 flex flex-col sm:flex-row justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold">Rejoindre un projet</h1>
                        <p className="text-sm text-gray-500 font-light mt-1 w-full sm:w-4/5">Explorez les projets actuels à la recherche de talents. Faites votre choix et contribuez à des initiatives innovantes.</p>
                        {searchQuery && (
                            <div className="mt-2 flex items-center">
                                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    Recherche : "{searchQuery}"
                                </span>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        navigate('/projets');
                                    }}
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {currentUser && currentUser.role === "businessman" && (
                        <div className="mt-4 sm:mt-0">
                            <NavLink to="/projets/nouveau-projet" className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600 inline-block text-sm">
                                Créer un projet
                            </NavLink>
                        </div>
                    )}

                </div>

                <div className='flex flex-col sm:flex-row sm:justify-between mb-2 gap-2'>
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
                                    <span className={`inline-block h-2.5 w-2.5 mr-2 rounded-full ${project.status === 'in_progress' ? 'bg-orange-500' : project.status === 'not_started' ? 'bg-green-500' : 'bg-gray-500'
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