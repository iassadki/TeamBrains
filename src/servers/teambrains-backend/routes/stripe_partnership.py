from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Subscription, School, Invoice
import stripe
import os
from datetime import datetime, timedelta
import logging

# Configuration Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

stripe_partnership_bp = Blueprint('stripe_partnership', __name__, url_prefix='/api/partnership/stripe')

@stripe_partnership_bp.route('/create-school-subscription', methods=['POST'])
@jwt_required()
def create_school_subscription():
    """Créer un abonnement école simplifié - 5€ par étudiant/mois"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin':
            return jsonify({'error': 'Accès non autorisé - Admin école requis'}), 403
        
        if not user.school_id:
            return jsonify({'error': 'Aucune école associée à ce compte'}), 400
        
        data = request.get_json()
        student_count = data.get('student_count', 1)
        
        # Convertir en entier et valider
        try:
            student_count = int(student_count)
        except (ValueError, TypeError):
            return jsonify({'error': 'Le nombre d\'étudiants doit être un nombre valide'}), 400
        
        if student_count < 1:
            return jsonify({'error': 'Le nombre d\'étudiants doit être d\'au moins 1'}), 400
        
        # Vérifier qu'il n'y a pas déjà un abonnement actif
        existing_subscription = Subscription.query.filter_by(
            school_id=user.school_id,
            plan_type='school'
        ).first()
        
        if existing_subscription and existing_subscription.status in ['active', 'trialing']:
            return jsonify({'error': 'Cette école a déjà un abonnement actif'}), 400
        
        # Créer ou récupérer le customer Stripe
        stripe_customer = None
        if existing_subscription and existing_subscription.stripe_customer_id:
            try:
                stripe_customer = stripe.Customer.retrieve(existing_subscription.stripe_customer_id)
            except stripe.error.StripeError:
                stripe_customer = None
        
        if not stripe_customer:
            stripe_customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.school.name} - {user.prenom} {user.nom}",
                metadata={
                    'user_id': user.id,
                    'school_id': user.school_id,
                    'school_name': user.school.name,
                    'plan_type': 'school_partnership'
                }
            )
        
        # Calculer le prix : 5€ par étudiant par mois
        monthly_amount = student_count * 500  # 5€ = 500 centimes
        
        # Créer la session Checkout pour l'abonnement mensuel
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer.id,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'TeamBrains - Plan École Partenariat ({student_count} étudiant(s))',
                        'metadata': {
                            'school_name': user.school.name,
                            'student_count': str(student_count)
                        }
                    },
                    'unit_amount': monthly_amount,
                    'recurring': {
                        'interval': 'month'
                    }
                },
                'quantity': 1,
            }],
            success_url=f"http://localhost:5173/partenariat-ecole/dashboard?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"http://localhost:5173/partenariat-ecole/abonnement?canceled=true",
            metadata={
                'user_id': user.id,
                'school_id': str(user.school_id),
                'plan_type': 'school_partnership',
                'student_count': str(student_count),
                'monthly_amount': str(monthly_amount)
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'amount_preview': {
                'student_count': student_count,
                'price_per_student': 5.00,
                'monthly_total': monthly_amount / 100,
                'yearly_total': (monthly_amount * 12) / 100
            }
        })
        
    except Exception as e:
        logging.error(f"Erreur création abonnement école partenariat: {str(e)}")
        return jsonify({'error': 'Erreur lors de la création de l\'abonnement'}), 500

@stripe_partnership_bp.route('/webhook', methods=['POST'])
def stripe_partnership_webhook():
    """Webhook Stripe pour l'espace partenariat écoles"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    # Endpoint secret pour l'espace partenariat
    endpoint_secret = os.getenv('STRIPE_PARTNERSHIP_WEBHOOK_SECRET')
    
    if not endpoint_secret:
        logging.error("STRIPE_PARTNERSHIP_WEBHOOK_SECRET non configuré")
        return jsonify({'error': 'Configuration manquante'}), 500
    
    if not sig_header:
        logging.error("Signature Stripe manquante")
        return jsonify({'error': 'Signature manquante'}), 400
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        logging.error("Payload JSON invalide")
        return jsonify({'error': 'Payload invalide'}), 400
    except stripe.error.SignatureVerificationError:
        logging.error("Signature webhook invalide")
        return jsonify({'error': 'Signature invalide'}), 400
    
    # Traiter les événements
    if event['type'] == 'checkout.session.completed':
        handle_partnership_checkout_completed(event['data']['object'])
    elif event['type'] == 'invoice.payment_succeeded':
        handle_partnership_payment_succeeded(event['data']['object'])
    elif event['type'] == 'invoice.payment_failed':
        handle_partnership_payment_failed(event['data']['object'])
    elif event['type'] == 'customer.subscription.updated':
        handle_partnership_subscription_updated(event['data']['object'])
    elif event['type'] == 'customer.subscription.deleted':
        handle_partnership_subscription_deleted(event['data']['object'])
    
    return jsonify({'status': 'success'}), 200

