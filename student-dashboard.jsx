import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './useTheme.js';
import { getExams, getResults, hasAttempted } from './localData.js';
import StudyNotes from './StudyNotes.jsx';
import { FiHome, FiEdit3, FiBarChart2, FiBookOpen, FiSun, FiMoon, FiLogOut, FiClock, FiFlag, FiCheckCircle, FiLock, FiXCircle, FiEye } from 'react-icons/fi';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Home');
  const [examsList, setExamsList] = useState([]);
  const [results, setResults] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedResultId, setExpandedResultId] = useState(null);

  const studentEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setExamsList(getExams());
    setResults(getResults().filter((r) => r.studentEmail === studentEmail));
  }, [studentEmail]);

  const toggleResultExpansion = (id) => {
    setExpandedResultId(expandedResultId === id ? null : id);
  };

  const handleLogout = () => {
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  navigate('/');
};

  const handleLaunchExam = (examId) => {
    if (hasAttempted(examId, studentEmail)) {
      alert('You have already submitted this exam. Each exam can only be attempted once.');
      return;
    }
    navigate(`/take-exam/${examId}`);
  };

  const handleViewExamDetails = (examId) => {
    navigate(`/exams/${examId}`);
  };

  return (
    <div className="dash-container page-fade-in">
      <div className="dash-sidebar sidebar-fade-in">
        <div className="dash-sidebar-header">
          <h3><span className="dash-avatar">{(studentEmail || 'S').charAt(0).toUpperCase()}</span> Student Hub</h3>
          <p>{studentEmail}</p>
        </div>
        <div className="dash-nav">
          <button onClick={() => setActiveTab('Home')} className={`dash-nav-btn sidebar-item-animated ${activeTab === 'Home' ? 'active' : ''}`}><FiHome /> Home</button>
          <button onClick={() => setActiveTab('Exams')} className={`dash-nav-btn sidebar-item-animated ${activeTab === 'Exams' ? 'active' : ''}`}><FiEdit3 /> Available Exams</button>
          <button onClick={() => setActiveTab('Results')} className={`dash-nav-btn sidebar-item-animated ${activeTab === 'Results' ? 'active' : ''}`}><FiBarChart2 /> My Results</button>
          <button onClick={() => setActiveTab('Notes')} className={`dash-nav-btn sidebar-item-animated ${activeTab === 'Notes' ? 'active' : ''}`}><FiBookOpen /> Study Notes</button>
        </div>
        <div className="dash-theme-row">
          <button onClick={toggleTheme} className="theme-toggle-btn btn-animated" style={{ width: '100%' }}>
            {theme === 'light' ? <><FiMoon /> Dark Mode</> : <><FiSun /> Light Mode</>}
          </button>
        </div>
        <button onClick={handleLogout} className="dash-logout-btn btn-animated"><FiLogOut /> Log Out</button>
      </div>

      <div className="dash-main">
        {activeTab === 'Home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="dash-banner">
              <h1>Welcome Back!</h1>
              <p>Current time: {currentTime.toLocaleTimeString()}</p>
            </div>
            <div className="dash-metrics-grid">
              <div className="dash-metric-card card-animated">
                <span className="dash-metric-label">AVAILABLE EXAMS</span>
                <div className="dash-metric-value">{examsList.length}</div>
              </div>
              <div className="dash-metric-card card-animated">
                <span className="dash-metric-label">COMPLETED EXAMS</span>
                <div className="dash-metric-value">{results.length}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Exams' && (
          <div className="dash-section-card card-animated">
            <h3 className="dash-section-title"><FiEdit3 /> Available Exams</h3>
            <div className="dash-list">
              {examsList.length === 0 ? (
                <div className="dash-empty-state">No exams have been published yet.</div>
              ) : (
                examsList.map((exam) => {
                  const start = new Date(exam.startDate);
                  const end = new Date(exam.endDate);
                  const isUpcoming = currentTime < start;
                  const isExpired = currentTime > end;
                  const isOpen = !isUpcoming && !isExpired;
                  const attempted = hasAttempted(exam._id, studentEmail);

                  return (
                    <div key={exam._id} className="dash-item-card card-animated">
                      <div>
                        <h4 className="dash-item-title">{exam.title}</h4>
                        <div className="dash-item-meta">
                          <span><FiClock /> Starts: {start.toLocaleString()}</span>
                          <span><FiFlag /> Ends: {end.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="dash-item-actions">
                        <button onClick={() => handleViewExamDetails(exam._id)} className="dash-btn-view btn-animated"><FiEye /> View</button>
                        {attempted ? (
                          <span className="dash-badge-attempted"><FiCheckCircle /> Attempted</span>
                        ) : isOpen ? (
                          <button onClick={() => handleLaunchExam(exam._id)} className="dash-btn-start btn-animated">Start Exam ➔</button>
                        ) : isUpcoming ? (
                          <span className="dash-badge-locked"><FiLock /> Locked</span>
                        ) : (
                          <span className="dash-badge-expired"><FiXCircle /> Expired</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'Results' && (
          <div className="dash-section-card card-animated">
            <h3 className="dash-section-title"><FiBarChart2 /> My Results</h3>
            <div className="dash-list">
              {results.length === 0 ? (
                <div className="dash-empty-state">You haven't submitted any exams yet.</div>
              ) : (
                results.map((res) => {
                  const isExpanded = expandedResultId === res.id;
                  return (
                    <div key={res.id} className="dash-result-card card-animated">
                      <div className="dash-result-header">
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{res.examTitle || 'Exam Submission'}</h4>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(res.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>{res.score}/{res.totalQuestions}</span>
                          <button onClick={() => toggleResultExpansion(res.id)} className="dash-result-expand-btn btn-animated">
                            {isExpanded ? 'Hide ▲' : 'View Details ▼'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="dash-result-details">
                          <h5 style={{ margin: '0 0 5px 0', color: '#334155' }}>Your Answers:</h5>
                          {res.studentAnswers && Object.keys(res.studentAnswers).map((key) => {
                            const ans = res.studentAnswers[key];
                            return (
                              <div key={key} style={{ fontSize: '13px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                <strong>Question {parseInt(key) + 1}: </strong>
                                {typeof ans === 'object' ? (
                                  <div style={{ marginTop: '4px' }}>
                                    <span className="dash-answer-lang-tag">{ans.lang?.toUpperCase()}</span>
                                    {ans.totalCases !== undefined && (
                                      <span className={`dash-testcase-summary ${ans.passedCount === ans.totalCases && ans.totalCases > 0 ? 'pass' : 'partial'}`}>
                                        {ans.passedCount}/{ans.totalCases} test cases passed
                                      </span>
                                    )}
                                    <pre className="dash-answer-code">{ans.code}</pre>
                                    {ans.testCaseResults && ans.testCaseResults.length > 0 && (
                                      <div className="dash-testcase-list">
                                        {ans.testCaseResults.map((tc, i) => (
                                          <div key={i} className={`dash-testcase-chip ${tc.skipped ? 'skip' : tc.passed ? 'pass' : 'fail'}`}>
                                            #{i + 1} {tc.skipped ? '⚠ skipped' : tc.passed ? '✔ passed' : '✘ failed'}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#475569', fontWeight: '600' }}>Selected: {ans}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'Notes' && <StudyNotes studentEmail={studentEmail} />}
      </div>
    </div>
  );
};

export default StudentDashboard;
