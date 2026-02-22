import { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useContext(AuthContext);
  const redirectTo = location.state?.from || '/sessions';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signup(formData.email, formData.password, formData.fullName, formData.phoneNumber);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: '#f9fafb', border: '2px solid #e5e7eb',
    borderRadius: '12px', fontSize: '14px',
    outline: 'none', transition: 'all 0.2s',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const focusInput = (e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; };
  const blurInput = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #4f46e5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-120px', left: '-120px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'rgba(96, 165, 250, 0.25)', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-120px', right: '-120px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(80px)',
      }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>
        <div style={{
          background: 'white', borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)', overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #3b82f6, #a855f7, #6366f1)' }} />

          <div style={{ padding: '40px 36px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '64px', height: '64px',
                background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                borderRadius: '16px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.15)',
              }}>
                <svg width="32" height="32" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px' }}>Lineup</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Join the game, build your squad</p>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', borderLeft: '4px solid #ef4444',
                color: '#991b1b', padding: '12px 16px', borderRadius: '8px',
                marginBottom: '20px', fontSize: '14px', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                  placeholder="John Doe" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  placeholder="you@example.com" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Phone Number</label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                  placeholder="+91 90000 00000" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required
                  placeholder="••••••••" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0' }}>At least 6 characters</p>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', marginTop: '24px', padding: '14px',
                background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
                color: 'white', fontWeight: 'bold', fontSize: '16px',
                border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s', fontFamily: 'inherit',
              }}
                onMouseEnter={e => { if (!loading) e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)'; }}
                onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" state={{ from: redirectTo }} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '24px' }}>
          Secure • Privacy Protected • Fast
        </p>
      </div>
    </div>
  );
};
