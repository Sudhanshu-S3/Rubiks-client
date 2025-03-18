import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">CubeSolver</Link>
            </div>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/features">Features</Link>
                <Link to="/solver">Solver</Link>
                <Link to="/tutorial">Tutorial</Link>
                <Link to="/community">Community</Link>
                <Link to="/faq">FAQ</Link>
                <Link to="/contact">Contact</Link>
            </div>
        </nav>
    );
}

export default Navbar;