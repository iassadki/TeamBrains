import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const [userInfo, setUserInfo] = useState({
        prenom: '',
        nom: '',
        role: '',
        email: '',
        typeDeveloppeur: '',
        technologies: []
    });

    const [originalUserInfo, setOriginalUserInfo] = useState({});
    const [isEditable, setIsEditable] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        axios.get('http://localhost:5001/users/profile', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
        .then(response => {
            setUserInfo(response.data);
            setOriginalUserInfo(response.data);
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des données utilisateur", error);
        });
    }, [currentUser]);

    const handleEdit = () => {
        setIsEditable(true);
    };

    const handleCancel = () => {
        setUserInfo(originalUserInfo);
        setIsEditable(false);
    };

    const handleSave = () => {
        axios.put('http://localhost:5001/users/profile', userInfo, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
        .then(response => {
            setUserInfo(response.data);
            setOriginalUserInfo(response.data);
            setIsEditable(false);
        })
        .catch(error => {
            console.error("Erreur lors de la mise à jour des données utilisateur", error);
        });
    };

    const displayRole = (role) => {
        if (role === 'businessman') {
            return 'Entrepreneur';
        } else if (role === 'student') {
            return 'Étudiant';
        }
        return role;
    };

    const technologies = {
        FrontEnd: ["HTML", "CSS", "JavaScript", "React", "Vue"],
        BackEnd: ["Node.js", "Python", "Java", "PHP", "Ruby", "MongoDB", "SQL"],
        FullStack: ["HTML", "CSS", "JavaScript", "Node.js", "React", "MongoDB", "SQL", "Ruby", "PHP", "Java", "Python", "Vue"],
        Designer: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
    };

    const handleSelectTech = (tech) => {
        if (!isEditable) return;
        const newSelectedTechs = userInfo.technologies.includes(tech)
            ? userInfo.technologies.filter(t => t !== tech)
            : [...userInfo.technologies, tech];
        setUserInfo({ ...userInfo, technologies: newSelectedTechs });
    };

    const techsToDisplay = technologies[userInfo.typeDeveloppeur] || [];

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg mb-10">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-700">Mon Profil</h1>
                {!isEditable && (
                    <button
                        type="button"
                        onClick={handleEdit}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Modifier
                    </button>
                )}
            </div>
            <form className="space-y-4 mt-4 mb-4">
                <div className="flex flex-col md:flex-row md:space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Prénom</label>
                        <input
                            type="text"
                            value={userInfo.prenom}
                            onChange={(e) => setUserInfo({ ...userInfo, prenom: e.target.value })}
                            disabled={!isEditable}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                        />
                    </div>
                    <div className="flex-1 mt-4 md:mt-0">
                        <label className="block text-sm font-medium text-gray-700">Nom</label>
                        <input
                            type="text"
                            value={userInfo.nom}
                            onChange={(e) => setUserInfo({ ...userInfo, nom: e.target.value })}
                            disabled={!isEditable}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isEditable ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" : "bg-gray-100"} px-3 py-2`}
                        />
                    </div>
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
                        {isEditable ? (
                            <select
                                value={userInfo.typeDeveloppeur}
                                onChange={(e) => setUserInfo({ ...userInfo, typeDeveloppeur: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
                            >
                                <option value="FrontEnd">FrontEnd</option>
                                <option value="BackEnd">BackEnd</option>
                                <option value="FullStack">FullStack</option>
                                <option value="Designer">Designer</option>
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={userInfo.typeDeveloppeur}
                                disabled={!isEditable}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 px-3 py-2"
                            />
                        )}
                    </div>
                )}
                {userInfo.role !== 'businessman' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Technologies</label>
                    <div className="grid grid-cols-3 gap-4 mb-4 mt-2">
                        {techsToDisplay.map((tech, index) => (
                            <div key={index}
                                className={`p-4 border rounded shadow cursor-pointer ${userInfo.technologies.includes(tech) ? 'bg-green-500 text-white' : 'bg-white'} ${isEditable ? 'hover:ring-2 hover:ring-green-tb' : 'cursor-not-allowed'}`}
                                onClick={() => handleSelectTech(tech)}>
                                <div className="text-center">
                                    {tech}
                                </div>
                            </div>
                        ))}
                    </div>
                    {isEditable && <p className="text-sm text-gray-500">Cliquez sur les technologies pour les ajouter ou les supprimer.</p>}
                </div>
                )}
                {isEditable && (
                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Enregistrer
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default Profile;
