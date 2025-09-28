import React, { useEffect } from 'react';
import './App.css';

function BackButton({ onClick }) {
  return (
    <button
      style={{ position: 'absolute', top: 18, left: 18, background: 'none', border: 'none', color: '#0984e3', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      onClick={onClick}
    >
      &#8592; Back
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ margin: '2rem auto', textAlign: 'center' }}>
      <div className="loader" style={{ border: '6px solid #f3f3f3', borderTop: '6px solid #0984e3', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StudentPage2({ onBack, onQuestionsReady }) {
  useEffect(() => {
    // TODO: Poll backend for questions availability (simulate with timeout for now)
    const timer = setTimeout(() => {
      if (onQuestionsReady) onQuestionsReady();
    }, 3000); // Simulate waiting
    return () => clearTimeout(timer);
  }, [onQuestionsReady]);

  return (
    <div className="home-container" style={{ position: 'relative' }}>
      <BackButton onClick={onBack} />
      <h1>Wait for the teacher to ask questions..</h1>
      <LoadingSpinner />
    </div>
  );
}

export default StudentPage2;
