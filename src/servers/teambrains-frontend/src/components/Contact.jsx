import React, { useState } from 'react';

const Contact = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        
        try {
            const response = await fetch('http://localhost:5001/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setStatus('success');
                setName('');
                setEmail('');
                setMessage('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <div className="contact-container bg-gray-50 min-h-screen flex items-center justify-center py-8">
            <div className="bg-white rounded-lg shadow-md w-full max-w-lg mx-4">
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    <div className="flex w-full flex-col gap-4 md:gap-6 mx-auto">
                        <div className="flex flex-col items-center text-center">
                            <h1 className="text-2xl md:text-3xl font-semibold mb-1">Nous contacter</h1>
                            <p className="text-sm">Contactez nous si vous souhaitez plus d'informations</p>
                        </div>
                        <div className="form-group">
                            <div className="form-field mb-3">
                                <label className="form-label block mb-1">Nom</label>
                                <input
                                    placeholder="Votre nom"
                                    type="name"
                                    className="input max-w-full w-full border p-2 rounded"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="form-field mb-3">
                                <label className="form-label block mb-1">Email</label>
                                <input
                                    placeholder="nom@email.com"
                                    type="email"
                                    className="input max-w-full w-full border p-2 rounded"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-field mb-3">
                                <label className="form-label block mb-1">Message</label>
                                <textarea
                                    placeholder="Votre message"
                                    className="input max-w-full w-full border p-2 rounded resize-none h-32"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            {status === 'success' && (
                                <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
                                    Message envoyé avec succès !
                                </div>
                            )}
                            
                            {status === 'error' && (
                                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                                    Une erreur est survenue. Veuillez réessayer.
                                </div>
                            )}
                            
                            <div className="form-field pt-3 md:pt-5">
                                <div className="form-control justify-between">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                                        disabled={status === 'sending'}
                                    >
                                        {status === 'sending' ? 'Envoi en cours...' : 'Envoyer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Contact;