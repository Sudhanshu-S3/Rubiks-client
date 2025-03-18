import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    return (
        <div className="home">
            <div className="home-content">
                <div className="home-text">
                    <h1>
                        Solve Your Rubik's Cube
                        <span className="highlight">With AI Precision</span>
                    </h1>
                    <p>
                        Upload images of your cube's faces and get step-by-step solutions instantly.
                        Master the art of cube solving with our advanced AI technology.
                    </p>
                    <div className="home-buttons">
                        <Link to="/solver" className="btn btn-primary">Start Solving</Link>
                        <Link to="/features" className="btn btn-secondary">Learn More</Link>
                    </div>
                </div>
                <div className="home-image">
                    <div className="cube-wireframe"></div>
                </div>
            </div>
        </div>
    );
}

export default Home;