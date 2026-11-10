import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, User, Calendar, FileText, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalDashboard.css";

export default function PrincipalApprovals({ currentUser, showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = () => {
    setLoading(true);
    authApi
      .getLeaves()
      .then((res) => {
        const raw = res?.leaves || [];
        if (raw.length > 0) {
          const mapped = raw.map((l, idx) => ({
            id: l.id || l._id || `APPR-${idx + 1}`,
            mongoId: l._id || l.id,
            title: `${l.leaveType || "Leave Application"} — ${l.reason || "Duty Absence"}`,
            applicant: l.applicantName || l.studentName || "Academic Candidate",
            role: l.role === "student" ? "Diploma Candidate" : "Faculty Lecturer",
            date: l.startDate ? new Date(l.startDate).toLocaleDateString() : "Today",
            status: l.status === "approved" ? "Approved" : l.status === "rejected" ? "Rejected" : "Pending"
          }));
          setRequests(mapped);
        } else {
          setRequests([
            { id: "APPR-101", title: "Faculty Duty Leave — NBA Accreditation Seminar", applicant: "Dr. Rajesh Verma", role: "HOD CSE", date: "Today", status: "Pending" },
            { id: "APPR-102", title: "Procurement of CAD/CAM Software Licenses", applicant: "Prof. Sunil Kumar", role: "HOD Mechanical", date: "Yesterday", status: "Approved" },
            { id: "APPR-103", title: "Inter-College Technical Fest Sponsorship", applicant: "Er. Vikas Tyagi", role: "Faculty Coordinator", date: "24 Oct 2026", status: "Approved" }
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load approvals:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (id, mongoId, newStatus) => {
    try {
      if (mongoId) {
        await authApi.updateLeaveStatus(mongoId, { status: newStatus.toLowerCase() });
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      showToast?.(`Request ${id} marked as ${newStatus} and recorded.`);
    } catch (err) {
      showToast?.(err.message || "Failed to update decision.", true);
    }
  };

  return (
    <div className="prin-dash-container">
      <div className="pane-header-row" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
          Executive Sanctions & Administrative Approvals
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
          Authorizations for faculty leaves, academic event budgets, and departmental sanctions.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                padding: "18px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#0F172A" }}>{req.title}</h4>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: req.status === "Approved" ? "#DCFCE7" : req.status === "Rejected" ? "#FEE2E2" : "#FEF3C7",
                      color: req.status === "Approved" ? "#15803D" : req.status === "Rejected" ? "#B91C1C" : "#B45309"
                    }}
                  >
                    {req.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                  Submitted by <strong>{req.applicant}</strong> ({req.role}) • {req.date} • Reference ID: <code>{req.id}</code>
                </p>
              </div>

              {req.status === "Pending" ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, req.mongoId, "Approved")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#16A34A",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <CheckCircle2 size={15} /> Sanction
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, req.mongoId, "Rejected")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#EF4444",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <XCircle size={15} /> Decline
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>
                  ✓ Decision Recorded
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
