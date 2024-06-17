// components/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';

const PrivateRoute = ({ children, roles }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/connexion" state={{ from: location }} />;
    }

    if (roles && !roles.includes(currentUser.role)) {
        // Au lieu de rediriger, affichez le composant AccessDenied
        return <AccessDenied />;
    }

    return children;
};

export default PrivateRoute;
