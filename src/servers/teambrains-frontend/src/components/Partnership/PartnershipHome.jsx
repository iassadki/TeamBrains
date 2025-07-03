import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, School, Users, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';

const PartnershipHome = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Navigation simplifiée */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                TeamBrains <span className="text-blue-600">Partenariat</span>
                            </h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/partenariat-ecole/connexion"
                                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Se connecter
                            </Link>
                            <Link
                                to="/partenariat-ecole/inscription"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Devenir partenaire
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-8">
                        <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                            <School className="w-4 h-4 mr-2" />
                            Espace dédié aux écoles informatiques
                        </span>
                    </div>
                    
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Partenariat
                        <span className="text-blue-600 block">Écoles Informatiques</span>
                    </h1>
                    
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Offrez à vos étudiants l'accès à TeamBrains avec notre abonnement école simplifié. 
                        Gérez facilement les inscriptions et garantissez l'authenticité de vos étudiants.
                    </p>

                    {/* Pricing highlight */}
                    <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg mb-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold">5€</div>
                            <div className="text-sm opacity-90">par étudiant/mois</div>
                        </div>
                        <div className="ml-6 pl-6 border-l border-white/20">
                            <div className="text-lg font-semibold">Tarification simple</div>
                            <div className="text-sm opacity-90">Pas de frais cachés</div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/partenariat-ecole/inscription"
                            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            Inscrire votre école
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        
                        <Link
                            to="/partenariat-ecole/inscription-etudiant"
                            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg border-2 border-blue-600"
                        >
                            <Users className="w-5 h-5 mr-2" />
                            Inscription étudiant
                        </Link>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-blue-100 text-sm">
                            Déjà partenaire ? 
                            <Link
                                to="/partenariat-ecole/connexion"
                                className="font-medium text-white hover:text-blue-100 underline ml-1"
                            >
                                Accédez à votre dashboard
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Pourquoi choisir notre partenariat ?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Une solution complète et sécurisée pour intégrer vos étudiants à l'écosystème TeamBrains
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="text-center p-8 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-6">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Authentification garantie
                            </h3>
                            <p className="text-gray-600">
                                Codes d'inscription uniques pour chaque école. 
                                Vos étudiants sont authentifiés et liés à votre établissement.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="text-center p-8 rounded-2xl bg-green-50 hover:bg-green-100 transition-colors">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-6">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Gestion simplifiée
                            </h3>
                            <p className="text-gray-600">
                                Tableau de bord dédié pour générer des codes, 
                                suivre les inscriptions et gérer votre abonnement.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="text-center p-8 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mb-6">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Tarification transparente
                            </h3>
                            <p className="text-gray-600">
                                5€ par étudiant et par mois. 
                                Facturé mensuellement selon votre nombre d'étudiants actifs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Comment ça marche ?
                        </h2>
                        <p className="text-lg text-gray-600">
                            Processus simple en 3 étapes pour intégrer votre école
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="relative">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Inscription école
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Inscrivez votre école et souscrivez à l'abonnement selon votre nombre d'étudiants.
                                </p>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                                    <span className="text-sm text-gray-700">Abonnement mensuel flexible</span>
                                </div>
                            </div>
                            {/* Arrow */}
                            <div className="hidden md:block absolute top-6 -right-4 text-blue-300">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-full text-xl font-bold mb-4">
                                    2
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Génération des codes
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Créez des codes d'inscription pour vos promotions ou classes via votre tableau de bord.
                                </p>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                                    <span className="text-sm text-gray-700">Codes personnalisés et sécurisés</span>
                                </div>
                            </div>
                            {/* Arrow */}
                            <div className="hidden md:block absolute top-6 -right-4 text-green-300">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full text-xl font-bold mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                Inscription étudiants
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Vos étudiants s'inscrivent avec leur code et accèdent immédiatement à TeamBrains.
                            </p>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                                <span className="text-sm text-gray-700">Accès instantané à la plateforme</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">
                        Prêt à devenir partenaire ?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Rejoignez les écoles qui font confiance à TeamBrains pour former la prochaine génération de développeurs.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/partenariat-ecole/inscription"
                            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                        >
                            Inscrire votre école maintenant
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                    </div>
                    
                    <div className="mt-8 text-blue-100 text-sm">
                        Questions ? Contactez-nous à <span className="font-medium">partenariat@teambrains.fr</span>
                    </div>
                </div>
            </section>

            {/* Footer simple */}
            <footer className="bg-white border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <GraduationCap className="w-6 h-6 text-blue-600 mr-2" />
                            <span className="text-gray-600">© 2024 TeamBrains Partenariat</span>
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-600">
                            <Link to="/" className="hover:text-blue-600">
                                Retour au site principal
                            </Link>
                            <a href="mailto:partenariat@teambrains.fr" className="hover:text-blue-600">
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PartnershipHome; 