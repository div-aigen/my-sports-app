import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI, venueAPI } from '../services/api';

export const CreateSessionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venueId: '',
    scheduledDate: '',
    scheduledTime: '',
    scheduledEndTime: '',
    totalCost: '',
    maxParticipants: '14',
    sportType: 'Football',
  });

  useEffect(() => {
    venueAPI.list()
      .then(res => setVenues(res.data.venues || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedVenue = venues.find(v => String(v.id) === formData.venueId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await sessionAPI.create({
        title: formData.title,
        description: formData.description,
        location_address: selectedVenue ? selectedVenue.name : '',
        scheduled_date: formData.scheduledDate,
        scheduled_time: formData.scheduledTime,
        scheduled_end_time: formData.scheduledEndTime,
        total_cost: parseFloat(formData.totalCost),
        max_participants: parseInt(formData.maxParticipants),
        sport_type: formData.sportType,
        venue_id: parseInt(formData.venueId),
      });
      navigate(`/sessions/${response.data.session.session_id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  };

  const focusInput = (e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; };
  const blurInput = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '40px',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
          Create Session
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0, fontWeight: 500 }}>
          Set up a new football game
        </p>
      </div>

      {/* Form card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #22c55e, #3b82f6, #4f46e5)',
        }} />

        <div style={{ padding: '24px 20px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Session Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Session Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Friday Evening Football"
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add any details about the game..."
                rows="3"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '80px',
                }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Sport Type & Venue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Sport <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                >
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Badminton">Badminton</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Venue <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  name="venueId"
                  value={formData.venueId}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                >
                  <option value="">Select venue</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Start & End Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Start Time <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
              <div>
                <label style={labelStyle}>End Time <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="time"
                  name="scheduledEndTime"
                  value={formData.scheduledEndTime}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            </div>

            {/* Cost & Max Participants */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={labelStyle}>Total Cost (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}>₹</span>
                  <input
                    type="number"
                    name="totalCost"
                    value={formData.totalCost}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="500"
                    style={{
                      ...inputStyle,
                      paddingLeft: '36px',
                    }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0', fontWeight: 500 }}>
                  Split equally among players
                </p>
              </div>
              <div>
                <label style={labelStyle}>Max Players <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  required
                  min="2"
                  max="50"
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0', fontWeight: 500 }}>
                  Between 2 and 50
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(90deg, #16a34a, #15803d)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!loading) e.target.style.boxShadow = '0 8px 25px rgba(22, 163, 74, 0.35)'; }}
                onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '15px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.target.style.borderColor = '#9ca3af'; e.target.style.background = '#f9fafb'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = 'white'; }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
