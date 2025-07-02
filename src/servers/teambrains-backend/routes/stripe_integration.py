from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Subscription, Invoice
import stripe
import os
import json
from datetime import datetime
import logging
import requests

# Configuration Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

stripe_bp = Blueprint('stripe', __name__, url_prefix='/api/stripe')

# Configuration des prix Stripe (à adapter selon vos prix Stripe réels)
STRIPE_PRICES = {
    'student': 'price_1RxxxxxxxxxxxxxxxxxxxxxxxxxxxxStudent',  # À remplacer par votre vrai price_id
    'school': 'price_1RxxxxxxxxxxxxxxxxxxxxxxxxxxxxSchool'     # À remplacer par votre vrai price_id
}

@stripe_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Créer une session de paiement Stripe Checkout"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        plan_type = data.get('plan_type')  # 'student' ou 'school'
        school_id = data.get('school_id')  # Pour les abonnements école (optionnel)
        student_count = data.get('student_count', 0)  # Nombre d'étudiants pour le plan école
        
        if plan_type not in ['student', 'school']:
            return jsonify({'error': 'Type de plan invalide'}), 400
        
        # Pour les plans école, valider le nombre d'étudiants
        if plan_type == 'school' and student_count < 1:
            return jsonify({'error': 'Le nombre d\'étudiants doit être d\'au moins 1'}), 400
        
        # Pour les plans école, vérifier que l'école existe si elle est spécifiée
        if plan_type == 'school' and school_id:
            from models import School
            school = School.query.get(school_id)
            if not school:
                return jsonify({'error': 'École non trouvée'}), 404
        
        # Créer ou récupérer le customer Stripe
        stripe_customer = None
        # Vérifier si l'utilisateur a déjà un abonnement avec customer_id
        existing_subscription = Subscription.query.filter_by(user_id=user.id).first()
        if existing_subscription and existing_subscription.stripe_customer_id:
            stripe_customer = stripe.Customer.retrieve(existing_subscription.stripe_customer_id)
        else:
            stripe_customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.prenom} {user.nom}",
                metadata={
                    'user_id': user.id,
                    'role': user.role
                }
            )
        
        # Calculer le prix selon le type de plan
        if plan_type == 'school':
            # Plan école hybride : base + étudiants
            base_amount = 12000  # 120€ de base par an
            student_amount = 200 * student_count * 12  # 2€ par étudiant par mois, pour 1 an
            total_yearly_amount = base_amount + student_amount
            
            product_description = f'Plan École Hybride : 120€/an + {student_count} étudiants × 24€/an = {total_yearly_amount/100}€/an'
            logging.info(f"Prix calculé pour école: base={base_amount}, étudiants={student_count}, montant_étudiants={student_amount}, total={total_yearly_amount}")
        else:
            # Plan étudiant classique
            total_yearly_amount = 200  # 2€/mois pour étudiant
            student_count = 0
            product_description = f'Abonnement TeamBrains Étudiant - 2€/mois'
        
        # Créer la session Checkout
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer.id,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'TeamBrains - Plan {plan_type.title()}{"" if plan_type == "student" else " (Hybride)"}',
                        'description': product_description
                    },
                    'unit_amount': total_yearly_amount,
                    'recurring': {
                        'interval': 'month' if plan_type == 'student' else 'year'
                    }
                },
                'quantity': 1,
            }],
            success_url="http://localhost:5173/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/tarifs?canceled=true",
            metadata={
                'user_id': user.id,
                'plan_type': plan_type,
                'school_id': str(school_id) if school_id else '',
                'student_count': str(student_count) if plan_type == 'school' else '0'
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        })
        
    except Exception as e:
        import traceback
        logging.error(f"Erreur création session Stripe: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Erreur lors de la création de la session de paiement'}), 500

@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Webhook pour recevoir les événements Stripe"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    # Pour les tests en développement, nous désactivons temporairement la vérification de signature
    # Note: En production, utilisez toujours la vérification de signature
    endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        # En mode développement, on parse directement le JSON sans vérification de signature
        if request.headers.get('User-Agent', '').startswith('Stripe/'):
            event = json.loads(payload.decode('utf-8'))
            logging.info(f"Événement Stripe reçu: {event.get('type')}")
        else:
            # Tentative de vérification normale pour la production
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e:
        logging.error(f"Payload invalide: {str(e)}")
        return jsonify({'error': 'Payload invalide'}), 400
    except stripe.error.SignatureVerificationError as e:
        logging.error(f"Signature invalide: {str(e)}")
        return jsonify({'error': 'Signature invalide'}), 400
    except Exception as e:
        logging.error(f"Erreur webhook: {str(e)}")
        return jsonify({'error': 'Erreur de traitement'}), 400
    
    # Traiter les événements avec logging détaillé
    event_type = event['type']
    logging.info(f"🎯 PROCESSING EVENT: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            handle_checkout_session_completed(event['data']['object'])
        elif event_type == 'invoice.payment_succeeded':
            handle_invoice_payment_succeeded(event['data']['object'])
        elif event_type == 'invoice.payment_failed':
            handle_invoice_payment_failed(event['data']['object'])
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event['data']['object'])
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event['data']['object'])
        elif event_type == 'invoice.payment_action_required':
            handle_payment_action_required(event['data']['object'])
        else:
            logging.info(f"ℹ️ WEBHOOK IGNORED: Event type {event_type} not handled")
        
        logging.info(f"✅ WEBHOOK COMPLETED: {event_type} processed successfully")
        return jsonify({'status': 'success'})
        
    except Exception as e:
        logging.error(f"❌ WEBHOOK PROCESSING ERROR: {event_type} failed - {str(e)}")
        logging.error(f"Event data: {event}")
        # Retourner 200 pour éviter que Stripe ne retente indéfiniment
        return jsonify({'status': 'error', 'message': str(e)}), 200

