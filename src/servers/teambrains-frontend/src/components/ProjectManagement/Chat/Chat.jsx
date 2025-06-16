import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../../context/AuthContext';
import { Paperclip } from 'lucide-react';

const Chat = ({ projectId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const { currentUser } = useAuth();

    // Fonction pour récupérer les messages
    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5001/chat/${projectId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            setMessages(response.data.messages);
            setError(null);
        } catch (err) {
            setError("Erreur lors du chargement des messages");
            console.error("Erreur fetchMessages:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour envoyer un message
    const sendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        try {
            await axios.post(`http://localhost:5001/chat/${projectId}/send`, {
                content: newMessage
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // Après avoir envoyé le message, on rafraîchit la liste des messages
            fetchMessages();
            setNewMessage(''); // Réinitialise le champ de saisie
            setError(null);
        } catch (err) {
            setError("Erreur lors de l'envoi du message");
            console.error("Erreur sendMessage:", err);
        }
    };

    // Fonction pour formater la date des messages
    const formatMessageDate = (timestamp) => {
        return format(new Date(timestamp), "d MMMM à HH:mm", { locale: fr });
    };

    // Scroll automatique vers le bas lorsque de nouveaux messages sont ajoutés
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Récupération initiale des messages + mise en place du polling
    useEffect(() => {
        if (projectId) {
            fetchMessages();

            // Polling toutes les 5 secondes pour obtenir les nouveaux messages
            const interval = setInterval(() => {
                fetchMessages();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [projectId]);

    return (
        <div className="flex flex-col h-96 bg-white rounded-lg shadow-sm">
            {/* Zone des messages */}
            <div className="flex-grow p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Chargement des messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Aucun message. Commencez la conversation !</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`mb-4 ${message.sender_id === currentUser.id
                                    ? 'flex justify-end'
                                    : 'flex justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${message.sender_id === currentUser.id
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    <div className="font-semibold">{message.sender_name}</div>
                                    <p className="text-sm break-words">{message.content}</p>
                                    <div className="text-xs mt-1 text-right opacity-75">
                                        {formatMessageDate(message.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Formulaire d'envoi de message */}
            <div className="p-3 border-t border-gray-200">
                {error && (
                    <div className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={sendMessage} className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrivez votre message..."
                        className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={!newMessage.trim()}
                    >
                        Send
                    </button>

                    <button className="flex items-center px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ml-[5px]">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Joindre un fichier
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;