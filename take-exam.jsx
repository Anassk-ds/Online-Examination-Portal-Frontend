import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, checkAttempted, submitResult } from './apiClient.js';
import { runCode, runTestCases, getStarterCode, LANGUAGE_LABELS } from './codeRunner.js';

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
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gradingMessage, setGradingMessage] = useState('');
  const [localCode, setLocalCode] = useState('');
  const [runStdin, setRunStdin] = useState('');
  const [runOutput, setRunOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null); // holds the final graded result once submitted

  const studentEmail = localStorage.getItem('userEmail') || 'student@domain.com';

  useEffect(() => {
    if (!examId) {
      setError('No exam was specified.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const attempted = await checkAttempted(examId, studentEmail);
        if (attempted) {
          if (!cancelled) { setAlreadyDone(true); setLoading(false); }
          return;
        }

        const found = await getExam(examId);
        if (cancelled) return;

        setExam(found);
        setQuestions(found.questions || []);

        if (found.endDate) {
          const diff = Math.floor((new Date(found.endDate).getTime() - Date.now()) / 1000);
          setTimeLeft(diff > 0 ? diff : 0);
        } else {
          setTimeLeft(3600);
        }
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Exam not found.');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result]);

  useEffect(() => {
    if (questions[currentIdx]?.type === 'coding') {
      const existing = answers[currentIdx];
      const lang = existing?.lang || questions[currentIdx]?.allowedLanguages?.[0] || 'javascript';
      setLocalCode(existing?.code !== undefined ? existing.code : getStarterCode(lang));
      setRunStdin(questions[currentIdx]?.sampleInput || '');
      setRunOutput(null);
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
    const nextCode = currentAnswer.code && currentAnswer.code.trim() ? currentAnswer.code : getStarterCode(langVal);
    setLocalCode(nextCode);
    setAnswers({ ...answers, [currentIdx]: { ...currentAnswer, lang: langVal, code: nextCode } });
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentLang = () => answers[currentIdx]?.lang || questions[currentIdx]?.allowedLanguages?.[0] || 'javascript';

  const handleRunCode = async () => {
    setRunning(true);
    setRunOutput(null);
    const res = await runCode(currentLang(), localCode, runStdin);
    setRunOutput(res);
    setRunning(false);
  };

  // Change these two numbers to adjust how many marks each question type is worth.
  // Coding questions still award partial credit within their weight based on
  // how many test cases passed (e.g. CODING_MARKS=5 and passing 3/4 cases = 3.75).
  const MCQ_MARKS = 1;
  const CODING_MARKS = 1;

  const gradeAndSave = async () => {
    let score = 0;
    const finalAnswers = {};

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const answer = answers[idx];

      if (q.type === 'coding') {
        const code = answer?.code || '';
        const lang = answer?.lang || q.allowedLanguages?.[0] || 'javascript';
        const testCases = q.testCases || [];

        if (!code.trim() || testCases.length === 0) {
          finalAnswers[idx] = { code, lang, testCaseResults: [], passedCount: 0, totalCases: testCases.length };
          continue;
        }

        setGradingMessage(`Running your code for Question ${idx + 1} of ${questions.length}...`);
        const { results, apiFailed } = await runTestCases(lang, code, testCases);
        const passedCount = results.filter((r) => r.passed).length;
        const questionScore = testCases.length ? (passedCount / testCases.length) * CODING_MARKS : 0;
        score += questionScore;

        finalAnswers[idx] = {
          code,
          lang,
          testCaseResults: results,
          passedCount,
          totalCases: testCases.length,
          apiFailed
        };
      } else {
        finalAnswers[idx] = answer;
        if (answer === q.correct) score += MCQ_MARKS;
      }
    }

    setGradingMessage('');

    const totalMarks = questions.reduce((sum, q) => sum + (q.type === 'coding' ? CODING_MARKS : MCQ_MARKS), 0);

    const finalResult = {
      studentEmail,
      examId,
      examTitle: exam?.title || 'Exam Session',
      score: Math.round(score * 100) / 100,
      totalQuestions: questions.length,
      totalMarks,
      studentAnswers: finalAnswers
    };

    const saved = await submitResult(finalResult);
    return saved;
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const savedResult = await gradeAndSave();
      setResult(savedResult);
    } catch (err) {
      setError(err.message || 'Could not submit your exam — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const manualSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit your exam?')) return;
    setSubmitting(true);
    try {
      const savedResult = await gradeAndSave();
      setResult(savedResult);
    } catch (err) {
      setError(err.message || 'Could not submit your exam — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="exam-fallback-screen">🔄 Loading Exam...</div>;

  if (alreadyDone) {
    return (
      <div className="exam-fallback-screen" style={{ flexDirection: 'column', gap: '16px' }}>
        <span style={{ fontSize: '40px' }}>🔒</span>
        <span>You've already submitted this exam. Each exam can only be attempted once.</span>
        <button onClick={() => navigate('/dashboard')} className="dash-btn-view btn-animated">← Back to Dashboard</button>
      </div>
    );
  }

  if (error) return <div className="exam-fallback-screen" style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</div>;

  if (submitting && !result) {
    return (
      <div className="exam-fallback-screen" style={{ flexDirection: 'column', gap: '14px' }}>
        <div className="spinner" />
        <span>{gradingMessage || 'Submitting your exam...'}</span>
      </div>
    );
  }

  // Post-submission result screen
  if (result) {
    const scoreLabel = Number.isInteger(result.score) ? result.score : result.score.toFixed(2);
    return (
      <div className="result-screen">
        <div className="result-card">
          <span className="result-emoji">🎉</span>
          <h2 className="result-title">Exam Submitted!</h2>
          <p className="result-subtitle">{result.examTitle}</p>
          <div className="result-score-badge">{scoreLabel} / {result.totalMarks ?? result.totalQuestions}</div>

          <div className="result-breakdown">
            {questions.map((q, idx) => {
              const ans = result.studentAnswers[idx];
              if (q.type === 'coding') {
                return (
                  <div key={idx} className="result-breakdown-row">
                    <span>Question {idx + 1} (Coding)</span>
                    <span className={ans?.passedCount === ans?.totalCases && ans?.totalCases > 0 ? 'result-pass' : 'result-partial'}>
                      {ans?.passedCount ?? 0}/{ans?.totalCases ?? 0} test cases passed
                    </span>
                  </div>
                );
              }
              const correct = ans === q.correct;
              return (
                <div key={idx} className="result-breakdown-row">
                  <span>Question {idx + 1} (MCQ)</span>
                  <span className={correct ? 'result-pass' : 'result-fail'}>{correct ? '✔ Correct' : '✘ Incorrect'}</span>
                </div>
              );
            })}
          </div>

          <button onClick={() => navigate('/dashboard')} className="publish-btn btn-animated" style={{ marginTop: '20px' }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

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

              {(currentQuestion.sampleInput || currentQuestion.sampleOutput) && (
                <div className="sample-io-box">
                  <div className="sample-io-block">
                    <span className="sample-io-label">Sample Input</span>
                    <pre className="sample-io-value">{currentQuestion.sampleInput || '(none)'}</pre>
                  </div>
                  <div className="sample-io-block">
                    <span className="sample-io-label">Sample Output</span>
                    <pre className="sample-io-value">{currentQuestion.sampleOutput || '(none)'}</pre>
                  </div>
                </div>
              )}
            </div>
            <div className="exam-right-panel">
              <div className="exam-editor-toolbar">
                <span className="exam-timer-label">💻 CODE EDITOR</span>
                <select
                  value={currentLang()}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="exam-lang-select"
                >
                  {(currentQuestion.allowedLanguages || ['javascript', 'python', 'java']).map((l) => (
                    <option key={l} value={l}>{(LANGUAGE_LABELS[l] || l).toUpperCase()}</option>
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

              <div className="run-panel">
                <div className="run-panel-header">
                  <span className="exam-timer-label">▶️ TEST YOUR CODE</span>
                  <button onClick={handleRunCode} disabled={running} className="run-btn btn-animated">
                    {running ? 'Running…' : '▶ Run Code'}
                  </button>
                </div>
                <textarea
                  value={runStdin}
                  onChange={(e) => setRunStdin(e.target.value)}
                  placeholder="Custom input (stdin)..."
                  className="run-stdin-box"
                  spellCheck="false"
                  rows={2}
                />
                {runOutput && (
                  <div className="run-output-box">
                    {runOutput.ok ? (
                      <>
                        <div className={`run-status ${runOutput.success ? 'run-status-ok' : 'run-status-error'}`}>
                          {runOutput.status}
                        </div>
                        {runOutput.stdout && <pre className="run-output-stdout">{runOutput.stdout}</pre>}
                        {runOutput.stderr && <pre className="run-output-stderr">{runOutput.stderr}</pre>}
                      </>
                    ) : (
                      <div className="run-status run-status-error">{runOutput.error}</div>
                    )}
                  </div>
                )}
              </div>
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
