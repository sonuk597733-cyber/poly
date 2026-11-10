import React, { useState } from "react";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles
} from "lucide-react";
import { authApi } from "../services/authApi";
import AuthLayout from "../components/AuthLayout";
import { assetUrl } from "../utils/assetUrl";
import "./ForgotPassword.css";

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setErrorMsg("Please enter your registered institutional email.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(clean);
      setSubmitted(true);
      if (res?.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit password recovery request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout currentView="login" onNavigate={onNavigate}>
      <div className="forgot-card card-glass">
        {submitted ? (
          <div className="forgot-success-state">
            <div className="forgot-success-badge">
              <CheckCircle2 size={52} className="success-icon" />
            </div>
            <h2>Password Reset Dispatched</h2>
            <p className="forgot-success-desc">
              If an account with <strong>{email}</strong> is registered in the Subharti Academic Ledger, instructions and a secure reset link have been dispatched.
            </p>

            <div className="forgot-security-notice">
              <KeyRound size={16} />
              <span>The password reset link is strictly valid for <strong>15 minutes</strong>. Check your institutional spam folder if not received.</span>
            </div>

            {devResetUrl && (
              <div className="dev-direct-link-box">
                <span className="dev-tag">Local Development Notice</span>
                <p>SMTP is unconfigured in development. Click below to proceed directly:</p>
                <a href={devResetUrl} className="dev-reset-btn">
                  Open Reset Page <ArrowRight size={14} />
                </a>
              </div>
            )}

            <div className="forgot-actions-row">
              <button
                type="button"
                className="primary-login-btn"
                onClick={() => onNavigate?.("login")}
              >
                <ArrowLeft size={16} /> Return to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="forgot-header">
              <div className="forgot-logo-badge">
                <img
                  src={assetUrl("/svsu-logo-whiten.webp")}
                  alt="Swami Vivekanand Subharti University"
                  className="forgot-univ-img"
                />
              </div>
              <div className="forgot-badge-chip">
                <Sparkles size={13} /> SVSU Credential Recovery
              </div>
              <h1>Reset Your Password</h1>
              <p>
                Enter the email address registered with your Subharti Polytechnic account to receive a secure recovery link.
              </p>
            </div>

            {errorMsg && (
              <div className="forgot-alert" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="forgot-form" onSubmit={handleSubmit}>
              <div className="forgot-field-group">
                <label htmlFor="forgot-email">
                  <Mail size={15} /> Registered Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="student.demo@subharti.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="primary-login-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="forgot-card-footer">
              <button
                type="button"
                className="back-to-login-btn"
                onClick={() => onNavigate?.("login")}
              >
                <ArrowLeft size={15} /> Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
