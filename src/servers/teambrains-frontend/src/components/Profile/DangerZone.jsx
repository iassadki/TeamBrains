import React from 'react';

const DangerZone = ({ isEditable, onShowDeleteModal }) => {
    if (isEditable) return null;

    return (
        <div className="mt-12 pt-8 border-t border-red-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-lg font-medium text-red-800">Zone de danger</h3>
                        <p className="mt-2 text-sm text-red-700">
                            La suppression de votre compte est irréversible. Vos données personnelles et informations
                            de CV seront définitivement supprimées. Si vous participez à des projets collaboratifs,
                            votre profil sera anonymisé pour préserver l'intégrité des projets conformément au RGPD.
                        </p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={onShowDeleteModal}
                                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer mon compte
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DangerZone;