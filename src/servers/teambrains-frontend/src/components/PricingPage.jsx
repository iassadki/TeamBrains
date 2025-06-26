import React, { useState } from 'react';
import { Check, Users, GraduationCap, Star, Shield, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PricingPage = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState('');
    const [studentCount, setStudentCount] = useState(10); // Valeur par défaut

    // Fonction pour calculer le prix dynamique de l'école
    const calculateSchoolPrice = (students) => {
        const basePriceYearly = 120; // 120€ de base par an
        const studentPriceMonthly = 2; // 2€ par étudiant par mois
        const studentPriceYearly = students * studentPriceMonthly * 12;
        return basePriceYearly + studentPriceYearly;
    };


    
    const plans = [
        {
            id: 'student',
            name: 'Plan Étudiant',
            description: 'Parfait pour les étudiants individuels',
            price: '2€',
            period: '/mois',
            annually: '24€ par an',
            icon: <GraduationCap className="w-8 h-8 text-blue-600" />,
            color: 'blue',
            stripeUrl: 'https://buy.stripe.com/test_00w5kw8Jz39tc8b2kd0x200',
            features: [
                'Jusqu\'à 5 projets',
                'Gestion de tâches illimitées',
                'Collaboration en équipe',
                'Suivi de progression',
                'CV numérique personnalisé',
                'Support par email',
                'Interface moderne et intuitive'
            ],
            badge: null
        },
        {
            id: 'school',
            name: 'Plan École (Hybride)',
            description: 'Tarification flexible basée sur le nombre d\'étudiants',
            price: `${calculateSchoolPrice(studentCount)}€`,
            period: '/an',
            annually: `120€ base + ${studentCount} × 2€/mois`,
            icon: <Users className="w-8 h-8 text-green-600" />,
            color: 'green',
            stripeUrl: 'https://buy.stripe.com/test_dRm7sE7Fv11l8VZ2kd0x201',
            features: [
                'Plan de base: 120€/an (10€/mois)',
                'Compteur d\'étudiants: 2€/mois par étudiant',
                'Facturation automatique selon le nombre d\'étudiants',
                'Tableau de bord administrateur',
                'Gestion avancée des utilisateurs',
                'Rapports et analyses détaillés',
                'Support prioritaire 24/7',
                'Formation et onboarding',
                'API et intégrations',
                'Stockage étendu',
                'Sauvegardes automatiques'
            ],
            badge: 'Recommandé',
            isHybrid: true,
            currentStudentCount: studentCount,
            totalPrice: calculateSchoolPrice(studentCount)
        }
    ];

    const handlePlanSelect = async (planId) => {
        if (!token) {
            setError('Vous devez être connecté pour souscrire à un plan');
            return;
        }

        // Validation basique pour le plan école
        if (planId === 'school') {
            if (studentCount < 1) {
                setError('Le nombre d\'étudiants doit être d\'au moins 1.');
                return;
            }
        }

        setLoading(planId);
        setError('');

        try {
            const response = await fetch('http://localhost:5001/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan_type: planId,
                    ...(planId === 'school' && {
                        student_count: studentCount
                    })
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Rediriger vers Stripe Checkout
                window.location.href = data.checkout_url;
            } else {
                setError(data.error || 'Erreur lors de la création de la session de paiement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(null);
        }
    };

    return (
        <>
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                }
                
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* En-tête */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Choisissez votre plan TeamBrains
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Découvrez la solution de gestion de projets étudiants qui transforme 
                        votre façon de collaborer et d'apprendre
                    </p>
                    {error && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md mx-auto">
                            {error}
                        </div>
                    )}
                    {!token && (
                        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg max-w-md mx-auto">
                            Veuillez vous connecter pour souscrire à un plan
                        </div>
                    )}
                </div>

                {/* Configurateur pour le plan école */}
                {token && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                🏫 Configurez votre Plan École
                            </h2>
                            <p className="text-gray-600">
                                Ajustez le nombre d'étudiants pour voir le prix personnalisé
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {/* Information sur la configuration */}
                            <div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-2">
                                        🎓 Configurateur de tarification
                                    </h4>
                                    <p className="text-sm text-blue-800 mb-2">
                                        Ajustez le nombre d'étudiants pour voir le prix personnalisé de votre plan École.
                                    </p>
                                    <div className="text-xs text-blue-700 space-y-1">
                                        <div>• Plan de base : 120€/an (fixe)</div>
                                        <div>• Prix par étudiant : 2€/mois (24€/an)</div>
                                        <div>• Association école : configurable après paiement</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sélection du nombre d'étudiants */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre d'étudiants
                                </label>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="1"
                                        max="500"
                                        value={studentCount}
                                        onChange={(e) => setStudentCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>1</span>
                                        <span>500</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-center">
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={studentCount}
                                        onChange={(e) => setStudentCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">étudiants</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Aperçu du calcul */}
                        <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-green-500 max-w-2xl mx-auto">
                            <h4 className="font-semibold text-gray-900 mb-2">💰 Calcul de votre tarif :</h4>
                            <div className="space-y-1 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span>Plan de base (annuel) :</span>
                                    <span className="font-medium">120€</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{studentCount} étudiants × 2€/mois × 12 mois :</span>
                                    <span className="font-medium">{studentCount * 2 * 12}€</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between text-lg font-bold text-green-600">
                                    <span>Total annuel :</span>
                                    <span>{calculateSchoolPrice(studentCount)}€</span>
                                </div>
                                <div className="text-xs text-gray-500 text-center mt-2">
                                    Soit {(calculateSchoolPrice(studentCount) / 12).toFixed(2)}€ par mois
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cartes de tarification */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl shadow-xl border-2 hover:shadow-2xl transition-all duration-300 ${
                                plan.badge ? 'border-green-200 scale-105' : 'border-gray-200'
                            }`}
                        >
                            {/* Badge recommandé */}
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center">
                                        <Star className="w-4 h-4 mr-1" />
                                        {plan.badge}
                                    </div>
                                </div>
                            )}

                            <div className="p-8">
                                {/* En-tête du plan */}
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-4">
                                        {plan.icon}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        {plan.description}
                                    </p>
                                    
                                    {/* Prix */}
                                    <div className="mb-4">
                                        <div className="flex justify-center items-baseline">
                                            <span className={`text-5xl font-bold text-${plan.color}-600`}>
                                                {plan.price}
                                            </span>
                                            <span className="text-xl text-gray-500 ml-1">
                                                {plan.period}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {plan.annually}
                                        </div>
                                        {plan.isHybrid && (
                                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-sm text-green-800 font-medium">
                                                    💡 Tarification personnalisée
                                                </div>
                                                <div className="text-xs text-green-700 mt-1 space-y-1">
                                                    <div>• Plan base : 120€/an</div>
                                                    <div>• {plan.currentStudentCount} étudiants × 24€/an = {plan.currentStudentCount * 24}€</div>
                                                    <div className="font-medium border-t border-green-300 pt-1">
                                                        Total configuré : {plan.totalPrice}€/an
                                                    </div>
                                                </div>
                                                <div className="text-xs text-green-600 mt-2 font-medium">
                                                    ⬆️ Ajustez le curseur ci-dessus pour personnaliser
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bouton d'action */}
                                    <button
                                        onClick={() => handlePlanSelect(plan.id)}
                                        disabled={loading === plan.id || !token}
                                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                                            plan.color === 'green'
                                                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
                                        } hover:shadow-lg hover:scale-105 disabled:cursor-not-allowed disabled:transform-none`}
                                    >
                                        {loading === plan.id ? (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Redirection...
                                            </div>
                                        ) : (
                                            'Choisir ce plan'
                                        )}
                                    </button>
                                </div>

                                {/* Liste des fonctionnalités */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 text-lg mb-4">
                                        Fonctionnalités incluses :
                                    </h3>
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start">
                                            <Check className={`w-5 h-5 text-${plan.color}-600 mr-3 mt-0.5 flex-shrink-0`} />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Explication du plan hybride école */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-12">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            🏫 Comment fonctionne le Plan École Hybride ?
                        </h2>
                        <p className="text-gray-600">
                            Une tarification juste et transparente qui s'adapte à la taille de votre établissement
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="text-center">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">🏗️</span>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Plan de base</h3>
                                <div className="text-3xl font-bold text-green-600 mb-2">120€/an</div>
                                <p className="text-gray-600 text-sm">
                                    Accès complet à la plateforme, gestion illimitée des projets et fonctionnalités admin
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="text-center">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">👥</span>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Par étudiant</h3>
                                <div className="text-3xl font-bold text-blue-600 mb-2">2€/mois</div>
                                <p className="text-gray-600 text-sm">
                                    Facturation automatique basée sur le nombre d'étudiants inscrits dans votre école
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="text-center">
                                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Automatique</h3>
                                <div className="text-lg font-bold text-purple-600 mb-2">Mise à jour auto</div>
                                <p className="text-gray-600 text-sm">
                                    Le montant s'ajuste automatiquement quand de nouveaux étudiants rejoignent votre école
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-white rounded-lg border-l-4 border-green-500">
                        <h4 className="font-semibold text-gray-900 mb-2">💡 Exemple de calcul :</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                            <div>• École avec 50 étudiants : 120€/an + (50 × 2€ × 12 mois) = <strong>1 320€/an</strong></div>
                            <div>• École avec 100 étudiants : 120€/an + (100 × 2€ × 12 mois) = <strong>2 520€/an</strong></div>
                            <div className="text-green-600 font-medium mt-2">✓ Facturation transparente et équitable pour toutes les tailles d'établissements</div>
                        </div>
                    </div>
                </div>

                {/* Section avantages */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Pourquoi choisir TeamBrains ?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Interface intuitive</h3>
                            <p className="text-gray-600">
                                Une interface moderne et facile à utiliser, conçue spécialement pour les étudiants
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Collaboration optimale</h3>
                            <p className="text-gray-600">
                                Travaillez en équipe efficacement avec des outils de collaboration avancés
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Sécurité garantie</h3>
                            <p className="text-gray-600">
                                Vos données sont protégées avec les plus hauts standards de sécurité
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ rapide */}
                <div className="bg-gray-50 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Questions fréquentes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Puis-je changer de plan ?</h3>
                            <p className="text-gray-600">
                                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre compte.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Y a-t-il une période d'essai ?</h3>
                            <p className="text-gray-600">
                                Oui, tous nos plans incluent une période d'essai gratuite de 14 jours.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Le paiement est-il sécurisé ?</h3>
                            <p className="text-gray-600">
                                Absolument, nous utilisons Stripe pour traiter tous les paiements de manière sécurisée.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Support technique inclus ?</h3>
                            <p className="text-gray-600">
                                Oui, le support technique est inclus dans tous nos plans avec des niveaux de priorité différents.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                    <p className="text-gray-500">
                        Des questions ? Contactez-nous à{' '}
                        <a href="mailto:support@teambrains.com" className="text-blue-600 hover:underline">
                            support@teambrains.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
        </>
    );
};

export default PricingPage; 