def handle_partnership_checkout_completed(session):
    """Traiter la completion d'une session de checkout partenariat"""
    try:
        logging.info(f"Session partenariat reçue: {session}")
        
        # Vérifier les métadonnées
        if not session.get('metadata') or not session['metadata'].get('user_id'):
            logging.warning("Session sans métadonnées user_id")
            return
        
        user_id = session['metadata']['user_id']
        school_id = int(session['metadata']['school_id'])
        student_count = int(session['metadata']['student_count'])
        monthly_amount = int(session['metadata']['monthly_amount'])
        
        # Récupérer la subscription Stripe
        if not session.get('subscription'):
            logging.warning("Session sans subscription ID")
            return
        
        stripe_subscription = stripe.Subscription.retrieve(session['subscription'])
        
        # Créer ou mettre à jour l'abonnement en base
        subscription = Subscription.query.filter_by(school_id=school_id).first()
        if not subscription:
            subscription = Subscription()
        
        subscription.user_id = user_id
        subscription.school_id = school_id
        subscription.stripe_subscription_id = stripe_subscription.id
        subscription.stripe_customer_id = session['customer']
        subscription.plan_type = 'school_partnership'
        subscription.status = stripe_subscription.status
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
        
        # Paramètres spécifiques au plan partenariat
        subscription.current_student_count = student_count
        subscription.student_price_per_month = 500  # 5€ en centimes
        subscription.total_monthly_amount = monthly_amount
        subscription.last_student_count_update = datetime.utcnow()
        
        db.session.add(subscription)
        db.session.commit()
        
        logging.info(f"Abonnement partenariat créé pour l'école {school_id} avec {student_count} étudiants")
        
    except Exception as e:
        logging.error(f"Erreur traitement checkout partenariat: {str(e)}")

def handle_partnership_payment_succeeded(invoice):
    """Traiter le paiement réussi d'une facture partenariat"""
    try:
        logging.info(f"Paiement partenariat réussi: {invoice['id']}")
        
        # Réinitialiser les compteurs d'échec si nécessaire
        if invoice.get('subscription'):
            subscription = Subscription.query.filter_by(
                stripe_subscription_id=invoice['subscription']
            ).first()
            
            if subscription:
                subscription.payment_failed_count = 0
                subscription.last_payment_failed_at = None
                subscription.payment_method_action_required = False
                db.session.commit()
                
    except Exception as e:
        logging.error(f"Erreur traitement paiement partenariat réussi: {str(e)}")

def handle_partnership_payment_failed(invoice):
    """Traiter l'échec de paiement d'une facture partenariat"""
    try:
        logging.warning(f"Échec paiement partenariat: {invoice['id']}")
        
        if invoice.get('subscription'):
            subscription = Subscription.query.filter_by(
                stripe_subscription_id=invoice['subscription']
            ).first()
            
            if subscription:
                subscription.payment_failed_count = (subscription.payment_failed_count or 0) + 1
                subscription.last_payment_failed_at = datetime.utcnow()
                subscription.unpaid_invoice_id = invoice['id']
                db.session.commit()
                
    except Exception as e:
        logging.error(f"Erreur traitement échec paiement partenariat: {str(e)}")

def handle_partnership_subscription_updated(stripe_subscription):
    """Traiter la mise à jour d'un abonnement partenariat"""
    try:
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=stripe_subscription['id']
        ).first()
        
        if subscription:
            subscription.status = stripe_subscription['status']
            subscription.current_period_start = datetime.fromtimestamp(stripe_subscription['current_period_start'])
            subscription.current_period_end = datetime.fromtimestamp(stripe_subscription['current_period_end'])
            db.session.commit()
            
    except Exception as e:
        logging.error(f"Erreur mise à jour abonnement partenariat: {str(e)}")

def handle_partnership_subscription_deleted(stripe_subscription):
    """Traiter la suppression d'un abonnement partenariat"""
    try:
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=stripe_subscription['id']
        ).first()
        
        if subscription:
            subscription.status = 'canceled'
            db.session.commit()
            
    except Exception as e:
        logging.error(f"Erreur suppression abonnement partenariat: {str(e)}")

