import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IndexPortal = () => {
  const navigate = useNavigate();
  
  // Tracking current active panel pane view (0 = Student Portal, 1 = Admin Console)
  const [activePanel, setActivePanel] = useState(0);

  // Student Authentication States
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [isStudentRegister, setIsStudentRegister] = useState(false);

  // Admin Authentication States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [masterAdminEmail, setMasterAdminEmail] = useState(''); 
  const [isAdminRegister, setIsAdminRegister] = useState(false);

  const [error, setError] = useState('');

  const handleAuth = (e, type, isRegister) => {
    e.preventDefault();
    setError('');
    const email = type === 'admin' ? adminEmail : studentEmail;
    const password = type === 'admin' ? adminPassword : studentPassword;

    if (!email.trim() || !password.trim()) {
      return setError('Please fill in all secure authentication inputs.');
    }
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
    <div style={styles.viewWindow} className="page-fade-in">
      {/* Dynamic transform-driven slider tracks horizontal panes based on active state */}
      <div 
        style={{ 
          ...styles.scrollWrapper, 
          transform: `translateX(-${activePanel * 50}%)` 
        }}
      >
        
        {/* PANEL ROW 1: STUDENT PORTAL CONTAINER */}
        <div style={styles.panelPageLight}>
          <div style={styles.card} className="card-animated">
            <div style={styles.header}>
              <h2 style={{ color: '#1f2937', margin: '0 0 5px 0' }}>Student Portal</h2>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>Online Examination Terminal</p>
            </div>

            {error && activePanel === 0 && <div style={styles.errorAlert}>⚠️ {error}</div>}

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
                  className="input-animated"
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
                  className="input-animated"
                />
              </div>

              <button type="submit" style={styles.studentBtn} className="btn-animated">
                {isStudentRegister ? 'Register Profile' : 'Secure Student Sign In'}
              </button>

              <div style={styles.toggleRow}>
                <span onClick={() => setIsStudentRegister(!isStudentRegister)} style={styles.linkLight} className="btn-animated">
                  {isStudentRegister ? 'Already have an account? Sign In' : 'New student? Register Here'}
                </span>
              </div>
            </form>

            <div style={styles.switchTerminalBox}>
              <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 8px 0' }}>Need administrative tools?</p>
              <button 
                type="button" 
                onClick={() => { setError(''); setActivePanel(1); }} 
                style={styles.slideNextBtn} 
                className="btn-animated"
              >
                Slide to Admin Console ➔
              </button>
            </div>
          </div>
        </div>

        {/* PANEL ROW 2: ADMIN CONSOLE CONTAINER */}
        <div style={styles.panelPageDark}>
          <div style={{ ...styles.card, backgroundColor: '#1f2937', border: '1px solid #374151' }} className="card-animated">
            <div style={styles.header}>
              <h2 style={{ color: '#f9fafb', margin: '0 0 5px 0' }}>Admin Console</h2>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>Secure Infrastructure Access</p>
            </div>

            {error && activePanel === 1 && <div style={styles.errorAlert}>⚠️ {error}</div>}

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
                  className="input-animated"
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
                  className="input-animated"
                />
              </div>

              {isAdminRegister && (
                <div style={styles.inputGroup}>
                  <label style={styles.labelDark}>Master Admin Code Signature ID</label>
                  <input 
                    type="text" 
                    placeholder="Verification Authority Key" 
                    value={masterAdminEmail}
                    onChange={e => setMasterAdminEmail(e.target.value)}
                    required 
                    style={styles.darkInput}
                    className="input-animated"
                  />
                </div>
              )}

              <button type="submit" style={styles.adminBtn} className="btn-animated">
                {isAdminRegister ? 'Provision Master Credentials' : 'Access System Terminal'}
              </button>

              <div style={styles.toggleRow}>
                <span onClick={() => setIsAdminRegister(!isAdminRegister)} style={styles.linkDark} className="btn-animated">
                  {isAdminRegister ? 'Return to Standard Admin Login' : 'Register New Supervisor Instance'}
                </span>
              </div>
            </form>

            <div style={{ ...styles.switchTerminalBox, borderTop: '1px solid #374151' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 8px 0' }}>Are you an academic student candidate?</p>
              <button 
                type="button" 
                onClick={() => { setError(''); setActivePanel(0); }} 
                style={{ ...styles.slideNextBtn, color: '#94a3b8', borderColor: '#4b5563' }} 
                className="btn-animated"
              >
                🪟 Return to Student Workspace View
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  viewWindow: { width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f1f5f9' },
  scrollWrapper: { display: 'flex', width: '200vw', height: '100%', transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' },
  
  // FIX DETAILS: Clamped layout configurations prevent compression side-by-side
  panelPageLight: { width: '50vw', minWidth: '50vw', maxWidth: '50vw', flexShrink: 0, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  panelPageDark: { width: '50vw', minWidth: '50vw', maxWidth: '50vw', flexShrink: 0, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: '#111827' },
  
  card: { padding: '40px 30px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', width: '100%', maxWidth: '420px' },
  header: { textAlign: 'center', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  labelLight: { fontSize: '12px', fontWeight: 'bold', color: '#4b5563' },
  labelDark: { fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' },
  lightInput: { padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#1f2937' },
  darkInput: { padding: '12px', border: '1px solid #4b5563', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#374151', color: '#fff' },
  studentBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' },
  adminBtn: { backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' },
  toggleRow: { textAlign: 'center', marginTop: '5px' },
  linkLight: { fontSize: '13px', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' },
  linkDark: { fontSize: '13px', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' },
  switchTerminalBox: { borderTop: '1px solid #e5e7eb', marginTop: '25px', paddingTop: '20px', textAlign: 'center' },
  slideNextBtn: { background: 'none', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', color: '#4b5563', fontSize: '13px', outline: 'none', cursor: 'pointer' },
  errorAlert: { padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '13px', borderRadius: '8px', textAlign: 'center', fontWeight: '500', marginBottom: '10px' }
};

export default IndexPortal;
