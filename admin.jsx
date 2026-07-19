import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './useTheme.js';
import { getUsers, saveUsers, getExams, saveExams, getResults } from './localData.js';
import { CODING_QUESTION_BANK } from './questionBank.js';
import { FiHome, FiBook, FiPlusCircle, FiCheckSquare, FiInbox, FiSun, FiMoon, FiLogOut } from 'react-icons/fi';

const emptyTestCase = () => ({ input: '', output: '' });

const emptyQuestion = () => ({
  type: 'mcq',
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correct: 'A',
  codingProblemStatement: '',
  sampleInput: '',
  sampleOutput: '',
  testCases: [emptyTestCase()],
  allowedLanguages: ['javascript', 'python', 'java']
});

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: <FiHome /> },
  { key: 'manageExams', label: 'Manage Exams', icon: <FiBook /> },
  { key: 'createExam', label: 'Create Exam', icon: <FiPlusCircle /> },
  { key: 'approvals', label: 'Approvals', icon: <FiCheckSquare /> },
  { key: 'submissions', label: 'Submissions', icon: <FiInbox /> }
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState({ totalExams: 0, approvedStudents: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [examTitle, setExamTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [bankPickerFor, setBankPickerFor] = useState(null); // question index currently picking from bank

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDashboardData = () => {
    const allExams = getExams();
    const allUsers = getUsers();
    const allResults = getResults();

    setExams(allExams);
    setStats({
      totalExams: allExams.length,
      approvedStudents: allUsers.filter((u) => u.role === 'student' && u.isApproved).length
    });
    setPendingStudents(allUsers.filter((u) => u.role === 'student' && !u.isApproved));
    setSubmissions(allResults);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApproveStudent = (studentId) => {
    const updated = getUsers().map((u) => (u.id === studentId ? { ...u, isApproved: true } : u));
    saveUsers(updated);
    loadDashboardData();
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (qIdx, tcIdx, field, value) => {
    const updated = [...questions];
    const testCases = [...(updated[qIdx].testCases || [])];
    testCases[tcIdx] = { ...testCases[tcIdx], [field]: value };
    updated[qIdx] = { ...updated[qIdx], testCases };
    setQuestions(updated);
  };

  const handleAddTestCase = (qIdx) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], testCases: [...(updated[qIdx].testCases || []), emptyTestCase()] };
    setQuestions(updated);
  };

  const handleRemoveTestCase = (qIdx, tcIdx) => {
    const updated = [...questions];
    const testCases = (updated[qIdx].testCases || []).filter((_, i) => i !== tcIdx);
    updated[qIdx] = { ...updated[qIdx], testCases: testCases.length ? testCases : [emptyTestCase()] };
    setQuestions(updated);
  };

  const handleImportFromBank = (qIdx, bankQuestion) => {
    const updated = [...questions];
    updated[qIdx] = {
      ...updated[qIdx],
      type: 'coding',
      text: bankQuestion.title,
      codingProblemStatement: bankQuestion.statement,
      sampleInput: bankQuestion.sampleInput,
      sampleOutput: bankQuestion.sampleOutput,
      testCases: bankQuestion.testCases.map((tc) => ({ ...tc }))
    };
    setQuestions(updated);
    setBankPickerFor(null);
  };

  const resetForm = () => {
    setExamTitle('');
    setStartDate('');
    setEndDate('');
    setQuestions([emptyQuestion()]);
    setEditingExamId(null);
    setMessage('');
    setError('');
  };

  const openCreateExam = () => {
    resetForm();
    setActiveTab('createExam');
  };

  const handleSubmitExam = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!examTitle.trim() || !startDate || !endDate) {
      setError('Please fill in the exam title and both dates.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after the start date.');
      return;
    }
    for (const q of questions) {
      if (q.type === 'coding') {
        const cases = q.testCases || [];
        if (cases.length === 0 || cases.every((tc) => !tc.input && !tc.output)) {
          setError(`"${q.text || 'A coding question'}" needs at least one test case with input and expected output.`);
          return;
        }
        const incomplete = cases.some((tc) => tc.input?.trim() && !tc.output?.trim());
        if (incomplete) {
          setError(`"${q.text || 'A coding question'}" has a test case with input but no expected output — every test case needs both, or students' code will auto-pass with blank output.`);
          return;
        }
      }
    }

    const allExams = getExams();

    if (editingExamId) {
      const updated = allExams.map((exam) =>
        exam._id === editingExamId
          ? { ...exam, title: examTitle, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), questions }
          : exam
      );
      saveExams(updated);
      setMessage('Exam updated successfully.');
    } else {
      const newExam = {
        _id: crypto.randomUUID(),
        title: examTitle,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        questions
      };
      saveExams([...allExams, newExam]);
      setMessage('Exam created successfully.');
    }

    resetForm();
    loadDashboardData();
    setActiveTab('manageExams');
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam._id);
    setExamTitle(exam.title);
    setStartDate(exam.startDate ? exam.startDate.slice(0, 16) : '');
    setEndDate(exam.endDate ? exam.endDate.slice(0, 16) : '');
    setQuestions(
      exam.questions && exam.questions.length
        ? exam.questions.map((q) => ({ testCases: [emptyTestCase()], sampleInput: '', sampleOutput: '', ...q }))
        : [emptyQuestion()]
    );
    setMessage('');
    setError('');
    setActiveTab('createExam');
  };

  const handleConfirmDelete = () => {
    if (!examToDelete) return;
    saveExams(getExams().filter((exam) => exam._id !== examToDelete));
    setExamToDelete(null);
    loadDashboardData();
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Loading admin dashboard...</div>;

  const attemptedCount = submissions.length;

  return (
    <div className="dash-container page-fade-in">
      <div className="dash-sidebar sidebar-fade-in">
        <div className="dash-sidebar-header">
          <h3><span className="dash-avatar">A</span> Admin Console</h3>
          <p>Manage exams &amp; students</p>
        </div>
        <div className="dash-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => (item.key === 'createExam' && !editingExamId ? openCreateExam() : setActiveTab(item.key))}
              className={`dash-nav-btn sidebar-item-animated ${activeTab === item.key ? 'active' : ''}`}
            >
              {item.icon} {item.label}
              {item.key === 'approvals' && pendingStudents.length > 0 && (
                <span className="nav-badge">{pendingStudents.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="dash-theme-row">
          <button onClick={toggleTheme} className="theme-toggle-btn btn-animated" style={{ width: '100%' }}>
            {theme === 'light' ? <><FiMoon /> Dark Mode</> : <><FiSun /> Light Mode</>}
          </button>
        </div>
        <button onClick={handleLogout} className="dash-logout-btn btn-animated"><FiLogOut /> Log Out</button>
      </div>

      <div className="dash-main">
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="dash-banner">
              <h1>Welcome back, Admin</h1>
              <p>Here's what's happening across your exam portal.</p>
            </div>
            <div className="dash-metrics-grid">
              <div className="dash-metric-card card-animated">
                <span className="dash-metric-label">TOTAL EXAMS</span>
                <div className="dash-metric-value">{stats.totalExams}</div>
              </div>
              <div className="dash-metric-card card-animated">
                <span className="dash-metric-label">APPROVED STUDENTS</span>
                <div className="dash-metric-value">{stats.approvedStudents}</div>
              </div>
              <div className="dash-metric-card card-animated">
                <span className="dash-metric-label">PENDING APPROVALS</span>
                <div className="dash-metric-value">{pendingStudents.length}</div>
              </div>
              <div className="dash-metric-card card-animated">
                <span className="dash-metric-label">SUBMISSIONS</span>
                <div className="dash-metric-value">{attemptedCount}</div>
              </div>
            </div>

            <div className="panel-card">
              <div className="pane-heading-row">
                <h3 className="pane-heading" style={{ margin: 0 }}>Your Exams</h3>
                <button onClick={openCreateExam} className="publish-btn btn-animated">+ Create Exam</button>
              </div>
              {exams.length === 0 ? (
                <div className="dash-empty-state">No exams created yet — click "+ Create Exam" to publish your first one.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Title</th><th>Questions</th><th>Closes</th><th></th></tr>
                  </thead>
                  <tbody>
                    {exams.slice(0, 5).map((exam) => (
                      <tr key={exam._id}>
                        <td>{exam.title}</td>
                        <td>{exam.questions?.length || 0}</td>
                        <td>{new Date(exam.endDate).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleEditExam(exam)} className="edit-btn btn-animated">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manageExams' && (
          <div className="dash-section-card card-animated">
            <div className="pane-heading-row">
              <h3 className="dash-section-title" style={{ margin: 0 }}><FiBook /> Manage Exams</h3>
              <button onClick={openCreateExam} className="publish-btn btn-animated">+ Create Exam</button>
            </div>
            {exams.length === 0 ? (
              <div className="dash-empty-state">No exams created yet — click "+ Create Exam" to publish your first one.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Questions</th>
                    <th>Closes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>{exam.title}</td>
                      <td>{exam.questions?.length || 0}</td>
                      <td>{new Date(exam.endDate).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handleEditExam(exam)} className="edit-btn btn-animated">Edit</button>
                        <button onClick={() => setExamToDelete(exam._id)} className="delete-btn btn-animated">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'createExam' && (
          <div className="panel-card">
            <h3 className="pane-heading">{editingExamId ? 'Edit Exam' : 'Create New Exam'}</h3>

            {message && <div className="alert-success">{message}</div>}
            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmitExam} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="field-group">
                <label className="field-label">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures Midterm"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  className="text-input input-animated"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="field-group">
                  <label className="field-label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="text-input input-animated"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="text-input input-animated"
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>Questions ({questions.length})</h4>
                  <button type="button" onClick={handleAddQuestion} className="add-question-btn btn-animated">
                    + Add Question
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <div className="question-card-header">
                      <span className="question-number">Question {idx + 1}</span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => handleRemoveQuestion(idx)} className="remove-question-btn">
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div className="dropdown-row">
                        <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.7 }}>Question Type:</span>
                        <select
                          value={q.type}
                          onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                          className="select-input"
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="coding">Coding</option>
                        </select>
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Question Text</label>
                      <textarea
                        rows={2}
                        placeholder="Enter the question or coding problem statement..."
                        value={q.text}
                        onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                        className="textarea-input input-animated"
                      />
                    </div>

                    {q.type === 'mcq' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text)', opacity: 0.7, fontWeight: 'bold' }}>Answer Options:</span>
                        <div className="options-grid">
                          <input type="text" placeholder="Option A" value={q.optionA} onChange={e => handleQuestionChange(idx, 'optionA', e.target.value)} className="mini-input input-animated" />
                          <input type="text" placeholder="Option B" value={q.optionB} onChange={e => handleQuestionChange(idx, 'optionB', e.target.value)} className="mini-input input-animated" />
                          <input type="text" placeholder="Option C" value={q.optionC} onChange={e => handleQuestionChange(idx, 'optionC', e.target.value)} className="mini-input input-animated" />
                          <input type="text" placeholder="Option D" value={q.optionD} onChange={e => handleQuestionChange(idx, 'optionD', e.target.value)} className="mini-input input-animated" />
                        </div>
                        <div className="dropdown-row" style={{ marginTop: '5px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.7 }}>Correct Answer:</span>
                          <select value={q.correct} onChange={e => handleQuestionChange(idx, 'correct', e.target.value)} className="select-input">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="coding-builder">
                        <div className="coding-builder-toolbar">
                          <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.7 }}>
                            Students get a code editor + compiler for this question.
                          </span>
                          <button type="button" onClick={() => setBankPickerFor(idx)} className="bank-import-btn btn-animated">
                            📚 Import from Question Bank
                          </button>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Coding Problem Statement</label>
                          <textarea
                            rows={3}
                            placeholder="Describe the coding problem in detail..."
                            value={q.codingProblemStatement}
                            onChange={e => handleQuestionChange(idx, 'codingProblemStatement', e.target.value)}
                            className="textarea-input input-animated"
                          />
                        </div>

                        <div className="options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          <div className="field-group">
                            <label className="field-label">Sample Input <span className="field-hint">(shown to students)</span></label>
                            <textarea
                              rows={2}
                              placeholder="e.g., 3 5"
                              value={q.sampleInput}
                              onChange={e => handleQuestionChange(idx, 'sampleInput', e.target.value)}
                              className="textarea-input input-animated mono-input"
                            />
                          </div>
                          <div className="field-group">
                            <label className="field-label">Sample Output <span className="field-hint">(shown to students)</span></label>
                            <textarea
                              rows={2}
                              placeholder="e.g., 8"
                              value={q.sampleOutput}
                              onChange={e => handleQuestionChange(idx, 'sampleOutput', e.target.value)}
                              className="textarea-input input-animated mono-input"
                            />
                          </div>
                        </div>

                        <div className="testcase-section">
                          <div className="testcase-section-header">
                            <span className="field-label" style={{ margin: 0 }}>
                              Test Cases <span className="field-hint">(hidden from students — used for grading)</span>
                            </span>
                            <button type="button" onClick={() => handleAddTestCase(idx)} className="add-question-btn btn-animated">
                              + Add Test Case
                            </button>
                          </div>

                          {(q.testCases || []).map((tc, tcIdx) => (
                            <div key={tcIdx} className="testcase-row">
                              <span className="testcase-index">#{tcIdx + 1}</span>
                              <textarea
                                rows={1}
                                placeholder="Input"
                                value={tc.input}
                                onChange={e => handleTestCaseChange(idx, tcIdx, 'input', e.target.value)}
                                className="mini-input input-animated mono-input"
                              />
                              <textarea
                                rows={1}
                                placeholder="Expected Output"
                                value={tc.output}
                                onChange={e => handleTestCaseChange(idx, tcIdx, 'output', e.target.value)}
                                className="mini-input input-animated mono-input"
                              />
                              {(q.testCases || []).length > 1 && (
                                <button type="button" onClick={() => handleRemoveTestCase(idx, tcIdx)} className="testcase-remove-btn">✕</button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="dropdown-row" style={{ marginTop: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.7 }}>Allowed Languages:</span>
                          {['javascript', 'python', 'java', 'cpp', 'c'].map((lang) => (
                            <label key={lang} className="lang-checkbox">
                              <input
                                type="checkbox"
                                checked={(q.allowedLanguages || []).includes(lang)}
                                onChange={(e) => {
                                  const current = q.allowedLanguages || [];
                                  const updatedLangs = e.target.checked
                                    ? [...current, lang]
                                    : current.filter((l) => l !== lang);
                                  handleQuestionChange(idx, 'allowedLanguages', updatedLangs.length ? updatedLangs : current);
                                }}
                              />
                              {lang.toUpperCase()}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit" className="publish-btn btn-animated">
                  {editingExamId ? 'Save Changes' : 'Publish Exam'}
                </button>
                <button type="button" onClick={() => { resetForm(); setActiveTab('manageExams'); }} className="cancel-btn btn-animated">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="dash-section-card card-animated">
            <h3 className="dash-section-title"><FiCheckSquare /> Pending Student Approvals</h3>
            {pendingStudents.length === 0 ? (
              <div className="dash-empty-state">No students awaiting approval.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingStudents.map((student) => (
                  <div key={student.id} className="list-row">
                    <div style={{ overflow: 'hidden', paddingRight: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{student.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', opacity: 0.7 }}>{student.email}</div>
                    </div>
                    <button onClick={() => handleApproveStudent(student.id)} className="approve-btn btn-animated">
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="dash-section-card card-animated">
            <h3 className="dash-section-title"><FiInbox /> Recent Submissions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {submissions.length === 0 ? (
                <div className="dash-empty-state">No submissions yet.</div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="list-row">
                    <div style={{ overflow: 'hidden', paddingRight: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{sub.examTitle || 'Exam Attempt'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', opacity: 0.7 }}>{sub.studentEmail || 'Unknown student'}</div>
                    </div>
                    <span className="score-badge">{sub.score}/{sub.totalQuestions}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {bankPickerFor !== null && (
        <div className="modal-overlay">
          <div className="modal-box bank-modal">
            <h4 style={{ margin: '0 0 4px 0' }}>📚 Import a Coding Question</h4>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text)', opacity: 0.7, fontSize: '13px' }}>
              Pick a ready-made problem — statement, sample I/O, and test cases fill in automatically. You can still edit anything after importing.
            </p>
            <div className="bank-list">
              {CODING_QUESTION_BANK.map((bq) => (
                <button
                  key={bq.id}
                  type="button"
                  className="bank-card btn-animated"
                  onClick={() => handleImportFromBank(bankPickerFor, bq)}
                >
                  <div className="bank-card-top">
                    <span className="bank-card-title">{bq.title}</span>
                    <span className={`bank-difficulty bank-difficulty-${bq.difficulty.toLowerCase()}`}>{bq.difficulty}</span>
                  </div>
                  <p className="bank-card-statement">{bq.statement}</p>
                  <div className="bank-card-tags">
                    {bq.tags.map((t) => <span key={t} className="bank-tag">{t}</span>)}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setBankPickerFor(null)} className="cancel-btn btn-animated">Close</button>
            </div>
          </div>
        </div>
      )}

      {examToDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4 style={{ margin: '0 0 12px 0' }}>Delete this exam?</h4>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text)', opacity: 0.7, fontSize: '14px' }}>
              This can't be undone. Students will no longer see this exam.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setExamToDelete(null)} className="cancel-btn btn-animated">Cancel</button>
              <button onClick={handleConfirmDelete} className="delete-btn btn-animated">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
