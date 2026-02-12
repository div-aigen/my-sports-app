const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  async sendPasswordResetEmail(email, resetToken, userName) {
    const htmlContent = this.getPasswordResetEmailHTML(userName, resetToken);
    const textContent = this.getPasswordResetEmailText(userName, resetToken);

    try {
      const msg = {
        to: email,
        from: 'divyanshukatiyar92@gmail.com', // SendGrid verified sender email
        subject: 'Password Reset Code - My Sports App',
        text: textContent,
        html: htmlContent,
      };

      const result = await sgMail.send(msg);
      console.log(`✓ Password reset email sent to ${email}`);
      return result;
    } catch (error) {
      console.error(`✗ Failed to send password reset email to ${email}:`, error.message);
      throw error;
    }
  }

  getPasswordResetEmailHTML(userName, resetToken) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .token-box {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      text-align: center;
      background: #f0f7ff;
      padding: 25px;
      border-radius: 8px;
      color: #2196F3;
      font-family: 'Courier New', monospace;
      margin: 25px 0;
      border: 2px solid #2196F3;
    }
    .warning {
      background: #fff3cd;
      padding: 15px 20px;
      border-left: 4px solid #ffc107;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning strong {
      color: #856404;
    }
    .warning ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .warning li {
      margin: 5px 0;
      color: #856404;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .divider {
      border: none;
      border-top: 1px solid #eee;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏅 My Sports App</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>

      <p>You requested to reset your password for My Sports App. Use the code below to reset your password:</p>

      <div class="token-box">${resetToken}</div>

      <p style="text-align: center; color: #666; margin: 20px 0;">
        <strong>Enter this code in the app along with your new password</strong>
      </p>

      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul>
          <li>This code expires in <strong>1 hour</strong></li>
          <li>Only use this code if you requested a password reset</li>
          <li>Never share this code with anyone</li>
          <li>If you didn't request this, please ignore this email and your password will remain unchanged</li>
        </ul>
      </div>

      <hr class="divider">

      <p style="color: #999; font-size: 13px;">
        If you have any questions or didn't request this reset, please contact our support team.
      </p>
    </div>

    <div class="footer">
      <p>This is an automated message from My Sports App</p>
      <p style="margin: 10px 0 0 0;">© 2026 My Sports App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getPasswordResetEmailText(userName, resetToken) {
    return `
Hi ${userName},

You requested to reset your password for My Sports App.

Your password reset code is: ${resetToken}

This code expires in 1 hour.

Enter this code in the app along with your new password to complete the reset.

SECURITY NOTICE:
- Only use this code if you requested a password reset
- Never share this code with anyone
- If you didn't request this, please ignore this email and your password will remain unchanged

---
This is an automated message from My Sports App
    `;
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
