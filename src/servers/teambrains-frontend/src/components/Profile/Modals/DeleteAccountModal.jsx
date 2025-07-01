import React from 'react';

const DeleteAccountModal = ({
    isOpen,
    deletePassword,
    setDeletePassword,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Confirmer la suppression du compte
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Cette action supprimera définitivement vos données personnelles. Si vous participez
                                    à des projets, votre profil sera anonymisé. Pour confirmer, veuillez entrer votre mot de passe.
                                </p>
                                <div className="mt-4">
                                    <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700">
                                        Mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        id="delete-password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm px-3 py-2"
                                        placeholder="Entrez votre mot de passe"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                        >
                            Supprimer définitivement
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;