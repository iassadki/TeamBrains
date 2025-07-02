import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserProfile from '../UserProfile';

const SchoolDashboard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [schoolData, setSchoolData] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [stats, setStats] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsPagination, setStudentsPagination] = useState(null);
    const [studentsSearch, setStudentsSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [showUpdateStudentCount, setShowUpdateStudentCount] = useState(false);
    const [newStudentCount, setNewStudentCount] = useState('');
    const [showCreateToken, setShowCreateToken] = useState(false);
    const [tokenForm, setTokenForm] = useState({
        name: '',
        description: '',
        uses_limit: '',
        expires_at: ''
    });
    const [showCVModal, setShowCVModal] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Vérifier si on arrive du paiement
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    // Gestion de la touche Escape pour fermer le modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showCVModal) {
                setShowCVModal(false);
                setSelectedStudentId(null);
            }
        };

        if (showCVModal) {
            document.addEventListener('keydown', handleEscape);
            // Empêcher le scroll de la page quand le modal est ouvert
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [showCVModal]);

    useEffect(() => {
        loadDashboardData();
        if (success === 'true') {
            console.log('Paiement réussi détecté, session_id:', sessionId);
            // Afficher une notification de succès pendant 10 secondes pour avoir le temps de synchroniser
            setTimeout(() => {
                navigate('/partenariat-ecole/dashboard', { replace: true });
            }, 10000);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'students') {
            loadStudents(1, studentsSearch);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'students') {
            const timeoutId = setTimeout(() => {
                loadStudents(1, studentsSearch);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [studentsSearch]);

    const loadDashboardData = async () => {
        try {
                    const token = localStorage.getItem('partnershipToken');
        if (!token) {
            navigate('/partenariat-ecole/connexion');
            return;
        }

            // Charger le statut de l'abonnement
            const subResponse = await fetch('http://localhost:5001/api/partnership/stripe/subscription/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (subResponse.ok) {
                const subData = await subResponse.json();
                setSubscription(subData.subscription);
                setSchoolData(subData.school);
            }

            // Charger les statistiques
            const statsResponse = await fetch('http://localhost:5001/api/partnership/school/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

            // Charger les tokens
            await loadTokens();

        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTokens = async () => {
        try {
            const token = localStorage.getItem('partnershipToken');
            const response = await fetch('http://localhost:5001/api/partnership/school/registration-tokens', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTokens(data.tokens || []);
            }
        } catch (error) {
            console.error('Erreur chargement tokens:', error);
        }
    };

    const createToken = async () => {
        try {
            const token = localStorage.getItem('partnershipToken');
            const payload = {
                name: tokenForm.name
            };
            
            if (tokenForm.description) {
                payload.description = tokenForm.description;
            }
            if (tokenForm.uses_limit) {
                payload.max_uses = parseInt(tokenForm.uses_limit);
            }
            if (tokenForm.expires_at) {
                payload.expires_at = tokenForm.expires_at;
            }

            const response = await fetch('http://localhost:5001/api/partnership/school/registration-tokens', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await loadTokens();
                setShowCreateToken(false);
                setTokenForm({ name: '', description: '', uses_limit: '', expires_at: '' });
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error('Erreur création token:', error);
            alert('Erreur lors de la création du token');
        }
    };

    const deleteToken = async (tokenId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce token ?')) return;

        try {
            const token = localStorage.getItem('partnershipToken');
            const response = await fetch(`http://localhost:5001/api/partnership/school/registration-tokens/${tokenId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                await loadTokens();
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error('Erreur suppression token:', error);
            alert('Erreur lors de la suppression du token');
        }
    };

    const loadStudents = async (page = 1, search = '') => {
        setStudentsLoading(true);
        try {
            const token = localStorage.getItem('partnershipToken');
            const response = await fetch(`http://localhost:5001/api/partnership/school/students?page=${page}&search=${search}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
                setStudentsPagination(data.pagination);
            }
        } catch (error) {
            console.error('Erreur chargement étudiants:', error);
        } finally {
            setStudentsLoading(false);
        }
    };

    const updateStudentCount = async () => {
        try {
            const token = localStorage.getItem('partnershipToken');
            const response = await fetch('http://localhost:5001/api/partnership/stripe/subscription/update-student-count', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ student_count: parseInt(newStudentCount) })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Abonnement mis à jour ! Nouveau coût mensuel : ${data.monthly_amount_euros}€`);
                await loadDashboardData(); // Recharger les données
                setShowUpdateStudentCount(false);
                setNewStudentCount('');
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error('Erreur mise à jour abonnement:', error);
            alert('Erreur lors de la mise à jour de l\'abonnement');
        }
    };

    const syncSubscription = async () => {
        const sessionId = new URLSearchParams(window.location.search).get('session_id');
        if (!sessionId) {
            alert('Aucun ID de session trouvé. Cette action n\'est disponible qu\'après un paiement.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/partnership/stripe/test/sync-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('partnershipToken')}`
                },
                body: JSON.stringify({ session_id: sessionId })
            });

            if (response.ok) {
                alert('Synchronisation réussie ! Rechargement des données...');
                loadDashboardData();
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la synchronisation');
        }
    };

    const forceSyncAllSubscriptions = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/stripe/force-sync-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('partnershipToken')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                console.log('🔄 Synchronisation complète réussie:', data);
                
                // Afficher un message détaillé
                if (data.synced_subscriptions.length > 0) {
                    alert(`✅ Synchronisation réussie!\n\n${data.message}\n\nAbonnements synchronisés : ${data.synced_subscriptions.length}\nEmail : ${data.user_email}\nRôle : ${data.user_role}`);
                } else {
                    alert('✅ Synchronisation terminée - Aucun nouvel abonnement trouvé');
                }
                
                // Recharger les données
                loadDashboardData();
            } else {
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la synchronisation forcée');
        }
    };

    const createSubscription = async () => {
        const studentCount = prompt('Combien d\'étudiants voulez-vous inclure dans votre abonnement ?', '10');
        
        if (!studentCount || isNaN(studentCount) || parseInt(studentCount) < 1) {
            alert('Veuillez entrer un nombre valide d\'étudiants (minimum 1)');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/partnership/stripe/create-school-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('partnershipToken')}`
                },
                body: JSON.stringify({
                    student_count: parseInt(studentCount)
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Rediriger vers Stripe Checkout
                window.location.href = data.checkout_url;
            } else {
                if (data.msg === 'Token has expired' || response.status === 401) {
                    alert('Votre session a expiré. Veuillez vous reconnecter.');
                    localStorage.removeItem('partnershipToken');
                    navigate('/partenariat-ecole/connexion');
                } else {
                    alert(`Erreur: ${data.error || data.msg}`);
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la création de l\'abonnement');
        }
    };

    const openBillingPortal = async () => {
        try {
            const token = localStorage.getItem('partnershipToken');
            const response = await fetch('http://localhost:5001/api/partnership/stripe/create-billing-portal', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Ouvrir le portail dans un nouvel onglet
                window.open(data.url, '_blank');
            } else {
                if (data.msg === 'Token has expired' || response.status === 401) {
                    alert('Votre session a expiré. Veuillez vous reconnecter.');
                    localStorage.removeItem('partnershipToken');
                    navigate('/partenariat-ecole/connexion');
                } else {
                    alert(`Erreur: ${data.error || data.msg}`);
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ouverture du portail de facturation');
        }
    };

    const logout = () => {
        localStorage.removeItem('partnershipToken');
        navigate('/partenariat-ecole');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification de succès paiement */}
            {success === 'true' && (
                <div className="bg-green-500 text-white p-4 text-center">
                    <div>✅ Paiement réussi ! Votre abonnement TeamBrains est maintenant actif.</div>
                    {sessionId && (
                        <div className="text-sm mt-1">
                            Session ID: {sessionId} - Dirigez-vous vers l'onglet "Abonnement" pour synchroniser si nécessaire.
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <img src="/src/assets/logo_teambrains.svg" alt="TeamBrains" className="h-8" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Dashboard - {schoolData?.name}
                                </h1>
                                <p className="text-sm text-gray-500">Espace Partenariat École</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {subscription && (
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        subscription.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {subscription.status === 'active' ? 'Actif' : subscription.status}
                                    </span>
                                    <span className="text-gray-600">
                                        {subscription.current_student_count} étudiants
                                    </span>
                                </div>
                            )}
                            <button 
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'overview', label: 'Vue d\'ensemble' },
                            { id: 'tokens', label: 'Tokens d\'inscription' },
                            { id: 'students', label: 'Étudiants' },
                            { id: 'subscription', label: 'Abonnement' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Statistiques */}
                        {stats && (
                            <>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Étudiants inscrits</h3>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_students}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Tokens actifs</h3>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.active_tokens}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Coût mensuel</h3>
                                    <p className="text-3xl font-bold text-purple-600 mt-2">
                                        {subscription ? `${(subscription.total_monthly_amount / 100).toFixed(2)}€` : '0€'}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-900">Projets créés</h3>
                                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.total_projects}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'tokens' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Tokens d'inscription</h2>
                            <button
                                onClick={() => setShowCreateToken(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Créer un token
                            </button>
                        </div>

                        {/* Formulaire création token */}
                        {showCreateToken && (
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau token d'inscription</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom du token *
                                        </label>
                                        <input
                                            type="text"
                                            value={tokenForm.name}
                                            onChange={(e) => setTokenForm({...tokenForm, name: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Ex: Promotion 2024, Classe A..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description (optionnel)
                                        </label>
                                        <textarea
                                            value={tokenForm.description}
                                            onChange={(e) => setTokenForm({...tokenForm, description: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            placeholder="Description du token..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Limite d'utilisations (optionnel)
                                            </label>
                                            <input
                                                type="number"
                                                value={tokenForm.uses_limit}
                                                onChange={(e) => setTokenForm({...tokenForm, uses_limit: e.target.value})}
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                placeholder="Illimité"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Date d'expiration (optionnel)
                                            </label>
                                            <input
                                                type="date"
                                                value={tokenForm.expires_at}
                                                onChange={(e) => setTokenForm({...tokenForm, expires_at: e.target.value})}
                                                className="w-full p-3 border border-gray-300 rounded-lg"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex space-x-3">
                                    <button
                                        onClick={createToken}
                                        disabled={!tokenForm.name.trim()}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Créer
                                    </button>
                                    <button
                                        onClick={() => setShowCreateToken(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Liste des tokens */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Tokens existants</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {tokens.map(token => (
                                    <div key={token.id} className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-blue-100 px-3 py-1 rounded text-lg font-mono font-bold text-blue-800">
                                                            {token.token}
                                                        </code>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            token.can_be_used 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {token.can_be_used ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </div>
                                                    <div className="font-medium text-gray-900">
                                                        📋 {token.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                {token.current_uses}/{token.max_uses || '∞'} utilisations
                                                {token.expires_at && (
                                                    <span className="ml-3">
                                                        • Expire le {new Date(token.expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {token.description && (
                                                    <div className="mt-1 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                                        💬 {token.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteToken(token.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ))}
                                {tokens.length === 0 && (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        Aucun token d'inscription créé
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="space-y-6">
                        {/* Header avec recherche */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">Étudiants inscrits</h3>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="text"
                                        placeholder="Rechercher un étudiant..."
                                        value={studentsSearch}
                                        onChange={(e) => setStudentsSearch(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    {studentsPagination && (
                                        <span className="text-sm text-gray-500">
                                            {studentsPagination.total} étudiant{studentsPagination.total > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Liste des étudiants */}
                            <div className="divide-y divide-gray-200">
                                {studentsLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-500">Chargement...</p>
                                    </div>
                                ) : students.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        {studentsSearch ? 'Aucun étudiant trouvé pour cette recherche' : 'Aucun étudiant inscrit'}
                                    </div>
                                ) : (
                                    students.map(student => (
                                        <div key={student.id} className="px-6 py-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 font-medium text-sm">
                                                                    {student.prenom[0]}{student.nom[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {student.prenom} {student.nom}
                                                            </h4>
                                                            <p className="text-sm text-gray-500">{student.email}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        {student.formation && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                                {student.formation}
                                                            </span>
                                                        )}
                                                        {student.niveau_etudes && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                                                {student.niveau_etudes}
                                                            </span>
                                                        )}
                                                        {student.project_count > 0 && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                                                {student.project_count} projet{student.project_count > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {student.technologies && student.technologies.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {student.technologies.slice(0, 3).map((tech, index) => (
                                                                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                            {student.technologies.length > 3 && (
                                                                <span className="text-xs text-gray-500">
                                                                    +{student.technologies.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStudentId(student.id);
                                                            setShowCVModal(true);
                                                        }}
                                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center space-x-1"
                                                        title="Consulter le CV (lecture seule)"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span>CV</span>
                                                    </button>
                                                    
                                                    <div className="flex space-x-1">
                                                        {student.linkedin_url && (
                                                            <a
                                                                href={student.linkedin_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="LinkedIn"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                        {student.github_url && (
                                                            <a
                                                                href={student.github_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-600 hover:text-gray-800 p-1"
                                                                title="GitHub"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                        {student.portfolio_url && (
                                                            <a
                                                                href={student.portfolio_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:text-green-800 p-1"
                                                                title="Portfolio"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {studentsPagination && studentsPagination.pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Page {studentsPagination.page} sur {studentsPagination.pages}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => loadStudents(studentsPagination.page - 1, studentsSearch)}
                                            disabled={!studentsPagination.has_prev}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Précédent
                                        </button>
                                        <button
                                            onClick={() => loadStudents(studentsPagination.page + 1, studentsSearch)}
                                            disabled={!studentsPagination.has_next}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <div className="space-y-6">
                        {subscription ? (
                            <>
                                {/* Vue d'ensemble de l'abonnement */}
                                <div className="bg-white rounded-lg shadow">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Détails de l'abonnement</h3>
                                    </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-4">Informations générales</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Statut:</span>
                                                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                                                    subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {subscription.status === 'active' ? 'Actif' : subscription.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Nombre d'étudiants:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{subscription.current_student_count}</span>
                                                    <button
                                                        onClick={() => {
                                                            setNewStudentCount(subscription.current_student_count.toString());
                                                            setShowUpdateStudentCount(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                    >
                                                        Modifier
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Prix par étudiant:</span>
                                                <span className="font-medium">5,00€/mois</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total mensuel:</span>
                                                <span className="font-medium text-blue-600 text-lg">
                                                    {(subscription.total_monthly_amount / 100).toFixed(2)}€
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total annuel estimé:</span>
                                                <span className="font-medium text-gray-900">
                                                    {((subscription.total_monthly_amount * 12) / 100).toFixed(2)}€
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-4">Période de facturation</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Début:</span>
                                                <span className="font-medium">
                                                    {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Fin:</span>
                                                <span className="font-medium">
                                                    {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Prochaine facturation:</span>
                                                <span className="font-medium">
                                                    {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            {subscription.last_student_count_update && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Dernière mise à jour:</span>
                                                    <span className="font-medium">
                                                        {new Date(subscription.last_student_count_update).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulaire de mise à jour du nombre d'étudiants */}
                        {showUpdateStudentCount && (
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Mettre à jour le nombre d'étudiants</h3>
                                </div>
                                <div className="p-6">
                                    <div className="max-w-md">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nouveau nombre d'étudiants
                                        </label>
                                        <input
                                            type="number"
                                            value={newStudentCount}
                                            onChange={(e) => setNewStudentCount(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                            min="1"
                                            required
                                        />
                                        <p className="mt-2 text-sm text-gray-500">
                                            Nouveau coût mensuel: {newStudentCount ? (parseInt(newStudentCount) * 5).toFixed(2) : '0.00'}€
                                        </p>
                                    </div>
                                    <div className="mt-4 flex space-x-3">
                                        <button
                                            onClick={updateStudentCount}
                                            disabled={!newStudentCount || parseInt(newStudentCount) < 1}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Mettre à jour
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowUpdateStudentCount(false);
                                                setNewStudentCount('');
                                            }}
                                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">
                                                    Information importante
                                                </h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <p>
                                                        La modification sera appliquée immédiatement et une facturation 
                                                        proportionnelle sera effectuée selon les conditions de Stripe.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Informations supplémentaires */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Avantages du plan */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Avantages inclus</h3>
                                </div>
                                <div className="p-6">
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Accès illimité à la plateforme TeamBrains
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Création de projets collaboratifs
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Système de validation des tâches
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Génération de CV automatique
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Dashboard administrateur école
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Support technique prioritaire
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Actions rapides */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Actions rapides</h3>
                                </div>
                                <div className="p-6 space-y-3">
                                    <button
                                        onClick={() => {
                                            const actualStudentCount = stats?.total_students || 0;
                                            if (actualStudentCount !== subscription.current_student_count) {
                                                setNewStudentCount(actualStudentCount.toString());
                                                setShowUpdateStudentCount(true);
                                            } else {
                                                alert('Le nombre d\'étudiants est déjà à jour !');
                                            }
                                        }}
                                        className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Synchroniser les étudiants</h4>
                                                <p className="text-sm text-gray-500">
                                                    Mettre à jour avec le nombre réel d'étudiants ({stats?.total_students || 0})
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => window.open('https://billing.stripe.com/p/login/test_00w5kw8Jz39tc8b2kd0x200', '_blank')}
                                        className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Gérer la facturation</h4>
                                                <p className="text-sm text-gray-500">
                                                    Accéder au portail de facturation Stripe
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('tokens')}
                                        className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Gérer les tokens</h4>
                                                <p className="text-sm text-gray-500">
                                                    Créer et gérer les codes d'inscription
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Bouton de synchronisation forcée - accessible tout le temps */}
                                    <button
                                        onClick={forceSyncAllSubscriptions}
                                        className="w-full text-left px-4 py-3 border border-purple-300 bg-purple-50 rounded-lg hover:bg-purple-100"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-purple-900">🔄 Synchronisation forcée</h4>
                                                <p className="text-sm text-purple-700">
                                                    Forcer la synchronisation avec Stripe (résout les problèmes de paiement)
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Bouton de synchronisation (visible seulement après un paiement) */}
                                    {new URLSearchParams(window.location.search).get('session_id') && (
                                        <button
                                            onClick={syncSubscription}
                                            className="w-full text-left px-4 py-3 border border-orange-300 bg-orange-50 rounded-lg hover:bg-orange-100"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-orange-900">🔄 Synchroniser l'abonnement</h4>
                                                    <p className="text-sm text-orange-700">
                                                        Si votre abonnement n'apparaît pas, cliquez ici
                                                    </p>
                                                </div>
                                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                            </>
                        ) : (
                            // Pas d'abonnement - Afficher un message informatif
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Abonnement</h3>
                                </div>
                                <div className="p-6 text-center">
                                    <div className="max-w-md mx-auto">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Aucun abonnement actif
                                        </h3>
                                        <p className="text-gray-500 mb-6">
                                            Votre école n'a pas encore d'abonnement actif. Créez un abonnement pour commencer à utiliser la plateforme TeamBrains avec vos étudiants.
                                        </p>
                                        <div className="space-y-3">
                                            <button
                                                onClick={createSubscription}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                                            >
                                                Créer un abonnement
                                            </button>
                                            
                                            {/* Bouton de synchronisation forcée */}
                                            <button
                                                onClick={forceSyncAllSubscriptions}
                                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium"
                                            >
                                                🔄 Synchronisation forcée
                                            </button>

                                            {/* Bouton de synchronisation si paiement effectué */}
                                            {new URLSearchParams(window.location.search).get('session_id') && (
                                                <button
                                                    onClick={syncSubscription}
                                                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
                                                >
                                                    🔄 Synchroniser l'abonnement
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal CV */}
            {showCVModal && selectedStudentId && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCVModal(false);
                            setSelectedStudentId(null);
                        }
                    }}
                >
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header du modal */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Profil et CV de l'étudiant
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCVModal(false);
                                    setSelectedStudentId(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Bandeau lecture seule */}
                        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-blue-700 font-medium">
                                    Mode consultation - Profil en lecture seule
                                </span>
                            </div>
                        </div>

                        {/* Contenu du modal */}
                        <div className="flex-1 overflow-y-auto">
                            <UserProfile userId={selectedStudentId} isModal={true} isSchoolView={true} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolDashboard; 