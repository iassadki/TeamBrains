import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';



const CreateProjectForm = ({ closeModal }) => {
    const [project, setProject] = useState({
        name: '',
        status: '',
        description: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setProject({ ...project, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setProject({ ...project, endDate: date });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/projects/create_projects', project, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // Incluez votre token JWT ici
                }
            });
            navigate('/projets'); // Redirigez l'utilisateur vers la page des projets après la création
        } catch (error) {
            console.error('Erreur lors de la création du projet:', error);
        }
    };

    const handleCancel = () => {
        navigate('/projets');
    };

    return (
        <form onSubmit={handleSubmit} className="w-full p-14">
            <div className="flex flex-col">
                <h1 className="text-3xl font-semibold">Créer un nouveau projet</h1>
                <p className="text-sm">Partagez les détails de votre projet</p>
            </div>
            <div className="mt-8 flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Nom du projet</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={project.name}
                        onChange={handleChange}
                    />
                </div>
                <div className="w-full md:w-1/3 px-3">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">État</label>
                    <select
                        id="status"
                        name="status"
                        required
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={project.status}
                        onChange={handleChange}
                    >
                        <option value="">Sélectionnez l'état du projet</option>
                        <option value="commencé">Commencé</option>
                        <option value="en cours">En cours</option>
                    </select>
                </div>
                <div className="w-full md:w-1/3 px-3">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end_date">Date de fin de projet</label>
    <DatePicker
        selected={project.endDate}
        onChange={handleDateChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        wrapperClassName="w-full" // Assurez-vous que le wrapper prend toute la largeur
    />
</div>

            </div>

            <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    rows="4"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={project.description}
                    onChange={handleChange}
                ></textarea>
            </div>
            <div className="flex items-center justify-between mt-4">
                <button type="button" onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Annuler
                </button>
                <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
                    Créer le projet
                </button>
            </div>
        </form>
    );
};

export default CreateProjectForm;

