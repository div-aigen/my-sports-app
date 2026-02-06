import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { SessionCard } from '../components/sessions/SessionCard';

export const SessionsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('open');

  useEffect(() => {
    fetchSessions();
  }, [page, status]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.list(page, 10, status);
      setSessions(response.data.sessions);
    } catch (err) {
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Football Sessions</h1>
            <p className="text-blue-100">Find your game in Lucknow</p>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-white">Welcome, {user.full_name}!</span>}
            <button
              onClick={() => navigate('/sessions/create')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg"
            >
              + Create Session
            </button>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-6">
          <label className="text-gray-700 font-medium mr-4">Filter by Status:</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No sessions available. <button className="text-blue-500 hover:underline" onClick={() => navigate('/sessions/create')}>Create one!</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {sessions.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
