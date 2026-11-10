import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Printer,
  Sparkles,
  X
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentAttendance.css";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "present", label: "Present" },
  { id: "late", label: "Late" },
  { id: "absent", label: "Absent" },
  { id: "excused", label: "Excused" }
];

const STATUS_TONE = {
  present: "safe",
  late: "warn",
  absent: "low",
  excused: "info"
};

const pad = (n) => String(n).padStart(2, "0");
const toLocalKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtUTCDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });

export default function StudentAttendance({ currentUser, onNavigate }) {
  // Main data
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [error, setError] = useState(null);
  const [gaugeReady, setGaugeReady] = useState(false);

  // Ledger filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Calendar + day audit
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [dayAuditLoading, setDayAuditLoading] = useState(false);
  const [dayAuditData, setDayAuditData] = useState(null);
  const [dayAuditError, setDayAuditError] = useState(null);
  const auditRequestRef = useRef(0);

  // What-if simulator
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simAttendDays, setSimAttendDays] = useState(5);
  const [simMissDays, setSimMissDays] = useState(0);

  const fetchOverallData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resOverall, resToday] = await Promise.all([
        authApi.getStudentOverallAttendance(),
        authApi.getStudentTodayAttendance()
      ]);

      if (resOverall?.data?.success) {
        setData(resOverall.data);
      } else {
        throw new Error(resOverall?.data?.message || "Failed to load overall attendance records");
      }
      if (resToday?.data?.success) {
        setTodayData(resToday.data);
      }
    } catch (err) {
      console.error("[StudentAttendance] Error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverallData();
  }, [fetchOverallData]);

  const loadDayAudit = useCallback(async (dateKey) => {
    if (!dateKey) return;
    const requestId = ++auditRequestRef.current;
    try {
      setDayAuditLoading(true);
      setDayAuditError(null);
      const res = await authApi.getStudentDayAudit(dateKey);
      if (requestId !== auditRequestRef.current) return; // a newer date was picked
      if (res?.data?.success) {
        setDayAuditData(res.data);
      } else {
        throw new Error(res?.data?.message || "Failed to load audit record for date.");
      }
    } catch (err) {
      if (requestId !== auditRequestRef.current) return;
      console.error("[StudentAttendance] Day audit load error:", err);
      setDayAuditError(err.response?.data?.message || err.message || "Unable to retrieve date details.");
    } finally {
      if (requestId === auditRequestRef.current) setDayAuditLoading(false);
    }
  }, []);

  const handleSelectDate = useCallback(
    (dateKey) => {
      if (!dateKey) return;
      setSelectedDateKey(dateKey);
      loadDayAudit(dateKey);
    },
    [loadDayAudit]
  );

  const shiftSelectedDay = useCallback(
    (delta) => {
      if (!selectedDateKey) return;
      const [y, m, d] = selectedDateKey.split("-").map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + delta));
      if (next.getUTCMonth() !== m - 1) {
        setCalendarDate(new Date(next.getUTCFullYear(), next.getUTCMonth(), 1));
      }
      handleSelectDate(next.toISOString().split("T")[0]);
    },
    [selectedDateKey, handleSelectDate]
  );

  // Close modal with Escape
  useEffect(() => {
    if (!simulatorOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setSimulatorOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [simulatorOpen]);

  // Derived data
  const metrics = useMemo(
    () =>
      data?.metrics || {
        totalEligibleDays: 0,
        presentDays: 0,
        absentDays: 0,
        excusedDays: 0,
        percentage: 0,
        minPercentage: 60,
        meetsMinimum: true,
        status: "Meets Minimum",
        daysNeededFor60: 0,
        isAchievable: true,
        remainingSemesterDays: 0
      },
    [data?.metrics]
  );

  const config = useMemo(
    () =>
      data?.config || {
        commencementDate: "2026-11-01T00:00:00.000Z",
        academicEndDate: "2027-04-30T00:00:00.000Z",
        minAttendancePercentage: 60,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      },
    [data?.config]
  );

  const formattedCommenceDate = useMemo(
    () => (config?.commencementDate ? fmtUTCDate(config.commencementDate) : "01 Nov 2026"),
    [config?.commencementDate]
  );

  const attendanceDateMap = useMemo(() => {
    const map = new Map();
    (data?.history || []).forEach((rec) => map.set(rec.date.split("T")[0], rec));
    return map;
  }, [data?.history]);

  const filteredHistory = useMemo(() => {
    if (!data?.history) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.history
      .filter((item) => {
        const dateStr = item.date.split("T")[0];
        const matchSearch =
          q === "" ||
          dateStr.includes(q) ||
          item.day?.toLowerCase().includes(q) ||
          item.remarks?.toLowerCase().includes(q) ||
          item.markedByName?.toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data?.history, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedHistory = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, safePage]);

  const serverTodayKey = data?.serverToday || toLocalKey(new Date());

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const holidayMap = new Map();
    (config?.holidays || []).forEach((h) => {
      const k = typeof h === "string" ? h : h.date;
      if (k) holidayMap.set(k.split("T")[0], h.title || "Declared institutional holiday");
    });

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ dayNumber: null, isCurrentMonth: false });

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      const record = attendanceDateMap.get(dateKey);
      const isSunday = new Date(year, month, d).getDay() === 0;
      const isHoliday = isSunday || holidayMap.has(dateKey);
      const holidayTitle =
        holidayMap.get(dateKey) || (isSunday ? "Sunday, institutional non-working day" : null);

      const isFuture = dateKey > serverTodayKey;
      const isToday = dateKey === serverTodayKey;

      let cellStatus = "neutral";
      if (isHoliday) cellStatus = "holiday";
      else if (isFuture) cellStatus = "future";
      else if (record) {
        if (record.status === "present" || record.status === "late") cellStatus = "present";
        else if (record.status === "absent") cellStatus = "absent";
        else if (record.status === "excused") cellStatus = "excused";
      } else if (isToday) {
        cellStatus = data?.metrics?.isTodayRecorded ? "present" : "pending";
      } else {
        cellStatus = "pending";
      }

      days.push({ dayNumber: d, dateKey, isCurrentMonth: true, record, isHoliday, holidayTitle, isToday, cellStatus });
    }
    return days;
  }, [calendarDate, attendanceDateMap, config?.holidays, serverTodayKey, data?.metrics?.isTodayRecorded]);

  const cellTitle = (c) => {
    switch (c.cellStatus) {
      case "present": return `${c.dateKey}: Present`;
      case "absent": return `${c.dateKey}: Absent`;
      case "excused": return `${c.dateKey}: Excused`;
      case "pending": return `${c.dateKey}: Roll call not submitted yet`;
      case "holiday": return `${c.dateKey}: ${c.holidayTitle || "Holiday"}`;
      default: return `${c.dateKey}: Upcoming date`;
    }
  };

  // Gauge
  const isHealthy = metrics.percentage >= (metrics.minPercentage || 60);
  const benchmark = metrics.minPercentage || 60;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (Math.min(metrics.percentage, 100) / 100) * circumference;
  const tickAngle = (benchmark / 100) * 2 * Math.PI;
  const tick = {
    x1: 100 + (radius - 12) * Math.cos(tickAngle),
    y1: 100 + (radius - 12) * Math.sin(tickAngle),
    x2: 100 + (radius + 12) * Math.cos(tickAngle),
    y2: 100 + (radius + 12) * Math.sin(tickAngle)
  };

  useEffect(() => {
    if (!data) return undefined;
    setGaugeReady(false);
    const id = requestAnimationFrame(() => setGaugeReady(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  const todayStatus = todayData?.dailyCollege?.status;
  const todayTone = todayStatus === "present" ? "present" : todayStatus === "absent" ? "absent" : "pending";

  // Simulator
  const sim = useMemo(() => {
    const eligible = metrics.totalEligibleDays + simAttendDays + simMissDays;
    const present = metrics.presentDays + simAttendDays;
    const pct = eligible > 0 ? (present / eligible) * 100 : 0;
    return { eligible, present, pct, meets: pct >= benchmark };
  }, [metrics, simAttendDays, simMissDays, benchmark]);

  if (loading && !data) {
    return (
      <div className="attendance-page">
        <div className="attendance-panel attendance-loading">
          <RefreshCw className="attendance-spin" size={34} />
          <h3>Calculating your attendance…</h3>
          <p>Counting working days since commencement on {formattedCommenceDate}</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="attendance-page">
        <div className="attendance-panel attendance-loading is-error">
          <AlertTriangle size={34} />
          <h3>We couldn’t load your attendance</h3>
          <p>{error}</p>
          <button type="button" className="attendance-btn is-primary" onClick={fetchOverallData}>
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      {/* Header */}
      <header className="attendance-header">
        <div className="attendance-header-copy">
          <div className="attendance-title-row">
            <h1>My attendance</h1>
            <span className={`attendance-status-pill tone-${isHealthy ? "safe" : "low"}`}>
              <i />
              {metrics.status}
            </span>
          </div>
          <p className="attendance-header-desc">
            Your presence on campus since classes began, counted on Mon–Sat working days. Sundays and declared holidays are excluded.
          </p>
          <div className="attendance-meta">
            <span className="attendance-chip is-accent">
              <Calendar size={13} />
              Classes began {formattedCommenceDate}
            </span>
            <span className="attendance-chip">1 working day = 1 attendance day</span>
          </div>
        </div>

        <div className="attendance-header-actions">
          <button type="button" className="attendance-btn is-ghost" onClick={() => setSimulatorOpen(true)}>
            <Sliders size={15} />
            What-if simulator
          </button>
          <button type="button" className="attendance-btn is-ghost" onClick={() => window.print()}>
            <Printer size={15} />
            Print
          </button>
          <button type="button" className="attendance-btn is-ghost" onClick={fetchOverallData} disabled={loading}>
            <RefreshCw size={15} className={loading ? "attendance-spin" : ""} />
            Refresh
          </button>
          {onNavigate && (
            <button type="button" className="attendance-btn is-primary" onClick={() => onNavigate("subject-attendance")}>
              <BookOpen size={15} />
              Subject attendance
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="attendance-banner is-absent" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Showing your last loaded data</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Today */}
      <div className={`attendance-banner is-${todayTone}`}>
        <span className="attendance-banner-icon">
          {todayStatus === "present" ? <CheckCircle2 size={22} /> : todayStatus === "absent" ? <XCircle size={22} /> : <Clock size={22} />}
        </span>
        <div>
          <strong>
            {todayStatus === "present"
              ? "You’re marked present today"
              : todayStatus === "absent"
              ? "You’re marked absent today"
              : "Today’s roll call is still open"}
          </strong>
          <span>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}
            {todayData?.dailyCollege?.remarks || "Verified by biometric gate and faculty register"}
          </span>
        </div>
      </div>

      {/* Gauge + KPIs */}
      <section className="attendance-overview">
        <div className="attendance-panel attendance-gauge-panel">
          <div className="attendance-panel-head">
            <div className="attendance-panel-titlewrap">
              <div className="attendance-panel-icon"><Sparkles size={18} /></div>
              <div className="attendance-panel-copy">
                <h2>Overall attendance</h2>
                <p>Minimum required: {benchmark}%</p>
              </div>
            </div>
          </div>

          <div className="att-radial-container">
            <svg className="att-radial-svg" viewBox="0 0 200 200" role="img" aria-label={`Attendance ${Number(metrics.percentage || 0).toFixed(2)} percent`}>
              <circle cx="100" cy="100" r={radius} className="att-radial-bg-circle" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                className={`att-radial-fill-circle ${isHealthy ? "good" : "alert"}`}
                strokeDasharray={circumference}
                strokeDashoffset={gaugeReady ? targetOffset : circumference}
              />
              <line {...tick} className="att-radial-benchmark" />
            </svg>
            <div className="att-radial-content">
              <span className="att-radial-pct-number">{Number(metrics.percentage || 0).toFixed(1)}<small>%</small></span>
              <span className="att-radial-ratio-text">
                {metrics.presentDays} of {metrics.totalEligibleDays} days
              </span>
            </div>
          </div>

          <div className="attendance-gauge-foot">
            <p className={`attendance-gauge-verdict ${isHealthy ? "good" : "bad"}`}>
              {metrics.daysNeededFor60 > 0
                ? `Attend the next ${metrics.daysNeededFor60} working days in a row to reach ${benchmark}%`
                : `You meet the ${benchmark}% requirement for terminal exams`}
            </p>
            <p className="attendance-gauge-note">The tick on the ring marks the {benchmark}% line.</p>
          </div>
        </div>

        <div className="attendance-kpi-grid">
          <div className="attendance-kpi" style={{ "--att-i": 0 }}>
            <div className="attendance-kpi-icon tone-indigo"><CalendarDays size={20} /></div>
            <div className="attendance-kpi-body">
              <span className="attendance-kpi-label">Working days so far</span>
              <strong>{metrics.totalEligibleDays}</strong>
              <em>Since {formattedCommenceDate}, Mon–Sat</em>
            </div>
          </div>

          <div className="attendance-kpi" style={{ "--att-i": 1 }}>
            <div className="attendance-kpi-icon tone-green"><CheckCircle2 size={20} /></div>
            <div className="attendance-kpi-body">
              <span className="attendance-kpi-label">Days attended</span>
              <strong className="is-good">{metrics.presentDays}</strong>
              <em>Each day attended counts once</em>
            </div>
          </div>

          <div className="attendance-kpi" style={{ "--att-i": 2 }}>
            <div className="attendance-kpi-icon tone-rose"><XCircle size={20} /></div>
            <div className="attendance-kpi-body">
              <span className="attendance-kpi-label">Days absent</span>
              <strong className="is-bad">{metrics.absentDays}</strong>
              <em>{metrics.excusedDays > 0 ? `Plus ${metrics.excusedDays} excused` : "Unexcused absences"}</em>
            </div>
          </div>

          <div className="attendance-kpi" style={{ "--att-i": 3 }}>
            <div className="attendance-kpi-icon tone-amber"><TrendingUp size={20} /></div>
            <div className="attendance-kpi-body">
              <span className="attendance-kpi-label">Days to reach {benchmark}%</span>
              <strong className={metrics.daysNeededFor60 === 0 ? "is-good" : "is-warn"}>
                {metrics.daysNeededFor60}
              </strong>
              <em>{metrics.daysNeededFor60 === 0 ? "You’re above the line" : "Consecutive days needed"}</em>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar + inspector */}
      <section className="att-calendar-inspector-grid">
        <div className="att-calendar-box">
          <div className="att-calendar-header">
            <div>
              <div className="att-calendar-month-name">
                {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </div>
              <span className="att-calendar-caption">Select a date to see its record</span>
            </div>
            <div className="att-calendar-nav-btns">
              <button
                type="button"
                className="attendance-btn is-ghost is-icon"
                onClick={() => setCalendarDate(new Date())}
              >
                Today
              </button>
              <button
                type="button"
                className="attendance-btn is-ghost is-icon"
                aria-label="Previous month"
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="attendance-btn is-ghost is-icon"
                aria-label="Next month"
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="att-calendar-grid">
            {DAY_NAMES.map((d) => (
              <div key={d} className="att-calendar-day-header">{d}</div>
            ))}
            {calendarDays.map((c, idx) => {
              if (!c.isCurrentMonth) return <div key={`blank-${idx}`} className="att-calendar-day-cell disabled" aria-hidden="true" />;
              const isSelected = selectedDateKey === c.dateKey;
              return (
                <button
                  type="button"
                  key={c.dateKey}
                  onClick={() => handleSelectDate(c.dateKey)}
                  className={`att-calendar-day-cell ${c.cellStatus} ${isSelected ? "is-selected" : ""} ${c.isToday ? "is-today" : ""}`}
                  title={cellTitle(c)}
                  aria-label={cellTitle(c)}
                  aria-pressed={isSelected}
                >
                  <span className="att-day-num">{c.dayNumber}</span>
                  {c.isToday && <span className="att-today-indicator" />}
                </button>
              );
            })}
          </div>

          <div className="att-calendar-quick-legend">
            <span className="att-legend-pill tone-present"><span className="att-dot-marker" /> Present ({metrics.presentDays})</span>
            <span className="att-legend-pill tone-absent"><span className="att-dot-marker" /> Absent ({metrics.absentDays})</span>
            <span className="att-legend-pill tone-excused"><span className="att-dot-marker" /> Excused</span>
            <span className="att-legend-pill tone-pending"><span className="att-dot-marker" /> Not marked</span>
            <span className="att-legend-pill tone-holiday"><span className="att-dot-marker" /> Holiday</span>
          </div>
        </div>

        <div className="attendance-panel att-inspector-panel">
          <div className="att-inspector-header">
            <div className="attendance-panel-titlewrap">
              <div className="attendance-panel-icon att-icon-purple"><ShieldCheck size={20} /></div>
              <div className="attendance-panel-copy">
                <h2>Day details</h2>
                <p>Roll call, gate log and subject sessions</p>
              </div>
            </div>

            {selectedDateKey && (
              <div className="att-inspector-nav-group">
                <button type="button" className="att-inspector-nav-btn" onClick={() => shiftSelectedDay(-1)} aria-label="Previous day">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="att-inspector-nav-btn" onClick={() => shiftSelectedDay(1)} aria-label="Next day">
                  <ChevronRight size={16} />
                </button>
                <button type="button" className="att-inspector-close-btn" onClick={() => setSelectedDateKey(null)} aria-label="Close details">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {!selectedDateKey ? (
            <div className="att-inspector-empty-state">
              <div className="att-empty-illustration-box">
                <div className="att-empty-ring-outer">
                  <div className="att-empty-ring-inner">
                    <CalendarCheck2 size={34} />
                  </div>
                </div>
              </div>

              <div className="att-empty-copy">
                <h3>Pick a date on the calendar</h3>
                <p>
                  You’ll see who marked your attendance, your gate check-in and check-out, and every lecture held that day.
                </p>
              </div>

              <div className="att-legend-card">
                <div className="att-legend-title">What the colours mean</div>
                <div className="att-legend-grid">
                  <div className="att-legend-item">
                    <span className="att-legend-dot tone-present" />
                    <div className="att-legend-desc"><strong>Present</strong><span>Attendance submitted and verified</span></div>
                  </div>
                  <div className="att-legend-item">
                    <span className="att-legend-dot tone-absent" />
                    <div className="att-legend-desc"><strong>Absent</strong><span>Unexcused absence on record</span></div>
                  </div>
                  <div className="att-legend-item">
                    <span className="att-legend-dot tone-pending" />
                    <div className="att-legend-desc"><strong>Not marked</strong><span>Waiting for faculty to submit the roll call</span></div>
                  </div>
                  <div className="att-legend-item">
                    <span className="att-legend-dot tone-holiday" />
                    <div className="att-legend-desc"><strong>Holiday</strong><span>Sunday or declared holiday, not counted</span></div>
                  </div>
                </div>
              </div>

              <div className="att-statutory-info-box">
                <div className="att-statutory-row">
                  <span className="att-statutory-lbl">Minimum for exams</span>
                  <span className="att-statutory-val">{benchmark}% attendance</span>
                </div>
                <div className="att-statutory-desc">
                  <ShieldAlert size={14} />
                  <span>Records come from biometric gates and faculty registers. Any correction is logged with a reason.</span>
                </div>
              </div>
            </div>
          ) : dayAuditLoading ? (
            <div className="att-inspector-skeleton-box" aria-busy="true">
              <div className="att-shimmer att-skel-title" />
              <div className="att-shimmer att-skel-badge" />
              <div className="att-shimmer att-skel-box" />
              <div className="att-shimmer att-skel-grid" />
              <div className="att-shimmer att-skel-card" />
            </div>
          ) : dayAuditError ? (
            <div className="att-inspector-error-box" role="alert">
              <AlertTriangle size={30} />
              <h4>We couldn’t load this date</h4>
              <p>{dayAuditError}</p>
              <button type="button" className="attendance-btn is-primary" onClick={() => loadDayAudit(selectedDateKey)}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : dayAuditData ? (
            <div className="att-inspector-content-scroll">
              <div className="att-sec-card att-sec-overview">
                <div className="att-overview-top">
                  <div>
                    <div className="att-overview-weekday">{dayAuditData.weekday}</div>
                    <h3 className="att-overview-date">{dayAuditData.fullDate}</h3>
                  </div>
                  <span
                    className={`attendance-status-pill tone-${
                      dayAuditData.state === "present" ? "safe"
                      : dayAuditData.state === "absent" ? "low"
                      : dayAuditData.state === "pending" ? "warn"
                      : dayAuditData.state === "excused" ? "info"
                      : "neutral"
                    }`}
                  >
                    <i /> {dayAuditData.statusBadge}
                  </span>
                </div>

                <div className="att-overview-chips">
                  <span className={`att-chip-tag ${dayAuditData.isWorkingDay ? "is-working" : "is-nonworking"}`}>
                    <Calendar size={12} />
                    {dayAuditData.isWorkingDay ? "Working day" : "Non-working day"}
                  </span>
                  <span className="att-chip-tag is-submission">
                    <CheckCircle2 size={12} />
                    {dayAuditData.submissionStatus}
                  </span>
                  {dayAuditData.isToday && (
                    <span className="att-chip-tag is-today-badge"><Clock size={12} /> Today</span>
                  )}
                </div>

                <p className="att-overview-explanation">{dayAuditData.explanation}</p>
              </div>

              <div className="att-sec-card">
                <div className="att-sec-title"><ShieldCheck size={16} /><span>Verification</span></div>
                <div className="att-verification-grid">
                  <div className="att-veri-cell">
                    <span className="att-veri-lbl">Gate check-in</span>
                    <strong className="att-veri-val">{dayAuditData.verification?.checkInTime || "Not recorded"}</strong>
                  </div>
                  <div className="att-veri-cell">
                    <span className="att-veri-lbl">Gate check-out</span>
                    <strong className="att-veri-val">{dayAuditData.verification?.checkOutTime || "Not recorded"}</strong>
                  </div>
                  <div className="att-veri-cell">
                    <span className="att-veri-lbl">Marked via</span>
                    <strong className="att-veri-val">{dayAuditData.verification?.markingMethod || "—"}</strong>
                  </div>
                  <div className="att-veri-cell">
                    <span className="att-veri-lbl">Status</span>
                    <strong className="att-veri-val is-brand">{dayAuditData.verification?.verificationStatus || "—"}</strong>
                  </div>
                </div>
              </div>

              <div className="att-sec-card">
                <div className="att-sec-title"><Clock size={16} /><span>History of this record</span></div>
                <div className="att-timeline-list">
                  <div className="att-timeline-item">
                    <div className="att-timeline-marker primary" />
                    <div className="att-timeline-body">
                      <span className="att-timeline-head">
                        {dayAuditData.auditTrail?.markedByName ? (
                          <>Recorded by <strong>{dayAuditData.auditTrail.markedByName}</strong> ({dayAuditData.auditTrail.markedByRole})</>
                        ) : (
                          <>Recorded by the system</>
                        )}
                      </span>
                      <span className="att-timeline-time">
                        {dayAuditData.auditTrail?.submittedAt
                          ? new Date(dayAuditData.auditTrail.submittedAt).toLocaleString("en-IN")
                          : "No submission time yet"}
                      </span>
                    </div>
                  </div>

                  {dayAuditData.auditTrail?.history?.map((hist, hIdx) => (
                    <div key={hIdx} className="att-timeline-item">
                      <div className="att-timeline-marker warn" />
                      <div className="att-timeline-body">
                        <span className="att-timeline-head">
                          Changed from <em>{hist.previousStatus}</em> to <strong>{hist.newStatus}</strong> by {hist.modifiedByName}
                        </span>
                        <span className="att-timeline-reason">Reason: “{hist.reason}”</span>
                        <span className="att-timeline-time">{new Date(hist.modifiedAt).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}

                  {!dayAuditData.auditTrail?.hasCorrections && (
                    <div className="att-timeline-item">
                      <div className="att-timeline-marker success" />
                      <div className="att-timeline-body">
                        <span className="att-timeline-head">No corrections</span>
                        <span className="att-timeline-time">This record has not been changed since it was submitted.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="att-sec-card">
                <div className="att-sec-title">
                  <BookOpen size={16} />
                  <span>Lectures that day ({dayAuditData.totalSubjectSessions || 0})</span>
                </div>
                <p className="att-sec-subtitle">Subject attendance is counted separately from your college attendance.</p>

                {!dayAuditData.subjectActivities?.length ? (
                  <div className="att-no-subjects-card">
                    <BookOpen size={22} />
                    <span>No lectures were held on this date.</span>
                  </div>
                ) : (
                  <div className="att-subject-activity-list">
                    {dayAuditData.subjectActivities.map((act, aIdx) => (
                      <div key={aIdx} className="att-subject-act-card">
                        <div className="att-act-top">
                          <div className="att-act-info">
                            <span className="att-act-code">{act.subjectCode}</span>
                            <h4 className="att-act-name">{act.subject}</h4>
                          </div>
                          <span className={`att-act-status-badge ${act.status === "present" ? "present" : act.status === "absent" ? "absent" : "pending"}`}>
                            {act.status === "present" && <CheckCircle2 size={12} />}
                            {act.status === "absent" && <XCircle size={12} />}
                            {act.status !== "present" && act.status !== "absent" && <Clock size={12} />}
                            {act.status === "present" ? "Present" : act.status === "absent" ? "Absent" : "Pending"}
                          </span>
                        </div>
                        <div className="att-act-meta">
                          <span>Period {act.periodNumber} · {act.startTime} – {act.endTime}</span>
                          <span>{act.facultyName} · {act.roomNo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Ledger */}
      <section className="attendance-panel attendance-history-panel">
        <div className="attendance-panel-head">
          <div className="attendance-panel-titlewrap">
            <div className="attendance-panel-icon"><CalendarCheck2 size={18} /></div>
            <div className="attendance-panel-copy">
              <h2>Day-by-day record</h2>
              <p>Every marked day since {formattedCommenceDate}</p>
            </div>
          </div>
        </div>

        <div className="attendance-filters-bar">
          <label className="attendance-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by date, day or remark"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
          <div className="attendance-filter-pills" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`att-filter-pill-btn ${statusFilter === f.id ? "active" : ""}`}
                aria-pressed={statusFilter === f.id}
                onClick={() => {
                  setStatusFilter(f.id);
                  setCurrentPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="attendance-table-wrap">
          <table className="attendance-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Marked by</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.length === 0 ? (
                <tr className="is-empty">
                  <td colSpan="5">No records match. Try a different search or filter.</td>
                </tr>
              ) : (
                paginatedHistory.map((item) => (
                  <tr key={item.date}>
                    <td data-label="Date" className="cell-date">{fmtUTCDate(item.date)}</td>
                    <td data-label="Day">{item.day}</td>
                    <td data-label="Status">
                      <span className={`attendance-status-pill tone-${STATUS_TONE[item.status] || "neutral"}`}>
                        <i /> {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td data-label="Marked by" className="cell-muted">{item.markedByName || "Faculty office"}</td>
                    <td data-label="Remarks" className="cell-muted">{item.remarks || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="attendance-pagination-bar">
          <span>
            {filteredHistory.length > 0 ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filteredHistory.length)} of {filteredHistory.length} records
          </span>
          <div className="pagination-btns">
            <button type="button" className="attendance-btn is-ghost is-small" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
              Previous
            </button>
            <span className="pagination-count">{safePage} / {totalPages}</span>
            <button type="button" className="attendance-btn is-ghost is-small" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Simulator */}
      {simulatorOpen && (
        <div className="att-modal-overlay" onClick={() => setSimulatorOpen(false)}>
          <div
            className="att-modal-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="att-sim-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="att-modal-header">
              <div>
                <h3 className="att-modal-title" id="att-sim-title">What-if simulator</h3>
                <p className="att-modal-subtitle">See where your attendance lands if you attend or miss more days</p>
              </div>
              <button type="button" className="attendance-btn is-ghost is-icon" aria-label="Close" onClick={() => setSimulatorOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="att-modal-body">
              <div className="sim-current">
                <div><span>Working days</span><strong>{metrics.totalEligibleDays}</strong></div>
                <div><span>Attended</span><strong className="is-good">{metrics.presentDays}</strong></div>
                <div>
                  <span>Now</span>
                  <strong className={isHealthy ? "is-good" : "is-bad"}>{Number(metrics.percentage || 0).toFixed(1)}%</strong>
                </div>
              </div>

              <div className="simulator-slider-group">
                <div className="simulator-slider-label-row">
                  <label htmlFor="sim-attend">Days you attend from now</label>
                  <span className="is-brand">+{simAttendDays}</span>
                </div>
                <input id="sim-attend" type="range" min="0" max="30" value={simAttendDays} onChange={(e) => setSimAttendDays(Number(e.target.value))} className="simulator-range-input" />
              </div>

              <div className="simulator-slider-group">
                <div className="simulator-slider-label-row">
                  <label htmlFor="sim-miss">Days you miss from now</label>
                  <span className="is-bad">+{simMissDays}</span>
                </div>
                <input id="sim-miss" type="range" min="0" max="20" value={simMissDays} onChange={(e) => setSimMissDays(Number(e.target.value))} className="simulator-range-input is-miss" />
              </div>

              <div className={`simulator-preview-card ${sim.meets ? "is-ok" : "is-short"}`}>
                <div>
                  <span className="sim-preview-label">Projected attendance</span>
                  <span className="sim-preview-sub">{sim.present} of {sim.eligible} working days</span>
                </div>
                <div className="sim-preview-right">
                  <div className="simulator-preview-pct">{sim.pct.toFixed(1)}%</div>
                  <span className="sim-preview-badge">{sim.meets ? `Meets ${benchmark}%` : `Below ${benchmark}%`}</span>
                </div>
              </div>
            </div>

            <div className="att-modal-footer">
              <button type="button" className="attendance-btn is-ghost" onClick={() => { setSimAttendDays(5); setSimMissDays(0); }}>
                Reset
              </button>
              <button type="button" className="attendance-btn is-primary" onClick={() => setSimulatorOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}