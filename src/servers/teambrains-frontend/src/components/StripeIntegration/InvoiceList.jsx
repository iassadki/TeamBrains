import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Download, Calendar, CreditCard, FileText, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

const InvoiceList = () => {
    const { currentUser } = useAuth();
    const token = currentUser?.accessToken;
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchInvoices();
        }
    }, [token]);

    const fetchInvoices = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/stripe/invoices', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setInvoices(data.invoices);
            } else {
                setError(data.error || 'Erreur lors du chargement des factures');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'text-green-600 bg-green-100';
            case 'open': return 'text-blue-600 bg-blue-100';
            case 'void': return 'text-gray-600 bg-gray-100';
            case 'draft': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Payée';
            case 'open': return 'En attente';
            case 'void': return 'Annulée';
            case 'draft': return 'Brouillon';
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

    const formatAmount = (amount, currency = 'EUR') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement de vos factures...</span>
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

    if (invoices.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucune facture trouvée
                    </h3>
                    <p className="text-gray-600">
                        Vos factures apparaîtront ici après vos premiers paiements.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Mes Factures</h2>
                <p className="text-gray-600 mt-1">
                    Gérez et téléchargez vos factures TeamBrains
                </p>
            </div>

            <div className="p-6">
                <div className="space-y-4">
                    {invoices.map((invoice) => (
                        <div
                            key={invoice.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                                        <span className="font-medium text-gray-900">
                                            Facture #{invoice.stripe_invoice_id.slice(-8).toUpperCase()}
                                        </span>
                                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                            {getStatusText(invoice.status)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            Émise le: {formatDate(invoice.invoice_date)}
                                        </div>
                                        {invoice.paid_at && (
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Payée le: {formatDate(invoice.paid_at)}
                                            </div>
                                        )}
                                        <div className="font-medium text-gray-900">
                                            {formatAmount(invoice.amount_paid_euros, invoice.currency)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                                    {invoice.invoice_pdf && (
                                        <a
                                            href={invoice.invoice_pdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            PDF
                                        </a>
                                    )}
                                    
                                    {invoice.hosted_invoice_url && (
                                        <a
                                            href={invoice.hosted_invoice_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-1" />
                                            Voir détails
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Résumé */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total facturé:</span>
                        <span className="font-bold text-lg">
                            {formatAmount(
                                invoices
                                    .filter(invoice => invoice.status === 'paid')
                                    .reduce((total, invoice) => total + invoice.amount_paid_euros, 0)
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600">Nombre de factures:</span>
                        <span className="font-medium">{invoices.length}</span>
                    </div>
                </div>

                {/* Note importante */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Information importante</p>
                            <p>
                                Toutes vos factures sont automatiquement sauvegardées et disponibles 
                                en téléchargement. Conservez-les pour vos archives comptables.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceList;