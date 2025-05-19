import React, { useState, useEffect, useRef } from 'react';
import SolutionViewer from '../components/SolutionViewer';
import EnhancedCubeModel from '../components/EnhancedCubeModel';
import './Solver.css';
import { processCubeImage, solveCube } from '../utils/cubeApi';

function Solver() {
    const [cubeImages, setCubeImages] = useState({
        U: null, R: null, F: null, D: null, L: null, B: null
    });

    const [faceColors, setFaceColors] = useState({
        U: Array(3).fill().map(() => Array(3).fill(null)),
        R: Array(3).fill().map(() => Array(3).fill(null)),
        F: Array(3).fill().map(() => Array(3).fill(null)),
        D: Array(3).fill().map(() => Array(3).fill(null)),
        L: Array(3).fill().map(() => Array(3).fill(null)),
        B: Array(3).fill().map(() => Array(3).fill(null))
    });

    const [cubeState, setCubeState] = useState(null);
    const [originalCubeState, setOriginalCubeState] = useState(null);

    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState(null);
    const [solutionMoves, setSolutionMoves] = useState([]);
    const [error, setError] = useState('');
    const [currentFace, setCurrentFace] = useState(null);
    const [uploadComplete, setUploadComplete] = useState(false);
    const cubeModelRef = useRef(null);
    const [processingStatus, setProcessingStatus] = useState({
        U: 'pending', R: 'pending', F: 'pending',
        D: 'pending', L: 'pending', B: 'pending'
    });

    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentMove, setCurrentMove] = useState(null);

    useEffect(() => {
        const allFacesProcessed = Object.values(faceColors).every(faceArray =>
            faceArray.every(row => row.every(color => color !== null))
        );

        setUploadComplete(allFacesProcessed);

        if (allFacesProcessed) {
            const newCubeStateFromFaces = { ...faceColors };
            setCubeState(JSON.parse(JSON.stringify(newCubeStateFromFaces)));
            setOriginalCubeState(JSON.parse(JSON.stringify(newCubeStateFromFaces)));
            setCurrentMoveIndex(-1);
            setSolutionMoves([]);
            setSolution(null);
        }
    }, [faceColors]);

    const handleFaceUpload = async (file, face) => {
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCubeImages(prev => ({ ...prev, [face]: event.target.result }));
            };
            reader.readAsDataURL(file);

            setLoading(true);
            setProcessingStatus(prev => ({ ...prev, [face]: 'processing' }));
            setError('');

            const response = await processCubeImage(file, face);

            if (response && response.colors) {
                setFaceColors(prev => ({ ...prev, [face]: response.colors }));
                setProcessingStatus(prev => ({ ...prev, [face]: 'success' }));
            } else {
                throw new Error(response.error || `Failed to process ${face} face.`);
            }
        } catch (err) {
            console.error(`Error processing ${face} face:`, err);
            setError(err.message || `An error occurred with ${face} face.`);
            setProcessingStatus(prev => ({ ...prev, [face]: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSolve = async () => {
        if (!uploadComplete || !originalCubeState) {
            setError('Please upload and process all six faces first.');
            return;
        }

        setLoading(true);
        setError('');
        setSolution(null);
        setSolutionMoves([]);
        setCurrentMoveIndex(-1);

        try {
            const data = await solveCube(originalCubeState);

            if (data && data.solution) {
                setSolution(data);
                const movesArray = data.solution.split(' ').filter(m => m.trim() !== '');
                setSolutionMoves(movesArray);
                resetToInitialState();
            } else {
                throw new Error(data.error || 'Failed to get a valid solution.');
            }
        } catch (err) {
            console.error('Error solving cube:', err);
            setError(err.message || 'An error occurred while solving.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setLoading(true);
        setError('');

        try {
            // Define the faces we need to load
            const faces = ['U', 'R', 'F', 'D', 'L', 'B'];

            // Process each face sequentially
            for (const face of faces) {
                // Set current face being processed
                setCurrentFace(face);

                // Fetch the demo image
                const response = await fetch(`${process.env.PUBLIC_URL}/imageDemo/${getFaceName(face).split(' ')[0]}.jpeg`);
                const blob = await response.blob();

                // Create a file object from the blob
                const file = new File([blob], `${face}.jpeg`, { type: 'image/jpeg' });

                // Display image preview immediately
                const reader = new FileReader();
                reader.onload = (event) => {
                    setCubeImages(prev => ({
                        ...prev,
                        [face]: event.target.result
                    }));
                };
                reader.readAsDataURL(blob);

                // Set processing status
                setProcessingStatus(prev => ({ ...prev, [face]: 'processing' }));

                // Create form data for API request
                const formData = new FormData();
                formData.append('image', file);
                formData.append('face', face);

                // Process image with backend API
                const responses = await processCubeImage(file, face);

                if (responses.success) {
                    // Update the detected colors
                    setFaceColors(prev => ({
                        ...prev,
                        [face]: responses.colors
                    }));
                    setProcessingStatus(prev => ({ ...prev, [face]: 'success' }));
                } else {
                    throw new Error(responses.error || `Failed to process ${face} face`);
                }

                // Add a small delay between face processing to avoid overwhelming the backend
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // After all faces are processed, solve the cube
            setTimeout(() => {
                handleSolve();
            }, 1000);

        } catch (error) {
            console.error('Error in demo mode:', error);
            setError(`Demo mode error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveComplete = (moveNotation) => {
        setIsAnimating(false);
    };

    const nextMove = () => {
        if (isAnimating || !solutionMoves.length || currentMoveIndex >= solutionMoves.length - 1) {
            return;
        }
        const newIndex = currentMoveIndex + 1;
        setCurrentMoveIndex(newIndex);
        setIsAnimating(true);
        setCurrentMove(solutionMoves[newIndex]);
    };

    const prevMove = () => {
        if (isAnimating || !solutionMoves.length || currentMoveIndex < 0) {
            return;
        }

        const targetIndex = currentMoveIndex - 1;

        if (originalCubeState) {
            setCubeState(JSON.parse(JSON.stringify(originalCubeState)));
        }
        setCurrentMove(null);
        setCurrentMoveIndex(targetIndex);
        setIsAnimating(false);
    };

    const resetToInitialState = () => {
        if (originalCubeState) {
            setCubeState(JSON.parse(JSON.stringify(originalCubeState)));
        }
        setCurrentMoveIndex(-1);
        setIsAnimating(false);
        setCurrentMove(null);
    };

    return (
        <div className="solver-page">
            <h1>Rubik's Cube Solver</h1>
            <p className="solver-description">
                Upload images of your cube faces to get step-by-step solutions.
                <br />Take clear photos of each face with good lighting for best results.
            </p>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            <div className="solver-container">
                <div className="upload-section">
                    <h2>Upload Cube Faces</h2>
                    <p className="upload-instruction">Take photos of each face holding the cube with white on top and green in front</p>

                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${Object.values(cubeImages).filter(Boolean).length * 16.6}%` }}
                            ></div>
                        </div>
                        <p>{Object.values(cubeImages).filter(Boolean).length}/6 faces uploaded</p>
                    </div>

                    <div className="face-uploads">
                        {['U', 'R', 'F', 'D', 'L', 'B'].map(face => (
                            <div
                                className={`face-upload ${currentFace === face ? 'active' : ''} ${cubeImages[face] ? 'uploaded' : ''}`}
                                key={face}
                                onClick={() => setCurrentFace(face)}
                            >
                                <label htmlFor={`${face}-face`}>
                                    <div className={`upload-box ${processingStatus[face] === 'success' ? 'processed' : processingStatus[face] === 'error' ? 'error' : ''}`}>
                                        {cubeImages[face] ? (
                                            <div className="image-container">
                                                <img src={cubeImages[face]} alt={`${face} face`} className="face-preview" />
                                                {processingStatus[face] === 'processing' && (
                                                    <div className="processing-overlay">Processing...</div>
                                                )}
                                                {processingStatus[face] === 'success' && (
                                                    <div className="color-grid-overlay">
                                                        {faceColors[face].map((row, rowIdx) => (
                                                            <div className="color-row" key={rowIdx}>
                                                                {row.map((color, colIdx) => (
                                                                    <div
                                                                        className="color-cell"
                                                                        key={colIdx}
                                                                        style={{ backgroundColor: color }}
                                                                    ></div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="upload-icon"></div>
                                                <p>{getFaceName(face)} Face</p>
                                                <small>{getFaceInstructions(face)}</small>
                                            </>
                                        )}
                                    </div>
                                </label>
                                <input
                                    type="file"
                                    id={`${face}-face`}
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleFaceUpload(e.target.files[0], face)}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="button-group">
                        <button
                            className="btn btn-secondary demo-btn"
                            onClick={handleDemo}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Try Demo'}
                        </button>

                        <button
                            className={`btn ${uploadComplete ? 'btn-primary' : 'btn-disabled'} solve-btn`}
                            onClick={handleSolve}
                            disabled={loading || !uploadComplete}
                        >
                            {loading ? 'Processing...' : uploadComplete ? 'Solve Cube' : 'Upload All Faces First'}
                        </button>
                    </div>
                </div>

                <div className="solution-section">
                    <div className="solution-header">
                        <h2>Solution Steps</h2>
                        {solution && (
                            <button className="btn btn-secondary" onClick={resetToInitialState}>
                                Reset Animation
                            </button>
                        )}
                    </div>

                    {solution ? (
                        <div className="solution-container">
                            <div className="cube-visualization">
                                <EnhancedCubeModel
                                    initialState={cubeState}
                                    currentMove={currentMove}
                                    ref={cubeModelRef}
                                    onMoveComplete={handleMoveComplete}
                                    enableControls={!isAnimating}
                                />

                                <div className="solution-controls">
                                    <button
                                        className="control-btn"
                                        title="Reset to Start"
                                        onClick={resetToInitialState}
                                        disabled={isAnimating || currentMoveIndex < 0}
                                    >
                                        ⏮️
                                    </button>
                                    <button
                                        className="control-btn"
                                        title="Previous Step"
                                        onClick={prevMove}
                                        disabled={isAnimating || currentMoveIndex <= 0}
                                    >
                                        ⏪
                                    </button>
                                    <button
                                        className="control-btn"
                                        title="Next Step"
                                        onClick={nextMove}
                                        disabled={isAnimating || !solutionMoves.length || currentMoveIndex >= solutionMoves.length - 1}
                                    >
                                        ⏩
                                    </button>
                                </div>

                                {currentMoveIndex >= 0 && solutionMoves[currentMoveIndex] && (
                                    <div className="current-move">
                                        <h3>Current Move: <span className="move-notation">{solutionMoves[currentMoveIndex]}</span></h3>
                                        <p>Move {currentMoveIndex + 1} of {solutionMoves.length}</p>
                                    </div>
                                )}
                            </div>

                            <div className="solution-steps">
                                <SolutionViewer
                                    cubeState={originalCubeState || faceColors}
                                    solution={solution}
                                    currentMoveIndex={currentMoveIndex}
                                    onSelectMove={(moveData) => {
                                        if (!isAnimating && solutionMoves.length > 0 && originalCubeState) {
                                            setIsAnimating(true);
                                            setCubeState(JSON.parse(JSON.stringify(originalCubeState)));
                                            setCurrentMoveIndex(moveData.index);
                                            setTimeout(() => {
                                                setCurrentMove(moveData.notation);
                                            }, 50);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="solution-preview">
                            <EnhancedCubeModel
                                initialState={cubeState || faceColors}
                                ref={cubeModelRef}
                                enableControls={true}
                            />
                            <div className="solution-placeholder">
                                <div className="placeholder-content">
                                    <div className="placeholder-icon"></div>
                                    <p>{uploadComplete ? 'Click "Solve Cube" to see the solution' : 'Upload all six faces to see the solution'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getFaceName(face) {
    const names = {
        'F': 'Front (Green)',
        'B': 'Back (Blue)',
        'U': 'Top (White)',
        'D': 'Bottom (Yellow)',
        'L': 'Left (Orange)',
        'R': 'Right (Red)'
    };
    return names[face] || face;
}

function getFaceInstructions(face) {
    const instructions = {
        'F': 'Hold the cube with white on top and green center facing the camera',
        'B': 'Hold the cube with white on top and blue center facing the camera',
        'U': 'Hold the cube with green in front and white center facing the camera',
        'D': 'Hold the cube with green in front and yellow center facing the camera',
        'L': 'Hold the cube with white on top and orange center facing the camera',
        'R': 'Hold the cube with white on top and red center facing the camera'
    };
    return instructions[face] || '';
}

export default Solver;