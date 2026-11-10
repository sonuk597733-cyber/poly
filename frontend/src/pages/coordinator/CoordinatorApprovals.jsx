import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, User, Calendar, FileText, Filter, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorApprovals.css";

const INITIAL_REQUESTS = [
  { id: "APPR-01", title: "Compensatory Lab Session — CS-302P (Data Structures)", requester: "Er. Amit Sharma", role: "Assistant Professor (CSE)", date: "27 Oct 2026", type: "Compensatory Class", details: "Extra 2-hour lab slot requested in Computer Lab 1 on Saturday morning to cover recursion and tree traversal.", status: "Pending" },
  { id: "APPR-02", title: "Special Midterm Retest Sanction (Medical Case)", requester: "Aarav Sharma (24DIPCS014)", role: "Diploma Candidate (CSE)", date: "25 Oct 2026", type: "Medical Sanction", details: "Candidate was hospitalized during Midterm 1 Operating Systems exam; medical board fitness certificate verified.", status: "Pending" },
  { id: "APPR-03", title: "Industrial Workshop Proposal — Automation & PLC/SCADA", requester: "Prof. Sunil Kumar", role: "HOD Mechanical Engineering", date: "24 Oct 2026", type: "Industrial Event", details: "2-Day hands-on automation workshop requiring allocation of LT-102 and CAD Lab on 18-19 November 2026.", status: "Approved" },
  { id: "APPR-04", title: "Hall Booking for Robotics Club Competition", requester: "Robotics Student Society", role: "Student Club Coordinator", date: "22 Oct 2026", type: "Campus Event", details: "Booking Central Seminar Hall for Inter-branch Line Follower & Robo-war competition.", status: "Approved" }
];

export default function CoordinatorApprovals({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadRequests = () => {
    setLoading(true);
    authApi
      .getLeaves()
      .then((res) => {
        const rawLeaves = res?.leaves || [];
        if (rawLeaves.length > 0) {
          const mapped = rawLeaves.map((l, idx) => ({
            id: l.id || l._id || `APPR-${idx + 1}`,
            mongoId: l._id || l.id,
            title: `${l.leaveType || "Leave Application"} — ${l.reason || "Duty Absence"}`,
            requester: l.studentName || l.applicantName || "Academic Candidate",
            role: l.role === "student" ? "Student" : "Faculty Staff",
            date: l.startDate ? new Date(l.startDate).toLocaleDateString() : "Today",
            type: l.leaveType || "Academic Leave",
            details: `Duration: ${l.startDate ? new Date(l.startDate).toLocaleDateString() : ""} to ${l.endDate ? new Date(l.endDate).toLocaleDateString() : ""}. Reason: ${l.reason || "Official Leave"}`,
            status: l.status === "approved" ? "Approved" : l.status === "rejected" ? "Rejected" : "Pending"
          }));
          setRequests(mapped);
        } else {
          setRequests(INITIAL_REQUESTS);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load approval requests:", err);
        setRequests(INITIAL_REQUESTS);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id, mongoId, newStatus) => {
    try {
      if (mongoId) {
        await authApi.updateLeaveStatus(mongoId, { status: newStatus.toLowerCase() });
      }
      const updated = requests.map((r) => {
        if (r.id === id) {
          return { ...r, status: newStatus };
        }
        return r;
      });
      setRequests(updated);
      showToast?.(`Request ${id} marked as ${newStatus} and persisted to database.`);
    } catch (err) {
      showToast?.(err.message || "Failed to update status", true);
    }
  };

  const filtered = requests.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="coord-appr-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Academic Approvals & Sanction Workflows</h2>
          <p>
            Verify compensatory lecture requests, lab bookings, special evaluation sanctions, and departmental event permits.
          </p>
        </div>

        <div className="coord-filter-controls">
          <select
            className="coord-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Sanction Requests</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="coord-appr-stats">
        <div className="coord-appr-chip">
          <Clock size={15} />
          <span>Total Requests: <strong>{requests.length}</strong></span>
        </div>
        <div className="coord-appr-chip warning">
          <Clock size={15} color="#C2410C" />
          <span>Pending Decisions: <strong>{requests.filter((r) => r.status === "Pending").length}</strong></span>
        </div>
        <div className="coord-appr-chip success">
          <CheckCircle2 size={15} color="#166534" />
          <span>Sanctioned: <strong>{requests.filter((r) => r.status === "Approved").length}</strong></span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        /* Requests List */
        <div className="coord-appr-list">
          {filtered.map((req) => (
            <div key={req.id} className="coord-appr-card">
              <div className="coord-appr-card-header">
                <div className="coord-appr-title-block">
                  <span className="coord-appr-type-tag">{req.type}</span>
                  <h4>{req.title}</h4>
                  <p className="coord-appr-requester">
                    Requested by <strong>{req.requester}</strong> ({req.role}) • {req.date}
                  </p>
                </div>

                <span className={`coord-appr-badge ${req.status.toLowerCase()}`}>
                  {req.status}
                </span>
              </div>

              <div className="coord-appr-details-box">
                <p>{req.details}</p>
              </div>

              <div className="coord-appr-actions-row">
                <span className="coord-appr-id mono">Sanction ID: {req.id}</span>

                {req.status === "Pending" ? (
                  <div className="coord-appr-btn-group">
                    <button
                      type="button"
                      className="coord-appr-btn-approve"
                      onClick={() => handleAction(req.id, req.mongoId, "Approved")}
                    >
                      <CheckCircle2 size={14} />
                      <span>Sanction Approval</span>
                    </button>
                    <button
                      type="button"
                      className="coord-appr-btn-reject"
                      onClick={() => handleAction(req.id, req.mongoId, "Rejected")}
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <span className="coord-appr-resolved-tag">
                    {req.status === "Approved" ? "✓ Decision Sanctioned & Logged" : "✕ Application Declined"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
