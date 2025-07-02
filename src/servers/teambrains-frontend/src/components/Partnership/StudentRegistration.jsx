import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';

const StudentRegistration = () => {
    const { openSignUpModal } = useModal();
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [tokenForm, setTokenForm] = useState({
        token: ''
    });

    const handleTokenSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5001/api/partnership/student/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: tokenForm.token.toUpperCase() })
            });

            const data = await response.json();

            if (response.ok) {
                setSchoolInfo(data.school);
                
                // Préparer les données pour l'inscription via école
                const schoolData = {
                    token: tokenForm.token.toUpperCase(),
                    school: data.school,
                    isFromSchool: true
                };
                
                // Stocker temporairement les infos de l'école
                localStorage.setItem('schoolRegistrationData', JSON.stringify(schoolData));
                
                // Ouvrir directement la modal d'inscription
                openSignUpModal();
            } else {
                setError(data.error || 'Token invalide');
            }
        } catch (error) {
            console.error('Erreur validation token:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 6) {
            setTokenForm({ token: value });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <img src="/src/assets/logo_teambrains.svg" alt="TeamBrains" className="h-12 mx-auto" />
                    <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Inscription Étudiant
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Rejoignez TeamBrains via votre école partenaire
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center">
                        <div className="flex-1 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="flex justify-center text-xs text-gray-500 mt-2">
                        <span>Validation du token</span>
                    </div>
                </div>

                {/* Token Verification */}
                <div className="bg-white py-8 px-6 shadow rounded-lg">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                        Saisissez votre token d'inscription
                    </h2>
                    
                    <form onSubmit={handleTokenSubmit}>
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Token d'inscription (6 caractères)
                            </label>
                            <input
                                type="text"
                                value={tokenForm.token}
                                onChange={handleTokenChange}
                                className="w-full p-4 border border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest uppercase"
                                placeholder="ABC123"
                                maxLength={6}
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Le token vous a été fourni par votre école partenaire
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || tokenForm.token.length !== 6}
                            className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? 'Vérification...' : 'Valider le token'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/partenariat-ecole"
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRegistration; 