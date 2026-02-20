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
    { to: '/sessions', label: 'Sessions' },
    { to: '/my-sessions', label: 'My Sessions' },
    { to: '/sessions/create', label: 'Create' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/sessions" className="text-2xl font-bold tracking-tight">
              Lineup
            </NavLink>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/sessions'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user && (
                <span className="text-blue-100 text-sm">
                  {user.full_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-blue-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/sessions'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t border-blue-500 pt-2 mt-2">
                {user && (
                  <p className="px-3 py-1 text-blue-200 text-sm">{user.full_name}</p>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-200 hover:bg-blue-500"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <Outlet />
    </div>
  );
};
