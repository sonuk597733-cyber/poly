import React, { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { authApi } from "../services/authApi";
import AuthLayout from "../components/AuthLayout";
import "./ResetPassword.css";

function extractToken() {
  // Check hash params first (#/reset-password?token=...)
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf("?");
  if (hashQueryIndex !== -1) {
    const params = new URLSearchParams(hash.slice(hashQueryIndex));
    const t = params.get("token");
    if (t) return t;
  }
  // Check standard search params (?token=...)
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("token") || "";
}

export default function ResetPassword({ onNavigate }) {
  const [token, setToken] = useState(extractToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleUrlChange = () => {
      setToken(extractToken());
    };
    window.addEventListener("hashchange", handleUrlChange);
    return () => window.removeEventListener("hashchange", handleUrlChange);
  }, []);

  // Password Policy Checks
  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword
  };

  const isFormValid =
    checks.length && checks.upper && checks.lower && checks.number && checks.match;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Password reset token is missing from the URL. Please request a new recovery link.");
      return;
    }

    if (!isFormValid) {
      if (!checks.match) {
        setErrorMsg("Passwords do not match.");
      } else {
        setErrorMsg("Please satisfy all password security requirements.");
      }
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword
      });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout currentView="login" onNavigate={onNavigate}>
      <div className="reset-card card-glass">
        {success ? (
          <div className="reset-success-state">
            <div className="reset-success-badge">
              <CheckCircle2 size={52} className="success-icon" />
            </div>
            <h2>Password Successfully Updated</h2>
            <p className="reset-success-desc">
              Your institutional credentials for Swami Vivekanand Subharti University have been securely updated. You can now sign in with your new password.
            </p>

            <div className="reset-security-note">
              <ShieldCheck size={16} />
              <span>Prior recovery links and sessions have been securely invalidated.</span>
            </div>

            <div className="reset-actions-row">
              <button
                type="button"
                className="primary-login-btn"
                onClick={() => onNavigate?.("login")}
              >
                <span>Sign In to CollegeOS</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="reset-header">
              <div className="reset-logo-badge">
                <img
                  src="/svsu-logo-whiten.webp"
                  alt="Swami Vivekanand Subharti University"
                  className="reset-univ-img"
                />
              </div>
              <div className="reset-badge-chip">
                <Sparkles size={13} /> SVSU Secure Gateway
              </div>
              <h1>Create New Password</h1>
              <p>
                Set a strong, secure password to protect your academic portal and student ledger records.
              </p>
            </div>

            {!token && (
              <div className="reset-alert warning-alert" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <div>
                  <strong>Missing Recovery Token</strong>
                  <p>No valid reset token was detected in the URL. Please use the link sent to your email.</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="reset-alert" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="reset-form" onSubmit={handleSubmit}>
              <div className="reset-field-group">
                <label htmlFor="reset-new-password">
                  <Lock size={15} /> New Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter at least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pwd-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Security Requirements Checklist */}
              <div className="password-policy-checklist">
                <div className={`policy-item ${checks.length ? "met" : ""}`}>
                  <span className="policy-dot" /> At least 8 characters
                </div>
                <div className={`policy-item ${checks.upper ? "met" : ""}`}>
                  <span className="policy-dot" /> One uppercase letter
                </div>
                <div className={`policy-item ${checks.lower ? "met" : ""}`}>
                  <span className="policy-dot" /> One lowercase letter
                </div>
                <div className={`policy-item ${checks.number ? "met" : ""}`}>
                  <span className="policy-dot" /> One number
                </div>
              </div>

              <div className="reset-field-group">
                <label htmlFor="reset-confirm-password">
                  <Lock size={15} /> Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${confirmPassword && !checks.match ? "input-mismatch" : ""}`}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {confirmPassword && !checks.match && (
                  <span className="mismatch-hint">Passwords do not match</span>
                )}
              </div>

              <button
                type="submit"
                className="primary-login-btn"
                disabled={loading || !token}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="reset-card-footer">
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
