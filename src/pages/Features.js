import React from 'react';
import './Features.css';

function Features() {
    const features = [
        {
            icon: 'image-icon',
            title: 'Image Recognition',
            description: 'Upload photos of your cube\'s faces for instant digital recognition and processing'
        },
        {
            icon: 'solution-icon',
            title: 'Smart Solution',
            description: 'Get optimized step-by-step solutions using advanced solving algorithms'
        },
        {
            icon: 'video-icon',
            title: 'Video Tutorials',
            description: 'Access comprehensive video guides for each solving step'
        },
        {
            icon: 'progress-icon',
            title: 'Progress Tracking',
            description: 'Monitor your solving speed and improvement over time'
        },
        {
            icon: 'community-icon',
            title: 'Community Support',
            description: 'Connect with other cube enthusiasts and share techniques'
        },
        {
            icon: 'assistance-icon',
            title: 'Real-time Assistance',
            description: 'Get instant feedback and hints during your solving process'
        }
    ];

    return (
        <div className="features-page">
            <h1>Powerful Features for Cube Solving</h1>
            <p className="features-subtitle">Everything you need to master your Rubik's cube</p>

            <div className="features-grid">
                {features.map((feature, index) => (
                    <div className="feature-card" key={index}>
                        <div className={`feature-icon ${feature.icon}`}></div>
                        <h2>{feature.title}</h2>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Features;