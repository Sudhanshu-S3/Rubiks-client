import React, { useState } from 'react';
import './FaceUpload.css';
import { processCubeImage } from '../utils/cubeApi';

const FaceUpload = ({ face, onUploadComplete }) => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [colorGrid, setColorGrid] = useState(null);

    const faceNames = {
        'U': 'Top (White)',
        'R': 'Right (Red)',
        'F': 'Front (Green)',
        'D': 'Bottom (Yellow)',
        'L': 'Left (Orange)',
        'B': 'Back (Blue)'
    };

    const handleUpload = async (file) => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            // Display image preview immediately
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target.result);
            };
            reader.readAsDataURL(file);

            // Process image with consistent API
            const data = await processCubeImage(file, face);

            if (data.success) {
                setColorGrid(data.colors);

                // Pass data to parent component
                onUploadComplete(face, {
                    colors: data.colors,
                    visualization: data.visualizationUrl
                });
            } else {
                throw new Error(data.error || 'Failed to process image');
            }
        } catch (err) {
            console.error('Error uploading face:', err);
            setError(err.message || 'Failed to process image');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        handleUpload(file);
    };

    return (
        <div className={`face-upload ${loading ? 'loading' : ''} ${colorGrid ? 'processed' : ''}`}>
            <label className="upload-label">
                <div className="face-label">{faceNames[face] || face}</div>

                {preview ? (
                    <div className="image-container">
                        <img src={preview} alt={`${face} face`} className="image-preview" />
                        {colorGrid && (
                            <div className="color-grid-overlay">
                                {colorGrid.map((row, i) => (
                                    <div key={i} className="color-row">
                                        {row.map((color, j) => (
                                            <div
                                                key={j}
                                                className="color-cell"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        {loading && <div className="loading-spinner"></div>}
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <div className="upload-icon"></div>
                        <p>Upload {face} Face</p>
                        <small>Click to select image</small>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="file-input"
                />
            </label>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default FaceUpload;