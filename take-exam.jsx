import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExams, getResults, saveResults } from './localData.js';

const TakeExam = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localCode, setLocalCode] = useState('');

  const studentEmail = localStorage.getItem('userEmail') || 'student@domain.com';

  useEffect(() => {
    if (!examId) {
      setError('No exam was specified.');
      setLoading(false);
      return;
    }

    const found = getExams().find((e) => e._id === examId);
    if (!found) {
      setError('Exam not found.');
      setLoading(false);
      return;
    }

    setExam(found);
    setQuestions(found.questions || []);

    if (found.endDate) {
      const diff = Math.floor((new Date(found.endDate).getTime() - Date.now()) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    } else {
      setTimeLeft(3600);
    }
    setLoading(false);
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    if (questions[currentIdx]?.type === 'coding') {
      setLocalCode(answers[currentIdx]?.code || '');
    }
  }, [currentIdx, questions]);

  const handleMcqSelect = (option) => {
    setAnswers({ ...answers, [currentIdx]: option });
  };

  const handleLocalCodeChange = (val) => {
    setLocalCode(val);
    const currentAnswer = answers[currentIdx] || { code: '', lang: questions[currentIdx]?.allowedLanguages?.[0] || 'javascript' };
    setAnswers({ ...answers, [currentIdx]: { ...currentAnswer, code: val } });
  };

  const handleLanguageChange = (langVal) => {
    const currentAnswer = answers[currentIdx] || { code: localCode, lang: langVal };
    setAnswers({ ...answers, [currentIdx]: { ...currentAnswer, lang: langVal } });
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const gradeAndSave = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      const answer = answers[idx];
      if (q.type === 'coding') {
        if (answer?.code && answer.code.trim().length > 10) score++;
      } else if (answer === q.correct) {
        score++;
      }
    });

    const result = {
      id: crypto.randomUUID(),
      studentEmail,
      examId,
      examTitle: exam?.title || 'Exam Session',
      score,
      totalQuestions: questions.length,
      studentAnswers: answers,
      createdAt: new Date().toISOString()
    };

    saveResults([...getResults(), result]);
  };

  const handleAutoSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    gradeAndSave();
    alert('🛑 Time expired! Your answers were automatically saved.');
    navigate('/dashboard');
  };

  const manualSubmit = () => {
    if (!window.confirm('Are you sure you want to submit your exam?')) return;
    setSubmitting(true);
    gradeAndSave();
    alert('🎉 Exam submitted successfully!');
    navigate('/dashboard');
  };

  if (loading) return <div className="exam-fallback-screen">🔄 Loading Exam...</div>;
  if (error) return <div className="exam-fallback-screen" style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</div>;

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  return (
    <div className="exam-wrapper">
      <div className="exam-header">
        <div>
          <h2>{exam?.title}</h2>
          <span className="exam-header-user">Student: {studentEmail}</span>
        </div>
        <div className="exam-timer-box">
          <span className="exam-timer-label">⏱️ REMAINING TIME</span>
          <div className="exam-timer-value" style={{ color: timeLeft < 300 ? '#ef4444' : '#10b981' }}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="exam-body">
        {totalQuestions === 0 ? (
          <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center', width: '100%' }}>This exam has no questions.</div>
        ) : currentQuestion?.type === 'coding' ? (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div className="exam-left-panel">
              <span className="exam-question-badge">QUESTION {currentIdx + 1} OF {totalQuestions} (CODING)</span>
              <p style={{ color: '#e2e8f0', fontSize: '16px', lineHeight: 1.7, margin: 0 }}>{currentQuestion.codingProblemStatement || currentQuestion.text}</p>
            </div>
            <div className="exam-right-panel">
              <div className="exam-editor-toolbar">
                <span className="exam-timer-label">💻 CODE EDITOR</span>
                <select
                  value={answers[currentIdx]?.lang || currentQuestion.allowedLanguages?.[0] || 'javascript'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="exam-lang-select"
                >
                  {(currentQuestion.allowedLanguages || ['javascript', 'python', 'java']).map((l) => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={localCode}
                onChange={(e) => handleLocalCodeChange(e.target.value)}
                placeholder="// Write your code here..."
                className="exam-code-editor"
                spellCheck="false"
              />
            </div>
          </div>
        ) : (
          <div className="exam-mcq-wrapper">
            <div className="exam-mcq-card">
              <span className="exam-question-badge">QUESTION {currentIdx + 1} OF {totalQuestions}</span>
              <p className="exam-question-text">{currentQuestion?.text}</p>
              <div className="exam-options-list">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const choiceString = currentQuestion?.[`option${opt}`];
                  if (!choiceString) return null;
                  const isSelected = answers[currentIdx] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMcqSelect(opt)}
                      className={`exam-option-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="exam-option-letter">{opt}</span>
                      <span className="exam-option-text">{choiceString}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="exam-footer">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(currentIdx - 1)}
          className="exam-nav-btn"
          style={{ opacity: currentIdx === 0 ? 0.5 : 1 }}
        >
          ⏮️ Previous
        </button>
        <div>
          {currentIdx < totalQuestions - 1 ? (
            <button onClick={() => setCurrentIdx(currentIdx + 1)} className="exam-next-btn">Next ⏭️</button>
          ) : (
            <button onClick={manualSubmit} disabled={submitting} className="exam-submit-btn">🏁 Submit Exam</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
