import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Building2,
  Activity,
  Server,
  Database,
  Lock,
  UserCog,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import { authApi } from "../../services/authApi";
import "./AdminDashboard.css";

export default function AdminDashboard({
  currentUser,
  stats,
  charts,
  onNavigate,
  setActiveTab
}) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  useEffect(() => {
    let isMounted = true;
    authApi
      .getAuditLogs()
      .then((res) => {
        if (!isMounted) return;
        setAuditLogs(res?.logs || []);
        setLoadingAudit(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load audit logs:", err);
        setLoadingAudit(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = stats?.summary || {};

  return (
    <div className="admin-dash-container">
      {/* Welcome Banner */}
      <div className="admin-welcome-banner">
        <div className="admin-badge-pill">
          <ShieldCheck size={14} />
          <span>CollegeOS Master Administration Gateway • Subharti University</span>
        </div>

        <h1 className="admin-welcome-title">
          System Console: {currentUser?.fullName || "Administrator"}
        </h1>

        <p className="admin-welcome-sub">
          Enterprise operational oversight, role-based security enforcement, database integrity, and institutional audit trail.
        </p>

        <div className="admin-welcome-actions">
          <button
            type="button"
            className="admin-action-btn primary"
            onClick={() => setActiveTab?.("users")}
          >
            <UserCog size={16} />
            <span>Manage User Directory</span>
          </button>
          <button
            type="button"
            className="admin-action-btn secondary"
            onClick={() => setActiveTab?.("roles")}
          >
            <ShieldCheck size={16} />
            <span>RBAC Matrix</span>
          </button>
          <button
            type="button"
            className="admin-action-btn secondary"
            onClick={() => setActiveTab?.("audit")}
          >
            <Activity size={16} />
            <span>Security Audit Trail</span>
          </button>
          <button
            type="button"
            className="admin-action-btn secondary"
            onClick={() => setActiveTab?.("settings")}
          >
            <Server size={16} />
            <span>System Settings</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-kpi-grid">
        <StatCard
          title="Total User Accounts"
          value={summary.totalUsers || 140}
          subtitle="Students, Faculty, HODs, Execs"
          icon={Users}
          accentColor="#2563EB"
          trend="Active"
          trendType="up"
          onClick={() => setActiveTab?.("users")}
        />
        <StatCard
          title="Monitored Candidates"
          value={summary.totalStudents || 120}
          subtitle="Enrolled across 5 departments"
          icon={Users}
          accentColor="#059669"
          trend="Verified"
          trendType="up"
          onClick={() => setActiveTab?.("users")}
        />
        <StatCard
          title="Instructional Faculty"
          value={summary.totalFaculty || 14}
          subtitle="Permanent & Adjunct Lecturers"
          icon={UserCog}
          accentColor="#7C3AED"
          trend="Full Cadre"
          trendType="up"
          onClick={() => setActiveTab?.("users")}
        />
        <StatCard
          title="Server Health & Uptime"
          value="99.98%"
          subtitle="MongoDB Atlas • Express Node.js"
          icon={Server}
          accentColor="#0284C7"
          trend="Operational"
          trendType="up"
          onClick={() => setActiveTab?.("settings")}
        />
      </div>

      {/* Recent Security Audit Logs Section */}
      <div className="admin-audit-section">
        <div className="admin-audit-header">
          <div>
            <h3>Enterprise Access Audit Trail</h3>
            <p>Live immutable ledger of authentication and privilege changes</p>
          </div>
          <button
            type="button"
            className="admin-link-btn"
            onClick={() => setActiveTab?.("audit")}
          >
            View All Audit Logs <ArrowRight size={14} />
          </button>
        </div>

        {loadingAudit ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 size={30} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div className="admin-audit-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Actor & Identity</th>
                  <th>Action</th>
                  <th>Resource Target</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 5).map((log, idx) => (
                  <tr key={log.id || log._id || idx}>
                    <td>
                      <strong>{log.actorName || "System Worker"}</strong>
                      <div className="mono-sub">{log.actorRole || "system"}</div>
                    </td>
                    <td>
                      <code className="action-code">{log.action || "ACCESS_GRANTED"}</code>
                    </td>
                    <td>{log.targetResource || "CollegeOS Core API"}</td>
                    <td>{new Date(log.timestamp || log.createdAt || Date.now()).toLocaleTimeString()}</td>
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
    </div>
  );
}
