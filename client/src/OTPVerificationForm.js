import React, { useState } from 'react';
import './OTPVerificationForm.css';
import NewPasswordForm from './NewPasswordForm';

function OTPVerificationForm({ email, onNewPasswordRequest, onPasswordUpdated }) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting OTP verification form...");
        console.log("Email:", email);
        console.log("OTP:", otp);
        if (!/^\d+$/.test(otp)) {
            setError('Por favor, ingrese solo números.');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp: parseInt(otp) })
            });
            const data = await response.json();
            if (response.status === 200) {
                console.log("OTP verification successful!");
                setShowNewPasswordForm(true);
            } else {
                setError(data.error || 'Error al verificar el OTP');
            }
        } catch (error) {
            console.error('Error al verificar el OTP:', error);
            setError('Error al verificar el OTP');
        }
    };

    return (
        <div className="otp-verification-form-container">
            {showNewPasswordForm ? (
                <NewPasswordForm email={email} onPasswordUpdated={onPasswordUpdated} />
            ) : (
                <form className="otp-verification-form" onSubmit={handleSubmit}>
                    <div className="otp-verification-form-group">
                        <label htmlFor="otp">Ingresa el Código</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="otp-verification-form-button">Verificar</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            )}
        </div>
    );
}

export default OTPVerificationForm;