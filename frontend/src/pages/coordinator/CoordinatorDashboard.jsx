import React from "react";
import {
  Calendar,
  Layers,
  MapPin,
  Award,
  Users,
  CalendarCheck2,
  Clock,
  Bell,
  CheckCircle2,
  FileBarChart,
  BookOpen,
  ArrowRight
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import { BarMetricChart, DonutProgressChart } from "../../components/dashboard/Charts";
import "./CoordinatorDashboard.css";

export default function CoordinatorDashboard({
  currentUser,
  stats,
  charts,
  onNavigate,
  setActiveTab
}) {
  const summary = stats?.summary || {};
  const notices = stats?.notices || [];

  return (
    <div className="coord-dash-container">
      {/* Welcome Banner */}
      <div className="coord-welcome-banner">
        <div className="coord-dept-pill">
          <Layers size={13} />
          Swami Vivekanand Subharti University • Academic Coordination Cell
        </div>

        <h1 className="coord-welcome-title">
          Academic Coordinator: {currentUser?.fullName || "Academic Coordinator"}
        </h1>

        <p className="coord-welcome-sub">
          Overseeing campus-wide academic operations across <strong>5 Engineering Branches</strong> •{" "}
          Central Timetables, Room Allocations, Examination Schedules & Faculty Workload Coordination.
        </p>

        <div className="coord-welcome-actions">
          <button
            type="button"
            className="coord-action-btn primary"
            onClick={() => setActiveTab?.("timetable")}
          >
            <Layers size={16} />
            <span>Master Timetable</span>
          </button>
          <button
            type="button"
            className="coord-action-btn secondary"
            onClick={() => setActiveTab?.("rooms")}
          >
            <MapPin size={16} />
            <span>Room Allocation</span>
          </button>
          <button
            type="button"
            className="coord-action-btn secondary"
            onClick={() => setActiveTab?.("academic-calendar")}
          >
            <Calendar size={16} />
            <span>Academic Calendar</span>
          </button>
          <button
            type="button"
            className="coord-action-btn secondary"
            onClick={() => setActiveTab?.("approvals")}
          >
            <CheckCircle2 size={16} />
            <span>Pending Sanctions</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="coord-stats-grid">
        <StatCard
          title="Total Polytechnic Candidates"
          value={summary.totalStudents || 442}
          subtitle="Enrolled across CSE, ME, EE, CE, ECE"
          icon={Users}
          accentColor="#0284C7"
          trend="+12% YoY"
          trendType="up"
          onClick={() => setActiveTab?.("students")}
        />
        <StatCard
          title="Polytechnic Faculty Strength"
          value={summary.totalFaculty || 58}
          subtitle="Full-time lecturers & lab instructors"
          icon={BookOpen}
          accentColor="#7C3AED"
          trend="100% Scheduled"
          trendType="up"
          onClick={() => setActiveTab?.("faculty-directory")}
        />
        <StatCard
          title="Average Campus Attendance"
          value={`${summary.institutionAttendanceAvg || 89}%`}
          subtitle="Aggregated across 5 engineering divisions"
          icon={CalendarCheck2}
          accentColor="#059669"
          trend="Meets AICTE Standard"
          trendType="up"
          onClick={() => setActiveTab?.("attendance")}
        />
        <StatCard
          title="Lecture Hall Occupancy"
          value="84%"
          subtitle="Smart classrooms & specialized labs active"
          icon={MapPin}
          accentColor="#EA580C"
          trend="Optimal Allocation"
          trendType="up"
          onClick={() => setActiveTab?.("rooms")}
        />
      </div>

      {/* Charts Row */}
      <div className="coord-charts-row">
        <div className="coord-chart-main">
          <BarMetricChart
            title="5-Branch Polytechnic Attendance Comparison (%)"
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

        <div className="coord-chart-side">
          <DonutProgressChart
            percentage={summary.institutionAttendanceAvg || 89}
            label="Campus Attendance"
            accentColor="#0284C7"
          />
        </div>
      </div>

      {/* Live Operational Widgets */}
      <div className="coord-widgets-grid">
        {/* Widget 1: Today's Master Schedule Highlights */}
        <div className="coord-widget-card">
          <div className="coord-widget-header">
            <div className="coord-widget-title">
              <Clock size={18} className="coord-widget-icon" />
              <h3>Today's Coordinated Lectures</h3>
            </div>
            <button
              type="button"
              className="coord-link-btn"
              onClick={() => setActiveTab?.("timetable")}
            >
              Master Planner <ArrowRight size={14} />
            </button>
          </div>

          <div className="coord-widget-list">
            {[
              { time: "09:00 - 10:00 AM", branch: "CSE Sem 3", subject: "Operating Systems", room: "LT-101", faculty: "Dr. Rajesh Verma", status: "Ongoing" },
              { time: "10:15 - 11:15 AM", branch: "ME Sem 5", subject: "Thermodynamics & Heat", room: "LT-102", faculty: "Prof. Sunil Kumar", status: "Upcoming" },
              { time: "11:30 - 01:00 PM", branch: "CSE Sem 3", subject: "Data Structures Lab", room: "Lab-1 (Software)", faculty: "Er. Amit Sharma", status: "Upcoming" },
              { time: "02:00 - 03:00 PM", branch: "EE Sem 1", subject: "Electrical Networks", room: "LT-103", faculty: "Dr. Meenakshi Sundaram", status: "Upcoming" }
            ].map((slot, idx) => (
              <div key={idx} className="coord-schedule-item">
                <div className="coord-slot-time">
                  <span>{slot.time}</span>
                  <span className={`coord-status-badge ${slot.status.toLowerCase()}`}>{slot.status}</span>
                </div>
                <div className="coord-slot-info">
                  <strong>{slot.subject}</strong>
                  <p>{slot.branch} • Room: <em>{slot.room}</em> • {slot.faculty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Pending Coordination Sanctions */}
        <div className="coord-widget-card">
          <div className="coord-widget-header">
            <div className="coord-widget-title">
              <CheckCircle2 size={18} className="coord-widget-icon" />
              <h3>Academic Approvals Queue</h3>
            </div>
            <button
              type="button"
              className="coord-link-btn"
              onClick={() => setActiveTab?.("approvals")}
            >
              Review All <ArrowRight size={14} />
            </button>
          </div>

          <div className="coord-widget-list">
            {[
              { title: "Special Make-up Lab (Data Structures)", requester: "Er. Amit Sharma", department: "CSE", status: "Action Required" },
              { title: "Seminar Hall Booking for Robotics Seminar", requester: "Mechanical Engg Dept", department: "ME", status: "Action Required" },
              { title: "Midterm Retest Sanction for Medical Cases", requester: "Exam Controller Cell", department: "Academics", status: "Pending Review" }
            ].map((req, idx) => (
              <div key={idx} className="coord-approval-item">
                <div className="coord-approval-details">
                  <strong>{req.title}</strong>
                  <p>Requested by: {req.requester} ({req.department})</p>
                </div>
                <button
                  type="button"
                  className="coord-mini-action-btn"
                  onClick={() => setActiveTab?.("approvals")}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Academic Circulars & Notices */}
        <div className="coord-widget-card">
          <div className="coord-widget-header">
            <div className="coord-widget-title">
              <Bell size={18} className="coord-widget-icon" />
              <h3>Academic Coordination Notices</h3>
            </div>
            <button
              type="button"
              className="coord-link-btn"
              onClick={() => setActiveTab?.("notices")}
            >
              Broadcast <ArrowRight size={14} />
            </button>
          </div>

          <div className="coord-widget-list">
            {(notices.length > 0 ? notices.slice(0, 3) : [
              { title: "Mid-Semester Examination Schedule Notification", date: "26 Oct 2026", audience: "All Polytechnic Candidates" },
              { title: "Submission of Continuous Evaluation Marks for Phase 1", date: "24 Oct 2026", audience: "Faculty Members" },
              { title: "CAD/CAM Laboratory Maintenance and Booking Rescheduling", date: "22 Oct 2026", audience: "ME & CE Departments" }
            ]).map((notif, idx) => (
              <div key={idx} className="coord-notice-item">
                <div className="coord-notice-dot" />
                <div className="coord-notice-content">
                  <strong>{notif.title}</strong>
                  <p>{notif.date || "Active Notice"} • <em>{notif.audience || notif.targetAudience || "Campus"}</em></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
