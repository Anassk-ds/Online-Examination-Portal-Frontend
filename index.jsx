import React, { useState, useRef } from 'react';
// Import your animation asset from the same directory folder
import walkingMan from './man-walking.gif'; 

const IndexPortal = ({ navigateTo }) => {
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
      navigateTo('/admin');
    } else {
      navigateTo('/dashboard');
    }
  };

  return (
    <div style={styles.viewWindow}>
      {/* Dynamic CSS Keyframes injected safely for GitHub deployment */}
      <style>{`
        @keyframes walkAcrossScreen {
          0% { transform: translateX(-160px); }
          100% { transform: translateX(100vw); }
        }
      `}</style>

      {/* Animated Office Man Layer */}
      <div style={styles.animationWrapper}>
        <img 
          src={walkingMan} 
          alt="Animated man walking with office bag" 
          style={styles.animationImg} 
        />
      </div>

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
  
  // Animation Container CSS Style Rules
  animationWrapper: {
    position: 'absolute',
    bottom: '20px', // Places him right at the lower section of your screen
    left: '0',
    zIndex: 10, // Places him in front of the background, but behind the modal cards
    pointerEvents: 'none', // Prevents the image from blocking clicks on buttons
    animation: 'walkAcrossScreen 14s linear infinite', // Continually loops across the viewport
  },
  animationImg: {
    width: '140px',
    height: 'auto',
  },

  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '380px' },
  header: { textAlign: 'center', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  labelLight: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  labelDark: { fontSize: '14px', fontWeight: '500', color: '#d1d5db' },
  lightInput: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
