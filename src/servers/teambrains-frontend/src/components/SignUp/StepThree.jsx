import React, { useState, useEffect } from 'react';

const StepThree = ({ nextStep, prevStep, handleChange, values, schoolData }) => {
    const [error, setError] = useState(''); // Ajoutez un état pour l'erreur
    const typesDeDeveloppeur = ["FrontEnd", "BackEnd", "FullStack", "Designer"];

    const handleNextStep = () => {
        if (!values.typeDeveloppeur) {
            setError('Veuillez sélectionner un profil pour continuer.');
        } else {
            setError('');
            nextStep();
        }
    };

    return (
        <div className="flex flex-col items-center py-40">
            <div className="w-full max-w-xl">
                <div className="bg-white border border-gray-200  shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <h3 className="mb-6"><span className="text-xl font-bold">Quel est votre profil ?</span><span className='ml-2 rounded p-1 bg-gray-200 text-xs'>ÉTAPE 2/3</span></h3>
                    
                    {schoolData && schoolData.school && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">🎓 École : {schoolData.school.name}</p>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 mb-2">{error}</p>} {/* Affiche l'erreur ici */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {typesDeDeveloppeur.map((type, index) => (
                            <div key={index}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleChange('typeDeveloppeur')({ target: { value: type } });
                                        setError(''); // Efface l'erreur lorsqu'une sélection est faite
                                    }}
                                    className={`w-full text-left px-4 py-2 border rounded ${values.typeDeveloppeur === type ? 'bg-green-500 text-white' : 'bg-white'}`}
                                >
                                    {type}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300" onClick={prevStep}>Retour</button>
                        <button className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600" onClick={handleNextStep}>Suivant</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepThree;
