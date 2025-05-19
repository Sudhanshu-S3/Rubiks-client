import React, { useState } from 'react';
import './SolutionSteps.css';

const SolutionSteps = ({ solution, onExecuteMove }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [activeMoveIndex, setActiveMoveIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1000);

    // Start automatic playback of solution
    const startAutoPlay = () => {
        setIsPlaying(true);
        playNextMove(activeStep, -1);
    };

    // Play the next move in sequence
    const playNextMove = (stepIndex, moveIndex) => {
        if (!solution || !solution.steps) return;

        const steps = solution.steps;
        let nextStepIndex = stepIndex;
        let nextMoveIndex = moveIndex + 1;

        // If we've reached the end of moves in current step, move to next step
        if (nextMoveIndex >= steps[stepIndex].moves.length) {
            nextStepIndex++;
            nextMoveIndex = 0;
        }

        // If we've reached the end of all steps, stop playing
        if (nextStepIndex >= steps.length) {
            setIsPlaying(false);
            return;
        }

        // Execute the next move
        setActiveStep(nextStepIndex);
        setActiveMoveIndex(nextMoveIndex);
        onExecuteMove(steps[nextStepIndex].moves[nextMoveIndex]);

        // Schedule the next move if still playing
        if (isPlaying) {
            setTimeout(() => {
                playNextMove(nextStepIndex, nextMoveIndex);
            }, speed);
        }
    };

    // Stop automatic playback
    const stopAutoPlay = () => {
        setIsPlaying(false);
    };

    // Standardize executeMove to match SolutionViewer
    const executeMove = (stepIndex, moveIndex) => {
        if (!solution || !solution.steps) return;

        // Calculate the absolute move index
        let absoluteMoveIndex = 0;
        for (let i = 0; i < stepIndex; i++) {
            absoluteMoveIndex += solution.steps[i].moves.length;
        }
        absoluteMoveIndex += moveIndex;

        // Get the move notation
        const moveNotation = solution.steps[stepIndex].moves[moveIndex];

        setActiveStep(stepIndex);
        setActiveMoveIndex(moveIndex);

        // Pass both index and notation to ensure consistency
        onExecuteMove({
            index: absoluteMoveIndex,
            notation: moveNotation
        });
    };

    if (!solution || !solution.steps || solution.steps.length === 0) {
        return <div className="no-solution">No solution available</div>;
    }

    return (
        <div className="solution-steps">
            <div className="controls">
                <button
                    onClick={isPlaying ? stopAutoPlay : startAutoPlay}
                    className={isPlaying ? 'pause-button' : 'play-button'}
                >
                    {isPlaying ? 'Pause' : 'Play Solution'}
                </button>

                <div className="speed-control">
                    <label>Speed:</label>
                    <input
                        type="range"
                        min="200"
                        max="2000"
                        step="100"
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        disabled={isPlaying}
                    />
                    <span>{speed}ms</span>
                </div>
            </div>

            <div className="steps-list">
                {solution.steps.map((step, stepIndex) => (
                    <div
                        key={stepIndex}
                        className={`step ${activeStep === stepIndex ? 'active' : ''}`}
                    >
                        <div className="step-header" onClick={() => setActiveStep(stepIndex)}>
                            <h3>{step.name}</h3>
                            <span className="move-count">{step.moves.length} moves</span>
                        </div>

                        <div className="step-description">{step.description}</div>

                        <div className="move-list">
                            {step.moves.map((move, moveIndex) => (
                                <button
                                    key={moveIndex}
                                    className={`move-button ${activeStep === stepIndex &&
                                        activeMoveIndex === moveIndex ? 'active' : ''
                                        } ${activeStep === stepIndex &&
                                            activeMoveIndex > moveIndex ? 'completed' : ''
                                        }`}
                                    onClick={() => executeMove(stepIndex, moveIndex)}
                                >
                                    {move}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SolutionSteps;
