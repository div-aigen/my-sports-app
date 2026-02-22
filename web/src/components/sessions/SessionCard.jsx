import { Link } from 'react-router-dom';
import { getVenueBackground } from '../../utils/venueImages';
import { formatDate, formatTime } from '../../utils/formatDate';

export const SessionCard = ({ session }) => {
  const bgImage = getVenueBackground(session.location_address);

  const statusConfig = {
    open: { label: 'OPEN', bg: '#22c55e', shadow: '0 2px 8px rgba(34,197,94,0.4)' },
    full: { label: 'FULL', bg: '#ef4444', shadow: '0 2px 8px rgba(239,68,68,0.4)' },
    completed: { label: 'DONE', bg: '#6b7280', shadow: 'none' },
    cancelled: { label: 'CANCELLED', bg: '#6b7280', shadow: 'none' },
  };
  const st = statusConfig[session.status] || statusConfig.open;

  return (
    <Link to={`/sessions/${session.session_id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundImage: bgImage ? `url(${bgImage})` : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'; }}
      >
        {/* Dark gradient overlay for text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)',
        }} />

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 2,
          background: st.bg, color: 'white',
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
          padding: '5px 12px', borderRadius: '20px',
          boxShadow: st.shadow,
        }}>
          {st.label}
        </div>

        {/* Card content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
          <h3 style={{
            color: 'white', fontSize: '20px', fontWeight: 700,
            margin: '0 0 6px', lineHeight: 1.2,
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            {session.title}
          </h3>

          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: '13px',
            margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {session.location_address}
          </p>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {formatDate(session.scheduled_date)}
              </span>
              <span style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>
                {formatTime(session.scheduled_time)}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Cost
              </span>
              <span style={{ color: '#60a5fa', fontSize: '17px', fontWeight: 700 }}>
                ₹{parseFloat(session.total_cost).toLocaleString()}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Players
              </span>
              <span style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>
                {session.participant_count}/{session.max_participants}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
