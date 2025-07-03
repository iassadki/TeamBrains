import React, { useState, useEffect } from 'react';

const StepTwo = ({ nextStep, prevStep, handleChange, values, submitForm, personType, schoolData }) => {

  const [errorMessage, setErrorMessage] = useState('');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return minLength && hasUpperCase && hasLowerCase && hasSpecialChar;
  };

  const handleSubmit = () => {
    if (!values.nom || !values.prenom || !values.email || !values.password) {
      setErrorMessage('Veuillez remplir tous les champs');
      return false;
    } else if (!validatePassword(values.password)) {
      setErrorMessage('Le mot de passe n\'est pas valide');
      return false;
    } else {
      setErrorMessage('');
      if (values.role === 'student') {
        nextStep();
      } else {
        submitForm();
      }
      return true;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-28">
      <div className="w-full max-w-xl">
        <form className="bg-white border border-gray-200 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
          <h3 className="mb-4">
            <span className="text-xl font-bold">Inscription</span>
            {values.role === 'student' && (
              <span className='ml-2 rounded p-1 bg-gray-200 text-xs'>ÉTAPE 1/3</span>
            )}
          </h3>
          
          {schoolData && schoolData.school && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">🎓 Inscription via école partenaire</h4>
              <p className="text-sm text-blue-700">École : {schoolData.school.name}</p>
              {schoolData.school.description && (
                <p className="text-xs text-blue-600 mt-1">{schoolData.school.description}</p>
              )}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}
          
          <div className="flex mb-4">
            <div className="mr-2 w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nom
              </label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                type="text" 
                placeholder="Nom" 
                value={values.nom || ''} 
                onChange={handleChange('nom')} 
              />
            </div>
            <div className="ml-2 w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Prénom
              </label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                type="text" 
                placeholder="Prénom" 
                value={values.prenom || ''} 
                onChange={handleChange('prenom')} 
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              type="email" 
              placeholder="Email" 
              value={values.email || ''} 
              onChange={handleChange('email')} 
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mot de passe
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              type="password" 
              placeholder="Mot de passe" 
              value={values.password || ''} 
              onChange={handleChange('password')} 
            />
            <p className="text-xs text-gray-500 mt-1">
              Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 caractère spécial
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button 
              className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300" 
              type="button" 
              onClick={prevStep}
            >
              Retour
            </button>
            {values.role === 'student' ? (
              <button 
                className="mt-4 bg-green-tb text-white py-2 px-4 rounded hover:bg-green-600" 
                type="button" 
                onClick={handleSubmit}
              >
                Suivant
              </button>
            ) : (
              <button 
                className="mt-4 bg-green-tb text-white py-2 px-4 rounded hover:bg-green-600" 
                type="button" 
                onClick={handleSubmit}
              >
                Inscription
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StepTwo;