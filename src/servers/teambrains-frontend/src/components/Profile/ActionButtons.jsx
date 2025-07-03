import React from 'react';

const ActionButtons = ({ isEditable, onCancel, onSave }) => {
    if (!isEditable) return null;

    return (
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                Annuler
            </button>
            <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
                Enregistrer les modifications
            </button>
        </div>
    );
};

export default ActionButtons;