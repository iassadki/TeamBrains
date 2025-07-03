import { useEffect, useRef } from 'react';

/**
 * Hook pour synchronisation automatique sur les pages critiques
 * @param {boolean} isEnabled - Activer/désactiver la sync auto
 * @param {function} onSyncComplete - Callback appelé après sync
 * @param {number} interval - Intervalle en ms (défaut: 60000 = 1 minute)
 */
export const useAutoSync = (isEnabled = true, onSyncComplete = null, interval = 60000) => {
    const syncInProgressRef = useRef(false);
    const lastSyncRef = useRef(0);
    
    const performQuickSync = async () => {
        // Éviter les syncs multiples simultanées
        if (syncInProgressRef.current) return;
        
        // Éviter les syncs trop fréquentes (minimum 30 secondes)
        const now = Date.now();
        if (now - lastSyncRef.current < 30000) return;
        
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        syncInProgressRef.current = true;
        lastSyncRef.current = now;
        
        try {
            const response = await fetch('http://localhost:5001/api/stripe/quick-sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.status_changed) {
                    console.log(`⚡ Auto-sync: Statut changé de ${data.old_status} à ${data.new_status}`);
                    
                    // Appeler le callback si fourni
                    if (onSyncComplete) {
                        onSyncComplete(data);
                    }
                }
            }
        } catch (error) {
            console.log('Erreur auto-sync:', error);
        } finally {
            syncInProgressRef.current = false;
        }
    };
    
    useEffect(() => {
        if (!isEnabled) return;
        
        // Sync immédiate au montage du composant (après un délai)
        const initialSync = setTimeout(performQuickSync, 2000);
        
        // Sync périodique
        const intervalId = setInterval(performQuickSync, interval);
        
        // Sync lors du focus de la fenêtre (retour sur la page)
        const handleFocus = () => {
            // Délai pour éviter les syncs trop fréquentes lors du focus
            setTimeout(performQuickSync, 1000);
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            clearTimeout(initialSync);
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isEnabled, interval]);
    
    // Retourner une fonction pour sync manuelle si nécessaire
    return {
        syncNow: performQuickSync,
        isSyncing: syncInProgressRef.current
    };
};

/**
 * Hook spécialisé pour les pages liées aux abonnements
 */
export const useSubscriptionAutoSync = (onSubscriptionChange = null) => {
    return useAutoSync(true, onSubscriptionChange, 45000); // 45 secondes pour les pages d'abonnement
};

/**
 * Hook spécialisé pour les pages d'accès payant
 */
export const usePremiumPageAutoSync = (onAccessChange = null) => {
    return useAutoSync(true, onAccessChange, 30000); // 30 secondes pour les pages premium
}; 