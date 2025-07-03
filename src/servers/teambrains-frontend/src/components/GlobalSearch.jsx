import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Briefcase, School, X, CheckSquare, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GlobalSearch = ({ isMobile = false, onClose = null }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ projects: [], users: [], tasks: [], messages: [], schools: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    // Fonction de recherche avec debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 0) {
                performSearch(query);
            } else {
                setResults({ projects: [], users: [], schools: [] });
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Fermer le dropdown quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current && 
                !searchRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (searchQuery) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`http://localhost:5001/search/global?q=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            setResults(response.data.results);
            setShowResults(true);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setResults({ projects: [], users: [], tasks: [], messages: [], schools: [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResultClick = (result) => {
        if (result.type === 'project') {
            navigate(`/projets/${result.project_slug}`);
        } else if (result.type === 'user') {
            navigate(`/users/profile/${result.id}`);
        } else if (result.type === 'task') {
            // Naviguer vers le projet avec l'onglet tâches
            navigate(`/projets/${result.project_slug}?tab=tasks`);
        } else if (result.type === 'message') {
            // Naviguer vers le projet avec l'onglet chat
            navigate(`/projets/${result.project_slug}?tab=chat`);
        } else if (result.type === 'school') {
            navigate(`/admin/schools/${result.id}`);
        }
        
        // Réinitialiser et fermer
        setQuery('');
        setShowResults(false);
        if (onClose) onClose();
    };

    const getTotalResults = () => {
        return results.projects.length + results.users.length + results.tasks.length + results.messages.length + results.schools.length;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            setQuery('');
            setShowResults(false);
            if (onClose) onClose();
        }
    };

    return (
        <div className={`relative ${isMobile ? 'w-full' : 'w-3/4'}`} ref={searchRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Rechercher partout..."
                    className="text-xs w-full p-2 pr-8 rounded bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-tb focus:bg-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => query.trim().length > 0 && setShowResults(true)}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-green-tb border-t-transparent rounded-full"></div>
                    ) : (
                        <Search size={16} className="text-gray-500" />
                    )}
                </div>
            </div>

            {/* Dropdown des résultats */}
            {showResults && (
                <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
                >
                    {getTotalResults() === 0 ? (
                        <div className="p-4 text-gray-500 text-center text-sm">
                            {query.trim() ? 'Aucun résultat trouvé' : 'Commencez à taper pour rechercher...'}
                        </div>
                    ) : (
                        <div>
                            {/* En-tête avec nombre de résultats */}
                            <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
                                {getTotalResults()} résultat{getTotalResults() > 1 ? 's' : ''} pour "{query}"
                            </div>

                            {/* Projets */}
                            {results.projects.length > 0 && (
                                <div>
                                    <div className="p-2 bg-blue-50 text-blue-800 text-xs font-medium flex items-center">
                                        <Briefcase size={14} className="mr-1" />
                                        Projets ({results.projects.length})
                                    </div>
                                    {results.projects.map((project) => (
                                        <div
                                            key={`project-${project.id}`}
                                            onClick={() => handleResultClick(project)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-sm text-gray-900">{project.name}</div>
                                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {project.description}
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                                                    project.status === 'in_progress' ? 'bg-orange-500' : 
                                                    project.status === 'not_started' ? 'bg-green-500' : 'bg-gray-500'
                                                }`}></span>
                                                <span className="text-xs text-gray-500">
                                                    {project.status === 'in_progress' ? 'En cours' : 
                                                     project.status === 'not_started' ? 'Non démarré' : 'Terminé'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Utilisateurs */}
                            {results.users.length > 0 && (
                                <div>
                                    <div className="p-2 bg-green-50 text-green-800 text-xs font-medium flex items-center">
                                        <User size={14} className="mr-1" />
                                        Utilisateurs ({results.users.length})
                                    </div>
                                    {results.users.map((user) => (
                                        <div
                                            key={`user-${user.id}`}
                                            onClick={() => handleResultClick(user)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-sm text-gray-900">
                                                {user.prenom} {user.nom}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {user.typeDeveloppeur}
                                            </div>
                                            {user.technologies && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Technologies: {user.technologies}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tâches */}
                            {results.tasks.length > 0 && (
                                <div>
                                    <div className="p-2 bg-orange-50 text-orange-800 text-xs font-medium flex items-center">
                                        <CheckSquare size={14} className="mr-1" />
                                        Tâches ({results.tasks.length})
                                    </div>
                                    {results.tasks.map((task) => (
                                        <div
                                            key={`task-${task.id}`}
                                            onClick={() => handleResultClick(task)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-sm text-gray-900">{task.title}</div>
                                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {task.description}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500">
                                                    Dans {task.project_name}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    {task.priority && (
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            task.priority === 'haute' ? 'bg-red-100 text-red-800' :
                                                            task.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {task.percent_completion}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Messages */}
                            {results.messages.length > 0 && (
                                <div>
                                    <div className="p-2 bg-indigo-50 text-indigo-800 text-xs font-medium flex items-center">
                                        <MessageCircle size={14} className="mr-1" />
                                        Messages ({results.messages.length})
                                    </div>
                                    {results.messages.map((message) => (
                                        <div
                                            key={`message-${message.id}`}
                                            onClick={() => handleResultClick(message)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="text-sm text-gray-900 line-clamp-2">{message.content}</div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500">
                                                    Par {message.sender_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Dans {message.project_name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Écoles (admin seulement) */}
                            {results.schools.length > 0 && (
                                <div>
                                    <div className="p-2 bg-purple-50 text-purple-800 text-xs font-medium flex items-center">
                                        <School size={14} className="mr-1" />
                                        Écoles ({results.schools.length})
                                    </div>
                                    {results.schools.map((school) => (
                                        <div
                                            key={`school-${school.id}`}
                                            onClick={() => handleResultClick(school)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-sm text-gray-900">{school.name}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {school.description}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {school.contact_email}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch; 