import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
    const navigate = useNavigate();

    const handleSignOut = () => {
      // Perform sign-out logic (e.g., clear user data, tokens)
      // After sign-out, redirect to login page
      navigate('/');
    };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Navbar.Toggle aria-controls="navbar-nav" />
      <Navbar.Collapse id="navbar-nav">
        <Nav className="ml-auto">
          <Nav.Item>
            <Nav.Link as={Link} to="/dashboard">Home</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/loan">Loan</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/deposit">Deposit</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/withdraw">Withdraw</Nav.Link>
          </Nav.Item>
          {/* Sign Out */}
          <Nav.Item>
            <Nav.Link onClick={handleSignOut} className="text-danger" style={{ cursor: 'pointer' }}>
              Sign Out
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavBar;
