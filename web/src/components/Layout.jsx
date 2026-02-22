import { useState, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/sessions', label: 'Sessions', end: true },
    { to: '/my-sessions', label: 'My Sessions' },
    { to: '/sessions/create', label: 'Create' },
    { to: '/profile', label: 'Profile' },
  ];

  const navLinkStyle = (isActive) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s',
    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
    color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Navbar */}
      <nav style={{
        background: 'linear-gradient(90deg, #1e40af, #2563eb)',
        color: 'white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
        }}>
          {/* Logo */}
          <NavLink to="/sessions" style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'white',
            textDecoration: 'none',
            letterSpacing: '-0.5px',
          }}>
            Lineup
          </NavLink>

          {/* Desktop nav links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
            className="desktop-nav"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => navLinkStyle(isActive)}
                onMouseEnter={e => { if (!e.target.style.background.includes('0.2')) e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!e.target.style.background.includes('0.2')) e.target.style.background = 'transparent'; }}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop user section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
            className="desktop-nav"
          >
            {user && (
              <span style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
              }}>
                {user.full_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '7px 16px',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-nav"
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              display: 'none',
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu" style={{
            padding: '8px 20px 16px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginBottom: '2px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
                })}
              >
                {link.label}
              </NavLink>
            ))}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.15)',
              marginTop: '8px',
              paddingTop: '12px',
            }}>
              {user && (
                <p style={{
                  padding: '4px 14px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  margin: '0 0 8px',
                }}>
                  {user.full_name}
                </p>
              )}
              <button
                onClick={handleLogout}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#fca5a5',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>

      <Outlet />
    </div>
  );
};
