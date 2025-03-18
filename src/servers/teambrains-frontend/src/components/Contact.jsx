import React, { useState } from 'react';

const Contact = () => {
    // const [formData, setFormData] = useState({
    //     name: '',
    //     email: '',
    //     message: ''
    // });

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    // const [errorMessage, setErrorMessage] = useState('');  

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data:', formData);
    };

    // Nom 
    // Email
    // Message
    // Envoyer

    return (
        <div className="contact-container">
            <form onSubmit={handleSubmit} className="m-auto w-full max-w-lg p-4 sm:p-20">
                <div className="flex w-full max-w-sm flex-col gap-6">
                    <div className="flex flex-col items-center">
                        <h1 className="text-3xl font-semibold">Nous contacter</h1>
                        <p className="text-sm">Contactez nous si vous souhaitez plus d'informations</p>
                    </div>
                    <div className="form-group">
                        <div className="form-field">
                            <label className="form-label">Nom</label>
                            <input placeholder="Votre nom" type="name" className="input max-w-full" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label className="form-label">Email</label>
                            <input placeholder="nom@email.com" type="email" className="input max-w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label className="form-label">Sujet</label>
                            <input placeholder="Sujet" type="subject" className="input max-w-full" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label className="form-label">Message</label>
                            <textarea placeholder="Votre message" className="input max-w-full" value={message} onChange={(e) => setMessage(e.target.value)} />
                            {/* <input placeholder="Votre message" type="text" className="input max-w-full" value={message} onChange={(e) => setMessage(e.target.value)} /> */}
                        </div>
                        <div className="form-field pt-5">
                            {/* {errorMessage && <div className="text-sm mb-2 text-red-500">{errorMessage}</div>} */}
                            <div className="form-control justify-between">
                                <button type="submit" className="btn btn-primary w-full">Envoyer</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};




{/* <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Nom:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="message">Message:</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>
                <button type="submit">Envoyer</button>
            </form> */}

export default Contact;