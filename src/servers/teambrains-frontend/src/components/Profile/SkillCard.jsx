import React, { useState } from 'react';
import { Edit, Trash2, Calendar, Star, User, FileText } from 'lucide-react';

const SkillCard = ({ skill, onEdit, onDelete, getSkillLevelColor, getSkillLevelIcon }) => {
    const [showDetails, setShowDetails] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getExperienceDisplay = (years) => {
        if (!years) return '';
        if (years === 1) return '1 an';
        return `${years} ans`;
    };

    const getSelfAssessmentStars = (rating) => {
        if (!rating) return null;
        return Array.from({ length: 10 }, (_, i) => (
            <Star
                key={i}
                className={`w-3 h-3 ${i < rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
            />
        ));
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
            {/* En-tête de la carte */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{skill.skill_name}</h4>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSkillLevelColor(skill.level)}`}>
                            <span className="mr-1">{getSkillLevelIcon(skill.level)}</span>
                            {skill.level}
                        </span>
                        {skill.category && (
                            <span className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full border">
                                {skill.category}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions - visibles au hover */}
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(skill)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        title="Modifier"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(skill.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Informations principales */}
            <div className="space-y-2 text-xs text-gray-600">
                {/* Expérience */}
                {skill.experience_years && (
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{getExperienceDisplay(skill.experience_years)} d'expérience</span>
                    </div>
                )}

                {/* Auto-évaluation */}
                {skill.self_assessment && (
                    <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        <span className="mr-1">Auto-évaluation:</span>
                        <div className="flex space-x-0.5 mr-1">
                            {getSelfAssessmentStars(skill.self_assessment)}
                        </div>
                        <span className="font-medium">{skill.self_assessment}/10</span>
                    </div>
                )}

                {/* Date d'ajout */}
                {skill.created_at && (
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Ajoutée le {formatDate(skill.created_at)}</span>
                    </div>
                )}
            </div>

            {/* Notes - Affichage conditionnel */}
            {skill.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <FileText className="w-3 h-3 mr-1" />
                        {showDetails ? 'Masquer les notes' : 'Voir les notes'}
                    </button>

                    {showDetails && (
                        <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-700">
                            {skill.notes}
                        </div>
                    )}
                </div>
            )}

            {/* Mise à jour récente */}
            {skill.last_updated && skill.last_updated !== skill.created_at && (
                <div className="mt-2 text-xs text-blue-600">
                    Mise à jour le {formatDate(skill.last_updated)}
                </div>
            )}

            {/* Indicateur de progression visuel */}
            <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Progression</span>
                    <span className="text-xs font-medium text-gray-700">
                        {skill.level === 'débutant' ? '33%' :
                            skill.level === 'intermédiaire' ? '66%' : '100%'}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${skill.level === 'débutant' ? 'bg-blue-500 w-1/3' :
                                skill.level === 'intermédiaire' ? 'bg-yellow-500 w-2/3' :
                                    'bg-green-500 w-full'
                            }`}
                    />
                </div>
            </div>
        </div>
    );
};

export default SkillCard;