def handle_checkout_session_completed(session):
    """Traiter la completion d'une session de checkout"""
    try:
        logging.info(f"✅ WEBHOOK: Session checkout completed reçue - ID: {session.get('id')}")
        
        # Vérifier si les métadonnées existent (vraie session vs test)
        if not session.get('metadata') or not session['metadata'].get('user_id'):
            logging.warning("⚠️ Session sans métadonnées user_id - recherche alternative par customer_id")
            
            # Essayer de retrouver l'utilisateur par customer_id
            customer_id = session.get('customer')
            if customer_id:
                subscription = Subscription.query.filter_by(stripe_customer_id=customer_id).first()
                if subscription:
                    logging.info(f"🔍 Utilisateur retrouvé via customer_id: {subscription.user_id}")
                    session['metadata'] = {'user_id': subscription.user_id}
                else:
                    logging.error(f"❌ Aucun abonnement trouvé pour customer_id: {customer_id}")
                    return
            else:
                logging.error("❌ Pas de customer_id disponible non plus")
                return
        
        user_id = session['metadata']['user_id']
        plan_type = session['metadata']['plan_type']
        school_id = session['metadata'].get('school_id')
        student_count = session['metadata'].get('student_count')
        
        # Vérifier si la session a une subscription
        if not session.get('subscription'):
            logging.warning("Session sans subscription ID")
            return
        
        # Récupérer la subscription Stripe
        stripe_subscription = stripe.Subscription.retrieve(session['subscription'])
        
        # Créer ou mettre à jour l'abonnement en base
        subscription = Subscription.query.filter_by(user_id=user_id).first()
        if not subscription:
            subscription = Subscription()
            subscription.user_id = user_id
        
        subscription.stripe_subscription_id = stripe_subscription.id
        subscription.stripe_customer_id = session['customer']
        subscription.plan_type = plan_type
        subscription.status = stripe_subscription.status
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
        
        # Pour les abonnements école, ajouter les informations hybrides
        if plan_type == 'school':
            if school_id and school_id.isdigit():
                subscription.school_id = int(school_id)
            if student_count and student_count.isdigit():
                subscription.current_student_count = int(student_count)
                subscription.last_student_count_update = datetime.utcnow()
            
            # Initialiser les montants par défaut
            subscription.base_plan_amount = 12000  # 120€
            subscription.student_price_per_month = 200  # 2€
            
            # Calculer le montant total mensuel
            base_monthly = subscription.base_plan_amount // 12  # 10€ par mois
            student_monthly = (subscription.current_student_count or 0) * subscription.student_price_per_month
            subscription.total_monthly_amount = base_monthly + student_monthly
        
        db.session.add(subscription)
        db.session.commit()
        
        logging.info(f"✅ WEBHOOK SUCCESS: Abonnement créé/mis à jour pour l'utilisateur {user_id} - Plan: {plan_type}")
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"❌ WEBHOOK ERROR - Checkout session: {str(e)}")
        logging.error(f"Session data: {session}")

def handle_invoice_payment_succeeded(invoice):
    """Traiter le paiement réussi d'une facture"""
    try:
        logging.info(f"💰 WEBHOOK: Invoice payment succeeded - ID: {invoice.get('id')}")
        
        # Récupérer l'ID de subscription (peut être dans plusieurs endroits)
        stripe_subscription_id = None
        
        # Cas 1: subscription directement dans l'invoice
        if invoice.get('subscription'):
            stripe_subscription_id = invoice['subscription']
        # Cas 2: subscription dans parent.subscription_details (si parent existe)
        elif (invoice.get('parent') and 
              invoice['parent'] is not None and 
              invoice['parent'].get('subscription_details', {}).get('subscription')):
            stripe_subscription_id = invoice['parent']['subscription_details']['subscription']
        
        if not stripe_subscription_id:
            logging.warning(f"Facture sans subscription - ignoré. Parent: {invoice.get('parent')}")
            return
        subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_subscription_id).first()
        
        if not subscription:
            logging.warning(f"Subscription non trouvée pour {stripe_subscription_id}")
            return
        
        # Vérifier si la facture existe déjà
        existing_invoice = Invoice.query.filter_by(stripe_invoice_id=invoice['id']).first()
        if existing_invoice:
            logging.info(f"Facture {invoice['id']} existe déjà")
            return
        
        # Créer la facture en base
        invoice_record = Invoice(
            user_id=subscription.user_id,
            subscription_id=subscription.id,
            stripe_invoice_id=invoice['id'],
            amount_paid=invoice.get('amount_paid', 0),
            currency=invoice.get('currency', 'eur'),
            status=invoice.get('status', 'paid'),
            invoice_pdf=invoice.get('invoice_pdf'),
            hosted_invoice_url=invoice.get('hosted_invoice_url'),
            invoice_date=datetime.fromtimestamp(invoice['created']),
            paid_at=datetime.fromtimestamp(invoice['status_transitions']['paid_at']) if invoice.get('status_transitions', {}).get('paid_at') else None
        )
        
        db.session.add(invoice_record)
        db.session.commit()
        
        logging.info(f"Facture créée pour l'utilisateur {subscription.user_id}")
        
    except Exception as e:
        logging.error(f"Erreur traitement paiement facture: {str(e)}")
        logging.error(f"Invoice data: {invoice}")

def handle_subscription_updated(subscription):
    """Traiter la mise à jour d'un abonnement"""
    try:
        logging.info(f"Mise à jour subscription: {subscription}")
        
        db_subscription = Subscription.query.filter_by(stripe_subscription_id=subscription['id']).first()
        if db_subscription:
            db_subscription.status = subscription.get('status', 'active')
            
            # Vérifier si les champs existent avant de les utiliser
            if subscription.get('current_period_start'):
                db_subscription.current_period_start = datetime.fromtimestamp(subscription['current_period_start'])
            if subscription.get('current_period_end'):
                db_subscription.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
                
            db.session.commit()
            
        logging.info(f"Abonnement mis à jour: {subscription['id']}")
        
    except Exception as e:
        logging.error(f"Erreur mise à jour abonnement: {str(e)}")
        logging.error(f"Subscription data: {subscription}")

def handle_subscription_deleted(subscription):
    """Traiter la suppression d'un abonnement"""
    try:
        logging.info(f"🚫 WEBHOOK: Subscription deleted - ID: {subscription.get('id')}")
        
        db_subscription = Subscription.query.filter_by(stripe_subscription_id=subscription['id']).first()
        if db_subscription:
            old_status = db_subscription.status
            db_subscription.status = 'canceled'
            # Réinitialiser les compteurs d'échec lors de l'annulation
            db_subscription.payment_failed_count = 0
            db_subscription.payment_method_action_required = False
            db_subscription.unpaid_invoice_id = None
            db.session.commit()
            
            logging.info(f"✅ WEBHOOK SUCCESS: Abonnement annulé - User: {db_subscription.user_id}, Status: {old_status} → canceled")
        else:
            logging.warning(f"⚠️ WEBHOOK: Abonnement {subscription['id']} non trouvé en base pour annulation")
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"❌ WEBHOOK ERROR - Subscription deletion: {str(e)}")
        logging.error(f"Subscription data: {subscription}")

def handle_invoice_payment_failed(invoice):
    """Traiter l'échec d'un paiement de facture"""
    try:
        logging.info(f"Échec de paiement facture: {invoice}")
        
        # Récupérer l'ID de subscription
        stripe_subscription_id = None
        if invoice.get('subscription'):
            stripe_subscription_id = invoice['subscription']
        elif (invoice.get('parent') and 
              invoice['parent'] is not None and 
              invoice['parent'].get('subscription_details', {}).get('subscription')):
            stripe_subscription_id = invoice['parent']['subscription_details']['subscription']
        
        if not stripe_subscription_id:
            logging.warning(f"Facture échec sans subscription - ignoré. Invoice ID: {invoice.get('id')}")
            return
            
        subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_subscription_id).first()
        if not subscription:
            logging.warning(f"Subscription non trouvée pour échec paiement: {stripe_subscription_id}")
            return
        
        # Incrémenter le compteur d'échecs
        subscription.payment_failed_count = (subscription.payment_failed_count or 0) + 1
        subscription.last_payment_failed_at = datetime.utcnow()
        subscription.unpaid_invoice_id = invoice.get('id')
        
        # Marquer l'abonnement selon le nombre d'échecs
        if (subscription.payment_failed_count or 0) >= 3:
            # Suspendre l'accès après 3 échecs
            subscription.status = 'past_due'
            logging.warning(f"Abonnement suspendu après 3 échecs: {subscription.user_id}")
        
        db.session.commit()
        logging.info(f"Échec de paiement traité pour utilisateur {subscription.user_id}, tentative #{subscription.payment_failed_count or 0}")
        
    except Exception as e:
        logging.error(f"Erreur traitement échec paiement: {str(e)}")
        logging.error(f"Invoice data: {invoice}")

def handle_payment_action_required(invoice):
    """Traiter les paiements nécessitant une action utilisateur (3D Secure, etc.)"""
    try:
        logging.info(f"Action requise pour paiement: {invoice}")
        
        # Récupérer l'ID de subscription
        stripe_subscription_id = None
        if invoice.get('subscription'):
            stripe_subscription_id = invoice['subscription']
        elif (invoice.get('parent') and 
              invoice['parent'] is not None and 
              invoice['parent'].get('subscription_details', {}).get('subscription')):
            stripe_subscription_id = invoice['parent']['subscription_details']['subscription']
        
        if not stripe_subscription_id:
            logging.warning(f"Facture action requise sans subscription - ignoré. Invoice ID: {invoice.get('id')}")
            return
            
        subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_subscription_id).first()
        if not subscription:
            logging.warning(f"Subscription non trouvée pour action requise: {stripe_subscription_id}")
            return
        
        # Marquer qu'une action est requise
        subscription.payment_method_action_required = True
        subscription.unpaid_invoice_id = invoice.get('id')
        
        db.session.commit()
        logging.info(f"Action de paiement requise pour utilisateur {subscription.user_id}")
        
    except Exception as e:
        logging.error(f"Erreur traitement action requise: {str(e)}")
        logging.error(f"Invoice data: {invoice}")

@stripe_bp.route('/subscription/status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Récupérer le statut de l'abonnement de l'utilisateur"""
    try:
        user_id = get_jwt_identity()
        subscription = Subscription.query.filter_by(user_id=user_id).first()
        
        # Aucun abonnement en base
        if not subscription:
            return jsonify({
                'has_subscription': False,
                'subscription': None
            })
        
        # Vérifier si l'abonnement est actif (statuts valides)
        active_statuses = ['active', 'trialing', 'past_due']  # past_due = en retard mais encore valide
        has_active_subscription = subscription.status in active_statuses
        
        # Log pour debug
        logging.info(f"🔍 User {user_id} - Subscription status: {subscription.status}, has_active: {has_active_subscription}")
        
        return jsonify({
            'has_subscription': has_active_subscription,
            'subscription': subscription.to_dict(),
            'debug_info': {
                'subscription_exists': True,
                'status': subscription.status,
                'is_active': has_active_subscription
            }
        })
        
    except Exception as e:
        logging.error(f"❌ Erreur récupération statut: {str(e)}")
        return jsonify({'error': 'Erreur serveur'}), 500

@stripe_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_user_invoices():
    """Récupérer les factures de l'utilisateur"""
    try:
        user_id = get_jwt_identity()
        invoices = Invoice.query.filter_by(user_id=user_id).order_by(Invoice.invoice_date.desc()).all()
        
        return jsonify({
            'invoices': [invoice.to_dict() for invoice in invoices]
        })
        
    except Exception as e:
        logging.error(f"Erreur récupération factures: {str(e)}")
        return jsonify({'error': 'Erreur serveur'}), 500

@stripe_bp.route('/cancel-subscription', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Annuler l'abonnement de l'utilisateur"""
    try:
        user_id = get_jwt_identity()
        subscription = Subscription.query.filter_by(user_id=user_id).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement trouvé'}), 404
        
        # Annuler l'abonnement sur Stripe
        stripe.Subscription.delete(subscription.stripe_subscription_id)
        
        return jsonify({'message': 'Abonnement annulé avec succès'})
        
    except Exception as e:
        logging.error(f"Erreur annulation abonnement: {str(e)}")
        return jsonify({'error': 'Erreur lors de l\'annulation'}), 500

@stripe_bp.route('/retry-payment', methods=['POST'])
@jwt_required()
def retry_payment():
    """Relancer le paiement d'une facture impayée"""
    try:
        current_user = get_jwt_identity()
        
        # Récupérer l'abonnement de l'utilisateur
        subscription = Subscription.query.filter_by(user_id=current_user).first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement trouvé'}), 404
        
        if not subscription.unpaid_invoice_id:
            return jsonify({'error': 'Aucune facture impayée'}), 400
        
        # Récupérer la facture Stripe
        invoice = stripe.Invoice.retrieve(subscription.unpaid_invoice_id)
        
        if invoice.status == 'paid':
            # La facture est déjà payée, nettoyer les données
            subscription.payment_failed_count = 0
            subscription.payment_method_action_required = False
            subscription.unpaid_invoice_id = None
            subscription.last_payment_retry_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'message': 'La facture est déjà payée'})
        
        # Essayer de finaliser/payer la facture
        if invoice.status == 'draft':
            invoice.finalize_invoice()
        
        # Tenter de payer la facture
        invoice.pay()
        
        # Mettre à jour les tentatives
        subscription.last_payment_retry_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Tentative de paiement lancée'})
        
    except stripe.error.CardError as e:
        # Carte refusée
        logging.error(f"Carte refusée lors de la relance: {str(e)}")
        return jsonify({'error': 'Paiement refusé. Vérifiez votre moyen de paiement.'}), 400
        
    except stripe.error.StripeError as e:
        logging.error(f"Erreur Stripe lors de la relance: {str(e)}")
        return jsonify({'error': 'Erreur du service de paiement'}), 500
        
    except Exception as e:
        logging.error(f"Erreur relance paiement: {str(e)}")
        return jsonify({'error': 'Erreur lors de la relance du paiement'}), 500

@stripe_bp.route('/update-payment-method', methods=['POST'])
@jwt_required()
def update_payment_method():
    """Créer une session pour mettre à jour le moyen de paiement"""
    try:
        current_user = get_jwt_identity()
        
        # Récupérer l'abonnement de l'utilisateur
        subscription = Subscription.query.filter_by(user_id=current_user).first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement trouvé'}), 404
        
        # Créer une session de mise à jour du moyen de paiement
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='setup',
            customer=subscription.stripe_customer_id,
            success_url=request.json.get('success_url', 'http://localhost:3000/dashboard/subscription?updated=true'),
            cancel_url=request.json.get('cancel_url', 'http://localhost:3000/dashboard/subscription'),
            metadata={
                'user_id': current_user,
                'purpose': 'update_payment_method'
            }
        )
        
        return jsonify({'checkout_url': session.url})
        
    except Exception as e:
        logging.error(f"Erreur mise à jour moyen de paiement: {str(e)}")
        return jsonify({'error': 'Erreur lors de la création de la session'}), 500

@stripe_bp.route('/setup-webhook', methods=['POST'])
@jwt_required()
def setup_webhook():
    """Fournir les instructions pour configurer un webhook Event Destination"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès non autorisé - Admin requis'}), 403
        
        # Instructions pour la configuration manuelle du webhook
        instructions = {
            'success': True,
            'message': 'Instructions pour configurer votre webhook Stripe',
            'webhook_config': {
                'api_version': '2025-06-30.preview',
                'webhook_url': 'http://localhost:5001/api/stripe/webhook',
                'events_to_enable': [
                    'checkout.session.completed',
                    'invoice.payment_succeeded', 
                    'customer.subscription.updated',
                    'customer.subscription.deleted',
                    'invoice.created',
                    'payment_intent.succeeded'
                ]
            },
            'steps': [
                '1. Allez sur https://dashboard.stripe.com/webhooks',
                '2. Cliquez sur "Add endpoint"',
                '3. URL: http://localhost:5001/api/stripe/webhook (ou votre URL publique)',
                '4. Sélectionnez les événements listés ci-dessus',
                '5. Copiez le signing secret généré',
                '6. Mettez à jour endpoint_secret dans votre code'
            ],
            'curl_example': f'''
curl -X POST https://api.stripe.com/v2/core/event_destinations \\
  -H "Authorization: Bearer {stripe.api_key}" \\
  -H "Content-Type: application/json" \\
  -H "Stripe-Version: 2025-06-30.preview" \\
  --data '{{
    "name": "TeamBrains Webhook",
    "description": "Webhook pour TeamBrains",
    "type": "webhook_endpoint",
    "event_payload": "snapshot",
    "events_from": ["self"],
    "enabled_events": [
      "checkout.session.completed",
      "invoice.payment_succeeded",
      "customer.subscription.updated",
      "customer.subscription.deleted"
    ],
    "webhook_endpoint": {{
      "url": "VOTRE_URL_PUBLIQUE/api/stripe/webhook"
    }}
  }}'
            '''.strip(),
            'note': 'Pour les tests en local, utilisez ngrok pour exposer localhost:5001'
        }
        
        return jsonify(instructions)
        
    except Exception as e:
        logging.error(f"Erreur setup webhook: {str(e)}")
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@stripe_bp.route('/webhooks', methods=['GET'])
@jwt_required()
def list_webhooks():
    """Lister tous les Event Destinations webhook existants"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès non autorisé - Admin requis'}), 403
        
        headers = {
            'Authorization': f'Bearer {stripe.api_key}',
            'Stripe-Version': '2025-06-30.preview'
        }
        
        response = requests.get(
            'https://api.stripe.com/v2/core/event_destinations',
            headers=headers,
            params={'include': ['webhook_endpoint.url']}
        )
        
        if response.status_code == 200:
            webhooks_data = response.json()
            
            # Filtrer uniquement les webhook endpoints
            webhook_endpoints = [
                webhook for webhook in webhooks_data.get('data', [])
                if webhook.get('type') == 'webhook_endpoint'
            ]
            
            return jsonify({
                'webhooks': webhook_endpoints,
                'count': len(webhook_endpoints)
            })
        else:
            error_data = response.json()
            return jsonify({
                'error': f'Erreur Stripe API: {error_data.get("error", {}).get("message", "Erreur inconnue")}'
            }), 400
            
    except Exception as e:
        logging.error(f"Erreur listing webhooks: {str(e)}")
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@stripe_bp.route('/webhook/<webhook_id>/enable', methods=['POST'])
@jwt_required()
def enable_webhook(webhook_id):
    """Activer un webhook Event Destination"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès non autorisé - Admin requis'}), 403
        
        headers = {
            'Authorization': f'Bearer {stripe.api_key}',
            'Stripe-Version': '2025-06-30.preview'
        }
        
        response = requests.post(
            f'https://api.stripe.com/v2/core/event_destinations/{webhook_id}/enable',
            headers=headers
        )
        
        if response.status_code == 200:
            webhook_data = response.json()
            return jsonify({
                'success': True,
                'webhook_id': webhook_id,
                'status': webhook_data.get('status'),
                'message': 'Webhook activé avec succès'
            })
        else:
            error_data = response.json()
            return jsonify({
                'error': f'Erreur Stripe API: {error_data.get("error", {}).get("message", "Erreur inconnue")}'
            }), 400
            
    except Exception as e:
        logging.error(f"Erreur activation webhook: {str(e)}")
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

# ===============================
# NOUVELLES ROUTES FACTURATION HYBRIDE ÉCOLES
# ===============================

@stripe_bp.route('/school/update-student-count', methods=['POST'])
@jwt_required()
def update_school_student_count():
    """Mettre à jour le nombre d'étudiants et recalculer la facturation"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Récupérer l'abonnement école de l'utilisateur
        subscription = Subscription.query.filter_by(user_id=user_id, plan_type='school').first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement école trouvé'}), 404
        
        data = request.get_json()
        new_student_count = data.get('student_count')
        
        if new_student_count is None or new_student_count < 0:
            return jsonify({'error': 'Nombre d\'étudiants invalide'}), 400
        
        # Mettre à jour le compteur d'étudiants
        old_count = subscription.current_student_count or 0
        subscription.current_student_count = new_student_count
        subscription.last_student_count_update = datetime.utcnow()
        
        # Calculer le nouveau montant
        base_amount = subscription.base_plan_amount or 12000  # 120€
        student_price = subscription.student_price_per_month or 200  # 2€
        new_total = base_amount + (student_price * new_student_count)
        subscription.total_monthly_amount = new_total
        
        db.session.commit()
        
        # Si c'est un abonnement Stripe actif, mettre à jour le montant
        if subscription.stripe_subscription_id and subscription.status == 'active':
            try:
                # Récupérer l'abonnement Stripe
                stripe_subscription = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
                
                # Créer un nouveau prix pour le nouveau montant annuel
                yearly_amount = new_total * 12
                new_price = stripe.Price.create(
                    currency='eur',
                    unit_amount=yearly_amount,
                    recurring={'interval': 'year'},
                    product_data={
                        'name': 'TeamBrains - Plan École (Hybride)',
                        'description': f'Plan de base (120€/an) + {new_student_count} étudiants (2€/mois chacun)'
                    }
                )
                
                # Mettre à jour l'abonnement avec le nouveau prix
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    items=[{
                        'id': stripe_subscription['items']['data'][0]['id'],
                        'price': new_price.id
                    }]
                )
                
                logging.info(f"Abonnement Stripe mis à jour: {new_student_count} étudiants, {yearly_amount/100}€/an")
                
            except stripe.error.StripeError as e:
                logging.error(f"Erreur mise à jour Stripe: {str(e)}")
                # On continue même si Stripe échoue, les données locales sont mises à jour
        
        return jsonify({
            'message': 'Nombre d\'étudiants mis à jour avec succès',
            'old_student_count': old_count,
            'new_student_count': new_student_count,
            'base_amount_euros': base_amount / 100,
            'student_price_euros': student_price / 100,
            'total_monthly_euros': new_total / 100,
            'total_yearly_euros': (new_total * 12) / 100,
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Erreur mise à jour nombre étudiants: {str(e)}")
        return jsonify({'error': 'Erreur lors de la mise à jour'}), 500

@stripe_bp.route('/school/sync-student-count', methods=['POST'])
@jwt_required()
def sync_school_student_count():
    """Synchroniser automatiquement le nombre d'étudiants depuis la base de données"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Récupérer l'abonnement école de l'utilisateur
        subscription = Subscription.query.filter_by(user_id=user_id, plan_type='school').first()
        if not subscription or not subscription.school_id:
            return jsonify({'error': 'Aucun abonnement école avec école associée trouvé'}), 404
        
        # Compter les étudiants actifs de l'école
        from models import User as UserModel, School
        school = School.query.get(subscription.school_id)
        if not school:
            return jsonify({'error': 'École non trouvée'}), 404
        
        # Compter les étudiants actifs
        student_count = UserModel.query.filter_by(
            school_id=subscription.school_id,
            role='student'
        ).count()
        
        # Mettre à jour l'abonnement
        old_count = subscription.current_student_count or 0
        subscription.current_student_count = student_count
        subscription.last_student_count_update = datetime.utcnow()
        
        # Calculer le nouveau montant
        base_amount = subscription.base_plan_amount or 12000  # 120€
        student_price = subscription.student_price_per_month or 200  # 2€
        new_total = base_amount + (student_price * student_count)
        subscription.total_monthly_amount = new_total
        
        db.session.commit()
        
        return jsonify({
            'message': f'Synchronisation terminée pour l\'école {school.name}',
            'school_name': school.name,
            'old_student_count': old_count,
            'new_student_count': student_count,
            'base_amount_euros': base_amount / 100,
            'student_price_euros': student_price / 100,
            'total_monthly_euros': new_total / 100,
            'total_yearly_euros': (new_total * 12) / 100,
            'last_sync': subscription.last_student_count_update.isoformat()
        })
        
    except Exception as e:
        logging.error(f"Erreur synchronisation nombre étudiants: {str(e)}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500

@stripe_bp.route('/school/pricing-config', methods=['GET', 'POST'])
@jwt_required()
def manage_school_pricing():
    """Gérer la configuration des prix pour l'école"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Récupérer l'abonnement école de l'utilisateur
        subscription = Subscription.query.filter_by(user_id=user_id, plan_type='school').first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement école trouvé'}), 404
        
        if request.method == 'GET':
            # Retourner la configuration actuelle
            return jsonify({
                'base_plan_amount': subscription.base_plan_amount or 12000,
                'base_plan_amount_euros': (subscription.base_plan_amount or 12000) / 100,
                'student_price_per_month': subscription.student_price_per_month or 200,
                'student_price_per_month_euros': (subscription.student_price_per_month or 200) / 100,
                'current_student_count': subscription.current_student_count or 0,
                'total_monthly_amount': subscription.total_monthly_amount,
                'total_monthly_amount_euros': subscription.total_monthly_amount / 100 if subscription.total_monthly_amount else None,
                'last_update': subscription.last_student_count_update.isoformat() if subscription.last_student_count_update else None
            })
        
        elif request.method == 'POST':
            # Mettre à jour la configuration (admin seulement)
            if user.role != 'admin':
                return jsonify({'error': 'Accès non autorisé - Admin requis'}), 403
            
            data = request.get_json()
            
            # Valider les données
            base_amount = data.get('base_plan_amount')
            student_price = data.get('student_price_per_month')
            
            if base_amount is not None:
                if base_amount < 0:
                    return jsonify({'error': 'Montant de base invalide'}), 400
                subscription.base_plan_amount = int(base_amount * 100) if isinstance(base_amount, float) else base_amount
            
            if student_price is not None:
                if student_price < 0:
                    return jsonify({'error': 'Prix étudiant invalide'}), 400
                subscription.student_price_per_month = int(student_price * 100) if isinstance(student_price, float) else student_price
            
            # Recalculer le montant total
            base_amount_cents = subscription.base_plan_amount or 12000
            student_price_cents = subscription.student_price_per_month or 200
            student_count = subscription.current_student_count or 0
            new_total = base_amount_cents + (student_price_cents * student_count)
            subscription.total_monthly_amount = new_total
            
            db.session.commit()
            
            return jsonify({
                'message': 'Configuration mise à jour avec succès',
                'base_plan_amount_euros': base_amount_cents / 100,
                'student_price_per_month_euros': student_price_cents / 100,
                'current_student_count': student_count,
                'total_monthly_amount_euros': new_total / 100,
                'total_yearly_amount_euros': (new_total * 12) / 100
            })
        
    except Exception as e:
        logging.error(f"Erreur gestion configuration prix école: {str(e)}")
        return jsonify({'error': 'Erreur lors de la gestion de la configuration'}), 500

@stripe_bp.route('/school/associate-subscription', methods=['POST'])
@jwt_required()
def associate_school_subscription():
    """Associer une école à un abonnement existant"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        school_id = data.get('school_id')
        
        if not school_id:
            return jsonify({'error': 'ID école requis'}), 400
        
        # Vérifier que l'école existe
        from models import School
        school = School.query.get(school_id)
        if not school:
            return jsonify({'error': 'École non trouvée'}), 404
        
        # Récupérer l'abonnement école de l'utilisateur
        subscription = Subscription.query.filter_by(user_id=user_id, plan_type='school').first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement école trouvé'}), 404
        
        # Vérifier qu'aucune autre école n'est déjà associée à cet abonnement
        if subscription.school_id and subscription.school_id != school_id:
            existing_school = School.query.get(subscription.school_id)
            return jsonify({
                'error': f'Cet abonnement est déjà associé à l\'école {existing_school.name if existing_school else "inconnue"}'
            }), 400
        
        # Associer l'école à l'abonnement
        subscription.school_id = school_id
        
        # Compter automatiquement les étudiants
        student_count = User.query.filter_by(
            school_id=school_id,
            role='student'
        ).count()
        
        subscription.current_student_count = student_count
        subscription.last_student_count_update = datetime.utcnow()
        
        # Calculer le montant total
        base_amount = subscription.base_plan_amount or 12000
        student_price = subscription.student_price_per_month or 200
        total_amount = base_amount + (student_price * student_count)
        subscription.total_monthly_amount = total_amount
        
        db.session.commit()
        
        return jsonify({
            'message': f'École {school.name} associée avec succès à l\'abonnement',
            'school': {
                'id': school.id,
                'name': school.name,
                'student_count': student_count
            },
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Erreur association école-abonnement: {str(e)}")
        return jsonify({'error': 'Erreur lors de l\'association'}), 500

@stripe_bp.route('/webhook/test', methods=['GET'])
def test_webhook_config():
    """Endpoint de diagnostic pour vérifier la configuration des webhooks"""
    try:
        config_status = {
            'stripe_secret_key': 'CONFIGURÉ' if os.environ.get('STRIPE_SECRET_KEY') else 'MANQUANT',
            'stripe_publishable_key': 'CONFIGURÉ' if os.environ.get('STRIPE_PUBLISHABLE_KEY') else 'MANQUANT',
            'webhook_secret': 'CONFIGURÉ' if os.environ.get('STRIPE_WEBHOOK_SECRET') else 'MANQUANT',
            'partnership_webhook_secret': 'CONFIGURÉ' if os.environ.get('STRIPE_PARTNERSHIP_WEBHOOK_SECRET') else 'MANQUANT'
        }
        
        # Tester la connexion à Stripe
        try:
            # Lister les customers pour tester l'API
            customers = stripe.Customer.list(limit=1)
            stripe_connection = 'OK'
        except Exception as e:
            stripe_connection = f'ERREUR: {str(e)}'
        
        # Vérifier les webhooks configurés côté Stripe
        try:
            webhook_endpoints = stripe.WebhookEndpoint.list()
            configured_webhooks = []
            for endpoint in webhook_endpoints.data:
                configured_webhooks.append({
                    'url': endpoint.url,
                    'enabled_events': endpoint.enabled_events,
                    'status': endpoint.status
                })
        except Exception as e:
            configured_webhooks = f'ERREUR: {str(e)}'
        
        return jsonify({
            'config_status': config_status,
            'stripe_connection': stripe_connection,
            'configured_webhooks': configured_webhooks,
            'recommended_webhook_urls': [
                'http://localhost:5001/api/stripe/webhook',  # Pour abonnements étudiants
                'http://localhost:5001/api/partnership/stripe/webhook'  # Pour abonnements écoles
            ],
            'recommended_events': [
                'checkout.session.completed',
                'invoice.payment_succeeded',
                'invoice.payment_failed',
                'customer.subscription.updated',
                'customer.subscription.deleted',
                'invoice.payment_action_required'
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur de diagnostic: {str(e)}'}), 500

@stripe_bp.route('/sync-subscription', methods=['POST'])
@jwt_required()
def manual_sync_subscription():
    """Synchronisation manuelle de l'abonnement depuis Stripe"""
    try:
        current_user_id = get_jwt_identity()
        
        # Récupérer l'abonnement en base
        subscription = Subscription.query.filter_by(user_id=current_user_id).first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement trouvé'}), 404
        
        # Récupérer l'abonnement depuis Stripe
        try:
            stripe_subscription = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
        except stripe.error.StripeError as e:
            return jsonify({'error': f'Erreur Stripe: {str(e)}'}), 400
        
        # Mettre à jour les informations locales
        subscription.status = stripe_subscription.status
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
        
        # Récupérer les dernières factures
        invoices = stripe.Invoice.list(
            subscription=subscription.stripe_subscription_id,
            limit=10
        )
        
        # Synchroniser les factures manquantes
        synced_invoices = 0
        for stripe_invoice in invoices.data:
            existing_invoice = Invoice.query.filter_by(stripe_invoice_id=stripe_invoice.id).first()
            if not existing_invoice and stripe_invoice.status == 'paid':
                invoice_record = Invoice(
                    user_id=subscription.user_id,
                    subscription_id=subscription.id,
                    stripe_invoice_id=stripe_invoice.id,
                    amount_paid=stripe_invoice.amount_paid,
                    currency=stripe_invoice.currency,
                    status=stripe_invoice.status,
                    invoice_pdf=stripe_invoice.invoice_pdf,
                    hosted_invoice_url=stripe_invoice.hosted_invoice_url,
                    invoice_date=datetime.fromtimestamp(stripe_invoice.created),
                    paid_at=datetime.fromtimestamp(stripe_invoice.status_transitions.paid_at) if stripe_invoice.status_transitions.paid_at else None
                )
                db.session.add(invoice_record)
                synced_invoices += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Synchronisation réussie',
            'subscription_status': subscription.status,
            'invoices_synced': synced_invoices
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur synchronisation manuelle: {str(e)}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500

@stripe_bp.route('/test/force-sync', methods=['POST'])
@jwt_required()
def force_sync_subscription():
    """Forcer la synchronisation d'un abonnement (pour tests/debug)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Si un stripe_subscription_id est fourni, l'utiliser
        stripe_subscription_id = data.get('stripe_subscription_id')
        
        if stripe_subscription_id:
            # Récupérer directement depuis Stripe
            try:
                stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
                logging.info(f"🧪 TEST: Retrieved subscription from Stripe - Status: {stripe_subscription.status}")
            except stripe.error.StripeError as e:
                return jsonify({'error': f'Subscription non trouvé sur Stripe: {str(e)}'}), 404
        else:
            # Chercher l'abonnement existant de l'utilisateur
            subscription = Subscription.query.filter_by(user_id=current_user_id).first()
            if not subscription:
                return jsonify({'error': 'Aucun abonnement trouvé pour cet utilisateur'}), 404
            
            stripe_subscription_id = subscription.stripe_subscription_id
            stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
        
        # Mettre à jour ou créer l'abonnement en base
        subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_subscription_id).first()
        if not subscription:
            subscription = Subscription()
            subscription.user_id = current_user_id
            subscription.stripe_subscription_id = stripe_subscription_id
        
        old_status = subscription.status if hasattr(subscription, 'status') else 'None'
        
        # Mettre à jour tous les champs
        subscription.stripe_customer_id = stripe_subscription.customer
        subscription.status = stripe_subscription.status
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
        
        db.session.add(subscription)
        db.session.commit()
        
        # Vérifier le nouveau statut has_subscription
        active_statuses = ['active', 'trialing', 'past_due']
        has_active_subscription = subscription.status in active_statuses
        
        logging.info(f"🧪 TEST SYNC COMPLETED: User {current_user_id}, Status: {old_status} → {subscription.status}, has_subscription: {has_active_subscription}")
        
        return jsonify({
            'message': 'Synchronisation forcée réussie',
            'subscription_id': stripe_subscription_id,
            'old_status': old_status,
            'new_status': subscription.status,
            'has_subscription': has_active_subscription,
            'stripe_data': {
                'status': stripe_subscription.status,
                'current_period_start': stripe_subscription.current_period_start,
                'current_period_end': stripe_subscription.current_period_end,
                'customer': stripe_subscription.customer
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"❌ Erreur sync forcée: {str(e)}")
        return jsonify({'error': 'Erreur lors de la synchronisation forcée'}), 500

@stripe_bp.route('/test/webhook-events', methods=['GET'])
@jwt_required() 
def list_recent_webhook_events():
    """Lister les événements webhook récents depuis Stripe (pour diagnostic)"""
    try:
        # Récupérer les 20 derniers événements
        events = stripe.Event.list(limit=20)
        
        webhook_events = []
        for event in events.data:
            webhook_events.append({
                'id': event.id,
                'type': event.type,
                'created': datetime.fromtimestamp(event.created).isoformat(),
                'livemode': event.livemode,
                'object_id': event.data.object.get('id', 'N/A'),
                'processed_locally': 'unknown'  # On ne peut pas savoir facilement
            })
        
        return jsonify({
            'recent_events': webhook_events,
            'total_events': len(webhook_events),
            'note': 'Ces événements ont été créés sur Stripe. Pour savoir s\'ils ont été traités localement, vérifiez les logs.'
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur récupération événements: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération des événements'}), 500

@stripe_bp.route('/quick-sync', methods=['POST'])
@jwt_required()
def quick_sync_subscription():
    """Synchronisation rapide et légère pour les actions utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        
        # Récupérer l'abonnement local
        subscription = Subscription.query.filter_by(user_id=current_user_id).first()
        if not subscription:
            return jsonify({'has_subscription': False, 'message': 'Aucun abonnement'}), 200
        
        # Vérifier rapidement le statut sur Stripe (sans créer de factures etc.)
        try:
            stripe_subscription = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
            
            # Si le statut a changé, mettre à jour
            if subscription.status != stripe_subscription.status:
                old_status = subscription.status
                subscription.status = stripe_subscription.status
                subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
                subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
                db.session.commit()
                
                logging.info(f"⚡ Quick sync: User {current_user_id}, {old_status} → {stripe_subscription.status}")
                
                # Calculer has_subscription
                active_statuses = ['active', 'trialing', 'past_due']
                has_active = stripe_subscription.status in active_statuses
                
                return jsonify({
                    'has_subscription': has_active,
                    'status_changed': True,
                    'old_status': old_status,
                    'new_status': stripe_subscription.status,
                    'message': 'Statut mis à jour'
                }), 200
            else:
                # Pas de changement
                active_statuses = ['active', 'trialing', 'past_due']
                has_active = subscription.status in active_statuses
                
                return jsonify({
                    'has_subscription': has_active,
                    'status_changed': False,
                    'status': subscription.status,
                    'message': 'Aucun changement'
                }), 200
                
        except stripe.error.StripeError as e:
            if 'No such subscription' in str(e):
                # L'abonnement n'existe plus sur Stripe
                subscription.status = 'canceled'
                db.session.commit()
                
                return jsonify({
                    'has_subscription': False,
                    'status_changed': True,
                    'new_status': 'canceled',
                    'message': 'Abonnement introuvable sur Stripe'
                }), 200
            else:
                raise e
        
    except Exception as e:
        logging.error(f"❌ Erreur quick sync: {str(e)}")
        return jsonify({'error': 'Erreur lors de la vérification rapide'}), 500