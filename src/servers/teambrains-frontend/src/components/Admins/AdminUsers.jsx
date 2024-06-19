import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5001/users/all_users', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            try {
                await axios.delete(`http://localhost:5001/users/delete_user/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                fetchUsers();  // Re-fetch users to update the list
            } catch (error) {
                console.error('Erreur lors de la suppression de lutilisateur:', error);
            }
        }
    };

    return (
        <div className="p-4">
            <h2 className='text-2xl font-semibold mb-4'>Gestion des Utilisateurs</h2>
            <div className="overflow-x-auto">
                <table className='w-full text-left shadow-lg bg-white rounded-lg'>
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-3">Nom</th>
                            <th className="p-3">Prénom</th>
                            <th className="p-3">Rôle</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                                <td className="p-3">{user.nom}</td>
                                <td className="p-3">{user.prenom}</td>
                                <td className="p-3">{user.role}</td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3 align-center">
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="bg-red-400 rounded p-1 px-4 text-white hover:text-white hover:bg-red-500"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