@stripe_partnership_bp.route('/subscription/update-student-count', methods=['POST'])
@jwt_required()
def update_partnership_student_count():
    """Mettre à jour le nombre d'étudiants pour l'abonnement partenariat"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        new_student_count = data.get('student_count')
        
        # Convertir en entier et valider
        try:
            new_student_count = int(new_student_count)
        except (ValueError, TypeError):
            return jsonify({'error': 'Le nombre d\'étudiants doit être un nombre valide'}), 400
        
        if new_student_count is None or new_student_count < 1:
            return jsonify({'error': 'Nombre d\'étudiants invalide'}), 400
        
        # Récupérer l'abonnement
        subscription = Subscription.query.filter_by(
            school_id=user.school_id,
            plan_type='school_partnership'
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement trouvé'}), 404
        
        # Calculer le nouveau montant (5€ par étudiant/mois)
        new_monthly_amount = new_student_count * 500
        old_count = subscription.current_student_count
        
        # Mettre à jour localement
        subscription.current_student_count = new_student_count
        subscription.total_monthly_amount = new_monthly_amount
        subscription.last_student_count_update = datetime.utcnow()
        
        # Si l'abonnement Stripe est actif, le mettre à jour
        if subscription.stripe_subscription_id and subscription.status == 'active':
            try:
                stripe_subscription = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
                
                # Créer un nouveau prix pour le nouveau montant
                new_price = stripe.Price.create(
                    currency='eur',
                    unit_amount=new_monthly_amount,
                    recurring={'interval': 'month'},
                    product_data={
                        'name': f'TeamBrains - Plan École Partenariat ({new_student_count} étudiant(s))',
                        'metadata': {
                            'school_name': user.school.name,
                            'student_count': str(new_student_count)
                        }
                    }
                )
                
                # Mettre à jour l'abonnement avec le nouveau prix
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    items=[{
                        'id': stripe_subscription['items']['data'][0]['id'],
                        'price': new_price.id
                    }],
                    proration_behavior='always_invoice'
                )
                
            except stripe.error.StripeError as e:
                logging.error(f"Erreur mise à jour Stripe partenariat: {str(e)}")
                # Continuer même si Stripe échoue
        
        db.session.commit()
        
        return jsonify({
            'message': 'Nombre d\'étudiants mis à jour avec succès',
            'old_student_count': old_count,
            'new_student_count': new_student_count,
            'monthly_amount_euros': new_monthly_amount / 100,
            'yearly_amount_euros': (new_monthly_amount * 12) / 100,
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Erreur mise à jour nombre étudiants partenariat: {str(e)}")
        return jsonify({'error': 'Erreur lors de la mise à jour'}), 500

@stripe_partnership_bp.route('/subscription/status', methods=['GET'])
@jwt_required()
def get_partnership_subscription_status():
    """Obtenir le statut de l'abonnement partenariat"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        subscription = Subscription.query.filter_by(
            school_id=user.school_id,
            plan_type='school_partnership'
        ).first()
        
        # Aucun abonnement en base
        if not subscription:
            return jsonify({
                'has_subscription': False,
                'school': user.school.to_dict()
            })
        
        # Vérifier si l'abonnement école est actif
        active_statuses = ['active', 'trialing', 'past_due']
        has_active_subscription = subscription.status in active_statuses
        
        # Log pour debug
        logging.info(f"🔍 School {user.school_id} - Subscription status: {subscription.status}, has_active: {has_active_subscription}")
        
        return jsonify({
            'has_subscription': has_active_subscription,
            'subscription': subscription.to_dict(),
            'school': user.school.to_dict(),
            'debug_info': {
                'subscription_exists': True,
                'status': subscription.status,
                'is_active': has_active_subscription
            }
        })
        
    except Exception as e:
        logging.error(f"Erreur récupération statut abonnement partenariat: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération du statut'}), 500

@stripe_partnership_bp.route('/test/sync-subscription', methods=['POST'])
@jwt_required()
def sync_subscription_from_stripe():
    """Synchroniser un abonnement depuis Stripe (pour debug)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin':
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'session_id requis'}), 400
        
        # Récupérer la session depuis Stripe
        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            return jsonify({'error': f'Session Stripe non trouvée: {str(e)}'}), 404
        
        # Traiter manuellement la session comme si le webhook avait été appelé
        handle_partnership_checkout_completed(session)
        
        return jsonify({
            'message': 'Synchronisation effectuée',
            'session_id': session_id,
            'subscription_id': session.get('subscription')
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur sync abonnement: {str(e)}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500

@stripe_partnership_bp.route('/setup-billing-portal', methods=['POST'])
@jwt_required()
def setup_billing_portal():
    """Configurer le portail de facturation Stripe (une seule fois)"""
    try:
        # Créer une configuration de base pour le portail client
        configuration = stripe.billing_portal.Configuration.create(
            business_profile={
                'headline': 'TeamBrains - Gestion de votre abonnement école',
            },
            features={
                'payment_method_update': {
                    'enabled': True,
                },
                'subscription_cancel': {
                    'enabled': True,
                    'mode': 'at_period_end',
                },
                'subscription_update': {
                    'enabled': True,
                    'default_allowed_updates': ['price'],
                    'proration_behavior': 'create_prorations',
                },
                'invoice_history': {
                    'enabled': True,
                },
            },
        )
        
        return jsonify({
            'message': 'Configuration du portail créée avec succès',
            'configuration_id': configuration.id
        })
        
    except Exception as e:
        logging.error(f"Erreur configuration portail: {str(e)}")
        return jsonify({'error': 'Erreur lors de la configuration du portail'}), 500

@stripe_partnership_bp.route('/create-billing-portal', methods=['POST'])
@jwt_required()
def create_billing_portal():
    """Créer une session de portail de facturation Stripe"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.school:
            return jsonify({'error': 'Utilisateur ou école non trouvé'}), 404
        
        # Vérifier qu'il y a un abonnement
        subscription = Subscription.query.filter_by(school_id=user.school_id).first()
        if not subscription or not subscription.stripe_customer_id:
            return jsonify({'error': 'Aucun abonnement actif trouvé. Veuillez d\'abord créer un abonnement.'}), 404
        
        try:
            # Créer la session du portail de facturation
            portal_session = stripe.billing_portal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url='http://localhost:5173/partenariat-ecole/dashboard?tab=subscription'
            )
            
            return jsonify({
                'url': portal_session.url
            })
            
        except stripe.error.InvalidRequestError as e:
            if 'No configuration provided' in str(e):
                return jsonify({
                    'error': 'Le portail de facturation n\'est pas configuré. Veuillez configurer le portail dans votre dashboard Stripe : https://dashboard.stripe.com/test/settings/billing/portal',
                    'setup_required': True
                }), 400
            else:
                raise e
        
    except Exception as e:
        logging.error(f"Erreur création portail facturation: {str(e)}")
        return jsonify({'error': 'Erreur lors de la création du portail de facturation'}), 500

