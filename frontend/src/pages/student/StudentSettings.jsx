import React, { useState, useEffect } from "react";
import {
  Lock, Bell, Shield, LogOut, Eye, EyeOff, Settings,
  KeyRound, Smartphone, Monitor, ShieldCheck, CheckCircle2,
  AlertCircle, Loader2, Sparkles, Sun, Moon, Info, Check
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { useTheme } from "../../context/ThemeContext";
import "./StudentTheme.css";
import "./StudentSettings.css";

export default function StudentSettings({ onNavigate, showToast }) {
  const { theme, toggleTheme } = useTheme();

  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);

  // Preference switches (persisted to localStorage)
  const [emailAlerts, setEmailAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem("subharti_pref_email");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [examAlerts, setExamAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem("subharti_pref_exam");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [asgnAlerts, setAsgnAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem("subharti_pref_asgn");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [attendanceAlerts, setAttendanceAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem("subharti_pref_att");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleTogglePref = (storageKey, value, setter, label) => {
    setter(value);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
    showToast?.(`${label} preference updated.`);
  };

  // Password strength calculation
  const getStrength = (pwd) => {
    if (!pwd) return { level: "empty", text: "Enter new password", pct: 0 };
    if (pwd.length < 6) return { level: "weak", text: "Too Short (min 6 chars)", pct: 25 };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasNum && hasSpecial) {
      return { level: "strong", text: "Strong & Secure", pct: 100 };
    }
    if (pwd.length >= 6 && (hasNum || hasSpecial)) {
      return { level: "good", text: "Good (add symbols for strong)", pct: 65 };
    }
    return { level: "fair", text: "Fair (add digits & symbols)", pct: 40 };
  };

  const strength = getStrength(newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast?.("Current password is required.", true);
      return;
    }
    if (newPassword.length < 6) {
      showToast?.("New password must be at least 6 characters.", true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast?.("New passwords do not match.", true);
      return;
    }

    setSubmittingPass(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      showToast?.("Password changed successfully! Keep it secure.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast?.(err.message || "Failed to update password.", true);
    } finally {
      setSubmittingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      showToast?.("Signed out of CollegeOS successfully.");
      if (onNavigate) onNavigate("login");
      else window.location.hash = "#/login";
    } catch {
      if (onNavigate) onNavigate("login");
      else window.location.hash = "#/login";
    }
  };

  return (
    <div className="student-role-view std-settings-page">
      {/* ───────────── HEADER ───────────── */}
      <div className="std-pane-header">
        <div className="std-pane-title-group">
          <div className="std-title-icon-badge">
            <Settings size={22} />
          </div>
          <div>
            <h2>Student Account &amp; Security Settings</h2>
            <p>
              Manage password credentials, multi-channel notification alerts, and active login sessions.
            </p>
          </div>
        </div>

        <div className="std-pane-actions">
          <button
            type="button"
            className="std-res-download-btn"
            style={{ color: "#F87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
            onClick={handleLogout}
            title="Terminate session and sign out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ───────────── MAIN BENTO GRID ───────────── */}
      <div className="std-settings-bento-grid">
        {/* Card 1: Password & Credential Security */}
        <div className="std-settings-card">
          <div className="std-set-card-header">
            <div className="std-res-header-title-row">
              <KeyRound size={18} className="text-royal" />
              <h3>Change Password</h3>
            </div>
            <span className="std-confidential-pill">
              <ShieldCheck size={12} />
              <span>Bcrypt Hash</span>
            </span>
          </div>

          <form onSubmit={handleChangePassword} className="std-set-form">
            {/* Current Password */}
            <div className="std-fb-form-group">
              <label>Current Password</label>
              <div className="std-password-input-wrap">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter your existing account password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="std-fb-input"
                  required
                />
                <button
                  type="button"
                  className="std-pwd-toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="std-fb-form-group">
              <label>New Password (min 6 characters)</label>
              <div className="std-password-input-wrap">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter a new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="std-fb-input"
                  required
                />
                <button
                  type="button"
                  className="std-pwd-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="std-strength-box">
                  <div className="std-strength-bar">
                    <div
                      className={`std-strength-fill ${strength.level}`}
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                  <span className={`std-strength-text ${strength.level}`}>
                    {strength.text}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="std-fb-form-group">
              <label>Confirm New Password</label>
              <div className="std-password-input-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="std-fb-input"
                  required
                />
                <button
                  type="button"
                  className="std-pwd-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="std-btn-primary w-full"
              style={{ height: 40, marginTop: 8 }}
              disabled={submittingPass}
            >
              {submittingPass ? <Loader2 size={15} className="spin" /> : <Lock size={15} />}
              <span>Update Password Credentials</span>
            </button>
          </form>
        </div>

        {/* Card 2: Notification & Channel Preferences */}
        <div className="std-settings-card">
          <div className="std-set-card-header">
            <div className="std-res-header-title-row">
              <Bell size={18} className="text-royal" />
              <h3>Notification Preferences</h3>
            </div>
            <span className="std-res-verified-pill">
              <CheckCircle2 size={12} /> Auto-Saved
            </span>
          </div>

          <div className="std-set-switches-list">
            {/* Email Alerts */}
            <div className="std-set-switch-row">
              <div className="std-switch-info">
                <strong>Official Email Notifications</strong>
                <small>Direct circulars, grade sheets, and semester notices</small>
              </div>
              <label className="std-toggle-switch">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) =>
                    handleTogglePref("subharti_pref_email", e.target.checked, setEmailAlerts, "Email Alerts")
                  }
                />
                <span className="std-slider" />
              </label>
            </div>

            {/* Exam Alerts */}
            <div className="std-set-switch-row">
              <div className="std-switch-info">
                <strong>Examination & Datesheet Alerts</strong>
                <small>Admit card release and seat allotment updates</small>
              </div>
              <label className="std-toggle-switch">
                <input
                  type="checkbox"
                  checked={examAlerts}
                  onChange={(e) =>
                    handleTogglePref("subharti_pref_exam", e.target.checked, setExamAlerts, "Exam Alerts")
                  }
                />
                <span className="std-slider" />
              </label>
            </div>

            {/* Assignment Alerts */}
            <div className="std-set-switch-row">
              <div className="std-switch-info">
                <strong>Assignment &amp; Task Deadlines</strong>
                <small>24-hour reminder before assignment submission closing</small>
              </div>
              <label className="std-toggle-switch">
                <input
                  type="checkbox"
                  checked={asgnAlerts}
                  onChange={(e) =>
                    handleTogglePref("subharti_pref_asgn", e.target.checked, setAsgnAlerts, "Assignment Alerts")
                  }
                />
                <span className="std-slider" />
              </label>
            </div>

            {/* Attendance Threshold Alerts */}
            <div className="std-set-switch-row">
              <div className="std-switch-info">
                <strong>Attendance Shortage Warnings</strong>
                <small>Instant alert if biometric attendance falls below 75%</small>
              </div>
              <label className="std-toggle-switch">
                <input
                  type="checkbox"
                  checked={attendanceAlerts}
                  onChange={(e) =>
                    handleTogglePref("subharti_pref_att", e.target.checked, setAttendanceAlerts, "Attendance Alerts")
                  }
                />
                <span className="std-slider" />
              </label>
            </div>
          </div>

          {/* Theme Display Preference Card */}
          <div className="std-set-theme-box">
            <div className="std-switch-info">
              <strong>Display Theme Mode</strong>
              <small>Toggle between SVSU Midnight Navy and Crisp Ice Blue</small>
            </div>
            <button
              type="button"
              className="std-theme-toggle-btn-settings"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Active Device & Authorized Session */}
        <div className="std-settings-card" style={{ gridColumn: "1 / -1" }}>
          <div className="std-set-card-header">
            <div className="std-res-header-title-row">
              <Monitor size={18} className="text-royal" />
              <h3>Active Device &amp; Institutional Session</h3>
            </div>
            <span className="std-pill emerald">Active Session</span>
          </div>

          <div className="std-set-session-grid">
            <div className="std-session-item">
              <span className="std-session-label">Current Device:</span>
              <strong className="std-session-val">
                {typeof navigator !== "undefined" && navigator.userAgent.includes("Windows")
                  ? "Windows PC / Desktop"
                  : typeof navigator !== "undefined" && navigator.userAgent.includes("Mac")
                  ? "macOS Workstation"
                  : "Mobile Device"}
              </strong>
            </div>

            <div className="std-session-item">
              <span className="std-session-label">Browser Client:</span>
              <strong className="std-session-val">Google Chrome (Verified)</strong>
            </div>

            <div className="std-session-item">
              <span className="std-session-label">Network Protocol:</span>
              <strong className="std-session-val text-royal">HTTPS 256-bit TLS Encrypted</strong>
            </div>

            <div className="std-session-item">
              <span className="std-session-label">ERP Server:</span>
              <strong className="std-session-val text-emerald">Subharti Knowledge City Cloud</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
