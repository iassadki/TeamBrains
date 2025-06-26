import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Calendar, CreditCard, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';

const SubscriptionStatus = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(false);
    const [updatePaymentLoading, setUpdatePaymentLoading] = useState(false);
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

    const handleRetryPayment = async () => {
        setRetryLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5001/api/stripe/retry-payment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Tentative de paiement lancée. Vérifiez votre email pour les instructions.');
                fetchSubscriptionStatus(); // Recharger les données
            } else {
                setError(data.error || 'Erreur lors de la relance du paiement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setRetryLoading(false);
        }
    };

    const handleUpdatePaymentMethod = async () => {
        setUpdatePaymentLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5001/api/stripe/update-payment-method', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success_url: `${window.location.origin}/dashboard/subscription?updated=true`,
                    cancel_url: `${window.location.origin}/dashboard/subscription`
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Rediriger vers Stripe pour mettre à jour le moyen de paiement
                window.location.href = data.checkout_url;
            } else {
                setError(data.error || 'Erreur lors de la création de la session');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setUpdatePaymentLoading(false);
        }
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

            {/* Alertes de paiement */}
            {subscription.has_payment_issues && (
                <div className="mb-6">
                    {/* Échec de paiement */}
                    {subscription.payment_failed_count > 0 && (
                        <div className={`p-4 rounded-lg border-l-4 mb-4 ${
                            subscription.payment_failed_count >= 3 
                                ? 'bg-red-50 border-red-400' 
                                : 'bg-yellow-50 border-yellow-400'
                        }`}>
                            <div className="flex items-start">
                                <AlertCircle className={`w-5 h-5 mt-0.5 mr-3 ${
                                    subscription.payment_failed_count >= 3 
                                        ? 'text-red-500' 
                                        : 'text-yellow-500'
                                }`} />
                                <div className="flex-1">
                                    <h3 className={`text-sm font-medium ${
                                        subscription.payment_failed_count >= 3 
                                            ? 'text-red-800' 
                                            : 'text-yellow-800'
                                    }`}>
                                        {subscription.payment_failed_count >= 3 
                                            ? '⚠️ Abonnement suspendu - Action requise'
                                            : '⚠️ Échec de paiement détecté'
                                        }
                                    </h3>
                                    <p className={`text-sm mt-1 ${
                                        subscription.payment_failed_count >= 3 
                                            ? 'text-red-700' 
                                            : 'text-yellow-700'
                                    }`}>
                                        {subscription.payment_failed_count >= 3 
                                            ? `Votre abonnement a été suspendu après ${subscription.payment_failed_count} tentatives de paiement échouées. Veuillez mettre à jour votre moyen de paiement ou relancer le paiement pour rétablir l'accès.`
                                            : `${subscription.payment_failed_count} tentative(s) de paiement échouée(s). ${subscription.last_payment_failed_at ? `Dernière tentative: ${formatDate(subscription.last_payment_failed_at)}` : ''}`
                                        }
                                    </p>
                                    <div className="mt-3 flex space-x-3">
                                        <button
                                            onClick={handleRetryPayment}
                                            disabled={retryLoading}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                                        >
                                            {retryLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Relance...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Relancer le paiement
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleUpdatePaymentMethod}
                                            disabled={updatePaymentLoading}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        >
                                            {updatePaymentLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Redirection...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Mettre à jour la carte
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action requise (3D Secure, etc.) */}
                    {subscription.payment_method_action_required && (
                        <div className="p-4 rounded-lg border-l-4 bg-blue-50 border-blue-400">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 mt-0.5 mr-3 text-blue-500" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        🔐 Action requise pour votre paiement
                                    </h3>
                                    <p className="text-sm mt-1 text-blue-700">
                                        Votre banque demande une authentification supplémentaire (3D Secure) pour valider le paiement. 
                                        Cliquez sur "Relancer le paiement" pour compléter l'authentification.
                                    </p>
                                    <div className="mt-3">
                                        <button
                                            onClick={handleRetryPayment}
                                            disabled={retryLoading}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                                        >
                                            {retryLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Authentification...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Compléter l'authentification
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

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