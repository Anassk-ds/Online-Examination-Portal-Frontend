import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    fetch(`/api/exams/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch exam details.');
        return res.json();
      })
      .then((data) => {
        setExam(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Something went wrong. Please try again later.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.spinner} />
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading exam details...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div style={styles.centerScreen}>
        <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '16px' }}>
          {error || 'Exam not found.'}
        </p>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const start = exam.startDate ? new Date(exam.startDate) : null;
  const end = exam.endDate ? new Date(exam.endDate) : null;
  const now = new Date();
  const status = start && end
    ? (now < start ? 'Upcoming' : now > end ? 'Closed' : 'Open')
    : 'Unscheduled';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/dashboard" style={styles.backLink}>← Back to Dashboard</Link>

        <h1 style={styles.title}>{exam.title}</h1>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: status === 'Open' ? '#dcfce7' : status === 'Upcoming' ? '#fef3c7' : '#fee2e2',
          color: status === 'Open' ? '#16a34a' : status === 'Upcoming' ? '#d97706' : '#dc2626'
        }}>
          {status}
        </span>

        <div style={styles.detailGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Exam ID</span>
            <span style={styles.detailValue}>{exam._id}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Duration</span>
            <span style={styles.detailValue}>{exam.duration} minutes</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Total Questions</span>
            <span style={styles.detailValue}>{exam.questions?.length ?? 0}</span>
          </div>
          {start && (
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Opens</span>
              <span style={styles.detailValue}>{start.toLocaleString()}</span>
            </div>
          )}
          {end && (
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Closes</span>
              <span style={styles.detailValue}>{end.toLocaleString()}</span>
            </div>
          )}
        </div>

        {status === 'Open' && (
          <button onClick={() => navigate(`/take-exam/${exam._id}`)} style={styles.startBtn}>
            Start Test →
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { display: 'flex', justifyContent: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' },
  card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '35px', width: '100%', maxWidth: '600px' },
  backLink: { fontSize: '13px', color: '#2563eb', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' },
  title: { margin: '0 0 10px 0', fontSize: '24px', color: '#0f172a' },
  statusBadge: { display: 'inline-block', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '25px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '30px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  detailValue: { fontSize: '14px', color: '#1e293b', fontWeight: '600', wordBreak: 'break-all' },
  startBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '14px' },
  backBtn: { backgroundColor: '#4b5563', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' },
  centerScreen: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' },
  spinner: { width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }
};

export default ExamDetails;

