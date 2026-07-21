import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getExam, checkAttempted } from './apiClient.js';

const ExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studentEmail = localStorage.getItem('userEmail') || '';

  const [exam, setExam] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const [found, isAttempted] = await Promise.all([getExam(id), checkAttempted(id, studentEmail)]);
        if (!cancelled) {
          setExam(found);
          setAttempted(isAttempted);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Exam not found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading exam details...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="center-screen">
        <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '16px' }}>{error || 'Exam not found.'}</p>
        <button onClick={() => navigate('/dashboard')} className="dash-btn-view btn-animated">← Back to Dashboard</button>
      </div>
    );
  }

  const start = exam.startDate ? new Date(exam.startDate) : null;
  const end = exam.endDate ? new Date(exam.endDate) : null;
  const now = new Date();
  const status = start && end ? (now < start ? 'Upcoming' : now > end ? 'Closed' : 'Open') : 'Unscheduled';
  const badgeClass = status === 'Open' ? 'details-badge-open' : status === 'Upcoming' ? 'details-badge-upcoming' : 'details-badge-closed';

  return (
    <div className="details-page">
      <div className="details-card">
        <Link to="/dashboard" className="details-back-link">← Back to Dashboard</Link>

        <h1 className="details-title">{exam.title}</h1>
        <span className={`details-badge ${badgeClass}`}>{status}</span>

        <div className="details-grid">
          <div className="details-item">
            <span className="details-label">Exam ID</span>
            <span className="details-value">{exam._id}</span>
          </div>
          <div className="details-item">
            <span className="details-label">Total Questions</span>
            <span className="details-value">{exam.questions?.length ?? 0}</span>
          </div>
          {start && (
            <div className="details-item">
              <span className="details-label">Opens</span>
              <span className="details-value">{start.toLocaleString()}</span>
            </div>
          )}
          {end && (
            <div className="details-item">
              <span className="details-label">Closes</span>
              <span className="details-value">{end.toLocaleString()}</span>
            </div>
          )}
        </div>

        {attempted ? (
          <span className="dash-badge-attempted" style={{ marginTop: '10px', display: 'inline-block' }}>✅ Already Attempted — Exams can only be taken once</span>
        ) : status === 'Open' && (
          <button onClick={() => navigate(`/take-exam/${exam._id}`)} className="details-start-btn btn-animated">
            Start Exam →
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamDetails;
