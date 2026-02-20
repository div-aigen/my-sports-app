import { Link } from 'react-router-dom';
import { getVenueBackground } from '../../utils/venueImages';

export const SessionCard = ({ session }) => {
  const bgImage = getVenueBackground(session.location_address);

  const statusColor = session.status === 'open'
    ? 'bg-green-500'
    : session.status === 'full'
    ? 'bg-red-500'
    : 'bg-gray-500';

  return (
    <Link to={`/sessions/${session.id}`}>
      <div
        className="rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden relative"
        style={bgImage ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { backgroundColor: 'white' }}
      >
        {bgImage && <div className="absolute inset-0 bg-black/50" />}

        <div className={`relative p-4 ${bgImage ? 'text-white' : ''}`}>
          <div className="flex items-start justify-between">
            <h3 className={`text-xl font-semibold ${bgImage ? 'text-white' : 'text-gray-800'}`}>
              {session.title}
            </h3>
            <span className={`${statusColor} text-white text-xs font-bold px-2 py-1 rounded ml-2 whitespace-nowrap`}>
              {session.status === 'completed' ? 'DONE' : session.status.toUpperCase()}
            </span>
          </div>

          <p className={`text-sm mt-1 ${bgImage ? 'text-gray-200' : 'text-gray-600'}`}>
            {session.location_address}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className={`text-sm ${bgImage ? 'text-gray-300' : 'text-gray-600'}`}>
                {session.scheduled_date} at {session.scheduled_time}
              </p>
              <p className={`font-semibold mt-1 ${bgImage ? 'text-blue-300' : 'text-blue-600'}`}>
                ₹{parseFloat(session.total_cost).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-medium ${bgImage ? 'text-gray-200' : 'text-gray-700'}`}>
                {session.participant_count}/{session.max_participants} Players
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
