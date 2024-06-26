import React, { useState } from 'react';
import './PasswordRecoveryForm.css';
import OTPVerificationForm from './OTPVerificationForm'; // Importa el formulario de verificación OTP

function PasswordRecoveryForm({ onNewPasswordRequest,onPasswordUpdated }) {
    const [email, setEmail] = useState('');
    const [showOTPVerificationForm, setShowOTPVerificationForm] = useState(false); 
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Datos a enviar:', { email });
            // Verificar si el correo existe en la base de datos
            const response = await fetch(`http://localhost:3002/verificar-correo?email=${email}`);
            const data = await response.json();
            if (data.exists) {
                // Si el correo existe, enviar solicitud de recuperación de contraseña
                const recoveryResponse = await fetch('http://localhost:3002/password-recovery', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                if (recoveryResponse.ok) {
                    setShowOTPVerificationForm(true);
                } else {
                    setError('Error al enviar la solicitud de recuperación de contraseña');
                }
            } else {
                // Si el correo no existe, mostrar mensaje de error
                setError('El correo electrónico no está registrado.');
            }
        } catch (error) {
            console.error('Error al enviar la solicitud de recuperación de contraseña:', error);
            setError('Error al enviar la solicitud de recuperación de contraseña');
        }
    };

    console.log("onNewPasswordRequest:", onNewPasswordRequest);

    return (
        <div className="password-recovery-form-container">
            {showOTPVerificationForm ? (
                <OTPVerificationForm onSubmit={handleSubmit} email={email} onNewPasswordRequest={onNewPasswordRequest} />
            ) : (
                <form className="password-recovery-form" onSubmit={handleSubmit}>
                    <div className="password-recovery-form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="password-recovery-form-button">Enviar Correo de Recuperación</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            )}
        </div>
    );
}

export default PasswordRecoveryForm;
