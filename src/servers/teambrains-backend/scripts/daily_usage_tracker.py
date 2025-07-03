#!/usr/bin/env python3
"""
Script automatique pour enregistrer l'usage quotidien des écoles
À exécuter chaque jour via cron (ex: à 23h59)
"""

import sys
import os
from datetime import datetime, date

# Ajouter le chemin du projet
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User
from models.school import School
from models.school_usage import SchoolUsage
from extensions import db
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('daily_usage.log'),
        logging.StreamHandler()
    ]
)

def record_all_schools_usage(target_date=None):
    """Enregistrer l'usage de toutes les écoles pour une date donnée"""
    if target_date is None:
        target_date = date.today()
    
    try:
        # Récupérer toutes les écoles actives
        active_schools = School.query.filter_by(is_active=True).all()
        
        success_count = 0
        error_count = 0
        
        logging.info(f"📊 Démarrage enregistrement usage pour {target_date} - {len(active_schools)} écoles")
        
        for school in active_schools:
            try:
                # Compter les étudiants actifs de cette école
                active_students = User.query.filter_by(
                    school_id=school.id,
                    role='student',
                    is_active=True
                ).count()
                
                # Enregistrer l'usage
                usage_record = SchoolUsage.record_daily_usage(
                    school_id=school.id,
                    students_count=active_students,
                    usage_date=target_date
                )
                
                logging.info(f"✅ École {school.name} (ID: {school.id}): {active_students} étudiants actifs")
                success_count += 1
                
            except Exception as e:
                logging.error(f"❌ Erreur école {school.name} (ID: {school.id}): {str(e)}")
                error_count += 1
        
        logging.info(f"📈 Résultat: {success_count} succès, {error_count} erreurs")
        
        return {
            'success_count': success_count,
            'error_count': error_count,
            'total_schools': len(active_schools),
            'date': target_date.isoformat()
        }
        
    except Exception as e:
        logging.error(f"❌ Erreur globale enregistrement usage: {str(e)}")
        return {
            'success_count': 0,
            'error_count': 1,
            'error': str(e)
        }

def check_missing_usage_records():
    """Vérifier et combler les enregistrements d'usage manqués"""
    from datetime import timedelta
    
    # Vérifier les 7 derniers jours
    today = date.today()
    schools = School.query.filter_by(is_active=True).all()
    
    missing_records = []
    
    for i in range(7):
        check_date = today - timedelta(days=i)
        
        for school in schools:
            existing = SchoolUsage.query.filter_by(
                school_id=school.id,
                usage_date=check_date
            ).first()
            
            if not existing:
                missing_records.append({
                    'school_id': school.id,
                    'school_name': school.name,
                    'missing_date': check_date
                })
    
    if missing_records:
        logging.warning(f"⚠️ {len(missing_records)} enregistrements manqués détectés")
        
        # Combler les enregistrements manqués
        for record in missing_records:
            try:
                # Utiliser le nombre d'étudiants actifs actuel comme estimation
                active_students = User.query.filter_by(
                    school_id=record['school_id'],
                    role='student',
                    is_active=True
                ).count()
                
                SchoolUsage.record_daily_usage(
                    school_id=record['school_id'],
                    students_count=active_students,
                    usage_date=record['missing_date']
                )
                
                logging.info(f"🔧 Comblé: {record['school_name']} - {record['missing_date']} - {active_students} étudiants")
                
            except Exception as e:
                logging.error(f"❌ Erreur comblement {record['school_name']}: {str(e)}")
    
    return missing_records

def generate_usage_report(year=None, month=None):
    """Générer un rapport d'usage pour un mois donné"""
    if year is None or month is None:
        now = datetime.now()
        year = now.year
        month = now.month
    
    schools = School.query.filter_by(is_active=True).all()
    report = {
        'period': f"{year}-{month:02d}",
        'schools': [],
        'totals': {
            'total_schools': len(schools),
            'total_student_days': 0,
            'total_estimated_revenue': 0
        }
    }
    
    for school in schools:
        try:
            billing_info = SchoolUsage.calculate_monthly_bill(school.id, year, month)
            
            school_data = {
                'school_id': school.id,
                'school_name': school.name,
                'days_billed': billing_info['days_billed'],
                'student_days': billing_info['student_days'],
                'average_students': billing_info['average_students'],
                'estimated_amount_euros': billing_info['total_amount_euros']
            }
            
            report['schools'].append(school_data)
            report['totals']['total_student_days'] += billing_info['student_days']
            report['totals']['total_estimated_revenue'] += billing_info['total_amount_euros']
            
        except Exception as e:
            logging.error(f"❌ Erreur rapport école {school.name}: {str(e)}")
    
    logging.info(f"📊 Rapport {year}-{month:02d}: {report['totals']['total_estimated_revenue']:.2f}€ de revenus estimés")
    
    return report

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Gestion automatique de l\'usage des écoles')
    parser.add_argument('--action', choices=['record', 'check', 'report'], default='record',
                        help='Action à effectuer')
    parser.add_argument('--date', help='Date pour l\'enregistrement (YYYY-MM-DD)')
    parser.add_argument('--year', type=int, help='Année pour le rapport')
    parser.add_argument('--month', type=int, help='Mois pour le rapport')
    
    args = parser.parse_args()
    
    if args.action == 'record':
        target_date = None
        if args.date:
            try:
                target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
            except ValueError:
                print("❌ Format de date invalide. Utilisez YYYY-MM-DD")
                sys.exit(1)
        
        result = record_all_schools_usage(target_date)
        print(f"✅ Enregistrement terminé: {result}")
        
    elif args.action == 'check':
        missing = check_missing_usage_records()
        print(f"🔍 Vérification terminée: {len(missing)} enregistrements manqués comblés")
        
    elif args.action == 'report':
        report = generate_usage_report(args.year, args.month)
        print(f"📊 Rapport généré pour {report['period']}")
        print(f"   • Écoles: {report['totals']['total_schools']}")
        print(f"   • Jours-étudiants: {report['totals']['total_student_days']}")
        print(f"   • Revenus estimés: {report['totals']['total_estimated_revenue']:.2f}€") 