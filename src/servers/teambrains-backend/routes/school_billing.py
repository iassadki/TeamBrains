from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from calendar import monthrange
import stripe
import os
import logging

from models.user import User
from models.school import School
from models.school_usage import SchoolUsage, SchoolInvoice
from extensions import db

# Configuration Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

school_billing_bp = Blueprint('school_billing', __name__)

@school_billing_bp.route('/usage/record', methods=['POST'])
@jwt_required()
def record_school_usage():
    """Enregistrer l'usage quotidien de l'école"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Compter le nombre d'étudiants actifs aujourd'hui
        active_students = User.query.filter_by(
            school_id=user.school_id,
            role='student',
            is_active=True
        ).count()
        
        # Enregistrer l'usage d'aujourd'hui
        usage_record = SchoolUsage.record_daily_usage(
            school_id=user.school_id,
            students_count=active_students
        )
        
        logging.info(f"📊 Usage enregistré: École {user.school_id}, {active_students} étudiants actifs")
        
        return jsonify({
            'message': 'Usage enregistré avec succès',
            'usage': usage_record.to_dict(),
            'active_students': active_students
        }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur enregistrement usage: {str(e)}")
        return jsonify({'error': 'Erreur lors de l\'enregistrement de l\'usage'}), 500

@school_billing_bp.route('/usage/current-month', methods=['GET'])
@jwt_required()
def get_current_month_usage():
    """Récupérer l'usage du mois en cours pour l'école"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Mois et année actuels
        now = datetime.now()
        year = now.year
        month = now.month
        
        # Récupérer l'usage du mois
        usage_records = SchoolUsage.get_monthly_usage(user.school_id, year, month)
        
        # Calculer le coût estimé du mois
        billing_info = SchoolUsage.calculate_monthly_bill(user.school_id, year, month)
        
        # Compter les étudiants actifs actuellement
        current_active_students = User.query.filter_by(
            school_id=user.school_id,
            role='student',
            is_active=True
        ).count()
        
        return jsonify({
            'billing_period': f"{year}-{month:02d}",
            'current_active_students': current_active_students,
            'usage_records': [record.to_dict() for record in usage_records],
            'estimated_bill': billing_info,
            'is_current_month': True
        }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur récupération usage: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération de l\'usage'}), 500

