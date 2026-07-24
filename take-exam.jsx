import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, checkAttempted, submitResult } from './apiClient.js';
import { runTestCases, getStarterCode, LANGUAGE_LABELS } from './codeRunner.js';

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
  const [testRunResults, setTestRunResults] = useState(null); // { results, apiFailed } from clicking Run
  const [runningTests, setRunningTests] = useState(false);
  const [result, setResult] = useState(null); // holds the final graded result once submitted

  const [examStarted, setExamStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [violationNotice, setViolationNotice] = useState('');
  const [copyBlockedNotice, setCopyBlockedNotice] = useState(false);
  const MAX_VIOLATIONS = 3;

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
    if (!examStarted || timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result, examStarted]);

  useEffect(() => {
    if (questions[currentIdx]?.type === 'coding') {
      const existing = answers[currentIdx];
      const lang = existing?.lang || questions[currentIdx]?.allowedLanguages?.[0] || 'javascript';
      setLocalCode(existing?.code !== undefined ? existing.code : getStarterCode(lang));
      setTestRunResults(null);
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

  const handleRun = async () => {
    const testCases = questions[currentIdx]?.testCases || [];
    if (testCases.length === 0) return;
    setRunningTests(true);
    setTestRunResults(null);
    const outcome = await runTestCases(currentLang(), localCode, testCases);
    setTestRunResults(outcome);
    setRunningTests(false);
  };

  // Auto-close (), [], {} as the student types, skip over an
  // auto-inserted closing character instead of duplicating it, and delete
  // both characters of an empty pair on backspace — standard code-editor
  // bracket behavior.
  const BRACKET_PAIRS = { '(': ')', '[': ']', '{': '}' };
  const CLOSE_CHARS = new Set(Object.values(BRACKET_PAIRS));

  const handleEditorKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = localCode;

    if (BRACKET_PAIRS[e.key]) {
      e.preventDefault();
      const closeChar = BRACKET_PAIRS[e.key];
      const selected = value.slice(start, end);
      const newValue = value.slice(0, start) + e.key + selected + closeChar + value.slice(end);
      handleLocalCodeChange(newValue);
      requestAnimationFrame(() => {
        const pos = start + 1 + selected.length;
        textarea.selectionStart = textarea.selectionEnd = pos;
      });
      return;
    }

    if (CLOSE_CHARS.has(e.key) && start === end && value[start] === e.key) {
      e.preventDefault();
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
      return;
    }

    if (e.key === 'Backspace' && start === end && start > 0) {
      const charBefore = value[start - 1];
      const charAfter = value[start];
      if (BRACKET_PAIRS[charBefore] === charAfter) {
        e.preventDefault();
        const newValue = value.slice(0, start - 1) + value.slice(start + 1);
        handleLocalCodeChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        });
      }
    }
  };

  const gradeAndSave = async () => {
    let score = 0;
    const finalAnswers = {};

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const answer = answers[idx];
      const questionMarks = q.marks ?? 1; // older exams saved before per-question marks default to 1

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
        const questionScore = testCases.length ? (passedCount / testCases.length) * questionMarks : 0;
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
        if (answer === q.correct) score += questionMarks;
      }
    }

    setGradingMessage('');

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);

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

  // Requesting fullscreen only works as a direct response to a user click
  // (browsers reject it if called automatically on page load), so this runs
  // from the "Start Exam" button rather than in a useEffect on mount. The
  // countdown timer is also started here, from the exam's fixed
  // durationMinutes — every student gets the same number of minutes
  // regardless of when in the start/end window they actually begin.
  const handleStartExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Some browsers/devices don't support fullscreen (or the user's
      // security settings block it) — proceed anyway rather than blocking
      // the student from taking the exam at all.
    }
    const minutes = exam?.durationMinutes ?? 60; // older exams saved before this field existed default to 60
    setTimeLeft(minutes * 60);
    setExamStarted(true);
  };

  const registerViolation = (reason) => {
    setViolations((prev) => {
      const next = prev + 1;
      if (next >= MAX_VIOLATIONS) {
        setViolationNotice(`${reason} This was your final warning — your exam is being auto-submitted now.`);
        handleAutoSubmit();
      } else {
        setViolationNotice(`${reason} Warning ${next} of ${MAX_VIOLATIONS - 1} — your exam will be auto-submitted if this happens once more.`);
      }
      return next;
    });
  };

  // Tab-switch / minimize detection.
  useEffect(() => {
    if (!examStarted || result || submitting) return;

    let lastViolationAt = 0;
    const guardedViolation = (reason) => {
      const now = Date.now();
      if (now - lastViolationAt < 1500) return; // avoid double-counting one switch (blur + visibilitychange firing together)
      lastViolationAt = now;
      registerViolation(reason);
    };

    const onVisibilityChange = () => {
      if (document.hidden) guardedViolation('You switched away from the exam tab.');
    };
    const onBlur = () => {
      guardedViolation('You switched away from the exam window.');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, result, submitting]);

  // Exiting fullscreen (e.g. pressing Esc) counts as a violation too.
  useEffect(() => {
    if (!examStarted || result || submitting) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        registerViolation('You exited fullscreen mode.');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, result, submitting]);

  // Blocks copying the question out (e.g. to paste into an AI tool) and
  // pasting content in (e.g. pasting pre-written code). Applied at the
  // top-level wrapper so it covers the whole exam screen.
  const handleBlockClipboard = (e) => {
    e.preventDefault();
    setCopyBlockedNotice(true);
    setTimeout(() => setCopyBlockedNotice(false), 2000);
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

  if (!examStarted) {
    return (
      <div className="exam-fallback-screen" style={{ flexDirection: 'column', gap: '16px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
        <span style={{ fontSize: '40px' }}>🖥️</span>
        <h2 style={{ margin: 0 }}>{exam?.title}</h2>
        <div className="dash-badge-locked" style={{ display: 'inline-block' }}>
          ⏱️ You will get {exam?.durationMinutes ?? 60} minutes once you start
        </div>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          This exam runs in fullscreen. Once you start, switching tabs, minimizing the window,
          or exiting fullscreen will count as a violation — after {MAX_VIOLATIONS} violations
          your exam is auto-submitted. Copying the question or pasting code is also disabled.
        </p>
        <button onClick={handleStartExam} className="publish-btn btn-animated">🚀 Start Exam in Fullscreen</button>
      </div>
    );
  }

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

          <button onClick={() => navigate('/dashboard', { state: { tab: 'Results' } })} className="publish-btn btn-animated" style={{ marginTop: '20px' }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  return (
    <div
      className="exam-wrapper"
      onPaste={handleBlockClipboard}
      onContextMenu={handleBlockClipboard}
    >
      {violationNotice && (
        <div className="alert-error" style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '90vw', textAlign: 'center' }}>
          ⚠️ {violationNotice}
        </div>
      )}
      {copyBlockedNotice && (
        <div className="alert-error" style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          📋 Copy/paste is disabled during this exam.
        </div>
      )}
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
              <span className="exam-question-badge">QUESTION {currentIdx + 1} OF {totalQuestions} (CODING) — {currentQuestion.marks ?? 1} MARKS</span>
              <p
                style={{ color: '#e2e8f0', fontSize: '16px', lineHeight: 1.7, margin: 0, userSelect: 'none' }}
                onCopy={handleBlockClipboard}
                onCut={handleBlockClipboard}
              >{currentQuestion.codingProblemStatement || currentQuestion.text}</p>

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
                onKeyDown={handleEditorKeyDown}
                placeholder="// Write your code here..."
                className="exam-code-editor"
                spellCheck="false"
              />

              <div className="run-panel">
                <div className="run-panel-header">
                  <span className="exam-timer-label">▶️ TEST YOUR CODE</span>
                  {(currentQuestion.testCases || []).length > 0 && (
                    <button onClick={handleRun} disabled={runningTests} className="run-btn btn-animated">
                      {runningTests ? 'Running…' : '▶ Run'}
                    </button>
                  )}
                </div>

                {testRunResults && (
                  <div className="run-output-box">
                    {testRunResults.apiFailed && (
                      <div className="run-status run-status-error">Some test cases couldn't be checked — connection issue with the code runner.</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: testRunResults.apiFailed ? '8px' : 0 }}>
                      {testRunResults.results.map((r, i) => (
                        <div key={i} style={{ padding: '8px 10px', borderRadius: '6px', background: r.skipped ? 'rgba(148,163,184,0.15)' : r.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                            <span>Test Case {i + 1}</span>
                            <span>{r.skipped ? '⚠️' : r.passed ? '✅' : '❌'}</span>
                          </div>
                          {!r.passed && !r.skipped && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {r.stderr
                                ? <span>Error: {r.stderr}</span>
                                : <span>Expected "{r.expected}" but got "{r.actual}"</span>}
                            </div>
                          )}
                          {r.skipped && r.error && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#cbd5e1' }}>{r.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="exam-mcq-wrapper">
            <div className="exam-mcq-card">
              <span className="exam-question-badge">QUESTION {currentIdx + 1} OF {totalQuestions} — {currentQuestion?.marks ?? 1} MARKS</span>
              <p className="exam-question-text" style={{ userSelect: 'none' }} onCopy={handleBlockClipboard} onCut={handleBlockClipboard}>{currentQuestion?.text}</p>
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
