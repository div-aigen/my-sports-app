import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user, markEmailVerified, logout } = useContext(AuthContext);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.verifyEmail(user.email, token.trim());
      markEmailVerified();
      navigate('/sessions', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.resendVerification();
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: '#f9fafb', border: '2px solid #e5e7eb',
    borderRadius: '12px', fontSize: '24px',
    outline: 'none', transition: 'all 0.2s',
    boxSizing: 'border-box', fontFamily: 'monospace',
    textAlign: 'center', letterSpacing: '8px',
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
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #4CAF50, #2E7D32, #43A047)' }} />

          <div style={{ padding: '40px 36px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px', fontSize: '32px',
              }}>
                &#9993;
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px' }}>Verify Your Email</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: '#374151' }}>{user?.email}</strong>
              </p>
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

            {success && (
              <div style={{
                background: '#f0fdf4', borderLeft: '4px solid #22c55e',
                color: '#166534', padding: '12px 16px', borderRadius: '8px',
                marginBottom: '20px', fontSize: '14px', fontWeight: 500,
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  placeholder="------"
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(90deg, #16a34a, #15803d)',
                color: 'white', fontWeight: 'bold', fontSize: '16px',
                border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s', fontFamily: 'inherit',
              }}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>
                Didn't receive the code?
              </p>
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none', border: 'none', color: '#2563eb',
                  fontWeight: 600, fontSize: '14px', cursor: resending ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', textDecoration: 'underline',
                }}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <p style={{ textAlign: 'center', margin: '16px 0 0' }}>
              <button
                onClick={logout}
                style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Sign out and use a different account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
