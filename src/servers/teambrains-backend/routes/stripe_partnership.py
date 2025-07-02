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
    """Créer un abonnement école simplifié - 5€ par étudiant/mois - CORRIGÉ"""
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
            plan_type='school_partnership'
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
                    'user_id': str(user.id),  # CRITIQUE: Toujours en string
                    'school_id': str(user.school_id),
                    'school_name': user.school.name,
                    'plan_type': 'school_partnership',
                    'admin_email': user.email,  # Ajout pour sécurité
                    'student_count': str(student_count)
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
                'user_id': str(user.id),  # CRITIQUE: Toujours en string
                'school_id': str(user.school_id),
                'plan_type': 'school_partnership',
                'student_count': str(student_count),
                'monthly_amount': str(monthly_amount),
                'user_email': user.email,  # Ajout pour sécurité
                'school_name': user.school.name
            }
        )
        
        logging.info(f"🎯 SCHOOL SESSION CREATED: {checkout_session.id} for school {user.school_id} by user {user.id} ({user.email})")
        
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
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Erreur lors de la création de l\'abonnement'}), 500

@stripe_partnership_bp.route('/webhook', methods=['POST'])
def stripe_partnership_webhook():
    """Webhook Stripe pour l'espace partenariat écoles - CORRIGÉ"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    # Endpoint secret pour l'espace partenariat
    endpoint_secret = os.getenv('STRIPE_PARTNERSHIP_WEBHOOK_SECRET')
    
    # Mode Docker/développement avec secret fixe
    if not endpoint_secret:
        endpoint_secret = 'whsec_partnership_dev_fixed_secret_456'
        logging.info("🐋 Utilisation du secret webhook partenariat Docker fixe")
    
    if not endpoint_secret:
        logging.error("STRIPE_PARTNERSHIP_WEBHOOK_SECRET non configuré")
        return jsonify({'error': 'Configuration manquante'}), 500
    
    if not sig_header:
        logging.error("Signature Stripe manquante")
        return jsonify({'error': 'Signature manquante'}), 400
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        logging.info(f"🎯 PARTNERSHIP WEBHOOK: {event['type']}")
    except ValueError:
        logging.error("Payload JSON invalide")
        return jsonify({'error': 'Payload invalide'}), 400
    except stripe.error.SignatureVerificationError:
        logging.error("Signature webhook invalide")
        return jsonify({'error': 'Signature invalide'}), 400
    
    # Traiter les événements
    try:
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
        else:
            logging.info(f"ℹ️ PARTNERSHIP WEBHOOK IGNORED: {event['type']}")
        
        logging.info(f"✅ PARTNERSHIP WEBHOOK COMPLETED: {event['type']}")
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        logging.error(f"❌ PARTNERSHIP WEBHOOK ERROR: {event['type']} failed - {str(e)}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'status': 'error', 'message': str(e)}), 200

def handle_partnership_checkout_completed(session):
    """Traiter la completion d'une session de checkout partenariat - CORRIGÉ"""
    try:
        logging.info(f"✅ PARTNERSHIP WEBHOOK: Session checkout completed - ID: {session.get('id')}")
        logging.info(f"📋 Session metadata: {session.get('metadata', {})}")
        logging.info(f"👤 Customer ID: {session.get('customer')}")
        
        # NOUVELLE APPROCHE: Recherche multi-critères pour identifier l'utilisateur et l'école
        user_id = None
        user = None
        school_id = None
        
        # 1. Essayer avec les métadonnées directes
        if session.get('metadata') and session['metadata'].get('user_id'):
            try:
                user_id = int(session['metadata']['user_id'])
                user = User.query.get(user_id)
                if user:
                    logging.info(f"✅ Utilisateur trouvé via métadonnées: {user.id} ({user.email})")
                    school_id = int(session['metadata'].get('school_id', 0)) or user.school_id
                else:
                    logging.warning(f"⚠️ User ID {user_id} des métadonnées non trouvé en base")
            except (ValueError, TypeError):
                logging.error(f"❌ User/School ID invalide dans métadonnées")
                user_id = None
        
        # 2. Si pas trouvé, rechercher par customer email
        if not user:
            customer_id = session.get('customer')
            if customer_id:
                try:
                    customer = stripe.Customer.retrieve(customer_id)
                    customer_email = customer.email
                    
                    # Rechercher l'utilisateur par email
                    user = User.query.filter_by(email=customer_email).first()
                    if user:
                        user_id = user.id
                        school_id = user.school_id
                        logging.info(f"✅ Utilisateur trouvé via customer email: {user.id} ({user.email})")
                    else:
                        logging.error(f"❌ Aucun utilisateur trouvé pour email: {customer_email}")
                        return
                        
                except stripe.error.StripeError as e:
                    logging.error(f"❌ Erreur récupération customer {customer_id}: {str(e)}")
                    return
            else:
                logging.error("❌ Pas de customer_id disponible")
                return
        
        # 3. Si toujours pas trouvé, essayer par abonnement existant
        if not user:
            existing_subscription = Subscription.query.filter_by(stripe_customer_id=session.get('customer')).first()
            if existing_subscription:
                user = User.query.get(existing_subscription.user_id)
                if user:
                    user_id = user.id
                    school_id = existing_subscription.school_id or user.school_id
                    logging.info(f"✅ Utilisateur trouvé via abonnement existant: {user.id} ({user.email})")
        
        if not user or not user_id or not school_id:
            logging.error("❌ IMPOSSIBLE DE TROUVER L'UTILISATEUR/ÉCOLE - Session abandonnée")
            return
        
        # Récupérer les métadonnées
        metadata = session.get('metadata', {})
        student_count = int(metadata.get('student_count', 1))
        monthly_amount = int(metadata.get('monthly_amount', student_count * 500))
        
        # Vérifier si la session a une subscription
        if not session.get('subscription'):
            logging.warning("⚠️ Session sans subscription ID")
            return
        
        stripe_subscription = stripe.Subscription.retrieve(session['subscription'])
        logging.info(f"📊 Stripe subscription: {stripe_subscription.id}, status: {stripe_subscription.status}")
        
        # Vérifier si l'abonnement existe déjà par stripe_subscription_id (gestion des doublons)
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=stripe_subscription.id
        ).first()
        
        if subscription:
            # Abonnement existe déjà, on met à jour
            logging.info(f"🔄 Abonnement Stripe existant détecté: {stripe_subscription.id}, mise à jour")
            action = "mis à jour"
            
            # Mettre à jour les informations
            subscription.user_id = user_id
            subscription.school_id = school_id
            subscription.status = stripe_subscription.status
            subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
            subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
            subscription.current_student_count = student_count
            subscription.total_monthly_amount = monthly_amount
            subscription.last_student_count_update = datetime.utcnow()
        else:
            # Créer un nouvel abonnement
            logging.info(f"➕ Création nouvel abonnement partenariat pour école {school_id}")
            action = "créé"
            
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
        
        logging.info(f"✅ PARTNERSHIP WEBHOOK SUCCESS: Abonnement partenariat {action} pour l'école {school_id} avec {student_count} étudiants par user {user_id} ({user.email})")
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"❌ PARTNERSHIP WEBHOOK ERROR - Checkout session: {str(e)}")
        logging.error(f"Session data: {session}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")

