import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Accès Refusé</h1>
                <p className="text-lg text-gray-700 mb-6">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
                <button
                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                    onClick={() => navigate(-1)}
                >
                    Retour
                </button>
            </div>
        </div>
    );
};

export default AccessDenied;
