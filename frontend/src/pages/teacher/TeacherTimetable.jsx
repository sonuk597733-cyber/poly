import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  MapPin,
  Users,
  Download,
  Loader2,
  BookOpen,
  Layers,
  Printer,
  Sparkles,
  Building,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import OfficialCollegeTimetableGrid from "../../components/timetable/OfficialCollegeTimetableGrid";
import "./TeacherTheme.css";
import "./TeacherTimetable.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BRANCHES = ["CSE", "Mechanical", "Electrical", "Civil", "ECE"];

export default function TeacherTimetable({ currentUser }) {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const initialDay = DAYS.includes(todayName) ? todayName : "Monday";

  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [scheduleScope, setScheduleScope] = useState("personal"); // "personal" | "department"
  const [personalSchedule, setPersonalSchedule] = useState(null);
  const [departmentTimetable, setDepartmentTimetable] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  const [fullscreen, setFullscreen] = useState(false);

  // Department Filter
  const [deptBranch, setDeptBranch] = useState(currentUser?.department || "CSE");
  const [deptSemester, setDeptSemester] = useState("Semester 5");
  const [deptViewMode, setDeptViewMode] = useState("table"); // "table" | "cards"

  const [loading, setLoading] = useState(true);

  // Load personal multi-branch teaching schedule
  useEffect(() => {
    loadScheduleData();
  }, [scheduleScope, deptBranch, deptSemester]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      if (scheduleScope === "personal") {
        const res = await authApi.getTeacherPersonalSchedule();
        if (res?.success) {
          setPersonalSchedule(res);
        }
      } else {
        const res = await authApi.getPublishedTimetable({
          branch: deptBranch,
          semester: deptSemester
        });
        if (res?.success) {
          setDepartmentTimetable(res.timetable);
        }
      }
    } catch (err) {
      console.error("Teacher timetable load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Determine active slots based on scope and selected day
  const activeDays =
    scheduleScope === "personal"
      ? personalSchedule?.scheduleDays || []
      : departmentTimetable?.scheduleDays || [];

  const currentDayDoc = activeDays.find((d) => d.dayOfWeek === selectedDay);
  const slots = currentDayDoc?.slots?.filter((s) => !s.isBreak) || [];

  const stats = personalSchedule?.stats;
  const teacher = personalSchedule?.teacher;

  return (
    <div className="teacher-role-view teacher-tt-container">
      {/* 1. TOP HEADER & SCOPE SWITCHER */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <Calendar size={24} color="var(--tch-primary, #FF6B0A)" />
            Faculty Academic Timetable
          </h2>
          <p>
            Personal multi-cohort teaching roster, laboratory allocations, and free periods for {currentUser?.fullName || teacher?.name || "Professor"}.
          </p>
        </div>

        <div className="tch-header-controls">
          <div className="tch-scope-tabs">
            <button
              className={`tch-scope-btn ${scheduleScope === "personal" ? "active" : ""}`}
              onClick={() => setScheduleScope("personal")}
            >
              My Teaching Schedule
            </button>
            <button
              className={`tch-scope-btn ${scheduleScope === "department" ? "active" : ""}`}
              onClick={() => setScheduleScope("department")}
            >
              Department Master View
            </button>
          </div>

          {scheduleScope === "department" && (
            <div className="tch-dept-filters">
              <select
                value={deptBranch}
                onChange={(e) => setDeptBranch(e.target.value)}
                className="tch-select"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={deptSemester}
                onChange={(e) => setDeptSemester(e.target.value)}
                className="tch-select"
              >
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={() => window.print()} className="tch-btn-print">
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. TEACHING WORKLOAD METRICS (Personal view) */}
      {scheduleScope === "personal" && (
        <div className="tch-metrics-row">
          <div className="tch-metric-card">
            <span className="tch-metric-lbl">Total Teaching Periods</span>
            <span className="tch-metric-num">{stats?.totalWeeklyClasses || 0}</span>
            <span className="tch-metric-sub">Across academic week</span>
          </div>

          <div className="tch-metric-card">
            <span className="tch-metric-lbl">Batches / Cohorts</span>
            <span className="tch-metric-num">{stats?.cohortsCount || 0}</span>
            <span className="tch-metric-sub">
              {stats?.cohorts?.length > 0 ? stats.cohorts.join(", ") : "Single Department"}
            </span>
          </div>

          <div className="tch-metric-card">
            <span className="tch-metric-lbl">Today's Assigned Lectures</span>
            <span className="tch-metric-num">
              {slots.length}
            </span>
            <span className="tch-metric-sub">For {selectedDay}</span>
          </div>

          <div className="tch-metric-card">
            <span className="tch-metric-lbl">Free Periods</span>
            <span className="tch-metric-num tch-text-green">
              {Math.max(0, 7 - slots.length)}
            </span>
            <span className="tch-metric-sub">Available today</span>
          </div>
        </div>
      )}

      {/* 3. DAY SELECTOR BAR */}
      <div className="teacher-day-tabs">
        {DAYS.map((day) => {
          const isToday = day === todayName;
          return (
            <button
              key={day}
              type="button"
              className={`teacher-day-btn ${selectedDay === day ? "active" : ""}`}
              onClick={() => setSelectedDay(day)}
            >
              <Calendar size={13} />
              <span>{day}</span>
              {isToday && <span className="tch-today-badge">Today</span>}
            </button>
          );
        })}
      </div>

      {/* 4. SCHEDULE DISPLAY */}
      {loading ? (
        <div className="tch-empty-box">
          <Loader2 size={32} className="spin" color="#FF6B0A" />
          <p>Loading teaching roster...</p>
        </div>
      ) : scheduleScope === "department" && departmentTimetable?.timetableType === "image_based" && departmentTimetable?.imageUrl ? (
        <div className="tch-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#EA580C", textTransform: "uppercase" }}>
                {departmentTimetable.collegeName || "Swami Vivekanand Subharti University"}
              </span>
              <h3 style={{ margin: "2px 0 6px 0", fontSize: "1.25rem", fontWeight: 800 }}>
                {departmentTimetable.title || "Official Department Timetable"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                {deptBranch} Engineering • {deptSemester} • Scanned Official Timetable
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                type="button"
                className="tch-scope-btn"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, minWidth: 40, textAlign: "center" }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className="tch-scope-btn"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                className="tch-scope-btn"
                onClick={() => setZoom(1.0)}
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
              <a
                href={departmentTimetable.imageUrl}
                download="department_timetable.jpg"
                target="_blank"
                rel="noreferrer"
                className="tch-scope-btn"
                title="Download"
              >
                <Download size={15} />
              </a>
            </div>
          </div>
          <div style={{ maxHeight: 650, overflow: "auto", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC", textAlign: "center" }}>
            <img
              src={departmentTimetable.imageUrl}
              alt="Department Timetable"
              style={{ maxWidth: "100%", transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease-out", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
            />
          </div>
        </div>
      ) : scheduleScope === "department" && departmentTimetable?.scheduleDays && departmentTimetable.scheduleDays.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <OfficialCollegeTimetableGrid
            scheduleDays={departmentTimetable.scheduleDays}
            branch={deptBranch}
            semester={deptSemester}
            academicSession="2026-27"
            roomNo="ROOM NO.-302"
            editable={false}
          />
        </div>
      ) : slots.length === 0 ? (
        <div className="tch-empty-box">
          <Calendar size={42} style={{ opacity: 0.6 }} />
          <h3>No Classes Assigned on {selectedDay}</h3>
          <p>
            {scheduleScope === "personal"
              ? `You have no scheduled teaching lectures on ${selectedDay}. This time can be utilized for research, student mentorship, and laboratory preparation.`
              : `No timetable slots configured for ${deptBranch} ${deptSemester} on ${selectedDay}.`}
          </p>
        </div>
      ) : (
        <div className="teacher-tt-grid">
          {slots.map((s, idx) => (
            <div
              key={idx}
              className={`tch-card teacher-tt-card ${s.type === "Practical" ? "card-practical" : "card-theory"}`}
            >
              <div className="teacher-tt-card-top">
                <div className="teacher-tt-time-chip">
                  <Clock size={13} />
                  <span>{s.startTime} – {s.endTime}</span>
                </div>
                <span className={`tch-pill ${s.type === "Practical" ? "indigo" : "blue"}`}>
                  {s.type || "Theory Lecture"}
                </span>
              </div>

              <h3 className="teacher-tt-subject">{s.subject}</h3>
              <span className="teacher-tt-code">{s.subjectCode}</span>

              {/* COHORT INFO */}
              {(s.branch || s.semester) && (
                <div className="teacher-tt-cohort-tag">
                  <Users size={12} />
                  <span>{s.branch} {s.semester} (Sec {s.section || "A"})</span>
                </div>
              )}

              <div className="teacher-tt-card-footer">
                <span className="tch-pill cyan">
                  <MapPin size={12} /> Room: <strong>{s.roomNo || "LT-201"}</strong>
                </span>
                {s.teacherName && scheduleScope === "department" && (
                  <span className="tch-pill muted">
                    <Users size={12} /> {s.teacherName}
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
