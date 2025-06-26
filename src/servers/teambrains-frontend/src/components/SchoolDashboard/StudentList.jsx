import React from 'react';
import { Eye, Mail, Code, ExternalLink } from 'lucide-react';

const StudentList = ({ students, onViewCV }) => {
    const getTechBadgeColor = (tech) => {
        const colors = {
            'JavaScript': 'bg-yellow-100 text-yellow-800',
            'Python': 'bg-blue-100 text-blue-800',
            'React': 'bg-cyan-100 text-cyan-800',
            'Node.js': 'bg-green-100 text-green-800',
            'PHP': 'bg-purple-100 text-purple-800',
            'Java': 'bg-red-100 text-red-800',
            'Ruby': 'bg-red-100 text-red-800',
            'Vue': 'bg-green-100 text-green-800',
            'HTML': 'bg-orange-100 text-orange-800',
            'CSS': 'bg-blue-100 text-blue-800',
            'SQL': 'bg-gray-100 text-gray-800',
            'MongoDB': 'bg-green-100 text-green-800',
            'Figma': 'bg-pink-100 text-pink-800',
            'Photoshop': 'bg-blue-100 text-blue-800'
        };
        return colors[tech] || 'bg-gray-100 text-gray-800';
    };

    const getTypeColor = (type) => {
        const colors = {
            'FullStack': 'bg-purple-100 text-purple-800',
            'FrontEnd': 'bg-green-100 text-green-800',
            'BackEnd': 'bg-blue-100 text-blue-800',
            'Designer': 'bg-pink-100 text-pink-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    if (students.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 mb-4">
                    <Code className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun étudiant trouvé</h3>
                <p className="text-gray-500">
                    Aucun étudiant de votre école n'est encore inscrit sur TeamBrains.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Étudiants inscrits</h2>
                    <p className="text-gray-600 mt-1">{students.length} étudiants trouvés</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map((student) => (
                    <div key={student.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                        {/* En-tête étudiant */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {student.prenom} {student.nom}
                                </h3>
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                    <Mail className="h-4 w-4 mr-1" />
                                    {student.email}
                                </div>
                            </div>
                            <button
                                onClick={() => onViewCV(student.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Voir le CV"
                            >
                                <Eye className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Type de développeur */}
                        {student.typeDeveloppeur && (
                            <div className="mb-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(student.typeDeveloppeur)}`}>
                                    {student.typeDeveloppeur}
                                </span>
                            </div>
                        )}

                        {/* Technologies */}
                        {student.technologies && student.technologies.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Technologies</h4>
                                <div className="flex flex-wrap gap-1">
                                    {student.technologies.slice(0, 4).map((tech) => (
                                        <span
                                            key={tech}
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTechBadgeColor(tech)}`}
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                    {student.technologies.length > 4 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                            +{student.technologies.length - 4}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Études */}
                        {student.etudes && (
                            <div className="mb-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Formation</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{student.etudes}</p>
                            </div>
                        )}

                        {/* Ambitions */}
                        {student.ambitions && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Objectifs</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{student.ambitions}</p>
                            </div>
                        )}

                        {/* Liens sociaux */}
                        <div className="flex space-x-3 pt-3 border-t border-gray-100">
                            {student.linkedin_url && (
                                <a
                                    href={student.linkedin_url.startsWith('http') ? student.linkedin_url : `https://${student.linkedin_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                >
                                    LinkedIn <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            )}
                            {student.portfolio_url && (
                                <a
                                    href={student.portfolio_url.startsWith('http') ? student.portfolio_url : `https://${student.portfolio_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                                >
                                    Portfolio <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            )}
                            {student.github_url && (
                                <a
                                    href={student.github_url.startsWith('http') ? student.github_url : `https://${student.github_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-gray-900 text-sm flex items-center"
                                >
                                    GitHub <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            )}
                        </div>

                        {/* Bouton CV */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => onViewCV(student.id)}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                Voir le CV complet
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentList;