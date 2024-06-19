import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // Utilisez jwt_decode au lieu de jwtDecode

const AuthContext = createContext();

const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Ajoutez un état de chargement

    const fetchUserInfo = async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            try {
                const decoded = jwtDecode(accessToken);  // Décodage du JWT
                setCurrentUser({
                    ...decoded,
                    accessToken  // Conservez le token dans l'état pour une utilisation future
                });

                // Faire l'appel API pour obtenir des données utilisateur détaillées
                const response = await axios.get('http://localhost:5001/users/current_user', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                // Mise à jour de l'état avec des données utilisateur détaillées
                setCurrentUser(current => ({
                    ...current,
                    ...response.data  // Fusion des données API avec les données JWT décodées
                }));
            } catch (error) {
                console.log("Erreur de décodage du token ou token invalide", error);
                localStorage.removeItem('accessToken');
            }
        }
        setLoading(false); // Fin du chargement
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const login = (accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        fetchUserInfo();
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('accessToken');
    };

    const value = {
        currentUser,
        login,
        logout,
        loading // Ajoutez l'état de chargement dans le contexte
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export { useAuth, AuthProvider };
