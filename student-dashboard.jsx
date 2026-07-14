import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home'); 
  const [examsList, setExamsList] = useState([]); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedResultId, setExpandedResultId] = useState(null);
  
  const studentEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/student/exams').then(res => res.json()).catch(() => []), 
      fetch(`/api/student/results?email=${studentEmail}`).then(res => res.json()).catch(() => [])
    ])
    .then(([examsData, resultsData]) => {
      setExamsList(Array.isArray(examsData) ? examsData : []);
      setResults(Array.isArray(resultsData) ? resultsData : []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to sync structural dashboard data:", err);
      setLoading(false);
    });
  }, [studentEmail]);

  const toggleResultExpansion = (id) => {
    setExpandedResultId(expandedResultId === id ? null : id);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleLaunchExamProcedure = (examId) => {
    if (!examId) {
      alert("⚠️ Error: Exam mapping signature is corrupted or blank.");
      return;
    }

    fetch(`/api/student/check-attempt?email=${studentEmail}&examId=${examId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.allowed === false) {
          alert(data.error || "🔒 Access Blocked: You have already submitted this exam sheet.");
        } else {
          navigate(`/take-exam/${examId}`);
        }
      })
      .catch(() => {
        navigate(`/take-exam/${examId}`);
      });
  };

  const handleViewExamDetails = (examId) => {
    navigate(`/exams/${examId}`);
  };

  if (loading) return <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', color: '#475569' }}>🔄 Fetching Profile Metrics Panels...</div>;

  return (
    <div style={styles.dashboardContainer} className="page-fade-in">
      {/* Sidebar command ribbon */}
      <div style={styles.sidebarPanel} className="sidebar-fade-in">
        <div style={{ padding: '25px 20px' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 'bold' }}>🎓 Student Hub</h3>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{studentEmail}</p>
        </div>
        <div style={styles.navigationMenuOptions}>
          <button onClick={() => setActiveTab('Home')} style={{ ...styles.menuBtn, backgroundColor: activeTab === 'Home' ? '#1e293b' : 'transparent', color: activeTab === 'Home' ? '#3b82f6' : '#94a3b8' }} className="sidebar-item-animated">🏠 Central Hub</button>
          <button onClick={() => setActiveTab('Exams')} style={{ ...styles.menuBtn, backgroundColor: activeTab === 'Exams' ? '#1e293b' : 'transparent', color: activeTab === 'Exams' ? '#3b82f6' : '#94a3b8' }} className="sidebar-item-animated">✍️ Available Slots</button>
          <button onClick={() => setActiveTab('Results')} style={{ ...styles.menuBtn, backgroundColor: activeTab === 'Results' ? '#1e293b' : 'transparent', color: activeTab === 'Results' ? '#3b82f6' : '#94a3b8' }} className="sidebar-item-animated">📊 Performance Review</button>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtnRow} className="btn-animated">🚪 Log Out Profile</button>
      </div>

      {/* Main Container Viewport Panel */}
      <div style={styles.mainViewportWorkspace}>
        {activeTab === 'Home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={styles.welcomeBannerCard}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>Welcome Back, Student!</h1>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '14px' }}>System Time: {currentTime.toLocaleTimeString()} | Review your pending challenges or track graded logs via the control console.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={styles.miniMetricWidgetBox} className="card-animated">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>AVAILABLE ASSIGNMENT WINDOWS</span>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '5px' }}>{examsList.length} Active Slots</div>
              </div>
              <div style={styles.miniMetricWidgetBox} className="card-animated">
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>COMPLETED EVALUATION PACKETS</span>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '5px' }}>{results.length} Submitted</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Exams' && (
          <div style={styles.sectionAreaCard} className="card-animated">
            <h3 style={styles.sectionCardTitle}>✍️ Live Scheduled Test Slots</h3>
            <div style={styles.list}>
              {examsList.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No assessment blocks have been declared by system supervisors.</div>
              ) : (
                examsList.map((exam) => {
                  const start = new Date(exam.startDate);
                  const end = new Date(exam.endDate);
                  const isUpcoming = currentTime < start;
                  const isExpired = currentTime > end;
                  const isOpen = !isUpcoming && !isExpired;

                  return (
                    <div key={exam._id} style={styles.itemCard} className="card-animated">
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px' }}>{exam.title}</h4>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '15px' }}>
                          <span>⏱️ Starts: {start.toLocaleString()}</span>
                          <span>🛑 Ends: {end.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleViewExamDetails(exam._id)} style={{ ...styles.startBtn, backgroundColor: '#64748b' }} className="btn-animated">
                          📋 View Rules
                        </button>
                        {isOpen && (
                          <button onClick={() => handleLaunchExamProcedure(exam._id)} style={styles.startBtn} className="btn-animated">
                            Start Assessment ➔
                          </button>
                        )}
                        {isUpcoming && <span style={{ padding: '10px 14px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>🔒 Locked</span>}
                        {isExpired && <span style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>🛑 Expired</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'Results' && (
          <div style={styles.sectionAreaCard} className="card-animated">
            <h3 style={styles.sectionCardTitle}>📊 Performance Evaluation Matrix Logs</h3>
            <div style={styles.list}>
              {results.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No archived scoring matrices cataloged for this identity layer.</div>
              ) : (
                results.map((res) => {
                  const totalQ = res.examId?.questions?.length || 0;
                  const isExpanded = expandedResultId === res._id;

                  return (
                    <div key={res._id} style={{ ...styles.itemCard, flexDirection: 'column', alignItems: 'stretch', gap: '15px' }} className="card-animated">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '15px' }}>{res.examTitle || 'Exam Submission'}</h4>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID Reference ID: {res.examId?._id || res.examId}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>
                            Score metrics synced ({totalQ} items analyzed)
                          </span>
                          <button onClick={() => toggleResultExpansion(res._id)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }} className="btn-animated">
                            {isExpanded ? 'Collapse Details ▲' : 'Expand Submissions ▼'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                          <h5 style={{ margin: '0 0 5px 0', color: '#334155' }}>Student Answers Array Logs:</h5>
                          {res.studentAnswers && Object.keys(res.studentAnswers).map((key) => {
                            const ans = res.studentAnswers[key];
                            return (
                              <div key={key} style={{ fontSize: '13px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                <strong>Item #{parseInt(key) + 1}: </strong>
                                {typeof ans === 'object' ? (
                                  <div style={{ marginTop: '4px' }}>
                                    <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginRight: '5px' }}>
                                      {ans.lang?.toUpperCase()}
                                    </span>
                                    <pre style={{ margin: '5px 0 0 0', backgroundColor: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '4px', overflowX: 'auto', fontFamily: 'monospace' }}>{ans.code}</pre>
                                  </div>
                                ) : (
                                  <span style={{ color: '#475569', fontWeight: '600' }}>Selected Option Choice Option: [ {ans} ]</span>
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
      </div>
    </div>
  );
};

const styles = {
  dashboardContainer: { display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  sidebarPanel: { width: '260px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  navigationMenuOptions: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 10px' },
  menuBtn: { border: 'none', padding: '13px 15px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', fontWeight: '600', outline: 'none' },
  logoutBtnRow: { margin: '20px', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', outline: 'none', textAlign: 'center' },
  mainViewportWorkspace: { flex: 1, padding: '40px', overflowY: 'auto' },
  welcomeBannerCard: { backgroundColor: '#3b82f6', color: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(59,130,246,0.15)' },
  miniMetricWidgetBox: { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  sectionAreaCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  sectionCardTitle: { fontSize: '18px', margin: '0 0 20px 0', color: '#0f172a', fontWeight: '700' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  itemCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' },
  startBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', outline: 'none' }
};

export default StudentDashboard;
