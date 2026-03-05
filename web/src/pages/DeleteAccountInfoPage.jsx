export const DeleteAccountInfoPage = () => {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px', fontFamily: 'inherit' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <img src="/images/logo.png" alt="Lineup" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>Lineup Sports</h1>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>
          Account Deletion Request
        </h2>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
          This page explains how to delete your Lineup Sports account and what happens to your data.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* How to Delete */}
        <div style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #3b82f6, #4f46e5)' }} />
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
              How to Delete Your Account
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
              You can delete your account directly from the Lineup app in two ways:
            </p>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Via the Mobile App:</p>
              <ol style={{ fontSize: '14px', color: '#6b7280', margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
                <li>Open the Lineup app and log in</li>
                <li>Go to the <strong>Profile</strong> tab</li>
                <li>Scroll down and tap <strong>Delete Account</strong></li>
                <li>Tap <strong>Delete My Account</strong> when prompted again</li>
              </ol>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Via the Web App:</p>
              <ol style={{ fontSize: '14px', color: '#6b7280', margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
                <li>Visit <a href="https://www.lineup-sports.in" style={{ color: '#2563eb' }}>lineup-sports.in</a> and log in</li>
                <li>Go to your <strong>Profile</strong> page</li>
                <li>Scroll down and click <strong>Delete Account</strong></li>
                <li>Type your email address to confirm</li>
                <li>Click <strong>Delete My Account</strong></li>
              </ol>
            </div>
          </div>
        </div>

        {/* What Gets Deleted */}
        <div style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
              What Data Is Deleted
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px' }}>
              The following data is <strong>permanently and immediately deleted</strong> when you delete your account:
            </p>
            <ul style={{ fontSize: '14px', color: '#6b7280', margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
              <li>Your account profile (name, email address, phone number)</li>
              <li>All sessions you created</li>
              <li>Your session participation history</li>
              <li>Your authentication tokens</li>
              <li>Your push notification token</li>
            </ul>
          </div>
        </div>

        {/* Retention */}
        <div style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
              Deletion Timeline
            </h3>
            <ul style={{ fontSize: '14px', color: '#6b7280', margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Immediate:</strong> Your account and all personal data are deleted as soon as you confirm deletion.</li>
              <li><strong>No retention period:</strong> We do not retain any personally identifiable data after account deletion.</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
              Need Help?
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>
              If you're unable to access your account to delete it, or need assistance, contact us:
            </p>
            <a
              href="mailto:support@lineup-sports.in"
              style={{ fontSize: '14px', color: '#2563eb', fontWeight: 600 }}
            >
              support@lineup-sports.in
            </a>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '8px 0 0' }}>
              We will process your deletion request within 7 business days.
            </p>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
          <a href="/privacy" style={{ color: '#6b7280' }}>Privacy Policy</a>
          {' · '}
          <a href="/" style={{ color: '#6b7280' }}>Back to App</a>
        </p>
      </div>
    </div>
  );
};
