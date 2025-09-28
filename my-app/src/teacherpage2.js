import React, { useEffect, useState } from 'react';
import './App.css';
import { io } from 'socket.io-client';

function TeacherPage2({ onAskQuestion, onBackToManage }) {
  const [questions, setQuestions] = useState([]);
  const [aggregates, setAggregates] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    // Socket.io live updates only
    const socket = io('http://localhost:5000');
    socket.on('new-response', () => {
      fetchAll();
    });
    return () => {
      socket.disconnect();
    };
  }, []);


  const fetchAll = async () => {
    setLoading(true);
    try {
      const qRes = await fetch('http://localhost:5000/api/questions');
      const questionsData = await qRes.json();
      setQuestions(questionsData);
      const aggRes = await fetch('http://localhost:5000/api/responses/aggregate');
      const aggData = await aggRes.json();
      setAggregates(aggData);
      const partRes = await fetch('http://localhost:5000/api/participants');
      const partData = await partRes.json();
      setParticipants(partData);
    } catch {
      setQuestions([]);
      setAggregates([]);
      setParticipants([]);
    }
    setLoading(false);
  };

  const handleKick = async (name) => {
    await fetch('http://localhost:5000/api/participants/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    fetchAll();
  };

 function getPercentages(questionId, optionsLength) {
  const agg = aggregates.find(a => a.questionId === questionId);
  return agg ? agg.percentages.map(p => Math.round(p)) : Array(optionsLength).fill(0);
}


  return (
    <div className="home-container" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', display: 'flex', gap: 32 }}>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'row', gap: 32 }}>
        <div style={{ flex: 2 }}>
          <h1>Live Poll Responses</h1>
          {loading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p>No questions found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {questions.map((q, idx) => {
                const percentages = getPercentages(q._id, q.options.length);
                return (
                  <div key={q._id} style={{ border: '1px solid #dfe6e9', borderRadius: 8, padding: 16, background: '#fff', marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 8 }}>{q.question}</h3>
                    {q.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 'bold', minWidth: 120 }}>{opt}</span>
                        <div style={{ flex: 1, height: 24, background: '#dfe6e9', borderRadius: 6, marginLeft: 12, position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${percentages[i]}%`,
                            background:  '#0984e3',
                            borderRadius: '6px',
                            transition: 'width 0.5s'
                          }} />
                          <span style={{ position: 'absolute', left: 8, top: 2, color: '#fff', fontWeight: 'bold', zIndex: 2 }}>
                            {percentages[i]}%
                          </span>
                        </div>
                        {i === q.correctIndex && <span style={{ color: '#00b894', fontWeight: 'bold', marginLeft: 8 }}>(Correct)</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 250, background: '#f5f6fa', borderRadius: 8, padding: 16, height: '100%' }}>
          <h2>Participants</h2>
          {participants.length === 0 ? <p>No participants yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {participants.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: p.kicked ? '#ffe6e6' : '#fff', borderRadius: 6, padding: '8px 12px', border: '1px solid #dfe6e9' }}>
                  <span style={{ fontWeight: 'bold', color: p.kicked ? '#d63031' : '#2d3436' }}>{p.name}</span>
                  <button
                    className="continue-btn"
                    style={{ background: '#d63031', color: '#fff', fontSize: 14, padding: '4px 12px', borderRadius: 4, marginLeft: 12, cursor: p.kicked ? 'not-allowed' : 'pointer' }}
                    onClick={() => handleKick(p.name)}
                    disabled={p.kicked}
                  >
                    Kickoff
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      

    </div>
  );
}

export default TeacherPage2;
