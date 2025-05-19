import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import THREE from '../utils/three-shim';

// Individual cubie with better styling and texture
const Cubie = ({ position, colors, index, pieceRef }) => {
    const meshRef = useRef();
    const edgesRef = useRef();

    // Pass the mesh ref to the parent
    useEffect(() => {
        if (meshRef.current && pieceRef) {
            pieceRef(meshRef.current);
        }
    }, [pieceRef]);

    // Generate materials with better colors and properties
    const materials = useMemo(() => {
        return colors.map(color => {
            // Return transparent material for internal faces
            if (color === '#111111') {
                return new THREE.MeshStandardMaterial({
                    transparent: true,
                    opacity: 0.0,
                    side: THREE.DoubleSide
                });
            }

            // Create texture for sticker appearance
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const context = canvas.getContext('2d');

            // Fill with black background (cubie plastic)
            context.fillStyle = '#111';
            context.fillRect(0, 0, 128, 128);

            // Draw slightly rounded sticker with a small margin
            context.fillStyle = color;
            context.roundRect(8, 8, 112, 112, 10);
            context.fill();

            const texture = new THREE.CanvasTexture(canvas);

            // Create material with texture
            return new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.2,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
        });
    }, [colors]);

    return (
        <group>
            {/* Main cubie */}
            <mesh
                position={position}
                ref={meshRef}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[0.95, 0.95, 0.95]} />
                {materials.map((material, idx) => (
                    <primitive key={idx} object={material} attach={`material-${idx}`} />
                ))}
            </mesh>

            {/* Edges for better definition */}
            <lineSegments ref={edgesRef} position={position}>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(0.96, 0.96, 0.96)]} />
                <lineBasicMaterial attach="material" color="#000000" linewidth={1} />
            </lineSegments>
        </group>
    );
};

