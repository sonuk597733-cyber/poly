import React, { useState } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck2,
  Clock,
  Award,
  Bell,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertCircle,
  AlertTriangle,
  Layers,
  RefreshCw,
  Printer,
  Calendar,
  MapPin,
  Mail,
  Plus,
  XCircle,
  Check,
  UserCheck,
  ShieldAlert,
  User,
  Loader2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODDashboard.css";

// Pure date parsing helpers
function parseDaysCount(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

function parseEventDate(dateString) {
  if (!dateString) return { month: "UPCOMING", day: "--" };
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return { month: "UPCOMING", day: "--" };
  return {
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    day: d.getDate()
  };
}

export default function HODDashboard({
  currentUser,
  stats: initialStats,
  charts: initialCharts,
  _onNavigate,
  setActiveTab
}) {
  const [stats, setStats] = useState(initialStats || null);
  const [charts, setCharts] = useState(initialCharts || null);
  const [prevStatsProp, setPrevStatsProp] = useState(initialStats);
  const [prevChartsProp, setPrevChartsProp] = useState(initialCharts);

  // Sync state with incoming props during render without cascading renders
  if (initialStats !== prevStatsProp) {
    setPrevStatsProp(initialStats);
    setStats(initialStats);
  }

  if (initialCharts !== prevChartsProp) {
    setPrevChartsProp(initialCharts);
    setCharts(initialCharts);
  }

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState("Semester");
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Toast notification helper
  const triggerToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Refresh dashboard data
  const handleRefresh = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        authApi.getDashboardStats(),
        authApi.getDashboardCharts()
      ]);
      setStats(statsRes);
      setCharts(chartsRes?.charts || null);
      if (!silent) triggerToast("Dashboard data refreshed successfully.");
    } catch (err) {
      if (!silent) triggerToast(err.message || "Failed to refresh dashboard metrics.", true);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Quick leave sanction handler
  const handleSanctionLeave = async (leaveId, status) => {
    setActionInProgressId(leaveId);
    try {
      await authApi.updateLeaveStatus(leaveId, { status });
      triggerToast(`Leave request ${status.toUpperCase()} successfully.`);
      // Optimistically update pending leaves
      setStats((prev) => {
        if (!prev) return prev;
        const updatedPending = (prev.pendingLeaves || []).filter(
          (l) => (l._id || l.id) !== leaveId
        );
        return {
          ...prev,
          pendingLeaves: updatedPending,
          summary: {
            ...prev.summary,
            pendingApprovalsCount: Math.max(0, (prev.summary?.pendingApprovalsCount || 1) - 1)
          }
        };
      });
      // Silently refresh server persisted state in background
      handleRefresh(true);
    } catch (err) {
      triggerToast(err.message || "Failed to update leave status.", true);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Export report
  const handleExportReport = () => {
    triggerToast("Generating department executive summary for print.");
    window.print();
  };

  // Extract real backend data
  const summary = stats?.summary || {};
  const activeUser = currentUser || authApi.getCurrentUser() || {};
  const deptName = summary.department || activeUser?.department || "Computer Science & Engineering";
  const academicYear = summary.academicYear || "2026-2027";
  const pendingLeaves = stats?.pendingLeaves || [];
  const todaySchedule = stats?.todaySchedule || [];
  const atRiskStudents = stats?.atRiskStudents || [];
  const facultyOverview = stats?.facultyOverview || [];
  const upcomingEvents = stats?.upcomingEvents || [];
  const departmentNotices = stats?.departmentNotices || stats?.notices || [];

  // HOD Profile Photo and Monogram Resolution
  const rawAvatar = activeUser?.avatarUrl || summary.avatarUrl || null;
  const avatarUrl = rawAvatar
    ? rawAvatar.startsWith("http") || rawAvatar.startsWith("/") || rawAvatar.startsWith("data:")
      ? rawAvatar
      : `/${rawAvatar}`
    : null;
  const userInitial = (activeUser?.fullName || "H").trim().charAt(0).toUpperCase();

  // Accurate title derivation (No fake hardcoded "Dr.")
  const getFormattedGreeting = () => {
    if (!activeUser?.fullName) return "Head of Department";
    const name = activeUser.fullName.trim();
    const desig = (activeUser.designation || "").toLowerCase();
    const hasDrInDesig = desig.includes("dr") || desig.includes("doctor");
    const hasDrInName = /^dr\.?\s+/i.test(name) || /^prof\.?\s+/i.test(name);
    if (hasDrInName) return name;
    if (hasDrInDesig) return `Dr. ${name}`;
    return name;
  };

  // KPIs
  const totalStudents = summary.deptStudentCount ?? 0;
  const totalFaculty = summary.deptTeacherCount ?? 0;
  const deptAttendance = summary.deptAttendanceAvg ?? 0;
  const avgPerformance = summary.deptAvgExamScore ?? 0;
  const pendingApprovals = summary.pendingApprovalsCount ?? pendingLeaves.length;
  const activeBatches = summary.activeBatchesCount ?? 0;
  const activeSubjects = summary.activeSubjectsCount ?? 0;

  // Performance Charts Data
  const gradeData = (charts?.gradeDistribution || []).map((g) => ({
    grade: g.grade,
    count: g.count || 0
  }));
  const hasGradeRecords = gradeData.some((g) => g.count > 0);
  const maxGradeCount = Math.max(...gradeData.map((g) => g.count), 1);

  const trendData = charts?.semesterPerformanceTrend || charts?.semesterAttendance || [];
  const hasTrendRecords = trendData.length > 0;

  const subjectData = charts?.subjectPerformance || [];
  const hasSubjectRecords = subjectData.length > 0;

  // Date formatting via lazy state initializer
  const [todayDateStr] = useState(() =>
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  );

  return (
    <div className="hod-role-view hod-dash-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`hod-toast-banner ${toastMessage.isError ? "error" : "success"}`}>
          {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ====================================================================
          DASHBOARD HEADER (AVATAR, GREETING, DEPT, CONTROLS, REFRESH, EXPORT)
          ==================================================================== */}
      <div className="hod-dash-header-card hod-stagger-1">
        <div className="hod-dash-header-main">
          <div className="hod-header-profile-block">
            {/* HOD Avatar Wrap with Status Beacon */}
            <div className="hod-header-avatar-wrap" title={`${activeUser?.fullName || "Head of Department"} - Active Session`}>
              {avatarUrl && !avatarFailed ? (
                <img
                  src={avatarUrl}
                  alt={activeUser?.fullName || "Head of Department"}
                  className="hod-header-avatar-img"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="hod-header-avatar-fallback">
                  {activeUser?.fullName ? userInitial : <User size={26} />}
                </div>
              )}
              <span className="hod-avatar-status-beacon" title="Executive Online Session" />
            </div>

            <div className="hod-dash-title-group">
              <div className="hod-header-badge-row">
                <span className="hod-pill indigo">
                  <Building2 size={12} />
                  Department of {deptName}
                </span>
                <span className="hod-pill emerald">
                  <ShieldCheck size={12} />
                  Accredited Directorate
                </span>
                {activeUser?.designation && (
                  <span className="hod-pill violet">
                    <Award size={12} />
                    {activeUser.designation}
                  </span>
                )}
              </div>

              <h1 className="hod-dash-heading">
                Welcome back, {getFormattedGreeting()}
              </h1>

              <p className="hod-dash-subheading">
                Academic Term: <strong>{academicYear}</strong> • Current Date: <strong>{todayDateStr}</strong>
                {activeUser?.email && (
                  <span className="hod-header-email-meta"> • <code>{activeUser.email}</code></span>
                )}
              </p>
            </div>
          </div>

          <div className="hod-dash-header-actions">
            {/* Reporting Period Filter */}
            <div className="hod-period-selector" role="group" aria-label="Reporting Period">
              {["7 Days", "30 Days", "Semester", "Academic Year"].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`hod-period-btn ${reportingPeriod === period ? "active" : ""}`}
                  onClick={() => setReportingPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              className="hod-btn-secondary hod-header-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh dashboard metrics"
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span>{isRefreshing ? "Updating..." : "Refresh"}</span>
            </button>

            {/* Export Summary Button */}
            <button
              type="button"
              className="hod-btn-primary hod-header-btn"
              onClick={handleExportReport}
              title="Print executive summary"
            >
              <Printer size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 1 — DEPARTMENT OVERVIEW KPI CARDS (6 CARDS)
          ==================================================================== */}
      <div className="hod-kpi-grid hod-stagger-2">
        {/* Card 1: Total Students */}
        <div
          className="hod-card hod-kpi-card"
          onClick={() => setActiveTab?.("students")}
          role="button"
          tabIndex={0}
        >
          <div className="hod-kpi-top">
            <span className="hod-kpi-label">Total Students</span>
            <div className="hod-kpi-icon-wrap indigo">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="hod-kpi-value">{totalStudents}</div>
          <div className="hod-kpi-footer">
            <span className="hod-kpi-trend up">
              <TrendingUp size={12} /> Accredited Roll
            </span>
            <span className="hod-kpi-subtext">Across active semesters</span>
          </div>
        </div>

        {/* Card 2: Total Faculty */}
        <div
          className="hod-card hod-kpi-card"
          onClick={() => setActiveTab?.("faculty-management")}
          role="button"
          tabIndex={0}
        >
          <div className="hod-kpi-top">
            <span className="hod-kpi-label">Total Faculty</span>
            <div className="hod-kpi-icon-wrap violet">
              <Users size={20} />
            </div>
          </div>
          <div className="hod-kpi-value">{totalFaculty}</div>
          <div className="hod-kpi-footer">
            <span className="hod-kpi-trend neutral">
              <Users size={12} /> Department Cadre
            </span>
            <span className="hod-kpi-subtext">
              {totalFaculty > 0 ? `Ratio 1:${Math.round(totalStudents / totalFaculty)}` : "Faculty staff"}
            </span>
          </div>
        </div>

        {/* Card 3: Department Attendance */}
        <div
          className="hod-card hod-kpi-card"
          onClick={() => setActiveTab?.("attendance")}
          role="button"
          tabIndex={0}
        >
          <div className="hod-kpi-top">
            <span className="hod-kpi-label">Dept Attendance</span>
            <div className="hod-kpi-icon-wrap emerald">
              <CalendarCheck2 size={20} />
            </div>
          </div>
          <div className="hod-kpi-value">
            {deptAttendance > 0 ? `${deptAttendance}%` : "No Logs"}
          </div>
          <div className="hod-kpi-footer">
            <span className={`hod-kpi-trend ${deptAttendance >= 75 ? "up" : deptAttendance > 0 ? "down" : "neutral"}`}>
              {deptAttendance >= 75 ? "≥75% Compliant" : deptAttendance > 0 ? "Defalcation Risk" : "Awaiting Logs"}
            </span>
            <span className="hod-kpi-subtext">Biometric sessions</span>
          </div>
        </div>

        {/* Card 4: Academic Performance */}
        <div
          className="hod-card hod-kpi-card"
          onClick={() => setActiveTab?.("results")}
          role="button"
          tabIndex={0}
        >
          <div className="hod-kpi-top">
            <span className="hod-kpi-label">Avg Performance</span>
            <div className="hod-kpi-icon-wrap cyan">
              <Award size={20} />
            </div>
          </div>
          <div className="hod-kpi-value">
            {avgPerformance > 0 ? `${avgPerformance}%` : "No Records"}
          </div>
          <div className="hod-kpi-footer">
            <span className="hod-kpi-trend up">
              <Award size={12} /> Continuous CIE
            </span>
            <span className="hod-kpi-subtext">Midterm & Practical</span>
          </div>
        </div>

        {/* Card 5: Pending Approvals */}
        <div
          className="hod-card hod-kpi-card"
          onClick={() => setActiveTab?.("leaves")}
          role="button"
          tabIndex={0}
        >
          <div className="hod-kpi-top">
            <span className="hod-kpi-label">Pending Approvals</span>
            <div className="hod-kpi-icon-wrap amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="hod-kpi-value" style={{ color: pendingApprovals > 0 ? "var(--hod-amber)" : "var(--hod-emerald)" }}>
            {pendingApprovals}
          </div>
          <div className="hod-kpi-footer">
            <span className={`hod-kpi-trend ${pendingApprovals > 0 ? "warn" : "up"}`}>
              <Clock size={12} /> {pendingApprovals > 0 ? "Action Required" : "All Clear"}
            </span>
            <span className="hod-kpi-subtext">Leave & requests</span>
          </div>
        </div>

        {/* Card 6: Active Batches & Subjects */}
        <div
          className="hod-card hod-kpi-card"
          onClick={() => setActiveTab?.("timetable")}
          role="button"
          tabIndex={0}
        >
          <div className="hod-kpi-top">
            <span className="hod-kpi-label">Active Curriculum</span>
            <div className="hod-kpi-icon-wrap indigo">
              <Layers size={20} />
            </div>
          </div>
          <div className="hod-kpi-value">{activeBatches} <span className="hod-kpi-unit">Batches</span></div>
          <div className="hod-kpi-footer">
            <span className="hod-kpi-trend neutral">
              <BookOpen size={12} /> {activeSubjects} Subjects
            </span>
            <span className="hod-kpi-subtext">Current timetable</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 2 — ACADEMIC PERFORMANCE CHARTS (A. TREND & B. GRADES)
          ==================================================================== */}
      <div className="hod-analytics-row hod-stagger-3">
        {/* A. Semester Performance Trend */}
        <div className="hod-card hod-chart-card">
          <div className="hod-chart-header">
            <div>
              <h3 className="hod-card-title">
                <TrendingUp size={18} color="var(--hod-primary)" />
                Semester Academic & Attendance Trend
              </h3>
              <p className="hod-card-sub">
                Aggregate performance tracking across {reportingPeriod.toLowerCase()} batches
              </p>
            </div>
            <span className="hod-pill indigo">
              {reportingPeriod} View
            </span>
          </div>

          {hasTrendRecords ? (
            <div className="hod-trend-chart-body">
              <div className="hod-trend-chart-canvas">
                {/* 75% Regulatory Compliance Guideline */}
                <div className="hod-chart-guideline" style={{ bottom: "75%" }}>
                  <span className="hod-chart-guideline-badge">75% Target Standard</span>
                </div>

                <div className="hod-trend-bars">
                  {trendData.map((item, idx) => {
                    const val = Math.min(100, Math.max(0, item.avgPercentage ?? item.attendance ?? 0));
                    const isCompliant = val >= 75;
                    return (
                      <div key={idx} className="hod-trend-bar-col">
                        <div className="hod-trend-bar-track">
                          <div
                            className={`hod-trend-bar-fill ${isCompliant ? "compliant" : "warning"}`}
                            style={{
                              height: `${val}%`
                            }}
                          >
                            <span className="hod-trend-tooltip">{val}%</span>
                          </div>
                        </div>
                        <span className="hod-trend-axis-label">{item.semester}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="hod-chart-legend">
                <span className="hod-legend-item">
                  <span className="hod-legend-dot compliant" />
                  <span>≥75% Compliant Standard</span>
                </span>
                <span className="hod-legend-item">
                  <span className="hod-legend-dot warning" />
                  <span>Sub-threshold Benchmark (&lt;75%)</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <TrendingUp size={36} style={{ opacity: 0.4 }} />
              <h3>No Trend Records Available</h3>
              <p>Performance trends will populate as semester examination scores are submitted.</p>
            </div>
          )}
        </div>

        {/* B. Grade Distribution Chart */}
        <div className="hod-card hod-chart-card">
          <div className="hod-chart-header">
            <div>
              <h3 className="hod-card-title">
                <Award size={18} color="var(--hod-violet)" />
                Department Grade Distribution
              </h3>
              <p className="hod-card-sub">
                Candidate score distribution across evaluated courses
              </p>
            </div>
            <span className="hod-pill violet">
              {gradeData.reduce((acc, g) => acc + g.count, 0)} Graded
            </span>
          </div>

          {hasGradeRecords ? (
            <div className="hod-grade-chart-body">
              <div className="hod-grade-bars">
                {gradeData.map((g, idx) => {
                  const pct = Math.round((g.count / maxGradeCount) * 100);
                  const isTop = g.grade === "A+" || g.grade === "A";
                  const isMid = g.grade === "B+" || g.grade === "B";
                  const gradeClass = isTop ? "honors" : isMid ? "merit" : "pass";

                  return (
                    <div key={idx} className="hod-grade-bar-col">
                      <div className="hod-grade-bar-track">
                        <div
                          className={`hod-grade-bar-fill ${gradeClass}`}
                          style={{
                            height: `${Math.max(10, pct)}%`
                          }}
                        >
                          <span className="hod-grade-tooltip">{g.count}</span>
                        </div>
                      </div>
                      <span className="hod-grade-axis-label">{g.grade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="hod-chart-legend">
                <span className="hod-legend-item">
                  <span className="hod-legend-dot honors" />
                  <span>Grade A+/A (Honors)</span>
                </span>
                <span className="hod-legend-item">
                  <span className="hod-legend-dot merit" />
                  <span>Grade B+/B (Satisfactory)</span>
                </span>
                <span className="hod-legend-item">
                  <span className="hod-legend-dot pass" />
                  <span>Grade C/Pass (Remedial)</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <Award size={36} style={{ opacity: 0.4 }} />
              <h3>No Evaluation Grades Recorded</h3>
              <p>Examination marks and letter grades will appear here once faculty finalize assessments.</p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          SECTION 2C — SUBJECT-WISE PERFORMANCE (COMPACT HORIZONTAL BARS)
          ==================================================================== */}
      <div className="hod-card hod-stagger-4">
        <div className="hod-chart-header">
          <div>
            <h3 className="hod-card-title">
              <BookOpen size={18} color="var(--hod-primary)" />
              Subject-wise Academic Performance Index
            </h3>
            <p className="hod-card-sub">
              Comparative average scores across department coursework and laboratory assessments
            </p>
          </div>
          <span className="hod-pill indigo">
            {subjectData.length} Subjects Evaluated
          </span>
        </div>

        {hasSubjectRecords ? (
          <div className="hod-subject-grid">
            {subjectData.map((subj, idx) => {
              const clampedVal = Math.min(100, Math.max(0, subj.percentage));
              const isHigh = clampedVal >= 75;
              const isMedium = clampedVal >= 50 && clampedVal < 75;
              const statusClass = isHigh ? "high" : isMedium ? "medium" : "low";

              return (
                <div key={idx} className="hod-subject-bar-item">
                  <div className="hod-subject-meta">
                    <span className="hod-subject-name" title={subj.subject}>
                      {subj.subject}
                    </span>
                    <span className="hod-subject-score">
                      <strong>{clampedVal}%</strong> ({subj.totalAssessments} tests)
                    </span>
                  </div>
                  <div className="hod-subject-track">
                    {/* Benchmark line at 75% */}
                    <div className="hod-subject-benchmark-tick" style={{ left: "75%" }} title="75% Target Threshold" />
                    <div
                      className={`hod-subject-fill ${statusClass}`}
                      style={{
                        width: `${clampedVal}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hod-empty-box" style={{ padding: "36px 16px" }}>
            <BookOpen size={36} style={{ opacity: 0.4 }} />
            <h3>No Subject Assessments Logged</h3>
            <p>Subject evaluation performance metrics will appear here once examination and continuous assessment marks are entered.</p>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 3 & 4 — TODAY'S SCHEDULE alongside PENDING APPROVALS
          ==================================================================== */}
      <div className="hod-two-col-row hod-stagger-5">
        {/* Section 3: Today's Schedule */}
        <div className="hod-card hod-split-card">
          <div className="hod-card-header-row">
            <div>
              <h3 className="hod-card-title">
                <Clock size={18} color="var(--hod-primary)" />
                Today's Department Schedule
              </h3>
              <p className="hod-card-sub">
                Live timetable classes, room allocations, and faculty assignments
              </p>
            </div>
            <button
              type="button"
              className="hod-card-header-link"
              onClick={() => setActiveTab?.("timetable")}
            >
              Master Timetable <ChevronRight size={14} />
            </button>
          </div>

          {todaySchedule.length > 0 ? (
            <div className="hod-schedule-feed">
              {todaySchedule.map((slot, idx) => (
                <div key={idx} className="hod-schedule-item">
                  <div className="hod-schedule-time-box">
                    <Clock size={13} color="var(--hod-primary)" />
                    <span>{slot.startTime} – {slot.endTime}</span>
                  </div>

                  <div className="hod-schedule-details">
                    <div className="hod-schedule-title-row">
                      <strong className="hod-schedule-subject">{slot.subject}</strong>
                      <span className="hod-pill indigo">{slot.semester || slot.branch || "CSE"}</span>
                    </div>

                    <div className="hod-schedule-meta-row">
                      <span className="hod-schedule-meta">
                        <MapPin size={12} color="var(--hod-cyan)" />
                        <span>{slot.roomNo ? `Room ${slot.roomNo}` : "Lecture Hall"}</span>
                      </span>
                      <span className="hod-schedule-meta">
                        <Users size={12} color="var(--hod-text-muted)" />
                        <span>{slot.teacherName || "Assigned Faculty"}</span>
                      </span>
                      {slot.type && (
                        <span className="hod-pill cyan" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>
                          {slot.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <Calendar size={36} style={{ opacity: 0.4 }} />
              <h3>No Lectures Scheduled for Today</h3>
              <p>The department master schedule has no lectures or laboratory sessions registered for today.</p>
            </div>
          )}
        </div>

        {/* Section 4: Pending Approvals & Action Center */}
        <div className="hod-card hod-split-card">
          <div className="hod-card-header-row">
            <div>
              <h3 className="hod-card-title">
                <Clock size={18} color="var(--hod-amber)" />
                Pending Approvals & Action Center
              </h3>
              <p className="hod-card-sub">
                Faculty duty leave applications and student medical requests
              </p>
            </div>
            <button
              type="button"
              className="hod-card-header-link"
              onClick={() => setActiveTab?.("leaves")}
            >
              Approval Queue <ChevronRight size={14} />
            </button>
          </div>

          {pendingLeaves.length > 0 ? (
            <div className="hod-approvals-feed">
              {pendingLeaves.slice(0, 5).map((req) => {
                const leaveId = req._id || req.id;
                const applicant = req.applicantName || req.studentId?.fullName || req.userId?.fullName || "Staff Member";
                const isUpdating = actionInProgressId === leaveId;
                const days = parseDaysCount(req.startDate, req.endDate);

                return (
                  <div key={leaveId} className="hod-approval-item">
                    <div className="hod-approval-info">
                      <div className="hod-approval-top">
                        <span className="hod-pill amber">{req.leaveType || "Casual Leave"}</span>
                        <span className="hod-approval-days">{days} day(s)</span>
                      </div>
                      <h4 className="hod-approval-name">{applicant}</h4>
                      <p className="hod-approval-reason">"{req.reason || "Personal grounds"}"</p>
                    </div>

                    <div className="hod-approval-actions">
                      <button
                        type="button"
                        className="hod-btn-success hod-action-btn"
                        onClick={() => handleSanctionLeave(leaveId, "approved")}
                        disabled={isUpdating}
                        title="Approve leave"
                      >
                        {isUpdating ? <Loader2 size={13} className="spin" /> : <Check size={14} />}
                        <span>{isUpdating ? "..." : "Approve"}</span>
                      </button>
                      <button
                        type="button"
                        className="hod-btn-danger hod-action-btn"
                        onClick={() => handleSanctionLeave(leaveId, "rejected")}
                        disabled={isUpdating}
                        title="Reject leave"
                      >
                        {isUpdating ? <Loader2 size={13} className="spin" /> : <XCircle size={14} />}
                        <span>{isUpdating ? "..." : "Decline"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <CheckCircle2 size={36} color="var(--hod-emerald)" />
              <h3>All Approvals Cleared</h3>
              <p>No faculty or student leave requests are currently awaiting departmental review.</p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          SECTION 5 & 6 — AT-RISK STUDENTS alongside FACULTY OVERVIEW
          ==================================================================== */}
      <div className="hod-two-col-row hod-stagger-6">
        {/* Section 5: At-Risk Students */}
        <div className="hod-card hod-split-card">
          <div className="hod-card-header-row">
            <div>
              <h3 className="hod-card-title">
                <ShieldAlert size={18} color="var(--hod-rose)" />
                At-Risk Candidates & Attendance Defalcation
              </h3>
              <p className="hod-card-sub">
                Students below the 75% regulatory attendance threshold or with low marks
              </p>
            </div>
            <button
              type="button"
              className="hod-card-header-link"
              onClick={() => setActiveTab?.("students")}
            >
              Candidate Directory <ChevronRight size={14} />
            </button>
          </div>

          {atRiskStudents.length > 0 ? (
            <div className="hod-atrisk-list">
              {atRiskStudents.map((st) => (
                <div key={st.id} className="hod-atrisk-item">
                  <div className="hod-atrisk-meta">
                    <div className="hod-atrisk-avatar">
                      {st.fullName ? st.fullName.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div>
                      <strong className="hod-atrisk-name">{st.fullName}</strong>
                      <div className="hod-atrisk-sub">
                        <span>Roll: {st.rollNo}</span> • <span>{st.semester}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hod-atrisk-badge-group">
                    <span className="hod-pill rose">
                      <AlertTriangle size={12} />
                      {st.reason}
                    </span>
                    <button
                      type="button"
                      className="hod-btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                      onClick={() => setActiveTab?.("students")}
                    >
                      Inspect Records
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <CheckCircle2 size={36} color="var(--hod-emerald)" />
              <h3>No Students At Risk</h3>
              <p>All enrolled department candidates meet regulatory attendance (&ge;75%) and continuous evaluation standards.</p>
            </div>
          )}
        </div>

        {/* Section 6: Faculty Overview */}
        <div className="hod-card hod-split-card">
          <div className="hod-card-header-row">
            <div>
              <h3 className="hod-card-title">
                <Users size={18} color="var(--hod-primary)" />
                Department Faculty & Teaching Load
              </h3>
              <p className="hod-card-sub">
                Workload allocation, subjects taught, and contact coordinates
              </p>
            </div>
            <button
              type="button"
              className="hod-card-header-link"
              onClick={() => setActiveTab?.("faculty-management")}
            >
              Faculty Roster <ChevronRight size={14} />
            </button>
          </div>

          {facultyOverview.length > 0 ? (
            <div className="hod-faculty-feed">
              {facultyOverview.map((fac) => (
                <div key={fac.id} className="hod-faculty-row">
                  <div className="hod-faculty-main">
                    <div className="hod-faculty-avatar">
                      {fac.fullName ? fac.fullName.charAt(0).toUpperCase() : "F"}
                    </div>
                    <div>
                      <strong className="hod-faculty-name">{fac.fullName}</strong>
                      <div className="hod-faculty-desig">
                        {fac.designation} • <code>{fac.employeeId}</code>
                      </div>
                    </div>
                  </div>

                  <div className="hod-faculty-load-group">
                    <div className="hod-faculty-hours">
                      <span>Load: <strong>{fac.weeklyLoadHours} hrs/wk</strong></span>
                      <span className="hod-pill emerald">
                        <UserCheck size={11} /> {fac.status === "active" ? "Active" : "On Duty"}
                      </span>
                    </div>
                    <a
                      href={`mailto:${fac.email}`}
                      className="hod-btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.76rem" }}
                      title="Send email"
                    >
                      <Mail size={12} /> Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <Users size={36} style={{ opacity: 0.4 }} />
              <h3>No Faculty Assigned</h3>
              <p>Faculty members assigned to this department will appear here once allocated in human resources.</p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          SECTION 7 & 8 — RECENT NOTICES alongside UPCOMING EVENTS
          ==================================================================== */}
      <div className="hod-two-col-row hod-stagger-7">
        {/* Section 7: Recent Notices & Notifications */}
        <div className="hod-card hod-split-card">
          <div className="hod-card-header-row">
            <div>
              <h3 className="hod-card-title">
                <Bell size={18} color="var(--hod-primary)" />
                Recent Department Notices & Circulars
              </h3>
              <p className="hod-card-sub">
                Official circulars dispatched to faculty and students
              </p>
            </div>
            <button
              type="button"
              className="hod-card-header-link"
              onClick={() => setActiveTab?.("notices")}
            >
              All Circulars <ChevronRight size={14} />
            </button>
          </div>

          {departmentNotices.length > 0 ? (
            <div className="hod-notices-feed">
              {departmentNotices.slice(0, 4).map((notice) => {
                const isUrgent = notice.priority === "urgent";
                const isImportant = notice.priority === "important";

                return (
                  <div key={notice._id || notice.id} className="hod-notice-item">
                    <div className="hod-notice-item-top">
                      <span
                        className={`hod-pill ${
                          isUrgent ? "rose" : isImportant ? "amber" : "indigo"
                        }`}
                      >
                        {notice.priority ? notice.priority.toUpperCase() : "CIRCULAR"}
                      </span>
                      <span className="hod-notice-date">
                        {notice.createdAt
                          ? new Date(notice.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short"
                            })
                          : "Recent"}
                      </span>
                    </div>

                    <h4 className="hod-notice-item-title">{notice.title}</h4>
                    <p className="hod-notice-item-snippet">
                      {notice.content ? `${notice.content.slice(0, 110)}...` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <Bell size={36} style={{ opacity: 0.4 }} />
              <h3>No Active Circulars</h3>
              <p>Official notices and department advisories will appear in this feed once broadcast.</p>
            </div>
          )}
        </div>

        {/* Section 8: Upcoming Events & Academic Deadlines */}
        <div className="hod-card hod-split-card">
          <div className="hod-card-header-row">
            <div>
              <h3 className="hod-card-title">
                <Calendar size={18} color="var(--hod-violet)" />
                Upcoming Academic Deadlines & Events
              </h3>
              <p className="hod-card-sub">
                Examinations, faculty meetings, and regulatory deadlines
              </p>
            </div>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="hod-events-feed">
              {upcomingEvents.map((evt) => {
                const dateMeta = parseEventDate(evt.startDate);

                return (
                  <div key={evt._id || evt.id} className="hod-event-item">
                    <div className="hod-event-date-box">
                      <span className="hod-event-month">
                        {dateMeta.month}
                      </span>
                      <strong className="hod-event-day">
                        {dateMeta.day}
                      </strong>
                    </div>

                    <div className="hod-event-details">
                      <div className="hod-event-title-row">
                        <strong className="hod-event-title">{evt.title}</strong>
                        <span className="hod-pill violet">{evt.category || "Academic"}</span>
                      </div>
                      <div className="hod-event-location">
                        <MapPin size={12} color="var(--hod-text-muted)" />
                        <span>{evt.location || "Campus"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hod-empty-box" style={{ padding: "40px 16px" }}>
              <Calendar size={36} style={{ opacity: 0.4 }} />
              <h3>No Upcoming Events Scheduled</h3>
              <p>Examination dates, departmental review meetings, and academic calendar milestones will populate here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          SECTION 9 — QUICK ACTIONS GRID (6 SUPPORTED ACTIONS)
          ==================================================================== */}
      <div className="hod-card hod-stagger-8">
        <h3 className="hod-card-title" style={{ marginBottom: 16 }}>
          <Layers size={18} color="var(--hod-primary)" />
          Department Leadership Quick Actions
        </h3>

        <div className="hod-quick-actions-grid">
          <button
            type="button"
            className="hod-quick-action-btn"
            onClick={() => setActiveTab?.("notices")}
          >
            <div className="hod-quick-icon-wrap indigo">
              <Plus size={18} />
            </div>
            <div className="hod-quick-label-group">
              <strong>Publish Circular</strong>
              <span>Broadcast announcement to department</span>
            </div>
            <ChevronRight size={16} className="hod-quick-chevron" />
          </button>

          <button
            type="button"
            className="hod-quick-action-btn"
            onClick={() => setActiveTab?.("leaves")}
          >
            <div className="hod-quick-icon-wrap amber">
              <Clock size={18} />
            </div>
            <div className="hod-quick-label-group">
              <strong>Review Sanctions</strong>
              <span>Inspect faculty & student leave queue</span>
            </div>
            <ChevronRight size={16} className="hod-quick-chevron" />
          </button>

          <button
            type="button"
            className="hod-quick-action-btn"
            onClick={() => setActiveTab?.("timetable")}
          >
            <div className="hod-quick-icon-wrap cyan">
              <Calendar size={18} />
            </div>
            <div className="hod-quick-label-group">
              <strong>Master Timetable</strong>
              <span>View lecture halls & lab slots</span>
            </div>
            <ChevronRight size={16} className="hod-quick-chevron" />
          </button>

          <button
            type="button"
            className="hod-quick-action-btn"
            onClick={() => setActiveTab?.("students")}
          >
            <div className="hod-quick-icon-wrap emerald">
              <GraduationCap size={18} />
            </div>
            <div className="hod-quick-label-group">
              <strong>Candidate Records</strong>
              <span>Inspect transcripts & attendance</span>
            </div>
            <ChevronRight size={16} className="hod-quick-chevron" />
          </button>

          <button
            type="button"
            className="hod-quick-action-btn"
            onClick={() => setActiveTab?.("reports")}
          >
            <div className="hod-quick-icon-wrap violet">
              <FileText size={18} />
            </div>
            <div className="hod-quick-label-group">
              <strong>NBA Audit Reports</strong>
              <span>Outcome metrics & compliance audit</span>
            </div>
            <ChevronRight size={16} className="hod-quick-chevron" />
          </button>

          <button
            type="button"
            className="hod-quick-action-btn"
            onClick={() => setActiveTab?.("faculty-management")}
          >
            <div className="hod-quick-icon-wrap indigo">
              <Users size={18} />
            </div>
            <div className="hod-quick-label-group">
              <strong>Faculty Allocation</strong>
              <span>Review teaching workload & cadre</span>
            </div>
            <ChevronRight size={16} className="hod-quick-chevron" />
          </button>
        </div>
      </div>
    </div>
  );
}
