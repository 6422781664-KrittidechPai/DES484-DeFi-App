// src/components/Deposit.js
import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Card, Form } from 'react-bootstrap';
import Select from 'react-select';  // For drop-down menu
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

const Deposit = () => {
  const navigate = useNavigate();
  
  // State variables
  const [depositAmount, setDepositAmount] = useState(0);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [collateralFactor, setCollateralFactor] = useState(50);

  const cryptos = [
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' },
  ];

  // Fetch exchange rate when crypto is selected
  useEffect(() => {
    if (selectedCrypto) {
      // fetching the exchange rate from an API (replace with actual API)
      const mockRates = {
        BTC: 106894.30,  // Example exchange rate for Bitcoin
        ETH: 3987.32,   // Example exchange rate for Ethereum
      };
      setExchangeRate(mockRates[selectedCrypto.value]);

      // Update estimated value if deposit amount is also filled
      if (depositAmount > 0) {
        setEstimatedValue(depositAmount * mockRates[selectedCrypto.value]);
      }
    }
  }, [selectedCrypto, depositAmount]);

  // Handle deposit confirmation
  const handleConfirmDeposit = () => {
    alert('Deposit confirmed!');
    navigate('/home'); // Navigate to Home after confirmation (or another page)
  };

  return (
    <Container>
      {/* Navigation Bar */}
      <NavBar />

      <Row className="my-4">
        <Col>
          <h2>Deposit</h2>
        </Col>
      </Row>

      {/* Deposit Input Section */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Amount to Deposit</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            {depositAmount > 0 && selectedCrypto && (
              <Form.Text className="text-muted">
                ~${estimatedValue.toFixed(2)}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Cryptocurrency</Form.Label>
            <Select
              options={cryptos}
              value={selectedCrypto}
              onChange={setSelectedCrypto}
              placeholder="Select cryptocurrency"
            />
            {selectedCrypto && depositAmount > 0 && (
              <Form.Text className="text-muted">
                1 {selectedCrypto.value} = ${exchangeRate}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>

      {/* Summary Box Section */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>Deposit rate</Card.Title>
              <Card.Text>
                <strong>Interest Rate:</strong> 3% <br />
                <strong>Collateral Factor:</strong> {collateralFactor}% <br />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirm Button */}
      <Row>
        <Col md={12} className="text-center">
          <Button variant="primary" onClick={handleConfirmDeposit}>
            Confirm
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Deposit;
