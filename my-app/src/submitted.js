// SubmitPage.js
import React from 'react';

function SubmitPage({ onBack }) {
  return (
    <div className="home-container" style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Your responses are recorded </h1>
      <p>Click below to go back to home.</p>
      <button 
        className="continue-btn" 
        style={{ marginTop: '1.5rem' }} 
        onClick={onBack}
      >
        Go to Home
      </button>
    </div>
  );
}

export default SubmitPage;
