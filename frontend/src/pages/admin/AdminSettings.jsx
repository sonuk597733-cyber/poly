import React, { useState, useEffect } from "react";
import { Server, Settings, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./AdminDashboard.css";

export default function AdminSettings({ currentUser, showToast }) {
  const [settings, setSettings] = useState({
    admissions_open: "true",
    attendance_min_threshold: "75",
    current_academic_session: "2025-2026",
    maintenance_mode: "false"
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    authApi
      .getSettings()
      .then((res) => {
        if (!isMounted) return;
        const setMap = {};
        (res?.settings || []).forEach((s) => {
          setMap[s.key] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...setMap }));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load settings:", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = async (key, val) => {
    setSavingKey(key);
    try {
      await authApi.updateSetting(key, val);
      setSettings((prev) => ({ ...prev, [key]: val }));
      showToast?.(`Setting "${key}" updated successfully!`);
    } catch (err) {
      showToast?.(err.message || "Failed to update setting", true);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="admin-dash-container">
      <div className="pane-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
          System Key-Value Configuration & Environment
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
          Live institutional runtime flags persisted in MongoDB Atlas `system_settings` collection.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>Online Admissions Portal</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#64748B" }}>
              Controls new diploma candidate self-registration on the public portal.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                value={settings.admissions_open}
                onChange={(e) => handleUpdate("admissions_open", e.target.value)}
                disabled={savingKey === "admissions_open"}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
              >
                <option value="true">Open (Accepting Applications)</option>
                <option value="false">Closed (Admissions Finished)</option>
              </select>
              {savingKey === "admissions_open" && <Loader2 size={16} className="animate-spin" />}
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>Minimum Attendance Threshold</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#64748B" }}>
              Statutory attendance percentage required for examination hall ticket issuance.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                value={settings.attendance_min_threshold}
                onChange={(e) => handleUpdate("attendance_min_threshold", e.target.value)}
                disabled={savingKey === "attendance_min_threshold"}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
              >
                <option value="75">75% (AICTE / BTEUP Standard)</option>
                <option value="70">70% (Relaxed Threshold)</option>
                <option value="80">80% (Strict Academic Rule)</option>
              </select>
              {savingKey === "attendance_min_threshold" && <Loader2 size={16} className="animate-spin" />}
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>Current Academic Session</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#64748B" }}>
              Active academic year tag used across transcripts, timetable, and fee ledgers.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="text"
                defaultValue={settings.current_academic_session}
                onBlur={(e) => handleUpdate("current_academic_session", e.target.value)}
                disabled={savingKey === "current_academic_session"}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.9rem", width: 140 }}
              />
              {savingKey === "current_academic_session" && <Loader2 size={16} className="animate-spin" />}
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>System Maintenance Mode</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#64748B" }}>
              Locks student and faculty logins while database backup or migrations are running.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                value={settings.maintenance_mode}
                onChange={(e) => handleUpdate("maintenance_mode", e.target.value)}
                disabled={savingKey === "maintenance_mode"}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
              >
                <option value="false">Disabled (Full Campus Access)</option>
                <option value="true">Enabled (Maintenance Lockout)</option>
              </select>
              {savingKey === "maintenance_mode" && <Loader2 size={16} className="animate-spin" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