@stripe_partnership_bp.route('/test/create-subscription', methods=['POST'])
@jwt_required()
def create_test_subscription():
    """Endpoint de test pour créer un abonnement sans passer par Stripe"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Vérifier s'il existe déjà un abonnement
        existing_sub = Subscription.query.filter_by(school_id=user.school_id).first()
        if existing_sub:
            return jsonify({'error': 'Un abonnement existe déjà pour cette école'}), 400
        
        data = request.get_json() or {}
        student_count = data.get('student_count', 10)
        
        # Créer l'abonnement de test
        subscription = Subscription()
        subscription.user_id = user.id
        subscription.school_id = user.school_id
        subscription.stripe_subscription_id = f"sub_test_{user.school_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        subscription.stripe_customer_id = f"cus_test_{user.school_id}"
        subscription.plan_type = 'school_partnership'
        subscription.status = 'active'
        
        # Dates
        now = datetime.utcnow()
        subscription.current_period_start = now
        subscription.current_period_end = now + timedelta(days=30)
        
        # Paramètres spécifiques au plan partenariat
        subscription.current_student_count = student_count
        subscription.student_price_per_month = 500  # 5€ en centimes
        subscription.total_monthly_amount = student_count * 500
        subscription.last_student_count_update = now
        
        # Sauvegarder
        db.session.add(subscription)
        db.session.commit()
        
        return jsonify({
            'message': 'Abonnement de test créé avec succès',
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        logging.error(f"Erreur création abonnement test: {str(e)}")
        return jsonify({'error': 'Erreur lors de la création de l\'abonnement de test'}), 500

@stripe_partnership_bp.route('/sync-subscription', methods=['POST'])
@jwt_required()
def manual_sync_partnership_subscription():
    """Synchronisation manuelle de l'abonnement école depuis Stripe"""
    try:
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(current_user_id)
        
        if not admin_user or admin_user.role != 'school_admin' or not admin_user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Récupérer l'abonnement de l'école
        subscription = Subscription.query.filter_by(school_id=admin_user.school_id).first()
        if not subscription:
            return jsonify({'error': 'Aucun abonnement trouvé pour cette école'}), 404
        
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
            'message': 'Synchronisation école réussie',
            'subscription_status': subscription.status,
            'invoices_synced': synced_invoices,
            'student_count': subscription.current_student_count,
            'monthly_amount': subscription.total_monthly_amount
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur synchronisation école: {str(e)}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500 