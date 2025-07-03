import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptionAutoSync } from '../../hooks/useAutoSync';
import { Check, X, Calendar, CreditCard, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';

const SubscriptionStatus = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(false);
    const [updatePaymentLoading, setUpdatePaymentLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [error, setError] = useState('');
    const [diagnosticData, setDiagnosticData] = useState(null);
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    
    // Synchronisation automatique
    const { syncNow } = useSubscriptionAutoSync((syncData) => {
        if (syncData.status_changed) {
            console.log('🔄 Abonnement synchronisé automatiquement');
            fetchSubscriptionStatus();
        }
    });

    useEffect(() => {
        if (token) {
            fetchSubscriptionStatus();
        }
    }, [token]);

    // Synchronisation automatique au chargement si aucun abonnement actif
    useEffect(() => {
        const autoSync = async () => {
            if (subscription === null && !loading) {
                console.log('🔄 Aucun abonnement actif détecté - Tentative de synchronisation automatique...');
                try {
                    const response = await fetch('http://localhost:5001/api/stripe/sync-subscription', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        console.log('✅ Synchronisation automatique réussie');
                        // Recharger les données après la sync
                        setTimeout(() => fetchSubscriptionStatus(), 1000);
                    }
                } catch (error) {
                    console.log('⚠️ Synchronisation automatique échouée:', error);
                }
            }
        };

        // Délai de 2 secondes pour éviter la sync si les données arrivent rapidement
        const timeout = setTimeout(autoSync, 2000);
        return () => clearTimeout(timeout);
    }, [subscription, loading, token]);

    // Polling intelligent pour synchroniser automatiquement
    useEffect(() => {
        let pollInterval;
        
        const startPolling = () => {
            // Vérifier toutes les 30 secondes si l'utilisateur est sur la page
            pollInterval = setInterval(async () => {
                // Ne faire le polling que si la page est visible
                if (!document.hidden && token) {
                    try {
                        const response = await fetch('http://localhost:5001/api/stripe/subscription/status', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            
                            // Si le statut a changé, mettre à jour
                            const currentHasSubscription = subscription !== null;
                            if (currentHasSubscription !== data.has_subscription) {
                                console.log(`Changement de statut détecté: ${currentHasSubscription} → ${data.has_subscription}`);
                                fetchSubscriptionStatus();
                            }
                        }
                    } catch (error) {
                        console.log('Erreur lors du polling:', error);
                    }
                }
            }, 30000); // 30 secondes
        };

        // Démarrer le polling après le chargement initial
        const timeout = setTimeout(startPolling, 5000);

        return () => {
            clearTimeout(timeout);
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [token, subscription]);

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

    const handleSyncStudentCount = async () => {
        setSyncLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/stripe/school/sync-student-count', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                // Recharger les données de l'abonnement
                await fetchSubscriptionStatus();
                alert(`Synchronisation réussie ! ${data.new_student_count} étudiants trouvés. Nouveau montant: ${data.total_yearly_euros}€/an`);
            } else {
                setError(data.error || 'Erreur lors de la synchronisation');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setSyncLoading(false);
        }
    };

    const handleDiagnostic = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/stripe/webhook/test', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            const data = await response.json();
            setDiagnosticData(data);
            setShowDiagnostic(true);
        } catch (error) {
            console.error('Erreur diagnostic:', error);
            setError('Erreur lors du diagnostic');
        }
    };

    const handleManualSync = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5001/api/stripe/sync-subscription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                // Recharger les données
                fetchSubscriptionStatus();
                setError('');
                console.log('Synchronisation réussie:', data);
            } else {
                setError(data.error || 'Erreur lors de la synchronisation');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleForceSync = async () => {
        setSyncLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5001/api/stripe/force-sync-all', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                // Recharger les données
                fetchSubscriptionStatus();
                setError('');
                console.log('🔄 Synchronisation complète réussie:', data);
                
                // Afficher un message détaillé
                if (data.synced_subscriptions.length > 0) {
                    alert(`✅ Synchronisation réussie!\n\n${data.message}\n\nAbonnements synchronisés : ${data.synced_subscriptions.length}\nEmail : ${data.user_email}\nRôle : ${data.user_role}`);
                } else {
                    alert('✅ Synchronisation terminée - Aucun nouvel abonnement trouvé');
                }
            } else {
                setError(data.error || 'Erreur lors de la synchronisation forcée');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setSyncLoading(false);
        }
    };

    const handleDebugUserSubscriptions = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/stripe/debug-user-subscriptions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                // Afficher les informations dans une alerte ou console
                console.log('🔍 Debug abonnements utilisateur:', data);
                
                let debugMessage = `🔍 Debug Abonnements Utilisateur\n\n`;
                debugMessage += `👤 Utilisateur: ${data.user.email} (${data.user.role})\n`;
                debugMessage += `🏫 École: ${data.user.school_id || 'Aucune'}\n\n`;
                
                debugMessage += `📊 Abonnements locaux: ${data.local_subscriptions.length}\n`;
                data.local_subscriptions.forEach((sub, i) => {
                    debugMessage += `  ${i+1}. ${sub.plan_type} - ${sub.status} (${sub.stripe_subscription_id})\n`;
                });
                
                debugMessage += `\n💳 Customers Stripe: ${data.stripe_customers.length}\n`;
                data.stripe_customers.forEach((customer, i) => {
                    debugMessage += `  ${i+1}. ${customer.email} - ${customer.subscriptions.length} abonnement(s)\n`;
                    customer.subscriptions.forEach((sub, j) => {
                        debugMessage += `    ${j+1}. ${sub.status} - ${sub.items[0]?.unit_amount || 0}/100€ (${sub.id})\n`;
                    });
                });
                
                if (data.school_subscriptions) {
                    debugMessage += `\n🏫 Abonnements école: ${data.school_subscriptions.length}\n`;
                }
                
                if (data.stripe_error) {
                    debugMessage += `\n❌ Erreur Stripe: ${data.stripe_error}`;
                }
                
                alert(debugMessage);
            } else {
                setError(data.error || 'Erreur lors du debug');
            }
        } catch (error) {
            console.error('Erreur debug utilisateur:', error);
            setError('Erreur lors du debug utilisateur');
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
                                            ? 'Abonnement suspendu - Action requise'
                                            : 'Échec de paiement détecté'
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
                                    Plan {subscription.plan_type === 'student' ? 'Étudiant' : 'École (Hybride)'}
                                </span>
                            </div>
                            {subscription.plan_type === 'student' ? (
                                <p className="text-gray-600 text-sm">
                                    2€/mois - Parfait pour les étudiants individuels
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Plan de base:</span>
                                            <span className="font-medium">{subscription.base_plan_amount_euros || 120}€/an</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Étudiants inscrits:</span>
                                            <span className="font-medium">{subscription.current_student_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Prix par étudiant:</span>
                                            <span className="font-medium">{subscription.student_price_per_month_euros || 2}€/mois</span>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="flex justify-between items-center font-semibold">
                                            <span className="text-gray-800">Total annuel:</span>
                                            <span className="text-green-600">
                                                {subscription.total_yearly_amount_euros ? 
                                                    `${subscription.total_yearly_amount_euros}€/an` : 
                                                    'Calcul en cours...'
                                                }
                                            </span>
                                        </div>
                                        {subscription.last_student_count_update && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                Dernière mise à jour: {formatDate(subscription.last_student_count_update)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                            {/* Actions spécifiques aux écoles */}
                            {subscription.plan_type === 'school' && (
                                <div className="bg-green-50 rounded-lg p-3 mb-3">
                                    <h4 className="text-sm font-medium text-green-800 mb-2">
                                        Gestion École
                                    </h4>
                                    <button
                                        onClick={handleSyncStudentCount}
                                        disabled={syncLoading}
                                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed text-sm"
                                    >
                                        {syncLoading ? (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Synchronisation...
                                            </div>
                                        ) : (
                                            'Synchroniser le nombre d\'étudiants'
                                        )}
                                    </button>
                                    <div className="text-xs text-green-700 mt-1">
                                        Met à jour automatiquement le compteur et recalcule la facturation
                                    </div>
                                </div>
                            )}
                            
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

                                    {/* Boutons d'administration */}
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={handleUpdatePaymentMethod}
                                disabled={updatePaymentLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {updatePaymentLoading ? 'Chargement...' : 'Mettre à jour le moyen de paiement'}
                            </button>
                            
                            {/* Boutons de debug - seulement en mode développement ou pour les admins */}
                            {(process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true')) && (
                                <>
                                    <button
                                        onClick={handleManualSync}
                                        disabled={loading}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Synchronisation...' : 'Synchroniser l\'abonnement'}
                                    </button>
                                    
                                    <button
                                        onClick={handleForceSync}
                                        disabled={syncLoading}
                                        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                                    >
                                        {syncLoading ? 'Sync forcée...' : '🧪 Sync forcée (Debug)'}
                                    </button>
                                    
                                    <button
                                        onClick={handleDiagnostic}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                    >
                                        Diagnostic Stripe
                                    </button>
                                    
                                    <button
                                        onClick={handleDebugUserSubscriptions}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                                    >
                                        👤 Debug Abonnements
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Message informatif pour les utilisateurs */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                Votre abonnement se synchronise automatiquement. En cas de problème, contactez le support.
                            </p>
                            {(process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true')) && (
                                <p className="text-xs text-blue-600 mt-2">
                                    Mode debug activé - Boutons de synchronisation disponibles
                                </p>
                            )}
                        </div>

                        {/* Affichage des informations de debug si disponibles */}
                        {subscription && subscription.debug_info && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">Informations de debug :</h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <div>Abonnement existe : {subscription.debug_info.subscription_exists ? 'Oui' : 'Non'}</div>
                                    <div>Statut : <span className="font-mono">{subscription.debug_info.status}</span></div>
                                    <div>Actif : {subscription.debug_info.is_active ? 'Oui' : 'Non'}</div>
                                </div>
                            </div>
                        )}

            {/* Modal de diagnostic */}
            {showDiagnostic && diagnosticData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto mx-4">
                        <h3 className="text-lg font-bold mb-4">Diagnostic Stripe</h3>
                        
                        <div className="space-y-4">
                            {/* Status de configuration */}
                            <div>
                                <h4 className="font-semibold mb-2">Configuration:</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                    {Object.entries(diagnosticData.config_status).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span>{key}:</span>
                                            <span className={value === 'CONFIGURÉ' ? 'text-green-600' : 'text-red-600'}>
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Connexion Stripe */}
                            <div>
                                <h4 className="font-semibold mb-2">Connexion Stripe:</h4>
                                <div className={`p-3 rounded ${diagnosticData.stripe_connection === 'OK' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                    {diagnosticData.stripe_connection}
                                </div>
                            </div>

                            {/* Webhooks configurés */}
                            <div>
                                <h4 className="font-semibold mb-2">Webhooks configurés:</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                    <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(diagnosticData.configured_webhooks, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            {/* URLs recommandées */}
                            <div>
                                <h4 className="font-semibold mb-2">URLs recommandées:</h4>
                                <div className="bg-blue-50 p-3 rounded">
                                    {diagnosticData.recommended_webhook_urls.map((url, index) => (
                                        <div key={index} className="text-sm text-blue-800">{url}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Événements recommandés */}
                            <div>
                                <h4 className="font-semibold mb-2">Événements recommandés:</h4>
                                <div className="bg-blue-50 p-3 rounded">
                                    {diagnosticData.recommended_events.map((event, index) => (
                                        <span key={index} className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-2">
                                            {event}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowDiagnostic(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionStatus;