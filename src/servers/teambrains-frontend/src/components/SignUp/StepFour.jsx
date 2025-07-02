import React, { useState, useEffect } from 'react';

const StepFour = ({ prevStep, handleChange, values, submitForm, schoolData }) => {
    const technologies = {
      FrontEnd: ["HTML", "CSS", "JavaScript", "React", "Vue"],
      BackEnd: ["Node.js", "Python", "Java", "PHP", "Ruby", "MongoDB", "SQL"],
      FullStack: ["HTML", "CSS", "JavaScript", "Node.js", "React", "MongoDB", "SQL", "Ruby", "PHP", "Java", "Python", "Vue"],
      Designer: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
    };
  
    const [selectedTechs, setSelectedTechs] = useState([]);
    const [error, setError] = useState('');

    const handleSelectTech = (tech) => {
        const newSelectedTechs = selectedTechs.includes(tech)
          ? selectedTechs.filter(t => t !== tech)
          : [...selectedTechs, tech];
        setSelectedTechs(newSelectedTechs);
        handleChange('technologies')(newSelectedTechs);
        // Effacer le message d'erreur si l'utilisateur a sélectionné au moins une technologie
        if (newSelectedTechs.length > 0) {
          setError('');
        }
    };
    
    const handleSubmit = () => {
      if (selectedTechs.length === 0) {
        setError('Veuillez sélectionner au moins une technologie');
        return;
      }
      submitForm();
    };
      
    const techsToDisplay = technologies[values.typeDeveloppeur] || [];
  
    return (
      <div className="flex flex-col items-center py-40">
        <div className="w-full max-w-xl">
          <div className="bg-white border border-gray-200 shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h3 className="mb-6"><span className="text-xl font-bold">Quelles sont vos skills ?</span><span className='ml-2 rounded p-1 bg-gray-200 text-xs'>ÉTAPE 3/3</span></h3>
            
            {schoolData && schoolData.school && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">🎓 École : {schoolData.school.name}</p>
              </div>
            )}
            
            {error && (
              <div className="mb-4 text-red-500 font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              {techsToDisplay.map((tech, index) => (
                <div key={index} 
                  className={`p-4 border rounded shadow cursor-pointer ${selectedTechs.includes(tech) ? 'bg-green-500 text-white' : 'bg-white'}`}
                  onClick={() => handleSelectTech(tech)}>
                  <div className="text-center">
                    {tech}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300" onClick={prevStep}>Retour</button>
              <button className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600" onClick={handleSubmit}>Inscription</button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default StepFour;