@school_billing_bp.route('/usage/history/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def get_monthly_usage_history(year, month):
    """Récupérer l'usage d'un mois spécifique"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Vérifier que le mois est valide
        if month < 1 or month > 12:
            return jsonify({'error': 'Mois invalide'}), 400
        
        # Récupérer l'usage du mois
        usage_records = SchoolUsage.get_monthly_usage(user.school_id, year, month)
        billing_info = SchoolUsage.calculate_monthly_bill(user.school_id, year, month)
        
        # Vérifier s'il y a une facture pour ce mois
        invoice = SchoolInvoice.query.filter_by(
            school_id=user.school_id,
            billing_year=year,
            billing_month=month
        ).first()
        
        now = datetime.now()
        is_current_month = (year == now.year and month == now.month)
        
        return jsonify({
            'billing_period': f"{year}-{month:02d}",
            'usage_records': [record.to_dict() for record in usage_records],
            'billing_info': billing_info,
            'invoice': invoice.to_dict() if invoice else None,
            'is_current_month': is_current_month
        }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur récupération historique: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération de l\'historique'}), 500

@school_billing_bp.route('/invoices/generate/<int:year>/<int:month>', methods=['POST'])
@jwt_required()
def generate_monthly_invoice(year, month):
    """Générer la facture mensuelle (normalement appelé automatiquement)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Vérifier qu'on n'est pas en train de facturer le mois en cours
        now = datetime.now()
        if year == now.year and month == now.month:
            return jsonify({'error': 'Impossible de facturer le mois en cours'}), 400
        
        # Vérifier qu'il n'y a pas déjà une facture pour ce mois
        existing_invoice = SchoolInvoice.query.filter_by(
            school_id=user.school_id,
            billing_year=year,
            billing_month=month
        ).first()
        
        if existing_invoice:
            return jsonify({'error': 'Facture déjà générée pour ce mois'}), 400
        
        # Calculer la facture
        billing_info = SchoolUsage.calculate_monthly_bill(user.school_id, year, month)
        
        if billing_info['days_billed'] == 0:
            return jsonify({'error': 'Aucune donnée d\'usage pour ce mois'}), 400
        
        # Créer la facture locale
        invoice = SchoolInvoice(
            school_id=user.school_id,
            billing_year=year,
            billing_month=month,
            total_amount_centimes=billing_info['total_amount_centimes'],
            days_billed=billing_info['days_billed'],
            student_days=billing_info['student_days'],
            average_students=billing_info['average_students'],
            due_date=datetime.now() + timedelta(days=15)  # 15 jours pour payer
        )
        
        # Créer la facture Stripe si l'école a un customer_id
        from models.subscription import Subscription
        subscription = Subscription.query.filter_by(school_id=user.school_id).first()
        
        if subscription and subscription.stripe_customer_id:
            try:
                # Créer la facture sur Stripe
                stripe_invoice = stripe.Invoice.create(
                    customer=subscription.stripe_customer_id,
                    collection_method='send_invoice',
                    days_until_due=15,
                    metadata={
                        'school_id': str(user.school_id),
                        'billing_period': f"{year}-{month:02d}",
                        'student_days': str(billing_info['student_days'])
                    }
                )
                
                # Ajouter l'item de facturation
                stripe.InvoiceItem.create(
                    customer=subscription.stripe_customer_id,
                    invoice=stripe_invoice.id,
                    amount=billing_info['total_amount_centimes'],
                    currency='eur',
                    description=f"TeamBrains - Facturation {year}-{month:02d} ({billing_info['average_students']:.1f} étudiants en moyenne, {billing_info['days_billed']} jours)"
                )
                
                # Finaliser et envoyer la facture
                stripe_invoice = stripe.Invoice.finalize_invoice(stripe_invoice.id)
                stripe.Invoice.send_invoice(stripe_invoice.id)
                
                invoice.stripe_invoice_id = stripe_invoice.id
                
                logging.info(f"💳 Facture Stripe créée: {stripe_invoice.id} pour école {user.school_id}")
                
            except stripe.error.StripeError as e:
                logging.error(f"❌ Erreur création facture Stripe: {str(e)}")
                # Continuer même si Stripe échoue, on a la facture locale
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'message': 'Facture générée avec succès',
            'invoice': invoice.to_dict(),
            'billing_info': billing_info
        }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur génération facture: {str(e)}")
        return jsonify({'error': 'Erreur lors de la génération de la facture'}), 500

