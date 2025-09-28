import React, { useState } from 'react';
import './App.css';

function BackButton({ onClick }) {
  return (
    <button
      style={{
        position: 'absolute',
        top: 18,
        left: 18,
        background: 'none',
        border: 'none',
        color: '#0984e3',
        fontSize: 18,
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
      onClick={onClick}
    >
      &#8592; Back
    </button>
  );
}

function StudentPage1({ onBack, onContinue }) {
  const [name, setName] = useState('');
  const [showError, setShowError] = useState(false);

  const handleContinue = () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (onContinue) onContinue(name.trim());
  };

  return (
    <div className="home-container" style={{ position: 'relative' }}>
      <BackButton onClick={onBack} />
      <h1>Let's get started</h1>
      <p>Participate in live polls</p>
      <div style={{ marginBottom: '1.5rem', width: '100%', maxWidth: 350 }}>
        <label htmlFor="student-name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#2d3436' }}>
          Enter your name
        </label>
        <input
          id="student-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '0.7rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #b2bec3' }}
        />
      </div>
      <button className="continue-btn" onClick={handleContinue}>
        Continue
      </button>
      {showError && <p className="error-msg">Please enter your name to continue.</p>}
    </div>
  );
}

export default StudentPage1;
