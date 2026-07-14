import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IndexPortal = () => {
  const navigate = useNavigate();
  // Student States
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [isStudentRegister, setIsStudentRegister] = useState(false);

  // Admin States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [masterAdminEmail, setMasterAdminEmail] = useState(''); // Strict Verification Requirement
  const [isAdminRegister, setIsAdminRegister] = useState(false);

  // UI Status Alerts
  const [error, setError] = useState('');
  const scrollContainerRef = useRef(null);

  // Smooth Scroll Controller
  const scrollToPanel = (panelIndex) => {
    setError('');
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: panelIndex * scrollContainerRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  // Auth Handler
  const handleAuth = (e, type, isRegister) => {
    e.preventDefault();
    setError('');

    const email = type === 'admin' ? adminEmail : studentEmail;
    const password = type === 'admin' ? adminPassword : studentPassword;

    if (!email.trim() || !password.trim()) {
      return setError('Please fill in all secure authentication inputs.');
    }

    // Security check for admin registration
    if (type === 'admin' && isRegister && !masterAdminEmail.trim()) {
      return setError('Access Denied: Master Admin email verification signature required.');
    }

    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', type);

    if (type === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={styles.viewWindow}>
      <div style={styles.scrollWrapper} ref={scrollContainerRef}>
        
        {/* ================= PANEL 1: STUDENT PORTAL ================= */}
        <div style={styles.panelPageLight}>
          <div style={styles.card}>
            <div style={styles.header}>
              <h2 style={{ color: '#1f2937', margin: '0 0 5px 0' }}>Student Portal</h2>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>Online Examination Terminal</p>
            </div>

            {error && !isAdminRegister && <div style={styles.errorAlert}>⚠️ {error}</div>}

            <form onSubmit={(e) => handleAuth(e, 'student', isStudentRegister)} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.labelLight}>Student Email</label>
                <input 
                  type="email" 
                  placeholder="student@university.com" 
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  required 
                  style={styles.lightInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.labelLight}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={studentPassword}
                  onChange={e => setStudentPassword(e.target.value)}
                  required 
                  style={styles.lightInput}
                />
              </div>

              <button type="submit" style={styles.studentBtn}>
                {isStudentRegister ? 'Register Profile' : 'Secure Student Sign In'}
              </button>

              <div style={styles.toggleRow}>
                <span onClick={() => setIsStudentRegister(!isStudentRegister)} style={styles.linkLight}>
                  {isStudentRegister ? 'Already have an account? Sign In' : 'New student? Register Here'}
                </span>
              </div>
            </form>

            <div style={styles.switchTerminalBox}>
              <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 8px 0' }}>Need administrative tools?</p>
              <button type="button" onClick={() => scrollToPanel(1)} style={styles.slideNextBtn}>
                Slide to Admin Console ➔
              </button>
            </div>
          </div>
        </div>

        {/* ================= PANEL 2: ADMIN SYSTEM CONSOLE ================= */}
        <div style={styles.panelPageDark}>
          <div style={{ ...styles.card, backgroundColor: '#1f2937', border: '1px solid #374151' }}>
            <div style={styles.header}>
              <h2 style={{ color: '#f9fafb', margin: '0 0 5px 0' }}>Admin Console</h2>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>Secure Infrastructure Access</p>
            </div>

            {error && isAdminRegister && <div style={styles.errorAlert}>⚠️ {error}</div>}

            <form onSubmit={(e) => handleAuth(e, 'admin', isAdminRegister)} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.labelDark}>Admin Email</label>
                <input 
                  type="email" 
                  placeholder="admin@university.com" 
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  required 
                  style={styles.darkInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.labelDark}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required 
                  style={styles.darkInput}
                />
              </div>

              {/* Security Validation Field triggered on Admin Sign Up */}
              {isAdminRegister && (
                <div style={styles.inputGroup}>
                  <label style={{ ...styles.labelDark, color: '#f87171' }}>Master Admin Email Verification</label>
                  <input 
                    type="email" 
                    placeholder="existing.admin@university.com" 
                    value={masterAdminEmail}
                    onChange={e => setMasterAdminEmail(e.target.value)}
                    required 
                    style={{ ...styles.darkInput, border: '1px solid #ef4444' }}
                  />
                </div>
              )}

              <button type="submit" style={styles.adminBtn}>
                {isAdminRegister ? 'Deploy New Admin' : 'Secure Admin Login'}
              </button>

              <div style={styles.toggleRow}>
                <span onClick={() => setIsAdminRegister(!isAdminRegister)} style={styles.linkDark}>
                  {isAdminRegister ? 'Cancel Registration' : 'New Admin? Register Profile'}
                </span>
              </div>
            </form>

            <div style={{ ...styles.switchTerminalBox, borderTop: '1px solid #374151' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 8px 0' }}>Are you a test taker?</p>
              <button type="button" onClick={() => scrollToPanel(0)} style={styles.slidePrevBtn}>
                ◀ Return to Student Portal
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Styles configuration optimized for continuous horizontal slide behaviors
const styles = {
  viewWindow: { width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', fontFamily: 'sans-serif' },
  scrollWrapper: { display: 'flex', width: '100%', height: '100%', overflowX: 'hidden', scrollSnapType: 'x mandatory' },
  panelPageLight: { minWidth: '100vw', height: '100vh', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', scrollSnapAlign: 'start' },
  panelPageDark: { minWidth: '100vw', height: '100vh', backgroundColor: '#111827', display: 'flex', justifyContent: 'center', alignItems: 'center', scrollSnapAlign: 'start' },
  card: { backgroundColor: '#ffffff', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '360px' },
  header: { textAlign: 'center', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  labelLight: { fontSize: '12px', fontWeight: 'bold', color: '#4b5563' },
  labelDark: { fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' },
  lightInput: { padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1f2937' },
  darkInput: { padding: '12px', border: '1px solid #4b5563', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#374151', color: '#fff' },
  studentBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  adminBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  toggleRow: { textAlign: 'center', marginTop: '5px' },
  linkLight: { fontSize: '13px', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' },
  linkDark: { fontSize: '13px', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' },
  switchTerminalBox: { borderTop: '1px solid #e5e7eb', marginTop: '25px', paddingTop: '20px', textAlign: 'center' },
  slideNextBtn: { background: 'none', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#4b5563', fontSize: '13px' },
  slidePrevBtn: { background: 'none', border: '1px solid #4b5563', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#9ca3af', fontSize: '13px' },
  errorAlert: { backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }
};

export default IndexPortal;
