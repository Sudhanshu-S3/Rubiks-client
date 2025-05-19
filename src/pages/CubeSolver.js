import React, { useState, useEffect, useRef } from 'react';
import FaceUpload from '../components/FaceUpload';
import EnhancedCubeModel from '../components/EnhancedCubeModel';
import SolutionSteps from '../components/SolutionSteps';
import './CubeSolver.css';

const URL = process.env.REACT_APP_API_URL || 'http://localhost:23230/';

const CubeSolver = () => {
    const [faceData, setFaceData] = useState({
        U: null, R: null, F: null, D: null, L: null, B: null
    });

    const [cubeState, setCubeState] = useState(null);
    const [solution, setSolution] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentMove, setCurrentMove] = useState(null);
    const cubeModelRef = useRef();

    // Check if all faces have been uploaded
    const allFacesUploaded = Object.values(faceData).every(face => face !== null);

    // Handle face upload completion
    const handleFaceUpload = (face, data) => {
        setFaceData(prev => ({
            ...prev,
            [face]: data
        }));
    };

    // Update cube state when all faces are uploaded
    useEffect(() => {
        if (allFacesUploaded) {
            // Transform the face data into the cube state format
            const state = {
                U: faceData.U.colors,
                R: faceData.R.colors,
                F: faceData.F.colors,
                D: faceData.D.colors,
                L: faceData.L.colors,
                B: faceData.B.colors
            };

            setCubeState(state);
        }
    }, [faceData, allFacesUploaded]);

    // Handle solve button click
    const handleSolve = async () => {
        if (!cubeState) {
            setError('Please upload all six faces first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${URL}/api/cube/solve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cubeState }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to solve cube');
            }

            setSolution(data);
        } catch (err) {
            console.error('Error solving cube:', err);
            setError(err.message || 'An error occurred while solving');
        } finally {
            setLoading(false);
        }
    };

    // Handle executing a move on the 3D model
    const executeMove = (move) => {
        setCurrentMove(move);
    };

    return (
        <div className="cube-solver-page">
            <h1>Rubik's Cube Solver</h1>
            <p className="instruction">Upload images of all six faces to get a step-by-step solution</p>

            {error && <div className="error-alert">{error}</div>}

            <div className="solver-container">
                <div className="faces-upload-section">
                    <h2>Upload Cube Faces</h2>
                    <div className="faces-grid">
                        {['U', 'R', 'F', 'D', 'L', 'B'].map(face => (
                            <FaceUpload
                                key={face}
                                face={face}
                                onUploadComplete={handleFaceUpload}
                            />
                        ))}
                    </div>

                    <button
                        className={`solve-button ${!allFacesUploaded ? 'disabled' : ''}`}
                        onClick={handleSolve}
                        disabled={!allFacesUploaded || loading}
                    >
                        {loading ? 'Processing...' : 'Solve Cube'}
                    </button>
                </div>

                <div className="visualization-section">
                    <div className="cube-model-container">
                        {cubeState ? (
                            <EnhancedCubeModel
                                initialState={cubeState}
                                currentMove={currentMove}
                                onMoveComplete={() => setCurrentMove(null)}
                                ref={cubeModelRef}
                            />
                        ) : (
                            <div className="placeholder-model">
                                <div className="cube-icon"></div>
                                <p>Upload all faces to see the 3D model</p>
                            </div>
                        )}
                    </div>

                    <div className="solution-container">
                        {solution ? (
                            <SolutionSteps
                                solution={solution}
                                onExecuteMove={executeMove}
                            />
                        ) : (
                            <div className="placeholder-solution">
                                <p>Solution will appear here once the cube is solved</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CubeSolver;