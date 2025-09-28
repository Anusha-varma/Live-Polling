import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import StudentPage1 from './studentpage1';
import StudentPage2 from './studentpage2';
import StudentPage3 from './studentpage3';
import TeacherPage1 from './teacherpage1';
import TeacherPage2 from './teacherpage2';
import KickedPage from './KickedPage';

function App() {
  const [role, setRole] = useState('');
  const [showError, setShowError] = useState(false);
  const [showStudentPage, setShowStudentPage] = useState(false);
  const [showStudentPage2, setShowStudentPage2] = useState(false);
  const [showStudentPage3, setShowStudentPage3] = useState(false);
  const [showTeacherPage, setShowTeacherPage] = useState(false);
  const [showTeacherPage2, setShowTeacherPage2] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [isKicked, setIsKicked] = useState(false);

  useEffect(() => {
    if (showStudentPage3) {
      axios.get('http://localhost:5000/api/questions')
        .then(res => setQuestions(res.data))
        .catch(err => console.error('Error fetching questions:', err));
    }
  }, [showStudentPage3]);

  const handleSelect = (selectedRole) => {
    setRole(selectedRole);
    setShowError(false);
  };

  const handleContinue = () => {
    if (!role) {
      setShowError(true);
      return;
    }
    if (role === 'student') {
      setShowStudentPage(true);
      return;
    }
    if (role === 'teacher') {
      setShowTeacherPage(true);
      return;
    }
  };

  const handleStudentContinue = async (name) => {
    setShowStudentPage(false);
    setStudentName(name);
    // Register participant
    await axios.post('http://localhost:5000/api/participants', { name });
    // Check if kicked
    const kickedRes = await axios.get(`http://localhost:5000/api/participants/${name}/kicked`);
    if (kickedRes.data.kicked) {
      setIsKicked(true);
      return;
    }
    setShowStudentPage2(true);
  };

  const handleStudentWaitDone = () => {
    setShowStudentPage2(false);
    setShowStudentPage3(true);
  };

  const handleBackToHome = () => {
    setShowStudentPage(false);
    setShowStudentPage2(false);
    setShowStudentPage3(false);
    setShowTeacherPage(false);
    setShowTeacherPage2(false);
    setRole('');
    setShowError(false);
    setIsKicked(false);
    setStudentName('');
  };

  const handleShowResponses = () => {
    setShowTeacherPage(false);
    setShowTeacherPage2(true);
  };

  const handleBackToManageQuestions = () => {
    setShowTeacherPage2(false);
    setShowTeacherPage(true);
  };

  if (showStudentPage) {
    return <StudentPage1 onBack={handleBackToHome} onContinue={handleStudentContinue} />;
  }
  if (showStudentPage2) {
    return <StudentPage2 onBack={handleBackToHome} onQuestionsReady={handleStudentWaitDone} />;
  }
  if (showStudentPage3) {
    return <StudentPage3 questions={questions} onBack={handleBackToHome} studentName={studentName} onSubmitTest={() => {}} />;
  }
  if (showTeacherPage) {
    return <TeacherPage1 onBack={handleBackToHome} onShowResponses={handleShowResponses} />;
  }
  if (showTeacherPage2) {
    return <TeacherPage2 onBackToManage={handleBackToManageQuestions} />;
  }
  if (isKicked) {
    return <KickedPage onBack={handleBackToHome} />;
  }

  return (
    <div className="home-container">
      <h1>Welcome to Polling App</h1>
      <div className="role-buttons">
        <button
          className={role === 'student' ? 'selected' : ''}
          onClick={() => handleSelect('student')}
        >
          If you are a Student, click here
        </button>
        <button
          className={role === 'teacher' ? 'selected' : ''}
          onClick={() => handleSelect('teacher')}
        >
          If you are a Teacher, click here
        </button>
      </div>
      <button className="continue-btn" onClick={handleContinue}>
        Continue
      </button>
      {showError && <p className="error-msg">Please select a role to continue.</p>}
    </div>
  );
}

export default App;
