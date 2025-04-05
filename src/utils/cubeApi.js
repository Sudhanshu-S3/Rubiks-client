/**
 * Utility functions for interacting with the cube API
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/';

/**
 * Process a cube face image and return the detected colors
 * 
 * @param {File} imageFile - The image file to process
 * @param {string} face - The face identifier (U, R, F, D, L, B)
 * @returns {Promise<Object>} The response containing face colors
 */
export const processCubeImage = async (imageFile, face) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('face', face);

    try {
        const response = await axios.post(`${API_URL}api/cube/processCubeImage`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error processing cube image:', error);
        throw error;
    }
};

/**
 * Solve a cube based on all face data
 * 
 * @param {Object} faces - Object containing color data for all six faces
 * @returns {Promise<Object>} The solution data
 */
export const solveCube = async (faces) => {
    try {
        // Change from /cube/compile to /cube/solve for consistency
        const response = await axios.post(`${API_URL}api/cube/solve`, { cubeState: faces });
        return response.data;
    } catch (error) {
        console.error('Error solving cube:', error);
        throw error;
    }
};