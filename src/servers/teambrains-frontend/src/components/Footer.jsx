import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white">
            <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-4 sm:pb-6">
                {/* Conteneur flex pour les colonnes du footer - centré sur mobile, aligné à gauche sur tablette et desktop */}
                <div className="flex flex-wrap text-center sm:text-left">
                    {/* Colonne Navigation - centré sur mobile, aligné à gauche sur les écrans plus grands */}
                    <div className="w-full sm:w-1/2 md:w-1/4 p-4 sm:p-5 flex flex-col items-center sm:items-start">
                        <h3 className="text-lg sm:text-xl mb-3 sm:mb-5 font-bold">Navigation</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Accueil</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Projets</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Colonne Contact - centré sur mobile, aligné à gauche sur les écrans plus grands */}
                    <div className="w-full sm:w-1/2 md:w-1/4 p-4 sm:p-5 flex flex-col items-center sm:items-start">
                        <h3 className="text-lg sm:text-xl mb-3 sm:mb-5 font-bold">Contact</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="mailto:contact@teambrains.com"
                                    className="text-gray-300 hover:text-gray-100 transition-colors flex flex-col sm:flex-row items-center sm:items-start"
                                >
                                    <span className="font-medium sm:mr-1">Email:</span>
                                    <span className="break-all">contact@teambrains.com</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+33123456789"
                                    className="text-gray-300 hover:text-gray-100 transition-colors flex flex-col sm:flex-row items-center sm:items-start"
                                >
                                    <span className="font-medium sm:mr-1">Téléphone:</span>
                                    <span>+33 1 01 02 03 04</span>
                                </a>
                            </li>
                            <li className="text-gray-300 flex flex-col sm:flex-row items-center sm:items-start">
                                <span className="font-medium sm:mr-1">Adresse:</span>
                                <span>123 Rue Exemple, 75001 Paris</span>
                            </li>
                        </ul>
                    </div>

                    {/* Colonne Services - centré sur mobile, aligné à gauche sur les écrans plus grands */}
                    <div className="w-full sm:w-1/2 md:w-1/4 p-4 sm:p-5 flex flex-col items-center sm:items-start">
                        <h3 className="text-lg sm:text-xl mb-3 sm:mb-5 font-bold">Services</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Développement Web</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Applications Mobiles</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Prototypes IoT</a></li>
                        </ul>
                    </div>

                    {/* Colonne Légal - centré sur mobile, aligné à gauche sur les écrans plus grands */}
                    <div className="w-full sm:w-1/2 md:w-1/4 p-4 sm:p-5 flex flex-col items-center sm:items-start">
                        <h3 className="text-lg sm:text-xl mb-3 sm:mb-5 font-bold">Légal</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Mentions légales</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">Politique de confidentialité</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100 transition-colors">CGU</a></li>
                        </ul>
                    </div>
                </div>

                {/* Séparateur et copyright - toujours centré */}
                <div className="border-t border-gray-500 text-center pt-4 sm:pt-5 mt-4 sm:mt-6">
                    <p className="text-sm text-gray-400">© {new Date().getFullYear()} TeamBrains. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;