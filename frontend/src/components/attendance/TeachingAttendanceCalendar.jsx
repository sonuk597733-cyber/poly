import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  Sliders,
  X
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./MasterAttendanceStudio.css";

function LectureStudentRosterModal({ session, onClose }) {
  if (!session) return null;

  const [rosterData, setRosterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadRoster() {
      try {
        setLoading(true);
        const res = await authApi.get(`/attendance/lecture-roster?sessionId=${session.sessionId}`);
        if (!ignore && res?.data?.success) {
          setRosterData(res.data);
        }
      } catch (err) {
        console.error("[LectureStudentRosterModal] Error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadRoster();
    return () => { ignore = true; };
  }, [session.sessionId]);

  const students = rosterData?.students || [];

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [students, statusFilter, searchQuery]);

  return (
    <div className="subj-modal-backdrop" onClick={onClose}>
      <div className="subj-modal-container roster-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subj-modal-header">
          <div className="subj-modal-title-group">
            <span className="subj-modal-eyebrow">Class Student Attendance Register</span>
            <h3 className="subj-modal-title">{session.subject} (Period {session.periodNumber})</h3>
            <span className="subj-modal-code">
              {session.branch} • {session.semester} • Room {session.room || session.roomNo || "302"} • {session.timeSlot || "Scheduled"}
            </span>
          </div>
          <button className="subj-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="subj-graph-kpi-grid" style={{ margin: "16px 20px 0" }}>
          <div className="subj-graph-kpi-card">
            <span className="kpi-label">Total Enrolled</span>
            <strong className="kpi-val">{rosterData?.metrics?.totalStudents ?? students.length}</strong>
            <span className="kpi-sub">Students in batch</span>
          </div>
          <div className="subj-graph-kpi-card">
            <span className="kpi-label">Present</span>
            <strong className="kpi-val good">{rosterData?.metrics?.presentCount ?? 0}</strong>
            <span className="kpi-sub">Verified attendance</span>
          </div>
          <div className="subj-graph-kpi-card">
            <span className="kpi-label">Attendance Rate</span>
            <strong className="kpi-val highlight">{rosterData?.metrics?.attendancePercentage ?? 0}%</strong>
            <span className="kpi-sub">{rosterData?.metrics?.absentCount ?? 0} Absent</span>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "10px", padding: "12px 20px 0", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="branch-picker"
          >
            <option value="all">All Enrolled ({students.length})</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
            <option value="pending">Pending Only</option>
          </select>

          <div className="search-input-box" style={{ flex: 1, minWidth: "220px", padding: "4px 10px" }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="subj-modal-body" style={{ maxHeight: "360px", overflowY: "auto", padding: "12px 20px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <RefreshCw className="spin-icon" size={26} style={{ color: "var(--subj-orange-500)", margin: "0 auto 8px" }} />
              <p style={{ color: "var(--subj-navy-500)", fontSize: "12px" }}>Loading attendance records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--subj-navy-400)" }}>
              <Users size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <p style={{ fontSize: "13px", margin: 0 }}>No students match the criteria.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Marking Method</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((st, idx) => {
                    const isPres = st.status === "present" || st.status === "late";
                    const isAbs = st.status === "absent";
                    return (
                      <tr key={idx}>
                        <td><strong>{st.rollNumber}</strong></td>
                        <td>{st.name}</td>
                        <td>
                          <span className={`status-cell-pill ${isPres ? "pill-pres" : isAbs ? "pill-abs" : "pill-pend"}`}>
                            {isPres ? <CheckCircle2 size={12} /> : isAbs ? <XCircle size={12} /> : <Clock size={12} />}
                            <span>{st.status?.toUpperCase()}</span>
                          </span>
                        </td>
                        <td>{st.markingMethod || "Digital Attendance Studio"}</td>
                        <td>{st.remarks || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function TeachingAttendanceCalendar({
  staffRole = "teacher", // 'teacher', 'hod', 'coordinator', 'principal'
  currentUser,
  onOpenStudio
}) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(11);
  const [selectedBranch, setSelectedBranch] = useState("CSE");
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Selected Day for Daily Teaching Inspector (defaults to today or first day with lectures)
  const [selectedDay, setSelectedDay] = useState(null);

  // Selected Lecture for Student Attendance Roster Modal
  const [selectedLectureForRoster, setSelectedLectureForRoster] = useState(null);

  // Fetch teaching calendar
  const fetchCalendar = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = { year, month };
      if (staffRole === "coordinator" || staffRole === "principal") {
        params.branch = selectedBranch;
      }

      const res = await authApi.get("/attendance/teaching-calendar", { params });
      if (res?.data?.success) {
        setCalendarData(res.data);

        // Auto-select day: prefer today (e.g. 2026-11-03) or first day with scheduled lectures
        const days = res.data.calendarDays || [];
        const todayDay = days.find((d) => d.isToday && d.hasLectures);
        const firstLectureDay = days.find((d) => d.hasLectures);
        setSelectedDay((prev) => {
          if (prev) {
            const found = days.find((d) => d.date === prev.date);
            if (found) return found;
          }
          return todayDay || firstLectureDay || days[0] || null;
        });
      } else {
        setError(res?.data?.message || "Failed to load teaching calendar.");
      }
    } catch (err) {
      console.error("[TeachingAttendanceCalendar] Error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load teaching calendar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month, selectedBranch, staffRole]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleResetToday = () => {
    setYear(2026);
    setMonth(11);
  };

  // Blank leading slots for the 1st of the month
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Role title & description
  const roleDisplay = useMemo(() => {
    switch (staffRole) {
      case "teacher":
        return {
          title: "My Teaching Attendance Calendar",
          eyebrow: "Faculty Daily Lecture Schedule",
          desc: "Track scheduled teaching periods, verify attendance submission statuses, and audit student roll-call records."
        };
      case "hod":
        return {
          title: "Department Attendance Calendar",
          eyebrow: "HOD Department Intelligence",
          desc: "Department-wide daily lecture conduction, faculty submission audit, and student attendance roster verification."
        };
      case "coordinator":
        return {
          title: "Academic Coordination Attendance Calendar",
          eyebrow: "Multi-Branch Academic Governance",
          desc: "Cross-department lecture execution, timetable compliance, and institutional student roster oversight."
        };
      case "principal":
        return {
          title: "Institutional Attendance Calendar",
          eyebrow: "Executive College Intelligence",
          desc: "Comprehensive polytechnic attendance health, department conduction rates, and faculty submission status."
        };
      default:
        return {
          title: "Academic Attendance Calendar",
          eyebrow: "Daily Schedule & Attendance",
          desc: "Track scheduled periods and student attendance rosters."
        };
    }
  }, [staffRole]);

  const summary = calendarData?.summary || {
    totalScheduled: 0,
    totalCompleted: 0,
    totalPending: 0,
    totalCancelled: 0,
    completionRate: 0
  };

  return (
    <div className="teaching-calendar-master-view">
      {/* 1. Header Bar */}
      <div className="teaching-header-strip">
        <div className="teaching-title-group">
          <div className="teaching-badge-row">
            <span className="role-tag-badge">{roleDisplay.eyebrow}</span>
            {(staffRole === "coordinator" || staffRole === "principal") && (
              <div className="branch-select-wrap">
                <label htmlFor="teachBranchSelect">Branch:</label>
                <select
                  id="teachBranchSelect"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="branch-picker"
                >
                  <option value="CSE">Computer Science & Engg (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ECE">Electronics & Comm (ECE)</option>
                  <option value="ME">Mechanical Engg (ME)</option>
                  <option value="CE">Civil Engg (CE)</option>
                </select>
              </div>
            )}
          </div>
          <h2 className="teaching-title">{roleDisplay.title}</h2>
          <p className="teaching-desc">{roleDisplay.desc}</p>
        </div>

        <div className="teaching-header-actions">
          {/* Month Navigator */}
          <div className="global-month-bar">
            <button
              type="button"
              className="g-month-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="g-month-display">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              type="button"
              className="g-month-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
            {(month !== 11 || year !== 2026) && (
              <button
                type="button"
                className="g-today-pill"
                onClick={handleResetToday}
              >
                Today
              </button>
            )}
          </div>

          {onOpenStudio && (
            <button
              type="button"
              className="btn-open-studio-toggle"
              onClick={onOpenStudio}
              title="Open Digital Attendance Studio for Roll Call"
            >
              <Sliders size={16} />
              <span>Digital Roll-Call Studio</span>
            </button>
          )}

          <button
            type="button"
            className="btn-refresh-unified"
            onClick={() => fetchCalendar(true)}
            disabled={loading || refreshing}
            title="Refresh Teaching Calendar"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Summary Strip */}
      <div className="teaching-kpi-strip">
        <div className="t-kpi-card">
          <div className="t-kpi-icon icon-blue">
            <Calendar size={20} />
          </div>
          <div className="t-kpi-info">
            <span className="t-kpi-label">Scheduled Lectures</span>
            <strong className="t-kpi-value">{summary.totalScheduled}</strong>
            <span className="t-kpi-sub">Curriculum sessions in month</span>
          </div>
        </div>

        <div className="t-kpi-card">
          <div className="t-kpi-icon icon-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="t-kpi-info">
            <span className="t-kpi-label">Submitted & Verified</span>
            <strong className="t-kpi-value font-emerald">{summary.totalCompleted}</strong>
            <span className="t-kpi-sub">Attendance officially locked</span>
          </div>
        </div>

        <div className="t-kpi-card">
          <div className="t-kpi-icon icon-amber">
            <AlertTriangle size={20} />
          </div>
          <div className="t-kpi-info">
            <span className="t-kpi-label">Pending Submissions</span>
            <strong className={`t-kpi-value ${summary.totalPending > 0 ? "font-amber" : "font-muted"}`}>
              {summary.totalPending}
            </strong>
            <span className="t-kpi-sub">Awaiting faculty roll call</span>
          </div>
        </div>

        <div className="t-kpi-card">
          <div className="t-kpi-icon icon-purple">
            <ShieldCheck size={20} />
          </div>
          <div className="t-kpi-info">
            <span className="t-kpi-label">Submission Rate</span>
            <strong className="t-kpi-value font-purple">
              {summary.completionRate.toFixed(1)}%
            </strong>
            <span className="t-kpi-sub">Official compliance score</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Calendar Grid (Left) + Daily Lecture Inspector (Right) */}
      <div className="teaching-workspace-grid">
        {/* Left: Teaching Calendar Card */}
        <div className="teaching-calendar-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Calendar size={18} />
              <span>Teaching Days — {MONTH_NAMES[month - 1]} {year}</span>
            </h3>
            <span className="legend-pills">
              <span className="legend-item"><span className="legend-dot dot-green" /> Submitted</span>
              <span className="legend-item"><span className="legend-dot dot-amber" /> Pending</span>
              <span className="legend-item"><span className="legend-dot dot-gray" /> No Lectures</span>
            </span>
          </div>

          <div className="panel-calendar-body">
            {/* Weekday Row */}
            <div className="teaching-weekday-header">
              {WEEKDAYS.map((wd, i) => (
                <span key={i} className={`wd-col ${i === 0 ? "wd-sunday" : ""}`}>
                  {wd}
                </span>
              ))}
            </div>

            {/* Cells */}
            {loading ? (
              <div className="teaching-loading-grid">
                <RefreshCw size={28} className="spin-icon" />
                <p>Loading teaching schedule...</p>
              </div>
            ) : (
              <div className="teaching-cells-grid">
                {leadingBlanks.map((b) => (
                  <div key={`blank-${b}`} className="t-cal-cell t-cell-empty" />
                ))}

                {calendarData?.calendarDays?.map((day) => {
                  const {
                    date,
                    dayNumber,
                    dayName,
                    isToday,
                    isSunday,
                    isHoliday,
                    hasLectures,
                    scheduledCount,
                    completedCount,
                    pendingCount,
                    status
                  } = day;

                  const isSelected = selectedDay?.date === date;
                  let cellClasses = "t-cal-cell";
                  if (isSelected) cellClasses += " t-cell-selected";
                  if (isToday) cellClasses += " t-cell-today";
                  if (isSunday) cellClasses += " t-cell-sunday";
                  if (isHoliday && !isSunday) cellClasses += " t-cell-holiday";
                  if (hasLectures) cellClasses += " t-cell-has-lectures";

                  return (
                    <div
                      key={date}
                      className={cellClasses}
                      onClick={() => setSelectedDay(day)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="t-cell-top">
                        <span className="t-cell-num">{dayNumber}</span>
                        {isToday && <span className="t-today-badge">TODAY</span>}
                      </div>

                      {hasLectures ? (
                        <div className="t-cell-badge-stack">
                          {completedCount > 0 && (
                            <span className="t-badge t-badge-done" title={`${completedCount} lecture(s) completed`}>
                              ✓ {completedCount} Done
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="t-badge t-badge-pending" title={`${pendingCount} lecture(s) pending roll call`}>
                              ⚠ {pendingCount} Pend
                            </span>
                          )}
                        </div>
                      ) : isHoliday && !isSunday ? (
                        <span className="t-cell-holiday-tag">Holiday</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Daily Lecture Inspector */}
        <div className="teaching-day-inspector-panel">
          <div className="panel-header">
            <div className="inspector-title-group">
              <span className="inspector-eyebrow">Daily Lecture Inspector</span>
              <h3 className="panel-title">
                {selectedDay ? (
                  <>
                    {new Date(selectedDay.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC"
                    })}
                  </>
                ) : (
                  "Select a Date"
                )}
              </h3>
            </div>
            {selectedDay?.hasLectures && (
              <span className="inspector-lecture-count">
                {selectedDay.scheduledCount} Scheduled Lecture(s)
              </span>
            )}
          </div>

          <div className="inspector-content">
            {!selectedDay ? (
              <div className="inspector-placeholder">
                <Calendar size={36} />
                <p>Click any date on the calendar to inspect scheduled lectures and student attendance rosters.</p>
              </div>
            ) : !selectedDay.hasLectures ? (
              <div className="inspector-no-lectures">
                <Clock size={36} />
                <h4>No Lectures Scheduled</h4>
                <p>
                  {selectedDay.isHoliday
                    ? `Institutional Holiday: ${selectedDay.holidayTitle || "Campus Closed"}`
                    : "No curriculum sessions were scheduled on this calendar day."}
                </p>
              </div>
            ) : (
              <div className="inspector-lectures-list">
                {selectedDay.lectures?.map((lec, idx) => {
                  const isSubmitted = lec.isSubmitted;

                  return (
                    <div
                      key={lec.sessionId || idx}
                      className={`inspector-lecture-card ${isSubmitted ? "lec-card-submitted" : "lec-card-pending"}`}
                    >
                      {/* Period & Time Slot */}
                      <div className="lec-time-row">
                        <span className="lec-period-badge">Period {lec.periodNumber || idx + 1}</span>
                        <span className="lec-time-slot">
                          <Clock size={13} />
                          {lec.timeSlot || "08:00 AM – 09:00 AM"}
                        </span>
                        <span className={`lec-status-pill ${isSubmitted ? "pill-done" : "pill-warn"}`}>
                          {isSubmitted ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Submitted</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} />
                              <span>Pending Roll-Call</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Subject Name & Code */}
                      <h4 className="lec-subj-name">{lec.subject}</h4>
                      <div className="lec-meta-tags">
                        <span className="meta-tag">{lec.subjectCode || "CORE"}</span>
                        <span className="meta-tag">{lec.branch} • {lec.semester}</span>
                        <span className="meta-tag">
                          <Building2 size={12} />
                          {lec.room || "Room 302"}
                        </span>
                        <span className="meta-tag">
                          <User size={12} />
                          {lec.faculty || "Faculty"}
                        </span>
                      </div>

                      {/* Attendance Numbers (if submitted) */}
                      {isSubmitted && (
                        <div className="lec-attendance-numbers">
                          <div className="att-num-box">
                            <span className="num-label">Present</span>
                            <span className="num-val font-emerald">{lec.presentCount || 0}</span>
                          </div>
                          <div className="att-num-box">
                            <span className="num-label">Absent</span>
                            <span className="num-val font-crimson">{lec.absentCount || 0}</span>
                          </div>
                          <div className="att-num-box">
                            <span className="num-label">Attendance Rate</span>
                            <span className="num-val font-purple">{lec.attendancePercentage?.toFixed(0) || 0}%</span>
                          </div>
                        </div>
                      )}

                      {/* Action Button: View Student Attendance */}
                      <div className="lec-actions">
                        <button
                          type="button"
                          className="btn-view-roster"
                          onClick={() => setSelectedLectureForRoster(lec)}
                        >
                          <Users size={15} />
                          <span>View Student Attendance Roster</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Student Attendance Roster Modal */}
      {selectedLectureForRoster && (
        <LectureStudentRosterModal
          session={selectedLectureForRoster}
          onClose={() => setSelectedLectureForRoster(null)}
        />
      )}
    </div>
  );
}
