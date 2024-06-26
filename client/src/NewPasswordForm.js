import React, { useState } from 'react';
import './NewPasswordForm.css';
import { encryptString } from './encryption';
import LoginForm from './LoginForm'; // Importa LoginForm
import { useReload } from './ReloadContext';

function NewPasswordForm({ email, onPasswordUpdated }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [error, setError] = useState('');
  const { triggerReload } = useReload(); // Usa el contexto de recarga
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const encryptedPassword = encryptString(password);

    fetch(`${apiUrl}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: encryptedPassword }),
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      setShowLoginForm(true); // Muestra el LoginForm
      triggerReload(); // Activa la recarga
      onPasswordUpdated();
    })
    .catch(error => {
      console.error('Error al enviar la solicitud al backend:', error);
      setError('Error al actualizar la contraseña');
    });
  };

  return (
    <div className="new-password-form-container">
      {showLoginForm ? (
        <LoginForm /> // Muestra el LoginForm
      ) : (
        <form className="new-password-form" onSubmit={handleSubmit}>
          <div className="new-password-form-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="new-password-form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="new-password-form-button">Actualizar Contraseña</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default NewPasswordForm;