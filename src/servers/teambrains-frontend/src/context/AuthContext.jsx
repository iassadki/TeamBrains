import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Assurez-vous d'avoir axios pour les requêtes HTTP

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);

    // Déclarez fetchUserInfo à un niveau accessible par les fonctions login et useEffect
    const fetchUserInfo = () => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            axios.get('http://localhost:5001/users/current_user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            .then(response => {
                setCurrentUser({
                    ...response.data,
                    accessToken
                });
            })
            .catch(error => {
                console.log("Erreur lors de la récupération de l'utilisateur", error);
                // Gérez les erreurs, par exemple en effaçant le token invalide
                localStorage.removeItem('accessToken');
            });
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const login = (accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        // Appeler fetchUserInfo ici pour mettre à jour l'état après la connexion
        fetchUserInfo();
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('accessToken');
    };

    const value = {
        currentUser,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
