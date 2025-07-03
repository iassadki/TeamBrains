import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';

const StudentRegistration = () => {
    const { openSignUpModal } = useModal();
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [tokenForm, setTokenForm] = useState({
        token: ''
    });

    const handleTokenSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

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
                setTokenInfo(data.token_info);
                setSuccess('Token validé avec succès ! Cliquez sur "Continuer l\'inscription" pour finaliser votre inscription.');
                
                // Préparer les données pour l'inscription via école
                const schoolData = {
                    token: tokenForm.token.toUpperCase(),
                    school: data.school,
                    tokenInfo: data.token_info,
                    isFromSchool: true
                };
                
                // Stocker temporairement les infos de l'école
                localStorage.setItem('schoolRegistrationData', JSON.stringify(schoolData));
            } else {
                setError(data.error || 'Token invalide');
                setSchoolInfo(null);
                setTokenInfo(null);
            }
        } catch (error) {
            console.error('Erreur validation token:', error);
            setError('Erreur de connexion au serveur');
            setSchoolInfo(null);
            setTokenInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueRegistration = () => {
        // Ouvrir la modal d'inscription avec les données pré-remplies
        openSignUpModal();
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 6) {
            setTokenForm({ token: value });
        }
        // Reset des états quand on change le token
        if (schoolInfo || tokenInfo) {
            setSchoolInfo(null);
            setTokenInfo(null);
            setSuccess('');
            setError('');
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
                        <div className={`flex-1 h-2 rounded-full ${schoolInfo ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        {schoolInfo && (
                            <div className="flex-1 h-2 rounded-full bg-blue-300 ml-2"></div>
                        )}
                    </div>
                    <div className="flex justify-center text-xs text-gray-500 mt-2">
                        <span>{schoolInfo ? 'Token validé - Finaliser l\'inscription' : 'Validation du token'}</span>
                    </div>
                </div>

                {/* Token Verification */}
                <div className="bg-white py-8 px-6 shadow rounded-lg">
                    {!schoolInfo ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Token validé avec succès !
                                </h2>
                            </div>

                            {/* Informations du token */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Code token :</span>
                                        <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono font-bold text-blue-800">
                                            {tokenForm.token}
                                        </code>
                                    </div>
                                    
                                    {tokenInfo?.name && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Nom :</span>
                                            <span className="text-sm font-semibold text-green-800">
                                                📋 {tokenInfo.name}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">École :</span>
                                        <span className="text-sm font-semibold text-green-800">
                                            🏫 {schoolInfo.name}
                                        </span>
                                    </div>
                                    
                                    {tokenInfo?.description && (
                                        <div className="pt-2 border-t border-green-200">
                                            <span className="text-sm font-medium text-gray-700">Description :</span>
                                            <p className="text-sm text-gray-600 mt-1">
                                                💬 {tokenInfo.description}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {tokenInfo?.remaining_uses && tokenInfo.remaining_uses !== "Illimité" && (
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Utilisations restantes :</span>
                                            <span>{tokenInfo.remaining_uses}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {success && (
                                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={handleContinueRegistration}
                                    className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 font-medium"
                                >
                                    Continuer l'inscription
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setSchoolInfo(null);
                                        setTokenInfo(null);
                                        setSuccess('');
                                        setTokenForm({ token: '' });
                                    }}
                                    className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium"
                                >
                                    Essayer un autre token
                                </button>
                            </div>
                        </>
                    )}

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