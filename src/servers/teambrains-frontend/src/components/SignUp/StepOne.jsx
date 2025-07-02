import React, { useState } from 'react';
import student from "../../assets/character-student.svg";
import entrepreneur from "../../assets/character-entrepreneur.svg";

const StepOne = ({ nextStep, handleChange, values }) => {

    const [error, setError] = useState('');

    // Vérifier si on vient d'une inscription école
    const schoolData = JSON.parse(localStorage.getItem('schoolRegistrationData') || 'null');
    
    const handleNextStep = () => {
        if (!values.role) {
            setError('Veuillez sélectionner un type avant de continuer.');
        } else {
            setError('');
            nextStep();
        }
    };

    // Si on vient d'une école, passer automatiquement à la suite
    React.useEffect(() => {
        if (schoolData && schoolData.isFromSchool && values.role === 'student') {
            nextStep();
        }
    }, [values.role, schoolData]);

    return (
        <div className="flex justify-center py-14">
            <div className="text-center">
                {schoolData && schoolData.school && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                        <h4 className="font-medium text-blue-900">🎓 Inscription via école partenaire</h4>
                        <p className="text-sm text-blue-700">École : {schoolData.school.name}</p>
                        <p className="text-xs text-blue-600 mt-1">Redirection automatique vers l'inscription étudiant...</p>
                    </div>
                )}
                
                <h3 className="text-xl mb-8">Quel type de personne êtes-vous ?</h3>

                <div className="flex flex-col md:flex-row justify-center gap-4">
                    <div className="w-full md:w-72 card">
                        <label className={`block p-6 bg-white border shadow rounded cursor-pointer ${values.role === 'student' ? 'ring-4 ring-green-tb' : ''}`}>
                            <img src={student} alt="Étudiant" className="h-40 w-40 md:h-56 md:w-56 mx-auto" />
                            <h4 className="text-lg font-bold mt-2">Étudiant</h4>
                            <p className="text-sm">Challengez vous et acquérez de l'expérience en travaillant en équipe sur des projets concrets et réels.</p>
                            <input type="radio" name="role" value="student" onChange={handleChange('role')} checked={values.role === 'student'} className="hidden" />
                        </label>
                    </div>

                    <div className="w-full md:w-72 card">
                        <label className={`block p-6 bg-white border shadow rounded cursor-pointer ${values.role === 'businessman' ? 'ring-4 ring-green-tb' : ''}`}>
                            <img src={entrepreneur} alt="Entrepreneur" className="h-40 w-40 md:h-56 md:w-56 mx-auto" />
                            <h4 className="text-lg font-bold mt-2">Entrepreneur</h4>
                            <p className="text-sm">Donnez vie à vos idées sans vous ruiner. Nos développeurs juniors vous aident à démarrer votre projet.</p>
                            <input type="radio" name="role" value="businessman" onChange={handleChange('role')} checked={values.role === 'businessman'} className="hidden" />
                        </label>
                    </div>
                </div>

                {error && <p className="pt-4 text-red-500">{error}</p>}

                <button onClick={handleNextStep} className="mt-4 bg-green-tb text-white py-2 px-4 rounded hover:bg-green-600">Suivant</button>
            </div>
        </div>
    );
};

export default StepOne;