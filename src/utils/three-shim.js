import * as THREE from 'three';

// Add shims for removed or renamed constants
if (!THREE.SRGBColorSpace && THREE.LinearEncoding !== undefined) {
    THREE.SRGBColorSpace = THREE.LinearEncoding;
}

export default THREE;