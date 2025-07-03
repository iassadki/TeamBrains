import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, School, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SchoolRegistration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1); // 1: Info école, 2: Info admin, 3: Abonnement
    
    const [schoolData, setSchoolData] = useState({
        // Étape 1: Informations école
        name: '',
        description: '',
        contact_email: '',
        website: '',
        
        // Étape 2: Informations administrateur
        admin_firstname: '',
        admin_lastname: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirm: '',
        
        // Étape 3: Abonnement
        student_count: 10
    });

    const handleChange = (e) => {
        setSchoolData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const validateStep1 = () => {
        if (!schoolData.name.trim()) {
            toast.error('Le nom de l\'école est requis');
            return false;
        }
        if (!schoolData.contact_email.trim()) {
            toast.error('L\'email de contact est requis');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolData.contact_email)) {
            toast.error('Format d\'email invalide');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!schoolData.admin_firstname.trim() || !schoolData.admin_lastname.trim()) {
            toast.error('Le nom et prénom de l\'administrateur sont requis');
            return false;
        }
        if (!schoolData.admin_email.trim()) {
            toast.error('L\'email de l\'administrateur est requis');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolData.admin_email)) {
            toast.error('Format d\'email administrateur invalide');
            return false;
        }
        if (schoolData.admin_password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        if (schoolData.admin_password !== schoolData.admin_password_confirm) {
            toast.error('Les mots de passe ne correspondent pas');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) return;
        
        if (schoolData.student_count < 1) {
            toast.error('Le nombre d\'étudiants doit être d\'au moins 1');
            return;
        }

        setLoading(true);

        try {
            // Étape 1: Inscrire l'école et l'admin
            const registrationResponse = await fetch('http://localhost:5001/api/partnership/school/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: schoolData.name,
                    description: schoolData.description,
                    contact_email: schoolData.contact_email,
                    website: schoolData.website,
                    admin_firstname: schoolData.admin_firstname,
                    admin_lastname: schoolData.admin_lastname,
                    admin_email: schoolData.admin_email,
                    admin_password: schoolData.admin_password
                })
            });

            const registrationData = await registrationResponse.json();

            if (!registrationResponse.ok) {
                throw new Error(registrationData.error || 'Erreur lors de l\'inscription');
            }

            // Étape 2: Se connecter automatiquement
            const loginResponse = await fetch('http://localhost:5001/api/partnership/school/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: schoolData.admin_email,
                    password: schoolData.admin_password
                })
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                throw new Error('Erreur de connexion automatique');
            }

            // Stocker le token
            localStorage.setItem('partnershipToken', loginData.access_token);

            // Étape 3: Créer l'abonnement Stripe
            const subscriptionResponse = await fetch('http://localhost:5001/api/partnership/stripe/create-school-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${loginData.access_token}`
                },
                body: JSON.stringify({
                    student_count: schoolData.student_count
                })
            });

            const subscriptionData = await subscriptionResponse.json();

            if (!subscriptionResponse.ok) {
                throw new Error(subscriptionData.error || 'Erreur lors de la création de l\'abonnement');
            }

            // Rediriger vers Stripe Checkout
            window.location.href = subscriptionData.checkout_url;

        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlyPrice = () => {
        return schoolData.student_count * 5;
    };

    const calculateYearlyPrice = () => {
        return calculateMonthlyPrice() * 12;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <ToastContainer position="top-right" autoClose={5000} />
            
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <Link to="/partenariat-ecole" className="flex items-center">
                            <ArrowLeft className="w-5 h-5 mr-2 text-blue-600" />
                            <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
                            <span className="text-2xl font-bold text-gray-900">
                                TeamBrains <span className="text-blue-600">Partenariat</span>
                            </span>
                        </Link>
                        <Link
                            to="/partenariat-ecole/connexion"
                            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Déjà partenaire ? Se connecter
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                                1
                            </div>
                            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                                2
                            </div>
                            <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                                3
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-4 space-x-8">
                        <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            École
                        </span>
                        <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            Administrateur
                        </span>
                        <span className={`text-sm ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            Abonnement
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Étape 1: Informations école */}
                    {step === 1 && (
                        <div>
                            <div className="text-center mb-8">
                                <School className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Informations de l'école
                                </h1>
                                <p className="text-gray-600">
                                    Commencez par nous parler de votre établissement
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom de l'école *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={schoolData.name}
                                        onChange={handleChange}
                                        placeholder="École Supérieure d'Informatique..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email de contact *
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={schoolData.contact_email}
                                        onChange={handleChange}
                                        placeholder="contact@ecole.fr"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Site web
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={schoolData.website}
                                        onChange={handleChange}
                                        placeholder="https://www.ecole.fr"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={schoolData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Décrivez brièvement votre établissement..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-8">
                                <button
                                    onClick={handleNextStep}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Continuer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Étape 2: Informations administrateur */}
                    {step === 2 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    👤
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Compte administrateur
                                </h1>
                                <p className="text-gray-600">
                                    Créez le compte administrateur pour gérer votre école
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prénom *
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_firstname"
                                        value={schoolData.admin_firstname}
                                        onChange={handleChange}
                                        placeholder="Jean"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom *
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_lastname"
                                        value={schoolData.admin_lastname}
                                        onChange={handleChange}
                                        placeholder="Dupont"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email administrateur *
                                    </label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        value={schoolData.admin_email}
                                        onChange={handleChange}
                                        placeholder="admin@ecole.fr"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mot de passe *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="admin_password"
                                            value={schoolData.admin_password}
                                            onChange={handleChange}
                                            placeholder="Min. 6 caractères"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmer le mot de passe *
                                    </label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="admin_password_confirm"
                                        value={schoolData.admin_password_confirm}
                                        onChange={handleChange}
                                        placeholder="Répétez le mot de passe"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={handlePrevStep}
                                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Continuer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Étape 3: Abonnement */}
                    {step === 3 && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    💳
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Abonnement école
                                </h1>
                                <p className="text-gray-600">
                                    Configurez votre abonnement selon le nombre d'étudiants
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto">
                                {/* Configurateur de prix */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                                        Configuration de l'abonnement
                                    </h3>
                                    
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre d'étudiants estimé
                                        </label>
                                        <input
                                            type="number"
                                            name="student_count"
                                            value={schoolData.student_count}
                                            onChange={handleChange}
                                            min="1"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-bold"
                                        />
                                        <p className="text-sm text-gray-600 mt-2 text-center">
                                            Vous pourrez ajuster ce nombre après votre inscription
                                        </p>
                                    </div>

                                    {/* Calcul du prix */}
                                    <div className="bg-white rounded-lg p-4 border">
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {calculateMonthlyPrice()}€
                                                </div>
                                                <div className="text-sm text-gray-600">par mois</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {calculateYearlyPrice()}€
                                                </div>
                                                <div className="text-sm text-gray-600">par an</div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t text-center">
                                            <p className="text-sm text-gray-600">
                                                <strong>5€ par étudiant et par mois</strong><br />
                                                Facturé mensuellement • Aucun engagement
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Récapitulatif */}
                                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Récapitulatif
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">École:</span>
                                            <span className="font-medium">{schoolData.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Administrateur:</span>
                                            <span className="font-medium">{schoolData.admin_firstname} {schoolData.admin_lastname}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Étudiants:</span>
                                            <span className="font-medium">{schoolData.student_count}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 mt-2">
                                            <span className="text-gray-900 font-semibold">Total mensuel:</span>
                                            <span className="font-bold text-blue-600">{calculateMonthlyPrice()}€</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center text-sm text-gray-600 mb-6">
                                    En cliquant sur "Finaliser l'inscription", vous serez redirigé vers Stripe pour le paiement sécurisé.
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={handlePrevStep}
                                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Création en cours...
                                        </>
                                    ) : (
                                        'Finaliser l\'inscription'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolRegistration; 