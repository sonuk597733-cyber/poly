import React, { useState } from "react";
import { User, Mail, ShieldCheck, Key, LogOut, CheckCircle2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./AdminDashboard.css";

export default function AdminProfile({ currentUser, onNavigate, showToast }) {
  const [fullName, setFullName] = useState(currentUser?.fullName || "System Administrator");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfile({ fullName });
      showToast?.("Admin profile updated successfully!");
    } catch (err) {
      showToast?.(err.message || "Failed to update profile", true);
    } finally {
      setSavingProfile(false);
    }
  };

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
    setSavingPass(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast?.("Administrator credentials updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast?.(err.message || "Failed to change password", true);
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="admin-dash-container">
      <div className="pane-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
          Administrator Profile & Root Security
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
          Superuser account credentials, security contact, and session authentication tokens.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} color="#2563EB" /> Root Profile Information
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                Admin Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                Official Email
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || "admin@subharti.edu.in"}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                Superuser Role
              </label>
              <input
                type="text"
                disabled
                value="System Administrator (Root Privileges)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B" }}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
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
              {savingProfile ? "Saving..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                Confirm Password
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
              disabled={savingPass}
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
              {savingPass ? "Updating..." : "Update Root Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
