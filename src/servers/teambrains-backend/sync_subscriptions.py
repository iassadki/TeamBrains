#!/usr/bin/env python3
"""
Script de synchronisation automatique des abonnements Stripe
Peut être exécuté en arrière-plan pour maintenir la cohérence
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta
import stripe
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Ajouter le chemin des modèles
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from models import Subscription, User, db

# Configuration
SYNC_INTERVAL = 300  # 5 minutes
MAX_SYNC_AGE = 3600  # 1 heure - ne sync que les abonnements modifiés dans la dernière heure

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stripe_sync.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class StripeSync:
    def __init__(self):
        # Configuration Stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            raise ValueError("STRIPE_SECRET_KEY non configuré")
        
        # Configuration base de données
        database_url = os.environ.get('DATABASE_URL', 'sqlite:///teambrains.db')
        self.engine = create_engine(database_url)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
        logger.info("🔄 StripeSync initialisé")

    def sync_all_subscriptions(self):
        """Synchroniser tous les abonnements depuis Stripe"""
        try:
            logger.info("🔄 Début de la synchronisation complète...")
            
            # Récupérer tous les abonnements locaux
            local_subscriptions = self.session.query(Subscription).all()
            synced_count = 0
            errors_count = 0
            
            for local_sub in local_subscriptions:
                try:
                    if self.sync_single_subscription(local_sub):
                        synced_count += 1
                except Exception as e:
                    logger.error(f"❌ Erreur sync {local_sub.stripe_subscription_id}: {str(e)}")
                    errors_count += 1
            
            logger.info(f"✅ Synchronisation terminée: {synced_count} synchronisés, {errors_count} erreurs")
            return synced_count, errors_count
            
        except Exception as e:
            logger.error(f"❌ Erreur synchronisation globale: {str(e)}")
            return 0, 1

    def sync_single_subscription(self, local_subscription):
        """Synchroniser un seul abonnement"""
        try:
            # Récupérer depuis Stripe
            stripe_sub = stripe.Subscription.retrieve(local_subscription.stripe_subscription_id)
            
            # Vérifier si une mise à jour est nécessaire
            stripe_status = stripe_sub.status
            needs_update = (
                local_subscription.status != stripe_status or
                abs((datetime.fromtimestamp(stripe_sub.current_period_end) - local_subscription.current_period_end).total_seconds()) > 60
            )
            
            if needs_update:
                old_status = local_subscription.status
                
                # Mettre à jour
                local_subscription.status = stripe_status
                local_subscription.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start)
                local_subscription.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end)
                
                self.session.commit()
                
                logger.info(f"🔄 Subscription {local_subscription.stripe_subscription_id}: {old_status} → {stripe_status}")
                return True
            
            return False
            
        except stripe.error.StripeError as e:
            if 'No such subscription' in str(e):
                # L'abonnement n'existe plus sur Stripe, le marquer comme annulé
                logger.warning(f"⚠️ Subscription {local_subscription.stripe_subscription_id} introuvable sur Stripe - marquage comme canceled")
                local_subscription.status = 'canceled'
                self.session.commit()
                return True
            else:
                raise e

    def check_recent_stripe_events(self):
        """Vérifier les événements Stripe récents et traiter ceux manqués"""
        try:
            # Récupérer les événements des dernières heures
            events = stripe.Event.list(
                created={
                    'gte': int((datetime.now() - timedelta(hours=2)).timestamp())
                },
                types=[
                    'customer.subscription.updated',
                    'customer.subscription.deleted',
                    'checkout.session.completed'
                ]
            )
            
            processed_count = 0
            for event in events.data:
                if self.process_missed_event(event):
                    processed_count += 1
            
            if processed_count > 0:
                logger.info(f"🎯 {processed_count} événements manqués traités")
            
            return processed_count
            
        except Exception as e:
            logger.error(f"❌ Erreur vérification événements: {str(e)}")
            return 0

    def process_missed_event(self, event):
        """Traiter un événement Stripe potentiellement manqué"""
        try:
            event_type = event.type
            stripe_object = event.data.object
            
            if event_type in ['customer.subscription.updated', 'customer.subscription.deleted']:
                # Chercher l'abonnement local
                local_sub = self.session.query(Subscription).filter_by(
                    stripe_subscription_id=stripe_object.id
                ).first()
                
                if local_sub:
                    if event_type == 'customer.subscription.deleted':
                        if local_sub.status != 'canceled':
                            logger.info(f"🚫 Événement manqué: annulation de {stripe_object.id}")
                            local_sub.status = 'canceled'
                            self.session.commit()
                            return True
                    elif event_type == 'customer.subscription.updated':
                        if local_sub.status != stripe_object.status:
                            logger.info(f"🔄 Événement manqué: mise à jour de {stripe_object.id}")
                            local_sub.status = stripe_object.status
                            self.session.commit()
                            return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Erreur traitement événement {event.id}: {str(e)}")
            return False

    def run_continuous_sync(self):
        """Exécuter la synchronisation en continu"""
        logger.info(f"🚀 Démarrage de la synchronisation continue (intervalle: {SYNC_INTERVAL}s)")
        
        while True:
            try:
                # Synchronisation des abonnements
                synced, errors = self.sync_all_subscriptions()
                
                # Vérification des événements manqués
                events_processed = self.check_recent_stripe_events()
                
                logger.info(f"📊 Cycle terminé: {synced} syncs, {errors} erreurs, {events_processed} événements traités")
                
                # Attendre avant le prochain cycle
                time.sleep(SYNC_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("⏹️ Arrêt demandé par l'utilisateur")
                break
            except Exception as e:
                logger.error(f"❌ Erreur cycle de synchronisation: {str(e)}")
                time.sleep(60)  # Attendre 1 minute en cas d'erreur

    def close(self):
        """Fermer les connexions"""
        self.session.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Synchronisation automatique Stripe')
    parser.add_argument('--once', action='store_true', help='Exécuter une seule fois')
    parser.add_argument('--events-only', action='store_true', help='Vérifier seulement les événements manqués')
    args = parser.parse_args()
    
    sync = StripeSync()
    
    try:
        if args.events_only:
            sync.check_recent_stripe_events()
        elif args.once:
            synced, errors = sync.sync_all_subscriptions()
            sync.check_recent_stripe_events()
            print(f"Synchronisation terminée: {synced} syncs, {errors} erreurs")
        else:
            sync.run_continuous_sync()
    finally:
        sync.close() 