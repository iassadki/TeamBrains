import React from 'react';

const ProfileHeader = ({ userInfo, cvProfile, isEditable, onEdit, displayRole }) => {
    return (
        <div className="border-b-2 border-green-600 pb-6 mb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        {userInfo.prenom} {userInfo.nom}
                    </h1>
                    <p className="text-xl text-green-600 font-semibold mb-2">
                        {displayRole(userInfo.role)} {userInfo.typeDeveloppeur && `• ${userInfo.typeDeveloppeur}`}
                    </p>
                    <p className="text-gray-600">{userInfo.email}</p>

                    {/* Liens sociaux */}
                    <div className="flex space-x-4 mt-3">
                        {cvProfile.linkedin_url && (
                            <a
                                href={cvProfile.linkedin_url.startsWith('http') ? cvProfile.linkedin_url : `https://${cvProfile.linkedin_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                LinkedIn
                            </a>
                        )}
                        {cvProfile.portfolio_url && (
                            <a
                                href={cvProfile.portfolio_url.startsWith('http') ? cvProfile.portfolio_url : `https://${cvProfile.portfolio_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                            >
                                Portfolio
                            </a>
                        )}
                        {cvProfile.github_url && (
                            <a
                                href={cvProfile.github_url.startsWith('http') ? cvProfile.github_url : `https://${cvProfile.github_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-800 hover:text-gray-600 transition-colors"
                            >
                                GitHub
                            </a>
                        )}
                    </div>
                </div>

                {!isEditable && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        Modifier le CV
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileHeader;