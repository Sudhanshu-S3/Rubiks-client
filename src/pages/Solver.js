import React, { useState } from 'react';
import './Solver.css';

function Solver() {
    const [cube, setCube] = useState({
        front: null,
        back: null,
        top: null,
        bottom: null,
        left: null,
        right: null
    });

    const handleImageUpload = (face, e) => {
        // In a real implementation, you would handle the image upload here
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCube({
                    ...cube,
                    [face]: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="solver-page">
            <h1>Cube Solver</h1>
            <p className="solver-description">Upload images of your cube faces to get step-by-step solutions</p>

            <div className="solver-container">
                <div className="upload-section">
                    <h2>Upload Cube Faces</h2>
                    <div className="face-uploads">
                        <div className="face-upload">
                            <label htmlFor="front-face">
                                <div className="upload-box">
                                    {cube.front ? (
                                        <img src={cube.front} alt="Front face" />
                                    ) : (
                                        <>
                                            <div className="upload-icon"></div>
                                            <p>Front Face</p>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                type="file"
                                id="front-face"
                                accept="image/*"
                                onChange={(e) => handleImageUpload('front', e)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="face-upload">
                            <label htmlFor="back-face">
                                <div className="upload-box">
                                    {cube.back ? (
                                        <img src={cube.back} alt="Back face" />
                                    ) : (
                                        <>
                                            <div className="upload-icon"></div>
                                            <p>Back Face</p>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                type="file"
                                id="back-face"
                                accept="image/*"
                                onChange={(e) => handleImageUpload('back', e)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="face-upload">
                            <label htmlFor="top-face">
                                <div className="upload-box">
                                    {cube.top ? (
                                        <img src={cube.top} alt="Top face" />
                                    ) : (
                                        <>
                                            <div className="upload-icon"></div>
                                            <p>Top Face</p>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                type="file"
                                id="top-face"
                                accept="image/*"
                                onChange={(e) => handleImageUpload('top', e)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="face-upload">
                            <label htmlFor="bottom-face">
                                <div className="upload-box">
                                    {cube.bottom ? (
                                        <img src={cube.bottom} alt="Bottom face" />
                                    ) : (
                                        <>
                                            <div className="upload-icon"></div>
                                            <p>Bottom Face</p>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                type="file"
                                id="bottom-face"
                                accept="image/*"
                                onChange={(e) => handleImageUpload('bottom', e)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="face-upload">
                            <label htmlFor="left-face">
                                <div className="upload-box">
                                    {cube.left ? (
                                        <img src={cube.left} alt="Left face" />
                                    ) : (
                                        <>
                                            <div className="upload-icon"></div>
                                            <p>Left Face</p>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                type="file"
                                id="left-face"
                                accept="image/*"
                                onChange={(e) => handleImageUpload('left', e)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="face-upload">
                            <label htmlFor="right-face">
                                <div className="upload-box">
                                    {cube.right ? (
                                        <img src={cube.right} alt="Right face" />
                                    ) : (
                                        <>
                                            <div className="upload-icon"></div>
                                            <p>Right Face</p>
                                        </>
                                    )}
                                </div>
                            </label>
                            <input
                                type="file"
                                id="right-face"
                                accept="image/*"
                                onChange={(e) => handleImageUpload('right', e)}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary solve-btn">Solve Cube</button>
                </div>

                <div className="solution-section">
                    <h2>Solution Steps</h2>
                    <div className="solution-steps">
                        <p className="solution-placeholder">Upload all faces to see the solution steps</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Solver;