import React, { useState } from "react";
import { ShieldCheck, Key, LogOut, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalDashboard.css";

export default function PrincipalSettings({ currentUser, onNavigate, showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast?.("New passwords do not match", true);
      return;
    }
    if (newPassword.length < 6) {
      showToast?.("Password must be at least 6 characters", true);
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast?.("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast?.(err.message || "Failed to update password", true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    if (onNavigate) {
      onNavigate("login");
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="prin-dash-container">
      <div className="pane-header-row" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
          Principal Account Security & Credentials
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
          Manage your executive login security, password changes, and active portal sessions.
        </p>
      </div>

      <div style={{ maxWidth: 520, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
          <Key size={18} color="#2563EB" /> Update Password
        </h3>

        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {saving ? "Updating..." : "Save New Password"}
          </button>
        </form>
      </div>

      <div style={{ maxWidth: 520, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", padding: 24 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#DC2626", display: "flex", alignItems: "center", gap: 8 }}>
          <LogOut size={18} /> Sign Out of CollegeOS
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#64748B" }}>
          End your active authenticated session across this workstation.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            background: "#FEE2E2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Sign Out Now
        </button>
      </div>
    </div>
  );
}
