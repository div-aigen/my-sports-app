import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { getVenueBackground } from '../utils/venueImages';

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Sessions</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No {activeTab === 'done' ? 'completed' : activeTab} sessions yet</p>
          <p className="text-sm mt-2">
            {activeTab === 'joined'
              ? 'Join sessions to see them here'
              : activeTab === 'created'
              ? 'Create a session to get started'
              : 'Completed sessions will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const bgImage = getVenueBackground(session.location_address);
            return (
              <div key={session.id} className="rounded-lg shadow overflow-hidden bg-white">
                <div
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="cursor-pointer relative p-4"
                  style={bgImage ? {
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : {}}
                >
                  {bgImage && (
                    <div className="absolute inset-0 bg-black/50" />
                  )}
                  <div className={`relative ${bgImage ? 'text-white' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold truncate">{session.title}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        session.status === 'open' ? 'bg-green-500 text-white' :
                        session.status === 'full' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {session.status === 'completed' ? 'DONE' : session.status.toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-sm ${bgImage ? 'text-gray-200' : 'text-gray-600'}`}>
                      {session.location_address}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className={bgImage ? 'text-gray-300' : 'text-gray-500'}>Date: </span>
                        {session.scheduled_date}
                      </div>
                      <div>
                        <span className={bgImage ? 'text-gray-300' : 'text-gray-500'}>Time: </span>
                        {session.scheduled_time}
                      </div>
                      <div>
                        <span className={bgImage ? 'text-gray-300' : 'text-gray-500'}>Cost: </span>
                        ₹{session.total_cost}
                      </div>
                      <div>
                        <span className={bgImage ? 'text-gray-300' : 'text-gray-500'}>Players: </span>
                        {session.participant_count}/{session.max_participants}
                      </div>
                    </div>
                  </div>
                </div>

                {session.status !== 'completed' && (
                  <div className="flex border-t border-gray-200">
                    <button
                      onClick={() => handleLeave(session)}
                      disabled={actionLoading === session.id}
                      className="flex-1 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                    >
                      Leave
                    </button>
                    {activeTab === 'created' && (
                      <button
                        onClick={() => handleCancel(session)}
                        disabled={actionLoading === session.id}
                        className="flex-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border-l border-gray-200 disabled:opacity-50"
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