def handle_partnership_payment_succeeded(invoice):
    """Traiter le paiement réussi d'une facture partenariat"""
    try:
        logging.info(f"💰 PARTNERSHIP WEBHOOK: Invoice payment succeeded - ID: {invoice['id']}")
        
        # Réinitialiser les compteurs d'échec si nécessaire
        if invoice.get('subscription'):
            subscription = Subscription.query.filter_by(
                stripe_subscription_id=invoice['subscription'],
                plan_type='school_partnership'
            ).first()
            
            if subscription:
                subscription.payment_failed_count = 0
                subscription.last_payment_failed_at = None
                subscription.payment_method_action_required = False
                subscription.unpaid_invoice_id = None
                db.session.commit()
                logging.info(f"✅ Paiement réussi pour école {subscription.school_id}")
                
    except Exception as e:
        logging.error(f"Erreur traitement paiement partenariat réussi: {str(e)}")

def handle_partnership_payment_failed(invoice):
    """Traiter l'échec de paiement d'une facture partenariat"""
    try:
        logging.warning(f"❌ PARTNERSHIP WEBHOOK: Échec paiement - Invoice: {invoice['id']}")
        
        if invoice.get('subscription'):
            subscription = Subscription.query.filter_by(
                stripe_subscription_id=invoice['subscription'],
                plan_type='school_partnership'
            ).first()
            
            if subscription:
                subscription.payment_failed_count = (subscription.payment_failed_count or 0) + 1
                subscription.last_payment_failed_at = datetime.utcnow()
                subscription.unpaid_invoice_id = invoice['id']
                
                # Suspendre après 3 échecs
                if subscription.payment_failed_count >= 3:
                    subscription.status = 'past_due'
                    logging.warning(f"⚠️ École {subscription.school_id} suspendue après 3 échecs")
                
                db.session.commit()
                
    except Exception as e:
        logging.error(f"Erreur traitement échec paiement partenariat: {str(e)}")

def handle_partnership_subscription_updated(stripe_subscription):
    """Traiter la mise à jour d'un abonnement partenariat"""
    try:
        logging.info(f"🔄 PARTNERSHIP WEBHOOK: Subscription updated - ID: {stripe_subscription['id']}")
        
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=stripe_subscription['id'],
            plan_type='school_partnership'
        ).first()
        
        if subscription:
            old_status = subscription.status
            subscription.status = stripe_subscription['status']
            subscription.current_period_start = datetime.fromtimestamp(stripe_subscription['current_period_start'])
            subscription.current_period_end = datetime.fromtimestamp(stripe_subscription['current_period_end'])
            db.session.commit()
            
            logging.info(f"✅ École {subscription.school_id}: {old_status} → {stripe_subscription['status']}")
            
    except Exception as e:
        logging.error(f"Erreur mise à jour abonnement partenariat: {str(e)}")

