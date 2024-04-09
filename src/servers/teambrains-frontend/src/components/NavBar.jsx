import React, {useState, useEffect, useRef} from 'react';
import { NavLink } from 'react-router-dom';
import logo from "../assets/logo_teambrains.svg";
import { CircleUserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import SignIn from './SignIn';
import SignUp from './Signup/Signup';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

    const { currentUser, logout } = useAuth();
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log(currentUser)
        const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
          }
        };
      
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [dropdownRef]);

      const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
    };

    return (
        <nav className="bg-white p-4 fixed w-full z-10 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center">
                    <NavLink to="/">
                        <img src={logo} alt="Logo" className="h-12 w-32 mr-2"/>
                    </NavLink>
                </div>
                <div className="flex-1 mx-4">
                    <input type="text" placeholder="Rechercher..." className="text-xs w-full p-2 rounded bg-gray-100"/>
                </div>
                <div className="flex items-center">
                    <NavLink to="/" className={({ isActive }) => isActive ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium" : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"}>Accueil</NavLink>
                    <NavLink to="/projets" className={({ isActive }) => isActive ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium" : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"}>Projets</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => isActive ? "text-green-tb px-4 py-2 rounded-md text-sm font-medium" : "text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium"}>Contact</NavLink>
                    {currentUser ? (
                    <div ref={dropdownRef} className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium">
                            <CircleUserRound />
                            <span className="ml-2">{`${currentUser.prenom} ${currentUser.nom}`}</span>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                                <NavLink to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profil</NavLink>
                                <button onClick={handleLogout} className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">Déconnexion</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button onClick={() => setIsSignInModalOpen(true)} className="text-gray-700 hover:text-green-tb px-4 py-2 rounded-md text-sm font-medium">
                            Se connecter
                        </button>
                        <button onClick={() => setIsSignUpModalOpen(true)} className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-600">
                            S'inscrire
                        </button>

                    </>
                )}
                </div>
            </div>
            <Modal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} width="max-w-xl">
                <SignIn onSuccessfulLogin={() => setIsSignInModalOpen(false)} />
            </Modal>


            <Modal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} width="max-w-4xl">
                <SignUp />
            </Modal>


        </nav>
    );
};

export default NavBar;
