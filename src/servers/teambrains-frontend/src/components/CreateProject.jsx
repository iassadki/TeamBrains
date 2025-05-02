import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateProjectForm = ({ closeModal }) => {
    const [errorMessage, setErrorMessage] = useState('');

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
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            navigate('/projets');
        } catch (error) {
            if (error.response && error.response.data) {
                toast.error(error.response.data.error || 'Une erreur est survenue lors de la création du projet.');
            } else {
                toast.error('Une erreur est survenue lors de la communication avec le serveur.');
            }
            console.error('Erreur lors de la création du projet:', error);
        }
    };

    const handleCancel = () => {
        navigate('/projets');
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <form onSubmit={handleSubmit} className="w-full p-4 sm:p-8 md:p-14">
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-semibold">Créer un nouveau projet</h1>
                    <p className="text-sm">Partagez les détails de votre projet</p>
                </div>
                <div className="mt-6 sm:mt-8 flex flex-wrap -mx-3 mb-6">
                    <div className="w-full sm:w-1/2 md:w-1/3 px-3 mb-6 md:mb-0">
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
                    <div className="w-full sm:w-1/2 md:w-1/3 px-3 mb-6 md:mb-0">
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
                            <option value="not_started">Pas commencé</option>
                            <option value="in_progress">En cours</option>
                        </select>
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
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-4 gap-4 sm:gap-0">
                    <button type="button" onClick={handleCancel} className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Annuler
                    </button>
                    <button type="submit" className="w-full sm:w-auto bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
                        Créer le projet
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateProjectForm;