# Rubik's Cube Solver - Client

A modern web application that helps users solve Rubik's Cubes through image recognition and step-by-step solution guidance.


![Rubik's Cube Solver](https://drive.google.com/file/d/1Wx5DbyE2kxJlSCsegVOYLcrMSSW1503T/view?usp=sharing)

**Live Demo:** [https://rubiks-client.vercel.app/](https://rubiks-client.vercel.app/)


- Overview
- Features
- Installation
- Usage
- Project Structure
- Routes
- API Integration
- Testing
- Deployment
- Technologies

## Overview

This React application allows users to solve Rubik's Cubes by uploading images of each face. Using advanced image processing and cube solving algorithms, the app provides interactive step-by-step solutions with 3D visualization.

## Features

- **Image Recognition**: Upload photos of your cube's faces for instant digital recognition
- **Interactive 3D Model**: Visualize your cube and solution in 3D using Three.js
- **Step-by-Step Solutions**: Clear instructions with visual guidance
- **Solution Playback**: Watch the solution steps execute automatically
- **Demo Mode**: Try the solver with pre-loaded examples
- **Responsive Design**: Works on desktop and mobile devices

## Installation

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/rubik-cube-solver.git
   cd rubik-cube-solver/client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   - Create a .env file in the client directory with:

   ```
   REACT_APP_API_URL=https://rubiksbackend.up.railway.app/
   ```

   - For local development with a local backend, use:

   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Home Page**: Introduction to the application with an interactive 3D cube
2. **Features Page**: Overview of application capabilities
3. **Solver Page**: The main functionality to solve your cube:
   - Upload images of all six faces
   - Process images to detect colors
   - Get step-by-step solution guidance
   - Follow the solution using the 3D model

### Uploading Cube Faces

For best results:

- Take clear photos in good lighting
- Hold the cube with white face on top and green face in front
- Keep the cube centered in the image
- Avoid shadows or glare on the cube faces

## Project Structure

```
client/
├── public/             # Public assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── EnhancedCubeModel.js  # 3D cube visualization
│   │   ├── FaceUpload.js         # Face image upload component
│   │   ├── Navbar.js             # Navigation bar
│   │   ├── SolutionSteps.js      # Solution steps display
│   │   └── SolutionViewer.js     # Solution visualization
│   ├── pages/          # Main application pages
│   │   ├── Home.js              # Home/landing page
│   │   ├── Features.js          # Features overview
│   │   └── Solver.js            # Cube solver page
│   ├── utils/          # Utility functions
│   │   └── cubeApi.js           # API interaction functions
│   ├── App.js          # Main app component and routing
│   └── index.js        # Application entry point
└── package.json        # Project dependencies and scripts
```

## Routes

The application uses React Router for navigation with the following routes:

| Route        | Component  | Description                                         |
| ------------ | ---------- | --------------------------------------------------- |
| `/`          | `Home`     | Landing page with introduction and interactive cube |
| `/features`  | `Features` | Overview of application features                    |
| `/solver`    | `Solver`   | Main cube solving functionality                     |
| `/tutorial`  | (Planned)  | Tutorials for using the application                 |
| `/community` | (Planned)  | Community features and shared solutions             |
| `/faq`       | (Planned)  | Frequently asked questions                          |
| `/contact`   | (Planned)  | Contact information and support                     |

## API Integration

The application interacts with a backend API for image processing and cube solving:

### Key API Endpoints:

- `POST /api/cube/processCubeImage`: Processes an uploaded face image to detect colors
- `POST /api/cube/solve`: Receives cube state and returns a solution

The API interaction is managed through functions in cubeApi.js.

## Testing

The project includes a testing setup with Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

## Deployment

The application is configured for deployment with Vercel, but can be deployed to other platforms:

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the build folder.

### Vercel Deployment

The project includes a vercel.json configuration for seamless deployment on Vercel.

## Technologies

- React (v18)
- React Router (v6)
- Three.js for 3D rendering
- React Three Fiber & Drei
- Axios for API requests
- CSS for styling

## License

MIT License

## Acknowledgements

- [Three.js](https://threejs.org/) for 3D graphics
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for React integration with Three.js

## Author

Sudhanshu Shukla

---

For questions or support, please create an issue in the GitHub repository.
