import nodemailer from "nodemailer";

let transporter = null;
const dispatchedDevEmails = [];

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Initialize or get active email transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    console.log(`[EmailService] Configured live SMTP transporter (${SMTP_HOST}:${SMTP_PORT})`);
  } else {
    // Fail safely in production if SMTP is missing
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP credentials are not configured on the production server.");
    }

    // Development / Test fallback adapter
    transporter = {
      sendMail: async (mailOptions) => {
        dispatchedDevEmails.push({
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html,
          otp: mailOptions._devOtp || null,
          timestamp: new Date()
        });

        if (process.env.NODE_ENV !== "test") {
          console.log(`[EmailService - Dev Simulation] Email dispatched to: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
        }

        return { messageId: `dev-sim-${Date.now()}` };
      }
    };
    if (process.env.NODE_ENV !== "test") {
      console.log("[EmailService] Running in Development Simulation Mode (SMTP credentials not configured in .env).");
    }
  }

  return transporter;
}

/**
 * Send 6-digit email verification OTP with Subharti institutional branding
 */
export async function sendVerificationOtpEmail({ to, name, otp }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || "CollegeOS Gateway <no-reply@subharti.org>";
  const safeName = escapeHtml(name || "Student / Colleague");

  const mailOptions = {
    from,
    to,
    subject: `${otp} is your Subharti Polytechnic Verification Code`,
    text: `Hello ${name || "Candidate"},\n\nYour 6-digit email verification code for CollegeOS registration is:\n\n${otp}\n\nThis verification code expires in 5 minutes. Never share this code with anyone.\n\nBest regards,\nSubharti Polytechnic Digital Gateway\nSwami Vivekanand Subharti University`,
    _devOtp: otp, // Kept in memory only for dev simulation tests
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #060f1c; color: #0f172a; margin: 0; padding: 24px; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
          .header { background: #0b192c; padding: 24px; text-align: center; border-bottom: 3px solid #ea580c; }
          .header h1 { color: #ffffff; font-size: 1.25rem; margin: 0 0 4px 0; font-weight: 800; letter-spacing: 0.04em; }
          .header p { color: #94a3b8; font-size: 0.78rem; margin: 0; }
          .body { padding: 32px 28px; line-height: 1.6; color: #334155; }
          .greeting { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .otp-container { text-align: center; margin: 26px 0; }
          .otp-box { display: inline-block; background: #0b192c; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 2.2rem; font-weight: 800; letter-spacing: 0.35em; padding: 14px 28px 14px 38px; border-radius: 12px; border: 2px solid #ea580c; box-shadow: 0 8px 20px rgba(234, 88, 12, 0.25); }
          .expiry-note { font-size: 0.82rem; color: #64748b; background: #f8fafc; padding: 12px 14px; border-radius: 8px; border-left: 3px solid #ea580c; margin-top: 20px; }
          .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>SUBHARTI POLYTECHNIC</h1>
            <p>Swami Vivekanand Subharti University · CollegeOS</p>
          </div>
          <div class="body">
            <div class="greeting">Hello ${safeName},</div>
            <p>Thank you for initiating institutional onboarding on CollegeOS. Use the single-use 6-digit verification code below to verify your email address:</p>
            <div class="otp-container">
              <div class="otp-box">${otp}</div>
            </div>
            <div class="expiry-note">
              <strong>Security Policy:</strong> This verification code is strictly valid for <strong>5 minutes</strong>. If you did not initiate registration, please disregard this email.
            </div>
          </div>
          <div class="footer">
            © Swami Vivekanand Subharti University · Encrypted Digital Gateway
          </div>
        </div>
      </body>
      </html>
    `
  };

  return mailer.sendMail(mailOptions);
}

/**
 * Send password reset email with institutional branding
 */
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || "CollegeOS Gateway <no-reply@subharti.org>";
  const safeName = escapeHtml(name || "Colleague / Student");

  const mailOptions = {
    from,
    to,
    subject: "Reset Your CollegeOS Password · Subharti Polytechnic",
    text: `Hello ${name || "Student / Faculty"},\n\nWe received a request to reset your password for your CollegeOS account at Swami Vivekanand Subharti University.\n\nPlease visit the link below to set a new password. This link is valid for 15 minutes:\n\n${resetUrl}\n\nIf you did not request this password reset, please ignore this email or notify campus IT support.\n\nBest regards,\nSubharti Polytechnic Digital Gateway`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #060f1c; color: #0f172a; margin: 0; padding: 24px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
          .header { background: #0b192c; padding: 24px; text-align: center; border-bottom: 3px solid #ea580c; }
          .header h1 { color: #ffffff; font-size: 1.25rem; margin: 0 0 4px 0; font-weight: 800; letter-spacing: 0.04em; }
          .header p { color: #94a3b8; font-size: 0.78rem; margin: 0; }
          .body { padding: 32px 28px; line-height: 1.6; color: #334155; }
          .greeting { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background: #ea580c; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 0.95rem; padding: 12px 28px; border-radius: 999px; display: inline-block; }
          .expiry-note { font-size: 0.82rem; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #ea580c; }
          .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>SUBHARTI POLYTECHNIC</h1>
            <p>Swami Vivekanand Subharti University · CollegeOS</p>
          </div>
          <div class="body">
            <div class="greeting">Hello ${safeName},</div>
            <p>We received an institutional password reset request for your CollegeOS account (<strong>${to}</strong>).</p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
            </div>
            <div class="expiry-note">
              <strong>Security Notice:</strong> This link will expire in <strong>15 minutes</strong>. If you did not initiate this request, no action is required and your existing password remains safe.
            </div>
          </div>
          <div class="footer">
            © Swami Vivekanand Subharti University · Encrypted Digital Gateway
          </div>
        </div>
      </body>
      </html>
    `
  };

  return mailer.sendMail(mailOptions);
}

/**
 * Access dev/test dispatched email buffer (for automated tests)
 */
export function getDispatchedDevEmails() {
  return dispatchedDevEmails;
}

export function clearDispatchedDevEmails() {
  dispatchedDevEmails.length = 0;
}
