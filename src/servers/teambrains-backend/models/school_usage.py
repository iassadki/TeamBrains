from models import db
from datetime import datetime, date
from sqlalchemy import func

class SchoolUsage(db.Model):
    """Modèle pour tracker l'usage quotidien des écoles"""
    __tablename__ = 'school_usage'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Relations
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    
    # Données d'usage
    usage_date = db.Column(db.Date, nullable=False, default=date.today)
    active_students_count = db.Column(db.Integer, nullable=False, default=0)
    
    # Métadonnées
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    school = db.relationship('School', backref='usage_records')
    
    # Index unique pour éviter les doublons par jour
    __table_args__ = (
        db.UniqueConstraint('school_id', 'usage_date', name='unique_school_daily_usage'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'usage_date': self.usage_date.isoformat(),
            'active_students_count': self.active_students_count,
            'recorded_at': self.recorded_at.isoformat()
        }
    
    @staticmethod
    def record_daily_usage(school_id, students_count, usage_date=None):
        """Enregistrer l'usage quotidien d'une école"""
        if usage_date is None:
            usage_date = date.today()
        
        # Chercher un enregistrement existant pour ce jour
        existing = SchoolUsage.query.filter_by(
            school_id=school_id,
            usage_date=usage_date
        ).first()
        
        if existing:
            # Mettre à jour l'enregistrement existant
            existing.active_students_count = students_count
            existing.recorded_at = datetime.utcnow()
        else:
            # Créer un nouvel enregistrement
            usage_record = SchoolUsage(
                school_id=school_id,
                usage_date=usage_date,
                active_students_count=students_count
            )
            db.session.add(usage_record)
        
        db.session.commit()
        return existing if existing else usage_record
    
    @staticmethod
    def get_monthly_usage(school_id, year, month):
        """Récupérer l'usage mensuel d'une école"""
        from calendar import monthrange
        
        # Premier et dernier jour du mois
        first_day = date(year, month, 1)
        last_day = date(year, month, monthrange(year, month)[1])
        
        usage_records = SchoolUsage.query.filter(
            SchoolUsage.school_id == school_id,
            SchoolUsage.usage_date >= first_day,
            SchoolUsage.usage_date <= last_day
        ).order_by(SchoolUsage.usage_date).all()
        
        return usage_records
    
    @staticmethod
    def calculate_monthly_bill(school_id, year, month, price_per_student_per_day=None):
        """Calculer la facture mensuelle basée sur l'usage réel"""
        from calendar import monthrange
        
        if price_per_student_per_day is None:
            # 5€ par mois par étudiant = environ 0.16€ par jour par étudiant
            days_in_month = monthrange(year, month)[1]
            price_per_student_per_day = 500 / days_in_month  # en centimes
        
        usage_records = SchoolUsage.get_monthly_usage(school_id, year, month)
        
        total_amount = 0
        days_billed = 0
        student_days = 0
        
        for record in usage_records:
            daily_cost = record.active_students_count * price_per_student_per_day
            total_amount += daily_cost
            days_billed += 1
            student_days += record.active_students_count
        
        return {
            'total_amount_centimes': int(total_amount),
            'total_amount_euros': total_amount / 100,
            'days_billed': days_billed,
            'student_days': student_days,
            'average_students': student_days / days_billed if days_billed > 0 else 0,
            'period': f"{year}-{month:02d}"
        }

class SchoolInvoice(db.Model):
    """Modèle pour les factures mensuelles des écoles"""
    __tablename__ = 'school_invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Relations
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    
    # Informations de facturation
    billing_year = db.Column(db.Integer, nullable=False)
    billing_month = db.Column(db.Integer, nullable=False)
    
    # Montants
    total_amount_centimes = db.Column(db.Integer, nullable=False)
    days_billed = db.Column(db.Integer, nullable=False)
    student_days = db.Column(db.Integer, nullable=False)
    average_students = db.Column(db.Float, nullable=False)
    
    # Stripe
    stripe_invoice_id = db.Column(db.String(255), unique=True)
    payment_status = db.Column(db.String(50), default='pending')  # pending, paid, failed
    
    # Dates
    invoice_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    paid_at = db.Column(db.DateTime)
    
    # Relations
    school = db.relationship('School', backref='invoices')
    
    # Index unique pour éviter les factures multiples par mois
    __table_args__ = (
        db.UniqueConstraint('school_id', 'billing_year', 'billing_month', name='unique_school_monthly_invoice'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'billing_period': f"{self.billing_year}-{self.billing_month:02d}",
            'total_amount_euros': self.total_amount_centimes / 100,
            'days_billed': self.days_billed,
            'student_days': self.student_days,
            'average_students': round(self.average_students, 2),
            'stripe_invoice_id': self.stripe_invoice_id,
            'payment_status': self.payment_status,
            'invoice_date': self.invoice_date.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        } 