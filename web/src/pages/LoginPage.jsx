import { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const redirectTo = location.state?.from || '/sessions';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      await login(formData.email, formData.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #4f46e5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
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
        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}>
          {/* Gradient accent */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #3b82f6, #a855f7, #6366f1)' }} />

          <div style={{ padding: '40px 36px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <img src="/images/logo.png" alt="Lineup" style={{
                width: '72px', height: '72px',
                marginBottom: '16px', alignItems: 'center',
                display: 'inline-flex', justifyContent: 'center'
              }} />
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px' }}>Lineup</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Find your game, join your squad</p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2', borderLeft: '4px solid #ef4444',
                color: '#991b1b', padding: '12px 16px', borderRadius: '8px',
                marginBottom: '20px', fontSize: '14px', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: '#f9fafb', border: '2px solid #e5e7eb',
                    borderRadius: '12px', fontSize: '14px',
                    outline: 'none', transition: 'all 0.2s',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '12px 16px', paddingRight: '48px',
                      background: '#f9fafb', border: '2px solid #e5e7eb',
                      borderRadius: '12px', fontSize: '14px',
                      outline: 'none', transition: 'all 0.2s',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px', display: 'flex', alignItems: 'center',
                      color: '#6b7280',
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', marginTop: '24px', padding: '14px',
                  background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
                  color: 'white', fontWeight: 'bold', fontSize: '16px',
                  border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!loading) e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)'; }}
                onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            {/* Footer Links */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/forgot-password" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
                Forgot your password?
              </Link>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                Don't have an account?{' '}
                <Link to="/signup" state={{ from: redirectTo }} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '24px' }}>
          Secure • Fast •{' '}
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'underline' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
