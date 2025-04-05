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

// The main cube model
const RubiksCubeModel = ({
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

    // Generate initial pieces based on state
    useEffect(() => {
        if (!initialState) {
            // If no state provided, generate a solved cube
            generateSolvedCube();
            return;
        }

        const initialPieces = [];

        // Generate pieces from initialState
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    // Skip the internal cube (not visible)
                    if (x === 0 && y === 0 && z === 0) continue;

                    const position = [x, y, z];
                    // Define colors for each face of the cube piece
                    const colors = getFaceColors(x, y, z, initialState);

                    initialPieces.push({ position, colors, key: `${x},${y},${z}` });
                }
            }
        }

        setPieces(initialPieces);
        piecesRef.current = Array(initialPieces.length).fill(null);
    }, [initialState]);

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
        const colors = [
            // Right face (x = 1)
            x === 1 ? colorMap[state.R[1 + y][1 + z].toLowerCase()] : colorMap.black,
            // Left face (x = -1)
            x === -1 ? colorMap[state.L[1 + y][1 - z].toLowerCase()] : colorMap.black,
            // Top face (y = 1)
            y === 1 ? colorMap[state.U[1 - z][1 + x].toLowerCase()] : colorMap.black,
            // Bottom face (y = -1)
            y === -1 ? colorMap[state.D[1 + z][1 + x].toLowerCase()] : colorMap.black,
            // Front face (z = 1)
            z === 1 ? colorMap[state.F[1 - y][1 + x].toLowerCase()] : colorMap.black,
            // Back face (z = -1)
            z === -1 ? colorMap[state.B[1 - y][1 - x].toLowerCase()] : colorMap.black
        ];

        return colors;
    };

    // Execute a move when currentMove updates
    useEffect(() => {
        if (currentMove && !isRotating && !moveInProgressRef.current) {
            executeMove(currentMove);
        }
    }, [currentMove]);

    // Process the move queue - Fix the queue execution logic
    useEffect(() => {
        if (moveQueue.length > 0 && !moveInProgressRef.current && !isRotating) {
            const nextMove = moveQueue.shift();
            setMoveQueue([...moveQueue]); // Create a new array to force state update
            executeMove(nextMove);
        }
    }, [moveQueue, isRotating]);

    // Function to execute a move on the cube - Fix the race condition 
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

        // Animation function - Fix completion handling
        const animate = () => {
            if (currentStep < steps) {
                tempGroup.rotation[axis] += stepAngle;
                currentStep++;
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Update positions after rotation
                tempGroup.updateMatrixWorld();

                // Create a copy of pieces to modify
                const newPieces = [...pieces];

                selectedPieces.forEach(({ mesh, index }) => {
                    // Get new world position
                    const worldPos = new THREE.Vector3();
                    mesh.getWorldPosition(worldPos);

                    // Round to nearest 0.5 to handle precision issues
                    const newPosX = Math.round(worldPos.x * 2) / 2;
                    const newPosY = Math.round(worldPos.y * 2) / 2;
                    const newPosZ = Math.round(worldPos.z * 2) / 2;

                    // Update piece position in the copy
                    newPieces[index] = {
                        ...newPieces[index],
                        position: [newPosX, newPosY, newPosZ]
                    };

                    // Remove from temp group and add back to main group
                    tempGroup.remove(mesh);
                    groupRef.current.add(mesh);
                    mesh.position.set(newPosX, newPosY, newPosZ);
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

                    // Process next move if queue exists - moved outside to avoid recursion
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

    // Queue multiple moves - Fix the queueing system
    const queueMoves = (moves) => {
        if (!Array.isArray(moves) || moves.length === 0) return;

        // Clear existing queue if this is a new sequence
        if (moveInProgressRef.current === false && moveQueue.length === 0) {
            setMoveQueue([...moves]);
        } else {
            setMoveQueue(prev => [...prev, ...moves]);
        }
    };

    // Scramble the cube with a valid WCA scramble
    const scrambleCube = () => {
        if (isRotating || moveInProgressRef.current) return;

        const moves = ['R', 'L', 'U', 'D', 'F', 'B'];
        const variations = ['', "'", '2'];
        const scrambleLength = 20;
        const scramble = [];

        let lastFace = null;
        for (let i = 0; i < scrambleLength; i++) {
            let face;
            do {
                face = moves[Math.floor(Math.random() * moves.length)];
            } while (face === lastFace);

            lastFace = face;
            const variation = variations[Math.floor(Math.random() * variations.length)];
            scramble.push(`${face}${variation}`);
        }

        queueMoves(scramble);
        return scramble;
    };

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

    // Expose methods to parent
    useImperativeHandle(forwardedRef, () => ({
        executeMove,
        queueMoves,
        scrambleCube
    }), []);

    return (
        <group ref={groupRef}>
            {pieces.map((piece, idx) => (
                <Cubie
                    key={piece.key || idx}
                    position={piece.position}
                    colors={piece.colors}
                    index={idx}
                    pieceRef={(el) => (piecesRef.current[idx] = el)}
                />
            ))}
        </group>
    );
};

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
    const cubeModelRef = useRef(null);

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