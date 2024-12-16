import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Form } from 'react-bootstrap';
import NavBar from './NavBar';

const Withdraw = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('sETH');
  const [balance, setBalance] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [amountToWithdraw, setAmountToWithdraw] = useState('');
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());

  // Update balance and exchange rate when cryptocurrency is selected
  useEffect(() => {
    if (selectedCrypto === 'sETH') {
      setBalance(10); // Example balance for sETH
      setExchangeRate(2000); // Example exchange rate for sETH
    } else if (selectedCrypto === 'mBTC') {
      setBalance(5); // Example balance for mBTC
      setExchangeRate(30000); // Example exchange rate for mBTC
    }
  }, [selectedCrypto]);

  // Calculate estimated value based on the selected cryptocurrency and amount to withdraw
  useEffect(() => {
    if (amountToWithdraw) {
      setEstimatedValue(amountToWithdraw * exchangeRate);
    } else {
      setEstimatedValue(0);
    }
  }, [amountToWithdraw, exchangeRate]);

    // Handle withdraw confirmation
    const handleConfirmWithdraw = () => {
        alert('Loan confirmed!');
        navigate('/home'); // Navigate to Home after confirmation (or another page)
      };

  return (
    <Container>
      {/* Navigation Bar */}
      <NavBar />

    <Row className="my-4">
        <Col>
            <h2>Withdraw</h2>
        </Col>
    </Row>

      {/* Top Section */}
      <Row className="my-3">
        <Col>
          <Form.Select
            aria-label="Select Cryptocurrency"
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value)}
          >
            <option value="sETH">sETH</option>
            <option value="mBTC">mBTC</option>
          </Form.Select>
        </Col>
      </Row>

      <Row className="my-3">
        <Col>
          <p>Your {selectedCrypto} balance is {balance}</p>
        </Col>
      </Row>

      <Row className="my-3">
        <Col>
          <p>Exchange rate: ${exchangeRate}</p>
          <p>Last updated: {lastUpdated}</p>
        </Col>
      </Row>

      {/* Main Section */}
      <Row className="my-3">
        <Col>
          <Form.Group controlId="amountToWithdraw">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              value={amountToWithdraw}
              onChange={(e) => setAmountToWithdraw(e.target.value)}
              placeholder="Amount"
              className="form-control-lg"
            />
          </Form.Group>
          <p>~${estimatedValue.toFixed(2)}</p>
        </Col>
        <Col>
            <text>Currency</text>
            <Card style={{ width: '5.5rem', height: '3rem', marginTop: '0.5rem', textAlign: 'center' }}>
                <Card.Body style={{ marginTop: '-0.5rem' }}>
                    <Card.Text style={{ fontSize: '1.2rem' }}>
                    {selectedCrypto}
                    </Card.Text>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* Confirm Button */}
      <Row>
        <Col md={12} className="text-center">
          <Button variant="primary" onClick={handleConfirmWithdraw}>
            Confirm
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Withdraw;