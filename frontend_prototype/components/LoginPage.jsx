// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [privateKey, setPrivateKey] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Normally, you would validate and authenticate the user here
    // For now, we assume the user can always log in successfully
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <h2 className='h2-login'>Connect Wallet</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="privateKey">Private Key</label>
          <input
            type="text"
            privateKey="privateKey"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Enter your private key"
            required
          />
        </div>
        <button type="submit" className="connect-btn">Connect</button>
      </form>
    </div>
  );
};

export default LoginPage;
