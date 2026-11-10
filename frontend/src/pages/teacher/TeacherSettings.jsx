import React, { useState } from "react";
import { Lock, Bell, Shield, LogOut, Eye, EyeOff, CheckCircle2, ShieldCheck, KeyRound } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherSettings.css";

export default function TeacherSettings({ onNavigate, showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);

  // Preference switches
  const [subAlerts, setSubAlerts] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [deptAlerts, setDeptAlerts] = useState(true);

  const getStrength = (pwd) => {
    if (!pwd) return { level: "", text: "", width: "0%", color: "" };
    if (pwd.length < 6) return { level: "weak", text: "Too Short (minimum 6 chars)", width: "30%", color: "var(--tch-rose)" };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasNum && hasSpecial) {
      return { level: "strong", text: "Strong Security Password", width: "100%", color: "var(--tch-emerald)" };
    }
    return { level: "fair", text: "Fair (Add numbers & symbols)", width: "65%", color: "var(--tch-amber)" };
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
      showToast?.("Faculty account password changed successfully!");
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
    } finally {
      onNavigate?.("login");
    }
  };

  return (
    <div className="teacher-role-view teacher-set-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <Lock size={24} color="var(--tch-primary)" />
            Faculty Security & Portal Preferences
          </h2>
          <p>Manage authenticated credentials, evaluation notifications, and institutional session controls.</p>
        </div>
      </div>

      <div className="teacher-set-grid">
        {/* Left Column: Password Change Form */}
        <div className="tch-card teacher-set-card">
          <div className="teacher-set-card-header">
            <div className="teacher-set-icon-box blue">
              <KeyRound size={20} />
            </div>
            <div>
              <h3>Security & Credentials</h3>
              <p>Protect your faculty grading and attendance portal with a secure password.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="teacher-set-form">
            <div className="teacher-form-field">
              <label className="tch-label">Current Password</label>
              <div className="teacher-input-wrap">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="tch-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="teacher-eye-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex="-1"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="teacher-form-field">
              <label className="tch-label">New Password</label>
              <div className="teacher-input-wrap">
                <input
                  type={showNew ? "text" : "password"}
                  className="tch-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
                <button
                  type="button"
                  className="teacher-eye-btn"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex="-1"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {strength.level && (
                <div className="teacher-strength-container">
                  <div className="teacher-strength-track">
                    <div
                      className="teacher-strength-bar"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span className="teacher-strength-text" style={{ color: strength.color }}>
                    {strength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="teacher-form-field">
              <label className="tch-label">Confirm New Password</label>
              <input
                type="password"
                className="tch-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
              />
            </div>

            <button
              type="submit"
              className="tch-btn-primary"
              disabled={submittingPass}
              style={{ width: "100%", marginTop: 8 }}
            >
              <Lock size={15} />
              <span>{submittingPass ? "Updating Credentials..." : "Update Password"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Preferences & Session Control */}
        <div className="teacher-set-col-right">
          {/* Notification Preferences */}
          <div className="tch-card teacher-set-card">
            <div className="teacher-set-card-header">
              <div className="teacher-set-icon-box emerald">
                <Bell size={20} />
              </div>
              <div>
                <h3>Notification Preferences</h3>
                <p>Customize automated alerts and event notifications.</p>
              </div>
            </div>

            <div className="teacher-pref-list">
              <label className="teacher-pref-item">
                <div className="teacher-pref-info">
                  <span className="teacher-pref-title">Student Coursework Submissions</span>
                  <span className="teacher-pref-desc">Instant alerts when students submit lab tasks or project files.</span>
                </div>
                <input
                  type="checkbox"
                  checked={subAlerts}
                  onChange={(e) => {
                    setSubAlerts(e.target.checked);
                    showToast?.("Preferences updated.");
                  }}
                  className="teacher-pref-toggle"
                />
              </label>

              <label className="teacher-pref-item">
                <div className="teacher-pref-info">
                  <span className="teacher-pref-title">Examination Cell Deadlines</span>
                  <span className="teacher-pref-desc">Alerts for question paper submission and grade freeze dates.</span>
                </div>
                <input
                  type="checkbox"
                  checked={examAlerts}
                  onChange={(e) => {
                    setExamAlerts(e.target.checked);
                    showToast?.("Preferences updated.");
                  }}
                  className="teacher-pref-toggle"
                />
              </label>

              <label className="teacher-pref-item">
                <div className="teacher-pref-info">
                  <span className="teacher-pref-title">Department Council Circulars</span>
                  <span className="teacher-pref-desc">HOD announcements, faculty review schedules, and college memos.</span>
                </div>
                <input
                  type="checkbox"
                  checked={deptAlerts}
                  onChange={(e) => {
                    setDeptAlerts(e.target.checked);
                    showToast?.("Preferences updated.");
                  }}
                  className="teacher-pref-toggle"
                />
              </label>
            </div>
          </div>

          {/* Session & Sign Out Card */}
          <div className="tch-card teacher-set-card">
            <div className="teacher-set-card-header">
              <div className="teacher-set-icon-box amber">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3>Authorized Faculty Session</h3>
                <p>Protected by CollegeOS multi-layer role-based access control.</p>
              </div>
            </div>

            <div className="teacher-session-body">
              <div className="teacher-session-meta">
                <span className="tch-pill blue">Role: Faculty / Lecturer</span>
                <span className="tch-pill emerald">Active Session</span>
              </div>
              <p className="teacher-session-note">
                Ensure you log out when accessing the portal from shared departmental laboratory workstations.
              </p>

              <button
                type="button"
                className="tch-btn-secondary teacher-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Log Out of CollegeOS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
