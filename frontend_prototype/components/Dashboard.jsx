// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Button, Table, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import NavBar from './NavBar';
import { ethers } from 'ethers';
import { lendingPoolABI } from './ABI';
// import { lendingPoolAddress } from './addresses';

import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [collateral, setCollateral] = useState(0);
  const [debt, setDebt] = useState(0);
  const [loanRecords, setLoanRecords] = useState([
    { asset: 'BTC', debt: 0, debtUSD: 0 },
    { asset: 'ETH', debt: 0.00025, debtUSD: 25 },
  ]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());

  // Calculate health status
  const healthStatus = 'Healthy';
  const healthStatusColor = 'success';

  // Initialize Ethereum provider and set wallet address and balance
  useEffect(() => {
    const connectMetaMask = async () => {
      if (window.ethereum) {
        try {
          // Request accounts
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = provider.getSigner();
          // const contract = new ethers.Contract(lendingPoolAddress, lendingPoolABI, signer);
          const accounts = await provider.send('eth_requestAccounts', []);
          const userAddress = accounts[0];
          setWalletAddress(userAddress);

          // Get balance in Ether
          const balanceInWei = await provider.getBalance(userAddress);
          const balanceInEther = ethers.formatEther(balanceInWei);
          // setBalance(parseFloat(balanceInEther).toFixed(4)); // Set the balance to 4 decimal places
          setBalance(700);
          setCollateral(200);
          setDebt(25);
        } catch (error) {
          console.error('Error connecting to MetaMask', error);
          alert('Please connect your MetaMask wallet');
        }
      } else {
        alert('MetaMask is not installed');
      }
    };

    connectMetaMask();
  }, []);

  // Redirect to Repayment page
  const handleRepayment = (asset) => {
    navigate(`/repayment?cryptoName=${asset}`); // Redirect with cryptoName in the URL
  };

  return (
    <Container>
      {/* Navigation Bar */}
      <NavBar />

      {/* Top Banner */}
      <Row className="my-3">
        <Col>
          <h2 className="h2-dashboard">Wallet address: {walletAddress}</h2>
        </Col>
      </Row>

      {/* Top Section */}
      <Row className="mb-4 dashboard-label">
        <Col md={4}>
          <text>Balance</text>
          <Card>
            <Card.Body>
              <Card.Text>${balance}</Card.Text>
            </Card.Body>
          </Card>
          <span className="ms-3">
            Interest rate: 3%
          </span>
        </Col>
        <Col md={4}>
          <text>Collateral</text>
          <Card>
            <Card.Body>
              <Card.Text>${collateral}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <text>Debt</text>
          <Card>
            <Card.Body>
              <Card.Text>${debt}</Card.Text>
            </Card.Body>
          </Card>
          <text>
            Health:
            <span
              className={`ms-2 rounded-circle p-2 text-white bg-${healthStatusColor}`}
              style={{ width: '12px', height: '12px', display: 'inline-block' }}
            />
            {healthStatus}
          </text>
        </Col>
      </Row>

      {/* Bottom Section - Loan Record Table */}
      <Row>
        <Col>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Borrow Value</th>
                <th>Interest Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loanRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.asset}</td>
                  <td>
                    {record.debt} {record.asset}
                    <br />
                    <small>~${record.debtUSD}</small>
                  </td>
                  <td>
                    3%
                  </td>
                  <td>
                    <Button variant="primary" onClick={() => handleRepayment(record.asset)}>
                      Repayment
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Footer */}
      <Row className="mt-4">
        <Col>
          <p className="text-end">
            <small>Last Updated: {lastUpdated}</small>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
