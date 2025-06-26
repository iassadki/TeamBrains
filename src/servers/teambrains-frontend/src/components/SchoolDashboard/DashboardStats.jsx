import React from 'react';
import { Users, Code, Briefcase, Award } from 'lucide-react';

const DashboardStats = ({ schoolData, students }) => {
    // Calculer les statistiques
    const totalStudents = students.length;
    const studentsByType = students.reduce((acc, student) => {
        const type = student.typeDeveloppeur || 'Non défini';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const studentsWithProjects = students.filter(student => 
        student.etudes || student.ambitions || student.linkedin_url || student.portfolio_url || student.github_url
    ).length;

    const studentsWithTech = students.filter(student => 
        student.technologies && student.technologies.length > 0
    ).length;

    const allTechnologies = students.flatMap(student => student.technologies || []);
    const techCount = allTechnologies.reduce((acc, tech) => {
        acc[tech] = (acc[tech] || 0) + 1;
        return acc;
    }, {});

    const topTechnologies = Object.entries(techCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);

    const StatCard = ({ icon: Icon, title, value, subtitle, color = 'green' }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Statistiques de l'école</h2>
                <p className="text-gray-600 mt-1">
                    Vue d'ensemble des étudiants inscrits sur TeamBrains
                </p>
            </div>

            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    title="Total étudiants"
                    value={totalStudents}
                    subtitle="inscrits sur la plateforme"
                />
                <StatCard
                    icon={Code}
                    title="Profils techniques"
                    value={studentsWithTech}
                    subtitle={`${Math.round((studentsWithTech / totalStudents) * 100)}% avec technologies`}
                    color="blue"
                />
                <StatCard
                    icon={Briefcase}
                    title="Profils complétés"
                    value={studentsWithProjects}
                    subtitle={`${Math.round((studentsWithProjects / totalStudents) * 100)}% avec données CV`}
                    color="purple"
                />
                <StatCard
                    icon={Award}
                    title="Technologies"
                    value={Object.keys(techCount).length}
                    subtitle="différentes maîtrisées"
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Répartition par type de développeur */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Répartition par spécialité
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(studentsByType).map(([type, count]) => {
                            const percentage = Math.round((count / totalStudents) * 100);
                            return (
                                <div key={type} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{type}</p>
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {count} ({percentage}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top technologies */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Technologies les plus populaires
                    </h3>
                    <div className="space-y-3">
                        {topTechnologies.map(([tech, count]) => {
                            const percentage = Math.round((count / allTechnologies.length) * 100);
                            return (
                                <div key={tech} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {tech}
                                        </span>
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {count} étudiants
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Informations de l'école */}
            {schoolData && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Informations de l'école
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Nom de l'école</p>
                            <p className="text-lg text-gray-900">{schoolData.name}</p>
                        </div>
                        {schoolData.description && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Description</p>
                                <p className="text-lg text-gray-900">{schoolData.description}</p>
                            </div>
                        )}
                        {schoolData.contact_email && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email de contact</p>
                                <p className="text-lg text-gray-900">{schoolData.contact_email}</p>
                            </div>
                        )}
                        {schoolData.website && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Site web</p>
                                <a 
                                    href={schoolData.website.startsWith('http') ? schoolData.website : `https://${schoolData.website}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-lg text-green-600 hover:text-green-800"
                                >
                                    {schoolData.website}
                                </a>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-500">Date de création</p>
                            <p className="text-lg text-gray-900">
                                {new Date(schoolData.created_at).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Statut</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                schoolData.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {schoolData.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardStats;