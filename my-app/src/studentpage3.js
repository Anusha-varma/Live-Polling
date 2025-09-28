import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import Submitted from './submitted';
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

function OptionBar({ option, percent, selected, showBars, onSelect, disabled }) {
  const isTextInsideBar = showBars && percent > 40;
  const optionTextColor = isTextInsideBar ? '#fff' : (selected ? '#0984e3' : '#2d3436');
  return (
    <div
      style={{
        marginBottom: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: selected ? '2px solid #0984e3' : '2px solid #dfe6e9',
        borderRadius: 6,
        overflow: 'hidden',
        height: 40,
        background: showBars ? '#dfe6e9' : '#fff',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        transition: 'border 0.2s',
        minWidth: 120
      }}
      onClick={disabled ? undefined : onSelect}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: showBars ? `${percent}%` : 0,
          background: '#0984e3',
          borderRadius: percent === 100 ? 6 : '6px 0 0 6px',
          transition: 'width 0.5s',
          zIndex: 1
        }}
      />
      <span style={{ position: 'relative', zIndex: 2, paddingLeft: 16, color: optionTextColor, fontWeight: 'bold', transition: 'color 0.2s', textShadow: isTextInsideBar ? '0 1px 4px #0984e3' : 'none' }}>
        {option}
      </span>
      {showBars && (
        <span style={{ position: 'relative', zIndex: 2, marginLeft: 'auto', paddingRight: 16, fontWeight: 'bold', color: '#2d3436', textShadow: 'none' }}>
          {percent}%
        </span>
      )}
    </div>
  );
}

function StudentPage3({ questions, onBack, onSubmitTest, studentName }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timer || 15);
  const [showBars, setShowBars] = useState(false);
  const [percentages, setPercentages] = useState(Array(questions[0]?.options.length || 0).fill(0));
  const [checkingBlocked, setCheckingBlocked] = useState(true);
  const q = questions[current]; // <-- Declare only once here
  const [blocked, setBlocked] = useState(false);

useEffect(() => {
  const checkBlocked = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/participants');
      const participants = await res.json();

      const currentStudent = participants.find(p => p.name === studentName);

      if (currentStudent?.attempted) {
        setBlocked(true);
      }
    } catch (err) {
      console.error("Failed to fetch participants", err);
    } finally {
      setCheckingBlocked(false); // done checking
    }
  };

  checkBlocked();
}, [studentName]);




 useEffect(() => {
  if (!started || showBars) return; // only run if test started and bars not shown

  // initialize timer for current question
  setTimeLeft(q?.timer || 15);

  const interval = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 0) {
        clearInterval(interval); // stop interval when timer ends
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval); // cleanup on unmount or question change
}, [started, current, q, showBars]);


  const handleStart =async () => {
      const res = await fetch('http://localhost:5000/api/participants');
    const data = await res.json();
 // await fetch('http://localhost:5000/api/reset-test', { method: 'POST' });
    const currentStudent = data.find(p => p.name === studentName);
    if (currentStudent?.attempted) {
      setBlocked(true);

      return; // stop starting the test
    }
    setStarted(true);
  }

  const handleSelect = idx => {
    const updated = [...selected];
    updated[current] = idx;
    setSelected(updated);
  };

  const handlePrev = () => setCurrent(c => Math.max(0, c - 1));

  const fetchPercentages = async (questionId, optionsLength) => {
    try {
      const res = await axios.get('http://localhost:5000/api/responses/aggregate');
      const agg = res.data.find(a => a.questionId === questionId);
      if (agg) {
        const rounded = agg.percentages.map(p => Number(p.toFixed(1)));
        setPercentages(rounded);
      } else {
        setPercentages(Array(optionsLength).fill(0));
      }
    } catch (err) {
      console.error('Failed to fetch percentages', err);
      setPercentages(Array(optionsLength).fill(0));
    }
  };

  const handleShowBars = async () => {
    const selectedIdx = selected[current];
    if (q && typeof selectedIdx === 'number') {
      try {
        await axios.post('http://localhost:5000/api/responses', {
          questionId: q._id,
          selectedIndex: selectedIdx,
          name: studentName
        }); await fetch('http://localhost:5000/api/participants/markAttempted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName })
      });

 
      } catch (err) {
        if (err.response && err.response.status === 403) {
          window.location.href = '/kicked';
        }
      }
    }

    // fetch current percentages for this question
    fetchPercentages(q._id, q.options.length);
    setShowBars(true);
  };

  useEffect(() => {
    if (timeLeft === 0 && started && !showBars) handleShowBars();
  }, [timeLeft, started, showBars]);

 const handleNext = async () => {
  setShowBars(false);
  if (current < questions.length - 1) {
    setCurrent(c => c + 1);
    setPercentages(Array(questions[current + 1]?.options.length || 0).fill(0));
  } else {
    try {
      await fetch('http://localhost:5000/api/participants/markAttempted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName })
      });
      setBlocked(true);

    
    } catch (err) {
      console.error("Failed to mark attempted", err);
    }

    onSubmitTest(selected);
    setCurrent(0);
    setStarted(false);
    setSelected(Array(questions.length).fill(null));
    setPercentages(Array(questions[0]?.options.length || 0).fill(0));
    setFinished(true); 
  }
};

 if (checkingBlocked) {
  return (
    <div className="home-container">
      <h2>Loading...</h2>
    </div>
  );
}

if (blocked || finished) {
  return <Submitted onBack={onBack} />;
}
  if (!started) {
    return (
      <div className="home-container" style={{ position: 'relative' }}>
        <BackButton onClick={onBack} />
        <h1>Ready to start?</h1>
        <button className="continue-btn" onClick={handleStart}>
          Start Test
        </button>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="home-container">
        <h2>No questions available.</h2>
      </div>
    );
  }

  return (
    <div className="home-container" style={{ position: 'relative', alignItems: 'flex-start', maxWidth: 600 }}>
      <BackButton onClick={onBack} />
      {!showBars ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Question {current + 1}</span>
            <span style={{ color: '#0984e3', fontWeight: 'bold', fontSize: '1.1rem' }}>⏱ {timeLeft}s</span>
          </div>
          <div style={{ margin: '1rem 0', fontWeight: 'bold', fontSize: '1.2rem' }}>{q.question}</div>
          <div style={{ marginBottom: '1.5rem' }}>
            {q.options.map((opt, idx) => (
              <OptionBar
                key={idx}
                option={opt}
                percent={0}
                selected={selected[current] === idx}
                showBars={false}
                onSelect={() => handleSelect(idx)}
                disabled={showBars}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="continue-btn" onClick={handlePrev} disabled={current === 0}>Prev</button>
            <button className="continue-btn" onClick={handleShowBars} disabled={selected[current] === null}>Submit</button>
          </div>
        </>
      ) : (
        <>
          <h2>Live Results</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            {q.options.map((opt, idx) => (
              <OptionBar
                key={idx}
                option={opt}
                percent={percentages[idx] || 0}
                selected={selected[current] === idx}
                showBars={true}
                disabled={true}
              />
            ))}
          </div>
          <button className="continue-btn" onClick={handleNext}>
            {current < questions.length - 1 ? 'Next Question' : 'Finish Test'}
          </button>
        </>
      )}
    </div>
  );
}

export default StudentPage3;
