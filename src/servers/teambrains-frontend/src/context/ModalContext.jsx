import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    // États pour gérer les modaux
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

    // Fonctions pour gérer les modaux
    const openSignInModal = () => {
        setIsSignUpModalOpen(false);
        setIsSignInModalOpen(true);
    };

    const openSignUpModal = () => {
        setIsSignInModalOpen(false);
        setIsSignUpModalOpen(true);
    };

    const closeModals = () => {
        setIsSignInModalOpen(false);
        setIsSignUpModalOpen(false);
    };

    const value = {
        isSignInModalOpen,
        isSignUpModalOpen,
        openSignInModal,
        openSignUpModal,
        closeModals
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}; 