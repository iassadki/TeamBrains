import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignIn = ({ onSuccessfulLogin, openSignUpModal }) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const isValidEmail = email => 
        /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setErrorMessage('Tous les champs doivent être remplis.');
        } else if (!isValidEmail(email)) {
            setErrorMessage('Veuillez entrer une adresse email valide.');
        } else {
            setErrorMessage('');
            fetch('http://localhost:5001/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data) {
                    login(data.accessToken);
                    onSuccessfulLogin();
                    // localStorage.setItem('idUser', data.id)
                    // localStorage.setItem('emailUser', data.email)
                    navigate('/');
                } else {
                    setErrorMessage(data.message || 'Une erreur est survenue.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                setErrorMessage('Une erreur est survenue lors de la connexion.');
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="m-auto w-full max-w-lg p-4 sm:p-20">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-semibold">Connexion</h1>
                    <p className="text-sm">Connectez-vous pour accéder à votre compte</p>
                </div>
                <div className="form-group">
                    <div className="form-field">
                        <label className="form-label">Email</label>
                        <input 
                            placeholder="nom@email.com" 
                            type="email" 
                            className="input max-w-full" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Mot de passe</label>
                        <div className="form-control">
                            <input 
                                placeholder="**************" 
                                type="password" 
                                className="input max-w-full" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-field">
                        <div className="form-control justify-between">
                            <label className="form-label">
                                <a className="link link-underline-hover link-primary text-sm">Mot de passe oublié ?</a>
                            </label>
                        </div>
                    </div>
                    <div className="form-field pt-5">
                        {errorMessage && <div className="text-sm mb-2 text-red-500">{errorMessage}</div>}
                        <div className="form-control justify-between">
                            <button type="submit" className="btn btn-primary w-full">Connexion</button>
                        </div>
                    </div>

                    <div className="form-field">
                        <div className="form-control justify-center">
                            <a 
                                className="link link-underline-hover link-primary text-sm cursor-pointer" 
                                onClick={openSignUpModal}
                            >
                                Vous n'avez pas encore de compte ? S'inscrire.
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default SignIn;