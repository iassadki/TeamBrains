import React from 'react';

const Modal = ({ isOpen, children, onClose, width = 'max-w-lg' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className={`relative bg-white p-4 rounded-lg shadow-lg w-full ${width}`}>
                <button onClick={onClose} className="absolute top-0 right-0 p-4 text-3xl leading-none text-gray-700 hover:text-gray-900">&times;</button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