def handle_partnership_subscription_deleted(stripe_subscription):
    """Traiter la suppression d'un abonnement partenariat"""
    try:
        logging.info(f"🚫 PARTNERSHIP WEBHOOK: Subscription deleted - ID: {stripe_subscription['id']}")
        
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=stripe_subscription['id'],
            plan_type='school_partnership'
        ).first()
        
        if subscription:
            old_status = subscription.status
            subscription.status = 'canceled'
            subscription.payment_failed_count = 0
            subscription.payment_method_action_required = False
            subscription.unpaid_invoice_id = None
            db.session.commit()
            
            logging.info(f"✅ École {subscription.school_id} annulée: {old_status} → canceled")
            
    except Exception as e:
        logging.error(f"Erreur suppression abonnement partenariat: {str(e)}")

@stripe_partnership_bp.route('/test/sync-subscription', methods=['POST'])
@jwt_required()
def sync_subscription_from_stripe():
    """Synchroniser un abonnement depuis Stripe (pour debug) - CORRIGÉ"""
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
            logging.info(f"🔍 Session récupérée: {session.id}")
        except stripe.error.StripeError as e:
            return jsonify({'error': f'Session Stripe non trouvée: {str(e)}'}), 404
        
        # Traiter manuellement la session comme si le webhook avait été appelé
        handle_partnership_checkout_completed(session)
        
        return jsonify({
            'message': 'Synchronisation effectuée avec succès',
            'session_id': session_id,
            'subscription_id': session.get('subscription'),
            'customer_id': session.get('customer'),
            'metadata': session.get('metadata', {})
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur sync abonnement: {str(e)}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500

@stripe_partnership_bp.route('/force-sync-all', methods=['POST'])
@jwt_required()
def force_sync_all_partnership_subscriptions():
    """Force la synchronisation de TOUS les abonnements pour une école"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        synced_subscriptions = []
        
        # 1. Recherche par email dans Stripe
        stripe_customers = stripe.Customer.list(email=user.email, limit=10)
        
        for customer in stripe_customers.data:
            # Pour chaque customer, récupérer ses abonnements
            customer_subscriptions = stripe.Subscription.list(customer=customer.id, limit=10)
            
            for stripe_sub in customer_subscriptions.data:
                # Créer ou mettre à jour l'abonnement local
                local_sub = Subscription.query.filter_by(
                    stripe_subscription_id=stripe_sub.id
                ).first()
                
                if not local_sub:
                    # Créer un nouvel abonnement
                    local_sub = Subscription()
                    local_sub.user_id = user.id
                    local_sub.school_id = user.school_id
                    local_sub.stripe_subscription_id = stripe_sub.id
                    local_sub.stripe_customer_id = customer.id
                    local_sub.plan_type = 'school_partnership'
                    
                    # Calculer le student_count basé sur le montant
                    if stripe_sub.items and stripe_sub.items.data:
                        amount = stripe_sub.items.data[0].price.unit_amount
                        estimated_students = amount // 500  # 5€ = 500 centimes
                        local_sub.current_student_count = max(1, estimated_students)
                        local_sub.student_price_per_month = 500
                        local_sub.total_monthly_amount = amount
                
                # Mettre à jour le statut depuis Stripe
                local_sub.status = stripe_sub.status
                local_sub.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start)
                local_sub.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end)
                
                db.session.add(local_sub)
                synced_subscriptions.append({
                    'subscription_id': stripe_sub.id,
                    'status': stripe_sub.status,
                    'plan_type': local_sub.plan_type,
                    'customer_email': customer.email,
                    'student_count': local_sub.current_student_count
                })
        
        # 2. Recherche par abonnements existants de l'école
        existing_subscriptions = Subscription.query.filter_by(school_id=user.school_id).all()
        for local_sub in existing_subscriptions:
            try:
                stripe_sub = stripe.Subscription.retrieve(local_sub.stripe_subscription_id)
                if stripe_sub:
                    old_status = local_sub.status
                    local_sub.status = stripe_sub.status
                    local_sub.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start)
                    local_sub.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end)
                    
                    if old_status != stripe_sub.status:
                        synced_subscriptions.append({
                            'subscription_id': stripe_sub.id,
                            'old_status': old_status,
                            'new_status': stripe_sub.status,
                            'action': 'updated'
                        })
            except stripe.error.StripeError:
                local_sub.status = 'canceled'
                synced_subscriptions.append({
                    'subscription_id': local_sub.stripe_subscription_id,
                    'action': 'marked_as_canceled'
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(synced_subscriptions)} abonnements synchronisés pour l\'école {user.school.name}',
            'synced_subscriptions': synced_subscriptions,
            'school_info': {
                'id': user.school_id,
                'name': user.school.name,
                'admin_email': user.email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur sync forcé partenariat: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la synchronisation: {str(e)}'}), 500

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