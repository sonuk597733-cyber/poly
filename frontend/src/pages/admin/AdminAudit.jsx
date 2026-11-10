import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, CheckCircle2, Search, Filter, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./AdminDashboard.css";

export default function AdminAudit({ currentUser, showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    authApi
      .getAuditLogs()
      .then((res) => {
        if (!isMounted) return;
        setLogs(res?.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load audit logs:", err);
        showToast?.(err.message || "Failed to load audit logs", true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = logs.filter((l) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = (l.actorName || "").toLowerCase().includes(q);
      const matchAction = (l.action || "").toLowerCase().includes(q);
      const matchRes = (l.targetResource || "").toLowerCase().includes(q);
      return matchActor || matchAction || matchRes;
    }
    return true;
  });

  return (
    <div className="admin-dash-container">
      <div className="pane-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
            Enterprise Security Audit & Access Logs
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
            Immutable administrative audit logs documenting role actions, login attempts, and database alterations.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search by actor, action, or resource..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.85rem", width: 280 }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 20 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Actor Identity</th>
                <th>Role</th>
                <th>Action Triggered</th>
                <th>Resource Target</th>
                <th>Timestamp</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr key={log.id || log._id || idx}>
                  <td>
                    <strong>{log.actorName || "Authenticated User"}</strong>
                  </td>
                  <td>
                    <span style={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F1F5F9" }}>
                      {log.actorRole || "user"}
                    </span>
                  </td>
                  <td>
                    <code className="action-code">{log.action || "ACCESS_GRANTED"}</code>
                  </td>
                  <td>{log.targetResource || "CollegeOS Gateway"}</td>
                  <td>{new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}</td>
                  <td>
                    <span className="status-pill success">
                      <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
                      {log.status || "SUCCESS"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
