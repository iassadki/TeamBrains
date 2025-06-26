import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Key, Users, FileText, Plus, Copy, Check, X } from 'lucide-react';
import StudentList from './StudentList';
import CVViewer from './CVViewer';
import TokenGenerator from './TokenGenerator';
import DashboardStats from './DashboardStats';

const SchoolDashboard = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [schoolData, setSchoolData] = useState(null);
    const [students, setStudents] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schoolToken, setSchoolToken] = useState(localStorage.getItem('schoolToken') || '');

    useEffect(() => {
        if (schoolToken) {
            fetchSchoolData();
        } else {
            setLoading(false);
        }
    }, [schoolToken]);

    const fetchSchoolData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5001/api/ecole/students', {
                headers: {
                    'Authorization': `Bearer ${schoolToken}`
                }
            });
            
            setSchoolData(response.data.school);
            setStudents(response.data.students);
            setError(null);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            setError(error.response?.data?.error || 'Erreur lors de la récupération des données');
            
            // Si le token est invalide, le supprimer
            if (error.response?.status === 401) {
                localStorage.removeItem('schoolToken');
                setSchoolToken('');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTokenSubmit = (token) => {
        setSchoolToken(token);
        localStorage.setItem('schoolToken', token);
    };

    const handleLogout = () => {
        setSchoolToken('');
        localStorage.removeItem('schoolToken');
        setSchoolData(null);
        setStudents([]);
        setSelectedStudent(null);
    };

    const viewStudentCV = async (studentId) => {
        try {
            const response = await axios.get(`http://localhost:5001/api/ecole/student/${studentId}/cv`, {
                headers: {
                    'Authorization': `Bearer ${schoolToken}`
                }
            });
            setSelectedStudent(response.data);
            setActiveTab('cv');
        } catch (error) {
            console.error('Erreur lors de la récupération du CV:', error);
            alert('Erreur lors de la récupération du CV de l\'étudiant');
        }
    };

    // Interface de connexion avec token
    if (!schoolToken) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <Key className="mx-auto h-12 w-12 text-green-600 mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900">Espace École</h1>
                        <p className="text-gray-600 mt-2">
                            Accédez aux données de vos étudiants avec votre token d'accès
                        </p>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const token = e.target.token.value.trim();
                        if (token) {
                            handleTokenSubmit(token);
                        }
                    }}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Token d'accès école
                            </label>
                            <input
                                type="text"
                                name="token"
                                placeholder="Entrez votre token d'accès"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                        >
                            Se connecter
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Besoin d'un token ?</h3>
                        <p className="text-sm text-blue-800">
                            Contactez l'administrateur TeamBrains pour obtenir un token d'accès pour votre école.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des données...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <X className="mx-auto h-12 w-12 text-red-600 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Erreur d'accès</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                    >
                        Réessayer avec un autre token
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* En-tête */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {schoolData?.name}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Tableau de bord école • {students.length} étudiants
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'stats'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="inline h-4 w-4 mr-2" />
                            Statistiques
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'students'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="inline h-4 w-4 mr-2" />
                            Étudiants
                        </button>
                        {selectedStudent && (
                            <button
                                onClick={() => setActiveTab('cv')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'cv'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FileText className="inline h-4 w-4 mr-2" />
                                CV - {selectedStudent.student.prenom} {selectedStudent.student.nom}
                            </button>
                        )}
                    </nav>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'stats' && (
                    <DashboardStats 
                        schoolData={schoolData}
                        students={students}
                    />
                )}
                
                {activeTab === 'students' && (
                    <StudentList 
                        students={students}
                        onViewCV={viewStudentCV}
                    />
                )}
                
                {activeTab === 'cv' && selectedStudent && (
                    <CVViewer 
                        studentData={selectedStudent}
                        onBack={() => setActiveTab('students')}
                    />
                )}
            </div>
        </div>
    );
};

export default SchoolDashboard;