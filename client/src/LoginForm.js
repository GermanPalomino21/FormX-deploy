import React, { useState, useEffect } from 'react';
import './LoginForm.css';
import { encryptString } from './encryption';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import { useReload } from './ReloadContext';

function LoginForm({ onLoginSuccess, onPasswordRecoveryRequest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const { reload, triggerReload } = useReload();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (reload) {
      window.location.reload();
    }
  }, [reload]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const encryptedPassword = encryptString(password);
    console.log("Encrypted Password:", encryptedPassword);

    fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: encryptedPassword }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Inicio de sesión exitoso') {
        localStorage.setItem('id_usuario', data.id_usuario);
        onLoginSuccess();
      } else {
        alert('Credenciales incorrectas');
      }
    })
    .catch(error => {
      console.error('Error al enviar la solicitud al backend:', error);
    });
  };

  const handlePasswordRecoveryClick = () => {
    setShowPasswordRecovery(true);
    onPasswordRecoveryRequest(email);
  };

  if (showPasswordRecovery) {
    return <PasswordRecoveryForm />;
  }

  return (
    <div className="unique-login-container">
      <div className="unique-login-content">
        <img id="unique-logo" src="https://itxconsultoria.com/wp-content/uploads/2022/07/IT-Experts-ITX-Consultoria-@2x.png" alt="Logo" />
        <h2 className="unique-login-form-title">Inicio de Sesión</h2>
        <form className="unique-login-form" onSubmit={handleSubmit}>
          <div className="unique-login-form-group">
            <label htmlFor="unique-email">Correo Electrónico</label>
            <input
              type="email"
              id="unique-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="unique-login-form-group">
            <label htmlFor="unique-password">Contraseña</label>
            <input
              type="password"
              id="unique-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="unique-login-form-button">LOG IN</button>
        </form>
        <button className="unique-password-recovery-link" onClick={handlePasswordRecoveryClick}>¿Olvidaste tu contraseña?</button>
      </div>
    </div>
  );
}

export default LoginForm;