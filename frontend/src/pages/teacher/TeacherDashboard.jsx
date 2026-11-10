import React from "react";
import {
  Users,
  Clock,
  FileText,
  Layers,
  CalendarCheck2,
  Award,
  Bell,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import { BarMetricChart, DonutProgressChart } from "../../components/dashboard/Charts";
import "./TeacherTheme.css";
import "./TeacherDashboard.css";

export default function TeacherDashboard({
  currentUser,
  stats,
  charts,
  onNavigate,
  setActiveTab
}) {
  const summary = stats?.summary || {};
  const todayClasses = stats?.todayClasses || stats?.upcomingClasses || [];
  const notices = stats?.notices || [];

  const assignedStudents = summary.assignedStudentsCount ?? 0;
  const classesTodayCount = summary.todayClassesCount ?? todayClasses.length;
  const pendingGrading = summary.pendingGradingCount ?? 0;
  const activeSubjects = summary.activeSubjectsCount ?? (currentUser?.subjects?.length || 0);

  const attendanceData = (charts?.classAttendanceData || []).map((c) => ({
    label: c.subject,
    marks: c.rate
  }));

  const completionRate = attendanceData.length > 0
    ? Math.round(attendanceData.reduce((acc, curr) => acc + curr.marks, 0) / attendanceData.length)
    : 0;

  return (
    <div className="teacher-role-view teacher-dash-container">
      {/* Welcome Hero Banner */}
      <div className="teacher-welcome-banner">
        <div className="teacher-banner-content">
          <div className="teacher-faculty-pill">
            <BookOpen size={13} />
            <span>Swami Vivekanand Subharti University • Faculty Portal</span>
          </div>

          <h1 className="teacher-welcome-title">
            Welcome back, {currentUser?.fullName || "Professor"}
          </h1>

          <p className="teacher-welcome-sub">
            Faculty in <strong>{currentUser?.department || summary.department || "Polytechnic Division"}</strong> •{" "}
            {currentUser?.designation || summary.designation || "Lecturer"} • Employee ID:{" "}
            <span className="teacher-mono-pill">
              {currentUser?.employeeId || summary.employeeId || "FAC-SUBHARTI"}
            </span>
          </p>

          <div className="teacher-welcome-actions">
            <button
              type="button"
              className="tch-btn-primary"
              onClick={() => setActiveTab?.("attendance")}
            >
              <CalendarCheck2 size={16} />
              <span>Mark Attendance</span>
            </button>
            <button
              type="button"
              className="tch-btn-secondary"
              onClick={() => setActiveTab?.("assignments")}
            >
              <FileText size={16} />
              <span>New Assignment</span>
            </button>
            <button
              type="button"
              className="tch-btn-secondary"
              onClick={() => setActiveTab?.("exams")}
            >
              <Award size={16} />
              <span>Enter Marks</span>
            </button>
            <button
              type="button"
              className="tch-btn-secondary"
              onClick={() => setActiveTab?.("notes")}
            >
              <BookOpen size={16} />
              <span>Course Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="teacher-stats-grid">
        <StatCard
          title="Assigned Students"
          value={assignedStudents}
          subtitle={`In ${summary.department || currentUser?.department || "CSE"} Engineering`}
          icon={Users}
          accentColor="#2563EB"
          trend="Enrolled Roster"
          trendType="up"
          onClick={() => setActiveTab?.("students")}
        />
        <StatCard
          title="Classes Today"
          value={classesTodayCount}
          subtitle="Lecture & lab schedule"
          icon={Clock}
          accentColor="#0284C7"
          trend={classesTodayCount > 0 ? "Active Timetable" : "Off Day"}
          trendType={classesTodayCount > 0 ? "up" : "neutral"}
          onClick={() => setActiveTab?.("timetable")}
        />
        <StatCard
          title="Pending Submissions"
          value={pendingGrading}
          subtitle="Awaiting evaluation"
          icon={FileText}
          accentColor="#F59E0B"
          trend={pendingGrading > 0 ? "Needs Review" : "All Graded"}
          trendType={pendingGrading > 0 ? "down" : "up"}
          onClick={() => setActiveTab?.("submissions")}
        />
        <StatCard
          title="Active Course Modules"
          value={activeSubjects}
          subtitle="Curriculum delivery"
          icon={Layers}
          accentColor="#10B981"
          trend="Authorized Subjects"
          trendType="up"
          onClick={() => setActiveTab?.("classes")}
        />
      </div>

      {/* Analytics & Performance Charts Row */}
      <div className="teacher-charts-row">
        <div className="tch-card teacher-chart-col">
          <div className="teacher-chart-header">
            <div>
              <h3>Subject Attendance Distribution</h3>
              <p>Biometric classroom presence rate across taught modules</p>
            </div>
            <span className="tch-pill blue">Verified Logs</span>
          </div>

          {attendanceData.length === 0 ? (
            <div className="tch-empty-box" style={{ padding: "40px 16px" }}>
              <CalendarCheck2 size={36} style={{ opacity: 0.6 }} />
              <h3>No Attendance Recorded Yet</h3>
              <p>Biometric classroom attendance logs will compute subject averages once sessions are submitted.</p>
            </div>
          ) : (
            <BarMetricChart
              title=""
              data={attendanceData}
              unit="%"
              barColor="#2563EB"
            />
          )}
        </div>

        <div className="tch-card teacher-chart-col">
          <div className="teacher-chart-header">
            <div>
              <h3>Overall Presence Index</h3>
              <p>Mean attendance index across all classes</p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 0" }}>
            <DonutProgressChart
              percentage={completionRate}
              label="Presence Mean"
              accentColor="#2563EB"
            />
          </div>
        </div>
      </div>

      {/* Interactive Operational Widgets Row */}
      <div className="teacher-widgets-grid">
        {/* Today's Teaching Schedule */}
        <div className="tch-card teacher-widget-card">
          <div className="teacher-widget-header">
            <div className="teacher-widget-title">
              <Clock size={18} color="#2563EB" />
              <h3>Today's Assigned Lecture Slots</h3>
            </div>
            <button
              type="button"
              className="teacher-widget-link"
              onClick={() => setActiveTab?.("timetable")}
            >
              <span>Weekly Timetable</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="teacher-slots-list">
            {todayClasses.length === 0 ? (
              <div className="tch-empty-box" style={{ padding: "36px 16px" }}>
                <Clock size={32} style={{ opacity: 0.6 }} />
                <h3>No Classes Today</h3>
                <p>No lectures or lab sessions are scheduled for your faculty profile today.</p>
              </div>
            ) : (
              todayClasses.slice(0, 4).map((slot, idx) => (
                <div key={idx} className="teacher-slot-item">
                  <div className="teacher-slot-time">
                    <strong>{slot.startTime}</strong>
                    <span>{slot.endTime}</span>
                  </div>
                  <div className="teacher-slot-details">
                    <h4 className="teacher-slot-title">{slot.subject}</h4>
                    <div className="teacher-slot-meta">
                      <span className="tch-pill cyan">
                        <MapPin size={11} /> Room {slot.roomNo || "LT-201"}
                      </span>
                      {slot.branch && (
                        <span className="tch-pill blue">
                          {slot.branch} • {slot.semester || "Sem"}
                        </span>
                      )}
                      <span className="tch-pill emerald">{slot.type || "Theory Lecture"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Circulars */}
        <div className="tch-card teacher-widget-card">
          <div className="teacher-widget-header">
            <div className="teacher-widget-title">
              <Bell size={18} color="#2563EB" />
              <h3>Department & Campus Notices</h3>
            </div>
            <button
              type="button"
              className="teacher-widget-link"
              onClick={() => setActiveTab?.("notices")}
            >
              <span>View All Notices</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="teacher-notices-mini">
            {notices.length === 0 ? (
              <div className="tch-empty-box" style={{ padding: "36px 16px" }}>
                <Bell size={32} style={{ opacity: 0.6 }} />
                <h3>No Circulars Posted</h3>
                <p>Official faculty orders and administrative notices will appear here.</p>
              </div>
            ) : (
              notices.slice(0, 3).map((notice) => (
                <div key={notice._id || notice.id} className="teacher-notice-item">
                  <div className="teacher-notice-top">
                    <span className={`tch-pill ${notice.priority === "urgent" ? "rose" : notice.priority === "important" ? "amber" : "blue"}`}>
                      {(notice.priority || "Normal").toUpperCase()}
                    </span>
                    <span className="teacher-notice-cat">{notice.category || "Academic"}</span>
                  </div>
                  <h4 className="teacher-notice-headline">{notice.title}</h4>
                  <p className="teacher-notice-snippet">
                    {notice.content ? `${notice.content.slice(0, 110)}...` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
