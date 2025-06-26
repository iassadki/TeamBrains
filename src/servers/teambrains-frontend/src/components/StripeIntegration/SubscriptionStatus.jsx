import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Calendar, CreditCard, AlertCircle, Loader2 } from 'lucide-react';

const SubscriptionStatus = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchSubscriptionStatus();
        }
    }, [token]);

    const fetchSubscriptionStatus = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/stripe/subscription/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setSubscription(data.has_subscription ? data.subscription : null);
            } else {
                setError(data.error || 'Erreur lors du chargement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
            return;
        }

        setCancelLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/stripe/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Abonnement annulé avec succès');
                fetchSubscriptionStatus(); // Recharger les données
            } else {
                setError(data.error || 'Erreur lors de l\'annulation');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setCancelLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'canceled': return 'text-red-600 bg-red-100';
            case 'past_due': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'canceled': return 'Annulé';
            case 'past_due': return 'En retard';
            case 'incomplete': return 'Incomplet';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement de votre abonnement...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center text-red-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucun abonnement actif
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Vous n'avez pas encore d'abonnement TeamBrains.
                    </p>
                    <a
                        href="/tarifs"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Voir les plans
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mon Abonnement</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations du plan */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Détails du plan
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                {subscription.plan_type === 'student' ? (
                                    <Check className="w-5 h-5 text-blue-600 mr-2" />
                                ) : (
                                    <Check className="w-5 h-5 text-green-600 mr-2" />
                                )}
                                <span className="font-medium">
                                    Plan {subscription.plan_type === 'student' ? 'Étudiant' : 'École'}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm">
                                {subscription.plan_type === 'student' 
                                    ? '2€/mois - Parfait pour les étudiants individuels'
                                    : '120€/an - Solution complète pour les établissements'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Dates importantes */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Dates importantes
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center text-sm">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">Début de période:</span>
                                <span className="ml-2 font-medium">
                                    {formatDate(subscription.current_period_start)}
                                </span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">Fin de période:</span>
                                <span className="ml-2 font-medium">
                                    {formatDate(subscription.current_period_end)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Actions
                        </h3>
                        <div className="space-y-3">
                            <a
                                href="/dashboard/invoices"
                                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Voir mes factures
                            </a>
                            
                            {subscription.status === 'active' && (
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={cancelLoading}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                                >
                                    {cancelLoading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Annulation...
                                        </div>
                                    ) : (
                                        'Annuler l\'abonnement'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Informations Stripe */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Informations techniques</h4>
                        <div className="text-xs text-gray-500 space-y-1">
                            <div>ID: {subscription.stripe_subscription_id.slice(0, 20)}...</div>
                            <div>Créé le: {formatDate(subscription.created_at)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionStatus;