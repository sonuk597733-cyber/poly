import React, { useState } from "react";
import { Lock, Shield, Bell, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorSettings.css";

export default function CoordinatorSettings({ onNavigate, showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Preference switches
  const [timetableAlerts, setTimetableAlerts] = useState(true);
  const [hallBookingAlerts, setHallBookingAlerts] = useState(true);
  const [attendanceShortageAlerts, setAttendanceShortageAlerts] = useState(true);

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast?.("New password and confirmation do not match.", true);
      return;
    }
    if (newPassword.length < 8) {
      showToast?.("Password must be at least 8 characters.", true);
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast?.("Password updated successfully!");
    } catch (err) {
      showToast?.(err.message || "Failed to update password.", true);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    onNavigate?.("login");
  };

  return (
    <div className="coord-settings-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Account Security & Coordination Preferences</h2>
          <p>
            Manage your credentials, administrative alert triggers, active sessions, and portal preferences.
          </p>
        </div>
      </div>

      <div className="coord-settings-grid">
        {/* Left: Password Update Form */}
        <div className="coord-settings-card">
          <div className="coord-settings-card-header">
            <Lock size={18} color="#0284C7" />
            <div>
              <h3>Update Password</h3>
              <p>Ensure your account uses an 8+ character password with mixed characters.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="coord-settings-form">
            <div className="coord-form-group">
              <label>Current Password</label>
              <div className="coord-pass-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Enter current password..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="coord-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="coord-form-group">
              <label>New Password</label>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="At least 8 characters..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              {newPassword && (
                <div className="coord-strength-block">
                  <div className="coord-strength-meter">
                    <div
                      className={`coord-strength-fill lvl-${strength}`}
                      style={{ width: `${(strength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="coord-strength-text">
                    {strength <= 1 ? "Weak" : strength === 2 ? "Moderate" : strength === 3 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            <div className="coord-form-group">
              <label>Confirm New Password</label>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="Re-enter new password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="coord-save-pass-btn"
              disabled={savingPassword || !currentPassword || !newPassword}
            >
              {savingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Right: Operational Preferences & Active Session */}
        <div className="coord-settings-card">
          <div className="coord-settings-card-header">
            <Bell size={18} color="#059669" />
            <div>
              <h3>Coordination Alert Preferences</h3>
              <p>Configure which automated alerts send email and portal notifications.</p>
            </div>
          </div>

          <div className="coord-toggle-list">
            <div className="coord-toggle-item">
              <div>
                <strong>Timetable Conflict Warnings</strong>
                <p>Instant notification whenever two batches request the same lecture hall.</p>
              </div>
              <input
                type="checkbox"
                checked={timetableAlerts}
                onChange={(e) => setTimetableAlerts(e.target.checked)}
                className="coord-toggle-input"
              />
            </div>

            <div className="coord-toggle-item">
              <div>
                <strong>Facility Booking Sanctions</strong>
                <p>Alerts for seminar hall and computational lab reservations.</p>
              </div>
              <input
                type="checkbox"
                checked={hallBookingAlerts}
                onChange={(e) => setHallBookingAlerts(e.target.checked)}
                className="coord-toggle-input"
              />
            </div>

            <div className="coord-toggle-item">
              <div>
                <strong>Attendance Shortage Flag (&lt;75%)</strong>
                <p>Automated warning when a candidate triggers statutory attendance shortage.</p>
              </div>
              <input
                type="checkbox"
                checked={attendanceShortageAlerts}
                onChange={(e) => setAttendanceShortageAlerts(e.target.checked)}
                className="coord-toggle-input"
              />
            </div>
          </div>

          {/* Active Session & Logout */}
          <div className="coord-session-audit-block">
            <div className="coord-session-info">
              <Shield size={16} color="#0284C7" />
              <div>
                <strong>Active Session: Academic Coordination Terminal</strong>
                <p>Authenticated via Secure HTTP-only Token • IP: 127.0.0.1</p>
              </div>
            </div>

            <button
              type="button"
              className="coord-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Sign Out of CollegeOS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
