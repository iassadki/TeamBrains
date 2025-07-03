import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import logo from "../assets/logo_teambrains.svg";
import { CircleUserRound, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

const NavBar = () => {
    const { openSignInModal, openSignUpModal, closeModals } = useModal();
    // États pour gérer les différents éléments interactifs
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const { currentUser, logout } = useAuth();
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log(currentUser);
        // Fonction pour fermer les menus lors d'un clic à l'extérieur
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
                !event.target.classList.contains('mobile-menu-button')) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef, mobileMenuRef]);

    // Gérer la déconnexion de l'utilisateur
    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    // Basculer l'état du menu mobile
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Basculer l'état de la barre de recherche mobile
    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    return (
        <nav className="bg-white p-4 fixed w-full z-20 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo - visible sur toutes les tailles d'écran */}
                <div className="flex items-center">
                    <NavLink to="/">
                        <img src={logo} alt="Logo" className="h-10 w-28 sm:h-12 sm:w-32 mr-2" />
                    </NavLink>
                </div>

                {/* Barre de recherche - visible uniquement sur les écrans moyens et grands */}
                <div className="hidden md:flex flex-1 mx-4">
                    <GlobalSearch />
                </div>

                {/* Liens de navigation - visibles sur les écrans moyens et grands */}
                <div className="hidden md:flex items-center">
                    <NavLink to="/" className={({ isActive }) =>
                        isActive
                            ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                    }>
                        Accueil
                    </NavLink>
                    <NavLink to="/projets" className={({ isActive }) =>
                        isActive
                            ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                    }>
                        Projets
                    </NavLink>
                    <NavLink to="/contact" className={({ isActive }) =>
                        isActive
                            ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                    }>
                        Contact
                    </NavLink>

                    {currentUser ? (
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            >
                                <CircleUserRound />
                                <span className="ml-2">{`${currentUser.prenom} ${currentUser.nom}`}</span>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                                    <NavLink to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Profil
                                    </NavLink>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    {currentUser.role === "admin" && (
                                        <>
                                            <div className="border-t border-gray-100 my-1"></div>
                                        <NavLink to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            Admin
                                        </NavLink>
                                        </>
                                    )}
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={openSignInModal}
                                className="text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Se connecter
                            </button>
                            <button
                                onClick={openSignUpModal}
                                className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-600"
                            >
                                S'inscrire
                            </button>
                        </>
                    )}
                </div>

                {/* Boutons mobiles (recherche et menu) */}
                <div className="md:hidden flex items-center space-x-1">
                    <button
                        onClick={toggleSearch}
                        className="p-2 text-gray-700 hover:text-green-tb"
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={toggleMobileMenu}
                        className="mobile-menu-button p-2 text-gray-700 hover:text-green-tb"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Barre de recherche mobile - affichée conditionnellement */}
            {isSearchOpen && (
                <div className="md:hidden pt-2 pb-2 px-4">
                    <GlobalSearch isMobile={true} onClose={() => setIsSearchOpen(false)} />
                </div>
            )}

            {/* Menu mobile - affiché conditionnellement */}
            {isMobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="md:hidden bg-white pt-2 pb-4 px-4 shadow-inner"
                >
                    <div className="flex flex-col space-y-2">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                isActive
                                    ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                    : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Accueil
                        </NavLink>
                        <NavLink
                            to="/projets"
                            className={({ isActive }) =>
                                isActive
                                    ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                    : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Projets
                        </NavLink>
                        <NavLink
                            to="/contact"
                            className={({ isActive }) =>
                                isActive
                                    ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                    : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Contact
                        </NavLink>

                        {currentUser ? (
                            <>
                                <NavLink
                                    to="/profile"
                                    className="text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profil
                                </NavLink>
                                {currentUser.role === "admin" && (
                                    <NavLink
                                        to="/admin"
                                        className="text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Admin
                                    </NavLink>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-left text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Déconnexion
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        openSignInModal();
                                    }}
                                    className="text-left text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Se connecter
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        openSignUpModal();
                                    }}
                                    className="text-left bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600"
                                >
                                    S'inscrire
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavBar;