import React, { useState, useEffect } from 'react';
import './Home.css';
import EnhancedCubeModel from '../components/EnhancedCubeModel';

function Home() {
    const [scramble, setScramble] = useState(false);
    const [colorFill, setColorFill] = useState(false);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [scrambleSequence, setScrambleSequence] = useState('');
    const [colorPattern, setColorPattern] = useState(null);

    // Subscribe to scramble sequence and color fill events
    useEffect(() => {
        const handleScrambleEvent = (event) => {
            setScrambleSequence(event.detail.sequence);
            setColorPattern(null); // Clear color pattern when scrambling
        };

        const handleColorFillEvent = (event) => {
            setColorPattern(event.detail.colorPattern);
            setScrambleSequence(''); // Clear scramble sequence when filling colors
        };

        window.addEventListener('scrambleGenerated', handleScrambleEvent);
        window.addEventListener('colorFillGenerated', handleColorFillEvent);

        return () => {
            window.removeEventListener('scrambleGenerated', handleScrambleEvent);
            window.removeEventListener('colorFillGenerated', handleColorFillEvent);
        };
    }, []);

    const handleScramble = () => {
        setScramble(true);
        setButtonDisabled(true);
    };

    const handleColorFill = () => {
        setColorFill(true);
        setButtonDisabled(true);
    };

    const handleScrambleComplete = () => {
        setScramble(false);
        setButtonDisabled(false);
    };

    const handleColorFillComplete = () => {
        setColorFill(false);
        setButtonDisabled(false);
    };

    const colorBoxStyle = (color) => ({
        display: 'inline-block',
        width: '20px',
        height: '20px',
        backgroundColor: color,
        marginRight: '5px',
        border: '1px solid #333'
    });

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
                        <a href="#solver" className="btn btn-primary">Start Solving</a>
                        <a href="#features" className="btn btn-secondary">Learn More</a>
                        <button
                            className="btn btn-scramble"
                            onClick={handleScramble}
                            disabled={buttonDisabled}
                        >
                            {buttonDisabled && scramble ? 'Scrambling...' : 'Scramble Cube'}
                        </button>
                        <button
                            className="btn btn-color-fill"
                            onClick={handleColorFill}
                            disabled={buttonDisabled}
                        >
                            {buttonDisabled && colorFill ? 'Filling Colors...' : 'Fill Colors'}
                        </button>
                    </div>

                    {scrambleSequence && (
                        <div className="scramble-notation">
                            <h3>Scramble Sequence:</h3>
                            <p>{scrambleSequence}</p>
                        </div>
                    )}

                    {colorPattern && (
                        <div className="color-pattern">
                            <h3>Color Pattern:</h3>
                            <div className="color-faces">
                                <div className="color-face">
                                    <span>Right: </span>
                                    <span style={colorBoxStyle(colorPattern.right)}></span>
                                </div>
                                <div className="color-face">
                                    <span>Left: </span>
                                    <span style={colorBoxStyle(colorPattern.left)}></span>
                                </div>
                                <div className="color-face">
                                    <span>Top: </span>
                                    <span style={colorBoxStyle(colorPattern.top)}></span>
                                </div>
                                <div className="color-face">
                                    <span>Bottom: </span>
                                    <span style={colorBoxStyle(colorPattern.bottom)}></span>
                                </div>
                                <div className="color-face">
                                    <span>Front: </span>
                                    <span style={colorBoxStyle(colorPattern.front)}></span>
                                </div>
                                <div className="color-face">
                                    <span>Back: </span>
                                    <span style={colorBoxStyle(colorPattern.back)}></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="home-image">
                    <EnhancedCubeModel
                        scramble={scramble}
                        onScrambleComplete={handleScrambleComplete}
                        colorFill={colorFill}
                        onColorFillComplete={handleColorFillComplete}
                    />
                </div>
            </div>
        </div>
    );
}

export default Home;