import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Plus, List, Power, PowerOff, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const WebhookManager = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copiedSecret, setCopiedSecret] = useState(false);

    useEffect(() => {
        if (token) {
            loadWebhooks();
        }
    }, [token]);

    const loadWebhooks = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5001/api/stripe/webhooks', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setWebhooks(data.webhooks);
            } else {
                setError(data.error || 'Erreur lors du chargement des webhooks');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const createWebhook = async () => {
        setActionLoading('create');
        setError('');
        setSuccess('');
        
        try {
            const response = await fetch('http://localhost:5001/api/stripe/setup-webhook', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setSuccess(`Webhook créé avec succès ! ID: ${data.webhook_id}`);
                loadWebhooks(); // Recharger la liste
                
                // Afficher le signing secret pour copie
                if (data.signing_secret) {
                    setSuccess(`${data.message}\n\nSigning Secret: ${data.signing_secret}`);
                }
            } else {
                setError(data.error || 'Erreur lors de la création du webhook');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setActionLoading(null);
        }
    };

    const enableWebhook = async (webhookId) => {
        setActionLoading(webhookId);
        setError('');
        setSuccess('');
        
        try {
            const response = await fetch(`http://localhost:5001/api/stripe/webhook/${webhookId}/enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setSuccess('Webhook activé avec succès');
                loadWebhooks(); // Recharger la liste
            } else {
                setError(data.error || 'Erreur lors de l\'activation du webhook');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'secret') {
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
            }
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'enabled': return 'text-green-600 bg-green-100';
            case 'disabled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'enabled': return <Power className="w-4 h-4" />;
            case 'disabled': return <PowerOff className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Settings className="w-6 h-6 mr-2" />
                            Gestion des Webhooks Stripe
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Configurez automatiquement les webhooks pour recevoir les événements de paiement
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={loadWebhooks}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <List className="w-4 h-4 mr-2" />}
                            Actualiser
                        </button>
                        <button
                            onClick={createWebhook}
                            disabled={actionLoading === 'create'}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'create' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Créer Webhook
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="whitespace-pre-line">{success}</div>
                        </div>
                    </div>
                )}

                {/* Configuration info */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Configuration requise</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                        <p>• <strong>URL du webhook:</strong> http://localhost:5001/api/stripe/webhook</p>
                        <p>• <strong>Version API:</strong> 2025-06-30.preview (Event Destinations v2)</p>
                        <p>• <strong>Événements écoutés:</strong> checkout.session.completed, invoice.payment_succeeded, etc.</p>
                    </div>
                </div>

                {/* Liste des webhooks */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Chargement des webhooks...</span>
                    </div>
                ) : webhooks.length === 0 ? (
                    <div className="text-center py-8">
                        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Aucun webhook configuré
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Créez votre premier webhook pour recevoir les événements de paiement.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {webhooks.map((webhook) => (
                            <div
                                key={webhook.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            {getStatusIcon(webhook.status)}
                                            <span className="font-medium text-gray-900 ml-2">
                                                {webhook.name || 'Webhook sans nom'}
                                            </span>
                                            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(webhook.status)}`}>
                                                {webhook.status === 'enabled' ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                            <div>
                                                <strong>ID:</strong> {webhook.id}
                                            </div>
                                            <div>
                                                <strong>URL:</strong> {webhook.webhook_endpoint?.url || 'Non configurée'}
                                            </div>
                                            <div>
                                                <strong>Créé:</strong> {formatDate(webhook.created)}
                                            </div>
                                            <div>
                                                <strong>Événements:</strong> {webhook.enabled_events?.length || 0} événements
                                            </div>
                                        </div>

                                        {webhook.description && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                {webhook.description}
                                            </p>
                                        )}

                                        {/* Événements activés */}
                                        {webhook.enabled_events && webhook.enabled_events.length > 0 && (
                                            <details className="mt-3">
                                                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                                                    Événements activés ({webhook.enabled_events.length})
                                                </summary>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {webhook.enabled_events.map((event, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                        >
                                                            {event}
                                                        </span>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                                        {webhook.status === 'disabled' && (
                                            <button
                                                onClick={() => enableWebhook(webhook.id)}
                                                disabled={actionLoading === webhook.id}
                                                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === webhook.id ? 
                                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : 
                                                    <Power className="w-4 h-4 mr-1" />
                                                }
                                                Activer
                                            </button>
                                        )}
                                        
                                        {webhook.webhook_endpoint?.signing_secret && (
                                            <button
                                                onClick={() => copyToClipboard(webhook.webhook_endpoint.signing_secret, 'secret')}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                {copiedSecret ? <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
                                                {copiedSecret ? 'Copié !' : 'Secret'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                        <p>1. Cliquez sur "Créer Webhook" pour configurer automatiquement un nouveau webhook</p>
                        <p>2. Copiez le signing secret généré et mettez-le à jour dans votre code</p>
                        <p>3. Activez le webhook s'il n'est pas automatiquement activé</p>
                        <p>4. Testez les paiements pour vérifier que les événements sont bien reçus</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebhookManager; 