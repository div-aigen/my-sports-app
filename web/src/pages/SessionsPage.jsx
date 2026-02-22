import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI, venueAPI } from '../services/api';
import { SessionCard } from '../components/sessions/SessionCard';

export const SessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('open');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    venueAPI.list()
      .then(res => setVenues(res.data.venues || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [page, status, dateFilter, locationFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await sessionAPI.list(page, 10, status, dateFilter || null, locationFilter || null);
      setSessions(response.data.sessions);
    } catch (err) {
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStatus('open');
    setDateFilter('');
    setLocationFilter('');
    setPage(1);
  };

  const hasActiveFilters = status !== 'open' || dateFilter || locationFilter;

  const selectStyle = {
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    background: '#f9fafb',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: '140px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
          Football Sessions
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0, fontWeight: 500 }}>
          Find your game in Lucknow
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '16px',
      }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div>
          <label style={labelStyle}>Venue</label>
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">All Venues</option>
            {venues.map((v) => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#3b82f6',
              background: '#eff6ff',
              border: '2px solid #bfdbfe',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.target.style.background = '#dbeafe'; }}
            onMouseLeave={e => { e.target.style.background = '#eff6ff'; }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          color: '#991b1b',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '16px' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6', borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          Loading sessions...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <svg width="48" height="48" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 16px', display: 'block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p style={{ fontSize: '18px', color: '#6b7280', margin: '0 0 8px', fontWeight: 600 }}>No sessions found</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 20px' }}>Try adjusting your filters or create a new session</p>
          <button
            onClick={() => navigate('/sessions/create')}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Create Session
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px',
        }}>
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {(sessions.length > 0 || page > 1) && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '36px',
        }}>
          {page > 1 && (
            <button
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: '10px 22px',
                background: 'white',
                color: '#374151',
                fontWeight: 600,
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#3b82f6'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e5e7eb'; }}
            >
              Previous
            </button>
          )}
          <span style={{
            padding: '10px 18px',
            background: '#2563eb',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px',
            borderRadius: '10px',
            minWidth: '48px',
            textAlign: 'center',
          }}>
            {page}
          </span>
          {sessions.length >= 10 && (
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '10px 22px',
                background: 'white',
                color: '#374151',
                fontWeight: 600,
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#3b82f6'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e5e7eb'; }}
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};
