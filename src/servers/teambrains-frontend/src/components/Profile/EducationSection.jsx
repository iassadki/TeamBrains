import React from 'react';

const EducationSection = ({ cvProfile, setCvProfile, isEditable }) => {
    return (
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Formation</h2>
            <textarea
                value={cvProfile.etudes}
                onChange={(e) => setCvProfile({ ...cvProfile, etudes: e.target.value })}
                disabled={!isEditable}
                placeholder="Décrivez votre parcours éducatif..."
                rows={4}
                className={`w-full rounded-md border-gray-300 shadow-sm ${isEditable
                        ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        : "bg-gray-100"
                    } px-3 py-2`}
            />
        </div>
    );
};

export default EducationSection;