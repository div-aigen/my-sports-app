import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SessionsPage } from './pages/SessionsPage';
import { CreateSessionPage } from './pages/CreateSessionPage';
import { SessionDetailsPage } from './pages/SessionDetailsPage';
import { MySessionsPage } from './pages/MySessionsPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes with shared layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/create" element={<CreateSessionPage />} />
            <Route path="/sessions/:id" element={<SessionDetailsPage />} />
            <Route path="/my-sessions" element={<MySessionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/" element={<Navigate to="/sessions" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
