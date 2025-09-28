import React from 'react';
import './App.css';

function KickedPage({ onBack }) {
  return (
    <div className="home-container" style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
      <h1 style={{ color: '#d63031', marginBottom: 24 }}>You have been kicked out</h1>
      <p style={{ fontSize: 16, color: '#636e72', marginBottom: 12 }}>Looks like teacher removed you from poll, try again later.</p>
      <button className="continue-btn" onClick={onBack} style={{ marginTop: 32 }}>Back to Home</button>
    </div>
  );
}

export default KickedPage;
