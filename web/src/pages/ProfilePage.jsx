import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

export const ProfilePage = () => {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How do I join a session?',
      a: 'Browse open sessions on the Sessions page and click "Join Session". You\'ll be added to the participant list and your cost per person will be calculated automatically.',
    },
    {
      q: 'How is the cost per person calculated?',
      a: 'The total session cost is divided equally among all active participants. As more people join, your share decreases.',
    },
    {
      q: 'Can I leave a session after joining?',
      a: 'Yes, you can leave a session as long as it hasn\'t started yet. If you\'re the creator, ownership will be transferred to another participant. \
      Note that as a creator if you the only person in the session, then you cannot leave it. In this case you have to cancel the session entirely.',
    },
    {
      q: 'What is an invite code?',
      a: 'Each session has a unique invite code. Share it with friends so they can find and join the session directly using "Join by Code" in the app. \
      Alternatively, they can click on the link provided by the invite and join the session.',
    },
    {
      q: 'Will I get notified when a session is full?',
      a: 'Yes! If you have the mobile app installed, you\'ll receive a push notification when a session you\'ve joined reaches its maximum number of players.',
    },
    {
      q: 'How do I cancel a session I created?',
      a: 'Go to "My Sessions -> Created" and tap the Cancel button. This will remove the session and notify all participants.',
    },
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');

  // Change password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase();
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!fullName || !phoneNumber) return;

    setLoading(true);
    setError('');
    try {
      await userAPI.updateProfile({ full_name: fullName, phone_number: phoneNumber });
      await refreshUser();
      setShowEditModal(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await userAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  };

  const focusInput = (e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; };
  const blurInput = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>
        Profile
      </h1>

      {success && (
        <div style={{
          background: '#f0fdf4',
          borderLeft: '4px solid #22c55e',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <div style={{
          height: '80px',
          background: 'linear-gradient(90deg, #1e40af, #2563eb, #4f46e5)',
        }} />
        <div style={{ padding: '0 28px 28px', marginTop: '-40px' }}>
          {/* Avatar */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            marginBottom: '16px',
          }}>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>
              {getInitials(user?.full_name)}
            </span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            {user?.full_name || 'User'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {user?.email}
            </div>
            {user?.phone_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {user.phone_number}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <h3 style={{
          padding: '18px 24px 12px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: 0,
        }}>
          Account Settings
        </h3>

        <button
          onClick={() => { setShowEditModal(true); setError(''); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Edit Profile</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>Update your name and phone number</p>
            </div>
          </div>
          <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div style={{ height: '1px', background: '#f3f4f6', margin: '0 24px' }} />

        <button
          onClick={() => { setShowPasswordModal(true); setError(''); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Change Password</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>Secure your account</p>
            </div>
          </div>
          <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* FAQ */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <h3 style={{
          padding: '18px 24px 12px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: 0,
        }}>
          FAQ
        </h3>

        {faqs.map((faq, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: '1px', background: '#f3f4f6', margin: '0 24px' }} />}
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', paddingRight: '12px' }}>
                {faq.q}
              </span>
              <svg
                width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"
                style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaq === i && (
              <div style={{ padding: '0 24px 16px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <h3 style={{
          padding: '18px 24px 12px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: 0,
        }}>
          Help & Support
        </h3>
        <a
          href="mailto:support@lineup-sports.in"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px', textDecoration: 'none', color: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Contact Support</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>support@lineup-sports.in</p>
            </div>
          </div>
          <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <div style={{ height: '1px', background: '#f3f4f6', margin: '0 24px' }} />
        <a
          href="/privacy"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px', textDecoration: 'none', color: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Privacy Policy</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>How we handle your data</p>
            </div>
          </div>
          <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '14px',
          background: 'white',
          color: '#dc2626',
          fontWeight: 700,
          fontSize: '15px',
          border: '2px solid #fecaca',
          borderRadius: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.target.style.background = '#fef2f2'; e.target.style.borderColor = '#f87171'; }}
        onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#fecaca'; }}
      >
        Logout
      </button>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
          backdropFilter: 'blur(4px)',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: '440px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '4px',
              background: 'linear-gradient(90deg, #3b82f6, #4f46e5)',
            }} />
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Edit Profile</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#f3f4f6', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', color: '#6b7280', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.target.style.background = '#e5e7eb'; }}
                  onMouseLeave={e => { e.target.style.background = '#f3f4f6'; }}
                >
                  &times;
                </button>
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

              <form onSubmit={handleEditProfile}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required style={inputStyle}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel" value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required style={inputStyle}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
                    color: 'white', fontWeight: 700, fontSize: '15px',
                    border: 'none', borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!loading) e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.35)'; }}
                  onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
          backdropFilter: 'blur(4px)',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
        >
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: '440px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            }} />
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#f3f4f6', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', color: '#6b7280', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.target.style.background = '#e5e7eb'; }}
                  onMouseLeave={e => { e.target.style.background = '#f3f4f6'; }}
                >
                  &times;
                </button>
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

              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    type="password" value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required style={inputStyle}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required style={inputStyle}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0' }}>At least 6 characters</p>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input
                    type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required style={inputStyle}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(90deg, #d97706, #b45309)',
                    color: 'white', fontWeight: 700, fontSize: '15px',
                    border: 'none', borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!loading) e.target.style.boxShadow = '0 8px 25px rgba(217, 119, 6, 0.35)'; }}
                  onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
