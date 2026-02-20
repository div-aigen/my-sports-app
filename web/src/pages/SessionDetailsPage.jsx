import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useWebSocket } from '../services/websocket';
import { getVenueBackground } from '../utils/venueImages';

export const SessionDetailsPage = () => {
  const { id } = useParams();
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

  useEffect(() => {
    fetchSession();
    joinSessionRoom(id);

    on('participant-joined', (data) => {
      if (data.sessionId === parseInt(id)) fetchSession();
    });

    on('participant-left', (data) => {
      if (data.sessionId === parseInt(id)) fetchSession();
    });

    return () => {
      leaveSessionRoom(id);
      off('participant-joined', null);
      off('participant-left', null);
    };
  }, [id]);

  const fetchSession = async () => {
    try {
      const [sessionRes, participantsRes] = await Promise.all([
        sessionAPI.get(id),
        sessionAPI.getParticipants(id),
      ]);

      setSession(sessionRes.data.session);
      setParticipants(participantsRes.data.participants);

      const joined = participantsRes.data.participants.some(p => p.user_id === user.id);
      setIsParticipant(joined);
    } catch (err) {
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await sessionAPI.join(id);
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
      await sessionAPI.leave(id);
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
      await sessionAPI.cancel(id);
      navigate('/sessions');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">Loading...</div>;
  }

  if (!session) {
    return <div className="flex items-center justify-center py-20">Session not found</div>;
  }

  const isCreator = user.id === session.creator_id;
  const isFull = session.participant_count >= session.max_participants;
  const costPerPerson = session.total_cost / session.participant_count;
  const isActive = session.status !== 'completed' && session.status !== 'cancelled';
  const bgImage = getVenueBackground(session.location_address);

  return (
    <div>
      {/* Session Header with venue background */}
      <div
        className="relative py-8"
        style={bgImage ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { backgroundColor: '#f3f4f6' }}
      >
        {bgImage && <div className="absolute inset-0 bg-black/50" />}
        <div className="relative max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/sessions')}
            className={`mb-2 text-sm ${bgImage ? 'text-gray-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
          >
            &larr; Back to Sessions
          </button>
          <h1 className={`text-3xl font-bold ${bgImage ? 'text-white' : 'text-gray-800'}`}>
            {session.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Session Details</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="text-xl font-semibold">{session.location_address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="text-lg font-semibold">{session.scheduled_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time</p>
                    <p className="text-lg font-semibold">{session.scheduled_time}</p>
                  </div>
                </div>

                {session.description && (
                  <div>
                    <p className="text-gray-600">Description</p>
                    <p className="text-gray-800">{session.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Participants ({session.participant_count}/{session.max_participants})</h2>

              {participants.length === 0 ? (
                <p className="text-gray-500">No participants yet</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold">{participant.full_name}</p>
                        {participant.email && (
                          <p className="text-sm text-gray-600">{participant.email}</p>
                        )}
                      </div>
                      <p className="text-blue-600 font-semibold">₹{parseFloat(participant.cost_per_person).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <div className="mb-6">
                <p className="text-gray-600 text-sm">Total Cost</p>
                <p className="text-4xl font-bold text-blue-600">₹{parseFloat(session.total_cost).toFixed(2)}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-gray-600 text-sm">Cost per Person</p>
                <p className="text-2xl font-bold text-blue-600">₹{costPerPerson.toFixed(2)}</p>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm">Status</p>
                <p className={`text-lg font-semibold ${
                  session.status === 'open' ? 'text-green-600' :
                  session.status === 'full' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {session.status.toUpperCase()}
                </p>
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-full mb-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
              >
                {shared ? 'Link Copied!' : 'Share Session'}
              </button>

              {/* Action buttons - only show for active sessions */}
              {isActive && (
                <>
                  {isCreator ? (
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading ? 'Cancelling...' : 'Cancel Session'}
                    </button>
                  ) : isParticipant ? (
                    <button
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading ? 'Leaving...' : 'Leave Session'}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={actionLoading || isFull}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
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
  );
};
