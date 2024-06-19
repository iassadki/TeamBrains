import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import StepFour from './StepFour';

const SignUp = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: '',
    });

    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);

    const nextStep = () => {
        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handleChange = (input) => (value) => {
        const newValue = value.target ? value.target.value : value;
        setFormData({ ...formData, [input]: newValue });
      };
      

      const submitForm = () => {
        axios.post('http://localhost:5001/auth/signup', { // Utilisez le bon endpoint ici
            data: { // Assurez-vous d'encapsuler vos données dans un objet `data` comme attendu par votre backend
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                typeDeveloppeur: formData.typeDeveloppeur,
                technologies: formData.technologies
                // Ajoutez d'autres champs si nécessaire, comme `typeDeveloppeur` et `technologies`
            }
        })
        .then(function (response) {
            localStorage.setItem('accessToken', response.data.accessToken); // Stockez l'accessToken
            
            window.location.href = '/'; // Redirection
        })
        .catch(function (error) {
            console.error(error);
            setErrorMessage("Une erreur est survenue lors de l'inscription."); // Vous devriez définir `setErrorMessage` dans votre composant si ce n'est pas déjà fait
        });
    };
    
    

    switch (step) {
        case 1:
            return <StepOne nextStep={nextStep} handleChange={handleChange} values={formData} />;
        case 2:
            return <StepTwo nextStep={nextStep} prevStep={prevStep} handleChange={handleChange} values={formData} submitForm={submitForm}/>;
        case 3:
            return <StepThree prevStep={prevStep} nextStep={nextStep} handleChange={handleChange} values={formData} />;
        case 4:
            return <StepFour prevStep={prevStep} nextStep={nextStep} handleChange={handleChange} values={formData} submitForm={submitForm}/>;
        default:
            return <div>Erreur: Étape inconnue</div>;
    }
};

export default SignUp;
