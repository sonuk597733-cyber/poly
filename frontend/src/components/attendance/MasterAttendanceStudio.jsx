import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarCheck2,
  Calendar,
  BookOpen,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Download,
  Info,
  Building2,
  Layers,
  ArrowRight,
  Printer,
  FileText,
  X,
  Keyboard,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./MasterAttendanceStudio.css";
import "./AttendanceModals.css";
import "./AttendanceCharts.css";
import "./AttendanceResponsive.css";

export default function MasterAttendanceStudio({ currentUser, staffRole = "teacher" }) {
  const [activeTab, setActiveTab] = useState("subject"); // 'subject', 'daily', 'config', 'shortage'

  // Selected Cohort
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState("5th Semester");
  const [section, setSection] = useState("A");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Search filter for student rosters
  const [rosterSearch, setRosterSearch] = useState("");
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ==========================================
  // TAB 1: SUBJECT LECTURE ATTENDANCE STATE
  // ==========================================
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [subject, setSubject] = useState("Operating Systems");
  const [subjectCode, setSubjectCode] = useState("CS-501");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  const [roomNo, setRoomNo] = useState("Room 302");
  const [topic, setTopic] = useState("");
  const [roster, setRoster] = useState([]);
  const [subjectStatuses, setSubjectStatuses] = useState({});
  const [subjectRemarks, setSubjectRemarks] = useState({});

  // ==========================================
  // TAB 2: DAILY COLLEGE ATTENDANCE STATE
  // ==========================================
  const [dailyStatuses, setDailyStatuses] = useState({});
  const [dailyRemarks, setDailyRemarks] = useState({});

  // ==========================================
  // TAB 3: ACADEMIC ATTENDANCE CONFIG STATE
  // ==========================================
  const [configCommencement, setConfigCommencement] = useState("2026-11-01");
  const [configEndDate, setConfigEndDate] = useState("2027-04-30");
  const [configMinPct, setConfigMinPct] = useState(60);
  const [configHolidays, setConfigHolidays] = useState([]);
  const [newHolidayTitle, setNewHolidayTitle] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");

  // ==========================================
  // TAB 4: SHORTAGE REPORTS & WARNING LETTER
  // ==========================================
  const [analyticsData, setAnalyticsData] = useState(null);
  const [warningLetterStudent, setWarningLetterStudent] = useState(null);

  // ==========================================
  // CORRECTIONS MODAL (AUDIT TRAIL REQUIRED)
  // ==========================================
  const [correctionModal, setCorrectionModal] = useState(null);
  const [newStatus, setNewStatus] = useState("present");
  const [auditReason, setAuditReason] = useState("");

  // Load cohort data
  const loadCohortData = useCallback(async () => {
    try {
      setLoading(true);
      const [rosterRes, ttRes, cfgRes] = await Promise.all([
        authApi.get(
          `/attendance/roster?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`
        ),
        authApi.get(
          `/attendance/today-timetable?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}&date=${date}`
        ),
        authApi.get(
          `/attendance/config?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`
        )
      ]);

      if (rosterRes?.data?.students) {
        setRoster(rosterRes.data.students);

        // Initialize status maps
        const sMap = {};
        const dMap = {};
        rosterRes.data.students.forEach((st) => {
          sMap[st.id] = "present";
          dMap[st.id] = "present";
        });
        setSubjectStatuses(sMap);
        setDailyStatuses(dMap);
      }

      if (ttRes?.data?.sessions) {
        setTodayTimetable(ttRes.data.sessions);
        if (ttRes.data.sessions.length > 0) {
          const first = ttRes.data.sessions[0];
          setSelectedPeriod(first.periodNumber);
          setSubject(first.subject);
          setSubjectCode(first.subjectCode);
          setStartTime(first.startTime);
          setEndTime(first.endTime);
          setRoomNo(first.roomNo);
        }
      }

      if (cfgRes?.data?.config) {
        const c = cfgRes.data.config;
        if (c.commencementDate) setConfigCommencement(c.commencementDate.split("T")[0]);
        if (c.academicEndDate) setConfigEndDate(c.academicEndDate.split("T")[0]);
        if (c.minAttendancePercentage) setConfigMinPct(c.minAttendancePercentage);
        if (c.holidays) setConfigHolidays(c.holidays);
      }
    } catch (err) {
      console.error("[loadCohortData] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [branch, semester, section, date]);

  useEffect(() => {
    loadCohortData();
  }, [loadCohortData]);

  // Load Daily Attendance when switching to Daily Tab
  const loadDailyAttendance = async () => {
    try {
      const res = await authApi.get(
        `/attendance/daily-college?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}&date=${date}`
      );
      if (res?.data?.records && res.data.records.length > 0) {
        const dMap = { ...dailyStatuses };
        const rMap = {};
        res.data.records.forEach((r) => {
          dMap[r.studentId] = r.status;
          if (r.remarks) rMap[r.studentId] = r.remarks;
        });
        setDailyStatuses(dMap);
        setDailyRemarks(rMap);
      }
    } catch (err) {
      console.error("[loadDailyAttendance] Error:", err);
    }
  };

  // Load analytics when switching to shortage tab
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await authApi.get(
        `/attendance/analytics?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`
      );
      if (res?.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error("[loadAnalytics] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily") loadDailyAttendance();
    if (activeTab === "shortage") loadAnalytics();
  }, [activeTab]);

  // Select Timetable Period click handler
  const handleSelectPeriod = (slot) => {
    setSelectedPeriod(slot.periodNumber);
    setSubject(slot.subject);
    setSubjectCode(slot.subjectCode || "");
    setStartTime(slot.startTime || "");
    setEndTime(slot.endTime || "");
    setRoomNo(slot.roomNo || "Room 302");
  };

  // Bulk status changers
  const markAllSubject = (status) => {
    const updated = {};
    roster.forEach((st) => {
      updated[st.id] = status;
    });
    setSubjectStatuses(updated);
  };

  const markAllDaily = (status) => {
    const updated = {};
    roster.forEach((st) => {
      updated[st.id] = status;
    });
    setDailyStatuses(updated);
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((st) => {
      if (!rosterSearch) return true;
      const q = rosterSearch.toLowerCase();
      return st.name.toLowerCase().includes(q) || (st.rollNumber && st.rollNumber.toLowerCase().includes(q));
    });
  }, [roster, rosterSearch]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }
      if (filteredRoster.length === 0) return;
      const currentStudent = filteredRoster[activeStudentIndex];
      if (!currentStudent) return;

      const key = e.key.toLowerCase();
      if (key === "p") {
        e.preventDefault();
        if (activeTab === "subject") {
          setSubjectStatuses((prev) => ({ ...prev, [currentStudent.id]: "present" }));
        } else if (activeTab === "daily") {
          setDailyStatuses((prev) => ({ ...prev, [currentStudent.id]: "present" }));
        }
        if (activeStudentIndex < filteredRoster.length - 1) setActiveStudentIndex((i) => i + 1);
      } else if (key === "a") {
        e.preventDefault();
        if (activeTab === "subject") {
          setSubjectStatuses((prev) => ({ ...prev, [currentStudent.id]: "absent" }));
        } else if (activeTab === "daily") {
          setDailyStatuses((prev) => ({ ...prev, [currentStudent.id]: "absent" }));
        }
        if (activeStudentIndex < filteredRoster.length - 1) setActiveStudentIndex((i) => i + 1);
      } else if (key === "l") {
        e.preventDefault();
        if (activeTab === "subject") {
          setSubjectStatuses((prev) => ({ ...prev, [currentStudent.id]: "late" }));
        } else if (activeTab === "daily") {
          setDailyStatuses((prev) => ({ ...prev, [currentStudent.id]: "late" }));
        }
        if (activeStudentIndex < filteredRoster.length - 1) setActiveStudentIndex((i) => i + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (activeStudentIndex < filteredRoster.length - 1) setActiveStudentIndex((i) => i + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeStudentIndex > 0) setActiveStudentIndex((i) => i - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStudentIndex, filteredRoster, activeTab]);

  // Submit Workflow B: Subject Lecture Attendance
  const submitSubjectAttendance = async () => {
    try {
      setSubmitting(true);
      const records = roster.map((st) => ({
        studentId: st.id,
        studentName: st.name,
        rollNumber: st.rollNumber,
        status: subjectStatuses[st.id] || "present",
        remarks: subjectRemarks[st.id] || ""
      }));

      const payload = {
        subject,
        subjectCode,
        branch,
        semester,
        section,
        date,
        periodNumber: selectedPeriod,
        startTime,
        endTime,
        roomNo,
        topic,
        records
      };

      const res = await authApi.post("/attendance/subject-session", payload);
      if (res?.data?.success) {
        showToast(`Attendance saved for ${subject} (Period ${selectedPeriod}).`);
        loadCohortData();
      }
    } catch (err) {
      console.error("[submitSubjectAttendance] Error:", err);
      showToast(err.response?.data?.message || "Failed to save lecture attendance.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Workflow A: Daily College Attendance
  const submitDailyAttendance = async () => {
    try {
      setSubmitting(true);
      const records = roster.map((st) => ({
        studentId: st.id,
        status: dailyStatuses[st.id] || "present",
        remarks: dailyRemarks[st.id] || ""
      }));

      const payload = {
        branch,
        semester,
        section,
        date,
        records
      };

      const res = await authApi.post("/attendance/daily-college", payload);
      if (res?.data?.success) {
        showToast("Daily College Attendance saved successfully.");
      }
    } catch (err) {
      console.error("[submitDailyAttendance] Error:", err);
      showToast(err.response?.data?.message || "Failed to save daily college attendance.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Academic Attendance Configuration
  const saveConfig = async () => {
    try {
      setSubmitting(true);
      const payload = {
        branch,
        semester,
        section,
        commencementDate: configCommencement,
        academicEndDate: configEndDate,
        minAttendancePercentage: Number(configMinPct) || 60,
        holidays: configHolidays
      };

      const res = await authApi.post("/attendance/config", payload);
      if (res?.data?.success) {
        showToast("Academic Attendance Configuration updated.");
      }
    } catch (err) {
      console.error("[saveConfig] Error:", err);
      showToast(err.response?.data?.message || "Failed to save config.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const addHoliday = () => {
    if (!newHolidayTitle || !newHolidayDate) return;
    setConfigHolidays([...configHolidays, { title: newHolidayTitle, date: newHolidayDate, type: "holiday" }]);
    setNewHolidayTitle("");
    setNewHolidayDate("");
  };

  const removeHoliday = (index) => {
    setConfigHolidays(configHolidays.filter((_, i) => i !== index));
  };

  // Export Shortage CSV
  const exportShortageCSV = () => {
    if (!analyticsData?.shortageStudents || analyticsData.shortageStudents.length === 0) {
      showToast("No shortage records to export.", "error");
      return;
    }
    const headers = "Student Name,Roll Number,Days Attended,Eligible Days,Percentage,Days Needed to Reach 60%\n";
    const rows = analyticsData.shortageStudents
      .map(
        (s) =>
          `"${s.name}","${s.rollNumber}",${s.presentDays},${s.totalEligibleDays},"${s.percentage}%",${s.daysNeededFor60}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Shortage_Report_${branch}_${semester}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="master-attendance-studio">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: toast.type === "error" ? "#FEF2F2" : "#ECFDF5",
            border: `1px solid ${toast.type === "error" ? "#F87171" : "#34D399"}`,
            color: toast.type === "error" ? "#991B1B" : "#065F46",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
          }}
        >
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* 1. Studio Header Card */}
      <div className="studio-header-card">
        <div className="studio-header-left">
          <div className="studio-badges-row">
            <span className="studio-badge-auth">
              <ShieldCheck size={13} />
              Staff Studio • Authorized Rights
            </span>
            <span className="studio-badge-role">Role: {currentUser?.role || staffRole}</span>
          </div>
          <h1 className="studio-title">Master Attendance Management Studio</h1>
          <p className="studio-desc">
            Record subject lectures, daily college presence, configure commencement benchmarks, and audit student compliance.
          </p>
        </div>

        <div className="studio-cohort-bar">
          <div className="studio-selector-group">
            <label className="studio-selector-label">Branch</label>
            <select className="studio-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="CSE">CSE</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Civil">Civil</option>
              <option value="ECE">ECE</option>
            </select>
          </div>

          <div className="studio-selector-group">
            <label className="studio-selector-label">Semester</label>
            <select className="studio-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="1st Semester">1st Sem</option>
              <option value="2nd Semester">2nd Sem</option>
              <option value="3rd Semester">3rd Sem</option>
              <option value="4th Semester">4th Sem</option>
              <option value="5th Semester">5th Sem</option>
              <option value="6th Semester">6th Sem</option>
            </select>
          </div>

          <div className="studio-selector-group">
            <label className="studio-selector-label">Date</label>
            <input
              type="date"
              className="studio-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button className="studio-btn-reload" onClick={loadCohortData} disabled={loading} title="Reload Cohort">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2. Workflow Tabs Navigation */}
      <div className="studio-tabs-nav">
        <button
          className={`studio-tab-btn ${activeTab === "subject" ? "active" : ""}`}
          onClick={() => setActiveTab("subject")}
        >
          <BookOpen size={15} />
          Workflow B: Subject Lecture Register
        </button>

        <button
          className={`studio-tab-btn ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          <CalendarCheck2 size={15} />
          Workflow A: Daily College Roll Call
        </button>

        <button
          className={`studio-tab-btn ${activeTab === "config" ? "active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          <Settings size={15} />
          Workflow C: Academic Start Date & Config
        </button>

        <button
          className={`studio-tab-btn ${activeTab === "shortage" ? "active" : ""}`}
          onClick={() => setActiveTab("shortage")}
        >
          <AlertTriangle size={15} />
          Workflow D: Shortage Analytics (&lt;60%)
        </button>
      </div>

      {/* ====================================================
          TAB 1: SUBJECT LECTURE ATTENDANCE (WORKFLOW B)
          ==================================================== */}
      {activeTab === "subject" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Scheduled Timetable Carousel */}
          {todayTimetable.length > 0 && (
            <div className="studio-timetable-section">
              <div className="studio-section-header">
                <h3 className="studio-section-title">
                  <Clock size={16} />
                  Scheduled Timetable Periods for Selected Date (Click to Load)
                </h3>
              </div>
              <div className="studio-periods-grid">
                {todayTimetable.map((slot, sIdx) => {
                  const isSelected = selectedPeriod === slot.periodNumber;
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleSelectPeriod(slot)}
                      className={`studio-period-pill ${isSelected ? "selected" : ""}`}
                    >
                      <div className="studio-period-top">
                        <span>Period {slot.periodNumber}</span>
                        {slot.isMarked && (
                          <span style={{ fontSize: "10px", fontWeight: "800", color: "#059669", background: "#D1FAE5", padding: "1px 6px", borderRadius: "4px" }}>
                            Marked
                          </span>
                        )}
                      </div>
                      <div className="studio-period-sub-name">{slot.subject}</div>
                      <div className="studio-period-sub-time">
                        {slot.startTime} • {slot.roomNo}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session Parameters Form */}
          <div className="studio-session-form-card">
            <div className="studio-form-field">
              <label className="studio-form-label">Subject</label>
              <input
                type="text"
                className="studio-form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="studio-form-field">
              <label className="studio-form-label">Period & Timing</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="studio-form-input"
                  style={{ width: "60px", textAlign: "center" }}
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                />
                <input
                  type="text"
                  className="studio-form-input"
                  style={{ flex: 1 }}
                  placeholder="09:00 AM - 10:00 AM"
                  value={`${startTime} - ${endTime}`}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="studio-form-field">
              <label className="studio-form-label">Room / Lab</label>
              <input
                type="text"
                className="studio-form-input"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
              />
            </div>
            <div className="studio-form-field">
              <label className="studio-form-label">Topic Covered</label>
              <input
                type="text"
                className="studio-form-input"
                placeholder="e.g. Unit 3: Concurrency Control"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>

          {/* Speed Roll-Call Banner */}
          <div className="studio-speed-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Keyboard size={16} />
              <span>Speed Mode:</span>
              <span>
                Press <kbd className="studio-shortcut-kbd">P</kbd> Present,{" "}
                <kbd className="studio-shortcut-kbd">A</kbd> Absent,{" "}
                <kbd className="studio-shortcut-kbd">L</kbd> Late,{" "}
                <kbd className="studio-shortcut-kbd">↓ / ↑</kbd> Navigate
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--studio-navy-400)" }} />
              <input
                type="text"
                placeholder="Filter student..."
                value={rosterSearch}
                onChange={(e) => {
                  setRosterSearch(e.target.value);
                  setActiveStudentIndex(0);
                }}
                style={{ padding: "6px 12px 6px 30px", fontSize: "12px", borderRadius: "8px", border: "1px solid var(--studio-border)", background: "#FFFFFF" }}
              />
            </div>
          </div>

          {/* Roster Container */}
          <div className="studio-roster-container">
            <div className="studio-roster-toolbar">
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--studio-navy-950)", margin: 0 }}>
                  Student Roll Register ({filteredRoster.length} Candidates)
                </h3>
                <p style={{ fontSize: "12px", color: "var(--studio-navy-500)", margin: "2px 0 0" }}>
                  Recording lecture attendance for Period {selectedPeriod} ({subject}).
                </p>
              </div>

              <div className="studio-bulk-actions">
                <button
                  type="button"
                  onClick={() => markAllSubject("present")}
                  className="studio-btn-bulk-present"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAllSubject("absent")}
                  className="studio-btn-bulk-absent"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="studio-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Attendance Status</th>
                    <th>Optional Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((st, idx) => {
                    const status = subjectStatuses[st.id] || "present";
                    const isFocused = idx === activeStudentIndex;

                    return (
                      <tr
                        key={st.id}
                        onClick={() => setActiveStudentIndex(idx)}
                        style={{
                          background: isFocused ? "rgba(255, 107, 10, 0.08)" : "transparent",
                          cursor: "pointer"
                        }}
                      >
                        <td style={{ color: "var(--studio-navy-400)", fontFamily: "monospace" }}>{idx + 1}</td>
                        <td className="studio-roll-no">{st.rollNumber}</td>
                        <td className="studio-student-name">{st.name}</td>
                        <td>
                          <div className="studio-status-toggles">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubjectStatuses({ ...subjectStatuses, [st.id]: "present" });
                              }}
                              className={`studio-toggle-btn present ${status === "present" ? "active" : ""}`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubjectStatuses({ ...subjectStatuses, [st.id]: "absent" });
                              }}
                              className={`studio-toggle-btn absent ${status === "absent" ? "active" : ""}`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubjectStatuses({ ...subjectStatuses, [st.id]: "late" });
                              }}
                              className={`studio-toggle-btn late ${status === "late" ? "active" : ""}`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Add remark..."
                            value={subjectRemarks[st.id] || ""}
                            onChange={(e) => setSubjectRemarks({ ...subjectRemarks, [st.id]: e.target.value })}
                            className="studio-form-input"
                            style={{ padding: "4px 8px", width: "100%", maxWidth: "240px" }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="studio-footer-action-bar">
              <span style={{ fontSize: "12px", color: "var(--studio-navy-500)", fontWeight: 500 }}>
                Saves session record with permanent staff audit trail.
              </span>
              <button
                type="button"
                onClick={submitSubjectAttendance}
                disabled={submitting}
                className="studio-btn-submit-primary"
              >
                <Save size={15} />
                {submitting ? "Saving..." : `Save Lecture Attendance (Period ${selectedPeriod})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 2: DAILY COLLEGE ATTENDANCE (WORKFLOW A)
          ==================================================== */}
      {activeTab === "daily" && (
        <div className="studio-roster-container">
          <div className="studio-roster-toolbar">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", background: "#F3E8FF", color: "#7E22CE", padding: "2px 8px", borderRadius: "6px" }}>
                  1 Working Day = 1 Attendance Day
                </span>
                <span style={{ fontSize: "12px", color: "var(--studio-navy-500)", fontWeight: 600 }}>
                  Date: <strong>{date}</strong>
                </span>
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--studio-navy-950)", margin: 0 }}>
                Daily College Attendance Register
              </h3>
            </div>

            <div className="studio-bulk-actions">
              <button
                type="button"
                onClick={() => markAllDaily("present")}
                className="studio-btn-bulk-present"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAllDaily("absent")}
                className="studio-btn-bulk-absent"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="studio-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>College Presence Status</th>
                  <th>Leave / Exemption Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((st) => {
                  const status = dailyStatuses[st.id] || "present";
                  return (
                    <tr key={st.id}>
                      <td className="studio-roll-no">{st.rollNumber}</td>
                      <td className="studio-student-name">{st.name}</td>
                      <td>
                        <div className="studio-status-toggles">
                          <button
                            type="button"
                            onClick={() => setDailyStatuses({ ...dailyStatuses, [st.id]: "present" })}
                            className={`studio-toggle-btn present ${status === "present" ? "active" : ""}`}
                          >
                            Present on Campus
                          </button>
                          <button
                            type="button"
                            onClick={() => setDailyStatuses({ ...dailyStatuses, [st.id]: "absent" })}
                            className={`studio-toggle-btn absent ${status === "absent" ? "active" : ""}`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setDailyStatuses({ ...dailyStatuses, [st.id]: "late" })}
                            className={`studio-toggle-btn late ${status === "late" ? "active" : ""}`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Reason for leave/absence..."
                          value={dailyRemarks[st.id] || ""}
                          onChange={(e) => setDailyRemarks({ ...dailyRemarks, [st.id]: e.target.value })}
                          className="studio-form-input"
                          style={{ padding: "4px 8px", width: "100%", maxWidth: "300px" }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="studio-footer-action-bar">
            <span style={{ fontSize: "12px", color: "var(--studio-navy-500)", fontWeight: 500 }}>
              Unique database index enforces strictly 1 college record per student per date.
            </span>
            <button
              type="button"
              onClick={submitDailyAttendance}
              disabled={submitting}
              className="studio-btn-submit-primary"
              style={{ background: "linear-gradient(135deg, #7E22CE, #9333EA)" }}
            >
              <Save size={15} />
              {submitting ? "Saving Daily Attendance..." : "Save Daily College Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: ACADEMIC START DATE & ATTENDANCE CONFIG
          ==================================================== */}
      {activeTab === "config" && (
        <div className="studio-config-card">
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--studio-navy-950)", margin: 0 }}>
              Academic Attendance Configuration
            </h3>
            <p style={{ fontSize: "12px", color: "var(--studio-navy-500)", margin: "4px 0 0" }}>
              Defines the official class commencement date from which overall attendance calculations begin.
            </p>
          </div>

          <div className="studio-config-grid">
            <div className="studio-form-field">
              <label className="studio-form-label">Official Class Commencement Date *</label>
              <input
                type="date"
                className="studio-form-input"
                value={configCommencement}
                onChange={(e) => setConfigCommencement(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--studio-navy-400)" }}>
                Calculations strictly ignore days prior to this date.
              </span>
            </div>

            <div className="studio-form-field">
              <label className="studio-form-label">Academic End Date</label>
              <input
                type="date"
                className="studio-form-input"
                value={configEndDate}
                onChange={(e) => setConfigEndDate(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--studio-navy-400)" }}>
                Used to determine remaining semester working days.
              </span>
            </div>

            <div className="studio-form-field">
              <label className="studio-form-label">Minimum Attendance Benchmark (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                className="studio-form-input"
                value={configMinPct}
                onChange={(e) => setConfigMinPct(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--studio-navy-400)" }}>
                Default: 60%. Triggers shortage alerts below this number.
              </span>
            </div>
          </div>

          {/* Holiday Manager */}
          <div className="studio-holiday-manager">
            <h4 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--studio-navy-800)", margin: 0 }}>
              Declared Holidays & Vacations (Excluded from Working Days)
            </h4>

            <div className="studio-holiday-add-row">
              <input
                type="text"
                placeholder="Holiday Name (e.g. Guru Nanak Jayanti)"
                value={newHolidayTitle}
                onChange={(e) => setNewHolidayTitle(e.target.value)}
                className="studio-form-input"
                style={{ flex: 1, minWidth: "220px" }}
              />
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="studio-form-input"
              />
              <button
                type="button"
                onClick={addHoliday}
                className="studio-btn-submit-primary"
                style={{ padding: "8px 16px" }}
              >
                <Plus size={14} /> Add Holiday
              </button>
            </div>

            <div className="studio-holiday-chips-grid">
              {configHolidays.map((h, hIdx) => (
                <div key={hIdx} className="studio-holiday-chip">
                  <div>
                    <div className="studio-holiday-chip-title">{h.title}</div>
                    <div className="studio-holiday-chip-date">
                      {new Date(h.date).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHoliday(hIdx)}
                    className="studio-btn-del-holiday"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "14px", borderTop: "1px solid var(--studio-border)" }}>
            <button
              type="button"
              onClick={saveConfig}
              disabled={submitting}
              className="studio-btn-submit-primary"
            >
              <Save size={15} />
              {submitting ? "Saving Configuration..." : "Save Academic Attendance Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 4: SHORTAGE ANALYTICS & REPORTS (<60%)
          ==================================================== */}
      {activeTab === "shortage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="studio-shortage-stats">
            <div className="studio-shortage-card">
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--studio-navy-400)" }}>
                Enrolled Cohort
              </span>
              <div className="studio-shortage-card-val">
                {analyticsData?.totalStudents || roster.length} Students
              </div>
            </div>

            <div className="studio-shortage-card">
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--studio-navy-400)" }}>
                Cohort Average Ratio
              </span>
              <div className="studio-shortage-card-val green">
                {analyticsData?.cohortAveragePercentage || 83.3}%
              </div>
            </div>

            <div className="studio-shortage-card critical">
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--studio-navy-400)" }}>
                Below 60% Shortage List
              </span>
              <div className="studio-shortage-card-val red">
                {analyticsData?.shortageCount || 0} Students
              </div>
            </div>
          </div>

          <div className="studio-roster-container">
            <div className="studio-roster-toolbar">
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--studio-navy-950)", margin: 0 }}>
                  Students Falling Short of Minimum 60% Benchmark
                </h3>
                <p style={{ fontSize: "12px", color: "var(--studio-navy-500)", margin: "2px 0 0" }}>
                  Automated computation showing exact days needed for each student to restore academic eligibility.
                </p>
              </div>

              <button
                type="button"
                onClick={exportShortageCSV}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "var(--studio-radius-md)", background: "var(--studio-surface-alt)", border: "1px solid var(--studio-border)", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                <Download size={14} /> Export Shortage CSV
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="studio-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Days Attended</th>
                    <th>Eligible Working Days</th>
                    <th>Current Ratio</th>
                    <th>Days Needed to Reach 60%</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!analyticsData?.shortageStudents || analyticsData.shortageStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "var(--studio-navy-400)" }}>
                        No students are currently below the 60% attendance benchmark in this cohort!
                      </td>
                    </tr>
                  ) : (
                    analyticsData.shortageStudents.map((s, idx) => (
                      <tr key={idx} style={{ background: "rgba(254, 242, 242, 0.4)" }}>
                        <td className="studio-roll-no">{s.rollNumber}</td>
                        <td className="studio-student-name">{s.name}</td>
                        <td style={{ color: "var(--studio-emerald-600)", fontWeight: "800" }}>{s.presentDays}</td>
                        <td style={{ color: "var(--studio-navy-600)" }}>{s.totalEligibleDays}</td>
                        <td style={{ color: "var(--studio-rose-600)", fontWeight: "800" }}>{Number(s.percentage || 0).toFixed(2)}%</td>
                        <td>
                          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECDD3" }}>
                            {s.daysNeededFor60} Consecutive Days
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setWarningLetterStudent(s)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: "#FFFFFF", border: "1px solid #FECDD3", color: "#B91C1C", cursor: "pointer" }}
                          >
                            <Printer size={12} /> Notice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          OFFICIAL SHORTAGE WARNING LETTER PRINT MODAL
          ==================================================== */}
      {warningLetterStudent && (
        <div className="studio-warning-modal-backdrop">
          <div className="studio-warning-modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--studio-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Printer size={18} style={{ color: "var(--studio-rose-600)" }} />
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--studio-navy-950)", margin: 0 }}>
                  Official Statutory Attendance Shortage Notice
                </h3>
              </div>
              <button onClick={() => setWarningLetterStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--studio-navy-400)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
              <div className="studio-official-letterhead">
                <div className="studio-official-crest-title">
                  <h2>Swami Vivekanand Subharti University</h2>
                  <h4>Faculty of Polytechnic • Academic Coordination Cell</h4>
                  <p>Subhartipuram, NH-58, Delhi-Haridwar Bypass Road, Meerut - 250005 (U.P.)</p>
                  <div style={{ marginTop: "12px", fontSize: "12px", fontWeight: "900", color: "#B91C1C", letterSpacing: "1px" }}>
                    STATUTORY SHORTAGE NOTICE & EXAMINATION DEBARMENT ADVISORY
                  </div>
                </div>

                <div className="studio-official-ref-bar">
                  <span><strong>Ref:</strong> SVSU/POLY/SHORTAGE/2026/0442</span>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>

                <div style={{ marginBottom: "14px", fontSize: "12px", lineHeight: 1.5 }}>
                  <p><strong>To:</strong></p>
                  <p><strong>Student Name:</strong> {warningLetterStudent.name}</p>
                  <p><strong>Roll Number:</strong> {warningLetterStudent.rollNumber}</p>
                  <p><strong>Cohort:</strong> {branch} • {semester} • Section {section}</p>
                </div>

                <p style={{ fontWeight: "700" }}>
                  Subject: Mandatory Notice regarding severe attendance deficit below the statutory 60% requirement.
                </p>

                <p>Dear Student / Guardian,</p>

                <p>
                  This official memorandum serves to formally notify you that following the Academic Attendance Audit conducted from the official semester commencement date (01 November 2026), your overall college attendance record stands as follows:
                </p>

                <table className="studio-official-stats-table">
                  <tbody>
                    <tr>
                      <th>Total Eligible Working Days</th>
                      <td><strong>{warningLetterStudent.totalEligibleDays} Days</strong> (Sundays & Holidays Excluded)</td>
                    </tr>
                    <tr>
                      <th>Days Present on Campus</th>
                      <td><strong>{warningLetterStudent.presentDays} Days</strong></td>
                    </tr>
                    <tr>
                      <th>Recorded Overall Ratio</th>
                      <td style={{ color: "#DC2626", fontWeight: "900" }}>{warningLetterStudent.percentage}%</td>
                    </tr>
                    <tr>
                      <th>Mandatory University Benchmark</th>
                      <td><strong>60.0% Minimum</strong></td>
                    </tr>
                    <tr>
                      <th>Mandatory Remediation Deficit</th>
                      <td style={{ color: "#DC2626", fontWeight: "900" }}>
                        {warningLetterStudent.daysNeededFor60} Consecutive Working Days Required
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p>
                  You are hereby strictly advised that failure to rectify this attendance deficit prior to the semester final examination schedule will result in immediate debarment from theoretical and practical semester examinations in accordance with the Academic Regulations of Swami Vivekanand Subharti University.
                </p>

                <div className="studio-official-signatures">
                  <div className="studio-sig-block">
                    <div className="studio-sig-line" />
                    <span className="studio-sig-name">Er. Deepak Kumar</span>
                    <span className="studio-sig-title">Class Coordinator</span>
                  </div>
                  <div className="studio-sig-block">
                    <div className="studio-sig-line" />
                    <span className="studio-sig-name">Er. Amit Kumar</span>
                    <span className="studio-sig-title">Academic Coordinator</span>
                  </div>
                  <div className="studio-sig-block">
                    <div className="studio-sig-line" />
                    <span className="studio-sig-name">Prof. (Dr.) S. C. Tiwari</span>
                    <span className="studio-sig-title">Principal, Polytechnic</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "var(--studio-surface-alt)", borderTop: "1px solid var(--studio-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--studio-navy-500)" }}>
                Official University Document • Subharti Polytechnic
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="studio-btn-submit-primary"
                  style={{ background: "#0F172A" }}
                >
                  <Printer size={14} /> Print Formal Notice
                </button>
                <button
                  type="button"
                  onClick={() => setWarningLetterStudent(null)}
                  style={{ padding: "8px 16px", borderRadius: "var(--studio-radius-md)", background: "#FFFFFF", border: "1px solid var(--studio-border)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
