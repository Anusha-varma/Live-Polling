import React, { useState, useEffect } from 'react';
import './App.css';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';

const TIMER_OPTIONS = [
  { label: '15 sec', value: 15 },
  { label: '60 sec', value: 60 }
];

// Option input with delete + correct answer toggle
function OptionField({ option, index, onChange, isCorrect, onCorrectChange, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <input
        type="text"
        placeholder={`Option ${index + 1}`}
        value={option}
        onChange={e => onChange(index, e.target.value)}
        style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #b2bec3', width: 180 }}
      />
      <span style={{ fontWeight: 'bold', marginRight: 6 }}>Is correct:</span>
      <label style={{ marginRight: 8 }}>
        <input
          type="radio"
          checked={isCorrect}
          onChange={() => onCorrectChange(index)}
        /> Yes
      </label>
      <label>
        <input
          type="radio"
          checked={!isCorrect}
          onChange={() => onCorrectChange(index, false)}
        /> No
      </label>
      <FaTrash
        style={{ color: '#d63031', cursor: 'pointer', marginLeft: 8 }}
        title="Delete option"
        onClick={() => onDelete(index)}
      />
    </div>
  );
}

// Full question block UI
function QuestionBlock({
  question,
  onChange,
  onAddOption,
  onOptionChange,
  options,
  correctIndex,
  onCorrectChange,
  timer,
  onTimerChange,
  onDeleteOption,
  onDeleteQuestion,
  onSave,
  saving,
  isNew
}) {
  return (
    <div style={{
      marginBottom: '2rem',
      border: '1px solid #dfe6e9',
      borderRadius: 8,
      padding: 16,
      background: '#fff',
      position: 'relative'
    }}>
      <FaTrash
        style={{ position: 'absolute', top: 12, right: 12, color: '#d63031', cursor: 'pointer', fontSize: 20 }}
        title="Delete question"
        onClick={onDeleteQuestion}
      />
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#2d3436' }}>
        Enter a question
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          value={question}
          onChange={e => onChange(e.target.value)}
          style={{ padding: '0.7rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #b2bec3', width: '60%' }}
        />
        <select
          value={timer}
          onChange={e => onTimerChange(Number(e.target.value))}
          style={{ padding: '0.7rem', borderRadius: 6, border: '1px solid #b2bec3', fontSize: '1rem' }}
        >
          {TIMER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#636e72' }}>Edit options</div>
      {options.map((opt, idx) => (
        <OptionField
          key={idx}
          option={opt}
          index={idx}
          onChange={onOptionChange}
          isCorrect={correctIndex === idx}
          onCorrectChange={() => onCorrectChange(idx)}
          onDelete={onDeleteOption}
        />
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 12 }}>
        <button
          type="button"
          className="continue-btn"
          style={{ background: '#0984e3' }}
          onClick={onAddOption}
        >
          + Add more options
        </button>
        <button
          type="button"
          className="continue-btn"
          style={{ background: isNew ? '#00b894' : '#0984e3' }}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : (isNew ? 'Save New Question' : 'Save Changes')}
        </button>
      </div>
    </div>
  );
}

function TeacherPage1({ onBack, onShowResponses }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([
    { question: '', options: ['', ''], correctIndex: 0, timer: 15 }
  ]);
  const [saving, setSaving] = useState(false);

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/questions');
      setQuestions(res.data);
    } catch (err) {
      console.error('Error fetching:', err.message);
      setQuestions([]);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  // ---------------- EXISTING QUESTION HANDLERS ----------------
  const handleExistingChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const handleExistingOptionChange = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const handleExistingAddOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options.push('');
    setQuestions(updated);
  };

  const handleExistingDeleteOption = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].options.splice(optIdx, 1);
    if (updated[qIdx].correctIndex >= updated[qIdx].options.length) {
      updated[qIdx].correctIndex = 0;
    }
    setQuestions(updated);
  };

  const handleExistingCorrectChange = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].correctIndex = optIdx;
    setQuestions(updated);
  };

  const handleExistingTimerChange = (qIdx, value) => {
    const updated = [...questions];
    updated[qIdx].timer = value;
    setQuestions(updated);
  };

  // Save existing question
  const handleUpdateQuestion = async (idx) => {
    setSaving(true);
    const q = questions[idx];

    // validate options
    const cleanedOptions = q.options.map(o => o.trim()).filter(o => o !== '');
    if (cleanedOptions.length < 2) {
      alert('Please enter at least 2 valid options.');
      setSaving(false);
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/questions/${q._id}`, {
        question: q.question,
        options: cleanedOptions,
        correctIndex: q.correctIndex,
        timer: q.timer
      });
      await fetchQuestions();
      alert('✅ Question updated!');
    } catch (err) {
      console.error('Update failed:', err.response?.data || err.message);
      alert('❌ Failed to update question');
    }
    setSaving(false);
  };

  const handleDeleteExistingQuestion = async (idx) => {
    const q = questions[idx];
    if (!window.confirm('Delete this question?')) return;
    setSaving(true);
    try {
      await axios.delete(`http://localhost:5000/api/questions/${q._id}`);
      await fetchQuestions();
      alert('🗑️ Question deleted!');
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      alert('❌ Failed to delete question');
    }
    setSaving(false);
  };

  // ---------------- NEW QUESTION HANDLERS ----------------
  const handleNewChange = (idx, field, value) => {
    const updated = [...newQuestions];
    updated[idx][field] = value;
    setNewQuestions(updated);
  };

  const handleNewOptionChange = (qIdx, optIdx, value) => {
    const updated = [...newQuestions];
    updated[qIdx].options[optIdx] = value;
    setNewQuestions(updated);
  };

  const handleNewAddOption = (qIdx) => {
    const updated = [...newQuestions];
    updated[qIdx].options.push('');
    setNewQuestions(updated);
  };

  const handleNewDeleteOption = (qIdx, optIdx) => {
    const updated = [...newQuestions];
    updated[qIdx].options.splice(optIdx, 1);
    setNewQuestions(updated);
  };

  const handleNewCorrectChange = (qIdx, optIdx) => {
    const updated = [...newQuestions];
    updated[qIdx].correctIndex = optIdx;
    setNewQuestions(updated);
  };

  const handleNewTimerChange = (qIdx, value) => {
    const updated = [...newQuestions];
    updated[qIdx].timer = value;
    setNewQuestions(updated);
  };

  const handleSaveNewQuestions = async () => {
    // Check for at least one valid question before saving
    const validQuestions = newQuestions.filter(q =>
      q.question.trim() &&
      Array.isArray(q.options) &&
      q.options.map(o => o.trim()).filter(o => o !== '').length >= 2
    );
    if (validQuestions.length === 0) {
      alert('Please add at least one valid question with at least 2 options before saving.');
      return;
    }
    setSaving(true);
    try {
      for (const q of validQuestions) {
        const cleanedOptions = q.options.map(o => o.trim()).filter(o => o !== '');
        await axios.post('http://localhost:5000/api/questions', {
          question: q.question,
          options: cleanedOptions,
          correctIndex: q.correctIndex,
          timer: q.timer
        });
      }
      setNewQuestions([{ question: '', options: ['', ''], correctIndex: 0, timer: 15 }]);
      await fetchQuestions();
      alert('✅ New questions saved!');
    } catch (err) {
      console.error('Save failed:', err.response?.data || err.message);
      alert('❌ Failed to save new questions');
    }
    setSaving(false);
  };

  return (
    <div className="home-container" style={{ alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      {onBack && (
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
            gap: 6,
            zIndex: 10
          }}
          onClick={onBack}
        >
          &#8592; Back
        </button>
      )}
      {onShowResponses && (
        <button
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: '#00b894',
            border: 'none',
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '8px 18px',
            borderRadius: 6,
            zIndex: 10
          }}
          onClick={onShowResponses}
        >
          Show Responses
        </button>
      )}
      <h1>Manage Questions</h1>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', width: '100%' }}>
        {/* Previously Saved Questions */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <h2>Previously Saved Questions</h2>
          {questions.length === 0 && <p>No previous questions found.</p>}
          {questions.map((q, idx) => (
            <div key={q._id}>
              <QuestionBlock
                question={q.question}
                onChange={val => handleExistingChange(idx, 'question', val)}
                onAddOption={() => handleExistingAddOption(idx)}
                onOptionChange={(optIdx, val) => handleExistingOptionChange(idx, optIdx, val)}
                options={q.options}
                correctIndex={q.correctIndex}
                onCorrectChange={optIdx => handleExistingCorrectChange(idx, optIdx)}
                timer={q.timer}
                onTimerChange={val => handleExistingTimerChange(idx, val)}
                onDeleteOption={optIdx => handleExistingDeleteOption(idx, optIdx)}
                onDeleteQuestion={() => handleDeleteExistingQuestion(idx)}
                onSave={() => handleUpdateQuestion(idx)}
                saving={saving}
                isNew={false}
              />
            </div>
          ))}
        </div>
        {/* Add New Questions */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <h2>Add New Questions</h2>
          {newQuestions.map((q, idx) => (
            <QuestionBlock
              key={idx}
              question={q.question}
              onChange={val => handleNewChange(idx, 'question', val)}
              onAddOption={() => handleNewAddOption(idx)}
              onOptionChange={(optIdx, val) => handleNewOptionChange(idx, optIdx, val)}
              options={q.options}
              correctIndex={q.correctIndex}
              onCorrectChange={optIdx => handleNewCorrectChange(idx, optIdx)}
              timer={q.timer}
              onTimerChange={val => handleNewTimerChange(idx, val)}
              onDeleteOption={optIdx => handleNewDeleteOption(idx, optIdx)}
              onDeleteQuestion={() => {
                const updated = [...newQuestions];
                updated.splice(idx, 1);
                setNewQuestions(updated);
              }}
              onSave={handleSaveNewQuestions}
              saving={saving}
              isNew={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherPage1;
