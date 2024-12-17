import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form } from 'react-bootstrap';

const Repayment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve the cryptocurrency name from the URL
  const cryptoName = new URLSearchParams(location.search).get('cryptoName');
  
  // Example data for interest rate and currency value
  const interestRates = {
    BTC: 5.0,  // Example interest rate in percentage
    ETH: 4.5,  // Example interest rate in percentage
  };
  
  const exchangeRates = {
    BTC: 106894.30,  // Example exchange rate in USD
    ETH: 3987.32,   // Example exchange rate in USD
  };

  const [amountToRepay, setAmountToRepay] = useState(0);
  const [interestRate, setInterestRate] = useState(interestRates[cryptoName] || 0);
  const [currencyValue, setCurrencyValue] = useState(exchangeRates[cryptoName] || 0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (!cryptoName) {
      navigate('/dashboard'); // Redirect to dashboard if no cryptoName is passed
    }
  }, [cryptoName, navigate]);

  useEffect(() => {
    // Update total value when amount to repay changes
    const newTotalValue = amountToRepay * currencyValue;
    setTotalValue(newTotalValue);
  }, [amountToRepay, currencyValue]);

  const handleConfirmRepayment = () => {
    alert(`Repayment of ${amountToRepay} ${cryptoName} completed.`);
    navigate('/dashboard');
  };

  return (
    <Container>
        <Row className="my-4">
            <Col>
                <h2>Repayment</h2>
            </Col>
        </Row>

        <Form.Group>
        <div className="mb-3">
            <label htmlFor="amountToRepay" className="form-label">Enter Amount to Repay:</label>
            <input
            type="number"
            id="amountToRepay"
            value={amountToRepay}
            onChange={(e) => setAmountToRepay(e.target.value)}
            placeholder="Amount"
            />
        </div>
        </Form.Group>

      {/* Repayment Summary Table */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Repayment Summary</Card.Title>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>Interest Rate (%)</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{cryptoName}</td>
                    <td>{interestRate}%</td>
                    <td>
                      {amountToRepay} {cryptoName}
                      <br />
                      <small>~${(totalValue).toFixed(2)}</small>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
            <Card.Body>
              <Card.Title>Total Repayment</Card.Title>
              <Card.Text>
                {(amountToRepay * (1 + interestRate / 100)).toFixed(2)} {cryptoName}
                <br />
                <small>~${(totalValue * (1 + interestRate / 100)).toFixed(2)}</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>      
      
      {/* Confirm Button */}
      <Row>
        <Col md={12} className="text-center">
          <Button variant="primary" onClick={handleConfirmRepayment}>
            Confirm
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Repayment;