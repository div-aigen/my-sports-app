import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Forgot Password?</h1>
        <p className="text-center text-gray-500 mb-6">Enter your email to receive a reset code</p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {success ? (
          <div>
            <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
              If that email is registered, you will receive a password reset code shortly.
            </div>
            <Link
              to="/reset-password"
              className="block w-full bg-blue-500 text-white text-center font-semibold py-2 rounded-lg hover:bg-blue-600"
            >
              Enter Reset Code
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        <p className="text-center text-gray-600 mt-4">
          <Link to="/login" className="text-blue-500 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};