@school_billing_bp.route('/invoices/list', methods=['GET'])
@jwt_required()
def list_school_invoices():
    """Lister toutes les factures de l'école"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Récupérer toutes les factures de l'école
        invoices = SchoolInvoice.query.filter_by(
            school_id=user.school_id
        ).order_by(SchoolInvoice.billing_year.desc(), SchoolInvoice.billing_month.desc()).all()
        
        return jsonify({
            'invoices': [invoice.to_dict() for invoice in invoices],
            'total_invoices': len(invoices)
        }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur liste factures: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération des factures'}), 500

@school_billing_bp.route('/invoices/<int:invoice_id>/pay', methods=['POST'])
@jwt_required()
def pay_invoice(invoice_id):
    """Payer une facture via Stripe"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'school_admin' or not user.school_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Récupérer la facture
        invoice = SchoolInvoice.query.filter_by(
            id=invoice_id,
            school_id=user.school_id
        ).first()
        
        if not invoice:
            return jsonify({'error': 'Facture non trouvée'}), 404
        
        if invoice.payment_status == 'paid':
            return jsonify({'error': 'Facture déjà payée'}), 400
        
        # Si la facture a un ID Stripe, créer une session de paiement
        if invoice.stripe_invoice_id:
            try:
                # Récupérer la facture Stripe
                stripe_invoice = stripe.Invoice.retrieve(invoice.stripe_invoice_id)
                
                return jsonify({
                    'payment_url': stripe_invoice.hosted_invoice_url,
                    'invoice_pdf': stripe_invoice.invoice_pdf
                }), 200
                
            except stripe.error.StripeError as e:
                logging.error(f"❌ Erreur récupération facture Stripe: {str(e)}")
                return jsonify({'error': 'Erreur lors de l\'accès à la facture Stripe'}), 500
        else:
            # Créer une session de checkout pour cette facture
            from models.subscription import Subscription
            subscription = Subscription.query.filter_by(school_id=user.school_id).first()
            
            if not subscription or not subscription.stripe_customer_id:
                return jsonify({'error': 'Aucun compte Stripe configuré'}), 400
            
            checkout_session = stripe.checkout.Session.create(
                customer=subscription.stripe_customer_id,
                payment_method_types=['card'],
                mode='payment',
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'TeamBrains - Facture {invoice.billing_year}-{invoice.billing_month:02d}',
                            'metadata': {
                                'school_name': user.school.name,
                                'average_students': str(invoice.average_students)
                            }
                        },
                        'unit_amount': invoice.total_amount_centimes
                    },
                    'quantity': 1,
                }],
                success_url=f"http://localhost:5173/partenariat-ecole/facturation?success=true&invoice_id={invoice_id}",
                cancel_url=f"http://localhost:5173/partenariat-ecole/facturation?canceled=true",
                metadata={
                    'invoice_id': str(invoice_id),
                    'school_id': str(user.school_id),
                    'billing_period': f"{invoice.billing_year}-{invoice.billing_month:02d}"
                }
            )
            
            return jsonify({
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id
            }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur paiement facture: {str(e)}")
        return jsonify({'error': 'Erreur lors du paiement de la facture'}), 500

@school_billing_bp.route('/admin/generate-all-invoices/<int:year>/<int:month>', methods=['POST'])
@jwt_required()
def generate_all_monthly_invoices(year, month):
    """Générer toutes les factures mensuelles pour toutes les écoles (admin seulement)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès administrateur requis'}), 403
        
        # Récupérer toutes les écoles actives
        schools = School.query.filter_by(is_active=True).all()
        
        generated_invoices = []
        errors = []
        
        for school in schools:
            try:
                # Vérifier qu'il n'y a pas déjà une facture
                existing = SchoolInvoice.query.filter_by(
                    school_id=school.id,
                    billing_year=year,
                    billing_month=month
                ).first()
                
                if existing:
                    continue
                
                # Calculer la facture
                billing_info = SchoolUsage.calculate_monthly_bill(school.id, year, month)
                
                if billing_info['days_billed'] == 0:
                    continue  # Pas d'usage ce mois-ci
                
                # Créer la facture
                invoice = SchoolInvoice(
                    school_id=school.id,
                    billing_year=year,
                    billing_month=month,
                    total_amount_centimes=billing_info['total_amount_centimes'],
                    days_billed=billing_info['days_billed'],
                    student_days=billing_info['student_days'],
                    average_students=billing_info['average_students'],
                    due_date=datetime.now() + timedelta(days=15)
                )
                
                db.session.add(invoice)
                generated_invoices.append({
                    'school_id': school.id,
                    'school_name': school.name,
                    'amount_euros': billing_info['total_amount_euros'],
                    'student_days': billing_info['student_days']
                })
                
            except Exception as e:
                errors.append({
                    'school_id': school.id,
                    'school_name': school.name,
                    'error': str(e)
                })
        
        db.session.commit()
        
        logging.info(f"📊 Factures générées: {len(generated_invoices)} succès, {len(errors)} erreurs")
        
        return jsonify({
            'message': f'{len(generated_invoices)} factures générées avec succès',
            'generated_invoices': generated_invoices,
            'errors': errors,
            'period': f"{year}-{month:02d}"
        }), 200
        
    except Exception as e:
        logging.error(f"❌ Erreur génération factures globale: {str(e)}")
        return jsonify({'error': 'Erreur lors de la génération des factures'}), 500 