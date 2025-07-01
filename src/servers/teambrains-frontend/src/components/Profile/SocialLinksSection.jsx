import React from 'react';

const SocialLinksSection = ({ cvProfile, handleUrlChange, isEditable }) => {
    const LinkField = ({ label, value, field, placeholder }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    https://
                </span>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUrlChange(field, e.target.value)}
                    disabled={!isEditable}
                    placeholder={placeholder}
                    className={`flex-1 rounded-none rounded-r-md border-gray-300 ${isEditable
                            ? "focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            : "bg-gray-100"
                        } px-3 py-2`}
                />
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Liens</h2>
            <div className="space-y-3">
                <LinkField
                    label="LinkedIn"
                    value={cvProfile.linkedin_url}
                    field="linkedin_url"
                    placeholder="linkedin.com/in/votre-profil"
                />
                <LinkField
                    label="Portfolio"
                    value={cvProfile.portfolio_url}
                    field="portfolio_url"
                    placeholder="votre-portfolio.com"
                />
                <LinkField
                    label="GitHub"
                    value={cvProfile.github_url}
                    field="github_url"
                    placeholder="github.com/votre-username"
                />
            </div>
        </div>
    );
};

export default SocialLinksSection;