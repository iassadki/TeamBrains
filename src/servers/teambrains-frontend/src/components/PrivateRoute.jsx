import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';

const PrivateRoute = ({ children, roles }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Show a loading indicator while checking authentication
        return <div>Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/connexion" state={{ from: location }} />;
    }

    if (roles && !roles.includes(currentUser.role)) {
        return <AccessDenied />;
    }

    return children;
};

export default PrivateRoute;
