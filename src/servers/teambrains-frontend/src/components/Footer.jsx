import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white">
            <div className="container mx-auto px-6 pt-10 pb-6">
                <div className="flex flex-wrap text-left">
                    <div className="w-full sm:w-1/2 md:w-1/4 p-5">
                        <h3 className="text-xl mb-5 font-bold">Navigation</h3>
                        <ul>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100">Home</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100">Projets</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100">Contact</a></li>
                        </ul>
                    </div>
                    <div className="w-full sm:w-1/2 md:w-1/4 p-5">
                        <h3 className="text-xl mb-5 font-bold">Contact</h3>
                        <ul>
                            <li><a href="mailto:contact@teambrains.com" className="text-gray-300 hover:text-gray-100">Email: contact@teambrains.com</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100">Téléphone: +33 1 23 45 67 89</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-gray-100">Adresse: 123 Rue Exemple, 75001 Paris</a></li>
                        </ul>
                    </div>
                    {/* Ajoutez d'autres colonnes ici si nécessaire */}
                </div>

                <div className="border-t border-gray-500 text-center pt-5">
                    <p className="small">© {new Date().getFullYear()} TeamBrains. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
