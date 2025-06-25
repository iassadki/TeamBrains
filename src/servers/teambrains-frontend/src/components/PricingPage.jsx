import React from 'react';
import { Check, Users, GraduationCap, Star, Shield, Zap } from 'lucide-react';

const PricingPage = () => {
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
            name: 'Plan École',
            description: 'Solution complète pour les établissements scolaires',
            price: '120€',
            period: '/an',
            annually: '10€ par mois',
            icon: <Users className="w-8 h-8 text-green-600" />,
            color: 'green',
            stripeUrl: 'https://buy.stripe.com/test_dRm7sE7Fv11l8VZ2kd0x201',
            features: [
                'Utilisateurs illimités',
                'Projets illimités',
                'Tableau de bord administrateur',
                'Gestion avancée des utilisateurs',
                'Rapports et analyses détaillés',
                'Support prioritaire 24/7',
                'Formation et onboarding',
                'API et intégrations',
                'Stockage étendu',
                'Sauvegardes automatiques'
            ],
            badge: 'Recommandé'
        }
    ];

    const handlePlanSelect = (stripeUrl) => {
        window.open(stripeUrl, '_blank');
    };

    return (
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
                </div>

                {/* Cartes de tarification */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
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
                                    </div>

                                    {/* Bouton d'action */}
                                    <button
                                        onClick={() => handlePlanSelect(plan.stripeUrl)}
                                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                                            plan.color === 'green'
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        } hover:shadow-lg hover:scale-105`}
                                    >
                                        Choisir ce plan
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
    );
};

export default PricingPage; 