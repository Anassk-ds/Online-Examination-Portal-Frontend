import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

  // Keeps typing snappy in the coding editor textarea
  const [localCode, setLocalCode] = useState('');
  const studentEmail = localStorage.getItem('userEmail') || 'student@domain.com';

  // Fetch Exam Data
  useEffect(() => {
    if (!examId) {
      setError('⚠️ Invalid Exam reference mapping token. (Prop "examId" is missing or undefined)');
      setLoading(false);
      return;
    }

    fetch(`/api/student/exams/${examId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Exam not found or server structural error.');
        return res.json();
      })
      .then((data) => {
        if (data) {
          setExam(data);
          setQuestions(data.questions || []);
          
          if (data.endDate) {
            const endTime = new Date(data.endDate).getTime();
            const now = new Date().getTime();
            const difference = Math.floor((endTime - now) / 1000);
            setTimeLeft(difference > 0 ? difference : 0);
          } else {
            setTimeLeft(3600); // 1-Hour Fallback
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch operational failure:", err);
        setError('⚠️ Failed to load exam. Check backend connection or Exam ID validity.');
        setLoading(false);
      });
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Sync local code editor text state when navigating questions
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
    if (seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const buildPayload = () => ({
    email: studentEmail,
    examId,
    examTitle: exam?.title || 'Exam Session',
    studentAnswers: answers
  });

  const handleAutoSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    
    fetch('/api/student/submit-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
    .then(() => {
      alert("🛑 Time expired! Your answers were automatically saved.");
      navigate('/dashboard');
    })
    .catch(() => navigate('/dashboard'));
  };

  const manualSubmit = () => {
    if (!window.confirm("Are you sure you want to submit your final exam configuration?")) return;
    setSubmitting(true);

    fetch('/api/student/submit-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
    .then((res) => {
      if (!res.ok) throw new Error();
      alert("🎉 Exam answers logged and synced successfully!");
      navigate('/dashboard');
    })
    .catch(() => {
      alert("Failed to sync structural scores matrix with database.");
      setSubmitting(false);
    });
  };

  if (loading) return <div style={styles.fallbackScreen}>🔄 Loading Exam Workspace...</div>;
  if (error) return <div style={{ ...styles.fallbackScreen, color: '#ef4444', fontWeight: 'bold' }}>{error}</div>;

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  return (
    <div style={styles.examWrapper}>
      <div style={styles.examHeader}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>{exam?.title}</h2>
          <span style={{ color: '#64748b', fontSize: '13px' }}>User: {studentEmail}</span>
        </div>
        <div style={styles.timerBox}>
          <span style={styles.controlLabel}>⏱️ REMAINING TIME</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: timeLeft < 300 ? '#ef4444' : '#10b981' }}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div style={styles.workspaceBody}>
        {totalQuestions === 0 ? (
          <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center', width: '100%' }}>No assessment layers active.</div>
        ) : currentQuestion?.type === 'coding' ? (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div style={styles.leftInstructionPanel}>
              <span style={styles.qIndexBadge}>CHALLENGE {currentIdx + 1} OF {totalQuestions} (CODE)</span>
              <p style={styles.problemStatementText}>{currentQuestion.codingProblemStatement || currentQuestion.text}</p>
            </div>
            <div style={styles.rightEditorPanel}>
              <div style={styles.editorToolbarHeader}>
                <span style={styles.controlLabel}>💻 RESOURCE COMPILATION CODE EDITOR</span>
                <select 
                  value={answers[currentIdx]?.lang || currentQuestion.allowedLanguages?.[0] || 'javascript'} 
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={styles.languageDropdown}
                >
                  {(currentQuestion.allowedLanguages || ['javascript', 'python', 'java', 'cpp']).map((l) => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={localCode}
                onChange={(e) => handleLocalCodeChange(e.target.value)}
                placeholder={`// Enter code syntax configurations here...`}
                style={styles.codeTextareaEditor}
                spellCheck="false"
              />
            </div>
          </div>
        ) : (
          <div style={styles.mcqContainerWrapper}>
            <div style={styles.mcqCard}>
              <span style={{ ...styles.qIndexBadge, color: '#64748b' }}>QUESTION {currentIdx + 1} OF {totalQuestions} (MCQ)</span>
              <p style={styles.mcqQuestionBodyText}>{currentQuestion?.text || currentQuestion?.questionText}</p>
              <div style={styles.optionsListGrid}>
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const choiceString = currentQuestion?.[`option${opt}`];
                  if (!choiceString) return null;
                  const isSelected = answers[currentIdx] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMcqSelect(opt)}
                      style={{
                        ...styles.optionRowBtn,
                        borderColor: isSelected ? '#3b82f6' : '#334155',
                        backgroundColor: isSelected ? '#1e293b' : '#0f172a'
                      }}
                    >
                      <span style={{
                        ...styles.optionSelectorLetter,
                        backgroundColor: isSelected ? '#3b82f6' : '#1e293b',
                        color: '#ffffff'
                      }}>{opt}</span>
                      <span style={styles.optionStringValue}>{choiceString}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.examFooter}>
        <button 
          disabled={currentIdx === 0} 
          onClick={() => setCurrentIdx(currentIdx - 1)}
          style={{ ...styles.navActionBtn, opacity: currentIdx === 0 ? 0.5 : 1 }}
        >
          ⏮️ Previous
        </button>
        <div>
          {currentIdx < totalQuestions - 1 ? (
            <button onClick={() => setCurrentIdx(currentIdx + 1)} style={styles.nextStepBtn}>Next ⏭️</button>
          ) : (
            <button onClick={manualSubmit} disabled={submitting} style={styles.finishSubmitBtn}>🏁 Submit Exam</button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  examWrapper: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif', overflow: 'hidden' },
  examHeader: { height: '80px', backgroundColor: '#1e293b', padding: '0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  timerBox: { backgroundColor: '#111827', padding: '8px 16px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center', minWidth: '130px' },
  controlLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginBottom: '2px' },
  workspaceBody: { flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#0f172a' },
  leftInstructionPanel: { width: '40%', backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '30px', overflowY: 'auto', boxSizing: 'border-box' },
  rightEditorPanel: { width: '60%', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0f172a' },
  editorToolbarHeader: { height: '50px', backgroundColor: '#111827', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  languageDropdown: { backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  codeTextareaEditor: { flex: 1, backgroundColor: '#090d16', color: '#38bdf8', border: 'none', padding: '25px', fontSize: '15px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6' },
  mcqContainerWrapper: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px', overflowY: 'auto' },
  mcqCard: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '35px', width: '100%', maxWidth: '700px', border: '1px solid #334155' },
  qIndexBadge: { fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', display: 'block', marginBottom: '15px' },
  problemStatementText: { color: '#e2e8f0', fontSize: '16px', lineHeight: '1.7', margin: 0 },
  mcqQuestionBodyText: { color: '#f8fafc', fontSize: '18px', fontWeight: 'bold', margin: '0 0 25px 0' },
  optionsListGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  optionRowBtn: { display: 'flex', alignItems: 'center', padding: '14px', borderRadius: '8px', border: '1px solid #334155', cursor: 'pointer', textAlign: 'left', outline: 'none' },
  optionSelectorLetter: { width: '30px', height: '30px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', marginRight: '15px' },
  optionStringValue: { color: '#e2e8f0', fontSize: '15px' },
  examFooter: { height: '75px', backgroundColor: '#111827', borderTop: '1px solid #334155', padding: '0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navActionBtn: { backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  nextStepBtn: { backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  finishSubmitBtn: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  fallbackScreen: { padding: '50px', color: '#94a3b8', textAlign: 'center', backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }
};

export default TakeExam;
