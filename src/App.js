import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Features from './pages/Features';
import Solver from './pages/Solver';

import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />

      <section id="home" className="section">
        <Home />
      </section>

      <section id="features" className="section">
        <Features />
      </section>

      <section id="solver" className="section">
        <Solver />
      </section>

      {/* Add additional sections for Tutorial, Community, FAQ, Contact */}
    </div>
  );
}

export default App;
