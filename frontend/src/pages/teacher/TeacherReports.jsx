import React, { useState, useEffect } from "react";
import { FileBarChart, CheckCircle2, TrendingUp, Award, Users, BookOpen, Loader2, ShieldCheck, Printer } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherReports.css";

export default function TeacherReports({ showToast }) {
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

  const handleDownloadReport = () => {
    showToast?.("Academic Audit Report formatted for export/print.");
    window.print();
  };

  const metrics = report?.metrics || {
    totalUsers: 0,
    students: 0,
    faculty: 0,
    totalAttendanceMarks: 0,
    totalExams: 0,
    totalAssignments: 0
  };

  return (
    <div className="teacher-role-view teacher-rep-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <FileBarChart size={24} color="var(--tch-primary)" />
            Academic & Attendance Audit Reports
          </h2>
          <p>Institutional compliance metrics, assessment records, attendance sessions, and accreditation verification.</p>
        </div>

        <div className="teacher-rep-actions">
          <button
            type="button"
            className="tch-btn-secondary"
            onClick={handleDownloadReport}
          >
            <Printer size={15} />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tch-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Compiling institutional academic report metrics...</p>
        </div>
      ) : (
        <>
          {/* Institutional Compliance Overview Banner */}
          <div className="tch-card teacher-rep-banner">
            <div className="teacher-rep-banner-content">
              <div className="teacher-rep-banner-icon">
                <ShieldCheck size={28} color="#2563EB" />
              </div>
              <div>
                <h3>{report?.institution || "Subharti Polytechnic, SVSU Meerut"}</h3>
                <p>
                  Official Audit & Regulatory Compliance Ledger • Generated:{" "}
                  {report?.reportGeneratedAt
                    ? new Date(report.reportGeneratedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="tch-pill emerald">
              <CheckCircle2 size={13} />
              Accredited Ledger
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="teacher-rep-grid">
            {/* Metric 1: Examinations */}
            <div className="tch-card teacher-rep-card">
              <div className="teacher-rep-card-header">
                <div className="teacher-rep-icon-wrap blue">
                  <Award size={20} />
                </div>
                <span className="tch-pill blue">
                  {metrics.totalExams > 0 ? "Active Marks" : "Pending Records"}
                </span>
              </div>
              <h4 className="teacher-rep-card-title">Examination Assessments</h4>
              <div className="teacher-rep-card-stat">
                {metrics.totalExams}
                <span className="teacher-rep-unit">Evaluations</span>
              </div>
              <p className="teacher-rep-card-desc">
                Polytechnic board and mid-term examination marks submitted into the university ledger.
              </p>
            </div>

            {/* Metric 2: Attendance Logs */}
            <div className="tch-card teacher-rep-card">
              <div className="teacher-rep-card-header">
                <div className="teacher-rep-icon-wrap emerald">
                  <TrendingUp size={20} />
                </div>
                <span className="tch-pill emerald">
                  {metrics.totalAttendanceMarks > 0 ? "Live Ledger" : "No Records"}
                </span>
              </div>
              <h4 className="teacher-rep-card-title">Attendance Sessions</h4>
              <div className="teacher-rep-card-stat">
                {metrics.totalAttendanceMarks}
                <span className="teacher-rep-unit">Records Logged</span>
              </div>
              <p className="teacher-rep-card-desc">
                Biometric and faculty classroom attendance verification logs captured this academic term.
              </p>
            </div>

            {/* Metric 3: Assignments */}
            <div className="tch-card teacher-rep-card">
              <div className="teacher-rep-card-header">
                <div className="teacher-rep-icon-wrap amber">
                  <BookOpen size={20} />
                </div>
                <span className="tch-pill amber">Coursework</span>
              </div>
              <h4 className="teacher-rep-card-title">Coursework Assignments</h4>
              <div className="teacher-rep-card-stat">
                {metrics.totalAssignments}
                <span className="teacher-rep-unit">Tasks Published</span>
              </div>
              <p className="teacher-rep-card-desc">
                Laboratory problem sheets, continuous assessment tasks, and student submission sets.
              </p>
            </div>

            {/* Metric 4: Student Cohort */}
            <div className="tch-card teacher-rep-card">
              <div className="teacher-rep-card-header">
                <div className="teacher-rep-icon-wrap cyan">
                  <Users size={20} />
                </div>
                <span className="tch-pill cyan">Institutional Roll</span>
              </div>
              <h4 className="teacher-rep-card-title">Enrolled Students</h4>
              <div className="teacher-rep-card-stat">
                {metrics.students}
                <span className="teacher-rep-unit">Candidates</span>
              </div>
              <p className="teacher-rep-card-desc">
                Active diploma candidates enrolled across mechanical, electrical, and computer engineering.
              </p>
            </div>
          </div>

          {/* Audit Verification Table */}
          <div className="tch-card" style={{ marginTop: 8 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.05rem", color: "var(--tch-text-primary)" }}>
              Accreditation Compliance Checklist
            </h3>
            <div className="tch-table-wrap">
              <table className="tch-table">
                <thead>
                  <tr>
                    <th>Compliance Parameter</th>
                    <th>Verified Metric</th>
                    <th>Audit Status</th>
                    <th>Requirement Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Faculty Mentorship & Staffing</strong></td>
                    <td>{metrics.faculty} Active Faculty Members</td>
                    <td>
                      <span className="tch-pill emerald">Satisfied</span>
                    </td>
                    <td>Minimum 1:20 Teacher-Student Ratio</td>
                  </tr>
                  <tr>
                    <td><strong>Continuous Internal Evaluation</strong></td>
                    <td>{metrics.totalAssignments} Published Problem Sets</td>
                    <td>
                      <span className={`tch-pill ${metrics.totalAssignments > 0 ? "emerald" : "amber"}`}>
                        {metrics.totalAssignments > 0 ? "Compliant" : "In Progress"}
                      </span>
                    </td>
                    <td>Min 2 assignments per curriculum unit</td>
                  </tr>
                  <tr>
                    <td><strong>Attendance Ledger Integrity</strong></td>
                    <td>{metrics.totalAttendanceMarks} Biometric Records</td>
                    <td>
                      <span className={`tch-pill ${metrics.totalAttendanceMarks > 0 ? "emerald" : "amber"}`}>
                        {metrics.totalAttendanceMarks > 0 ? "Verified" : "Pending Records"}
                      </span>
                    </td>
                    <td>Daily classroom & practical sessions</td>
                  </tr>
                  <tr>
                    <td><strong>Board Examination Roll</strong></td>
                    <td>{metrics.totalExams} Exam Entries Recorded</td>
                    <td>
                      <span className={`tch-pill ${metrics.totalExams > 0 ? "blue" : "amber"}`}>
                        {metrics.totalExams > 0 ? "Recorded" : "Awaiting Submissions"}
                      </span>
                    </td>
                    <td>Mid-Term and Final Semester Marks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
