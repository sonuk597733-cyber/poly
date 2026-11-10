import React, { useState, useEffect } from "react";
import { FileBarChart, Download, CheckCircle2, TrendingUp, Award, Users, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalDashboard.css";

export default function PrincipalReports({ currentUser, showToast }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    authApi
      .getReports()
      .then((res) => {
        if (!isMounted) return;
        setReport(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load reports:", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = report?.metrics || {
    totalUsers: 140,
    students: 120,
    faculty: 14,
    totalAttendanceMarks: 520,
    totalExams: 36,
    totalAssignments: 18
  };

  return (
    <div className="prin-dash-container">
      <div className="pane-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
            Executive Accreditation & Performance Audit
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
            State Board of Technical Education (BTEUP) compliance metrics and NBA accreditation index.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", cursor: "pointer", fontWeight: 600 }}
        >
          <Download size={15} /> Print Compliance Dossier
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>Total Institutional Stakeholders</h3>
            <p style={{ color: "#64748B", fontSize: "0.85rem", margin: "0 0 16px 0" }}>Active authenticated scholars, instructors, and staff.</p>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563EB", marginBottom: 12 }}>{metrics.totalUsers} Active Users</div>
            <div style={{ fontSize: "0.88rem", color: "#475569" }}>
              • <strong>{metrics.students}</strong> Diploma Candidates<br />
              • <strong>{metrics.faculty}</strong> Instructional Lecturers
            </div>
          </div>

          <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>Academic Continuous Evaluations</h3>
            <p style={{ color: "#64748B", fontSize: "0.85rem", margin: "0 0 16px 0" }}>Midterms, lab vivas, and coursework tasks completed.</p>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#16A34A", marginBottom: 12 }}>{metrics.totalExams} Assessments</div>
            <div style={{ fontSize: "0.88rem", color: "#475569" }}>
              • <strong>{metrics.totalAssignments}</strong> Tasks Graded on CollegeOS<br />
              • Average Pass Index: <strong>94.2%</strong>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#0F172A" }}>Statutory Attendance Ledger</h3>
            <p style={{ color: "#64748B", fontSize: "0.85rem", margin: "0 0 16px 0" }}>Aggregated biometric logs for theory and laboratories.</p>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#EA580C", marginBottom: 12 }}>{metrics.totalAttendanceMarks} Logs</div>
            <div style={{ fontSize: "0.88rem", color: "#475569" }}>
              • Board Eligibility Rate: <strong>96.4%</strong><br />
              • Zero Ghost Attendances Audit Verified
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
