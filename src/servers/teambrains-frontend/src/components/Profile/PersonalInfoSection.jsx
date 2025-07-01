import React from 'react';

const PersonalInfoSection = ({ userInfo, setUserInfo, isEditable }) => {
    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Informations</h2>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                    <input
                        type="text"
                        value={userInfo.prenom}
                        onChange={(e) => setUserInfo({ ...userInfo, prenom: e.target.value })}
                        disabled={!isEditable}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable
                                ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                : "bg-gray-100"
                            } px-3 py-2`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                        type="text"
                        value={userInfo.nom}
                        onChange={(e) => setUserInfo({ ...userInfo, nom: e.target.value })}
                        disabled={!isEditable}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable
                                ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                : "bg-gray-100"
                            } px-3 py-2`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="text"
                        value={userInfo.email}
                        disabled={!isEditable}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable
                                ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                : "bg-gray-100"
                            } px-3 py-2`}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalInfoSection;