import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [tokenValidated, setTokenValidated] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Nouvel état pour la gestion des utilisateurs existants
    const [emailCheckResult, setEmailCheckResult] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(false);
    
    const [tokenForm, setTokenForm] = useState({
        token: ''
    });
    
    const [registrationForm, setRegistrationForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        date_naissance: '',
        formation: '',
        niveau_etudes: ''
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
                setTokenValidated(true);
                setSchoolInfo(data.school);
                setStep(2);
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

    const handleEmailCheck = async (email) => {
        if (!email || !tokenForm.token) return;

        try {
            const response = await fetch('http://localhost:5001/api/partnership/student/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email, 
                    token: tokenForm.token.toUpperCase() 
                })
            });

            const data = await response.json();

            if (response.ok) {
                setEmailCheckResult(data);
                
                if (data.exists) {
                    setIsExistingUser(true);
                    
                    if (data.has_school && !data.same_school && data.can_transfer) {
                        setShowConfirmDialog(true);
                    } else if (data.same_school) {
                        setError(data.message);
                        return;
                    } else if (!data.has_school && data.can_join) {
                        // Pré-remplir les champs avec les infos existantes
                        setRegistrationForm(prev => ({
                            ...prev,
                            nom: data.user_info.nom,
                            prenom: data.user_info.prenom,
                            email: data.user_info.email
                        }));
                    }
                } else {
                    setIsExistingUser(false);
                    setEmailCheckResult(null);
                }
            } else {
                setError(data.error || 'Erreur lors de la vérification de l\'email');
            }
        } catch (error) {
            console.error('Erreur vérification email:', error);
        }
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation des mots de passe
        if (registrationForm.password !== registrationForm.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (registrationForm.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                token: tokenForm.token.toUpperCase(),
                ...registrationForm
            };
            delete payload.confirmPassword;

            // Ajouter la confirmation de transfert si nécessaire
            if (isExistingUser && emailCheckResult?.can_transfer) {
                payload.confirm_transfer = true;
            }

            const response = await fetch('http://localhost:5001/api/partnership/student/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setStep(3);
            } else {
                if (data.requires_confirmation) {
                    setShowConfirmDialog(true);
                } else {
                    setError(data.error || 'Erreur lors de l\'inscription');
                }
            }
        } catch (error) {
            console.error('Erreur inscription:', error);
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

    const handleRegistrationChange = (e) => {
        const { name, value } = e.target;
        setRegistrationForm({
            ...registrationForm,
            [name]: value
        });

        // Vérifier l'email quand il change
        if (name === 'email' && value.includes('@')) {
            setError('');
            setShowConfirmDialog(false);
            handleEmailCheck(value);
        }
    };

    const confirmTransfer = () => {
        setShowConfirmDialog(false);
        handleRegistrationSubmit(new Event('submit'));
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
                        <div className={`flex-1 h-2 rounded-l-lg ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 h-2 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 h-2 rounded-r-lg ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Token</span>
                        <span>Inscription</span>
                        <span>Terminé</span>
                    </div>
                </div>

                {/* Dialog de confirmation de transfert */}
                {showConfirmDialog && emailCheckResult && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Confirmer le transfert d'école
                            </h3>
                            
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    {emailCheckResult.message}
                                </p>
                                
                                {emailCheckResult.current_school && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-red-800">
                                            <strong>École actuelle :</strong> {emailCheckResult.current_school.name}
                                        </p>
                                    </div>
                                )}
                                
                                {emailCheckResult.target_school && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-green-800">
                                            <strong>Nouvelle école :</strong> {emailCheckResult.target_school.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmTransfer}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Confirmer le transfert
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Token Verification */}
                {step === 1 && (
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
                )}

                {/* Step 2: Registration Form */}
                {step === 2 && (
                    <div className="bg-white py-8 px-6 shadow rounded-lg">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            {isExistingUser ? 'Connexion' : 'Créer votre compte'}
                        </h2>
                        
                        {schoolInfo && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="font-medium text-blue-900">École : {schoolInfo.name}</h3>
                                <p className="text-sm text-blue-700">{schoolInfo.description}</p>
                            </div>
                        )}

                        {/* Affichage des informations de l'utilisateur existant */}
                        {emailCheckResult && emailCheckResult.exists && !emailCheckResult.same_school && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-800">Compte existant détecté</p>
                                        <p className="text-yellow-700">
                                            {emailCheckResult.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleRegistrationSubmit}>
                            {error && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Email - toujours affiché */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={registrationForm.email}
                                        onChange={handleRegistrationChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        required
                                        disabled={isExistingUser}
                                    />
                                </div>

                                {/* Mot de passe - toujours requis */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isExistingUser ? 'Mot de passe' : 'Mot de passe'} *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={registrationForm.password}
                                        onChange={handleRegistrationChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {/* Champs pour nouveaux utilisateurs seulement */}
                                {!isExistingUser && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirmer le mot de passe *
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={registrationForm.confirmPassword}
                                                onChange={handleRegistrationChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Prénom *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="prenom"
                                                    value={registrationForm.prenom}
                                                    onChange={handleRegistrationChange}
                                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nom *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="nom"
                                                    value={registrationForm.nom}
                                                    onChange={handleRegistrationChange}
                                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Formation/Études
                                            </label>
                                            <input
                                                type="text"
                                                name="formation"
                                                value={registrationForm.formation}
                                                onChange={handleRegistrationChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                placeholder="Ex: Master Informatique, Licence Pro..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Niveau d'études
                                            </label>
                                            <select
                                                name="niveau_etudes"
                                                value={registrationForm.niveau_etudes}
                                                onChange={handleRegistrationChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                            >
                                                <option value="">Sélectionner...</option>
                                                <option value="bac">Bac</option>
                                                <option value="bac+1">Bac+1</option>
                                                <option value="bac+2">Bac+2</option>
                                                <option value="bac+3">Bac+3</option>
                                                <option value="bac+4">Bac+4</option>
                                                <option value="bac+5">Bac+5</option>
                                                <option value="bac+6">Bac+6 et plus</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                                {loading ? 'Inscription...' : (isExistingUser ? 'Se connecter et rejoindre l\'école' : 'S\'inscrire')}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setStep(1)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                ← Retour au token
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="bg-white py-8 px-6 shadow rounded-lg text-center">
                        <div className="mb-6">
                            <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {isExistingUser ? 'Transfert réussi !' : 'Inscription réussie !'}
                        </h2>
                        
                        <p className="text-gray-600 mb-6">
                            {isExistingUser 
                                ? `Votre compte a été transféré vers ${schoolInfo?.name}. Vous pouvez maintenant accéder à la plateforme TeamBrains.`
                                : `Votre compte a été créé avec succès pour l'école ${schoolInfo?.name}. Vous pouvez maintenant accéder à la plateforme TeamBrains.`
                            }
                        </p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Accéder au dashboard
                            </button>
                            
                            <Link
                                to="/partenariat-ecole"
                                className="block text-sm text-gray-500 hover:text-gray-700"
                            >
                                Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentRegistration; 