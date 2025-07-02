import React from 'react';

const TechnicalSkillsSection = ({ userInfo, setUserInfo, isEditable, handleSelectTech }) => {
    const technologies = {
        FrontEnd: ["HTML", "CSS", "JavaScript", "React", "Vue"],
        BackEnd: ["Node.js", "Python", "Java", "PHP", "Ruby", "MongoDB", "SQL"],
        FullStack: ["HTML", "CSS", "JavaScript", "Node.js", "React", "MongoDB", "SQL", "Ruby", "PHP", "Java", "Python", "Vue"],
        Designer: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
    };

    const techsToDisplay = technologies[userInfo?.typeDeveloppeur] || [];

    // Ne pas afficher si userInfo n'est pas chargé OU n'a pas de rôle OU est businessman
    if (!userInfo || !userInfo.role || userInfo.role === 'businessman') {
        return null;
    }

    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Compétences Techniques</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de développeur</label>
                {isEditable ? (
                    <select
                        value={userInfo.typeDeveloppeur}
                        onChange={(e) => setUserInfo({ ...userInfo, typeDeveloppeur: e.target.value })}
                        className="mb-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
                    >
                        <option value="FrontEnd">FrontEnd</option>
                        <option value="BackEnd">BackEnd</option>
                        <option value="FullStack">FullStack</option>
                        <option value="Designer">Designer</option>
                    </select>
                ) : (
                    <p className="mb-4 text-gray-700 font-medium">{userInfo.typeDeveloppeur}</p>
                )}

                <div className="flex flex-wrap gap-2">
                    {techsToDisplay.map((tech, index) => (
                        <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${userInfo.technologies.includes(tech)
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } ${isEditable ? 'hover:shadow-md' : 'cursor-default'}`}
                            onClick={() => handleSelectTech(tech)}
                        >
                            {tech}
                        </span>
                    ))}
                </div>
                {isEditable && (
                    <p className="text-sm text-gray-500 mt-2">
                        Cliquez sur les technologies pour les ajouter ou les supprimer.
                    </p>
                )}
            </div>
        </div>
    );
};

export default TechnicalSkillsSection;