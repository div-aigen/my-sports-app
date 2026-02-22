import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI, venueAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useWebSocket } from '../services/websocket';
import { getVenueBackground } from '../utils/venueImages';
import { formatDate, formatTime } from '../utils/formatDate';

export const SessionDetailsPage = () => {
  const { id: sessionIdentifier } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { joinSessionRoom, leaveSessionRoom, on, off } = useWebSocket();

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isParticipant, setIsParticipant] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [mapsUrl, setMapsUrl] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [sessionIdentifier]);

  // Set up websocket after we have the numeric session id
  useEffect(() => {
    if (!session) return;
    const numericId = session.id;
    joinSessionRoom(numericId);

    const onJoined = (data) => {
      if (data.sessionId === numericId) fetchSession();
    };
    const onLeft = (data) => {
      if (data.sessionId === numericId) fetchSession();
    };

    on('participant-joined', onJoined);
    on('participant-left', onLeft);

    return () => {
      leaveSessionRoom(numericId);
      off('participant-joined', onJoined);
      off('participant-left', onLeft);
    };
  }, [session?.id]);

  const fetchSession = async () => {
    try {
      // Fetch session by session_id (backend supports UUID lookup)
      const sessionRes = await sessionAPI.get(sessionIdentifier);
      const sessionData = sessionRes.data.session;

      // Use numeric id for participants API
      const participantsRes = await sessionAPI.getParticipants(sessionData.id);

      setSession(sessionData);
      setParticipants(participantsRes.data.participants);

      const joined = participantsRes.data.participants.some(p => p.user_id === user.id);
      setIsParticipant(joined);

      // Fetch venue maps URL
      if (sessionData.venue_id) {
        try {
          const venuesRes = await venueAPI.list();
          const venue = venuesRes.data.venues?.find(v => v.id === sessionData.venue_id);
          if (venue?.maps_url) setMapsUrl(venue.maps_url);
        } catch {}
      }
    } catch (err) {
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await sessionAPI.join(session.id);
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this session?')) return;
    setActionLoading(true);
    try {
      await sessionAPI.leave(session.id);
      fetchSession();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    setActionLoading(true);
    try {
      await sessionAPI.cancel(session.id);
      navigate('/sessions');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `https://web-ten-theta-34.vercel.app/sessions/${session.session_id}`;
    navigator.clipboard.writeText(shareUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#9ca3af' }}>
        <div style={{
          width: '40px', height: '40px', border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
        <p style={{ fontSize: '18px', fontWeight: 600 }}>Session not found</p>
        <button onClick={() => navigate('/sessions')} style={{
          marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white',
          border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Back to Sessions
        </button>
      </div>
    );
  }

  const isCreator = user.id === session.creator_id;
  const isFull = session.participant_count >= session.max_participants;
  const costPerPerson = session.participant_count > 0 ? session.total_cost / session.participant_count : session.total_cost;
  const isActive = session.status !== 'completed' && session.status !== 'cancelled';
  const bgImage = getVenueBackground(session.location_address);

  const statusConfig = {
    open: { label: 'OPEN', bg: '#22c55e', color: '#166534', bgLight: '#f0fdf4' },
    full: { label: 'FULL', bg: '#ef4444', color: '#991b1b', bgLight: '#fef2f2' },
    completed: { label: 'COMPLETED', bg: '#6b7280', color: '#374151', bgLight: '#f3f4f6' },
    cancelled: { label: 'CANCELLED', bg: '#6b7280', color: '#374151', bgLight: '#f3f4f6' },
  };
  const st = statusConfig[session.status] || statusConfig.open;

  return (
    <div>
      {/* Hero header with venue background */}
      <div style={{
        position: 'relative',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundImage: bgImage ? `url(${bgImage})` : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px 20px' }}>
          <button
            onClick={() => navigate('/sessions')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '16px',
              fontFamily: 'inherit',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            &larr; Back to Sessions
          </button>
          <h1 style={{
            color: 'white', fontSize: '32px', fontWeight: 800,
            margin: '0 0 8px', textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}>
            {session.title}
          </h1>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                color: 'rgba(255,255,255,0.9)', fontSize: '15px',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.12)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {session.location_address}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {session.location_address}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }}>
        {error && (
          <div style={{
            background: '#fef2f2', borderLeft: '4px solid #ef4444',
            color: '#991b1b', padding: '14px 18px', borderRadius: '10px',
            marginBottom: '24px', fontSize: '14px', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Desktop: 2 columns */}
          <style>{`
            @media (min-width: 768px) {
              .session-grid { grid-template-columns: 1fr 340px !important; }
            }
          `}</style>
          <div className="session-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

            {/* Left column */}
            <div>
              {/* Session info card */}
              <div style={{
                background: 'white', borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden', marginBottom: '24px',
              }}>
                <div style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>
                    Session Details
                  </h2>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{
                      background: '#f9fafb', borderRadius: '12px', padding: '16px',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Date</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {formatDate(session.scheduled_date)}
                      </p>
                    </div>
                    <div style={{
                      background: '#f9fafb', borderRadius: '12px', padding: '16px',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Time</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {formatTime(session.scheduled_time)}
                        {session.scheduled_end_time && ` - ${formatTime(session.scheduled_end_time)}`}
                      </p>
                    </div>
                    <div style={{
                      background: '#f9fafb', borderRadius: '12px', padding: '16px',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Sport</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {session.sport_type || 'Football'}
                      </p>
                    </div>
                    <div style={{
                      background: '#f9fafb', borderRadius: '12px', padding: '16px',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Players</p>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {session.participant_count}/{session.max_participants}
                      </p>
                    </div>
                  </div>

                  {session.description && (
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Description</p>
                      <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: 1.6 }}>{session.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Participants card */}
              <div style={{
                background: 'white', borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>
                    Participants ({session.participant_count}/{session.max_participants})
                  </h2>

                  {participants.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                      No participants yet. Be the first to join!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {participants.map((participant) => (
                        <div key={participant.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', background: '#f9fafb', borderRadius: '12px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: participant.user_id === session.creator_id
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>
                                {getInitials(participant.full_name)}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {participant.full_name}
                                {participant.user_id === session.creator_id && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700, color: '#d97706',
                                    background: '#fef3c7', padding: '2px 6px', borderRadius: '4px',
                                  }}>HOST</span>
                                )}
                                {participant.user_id === user.id && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700, color: '#2563eb',
                                    background: '#eff6ff', padding: '2px 6px', borderRadius: '4px',
                                  }}>YOU</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>
                            ₹{parseFloat(participant.cost_per_person).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div>
              <div style={{
                background: 'white', borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                position: 'sticky', top: '80px',
              }}>
                <div style={{ padding: '24px' }}>
                  {/* Total Cost */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Total Cost</p>
                    <p style={{ fontSize: '36px', fontWeight: 800, color: '#2563eb', margin: 0 }}>
                      ₹{parseFloat(session.total_cost).toLocaleString()}
                    </p>
                  </div>

                  {/* Cost per person */}
                  <div style={{
                    background: '#eff6ff', borderRadius: '12px', padding: '16px',
                    textAlign: 'center', marginBottom: '20px',
                  }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 4px' }}>Cost per Person</p>
                    <p style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', margin: 0 }}>
                      ₹{parseFloat(costPerPerson).toFixed(0)}
                    </p>
                  </div>

                  {/* Status */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '24px',
                  }}>
                    <span style={{
                      background: st.bg, color: 'white',
                      fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px',
                      padding: '6px 16px', borderRadius: '20px',
                    }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ height: '1px', background: '#f3f4f6', margin: '0 0 20px' }} />

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    style={{
                      width: '100%', padding: '12px',
                      background: shared ? '#f0fdf4' : '#f9fafb',
                      color: shared ? '#16a34a' : '#374151',
                      fontWeight: 600, fontSize: '14px',
                      border: shared ? '2px solid #86efac' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      marginBottom: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                    onMouseEnter={e => { if (!shared) { e.target.style.borderColor = '#9ca3af'; e.target.style.background = '#f3f4f6'; } }}
                    onMouseLeave={e => { if (!shared) { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; } }}
                  >
                    {shared ? (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Session
                      </>
                    )}
                  </button>

                  {/* Action buttons */}
                  {isActive && (
                    <>
                      {isCreator ? (
                        <button
                          onClick={handleCancel}
                          disabled={actionLoading}
                          style={{
                            width: '100%', padding: '14px',
                            background: 'white', color: '#dc2626',
                            fontWeight: 700, fontSize: '15px',
                            border: '2px solid #fecaca',
                            borderRadius: '12px',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            opacity: actionLoading ? 0.7 : 1,
                            transition: 'all 0.2s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { e.target.style.background = '#fef2f2'; e.target.style.borderColor = '#f87171'; }}
                          onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#fecaca'; }}
                        >
                          {actionLoading ? 'Cancelling...' : 'Cancel Session'}
                        </button>
                      ) : isParticipant ? (
                        <button
                          onClick={handleLeave}
                          disabled={actionLoading}
                          style={{
                            width: '100%', padding: '14px',
                            background: 'white', color: '#ea580c',
                            fontWeight: 700, fontSize: '15px',
                            border: '2px solid #fed7aa',
                            borderRadius: '12px',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            opacity: actionLoading ? 0.7 : 1,
                            transition: 'all 0.2s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { e.target.style.background = '#fff7ed'; e.target.style.borderColor = '#fb923c'; }}
                          onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#fed7aa'; }}
                        >
                          {actionLoading ? 'Leaving...' : 'Leave Session'}
                        </button>
                      ) : (
                        <button
                          onClick={handleJoin}
                          disabled={actionLoading || isFull}
                          style={{
                            width: '100%', padding: '14px',
                            background: isFull ? '#e5e7eb' : 'linear-gradient(90deg, #16a34a, #15803d)',
                            color: isFull ? '#9ca3af' : 'white',
                            fontWeight: 700, fontSize: '15px',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: (actionLoading || isFull) ? 'not-allowed' : 'pointer',
                            opacity: actionLoading ? 0.7 : 1,
                            transition: 'all 0.2s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { if (!isFull && !actionLoading) e.target.style.boxShadow = '0 8px 25px rgba(22, 163, 74, 0.35)'; }}
                          onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
                        >
                          {actionLoading ? 'Joining...' : isFull ? 'Session Full' : 'Join Session'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
