import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    const navigate = useNavigate();

    // Navigate to solver page
    const handleStartSolving = () => {
        navigate('/solver');
    };

    // Navigate to features page
    const handleLearnMore = () => {
        navigate('/features');
    };

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
            <div className="home-buttons">
                <button onClick={handleStartSolving} className="btn btn-primary">Start Solving</button>
                <button onClick={handleLearnMore} className="btn btn-secondary">Learn More</button>
            </div>
        </nav>
    );
}

export default Navbar;