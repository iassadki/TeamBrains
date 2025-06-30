import React, { useState } from 'react';
import { Check, Users, GraduationCap, Star, Shield, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PricingPage = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState('');



    
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
            badge: 'Recommandé'
        }
    ];

    const handlePlanSelect = async (planId) => {
        if (!token) {
            setError('Vous devez être connecté pour souscrire à un plan');
            return;
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
                    plan_type: planId
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
                        Plan TeamBrains Étudiant
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        La solution de gestion de projets conçue spécialement pour les étudiants. 
                        Collaborez, apprenez et réussissez vos projets académiques !
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



                {/* Carte de tarification */}
                <div className="max-w-md mx-auto mb-12">
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



                {/* Section École */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl shadow-lg p-8 mb-12">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            🏫 Vous êtes une école ?
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Découvrez notre espace partenariat dédié aux établissements d'enseignement 
                            avec des tarifs préférentiels et des fonctionnalités adaptées à vos besoins.
                        </p>
                        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                            <a 
                                href="/partenariat-ecole" 
                                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
                            >
                                Découvrir l'espace école
                            </a>
                            <div className="text-sm text-gray-500">
                                Tarif : 5€/étudiant/mois
                            </div>
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