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
    const [schoolData, setSchoolData] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        
        // Vérifier si on vient d'une inscription via école
        const savedSchoolData = localStorage.getItem('schoolRegistrationData');
        if (savedSchoolData) {
            const schoolInfo = JSON.parse(savedSchoolData);
            setSchoolData(schoolInfo);
            setFormData(prev => ({ ...prev, role: 'student' }));
            setStep(2); // Aller directement à StepTwo
        }
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
        // Si on vient d'une école, utiliser l'endpoint de liaison école
        if (schoolData && schoolData.isFromSchool) {
            const payload = {
                token: schoolData.token,
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                password: formData.password,
                typeDeveloppeur: formData.typeDeveloppeur,
                technologies: formData.technologies
            };

            axios.post('http://localhost:5001/api/partnership/student/register', payload)
                .then(function (response) {
                    localStorage.setItem('accessToken', response.data.access_token);
                    // Nettoyer les données temporaires
                    localStorage.removeItem('schoolRegistrationData');
                    window.location.href = '/';
                })
                .catch(function (error) {
                    console.error(error);
                    alert(error.response?.data?.error || "Une erreur est survenue lors de l'inscription.");
                });
        } else {
            // Inscription normale
            axios.post('http://localhost:5001/auth/signup', {
                data: {
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    typeDeveloppeur: formData.typeDeveloppeur,
                    technologies: formData.technologies
            }
        })
        .then(function (response) {
                localStorage.setItem('accessToken', response.data.accessToken);
                window.location.href = '/';
        })
        .catch(function (error) {
            console.error(error);
                alert("Une erreur est survenue lors de l'inscription.");
        });
        }
    };
    
    

    switch (step) {
        case 1:
            return <StepOne nextStep={nextStep} handleChange={handleChange} values={formData} />;
        case 2:
            return <StepTwo nextStep={nextStep} prevStep={prevStep} handleChange={handleChange} values={formData} submitForm={submitForm} schoolData={schoolData}/>;
        case 3:
            return <StepThree prevStep={prevStep} nextStep={nextStep} handleChange={handleChange} values={formData} schoolData={schoolData}/>;
        case 4:
            return <StepFour prevStep={prevStep} nextStep={nextStep} handleChange={handleChange} values={formData} submitForm={submitForm} schoolData={schoolData}/>;
        default:
            return <div>Erreur: Étape inconnue</div>;
    }
};

export default SignUp;
