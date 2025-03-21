import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SolutionViewer from '../components/SolutionViewer';
import EnhancedCubeModel from '../components/EnhancedCubeModel';
import './Solver.css';

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

    // Check if all faces are uploaded and processed
    useEffect(() => {
        const allFacesProcessed = Object.values(faceColors).every(face =>
            face.every(row => row.every(color => color !== null))
        );

        setUploadComplete(allFacesProcessed);
    }, [faceColors]);

    // Handle image upload for a face
    const handleImageUpload = async (face, e) => {
        const file = e.target.files[0];
        if (!file) return;

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

            const formData = new FormData();
            formData.append('image', file);
            formData.append('face', face);

            // Send to API for processing
            const response = await axios.post('http://localhost:5000/api/cube/processCubeImage', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                // Update the detected colors
                setFaceColors(prev => ({
                    ...prev,
                    [face]: response.data.colors
                }));

                setProcessingStatus({ ...processingStatus, [face]: 'success' });
                setError('');
            } else {
                throw new Error(response.data.error || 'Failed to process image');
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

            // Send complete cube state for solving
            const response = await axios.post('http://localhost:5000/api/cube/compile', {
                faces: faceColors
            });

            if (response.data.success) {
                const solutionData = response.data;

                // Store the original state for resets
                solutionData.origState = { ...faceColors };

                setSolution(solutionData);
                setCurrentMoveIndex(-1); // Reset to initial state
                setError('');
            } else {
                throw new Error(response.data.error || 'Failed to solve cube');
            }
        } catch (error) {
            console.error('Error solving cube:', error);
            setError(`Failed to solve cube: ${error.message}`);
            setSolution(null);
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
                const response = await fetch(`/imageDemo/${getFaceName(face).split(' ')[0]}.jpeg`);
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
                const apiResponse = await axios.post('http://localhost:5000/api/cube/processCubeImage', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (apiResponse.data.success) {
                    // Update the detected colors
                    setFaceColors(prev => ({
                        ...prev,
                        [face]: apiResponse.data.colors
                    }));
                    setProcessingStatus(prev => ({ ...prev, [face]: 'success' }));
                } else {
                    throw new Error(apiResponse.data.error || `Failed to process ${face} face`);
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
        setSolution(null);
    };

    // Handle solution move completion
    const handleMoveComplete = () => {
        setIsAnimating(false);
    };

    // Execute a specific move in the solution
    const executeMove = (moveIndex) => {
        if (!solution || !solution.solution || isAnimating) return;

        const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
        if (moveIndex >= 0 && moveIndex < moves.length) {
            setCurrentMoveIndex(moveIndex);
            setIsAnimating(true);

            if (cubeModelRef.current) {
                cubeModelRef.current.executeMove(moves[moveIndex]);
            }
        } else {
            setIsAnimating(false);
        }
    };

    // Go to next move
    const nextMove = () => {
        if (currentMoveIndex < (solution?.solution?.split(' ').filter(m => m.trim() !== '').length - 1)) {
            executeMove(currentMoveIndex + 1);
        }
    };

    // Go to previous move
    const prevMove = () => {
        if (currentMoveIndex > 0) {
            // Apply inverse of previous moves to go back
            resetToInitialState();

            // Then apply all moves up to the target move
            const moves = solution.solution.split(' ').filter(m => m.trim() !== '');
            const targetIndex = currentMoveIndex - 1;

            if (cubeModelRef.current) {
                cubeModelRef.current.queueMoves(moves.slice(0, targetIndex + 1));
                setCurrentMoveIndex(targetIndex);
            }
        } else if (currentMoveIndex === 0) {
            resetToInitialState();
            setCurrentMoveIndex(-1);
        }
    };

    // Reset to initial state
    const resetToInitialState = () => {
        setCurrentMoveIndex(-1);
        setIsAnimating(false);

        if (cubeModelRef.current && solution && solution.origState) {
            // Re-initialize the cube model with the initial state
            // Small timeout to ensure the state resets properly
            setTimeout(() => {
                cubeModelRef.current = cubeModelRef.current;
            }, 10);
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
                                    onChange={(e) => handleImageUpload(face, e)}
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
                                    initialState={faceColors}
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