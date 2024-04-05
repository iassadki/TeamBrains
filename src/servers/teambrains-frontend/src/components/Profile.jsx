import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CircleUserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
    const [userInfo, setUserInfo] = useState({
        prenom: '',
        nom: '',
        role: '',
        email: '',
        typeDeveloppeur: ''
    });


    const [originalUserInfo, setOriginalUserInfo] = useState({}); // Pour stocker les valeurs initiales
    const [isEditable, setIsEditable] = useState(false);
    const { currentUser } = useAuth(); // Utilisez currentUser pour obtenir le token

    useEffect(() => {
        axios.get('http://localhost:5001/users/profile', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // ou currentUser.accessToken si stocké dans le contexte
            }
        })
        .then(response => {
            setUserInfo(response.data);
            setOriginalUserInfo(response.data); // Stockez les données initiales
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des données utilisateur", error);
        });
    }, [currentUser]);

    const handleEdit = () => {
        setIsEditable(true);
    };

    const handleCancel = () => {
        setUserInfo(originalUserInfo); // Réinitialisez userInfo avec les valeurs originales
        setIsEditable(false); // Désactivez le mode éditable
    };

    const handleSave = () => {
        // Envoyer les informations mises à jour au serveur...
    };

    const displayRole = (role) => {
      if (role === 'businessman') {
          return 'Entrepreneur';
      } else if (role === 'student') {
          return 'Étudiant';
      }
      return role;
  };

    return (
<div className="max-w-4xl mx-auto mt-10 px-4 py-8 bg-white shadow-md rounded-lg">
    <form className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
                type="text"
                value={userInfo.prenom}
                onChange={(e) => setUserInfo({ ...userInfo, prenom: e.target.value })}
                disabled={!isEditable}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
                type="text"
                value={userInfo.nom}
                onChange={(e) => setUserInfo({ ...userInfo, nom: e.target.value })}
                disabled={!isEditable}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
                type="text"
                value={userInfo.email}
                disabled={!isEditable}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Rôle</label>
            <input
                type="text"
                value={displayRole(userInfo.role)}
                disabled={true}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 px-3 py-2"
            />
        </div>

        {userInfo.role !== 'businessman' && (
            <div>
                <label className="block text-sm font-medium text-gray-700">Type de développeur</label>
                <input
                    type="text"
                    value={userInfo.typeDeveloppeur}
                    disabled={!isEditable}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 px-3 py-2"
                />
            </div>
        )}
{isEditable && (
                    <div className="flex justify-between">
                        <button type="button" onClick={handleCancel} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Annuler
                        </button>
                        <button type="button" onClick={handleSave} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Enregistrer
                        </button>
                    </div>
                )}
                {!isEditable && (
                    <div className="flex justify-end">
                        <button type="button" onClick={handleEdit} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Modifier
                        </button>
                    </div>
                )}
    </form>
</div>
    );
};

export default Profile;
