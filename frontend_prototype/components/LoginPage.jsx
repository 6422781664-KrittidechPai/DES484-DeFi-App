// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const LoginPage = () => {
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        
        // Assume user selects the first account
        const userAccount = accounts[0];
        setAccount(userAccount);

        // Navigate to the dashboard with the connected account
        navigate('/dashboard', { state: { account: userAccount } });
      } else {
        alert('Please install MetaMask');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
      alert('Failed to connect to MetaMask');
    }
  };

  return (
    <div className="login-container">
      <h2 className='h2-login'>Connect to MetaMask</h2>
      <form onSubmit={handleSubmit}>
        <button type="submit" className="connect-btn">Connect</button>
      </form>
      {account && <p>Connected: {account}</p>}
    </div>
  );
};

export default LoginPage;
