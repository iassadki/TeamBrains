import React, { useState, useEffect } from 'react';

const StepTwo = ({ nextStep, prevStep, handleChange, values, submitForm }) => {

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = () => {
    if (!values.nom || !values.prenom || !values.email || !values.password) {
      setErrorMessage('Tous les champs doivent être remplis.');
    } else {
      setErrorMessage('');
      if (values.role === 'student') {
        nextStep();
      } else {
        submitForm();
      }
    }
  };

    return (
        <div className="flex flex-col items-center justify-center py-28">
        <div className="w-full max-w-xl">
            <form className="bg-white border border-gray-200 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
            <h3 className="mb-4"><span className="text-xl font-bold">Inscription</span><span className='ml-2 rounded p-1 bg-gray-200 text-xs'>ÉTAPE 1/3</span></h3>
            <div className="flex mb-4">
                <div className="mr-2 w-1/2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nom
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Nom" onChange={handleChange('nom')} />
                </div>
                <div className="ml-2 w-1/2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Prénom
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Prénom" onChange={handleChange('prenom')} />
                </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="email" placeholder="Email" onChange={handleChange('email')} />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Mot de passe
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="password" placeholder="Mot de passe" onChange={handleChange('password')} />
            </div>

            <div className="flex items-center justify-between">
            <button className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300" type="button" onClick={prevStep}>
                Retour
            </button>
            {values.role === 'student' ? (
                <button className="mt-4 bg-green-tb text-white py-2 px-4 rounded hover:bg-green-600" type="button" onClick={nextStep}>
                Suivant
                </button>
            ) : (
                <button className="mt-4 bg-green-tb text-white py-2 px-4 rounded hover:bg-green-600" type="button" onClick={submitForm}>
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
  