import React, { useState } from 'react';
import './FaceUpload.css';

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

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Clear previous states
        setError(null);
        setLoading(true);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Create form data
        const formData = new FormData();
        formData.append('image', file);
        formData.append('face', face);

        try {
            const response = await fetch('http://localhost:5000/api/cube/process-image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process image');
            }

            setImage(data.originalImage);
            setColorGrid(data.faceColors[face]);

            // Pass data to parent component
            onUploadComplete(face, {
                colors: data.faceColors[face],
                visualization: data.visualizationUrl
            });

        } catch (err) {
            console.error('Error uploading face:', err);
            setError(err.message || 'Failed to process image');
        } finally {
            setLoading(false);
        }
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