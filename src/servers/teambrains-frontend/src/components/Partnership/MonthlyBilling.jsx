import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Euro, FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const MonthlyBilling = () => {
    const { token } = useAuth();
    const [currentUsage, setCurrentUsage] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        if (token) {
            fetchCurrentMonthUsage();
            fetchInvoices();
        }
    }, [token]);

    const fetchCurrentMonthUsage = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/school-billing/usage/current-month', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCurrentUsage(data);
            }
        } catch (error) {
            console.error('Erreur récupération usage:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/school-billing/invoices/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error('Erreur récupération factures:', error);
        }
    };

    const recordTodayUsage = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/school-billing/usage/record', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                await fetchCurrentMonthUsage();
            }
        } catch (error) {
            console.error('Erreur enregistrement usage:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getPaymentStatusBadge = (status) => {
        const statusConfig = {
            'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'En attente' },
            'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Payé' },
            'failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Échec' }
        };
        
        const config = statusConfig[status] || statusConfig['pending'];
        const Icon = config.icon;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </span>
        );
    };

    if (loading) {
        return <div className="text-center py-8">Chargement...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="text-sm font-medium text-blue-800">
                    Nouveau système de facturation équitable
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                    <p>• Ajoutez et retirez des étudiants librement pendant le mois</p>
                    <p>• Facturation en fin de mois selon l'usage réel (5€/étudiant/mois)</p>
                </div>
            </div>

            {currentUsage && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Usage du mois ({currentUsage.billing_period})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Users className="w-8 h-8 text-blue-600" />
                                <div className="ml-3">
                                    <p className="text-sm text-gray-500">Étudiants actifs</p>
                                    <p className="text-2xl font-semibold">
                                        {currentUsage.current_active_students}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Calendar className="w-8 h-8 text-green-600" />
                                <div className="ml-3">
                                    <p className="text-sm text-gray-500">Jours enregistrés</p>
                                    <p className="text-2xl font-semibold">
                                        {currentUsage.estimated_bill?.days_billed || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Euro className="w-8 h-8 text-green-600" />
                                <div className="ml-3">
                                    <p className="text-sm text-gray-500">Coût estimé</p>
                                    <p className="text-2xl font-semibold">
                                        {currentUsage.estimated_bill?.total_amount_euros?.toFixed(2) || '0.00'}€
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Historique des factures */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Historique des factures
                </h2>

                {invoices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune facture générée pour le moment</p>
                        <p className="text-sm">Les factures seront générées automatiquement en fin de mois</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Période
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Étudiants (moyenne)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jours facturés
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Montant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {invoice.billing_period}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.average_students} étudiants
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.days_billed} jours
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {invoice.total_amount_euros}€
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getPaymentStatusBadge(invoice.payment_status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.payment_status === 'pending' && (
                                                <button className="text-blue-600 hover:text-blue-900">
                                                    Payer
                                                </button>
                                            )}
                                            {invoice.stripe_invoice_id && (
                                                <a 
                                                    href="#" 
                                                    className="text-gray-600 hover:text-gray-900 ml-2"
                                                >
                                                    PDF
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Informations sur le nouveau système */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Comment fonctionne le nouveau système ?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">✅ Avantages</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Facturation juste basée sur l'usage réel</li>
                            <li>• Flexibilité totale : ajout/suppression d'étudiants</li>
                            <li>• Plus de remboursements compliqués</li>
                            <li>• Transparence complète sur les coûts</li>
                            <li>• Paiement seulement en fin de mois</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">📅 Calendrier</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• <strong>Quotidien :</strong> Comptage automatique des étudiants</li>
                            <li>• <strong>Fin de mois :</strong> Génération de la facture</li>
                            <li>• <strong>15 jours :</strong> Délai de paiement</li>
                            <li>• <strong>Prix :</strong> 5€ par étudiant par mois</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyBilling; 