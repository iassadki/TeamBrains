import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: 20, textAlign: 'center' }}>
            <h1>Accès Refusé</h1>
            <p>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
            <button onClick={() => navigate(-1)}>Retour</button>
        </div>
    );
};

export default AccessDenied;