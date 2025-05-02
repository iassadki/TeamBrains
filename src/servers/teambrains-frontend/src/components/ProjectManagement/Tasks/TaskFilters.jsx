import React from 'react';
import { Filter, X } from 'lucide-react';

const TaskFilters = ({
    filters,
    setFilters,
    projectMembers,
    showFilters,
    setShowFilters
}) => {
    // Gérer les changements de filtres
    const handleFilterChange = (type, value) => {
        setFilters({ ...filters, [type]: value });
    };

    // Réinitialiser tous les filtres
    const resetFilters = () => {
        setFilters({
            assignee: '',
            status: '',
            dueDate: ''
        });
    };

    return (
        <div className="mb-4">
            {/* Bouton pour afficher/masquer les filtres sur mobile */}
            <div className="md:hidden mb-2">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center p-2 bg-gray-100 rounded-md"
                >
                    {showFilters ? <X size={16} /> : <Filter size={16} />}
                    <span className="ml-2 text-sm">{showFilters ? 'Masquer les filtres' : 'Filtrer les tâches'}</span>
                </button>
            </div>

            {/* Filtres */}
            <div className={`${showFilters ? 'block' : 'hidden md:flex'} md:flex md:space-x-4 bg-white rounded-lg p-3 shadow-sm`}>
                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigné à</label>
                    <select
                        value={filters.assignee}
                        onChange={(e) => handleFilterChange('assignee', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        <option value="">Tous</option>
                        {projectMembers.map(member => (
                            <option key={member.user_id} value={member.user_id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        <option value="">Tous</option>
                        <option value="to-do">À faire</option>
                        <option value="in-progress">En cours</option>
                        <option value="done">Terminé</option>
                    </select>
                </div>

                <div className="mb-2 md:mb-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Échéance</label>
                    <select
                        value={filters.dueDate}
                        onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                        className="w-full md:w-auto text-sm p-1.5 border border-gray-300 rounded"
                    >
                        <option value="">Toutes les dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="overdue">En retard</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={resetFilters}
                        className="text-sm p-1.5 text-gray-500 hover:text-gray-700"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskFilters;