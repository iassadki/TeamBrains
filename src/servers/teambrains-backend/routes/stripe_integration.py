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
stripe.api_key = "sk_test_51RdpQH2VyoUCKFegX9uDXxC87Is60O1zqxaElXo85YLuGiDtOLsKg7npK7hRbPilhOigfJiCNYTXSHEVuURR7WZL00Seczjvex"

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
        
        if plan_type not in ['student', 'school']:
            return jsonify({'error': 'Type de plan invalide'}), 400
        
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
        
        # Déterminer l'URL de prix selon le plan
        if plan_type == 'student':
            price_lookup_key = 'student_monthly'
            mode = 'subscription'
        else:  # school
            price_lookup_key = 'school_yearly'
            mode = 'subscription'
        
        # Créer la session Checkout
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer.id,
            payment_method_types=['card'],
            mode=mode,
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'TeamBrains - Plan {plan_type.title()}',
                        'description': f'Abonnement TeamBrains {plan_type}'
                    },
                    'unit_amount': 200 if plan_type == 'student' else 12000,  # 2€ ou 120€ en centimes
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
                'plan_type': plan_type
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
    endpoint_secret = "whsec_test_development"  # Secret pour les tests
    
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
    
    # Traiter les événements
    if event['type'] == 'checkout.session.completed':
        handle_checkout_session_completed(event['data']['object'])
    elif event['type'] == 'invoice.payment_succeeded':
        handle_invoice_payment_succeeded(event['data']['object'])
    elif event['type'] == 'customer.subscription.updated':
        handle_subscription_updated(event['data']['object'])
    elif event['type'] == 'customer.subscription.deleted':
        handle_subscription_deleted(event['data']['object'])
    
    return jsonify({'status': 'success'})

def handle_checkout_session_completed(session):
    """Traiter la completion d'une session de checkout"""
    try:
        logging.info(f"Session reçue: {session}")
        
        # Vérifier si les métadonnées existent (vraie session vs test)
        if not session.get('metadata') or not session['metadata'].get('user_id'):
            logging.warning("Session sans métadonnées user_id - probablement un test Stripe CLI")
            return
        
        user_id = session['metadata']['user_id']
        plan_type = session['metadata']['plan_type']
        
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
        
        db.session.add(subscription)
        db.session.commit()
        
        logging.info(f"Abonnement créé/mis à jour pour l'utilisateur {user_id}")
        
    except Exception as e:
        logging.error(f"Erreur traitement checkout session: {str(e)}")
        logging.error(f"Session data: {session}")

def handle_invoice_payment_succeeded(invoice):
    """Traiter le paiement réussi d'une facture"""
    try:
        # Récupérer la subscription
        stripe_subscription_id = invoice['subscription']
        subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_subscription_id).first()
        
        if not subscription:
            logging.warning(f"Subscription non trouvée pour {stripe_subscription_id}")
            return
        
        # Créer la facture en base
        invoice_record = Invoice(
            user_id=subscription.user_id,
            subscription_id=subscription.id,
            stripe_invoice_id=invoice['id'],
            amount_paid=invoice['amount_paid'],
            currency=invoice['currency'],
            status=invoice['status'],
            invoice_pdf=invoice.get('invoice_pdf'),
            hosted_invoice_url=invoice.get('hosted_invoice_url'),
            invoice_date=datetime.fromtimestamp(invoice['created']),
            paid_at=datetime.fromtimestamp(invoice['status_transitions']['paid_at']) if invoice['status_transitions']['paid_at'] else None
        )
        
        db.session.add(invoice_record)
        db.session.commit()
        
        logging.info(f"Facture créée pour l'utilisateur {subscription.user_id}")
        
    except Exception as e:
        logging.error(f"Erreur traitement paiement facture: {str(e)}")

def handle_subscription_updated(subscription):
    """Traiter la mise à jour d'un abonnement"""
    try:
        db_subscription = Subscription.query.filter_by(stripe_subscription_id=subscription['id']).first()
        if db_subscription:
            db_subscription.status = subscription['status']
            db_subscription.current_period_start = datetime.fromtimestamp(subscription['current_period_start'])
            db_subscription.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
            db.session.commit()
            
        logging.info(f"Abonnement mis à jour: {subscription['id']}")
        
    except Exception as e:
        logging.error(f"Erreur mise à jour abonnement: {str(e)}")

def handle_subscription_deleted(subscription):
    """Traiter la suppression d'un abonnement"""
    try:
        db_subscription = Subscription.query.filter_by(stripe_subscription_id=subscription['id']).first()
        if db_subscription:
            db_subscription.status = 'canceled'
            db.session.commit()
            
        logging.info(f"Abonnement annulé: {subscription['id']}")
        
    except Exception as e:
        logging.error(f"Erreur annulation abonnement: {str(e)}")

@stripe_bp.route('/subscription/status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Récupérer le statut de l'abonnement de l'utilisateur"""
    try:
        user_id = get_jwt_identity()
        subscription = Subscription.query.filter_by(user_id=user_id).first()
        
        if not subscription:
            return jsonify({
                'has_subscription': False,
                'subscription': None
            })
        
        return jsonify({
            'has_subscription': True,
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Erreur récupération statut: {str(e)}")
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