export const PrivacyPolicyPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '48px 40px',
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px' }}>Privacy Policy</h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Last updated: February 2026</p>
          </div>

          <Section title="1. Introduction">
            Lineup ("we", "our", or "us") operates the Lineup mobile app and website at lineup-sports.in. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.
          </Section>

          <Section title="2. Information We Collect">
            We collect the following information when you create an account or use the app:
            <ul style={listStyle}>
              <li><strong>Name</strong> — used to identify you in sessions</li>
              <li><strong>Email address</strong> — used for account login, email verification, and important notifications</li>
              <li><strong>Phone number</strong> — optional, used for contact within sessions</li>
              <li><strong>Push notification token</strong> — used to send you session-related notifications (e.g. session full, session cancelled)</li>
              <li><strong>Session activity</strong> — sessions you create or join, including dates, venues, and participant counts</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul style={listStyle}>
              <li>To create and manage your account</li>
              <li>To display your name to other participants in sessions you join</li>
              <li>To send you push notifications about sessions you are part of</li>
              <li>To send transactional emails (email verification, password reset)</li>
              <li>To respond to support requests sent to support@lineup-sports.in</li>
            </ul>
            We do not sell, rent, or share your personal information with third parties for marketing purposes.
          </Section>

          <Section title="4. Data Storage">
            Your data is stored securely on servers hosted by Railway (railway.app). Passwords are hashed using bcrypt and are never stored in plain text.
          </Section>

          <Section title="5. Third-Party Services">
            We use the following third-party services:
            <ul style={listStyle}>
              <li><strong>SendGrid</strong> — for sending transactional emails</li>
              <li><strong>Expo</strong> — for delivering push notifications</li>
              <li><strong>Railway</strong> — for backend hosting and database</li>
              <li><strong>Vercel</strong> — for web hosting</li>
            </ul>
            Each of these services has their own privacy policy governing how they handle data.
          </Section>

          <Section title="6. Data Retention">
            We retain your account data for as long as your account is active. You may request deletion of your account and associated data by contacting us at support@lineup-sports.in.
          </Section>

          <Section title="7. Your Rights">
            You have the right to:
            <ul style={listStyle}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
            </ul>
            To exercise any of these rights, contact us at <a href="mailto:support@lineup-sports.in" style={{ color: '#2563eb' }}>support@lineup-sports.in</a>.
          </Section>

          <Section title="8. Children's Privacy">
            Lineup is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.
          </Section>

          <Section title="10. Contact Us" last>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:support@lineup-sports.in" style={{ color: '#2563eb' }}>support@lineup-sports.in</a>.
          </Section>
        </div>
      </div>
    </div>
  );
};

const listStyle = {
  margin: '12px 0 0',
  paddingLeft: '20px',
  lineHeight: '1.8',
};

const Section = ({ title, children, last }) => (
  <div style={{ marginBottom: last ? 0 : '32px' }}>
    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 12px' }}>{title}</h2>
    <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.75', margin: 0 }}>{children}</p>
  </div>
);