// The main cube model - making sure it uses forwardRef properly
const RubiksCubeModel = forwardRef(({
    initialState,
    currentMove,
    onMoveComplete,
    isScrambling = false,
    onScrambleComplete,
    enableControls = true,
    highlightMoves = false
}, forwardedRef) => {
    const groupRef = useRef();
    const piecesRef = useRef([]);
    const [pieces, setPieces] = useState([]);
    const [isRotating, setIsRotating] = useState(false);
    const [moveQueue, setMoveQueue] = useState([]);
    const moveInProgressRef = useRef(false);
    const animationRef = useRef(null);

    // Add a ref to track the current cube state
    const cubeStateRef = useRef(null);

    // Standard Rubik's cube colors with improved accuracy
    const colorMap = {
        'white': '#FFFFFF',
        'yellow': '#FFEB3B',
        'red': '#E53935',
        'orange': '#FF9800',
        'green': '#43A047',
        'blue': '#1E88E5',
        'black': '#111111' // For internal faces
    };

    // Helper function to rotate a face in the cube state
    const rotateFace = (face, direction) => {
        const state = cubeStateRef.current;
        const newState = JSON.parse(JSON.stringify(state));

        // Get the face to rotate
        const faceGrid = state[face];
        const size = faceGrid.length;

        // Create a new grid for the rotated face
        const newGrid = Array(size).fill().map(() => Array(size).fill(null));

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (direction === 1) { // Clockwise
                    newGrid[j][size - 1 - i] = faceGrid[i][j];
                } else { // Counter-clockwise
                    newGrid[size - 1 - j][i] = faceGrid[i][j];
                }
            }
        }

        newState[face] = newGrid;

        // Update adjacent faces based on rotation
        switch (face) {
            case 'U':
                if (direction === 1) { // Clockwise
                    const temp = state.F[0].slice();
                    newState.F[0] = state.R[0].slice();
                    newState.R[0] = state.B[0].slice();
                    newState.B[0] = state.L[0].slice();
                    newState.L[0] = temp;
                } else { // Counter-clockwise
                    const temp = state.F[0].slice();
                    newState.F[0] = state.L[0].slice();
                    newState.L[0] = state.B[0].slice();
                    newState.B[0] = state.R[0].slice();
                    newState.R[0] = temp;
                }
                break;
            case 'D':
                if (direction === 1) { // Clockwise
                    const temp = state.F[2].slice();
                    newState.F[2] = state.L[2].slice();
                    newState.L[2] = state.B[2].slice();
                    newState.B[2] = state.R[2].slice();
                    newState.R[2] = temp;
                } else { // Counter-clockwise
                    const temp = state.F[2].slice();
                    newState.F[2] = state.R[2].slice();
                    newState.R[2] = state.B[2].slice();
                    newState.B[2] = state.L[2].slice();
                    newState.L[2] = temp;
                }
                break;
            case 'R':
                if (direction === 1) { // Clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.F[i][2];
                        newState.F[i][2] = state.D[i][2];
                        newState.D[i][2] = state.B[2 - i][0];
                        newState.B[2 - i][0] = state.U[i][2];
                        newState.U[i][2] = temp;
                    }
                } else { // Counter-clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.F[i][2];
                        newState.F[i][2] = state.U[i][2];
                        newState.U[i][2] = state.B[2 - i][0];
                        newState.B[2 - i][0] = state.D[i][2];
                        newState.D[i][2] = temp;
                    }
                }
                break;
            case 'L':
                if (direction === 1) { // Clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.F[i][0];
                        newState.F[i][0] = state.U[i][0];
                        newState.U[i][0] = state.B[2 - i][2];
                        newState.B[2 - i][2] = state.D[i][0];
                        newState.D[i][0] = temp;
                    }
                } else { // Counter-clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.F[i][0];
                        newState.F[i][0] = state.D[i][0];
                        newState.D[i][0] = state.B[2 - i][2];
                        newState.B[2 - i][2] = state.U[i][0];
                        newState.U[i][0] = temp;
                    }
                }
                break;
            case 'F':
                if (direction === 1) { // Clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.U[2][i];
                        newState.U[2][i] = state.L[2 - i][2];
                        newState.L[2 - i][2] = state.D[0][2 - i];
                        newState.D[0][2 - i] = state.R[i][0];
                        newState.R[i][0] = temp;
                    }
                } else { // Counter-clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.U[2][i];
                        newState.U[2][i] = state.R[i][0];
                        newState.R[i][0] = state.D[0][2 - i];
                        newState.D[0][2 - i] = state.L[2 - i][2];
                        newState.L[2 - i][2] = temp;
                    }
                }
                break;
            case 'B':
                if (direction === 1) { // Clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.U[0][i];
                        newState.U[0][i] = state.R[i][2];
                        newState.R[i][2] = state.D[2][2 - i];
                        newState.D[2][2 - i] = state.L[2 - i][0];
                        newState.L[2 - i][0] = temp;
                    }
                } else { // Counter-clockwise
                    for (let i = 0; i < 3; i++) {
                        const temp = state.U[0][i];
                        newState.U[0][i] = state.L[2 - i][0];
                        newState.L[2 - i][0] = state.D[2][2 - i];
                        newState.D[2][2 - i] = state.R[i][2];
                        newState.R[i][2] = temp;
                    }
                }
                break;
            default:
                break;
        }

        return newState;
    };

    // Update the cube state based on a move
    const updateCubeStateForMove = (moveNotation) => {
        const face = moveNotation.charAt(0);
        let direction = 1;
        let count = 1;

        if (moveNotation.length > 1) {
            if (moveNotation.charAt(1) === "'") {
                direction = -1;
            } else if (moveNotation.charAt(1) === "2") {
                count = 2;
            }
        }

        let newState = cubeStateRef.current;

        // Apply the move to the state (for single or double turns)
        for (let i = 0; i < count; i++) {
            newState = rotateFace(face, direction);
        }

        cubeStateRef.current = newState;
        return newState;
    };

    // Generate initial pieces based on state
    useEffect(() => {
        const isInitialStateEffectivelyEmpty = (state) => {
            if (!state) return true;
            let hasNonNullColor = false;
            for (const faceKey in state) {
                if (state[faceKey] && Array.isArray(state[faceKey])) {
                    for (const row of state[faceKey]) {
                        if (Array.isArray(row) && row.some(color => color !== null && color !== undefined && color !== '')) {
                            hasNonNullColor = true;
                            break;
                        }
                    }
                }
                if (hasNonNullColor) break;
            }
            return !hasNonNullColor;
        };

        if (isInitialStateEffectivelyEmpty(initialState)) {
            generateSolvedCube(); // Generate a default solved cube
        } else {
            // Store the initial state in the ref
            cubeStateRef.current = JSON.parse(JSON.stringify(initialState));

            const newInitialPieces = [];
            // Generate pieces from initialState
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    for (let z = -1; z <= 1; z++) {
                        // Skip the internal cube (not visible)
                        if (x === 0 && y === 0 && z === 0) continue;

                        const position = [x, y, z];
                        // Define colors for each face of the cube piece using the provided state
                        const colors = getFaceColors(x, y, z, cubeStateRef.current);

                        newInitialPieces.push({ position, colors, key: `${x},${y},${z}` });
                    }
                }
            }
            setPieces(newInitialPieces);
            piecesRef.current = Array(newInitialPieces.length).fill(null);
        }
    }, [initialState]); // generateSolvedCube is defined in the component scope, so this dependency array is okay.

    // Generate a solved cube if no state provided
    const generateSolvedCube = () => {
        const initialPieces = [];

        const defaultState = {
            U: Array(3).fill().map(() => Array(3).fill('white')),
            D: Array(3).fill().map(() => Array(3).fill('yellow')),
            F: Array(3).fill().map(() => Array(3).fill('green')),
            B: Array(3).fill().map(() => Array(3).fill('blue')),
            R: Array(3).fill().map(() => Array(3).fill('red')),
            L: Array(3).fill().map(() => Array(3).fill('orange'))
        };

        // Store the default state in the ref
        cubeStateRef.current = JSON.parse(JSON.stringify(defaultState));

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    // Skip the internal cube (not visible)
                    if (x === 0 && y === 0 && z === 0) continue;

                    const position = [x, y, z];
                    const colors = getFaceColors(x, y, z, defaultState);

                    initialPieces.push({ position, colors, key: `${x},${y},${z}` });
                }
            }
        }

        setPieces(initialPieces);
        piecesRef.current = Array(initialPieces.length).fill(null);
    };

    // Get colors for each face of a piece based on its position and the cube state
    const getFaceColors = (x, y, z, state) => {
        const getColor = (faceKey, r, c) => {
            // Ensure state, face, and row exist, and colorName is valid
            const colorName = state && state[faceKey] && state[faceKey][r] && state[faceKey][r][c];
            // Default to 'black' if colorName is falsy (null, undefined, empty string)
            // or if colorName.toLowerCase() is not in colorMap
            const mappedColor = colorMap[colorName ? String(colorName).toLowerCase() : 'black'];
            return mappedColor || colorMap.black;
        };

        const colors = [
            // Right face (x = 1)
            x === 1 ? getColor('R', 1 + y, 1 + z) : colorMap.black,
            // Left face (x = -1)
            x === -1 ? getColor('L', 1 + y, 1 - z) : colorMap.black,
            // Top face (y = 1)
            y === 1 ? getColor('U', 1 - z, 1 + x) : colorMap.black,
            // Bottom face (y = -1)
            y === -1 ? getColor('D', 1 + z, 1 + x) : colorMap.black,
            // Front face (z = 1)
            z === 1 ? getColor('F', 1 - y, 1 + x) : colorMap.black,
            // Back face (z = -1)
            z === -1 ? getColor('B', 1 - y, 1 - x) : colorMap.black
        ];

        return colors;
    };

    // Execute a move when currentMove updates
    useEffect(() => {
        if (currentMove && !isRotating && !moveInProgressRef.current) {
            executeMove(currentMove);
        }
    }, [currentMove]);

    // Process the move queue
    useEffect(() => {
        if (moveQueue.length > 0 && !moveInProgressRef.current && !isRotating) {
            const nextMove = moveQueue.shift();
            setMoveQueue([...moveQueue]); // Create a new array to force state update
            executeMove(nextMove);
        }
    }, [moveQueue, isRotating]);

    // Function to execute a move on the cube
    const executeMove = (moveNotation) => {
        if (!groupRef.current || !moveNotation || moveInProgressRef.current) return;

        moveInProgressRef.current = true;
        setIsRotating(true);

        // Parse the move notation
        const face = moveNotation.charAt(0);
        let direction = 1;
        let turnCount = 1;

        if (moveNotation.length > 1) {
            if (moveNotation.charAt(1) === "'") {
                direction = -1;
            } else if (moveNotation.charAt(1) === "2") {
                turnCount = 2;
            }
        }

        let axis, selector;

        // Define rotation axis and piece selector
        switch (face) {
            case 'R': // Right face
                axis = 'x';
                selector = (pos) => pos[0] > 0.5;
                break;
            case 'L': // Left face
                axis = 'x';
                direction *= -1;
                selector = (pos) => pos[0] < -0.5;
                break;
            case 'U': // Up face
                axis = 'y';
                selector = (pos) => pos[1] > 0.5;
                break;
            case 'D': // Down face
                axis = 'y';
                direction *= -1;
                selector = (pos) => pos[1] < -0.5;
                break;
            case 'F': // Front face
                axis = 'z';
                selector = (pos) => pos[2] > 0.5;
                break;
            case 'B': // Back face
                axis = 'z';
                direction *= -1;
                selector = (pos) => pos[2] < -0.5;
                break;
            default:
                moveInProgressRef.current = false;
                setIsRotating(false);
                return;
        }

        // Find pieces to rotate
        const selectedPieces = [];
        pieces.forEach((piece, idx) => {
            if (selector(piece.position) && piecesRef.current[idx]) {
                selectedPieces.push({
                    index: idx,
                    mesh: piecesRef.current[idx],
                    originalPosition: [...piece.position]
                });
            }
        });

        // Create a temporary group for rotation
        const tempGroup = new THREE.Group();
        selectedPieces.forEach(({ mesh }) => {
            const originalParent = mesh.parent;
            const worldPos = new THREE.Vector3();
            mesh.getWorldPosition(worldPos);

            originalParent.remove(mesh);
            tempGroup.add(mesh);

            mesh.position.set(
                worldPos.x - tempGroup.position.x,
                worldPos.y - tempGroup.position.y,
                worldPos.z - tempGroup.position.z
            );
        });

        groupRef.current.add(tempGroup);

        // Calculate rotation parameters
        const rotationAngle = (Math.PI / 2) * direction;
        const totalRotation = rotationAngle * turnCount;
        const steps = turnCount === 2 ? 20 : 10;
        const stepAngle = totalRotation / steps;
        let currentStep = 0;

        // Animation function
        const animate = () => {
            if (currentStep < steps) {
                tempGroup.rotation[axis] += stepAngle;
                currentStep++;
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Update positions after rotation
                tempGroup.updateMatrixWorld();

                // Update the cube state based on the move
                updateCubeStateForMove(moveNotation);

                // Create a copy of pieces to modify
                const newPieces = [];

                // First, collect all pieces that weren't rotated
                pieces.forEach((piece, idx) => {
                    if (!selectedPieces.some(sp => sp.index === idx)) {
                        newPieces.push({ ...piece });
                    }
                });

                // Then, handle the rotated pieces
                selectedPieces.forEach(({ mesh, index }) => {
                    // Get new world position
                    const worldPos = new THREE.Vector3();
                    mesh.getWorldPosition(worldPos);

                    // Round to nearest 0.5 to handle precision issues
                    const newPosX = Math.round(worldPos.x * 2) / 2;
                    const newPosY = Math.round(worldPos.y * 2) / 2;
                    const newPosZ = Math.round(worldPos.z * 2) / 2;

                    // Use the updated position to get the new colors from the updated state
                    const newColors = getFaceColors(newPosX, newPosY, newPosZ, cubeStateRef.current);

                    // Add the updated piece to our new array
                    newPieces.push({
                        position: [newPosX, newPosY, newPosZ],
                        colors: newColors,
                        key: pieces[index].key // Maintain the key for React stability
                    });

                    // Remove from temp group and add back to main group
                    tempGroup.remove(mesh);
                    groupRef.current.add(mesh);
                    mesh.position.set(newPosX, newPosY, newPosZ);
                    mesh.rotation.set(0, 0, 0); // Reset local rotation of the cubie mesh
                });

                // Set pieces state once with the fully updated array
                setPieces(newPieces);

                // Clean up temp group
                groupRef.current.remove(tempGroup);

                // Use a timeout to ensure state updates before processing next move
                setTimeout(() => {
                    // Reset rotation state
                    moveInProgressRef.current = false;
                    setIsRotating(false);

                    // Notify that move is complete
                    if (onMoveComplete) {
                        onMoveComplete(moveNotation);
                    }

                    // Process next move if queue exists
                    if (moveQueue.length > 0) {
                        // Allow React to reconcile state before next move
                        setTimeout(() => {
                            const nextMove = moveQueue.shift();
                            setMoveQueue([...moveQueue]); // Force update
                            executeMove(nextMove);
                        }, 50);
                    } else if (isScrambling && onScrambleComplete) {
                        onScrambleComplete();
                    }
                }, 20);
            }
        };

        // Start animation
        animate();
    };

    // Queue multiple moves
    const queueMoves = (moves) => {
        if (!Array.isArray(moves) || moves.length === 0) return;

        // Clear existing queue if this is a new sequence
        if (moveInProgressRef.current === false && moveQueue.length === 0) {
            setMoveQueue([...moves]);
        } else {
            setMoveQueue(prev => [...prev, ...moves]);
        }
    };

    // Rest of the component remains the same...
    // Scramble cube, cleanup, useFrame, useImperativeHandle, etc.

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Gentle auto-rotation when not being manipulated
    useFrame(() => {
        if (groupRef.current && !isRotating && !moveInProgressRef.current && !enableControls) {
            groupRef.current.rotation.y += 0.002;
            groupRef.current.rotation.x += 0.0005;
        }
    });

    useImperativeHandle(forwardedRef, () => ({
        executeMove,
        queueMoves,
        scrambleCube: () => {
            // Your existing scramble code
        }
    }), []);

    return (
        <group ref={groupRef}>
            {pieces.map((piece, idx) => (
                <Cubie
                    key={piece.key || idx}
                    position={piece.position}
                    colors={piece.colors}
                    index={idx}
                    pieceRef={(el) => { piecesRef.current[idx] = el }}
                />
            ))}
        </group>
    );
});

// Main component with Canvas
const EnhancedCubeModel = forwardRef(({
    initialState,
    currentMove,
    onMoveComplete,
    isScrambling,
    onScrambleComplete,
    enableControls = true,
    highlightMoves = false,
    width = '100%',
    height = '100%'
}, ref) => {
    // Rest of the component remains the same...

    return (
        <div style={{ width, height, minHeight: '400px' }}>
            <Canvas
                shadows
                camera={{ position: [4, 3, 5], fov: 45 }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.6} />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.3}
                    penumbra={1}
                    intensity={0.8}
                    castShadow
                />
                <RubiksCubeModel
                    ref={ref}
                    initialState={initialState}
                    currentMove={currentMove}
                    onMoveComplete={onMoveComplete}
                    isScrambling={isScrambling}
                    onScrambleComplete={onScrambleComplete}
                    enableControls={enableControls}
                    highlightMoves={highlightMoves}
                />
                {enableControls && <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    minDistance={4}
                    maxDistance={10}
                />}
            </Canvas>
        </div>
    );
});

export default EnhancedCubeModel;
