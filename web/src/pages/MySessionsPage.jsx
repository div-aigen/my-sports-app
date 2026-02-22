import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { getVenueBackground } from '../utils/venueImages';
import { formatDate, formatTime } from '../utils/formatDate';

export const MySessionsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('joined');
  const [joinedCount, setJoinedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(fetchSessions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [openRes, fullRes, completedRes] = await Promise.all([
        sessionAPI.list(1, 50, 'open'),
        sessionAPI.list(1, 50, 'full'),
        sessionAPI.list(1, 50, 'completed'),
      ]);

      const allSessions = [
        ...openRes.data.sessions,
        ...fullRes.data.sessions,
        ...completedRes.data.sessions,
      ];

      const participationStatus = {};
      await Promise.all(
        allSessions.map(async (session) => {
          try {
            const res = await sessionAPI.getParticipants(session.id);
            participationStatus[session.id] = res.data.participants.some(
              (p) => p.user_id === user.id
            );
          } catch {
            participationStatus[session.id] = false;
          }
        })
      );

      const done = allSessions.filter((s) => s.status === 'completed' && participationStatus[s.id]);
      const activeSessions = allSessions.filter((s) => s.status !== 'completed');
      const joined = activeSessions.filter((s) => participationStatus[s.id]);
      const created = activeSessions.filter((s) => s.creator_id === user.id);

      setJoinedCount(joined.length);
      setCreatedCount(created.length);
      setDoneCount(done.length);

      if (activeTab === 'joined') setSessions(joined);
      else if (activeTab === 'created') setSessions(created);
      else setSessions(done);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (session) => {
    if (!confirm(`Are you sure you want to leave "${session.title}"?`)) return;
    setActionLoading(session.id);
    try {
      await sessionAPI.leave(session.id);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (session) => {
    if (!confirm(`Are you sure you want to cancel "${session.title}"? This will remove the session for all participants.`)) return;
    setActionLoading(session.id);
    try {
      await sessionAPI.cancel(session.id);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel session');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'joined', label: 'Joined', count: joinedCount },
    { key: 'created', label: 'Created', count: createdCount },
    { key: 'done', label: 'Done', count: doneCount },
  ];

  const statusConfig = {
    open: { label: 'OPEN', bg: '#22c55e' },
    full: { label: 'FULL', bg: '#ef4444' },
    completed: { label: 'DONE', bg: '#6b7280' },
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>
        My Sessions
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: 'white',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxWidth: '400px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              background: activeTab === tab.key ? '#2563eb' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '16px' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6', borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          Loading...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <svg width="48" height="48" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 16px', display: 'block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p style={{ fontSize: '18px', color: '#6b7280', margin: '0 0 8px', fontWeight: 600 }}>
            No {activeTab === 'done' ? 'completed' : activeTab} sessions yet
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            {activeTab === 'joined'
              ? 'Join sessions to see them here'
              : activeTab === 'created'
              ? 'Create a session to get started'
              : 'Completed sessions will appear here'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px',
        }}>
          {sessions.map((session) => {
            const bgImage = getVenueBackground(session.location_address);
            const st = statusConfig[session.status] || statusConfig.open;
            return (
              <div key={session.id} style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                background: 'white',
              }}>
                {/* Card top — clickable */}
                <div
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  style={{
                    position: 'relative',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    backgroundImage: bgImage ? `url(${bgImage})` : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)',
                  }} />

                  {/* Status badge */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 2,
                    background: st.bg, color: 'white',
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
                    padding: '4px 10px', borderRadius: '20px',
                  }}>
                    {st.label}
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, padding: '18px' }}>
                    <h3 style={{
                      color: 'white', fontSize: '18px', fontWeight: 700,
                      margin: '0 0 4px',
                    }}>
                      {session.title}
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.7)', fontSize: '13px',
                      margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {session.location_address}
                    </p>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {formatDate(session.scheduled_date)} &middot; {formatTime(session.scheduled_time)}
                      </span>
                      <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '15px' }}>
                        ₹{parseFloat(session.total_cost).toLocaleString()}
                      </span>
                      <span style={{ color: 'white', fontWeight: 600 }}>
                        {session.participant_count}/{session.max_participants}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {session.status !== 'completed' && (
                  <div style={{
                    display: 'flex',
                    borderTop: '1px solid #f3f4f6',
                  }}>
                    <button
                      onClick={() => handleLeave(session)}
                      disabled={actionLoading === session.id}
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ea580c',
                        background: 'white',
                        border: 'none',
                        cursor: actionLoading === session.id ? 'not-allowed' : 'pointer',
                        opacity: actionLoading === session.id ? 0.5 : 1,
                        transition: 'background 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { e.target.style.background = '#fff7ed'; }}
                      onMouseLeave={e => { e.target.style.background = 'white'; }}
                    >
                      Leave
                    </button>
                    {activeTab === 'created' && (
                      <button
                        onClick={() => handleCancel(session)}
                        disabled={actionLoading === session.id}
                        style={{
                          flex: 1,
                          padding: '12px',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#dc2626',
                          background: 'white',
                          border: 'none',
                          borderLeft: '1px solid #f3f4f6',
                          cursor: actionLoading === session.id ? 'not-allowed' : 'pointer',
                          opacity: actionLoading === session.id ? 0.5 : 1,
                          transition: 'background 0.2s',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.target.style.background = '#fef2f2'; }}
                        onMouseLeave={e => { e.target.style.background = 'white'; }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
