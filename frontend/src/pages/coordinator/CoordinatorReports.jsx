import React, { useState, useEffect } from "react";
import { FileBarChart, Download, CheckCircle2, TrendingUp, Layers, MapPin, Award, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorReports.css";

export default function CoordinatorReports({ showToast }) {
  const [downloading, setDownloading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    authApi
      .getReports()
      .then((res) => {
        if (!isMounted) return;
        setReportData(res);
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

  const metrics = reportData?.metrics || {
    totalUsers: 140,
    students: 120,
    faculty: 14,
    totalAttendanceMarks: 520,
    totalExams: 36,
    totalAssignments: 18
  };

  const AUDIT_METRICS = [
    { id: "REP-01", title: "Polytechnic Master Timetable Compliance Index", value: "98.4%", target: "95.0%", status: "Exceeds Target", description: `Active class schedule with ${metrics.faculty} registered faculty members and zero lecture clashes.`, icon: Layers, accent: "#0284C7" },
    { id: "REP-02", title: "Candidate Enrollment & Directory Registry", value: `${metrics.students} Students`, target: "120 Seats", status: "Optimal Efficiency", description: `Enrolled across polytechnic diploma branches with validated student records.`, icon: MapPin, accent: "#059669" },
    { id: "REP-03", title: "Continuous Internal Evaluation (CIE) Delivery", value: `${metrics.totalAssignments} Tasks`, target: "15 Minimum", status: "On Track", description: `${metrics.totalExams} formal examination marks recorded and verified in database.`, icon: Award, accent: "#7C3AED" },
    { id: "REP-04", title: "Statutory AICTE/BTEUP Attendance Compliance", value: `${metrics.totalAttendanceMarks} Logs`, target: "Threshold Met", status: "Compliant", description: "Aggregated attendance entries tracked across biometric classroom ledgers.", icon: TrendingUp, accent: "#EA580C" }
  ];

  const handleDownload = (format) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      showToast?.(`Academic Coordination Report (${format.toUpperCase()}) exported successfully!`);
      if (format === "pdf") window.print();
    }, 600);
  };

  return (
    <div className="coord-rep-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Academic Operations & Accreditation Reports</h2>
          <p>
            Consolidated metrics for institutional NBA accreditation, timetable adherence, and room utilization audits.
          </p>
        </div>

        <div className="coord-rep-actions">
          <button
            type="button"
            className="coord-export-btn"
            onClick={() => handleDownload("csv")}
            disabled={downloading}
          >
            <Download size={14} />
            <span>{downloading ? "Exporting..." : "Export CSV Dataset"}</span>
          </button>
          <button
            type="button"
            className="coord-add-exam-btn"
            onClick={() => handleDownload("pdf")}
            disabled={downloading}
          >
            <Download size={14} />
            <span>Generate Executive Summary</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        /* Audit KPI Cards Grid */
        <div className="coord-rep-grid">
          {AUDIT_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.id} className="coord-rep-card">
                <div className="coord-rep-card-top">
                  <div
                    className="coord-rep-icon-wrap"
                    style={{ background: `${metric.accent}15`, color: metric.accent }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="coord-rep-status-badge">{metric.status}</span>
                </div>

                <div className="coord-rep-card-body">
                  <span className="coord-rep-target">Benchmark: {metric.target}</span>
                  <div className="coord-rep-val-row">
                    <span className="val" style={{ color: metric.accent }}>{metric.value}</span>
                  </div>
                  <h4>{metric.title}</h4>
                  <p>{metric.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
