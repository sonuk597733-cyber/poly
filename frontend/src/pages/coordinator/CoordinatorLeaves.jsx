import React, { useState, useEffect } from "react";
import { Clock, User, CheckCircle2, AlertCircle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorLeaves.css";

const INITIAL_FACULTY_LEAVES = [
  { id: "LV-101", applicant: "Dr. Rajesh Verma", role: "Professor (CSE)", leaveType: "Duty Leave (NBA Conference)", from: "02 Nov 2026", to: "03 Nov 2026", days: 2, substitute: "Er. Amit Sharma", periods: "CS-301 (2 Lectures)", status: "Substitution Confirmed" },
  { id: "LV-102", applicant: "Prof. Sunil Kumar", role: "Assoc. Professor (Mechanical)", leaveType: "Casual Leave", from: "05 Nov 2026", to: "05 Nov 2026", days: 1, substitute: "Er. Vikas Tyagi", periods: "ME-301 (1 Lecture) + Workshop (1)", status: "Arrangement Pending" },
  { id: "LV-103", applicant: "Dr. Meenakshi Sundaram", role: "Professor (Electrical)", leaveType: "Medical Leave", from: "08 Nov 2026", to: "10 Nov 2026", days: 3, substitute: "Er. Rahul Singh", periods: "EE-301 (3 Lectures)", status: "Arrangement Pending" },
  { id: "LV-104", applicant: "Er. Neha Agarwal", role: "Assoc. Professor (Civil)", leaveType: "Earned Leave", from: "12 Nov 2026", to: "14 Nov 2026", days: 3, substitute: "Er. Deepak Sharma", periods: "CE-301 (3 Lectures)", status: "Substitution Confirmed" }
];

export default function CoordinatorLeaves({ showToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = () => {
    setLoading(true);
    authApi
      .getLeaves()
      .then((res) => {
        const raw = res?.leaves || [];
        if (raw.length > 0) {
          const mapped = raw.map((l, idx) => ({
            id: l.id || l._id || `LV-${idx + 101}`,
            mongoId: l._id || l.id,
            applicant: l.applicantName || l.studentName || "Faculty Member",
            role: l.role || "Lecturer (CSE)",
            leaveType: l.leaveType || l.type || "Casual Leave",
            from: l.startDate ? new Date(l.startDate).toLocaleDateString() : "02 Nov 2026",
            to: l.endDate ? new Date(l.endDate).toLocaleDateString() : "03 Nov 2026",
            days: l.days || 1,
            substitute: l.substitute || "Er. Amit Sharma",
            periods: l.reason || "Lecture Duty Swap",
            status: l.status === "approved" ? "Substitution Confirmed" : "Arrangement Pending"
          }));
          setLeaves(mapped);
        } else {
          setLeaves(INITIAL_FACULTY_LEAVES);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load leaves:", err);
        setLeaves(INITIAL_FACULTY_LEAVES);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleConfirmArrangement = async (id, mongoId) => {
    try {
      if (mongoId) {
        await authApi.updateLeaveStatus(mongoId, { status: "approved" });
      }
      const updated = leaves.map((l) => {
        if (l.id === id) {
          return { ...l, status: "Substitution Confirmed" };
        }
        return l;
      });
      setLeaves(updated);
      showToast?.("Lecture substitution arrangement confirmed and synchronized with timetable!");
    } catch (err) {
      showToast?.(err.message || "Failed to confirm leave arrangement.", true);
    }
  };

  return (
    <div className="coord-leaves-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Faculty Leave & Teaching Duty Substitution</h2>
          <p>
            Monitor faculty leave applications, verify alternative teacher arrangements, and eliminate classroom idle periods.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="coord-leaves-stats">
        <div className="coord-lv-chip">
          <Clock size={15} />
          <span>Active Leave Requests: <strong>{leaves.length}</strong></span>
        </div>
        <div className="coord-lv-chip warning">
          <AlertCircle size={15} />
          <span>Pending Arrangements: <strong>{leaves.filter((l) => l.status === "Arrangement Pending").length}</strong></span>
        </div>
        <div className="coord-lv-chip success">
          <CheckCircle2 size={15} />
          <span>Coverage Rate: <strong>100% Zero-Loss Rule</strong></span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        /* Leaves Ledger */
        <div className="coord-leaves-list">
          {leaves.map((l) => (
            <div key={l.id} className="coord-leaf-card">
              <div className="coord-leaf-header">
                <div className="coord-leaf-user">
                  <div className="coord-leaf-avatar">
                    {l.applicant.charAt(0)}
                  </div>
                  <div>
                    <h4>{l.applicant}</h4>
                    <span className="coord-leaf-role">{l.role}</span>
                  </div>
                </div>

                <span className={`coord-leaf-status-pill ${l.status.toLowerCase().replace(" ", "-")}`}>
                  {l.status}
                </span>
              </div>

              <div className="coord-leaf-body-grid">
                <div className="coord-leaf-info-box">
                  <span className="coord-leaf-label">Leave Details & Duration</span>
                  <strong>{l.leaveType}</strong>
                  <p>
                    <Calendar size={13} /> {l.from} to {l.to} ({l.days} {l.days > 1 ? "Days" : "Day"})
                  </p>
                </div>

                <div className="coord-leaf-info-box">
                  <span className="coord-leaf-label">Substituted Faculty & Period Coverage</span>
                  <strong>
                    <User size={13} /> {l.substitute}
                  </strong>
                  <p>Teaching: {l.periods}</p>
                </div>
              </div>

              <div className="coord-leaf-footer">
                <span className="coord-leaf-note">
                  {l.status === "Substitution Confirmed"
                    ? "Duty swap notified to both faculty members and students via portal."
                    : "Alternative arrangement awaiting coordinator timetable endorsement."}
                </span>

                {l.status === "Arrangement Pending" && (
                  <button
                    type="button"
                    className="coord-confirm-sub-btn"
                    onClick={() => handleConfirmArrangement(l.id, l.mongoId)}
                  >
                    <span>Approve Duty Swap</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
