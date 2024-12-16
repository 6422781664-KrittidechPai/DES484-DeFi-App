// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Loan from './components/Loan';
import Deposit from './components/Deposit';
import Repayment from './components/Repayment';
import Withdraw from './components/Withdraw';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<LoginPage />} /> */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/loan" element={<Loan />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/repayment" element={<Repayment />} />
        <Route path="/withdraw" element={<Withdraw />} />
      </Routes>
    </Router>
  );
};

export default App;
