import React, { useState, useEffect } from 'react';
import './SolutionViewer.css';

const SolutionViewer = ({ cubeState, solution, currentMoveIndex, onSelectMove }) => {
    const [expandedStep, setExpandedStep] = useState(null);
    const [solutionSteps, setSolutionSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Process the solution into organized steps when solution changes
    useEffect(() => {
        if (solution && solution.solution) {
            // Parse the solution string into an array of moves
            const moves = solution.solution.split(' ').filter(m => m.trim() !== '');

            // Group moves into logical steps (this is a simplified approach)
            // You can customize this based on your cube solving method/algorithm
            const steps = [];

            // Get algorithm type if available
            const algorithmType = solution.algorithm_type || 'CFOP Method';

            // Create steps based on the algorithm type
            if (algorithmType.includes('CFOP')) {
                // CFOP method steps
                const crossMoves = moves.slice(0, Math.floor(moves.length * 0.25));
                const f2lMoves = moves.slice(crossMoves.length, Math.floor(moves.length * 0.6));
                const ollMoves = moves.slice(crossMoves.length + f2lMoves.length, Math.floor(moves.length * 0.8));
                const pllMoves = moves.slice(crossMoves.length + f2lMoves.length + ollMoves.length);

                steps.push({
                    title: 'Cross',
                    description: 'Form the white cross on the bottom layer',
                    moves: crossMoves
                });

                steps.push({
                    title: 'F2L',
                    description: 'First two layers: Pair corners with edges',
                    moves: f2lMoves
                });

                steps.push({
                    title: 'OLL',
                    description: 'Orient last layer: Make the top face all yellow',
                    moves: ollMoves
                });

                steps.push({
                    title: 'PLL',
                    description: 'Permute last layer: Arrange the final pieces',
                    moves: pllMoves
                });
            } else if (algorithmType.includes('Beginner')) {
                // Beginner method steps (simplified)
                const step1 = moves.slice(0, Math.floor(moves.length * 0.2));
                const step2 = moves.slice(step1.length, Math.floor(moves.length * 0.4));
                const step3 = moves.slice(step1.length + step2.length, Math.floor(moves.length * 0.6));
                const step4 = moves.slice(step1.length + step2.length + step3.length, Math.floor(moves.length * 0.8));
                const step5 = moves.slice(step1.length + step2.length + step3.length + step4.length);

                steps.push({
                    title: 'White Cross',
                    description: 'Create a white cross on the bottom',
                    moves: step1
                });

                steps.push({
                    title: 'White Corners',
                    description: 'Position the white corner pieces',
                    moves: step2
                });

                steps.push({
                    title: 'Middle Layer',
                    description: 'Solve the middle layer edges',
                    moves: step3
                });

                steps.push({
                    title: 'Yellow Face',
                    description: 'Make the top face yellow',
                    moves: step4
                });

                steps.push({
                    title: 'Final Layer',
                    description: 'Position the final layer pieces',
                    moves: step5
                });
            } else {
                // Generic step organization
                const stepSize = Math.ceil(moves.length / 5);
                for (let i = 0; i < moves.length; i += stepSize) {
                    steps.push({
                        title: `Step ${Math.floor(i / stepSize) + 1}`,
                        description: `Solution moves ${i + 1}-${Math.min(i + stepSize, moves.length)}`,
                        moves: moves.slice(i, i + stepSize)
                    });
                }
            }

            setSolutionSteps(steps);

            // Determine current step based on currentMoveIndex
            if (currentMoveIndex >= 0) {
                let moveCount = 0;
                for (let i = 0; i < steps.length; i++) {
                    moveCount += steps[i].moves.length;
                    if (currentMoveIndex < moveCount) {
                        setCurrentStepIndex(i);
                        setExpandedStep(i);
                        break;
                    }
                }
            }
        }
    }, [solution, currentMoveIndex]);

    // Calculate the absolute move index from a step and relative move index
    const getAbsoluteMoveIndex = (stepIndex, relativeMoveIndex) => {
        let absoluteIndex = relativeMoveIndex;
        for (let i = 0; i < stepIndex; i++) {
            absoluteIndex += solutionSteps[i]?.moves.length || 0;
        }
        return absoluteIndex;
    };

    // Determine which step contains a given move index
    const getStepForMoveIndex = (moveIndex) => {
        let totalMoves = 0;
        for (let i = 0; i < solutionSteps.length; i++) {
            totalMoves += solutionSteps[i].moves.length;
            if (moveIndex < totalMoves) {
                return i;
            }
        }
        return solutionSteps.length - 1;
    };

    // Toggle expanded state for a step
    const toggleStep = (index) => {
        setExpandedStep(expandedStep === index ? null : index);
    };

    if (!solution) {
        return (
            <div className="solution-viewer-empty">
                <p>Solve the cube to see step-by-step instructions</p>
            </div>
        );
    }

    return (
        <div className="solution-viewer">
            <div className="solution-info">
                <h3>Cube Solution</h3>
                <div className="solution-stats">
                    <div className="stat">
                        <span className="stat-label">Total Moves:</span>
                        <span className="stat-value">{solution.solution.split(' ').filter(m => m.trim() !== '').length}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Method:</span>
                        <span className="stat-value">{solution.algorithm_type || "CFOP Method"}</span>
                    </div>
                </div>
            </div>

            <div className="solution-steps-list">
                {solutionSteps.map((step, stepIndex) => {
                    // Calculate if this step contains the current move
                    const stepContainsCurrentMove =
                        currentMoveIndex >= 0 &&
                        stepIndex === getStepForMoveIndex(currentMoveIndex);

                    // Calculate progress within this step
                    let stepProgress = 0;
                    if (stepContainsCurrentMove) {
                        let movesBeforeThisStep = 0;
                        for (let i = 0; i < stepIndex; i++) {
                            movesBeforeThisStep += solutionSteps[i].moves.length;
                        }
                        stepProgress = (currentMoveIndex - movesBeforeThisStep + 1) / step.moves.length * 100;
                    } else if (currentMoveIndex >= getAbsoluteMoveIndex(stepIndex + 1, 0)) {
                        stepProgress = 100;
                    }

                    return (
                        <div
                            key={stepIndex}
                            className={`solution-step ${expandedStep === stepIndex ? 'expanded' : ''} ${stepContainsCurrentMove ? 'active' : ''}`}
                        >
                            <div className="step-header" onClick={() => toggleStep(stepIndex)}>
                                <div className="step-progress-container">
                                    <div
                                        className="step-progress-bar"
                                        style={{ width: `${stepProgress}%` }}
                                    ></div>
                                </div>
                                <h4 className="step-title">
                                    {step.title}
                                    <span className="step-toggle">{expandedStep === stepIndex ? '▼' : '▶'}</span>
                                </h4>
                                <p className="step-description">{step.description}</p>
                            </div>

                            {expandedStep === stepIndex && (
                                <div className="step-moves">
                                    {step.moves.map((move, moveIdx) => {
                                        const absoluteMoveIndex = getAbsoluteMoveIndex(stepIndex, moveIdx);
                                        const isCompleted = currentMoveIndex >= absoluteMoveIndex;
                                        const isActive = currentMoveIndex === absoluteMoveIndex;

                                        return (
                                            <span
                                                key={moveIdx}
                                                className={`move ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                                onClick={() => onSelectMove(absoluteMoveIndex)}
                                            >
                                                {move}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SolutionViewer;