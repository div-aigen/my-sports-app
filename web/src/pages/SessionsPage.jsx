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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Football Sessions</h1>
        <p className="text-gray-500">Find your game in Lucknow</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-gray-600 text-sm mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-600 text-sm mb-1">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-600 text-sm mb-1">Venue</label>
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        )}
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
  );
};
