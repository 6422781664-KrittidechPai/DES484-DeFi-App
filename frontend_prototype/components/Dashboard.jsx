// src/components/Dashboard.js
import React, { useState } from 'react';
import { Button, Table, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import NavBar from './NavBar';

import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [username, setUsername] = useState('username');
  const [balance, setBalance] = useState(1);
  const [totalLoan, setLoanAmount] = useState(1);
  const [collateral, setBorrowLimit] = useState(1);
  const [collateralFactor, setCollateralFactor] = useState(1);
  const [loanRecords, setLoanRecords] = useState([
    { asset: 'BTC', borrowValue: '0.0000099 BTC', borrowValueUSD: 1000 },
    { asset: 'ETH', borrowValue: '0.00026 ETH', borrowValueUSD: 1500 },
  ]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());

  // Calculate remaining borrowable value
  const remainingBorrowableValue = balance * collateralFactor - totalLoan;

  // Calculate health status
  const healthStatus = collateral < 50 ? 'Healthy' : collateral < 75 ? 'Risky' : 'Critical';
  const healthStatusColor = collateral < 50 ? 'success' : collateral < 75 ? 'warning' : 'danger';

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
          <h2 className="h2-dashboard">User: {username}</h2>
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
        </Col>
        <Col md={4}>
          <text>Total</text>
          <Card>
            <Card.Body>
              <Card.Text>${totalLoan}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <text>Collateral</text>
          <Card>
            <Card.Body>
              <Card.Text>${collateral}</Card.Text>
            </Card.Body>
          </Card>
          <text>
            Health:
            <span
              className={`ms-2 rounded-circle p-2 text-white bg-${healthStatusColor}`}
              style={{ width: '12px', height: '12px', display: 'inline-block' }}
            />
            {healthStatus}
            <span className="ms-3">
              Remaining: {remainingBorrowableValue < 0 ? `-$${Math.abs(remainingBorrowableValue).toFixed(2)}` : `$${remainingBorrowableValue.toFixed(2)}`}
            </span>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loanRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.asset}</td>
                  <td>
                    {record.borrowValue}
                    <br />
                    <small>~${record.borrowValueUSD}</small>
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
