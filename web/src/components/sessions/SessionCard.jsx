import { Link } from 'react-router-dom';

export const SessionCard = ({ session }) => {
  return (
    <Link to={`/sessions/${session.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
        <h3 className="text-xl font-semibold text-gray-800">{session.title}</h3>
        <p className="text-gray-600 text-sm mt-1">{session.location_address}</p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">
              {session.scheduled_date} at {session.scheduled_time}
            </p>
            <p className="text-blue-600 font-semibold mt-1">
              ₹{parseFloat(session.total_cost).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-700 font-medium">
              {session.participant_count}/{session.max_participants} Players
            </p>
            <p className={`text-sm font-semibold mt-1 ${
              session.status === 'full' ? 'text-red-600' : 'text-green-600'
            }`}>
              {session.status === 'full' ? 'FULL' : 'OPEN'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
