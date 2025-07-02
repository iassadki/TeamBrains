import React, { useState } from 'react';
import { Eye, EyeOff, Globe, Lock } from 'lucide-react';
import axios from 'axios';

const ProjectVisibilityToggle = ({ project, onVisibilityChange }) => {
    const [isVisible, setIsVisible] = useState(project.is_visible || false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleToggleVisibility = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.put(
                `http://localhost:5001/visibility/cv/project/${project.id}/toggle`,
                { is_visible: !isVisible },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );

            const newVisibility = !isVisible;
            setIsVisible(newVisibility);

            // Callback pour mettre à jour le parent si nécessaire
            if (onVisibilityChange) {
                onVisibilityChange(project.id, newVisibility);
            }

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la visibilité:', error);
            setError('Erreur lors de la mise à jour');

            // Optionnel : afficher un toast ou une notification
            alert('Erreur lors de la mise à jour de la visibilité du projet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md border">
            <div className="flex items-center space-x-2 flex-1">
                <div className="flex items-center space-x-1">
                    {isVisible ? (
                        <Globe className="w-4 h-4 text-green-600" />
                    ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                    )}

                    <label
                        htmlFor={`visibility-${project.id}`}
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                        Visible sur mon CV public
                    </label>
                </div>

                <div className="relative">
                    <input
                        id={`visibility-${project.id}`}
                        type="checkbox"
                        checked={isVisible}
                        onChange={handleToggleVisibility}
                        disabled={loading}
                        className="sr-only"
                    />

                    <button
                        onClick={handleToggleVisibility}
                        disabled={loading}
                        className={`
                            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${isVisible ? 'bg-green-600' : 'bg-gray-200'}
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        role="switch"
                        aria-checked={isVisible}
                        aria-label="Basculer la visibilité du projet"
                    >
                        <span
                            aria-hidden="true"
                            className={`
                                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                                transition duration-200 ease-in-out
                                ${isVisible ? 'translate-x-5' : 'translate-x-0'}
                            `}
                        />
                    </button>
                </div>
            </div>

            {/* Indicateur de statut */}
            <div className="flex items-center space-x-1">
                {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                    <span className={`text-xs font-medium ${isVisible ? 'text-green-600' : 'text-gray-500'
                        }`}>
                        {isVisible ? 'Public' : 'Privé'}
                    </span>
                )}
            </div>

            {error && (
                <div className="text-xs text-red-600" title={error}>
                    ⚠️
                </div>
            )}
        </div>
    );
};

export default ProjectVisibilityToggle;