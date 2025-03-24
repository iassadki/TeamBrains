from flask import Blueprint, request, jsonify
from flask_mail import Message
from extensions import mail

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/api/contact', methods=['POST'])
def send_contact_email():
    print("Route /api/contact appelée")  # Log pour déboguer
    data = request.json
    print("Données reçues:", data)  # Log pour déboguer
    
    if not all(k in data for k in ['name', 'email', 'message']):
        print("Données manquantes")  # Log pour déboguer
        return jsonify({'error': 'Données manquantes'}), 400
        
    try:
        msg = Message(
            subject=f"Nouveau message de contact de {data['name']}",
            sender=data['email'],
            recipients=['votre-email@example.com'],  # Remplacez par votre email
            body=f"""
            Nouveau message de {data['name']} ({data['email']}):
            
            {data['message']}
            """
        )
        mail.send(msg)
        return jsonify({'message': 'Email envoyé avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 