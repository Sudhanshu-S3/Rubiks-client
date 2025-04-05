import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SolutionViewer from '../components/SolutionViewer';
import EnhancedCubeModel from '../components/EnhancedCubeModel';
import './Solver.css';
import { processCubeImage, solveCube } from '../utils/cubeApi';

function Solver() {
    // State for cube images and detected colors
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

    // Add missing state variables for cube state tracking
    const [cubeState, setCubeState] = useState(null);
    const [originalCubeState, setOriginalCubeState] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState(null);
    const [error, setError] = useState('');
    const [currentFace, setCurrentFace] = useState(null);
    const [uploadComplete, setUploadComplete] = useState(false);
    const cubeModelRef = useRef(null);
    const [processingStatus, setProcessingStatus] = useState({
        U: 'pending', R: 'pending', F: 'pending',
        D: 'pending', L: 'pending', B: 'pending'
    });

    // Solution visualization states
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentMove, setCurrentMove] = useState(null);

    // Check if all faces are uploaded and processed
    useEffect(() => {
        const allFacesProcessed = Object.values(faceColors).every(face =>
            face.every(row => row.every(color => color !== null))
        );

        setUploadComplete(allFacesProcessed);

        // If all faces are processed, update cube state
        if (allFacesProcessed) {
            setCubeState({ ...faceColors });
        }
    }, [faceColors]);

    // Handle image upload for a face
    const handleFaceUpload = async (file, face) => {
        try {
            // Update UI immediately with image preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setCubeImages({
                    ...cubeImages,
                    [face]: event.target.result
                });
                setCurrentFace(face);
            };
            reader.readAsDataURL(file);

            // Process image with backend
            setLoading(true);
            setProcessingStatus({ ...processingStatus, [face]: 'processing' });

            // Use shared API function
            const response = await processCubeImage(file, face);

            if (response.success) {
                // Update the detected colors
                setFaceColors(prev => ({
                    ...prev,
                    [face]: response.colors
                }));
                setProcessingStatus({ ...processingStatus, [face]: 'success' });
                setError('');
            } else {
                throw new Error(response.error || 'Failed to process image');
            }
        } catch (error) {
            console.error('Error processing face image:', error);
            setError(`Failed to process ${face} face: ${error.message}`);
            setProcessingStatus({ ...processingStatus, [face]: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Solve the cube with all processed faces
    const handleSolve = async () => {
        if (!uploadComplete) {
            setError('Please process all cube faces before solving');
            return;
        }

        try {
            setLoading(true);

            // Send complete cube state for solving using shared API
            const solutionData = await solveCube(faceColors);

            if (solutionData.success) {
                // Store the original state for resets
                setOriginalCubeState({ ...faceColors });
                setCubeState({ ...faceColors });
                setSolution({
                    ...solutionData,
                    origState: { ...faceColors } // Add original state to solution
                });
                setCurrentStep(0);
                setCurrentMoveIndex(-1); // Reset move index
                setCurrentMove(null); // Reset current move
            } else {
                throw new Error(solutionData.error || 'Failed to solve cube');
            }
        } catch (error) {
            console.error('Error solving cube:', error);
            setError(`Failed to solve cube: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle demo button click - load sample images and solve
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

    const handleResetSolution = () => {
        resetToInitialState();
        // Don't set solution to null if you want to keep the solution visible
        // setSolution(null);
    };

    // Modified handleMoveComplete function
    const handleMoveComplete = (moveData) => {
        setIsAnimating(false);
        setCurrentMove(null);

        // If there's a moveIndex, update the currentMoveIndex
        if (typeof moveData === 'object' && moveData.index !== undefined) {
            setCurrentMoveIndex(moveData.index);
        } else if (currentMoveIndex >= 0) {
            // Increment the move index if it's a direct move
            setCurrentMoveIndex(currentMoveIndex + 1);
        }

        // Process any queued moves
        if (moveQueue.length > 0) {
            const nextMove = moveQueue.shift();
            setMoveQueue([...moveQueue]); // Create new array to force update
            executeMove(nextMove);
        }
    };

    // Add a move queue for sequential execution
    const [moveQueue, setMoveQueue] = useState([]);

    // Modified executeMove function to handle both index and notation
    const executeMove = (moveData) => {
        if (!solution || !solution.solution) return;

        // Handle both formats: direct move notation or {index, notation} object
        let moveIndex = -1;
        let moveNotation = '';

        if (typeof moveData === 'string') {
            // Direct move notation
            moveNotation = moveData;
            // Find the index in the solution
            moveIndex = solution.solution.split(' ')
                .filter(m => m.trim() !== '')
                .findIndex(m => m === moveData);
        } else if (typeof moveData === 'object') {
            // Object with index and notation
            moveIndex = moveData.index;
            moveNotation = moveData.notation;
        } else if (typeof moveData === 'number') {
            // Just index
            const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
            if (moveData >= 0 && moveData < moves.length) {
                moveIndex = moveData;
                moveNotation = moves[moveData];
            }
        }

        if (moveIndex >= 0 && moveNotation) {
            setCurrentMoveIndex(moveIndex);
            setIsAnimating(true);
            setCurrentMove(moveNotation);

            if (cubeModelRef.current) {
                cubeModelRef.current.executeMove(moveNotation);
            }
        }
    };

    // Go to next move
    const nextMove = () => {
        if (isAnimating) return; // Don't allow new moves while animating

        if (currentMoveIndex < (solution?.solution?.split(' ').filter(m => m.trim() !== '').length - 1)) {
            executeMove(currentMoveIndex + 1);
        }
    };

    // Improved prevMove function
    const prevMove = () => {
        if (isAnimating || !solution) return;

        if (currentMoveIndex > 0) {
            // Reset to initial state
            resetToInitialState();

            // Then reapply all moves up to the target
            const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
            const targetIndex = currentMoveIndex - 1;

            // Allow time for reset to complete
            setTimeout(() => {
                if (cubeModelRef.current) {
                    // Queue all moves up to but not including the current move
                    const movesToExecute = moves.slice(0, targetIndex + 1);
                    cubeModelRef.current.queueMoves(movesToExecute);

                    // Update move index after queuing
                    setCurrentMoveIndex(targetIndex);
                }
            }, 100);
        } else if (currentMoveIndex === 0) {
            resetToInitialState();
        }
    };

    // Reset to initial state
    const resetToInitialState = () => {
        setCurrentMoveIndex(-1);
        setIsAnimating(false);
        setCurrentMove(null);
        setMoveQueue([]);

        // Reset cube state to original
        if (originalCubeState) {
            setCubeState({ ...originalCubeState });

            // Give time to update state before resetting the model
            setTimeout(() => {
                if (cubeModelRef.current) {
                    // Force re-render by updating the ref with original state
                    cubeModelRef.current = { ...cubeModelRef.current };
                }
            }, 50);
        }
    };

    // Get the current move for display
    const getCurrentMoveDisplay = () => {
        if (!solution || currentMoveIndex < 0) return '';

        const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
        return moves[currentMoveIndex] || '';
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
                        {/* Face upload UI for each face */}
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

                {/* Solution display section */}
                <div className="solution-section">
                    <div className="solution-header">
                        <h2>Solution Steps</h2>
                        {solution && (
                            <button className="btn btn-secondary" onClick={handleResetSolution}>
                                Reset
                            </button>
                        )}
                    </div>

                    {solution ? (
                        <div className="solution-container">
                            {/* 3D Cube Visualization */}
                            <div className="cube-visualization">
                                <EnhancedCubeModel
                                    initialState={cubeState || faceColors}
                                    currentMove={currentMove}
                                    ref={cubeModelRef}
                                    onMoveComplete={handleMoveComplete}
                                    enableControls={!isAnimating}
                                />

                                <div className="solution-controls">
                                    <button
                                        className="control-btn"
                                        onClick={resetToInitialState}
                                        disabled={isAnimating || currentMoveIndex < 0}
                                    >
                                        ⏮️
                                    </button>
                                    <button
                                        className="control-btn"
                                        onClick={prevMove}
                                        disabled={isAnimating || currentMoveIndex <= 0}
                                    >
                                        ⏪
                                    </button>
                                    <button
                                        className="control-btn"
                                        onClick={nextMove}
                                        disabled={isAnimating || currentMoveIndex >= (solution?.solution?.split(' ').filter(m => m.trim() !== '').length - 1)}
                                    >
                                        ⏩
                                    </button>
                                </div>

                                {/* Current Move Display */}
                                {currentMoveIndex >= 0 && (
                                    <div className="current-move">
                                        <h3>Current Move: <span className="move-notation">{getCurrentMoveDisplay()}</span></h3>
                                        <p>Move {currentMoveIndex + 1} of {solution.solution.split(' ').filter(m => m.trim() !== '').length}</p>
                                    </div>
                                )}
                            </div>

                            {/* Solution Steps Text */}
                            <div className="solution-steps">
                                <SolutionViewer
                                    cubeState={faceColors}
                                    solution={solution}
                                    currentMoveIndex={currentMoveIndex}
                                    onSelectMove={(index) => {
                                        if (!isAnimating) {
                                            if (index <= currentMoveIndex) {
                                                resetToInitialState();
                                                setTimeout(() => {
                                                    const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
                                                    if (cubeModelRef.current) {
                                                        cubeModelRef.current.queueMoves(moves.slice(0, index + 1));
                                                        setCurrentMoveIndex(index);
                                                    }
                                                }, 50);
                                            } else if (index === currentMoveIndex + 1) {
                                                nextMove();
                                            } else {
                                                resetToInitialState();
                                                setTimeout(() => {
                                                    const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
                                                    if (cubeModelRef.current) {
                                                        cubeModelRef.current.queueMoves(moves.slice(0, index + 1));
                                                        setCurrentMoveIndex(index);
                                                    }
                                                }, 50);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="solution-preview">
                            {uploadComplete && (
                                <EnhancedCubeModel
                                    initialState={faceColors}
                                    ref={cubeModelRef}
                                    onMoveComplete={() => { }}
                                />
                            )}
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
        'F': 'Hold the cube with white face on top',
        'B': 'Rotate the cube 180° from front position',
        'U': 'White center facing the camera',
        'D': 'Yellow center facing the camera',
        'L': 'Orange center facing the camera',
        'R': 'Red center facing the camera'
    };
    return instructions[face] || '';
}

export default Solver;