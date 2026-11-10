import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, User, Calendar, Loader2, Filter, AlertCircle, ShieldCheck } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODLeaves.css";

export default function HODLeaves({ showToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeaves = () => {
    setLoading(true);
    authApi
      .getLeaves()
      .then((res) => {
        setLeaves(res?.leaves || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load leaves:", err);
        setLeaves([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await authApi.updateLeaveStatus(id, { status });
      showToast?.(`Leave application marked as ${status.toUpperCase()}.`);
      fetchLeaves();
    } catch (err) {
      showToast?.(err.message || `Failed to update leave status.`, true);
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length;

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === "all") return true;
    return l.status === statusFilter;
  });

  return (
    <div className="hod-role-view hod-leaves-container">
      {/* Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <Clock size={24} color="var(--hod-primary)" />
            Department Leave Sanction & Executive Approvals
          </h2>
          <p>Review faculty duty leaves and student medical requests. Sanctions update the attendance ledger in real time.</p>
        </div>

        <div className="hod-pill amber" style={{ padding: "8px 16px", fontSize: "0.86rem" }}>
          <Clock size={15} />
          <span>{pendingCount} Pending Sanctions</span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="hod-leaves-stats-grid">
        <div className="hod-card hod-leave-stat-card">
          <span className="hod-leave-stat-label">Pending Reviews</span>
          <div className="hod-leave-stat-val" style={{ color: "var(--hod-amber)" }}>
            {pendingCount}
          </div>
          <span className="hod-leave-stat-sub">Requires executive action</span>
        </div>

        <div className="hod-card hod-leave-stat-card">
          <span className="hod-leave-stat-label">Sanctioned & Approved</span>
          <div className="hod-leave-stat-val" style={{ color: "var(--hod-emerald)" }}>
            {approvedCount}
          </div>
          <span className="hod-leave-stat-sub">Excused on official record</span>
        </div>

        <div className="hod-card hod-leave-stat-card">
          <span className="hod-leave-stat-label">Declined / Rejected</span>
          <div className="hod-leave-stat-val" style={{ color: "var(--hod-rose)" }}>
            {rejectedCount}
          </div>
          <span className="hod-leave-stat-sub">Non-compliant requests</span>
        </div>

        <div className="hod-card hod-leave-stat-card">
          <span className="hod-leave-stat-label">Total Applications</span>
          <div className="hod-leave-stat-val" style={{ color: "var(--hod-primary)" }}>
            {leaves.length}
          </div>
          <span className="hod-leave-stat-sub">Processed this term</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="hod-leaves-filter-tabs">
        <button
          type="button"
          className={`hod-leave-tab ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All Requests ({leaves.length})
        </button>
        <button
          type="button"
          className={`hod-leave-tab ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          Pending Sanctions ({pendingCount})
        </button>
        <button
          type="button"
          className={`hod-leave-tab ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          Sanctioned ({approvedCount})
        </button>
        <button
          type="button"
          className={`hod-leave-tab ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => setStatusFilter("rejected")}
        >
          Declined ({rejectedCount})
        </button>
      </div>

      {/* Table / Queue */}
      <div className="hod-card">
        <div className="hod-leaves-table-header">
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "var(--hod-text-primary)" }}>
              Department Sanction Ledger
            </h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--hod-text-secondary)" }}>
              Showing {filteredLeaves.length} applications in selected view
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--hod-text-secondary)" }}>
            <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
            <p>Loading application sanction queue...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="hod-empty-box" style={{ marginTop: 16 }}>
            <CheckCircle2 size={40} style={{ opacity: 0.5, color: "var(--hod-emerald)" }} />
            <h3>No Leave Applications</h3>
            <p>
              {statusFilter === "pending"
                ? "All leave requests in your department have been reviewed and sanctioned."
                : "No leave applications found under this filter."}
            </p>
          </div>
        ) : (
          <div className="hod-table-wrap" style={{ marginTop: 16 }}>
            <table className="hod-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Leave Type</th>
                  <th>Duration (From – To)</th>
                  <th>Reason / Justification</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: "right" }}>Executive Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((l) => {
                  const applicant =
                    l.applicantName ||
                    l.studentId?.fullName ||
                    l.userId?.fullName ||
                    "Faculty / Student Member";
                  const applicantRole = l.applicantRole || (l.studentId ? "Student" : "Faculty");
                  const isUpdating = updatingId === (l._id || l.id);

                  // Calculate days
                  const start = new Date(l.startDate);
                  const end = new Date(l.endDate);
                  const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

                  return (
                    <tr key={l._id || l.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="hod-leave-avatar">
                            <User size={15} />
                          </div>
                          <div>
                            <strong style={{ color: "var(--hod-text-primary)" }}>{applicant}</strong>
                            <div style={{ fontSize: "0.78rem", color: "var(--hod-text-muted)" }}>
                              Role: {applicantRole}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="hod-pill indigo">{l.leaveType || "Casual Leave"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>
                            {start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                            {end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                          <span style={{ fontSize: "0.76rem", color: "var(--hod-text-muted)" }}>
                            {diffDays} day{diffDays > 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--hod-text-secondary)" }}>
                          "{l.reason}"
                        </span>
                      </td>
                      <td>
                        <span
                          className={`hod-pill ${
                            l.status === "approved" ? "emerald" : l.status === "rejected" ? "rose" : "amber"
                          }`}
                        >
                          {l.status ? l.status.toUpperCase() : "PENDING"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {l.status === "pending" ? (
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="hod-btn-success"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(l._id || l.id, "approved")}
                            >
                              <CheckCircle2 size={13} />
                              <span>{isUpdating ? "..." : "Sanction"}</span>
                            </button>
                            <button
                              type="button"
                              className="hod-btn-danger"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(l._id || l.id, "rejected")}
                            >
                              <XCircle size={13} />
                              <span>{isUpdating ? "..." : "Decline"}</span>
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`hod-pill ${l.status === "approved" ? "emerald" : "rose"}`}
                          >
                            <ShieldCheck size={12} />
                            {l.status === "approved" ? "Sanctioned" : "Declined"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
