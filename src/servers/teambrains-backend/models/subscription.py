# models/subscription.py
from .base import db
from datetime import datetime

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    stripe_subscription_id = db.Column(db.String(255), nullable=False, unique=True)
    stripe_customer_id = db.Column(db.String(255), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)  # 'student' ou 'school'
    status = db.Column(db.String(50), nullable=False)  # 'active', 'canceled', 'past_due', etc.
    current_period_start = db.Column(db.DateTime, nullable=False)
    current_period_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Nouveaux champs pour la gestion des échecs de paiement  
    payment_failed_count = db.Column(db.Integer, nullable=True, default=0)
    last_payment_failed_at = db.Column(db.DateTime, nullable=True)
    last_payment_retry_at = db.Column(db.DateTime, nullable=True)
    payment_method_action_required = db.Column(db.Boolean, nullable=True, default=False)
    unpaid_invoice_id = db.Column(db.String(255), nullable=True)  # ID de la facture impayée
    
    # Nouveaux champs pour la facturation hybride écoles
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=True)  # École associée
    base_plan_amount = db.Column(db.Integer, nullable=True, default=12000)  # Montant de base en centimes (120€)
    student_price_per_month = db.Column(db.Integer, nullable=True, default=200)  # Prix par étudiant/mois (2€)
    current_student_count = db.Column(db.Integer, nullable=True, default=0)  # Nombre d'étudiants actuel
    last_student_count_update = db.Column(db.DateTime, nullable=True)  # Dernière mise à jour du compteur
    total_monthly_amount = db.Column(db.Integer, nullable=True)  # Montant total calculé en centimes
    
    # Relations
    user = db.relationship('User', backref=db.backref('subscription', uselist=False))
    school = db.relationship('School', backref=db.backref('subscription', uselist=False))
    
    def to_dict(self):
        # Calculer le montant total pour les écoles
        calculated_total = None
        if self.plan_type == 'school' and self.school_id:
            base_amount = self.base_plan_amount or 12000  # 120€ par défaut
            student_price = self.student_price_per_month or 200  # 2€ par défaut
            student_count = self.current_student_count or 0
            calculated_total = base_amount + (student_price * student_count)
        
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'stripe_customer_id': self.stripe_customer_id,
            'plan_type': self.plan_type,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat(),
            'current_period_end': self.current_period_end.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'payment_failed_count': self.payment_failed_count or 0,
            'last_payment_failed_at': self.last_payment_failed_at.isoformat() if self.last_payment_failed_at else None,
            'last_payment_retry_at': self.last_payment_retry_at.isoformat() if self.last_payment_retry_at else None,
            'payment_method_action_required': self.payment_method_action_required or False,
            'unpaid_invoice_id': self.unpaid_invoice_id,
            'has_payment_issues': (self.payment_failed_count or 0) > 0 or (self.payment_method_action_required or False)
        }
        
        # Ajouter les champs spécifiques aux écoles (pour les plans 'school' et 'school_partnership')
        if self.plan_type in ['school', 'school_partnership']:
            # Pour le plan partenariat, utiliser les montants réels stockés
            if self.plan_type == 'school_partnership':
                total_amount = self.total_monthly_amount or 0
                student_price = self.student_price_per_month or 500  # 5€ pour le partenariat
            else:
                total_amount = calculated_total
                student_price = self.student_price_per_month or 200  # 2€ pour le plan normal
            
            result.update({
                'school_id': self.school_id,
                'base_plan_amount': self.base_plan_amount or (12000 if self.plan_type == 'school' else 0),
                'base_plan_amount_euros': (self.base_plan_amount or (12000 if self.plan_type == 'school' else 0)) / 100,
                'student_price_per_month': student_price,
                'student_price_per_month_euros': student_price / 100,
                'current_student_count': self.current_student_count or 0,
                'last_student_count_update': self.last_student_count_update.isoformat() if self.last_student_count_update else None,
                'total_monthly_amount': total_amount,
                'total_monthly_amount_euros': total_amount / 100 if total_amount else None,
                'total_yearly_amount': total_amount * 12 if total_amount else None,
                'total_yearly_amount_euros': (total_amount * 12) / 100 if total_amount else None
            })
        
        return result


class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=True)
    stripe_invoice_id = db.Column(db.String(255), nullable=False, unique=True)
    amount_paid = db.Column(db.Integer, nullable=False)  # en centimes
    currency = db.Column(db.String(3), nullable=False, default='eur')
    status = db.Column(db.String(50), nullable=False)  # 'paid', 'open', 'void', etc.
    invoice_pdf = db.Column(db.String(500), nullable=True)  # URL du PDF
    hosted_invoice_url = db.Column(db.String(500), nullable=True)  # URL Stripe
    invoice_date = db.Column(db.DateTime, nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('invoices', lazy=True))
    subscription = db.relationship('Subscription', backref=db.backref('invoices', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subscription_id': self.subscription_id,
            'stripe_invoice_id': self.stripe_invoice_id,
            'amount_paid': self.amount_paid,
            'amount_paid_euros': self.amount_paid / 100,  # conversion en euros
            'currency': self.currency,
            'status': self.status,
            'invoice_pdf': self.invoice_pdf,
            'hosted_invoice_url': self.hosted_invoice_url,
            'invoice_date': self.invoice_date.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat()
        } 