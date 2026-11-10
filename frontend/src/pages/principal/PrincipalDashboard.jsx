import React from "react";
import { assetUrl } from "../../utils/assetUrl";
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck2,
  Clock,
  Award,
  Bell,
  CheckCircle2,
  Briefcase,
  FileBarChart,
  Layers,
  ArrowRight
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import { BarMetricChart, DonutProgressChart } from "../../components/dashboard/Charts";
import "./PrincipalDashboard.css";

export default function PrincipalDashboard({
  currentUser,
  stats,
  charts,
  onNavigate,
  setActiveTab
}) {
  const summary = stats?.summary || {};
  const notices = stats?.notices || [];

  return (
    <div className="prin-dash-container">
      {/* Executive Welcome Banner */}
      <div className="prin-welcome-banner">
        <div className="prin-welcome-inner">
          <div className="prin-welcome-content">
            <div className="prin-dept-pill">
              <Building2 size={13} />
              Swami Vivekanand Subharti University • Office of the Principal
            </div>

            <h1 className="prin-welcome-title">
              Campus Leadership: {currentUser?.fullName || "Dr. Mahendra Singh"}
            </h1>

            <p className="prin-welcome-sub">
              Executive Leadership &amp; Campus Direction • <strong>Subharti Polytechnic College</strong> •{" "}
              Comprehensive institutional performance across 5 accredited engineering divisions ({summary.totalStudents || 442} candidates, {summary.totalFaculty || 58} faculty members).
            </p>

            <div className="prin-welcome-actions">
              <button
                type="button"
                className="prin-action-btn primary"
                onClick={() => setActiveTab?.("approvals")}
              >
                <CheckCircle2 size={16} />
                <span>Executive Approvals</span>
              </button>
              <button
                type="button"
                className="prin-action-btn secondary"
                onClick={() => setActiveTab?.("department")}
              >
                <Building2 size={16} />
                <span>5-Branch Overview</span>
              </button>
              <button
                type="button"
                className="prin-action-btn secondary"
                onClick={() => setActiveTab?.("placement")}
              >
                <Briefcase size={16} />
                <span>Placement Index (88.4%)</span>
              </button>
              <button
                type="button"
                className="prin-action-btn secondary"
                onClick={() => setActiveTab?.("reports")}
              >
                <FileBarChart size={16} />
                <span>Accreditation Audit</span>
              </button>
            </div>
          </div>

          {/* Real College Building Showcase for Principal */}
          <div className="prin-campus-badge-card">
            <div className="prin-campus-img-wrap">
              <img
                src={assetUrl("/subharti-polytechnic-main-building.jpg")}
                alt="Subharti Polytechnic College Main Academic Building"
                className="prin-campus-thumb"
              />
              <div className="prin-campus-badge-overlay">
                <span className="prin-campus-badge-tag">
                  <span className="prin-live-dot" />
                  Main Academic Campus
                </span>
                <strong className="prin-campus-building-title">Subharti Polytechnic College</strong>
                <small className="prin-campus-building-loc">NH-58 Delhi-Haridwar Bypass, Meerut</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional KPI Stat Cards Grid */}
      <div className="prin-stats-grid">
        <StatCard
          title="Total Polytechnic Students"
          value={summary.totalStudents || 442}
          subtitle="Enrolled across CSE, ME, EE, CE, ECE"
          icon={GraduationCap}
          accentColor="#0284C7"
          trend="+12% YoY Intake"
          trendType="up"
          onClick={() => setActiveTab?.("students")}
        />
        <StatCard
          title="Polytechnic Faculty Strength"
          value={summary.totalFaculty || 58}
          subtitle="Full-time professors, lecturers & lab leads"
          icon={Users}
          accentColor="#7C3AED"
          trend="1:15 Faculty-Student Ratio"
          trendType="up"
          onClick={() => setActiveTab?.("faculty-overview")}
        />
        <StatCard
          title="Overall Attendance Index"
          value={`${summary.institutionAttendanceAvg || 89}%`}
          subtitle="Campus statutory weighted average"
          icon={CalendarCheck2}
          accentColor="#059669"
          trend="Exceeds BTEUP Standard"
          trendType="up"
          onClick={() => setActiveTab?.("attendance")}
        />
        <StatCard
          title="Board Clearance Pass Rate"
          value={`${summary.institutionPassRate || 94}%`}
          subtitle="Polytechnic State Board exams"
          icon={Award}
          accentColor="#EA580C"
          trend="State Top 5%"
          trendType="up"
          onClick={() => setActiveTab?.("exams")}
        />
      </div>

      {/* Institutional Charts Row */}
      <div className="prin-charts-row">
        <div className="prin-chart-main">
          <BarMetricChart
            title="5-Branch Polytechnic Attendance & Academic Retention (%)"
            data={(charts?.branchComparison || [
              { branch: "CSE", attendance: 91 },
              { branch: "ME", attendance: 87 },
              { branch: "EE", attendance: 89 },
              { branch: "CE", attendance: 86 },
              { branch: "ECE", attendance: 90 }
            ]).map((b) => ({
              label: b.branch,
              marks: b.attendance
            }))}
            unit="%"
            barColor="#0284C7"
          />
        </div>

        <div className="prin-chart-side">
          <DonutProgressChart
            percentage={summary.institutionAttendanceAvg || 89}
            label="Campus Health"
            accentColor="#059669"
          />
        </div>
      </div>

      {/* Live Operational Widgets */}
      <div className="prin-widgets-grid">
        {/* Widget 1: Executive Governance & Action Queue */}
        <div className="prin-widget-card">
          <div className="prin-widget-header">
            <div className="prin-widget-title">
              <CheckCircle2 size={18} className="prin-widget-icon" />
              <h3>Executive Approvals Queue</h3>
            </div>
            <button
              type="button"
              className="prin-link-btn"
              onClick={() => setActiveTab?.("approvals")}
            >
              View Queue <ArrowRight size={14} />
            </button>
          </div>

          <div className="prin-widget-list">
            {[
              { title: "NBA Accreditation Self-Assessment Report (SAR)", dept: "All Departments", date: "Due 10 Nov", status: "Review Required" },
              { title: "Faculty Promotion Sanctions (Mechanical Engg)", dept: "ME Division", date: "Pending Sign-off", status: "Action Required" },
              { title: "Annual Campus Placement Drive with Tata Motors", dept: "T&P Cell", date: "Scheduled 15 Nov", status: "Sanctioned" }
            ].map((item, idx) => (
              <div key={idx} className="prin-action-item">
                <div className="prin-action-text">
                  <strong>{item.title}</strong>
                  <p>{item.dept} • {item.date}</p>
                </div>
                <button
                  type="button"
                  className="prin-mini-btn"
                  onClick={() => setActiveTab?.("approvals")}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: 5 Engineering Branches Quick Performance */}
        <div className="prin-widget-card">
          <div className="prin-widget-header">
            <div className="prin-widget-title">
              <Building2 size={18} className="prin-widget-icon" />
              <h3>Branch Performance Indices</h3>
            </div>
            <button
              type="button"
              className="prin-link-btn"
              onClick={() => setActiveTab?.("department")}
            >
              Branch Details <ArrowRight size={14} />
            </button>
          </div>

          <div className="prin-widget-list">
            {[
              { branch: "Computer Science & Engg", students: 120, faculty: 14, passRate: "96%", att: "91%" },
              { branch: "Mechanical Engineering", students: 95, faculty: 12, passRate: "93%", att: "87%" },
              { branch: "Electrical Engineering", students: 85, faculty: 11, passRate: "95%", att: "89%" },
              { branch: "Civil Engineering", students: 78, faculty: 11, passRate: "91%", att: "86%" }
            ].map((b, idx) => (
              <div key={idx} className="prin-branch-strip">
                <div>
                  <strong>{b.branch}</strong>
                  <p>{b.students} Candidates • {b.faculty} Faculty</p>
                </div>
                <div className="prin-branch-badges">
                  <span className="prin-pill pass">Pass: {b.passRate}</span>
                  <span className="prin-pill att">Att: {b.att}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Campus Circulars & Executive Notifications */}
        <div className="prin-widget-card">
          <div className="prin-widget-header">
            <div className="prin-widget-title">
              <Bell size={18} className="prin-widget-icon" />
              <h3>Executive Orders & Circulars</h3>
            </div>
            <button
              type="button"
              className="prin-link-btn"
              onClick={() => setActiveTab?.("notices")}
            >
              Publish Order <ArrowRight size={14} />
            </button>
          </div>

          <div className="prin-widget-list">
            {(notices.length > 0 ? notices.slice(0, 3) : [
              { title: "Subharti Polytechnic Board Examination Mandate 2026", date: "26 Oct 2026", scope: "Institutional Circular" },
              { title: "Statutory AICTE Faculty Roster & Workload Audit", date: "24 Oct 2026", scope: "Faculty Notice" },
              { title: "Campus Placements Inauguration by Corporate Partners", date: "20 Oct 2026", scope: "Campus-wide" }
            ]).map((notif, idx) => (
              <div key={idx} className="prin-notice-item">
                <div className="prin-notice-dot" />
                <div className="prin-notice-content">
                  <strong>{notif.title}</strong>
                  <p>{notif.date || "Active Notice"} • <em>{notif.scope || notif.targetAudience || "All Campus"}</em></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
