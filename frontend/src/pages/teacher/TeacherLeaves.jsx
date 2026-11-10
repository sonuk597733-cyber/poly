import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  XCircle,
  Loader2
} from "lucide-react";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherLeaves.css";

export default function TeacherLeaves({ showToast }) {
  const [leavesList, setLeavesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const leaveDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const fetchLeaves = () => {
    authApi
      .getLeaves()
      .then((res) => {
        setLeavesList(res?.leaves || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const stats = useMemo(() => {
    const total = leavesList.length;
    const approved = leavesList.filter((l) => (l.status || "").toLowerCase() === "approved").length;
    const pending = leavesList.filter(
      (l) => (l.status || "").toLowerCase() === "pending" || !l.status
    ).length;
    const rejected = leavesList.filter((l) => (l.status || "").toLowerCase() === "rejected").length;
    return { total, approved, pending, rejected };
  }, [leavesList]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      showToast?.("Please complete all leave dates and provide a detailed reason.", true);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast?.("Start date cannot be after end date.", true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.applyLeave({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim()
      });
      showToast?.(res.message || "Faculty leave request submitted to Department Head for sanction.");
      setReason("");
      setStartDate("");
      setEndDate("");
      fetchLeaves();
    } catch (err) {
      showToast?.(err.message || "Failed to submit leave request.", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-role-view teacher-leaves-container">
      {/* Page Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <FileText size={24} color="var(--tch-primary)" />
            Faculty Leave & Duty Sanction Requests
          </h2>
          <p>Submit formal duty leave applications for review and administrative approval by Department Head and Principal.</p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="teacher-leaves-stats-grid">
        <div className="tch-card teacher-leave-stat-card">
          <div className="teacher-leave-stat-icon total">
            <FileText size={20} />
          </div>
          <div>
            <span className="teacher-leave-stat-val">{stats.total}</span>
            <span className="teacher-leave-stat-label">Total Submissions</span>
          </div>
        </div>

        <div className="tch-card teacher-leave-stat-card">
          <div className="teacher-leave-stat-icon approved">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="teacher-leave-stat-val">{stats.approved}</span>
            <span className="teacher-leave-stat-label">Sanctioned</span>
          </div>
        </div>

        <div className="tch-card teacher-leave-stat-card">
          <div className="teacher-leave-stat-icon pending">
            <Clock size={20} />
          </div>
          <div>
            <span className="teacher-leave-stat-val">{stats.pending}</span>
            <span className="teacher-leave-stat-label">Awaiting Review</span>
          </div>
        </div>

        <div className="tch-card teacher-leave-stat-card">
          <div className="teacher-leave-stat-icon rejected">
            <XCircle size={20} />
          </div>
          <div>
            <span className="teacher-leave-stat-val">{stats.rejected}</span>
            <span className="teacher-leave-stat-label">Declined</span>
          </div>
        </div>
      </div>

      {/* Layout Grid: Form on Left, History Ledger on Right */}
      <div className="teacher-leaves-layout-grid">
        {/* Form Card */}
        <div className="tch-card teacher-leave-form-card">
          <div className="tch-pane-header" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8, color: "var(--tch-text-primary)" }}>
              <Calendar size={18} color="var(--tch-primary)" /> Submit Leave Request
            </h3>
          </div>

          <form onSubmit={handleApplyLeave}>
            <div style={{ marginBottom: 14 }}>
              <label className="tch-label">Leave Classification</label>
              <select
                className="tch-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="Casual">Casual Leave</option>
                <option value="Academic / Duty">Academic / Duty Leave (Conference / Colloquium)</option>
                <option value="Medical">Medical Leave</option>
                <option value="Personal">Personal Emergency</option>
              </select>
            </div>

            <div className="teacher-date-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label className="tch-label">From Date</label>
                <input
                  type="date"
                  className="tch-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="tch-label">Till Date</label>
                <input
                  type="date"
                  className="tch-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {leaveDays > 0 && (
              <div style={{ marginBottom: 14 }}>
                <span className="tch-pill cyan">
                  <Clock size={12} />
                  Requested Duration: {leaveDays} Academic Day{leaveDays !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="tch-label">Reason / Purpose of Absence</label>
              <textarea
                rows={3}
                className="tch-textarea"
                placeholder="State the conference, academic duty, or medical necessity..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="tch-btn-primary"
              disabled={submitting}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              <span>{submitting ? "Transmitting..." : "Submit to Department Head"}</span>
            </button>
          </form>
        </div>

        {/* History Ledger Card */}
        <div className="tch-card teacher-leave-history-card">
          <div className="tch-pane-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--tch-text-primary)" }}>
                Faculty Leave History
              </h3>
              <p>{leavesList.length} application(s) recorded in current academic year</p>
            </div>
          </div>

          <div className="tch-table-wrap">
            <table className="tch-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Dates & Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Authority Review</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "36px 16px", color: "var(--tch-text-secondary)" }}>
                      Loading leave applications...
                    </td>
                  </tr>
                ) : leavesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px" }}>
                      <div className="tch-empty-box" style={{ border: "none", padding: 0 }}>
                        <FileText size={36} style={{ opacity: 0.6 }} />
                        <h3>No Leave Requests Filed</h3>
                        <p>Use the form to submit formal leave or duty applications to the Department Head.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leavesList.map((l) => (
                    <tr key={l._id || l.id}>
                      <td>
                        <span className="tch-pill blue">{l.leaveType}</span>
                      </td>
                      <td>
                        <strong style={{ color: "var(--tch-text-primary)" }}>
                          {new Date(l.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}{" "}
                          –{" "}
                          {new Date(l.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--tch-text-secondary)" }}>
                          {l.reason}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={l.status || "pending"} />
                      </td>
                      <td>
                        <span style={{ fontSize: "0.82rem", color: "var(--tch-text-muted)" }}>
                          {l.comments ||
                            (l.status === "approved"
                              ? "Sanctioned by HOD"
                              : l.status === "rejected"
                              ? "Declined"
                              : "Awaiting Review")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
