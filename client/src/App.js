import React, { useState } from 'react';
import './App.css';
import LoginForm from './LoginForm';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import OTPVerificationForm from './OTPVerificationForm';
import NewPasswordForm from './NewPasswordForm';
import EvaluationForm from './EvaluationForm';
import { ReloadProvider } from './ReloadContext';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [passwordRecoveryRequested, setPasswordRecoveryRequested] = useState(false);
  const [otpVerificationRequested, setOTPVerificationRequested] = useState(false);
  const [newPasswordRequested, setNewPasswordRequested] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [emailForRecovery, setEmailForRecovery] = useState('');

  const handlePasswordRecoveryRequest = (email) => {
    console.log("Password recovery requested for email:", email);
    setPasswordRecoveryRequested(true);
    setEmailForRecovery(email);
  };

  const handlePasswordUpdateSuccess = () => {
    console.log("Password update successful");
    setPasswordUpdated(true);
    setTimeout(() => {
      setPasswordUpdated(false);
    }, 5000);
  };

  const handleNewPasswordRequest = (email) => {
    console.log("New password requested for email:", email);
    setPasswordRecoveryRequested(false);
    setNewPasswordRequested(true);
    setEmailForRecovery(email);
  };

  const handleLoginSuccess = () => {
    console.log("Login successful!");
    setLoggedIn(true);
    setPasswordRecoveryRequested(false);
    setOTPVerificationRequested(false);
    setNewPasswordRequested(false);
  };

  return (
    <ReloadProvider>
      <div className="App">
        {!loggedIn && !passwordRecoveryRequested && !otpVerificationRequested && !newPasswordRequested && (
          <LoginForm onLoginSuccess={handleLoginSuccess} onPasswordRecoveryRequest={handlePasswordRecoveryRequest} />
        )}
        {passwordRecoveryRequested && !otpVerificationRequested && !newPasswordRequested && (
          <PasswordRecoveryForm 
            onNewPasswordRequest={handleNewPasswordRequest} 
            onPasswordUpdated={handlePasswordUpdateSuccess} 
          />
        )}
        {otpVerificationRequested && !newPasswordRequested && (
          <OTPVerificationForm 
            email={emailForRecovery} 
            onNewPasswordRequest={handleNewPasswordRequest} 
            onPasswordUpdated={handlePasswordUpdateSuccess} 
          />
        )}
        {newPasswordRequested && !passwordUpdated && (
          <NewPasswordForm email={emailForRecovery} onPasswordUpdated={handlePasswordUpdateSuccess} />
        )}
        {passwordUpdated && (
          <LoginForm />
        )}
        {loggedIn && <EvaluationForm />}
      </div>
    </ReloadProvider>
  );
}

export default App;