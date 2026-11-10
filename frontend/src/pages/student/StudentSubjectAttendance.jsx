import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  RefreshCw,
  X,
  Building2,
  User,
  Calendar,
  FileText,
  PieChart,
  Filter,
  ShieldCheck,
  Percent,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  Target,
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentSubjectAttendance.css";

/* ==========================================================================
   CONSTANTS & SMALL HELPERS
   ========================================================================== */

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Current academic term (same values the original screen used for "Today")
const TERM_YEAR = 2026;
const TERM_MONTH = 11;
const BENCHMARK = 60;

const pctOf = (subject) =>
  Number(subject?.conductedPercentage || subject?.percentage || 0);

const isPresentStatus = (status) => status === "present" || status === "late";

// Lectures that must be attended back-to-back to reach the benchmark
const lecturesNeededFor = (attended, conducted) => {
  if (conducted <= 0) return 0;
  const need = Math.ceil((BENCHMARK / 100 * conducted - attended) / (1 - BENCHMARK / 100));
  return Math.max(0, need);
};

// Lectures that can still be missed while staying at or above the benchmark
const lecturesCanMiss = (attended, conducted) => {
  if (conducted <= 0) return 0;
  return Math.max(0, Math.floor(attended / (BENCHMARK / 100) - conducted + 1e-9));
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function generateFallbackCalendarDays(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayOfWeek = d.getUTCDay();
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({
      date: dateKey,
      day,
      dayNumber: day,
      dayOfWeek,
      isSunday: dayOfWeek === 0,
      isHoliday: dayOfWeek === 0,
      holidayTitle: dayOfWeek === 0 ? "Sunday" : null,
      hasLecture: false,
      state: dayOfWeek === 0 ? "holiday" : "none",
      indicator: dayOfWeek === 0 ? "H" : null,
      sessions: []
    });
  }
  return days;
}

/* ==========================================================================
   HOOKS
   ========================================================================== */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return reduced;
}

/* ==========================================================================
   SHARED UI PIECES
   ========================================================================== */

// Counts up to the value once, skipped entirely for reduced-motion users
function AnimatedNumber({ value, decimals = 0, suffix = "", duration = 900 }) {
  const reduced = usePrefersReducedMotion();
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, duration]);

  return (
    <>
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}

function StatusPill({ status }) {
  const isPres = isPresentStatus(status);
  const isAbs = status === "absent";
  return (
    <span
      className={`status-cell-pill ${isPres ? "pill-pres" : isAbs ? "pill-abs" : "pill-pend"}`}
    >
      {isPres ? <CheckCircle2 size={12} /> : isAbs ? <XCircle size={12} /> : <Clock size={12} />}
      <span>{(status || "pending").toUpperCase()}</span>
    </span>
  );
}

// Horizontal meter with Semester Progress and Benchmark modes
function AttendanceMeter({ pct, hasData, isPlanned = false, attended = 0, total = 0 }) {
  const value = Math.max(0, Math.min(100, pct));
  const good = isPlanned ? value >= 50 : value >= BENCHMARK;
  return (
    <div
      className={`attendance-meter ${isPlanned ? "is-planned-meter" : ""}`}
      role="img"
      aria-label={
        hasData
          ? isPlanned
            ? `${value.toFixed(1)} percent semester curriculum progress (${attended} of ${total} lectures attended)`
            : `${value.toFixed(1)} percent attendance against a ${BENCHMARK} percent minimum`
          : "No curriculum lectures recorded yet"
      }
    >
      <div className="meter-track">
        <span
          className={`meter-fill ${isPlanned ? "is-planned-fill" : good ? "is-good" : "is-bad"}`}
          style={{ "--meter": hasData ? `${value}%` : "0%" }}
        />
        {!isPlanned && <span className="meter-benchmark" />}
      </div>
      <div className="meter-scale" aria-hidden="true">
        <span>0%</span>
        <span className="meter-scale-mark">
          {isPlanned
            ? `Progress: ${attended} / ${total} planned lectures (${value.toFixed(1)}%)`
            : `${BENCHMARK}% minimum benchmark`}
        </span>
        <span>100% {isPlanned ? "Semester" : "Attendance"}</span>
      </div>
    </div>
  );
}

// Common modal frame: Escape to close, scroll lock, focus handling, dialog semantics
function ModalShell({ eyebrow, title, subtitle, onClose, variant = "", children }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      className={`subj-modal-backdrop ${variant ? `is-${variant}` : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`subj-modal-container ${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subj-modal-title"
      >
        <div className="subj-modal-header">
          <div className="subj-modal-title-group">
            <span className="subj-modal-eyebrow">{eyebrow}</span>
            <h3 className="subj-modal-title" id="subj-modal-title">{title}</h3>
            <span className="subj-modal-code">{subtitle}</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="subj-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="subj-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   1. MODAL: ATTENDANCE TREND GRAPH
   ========================================================================== */

function AttendanceGraphModal({ subject, onClose }) {
  const attended = subject.attendedCount || 0;
  const conducted = subject.conductedCount || 0;
  const conductedPct = pctOf(subject);
  const plannedTotal = subject.plannedCount || 33;
  const isMeets = conductedPct >= BENCHMARK;
  const needed = subject.lecturesNeededFor60 || 0;

  const points = [
    { label: "Oct", pct: 0 },
    { label: "Nov (Current)", pct: conductedPct },
    { label: "Dec (Proj)", pct: Math.min(100, conductedPct + 4) },
    { label: "Jan (Proj)", pct: Math.min(100, conductedPct + 8) },
  ];

  const xs = [80, 210, 340, 470];
  const yOf = (pct) => 160 - (pct / 100) * 130;
  const ys = points.map((p) => yOf(p.pct));
  const actualPath = `M ${xs[0]} ${ys[0]} L ${xs[1]} ${ys[1]}`;
  const projectedPath = `M ${xs[1]} ${ys[1]} L ${xs[2]} ${ys[2]} L ${xs[3]} ${ys[3]}`;
  const areaPath = `M ${xs[0]} ${ys[0]} L ${xs[1]} ${ys[1]} L ${xs[2]} ${ys[2]} L ${xs[3]} ${ys[3]} L ${xs[3]} 160 L ${xs[0]} 160 Z`;
  const benchmarkY = yOf(BENCHMARK);

  return (
    <ModalShell
      eyebrow="Subject Attendance Trajectory"
      title={subject.subjectName}
      subtitle={`${subject.subjectCode || "CORE"} • ${subject.facultyName || "Dept. Faculty"}`}
      onClose={onClose}
    >
      <div className="subj-graph-kpi-grid">
        <div className="subj-graph-kpi-card">
          <span className="kpi-label">Conducted-to-Date</span>
          <strong className={`kpi-val ${isMeets ? "good" : "alert"}`}>
            {conductedPct.toFixed(1)}%
          </strong>
          <span className="kpi-sub">{attended} / {conducted} lectures attended</span>
        </div>
        <div className="subj-graph-kpi-card">
          <span className="kpi-label">Benchmark Goal</span>
          <strong className="kpi-val highlight">{BENCHMARK}.0%</strong>
          <span className="kpi-sub">University minimum compliance</span>
        </div>
        <div className="subj-graph-kpi-card">
          <span className="kpi-label">Status</span>
          <strong className={`kpi-val ${isMeets ? "good" : "alert"}`}>
            {isMeets ? "Eligible" : "Shortage"}
          </strong>
          <span className="kpi-sub">{isMeets ? "On Track" : `${needed} lectures needed`}</span>
        </div>
      </div>

      <div className="subj-chart-container">
        <div className="chart-header-row">
          <span className="chart-title">Academic progress & benchmark trajectory</span>
          <div className="chart-legends">
            <span><span className="chart-dot dot-blue" /> Actual / projected %</span>
            <span><span className="chart-dot dot-red" /> {BENCHMARK}% benchmark</span>
          </div>
        </div>

        <div className="chart-svg-wrap">
          <svg
            viewBox="0 0 540 190"
            className="attendance-svg-chart"
            role="img"
            aria-label={`Attendance trajectory for ${subject.subjectName}`}
          >
            <defs>
              <linearGradient id="subjTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="trend-stop-a" />
                <stop offset="100%" className="trend-stop-b" />
              </linearGradient>
            </defs>

            {[0, 20, 40, 60, 80, 100].map((tick) => (
              <g key={tick}>
                <line className="chart-grid-line" x1="56" x2="510" y1={yOf(tick)} y2={yOf(tick)} />
                <text className="chart-axis-text" x="48" y={yOf(tick) + 4} textAnchor="end">
                  {tick}%
                </text>
              </g>
            ))}

            <line className="chart-benchmark-line" x1="56" x2="510" y1={benchmarkY} y2={benchmarkY} />
            <text className="chart-benchmark-text" x="510" y={benchmarkY - 6} textAnchor="end">
              {BENCHMARK}% minimum
            </text>

            <path className="trend-area" d={areaPath} fill="url(#subjTrendFill)" />
            <path className="trend-line-proj" d={projectedPath} fill="none" />
            <path className="trend-line" d={actualPath} fill="none" pathLength="1" />

            {points.map((p, i) => (
              <g key={p.label} className="trend-point" style={{ "--d": `${300 + i * 140}ms` }}>
                <circle
                  className={`trend-dot ${i === 1 ? "is-current" : i > 1 ? "is-proj" : ""}`}
                  cx={xs[i]}
                  cy={ys[i]}
                  r="5.5"
                />
                <text className="chart-value-text" x={xs[i]} y={ys[i] - 12} textAnchor="middle">
                  {p.pct.toFixed(0)}%
                </text>
                <text className="chart-axis-text" x={xs[i]} y="182" textAnchor="middle">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="modal-footnote">
          December and January values are an illustrative projection, not official data.
        </p>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   2. MODAL: SUBJECT ANALYTICS & STATISTICS
   ========================================================================== */

function AttendanceAnalyticsModal({ subject, onClose }) {
  const attended = subject.attendedCount || 0;
  const absent = subject.absentCount || 0;
  const conducted = subject.conductedCount || 0;
  const conductedPct = pctOf(subject);
  const isMeets = conductedPct >= BENCHMARK;
  const neededFor60 = subject.lecturesNeededFor60 || 0;
  const plannedCount = subject.plannedCount || 0;

  // Ring drawn with pathLength=100, so the offset maps straight to a percentage
  const ringPct = conducted > 0 ? Math.min(100, (attended / conducted) * 100) : 0;

  return (
    <ModalShell
      eyebrow="Subject Analytics & Statistics"
      title={subject.subjectName}
      subtitle={`${subject.subjectCode || "CORE"} • ${subject.facultyName || "Dept. Faculty"}`}
      onClose={onClose}
    >
      <div className="donut-stats-row">
        <div className="donut-chart-box">
          <svg viewBox="0 0 100 100" className="donut-svg" aria-hidden="true">
            <g transform="rotate(-90 50 50)">
              <circle className="donut-track" cx="50" cy="50" r="36" fill="none" strokeWidth="12" />
              <circle
                className={`donut-arc ${isMeets ? "is-good" : "is-bad"}`}
                cx="50"
                cy="50"
                r="36"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100 100"
                style={{ "--off": 100 - ringPct }}
              />
            </g>
            <line
              className="donut-notch"
              x1="50"
              y1="5"
              x2="50"
              y2="21"
              transform={`rotate(${BENCHMARK * 3.6} 50 50)`}
            />
          </svg>
          <div className="donut-center-text">
            <span className="donut-val">{conductedPct.toFixed(1)}%</span>
            <span className="donut-lbl">Conducted rate</span>
          </div>
        </div>

        <div className="analytics-breakdown-list">
          <div className="breakdown-item">
            <span className="breakdown-label">
              <CheckCircle2 size={14} className="ic-good" />
              Officially attended (P)
            </span>
            <strong className="breakdown-value font-emerald">{attended} Lectures</strong>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">
              <XCircle size={14} className="ic-bad" />
              Recorded absences (A)
            </span>
            <strong className="breakdown-value font-crimson">{absent} Lectures</strong>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">
              <Clock size={14} className="ic-brand" />
              Total conducted sessions
            </span>
            <strong className="breakdown-value">{conducted} Lectures</strong>
          </div>

          {plannedCount > 0 && (
            <div className="breakdown-item">
              <span className="breakdown-label">
                <Target size={14} className="ic-warn" />
                Planned this semester
              </span>
              <strong className="breakdown-value">{plannedCount} Lectures</strong>
            </div>
          )}

          <div className="breakdown-item">
            <span className="breakdown-label">
              <ShieldCheck size={14} className="ic-purple" />
              University {BENCHMARK}% benchmark
            </span>
            <strong className="breakdown-value">
              {isMeets ? "✓ Compliant" : `Deficit: ${(BENCHMARK - conductedPct).toFixed(1)}%`}
            </strong>
          </div>

          {neededFor60 > 0 && (
            <div className="breakdown-item is-alert">
              <span className="breakdown-label">
                <AlertTriangle size={14} />
                Lectures needed for {BENCHMARK}%
              </span>
              <strong className="breakdown-value font-crimson">{neededFor60} Consecutive</strong>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   3. MODAL: ATTENDANCE FORECAST & WHAT-IF CALCULATOR
   ========================================================================== */

function AttendanceForecastModal({ subject, onClose }) {
  const attended = subject.attendedCount || 0;
  const conducted = subject.conductedCount || 0;
  const neededFor60 = subject.lecturesNeededFor60 || lecturesNeededFor(attended, conducted);
  const canMiss = lecturesCanMiss(attended, conducted);

  const [simAttend, setSimAttend] = useState(neededFor60 > 0 ? Math.min(15, neededFor60) : 3);
  const [simMiss, setSimMiss] = useState(0);

  const projAttended = attended + simAttend;
  const projConducted = conducted + simAttend + simMiss;
  const projPct = projConducted > 0 ? (projAttended / projConducted) * 100 : 0;
  const isProjMeets = projPct >= BENCHMARK;

  const presets = [
    { label: "Attend next 5", attend: 5, miss: 0 },
    { label: "Miss next 2", attend: 0, miss: 2 },
    { label: "Attend 8, miss 2", attend: 8, miss: 2 },
  ];

  return (
    <ModalShell
      eyebrow="Attendance Forecast & What-If Calculator"
      title={subject.subjectName}
      subtitle={`Curriculum simulation engine • ${BENCHMARK}% minimum rule`}
      onClose={onClose}
    >
      <div className="forecast-simulator-card">
        <div className="forecast-quick-facts">
          <div className="quick-fact">
            <span className="quick-fact-label">Can still miss</span>
            <strong className="quick-fact-value good">{canMiss}</strong>
            <span className="quick-fact-sub">lectures and stay eligible</span>
          </div>
          <div className="quick-fact">
            <span className="quick-fact-label">Need to attend</span>
            <strong className={`quick-fact-value ${neededFor60 > 0 ? "alert" : "good"}`}>
              {neededFor60}
            </strong>
            <span className="quick-fact-sub">in a row to reach {BENCHMARK}%</span>
          </div>
        </div>

        <div className="preset-row" role="group" aria-label="Scenario presets">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="preset-chip"
              onClick={() => {
                setSimAttend(p.attend);
                setSimMiss(p.miss);
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className="preset-chip is-ghost"
            onClick={() => {
              setSimAttend(0);
              setSimMiss(0);
            }}
          >
            Reset
          </button>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="sim-attend">Attend upcoming lectures</label>
            <strong>+{simAttend} Lectures</strong>
          </div>
          <input
            id="sim-attend"
            type="range"
            min="0"
            max="15"
            value={simAttend}
            onChange={(e) => setSimAttend(Number(e.target.value))}
            className="range-slider"
            style={{ "--fill": `${(simAttend / 15) * 100}%` }}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="sim-miss">Miss upcoming lectures</label>
            <strong className="is-negative">+{simMiss} Absences</strong>
          </div>
          <input
            id="sim-miss"
            type="range"
            min="0"
            max="10"
            value={simMiss}
            onChange={(e) => setSimMiss(Number(e.target.value))}
            className="range-slider is-negative"
            style={{ "--fill": `${(simMiss / 10) * 100}%` }}
          />
        </div>

        <div
          key={isProjMeets ? "good" : "alert"}
          className={`projected-outcome-box ${isProjMeets ? "outcome-good" : "outcome-alert"}`}
          aria-live="polite"
        >
          {isProjMeets ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          <div className="outcome-info">
            <strong>Projected attendance: {projPct.toFixed(1)}%</strong>
            <p>
              With {projAttended} attended out of {projConducted} total conducted lectures.
              {isProjMeets
                ? " You will maintain institutional exam eligibility!"
                : ` Attendance remains below the ${BENCHMARK}% requirement.`}
            </p>
          </div>
        </div>

        <p className="modal-footnote">
          * This is an automated mathematical projection for planning purposes. Official
          eligibility is calculated solely on held curriculum sessions.
        </p>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   4. MODAL: COMPLETE LECTURE HISTORY & CSV EXPORT
   ========================================================================== */

function AttendanceHistoryModal({ subject, onClose }) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await authApi.get("/attendance/subject-history", {
          params: { subject: subject.subjectName },
        });
        if (!ignore && res?.data?.success) {
          setHistoryLogs(res.data.history || []);
        }
      } catch (err) {
        console.error("[AttendanceHistoryModal] Error loading history:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [subject.subjectName]);

  const tally = useMemo(() => {
    let present = 0;
    let absent = 0;
    let pending = 0;
    historyLogs.forEach((log) => {
      if (isPresentStatus(log.status)) present++;
      else if (log.status === "absent") absent++;
      else pending++;
    });
    return { present, absent, pending };
  }, [historyLogs]);

  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      if (statusFilter === "present" && !isPresentStatus(log.status)) return false;
      if (statusFilter === "absent" && log.status !== "absent") return false;
      if (statusFilter === "pending" && (isPresentStatus(log.status) || log.status === "absent")) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dateMatch = log.date && log.date.toLowerCase().includes(q);
        const facultyMatch = log.faculty && log.faculty.toLowerCase().includes(q);
        const topicMatch = log.topic && log.topic.toLowerCase().includes(q);
        if (!dateMatch && !facultyMatch && !topicMatch) return false;
      }
      return true;
    });
  }, [historyLogs, statusFilter, searchQuery]);

  const handleDownloadCSV = () => {
    if (historyLogs.length === 0) return;
    const header = "Date,Period,Start Time,Subject,Faculty,Room,Status,Method\n";
    const rows = historyLogs
      .map((r) =>
        [
          r.date,
          `Period ${r.periodNumber || 1}`,
          r.startTime || "",
          subject.subjectName,
          r.faculty || subject.facultyName,
          r.room || "Room 302",
          r.status?.toUpperCase(),
          r.markingMethod || "Digital Attendance",
        ]
          .map(csvCell)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${subject.subjectName.replace(/\s+/g, "_")}_Attendance_History.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ModalShell
      variant="history-modal"
      eyebrow="Complete Attendance Log"
      title={subject.subjectName}
      subtitle={`${subject.subjectCode || "CORE"} • ${historyLogs.length} Official Sessions Recorded`}
      onClose={onClose}
    >
      {!loading && historyLogs.length > 0 && (
        <div className="history-tally" aria-label="Session totals">
          <span className="tally-chip tally-pres"><CheckCircle2 size={13} /> {tally.present} Present</span>
          <span className="tally-chip tally-abs"><XCircle size={13} /> {tally.absent} Absent</span>
          {tally.pending > 0 && (
            <span className="tally-chip tally-pend"><Clock size={13} /> {tally.pending} Pending</span>
          )}
        </div>
      )}

      <div className="history-filter-strip">
        <div className="history-filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="branch-picker"
            aria-label="Filter by status"
          >
            <option value="all">All Sessions ({historyLogs.length})</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
            <option value="pending">Pending Only</option>
          </select>

          <div className="history-search">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by date, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter sessions"
            />
          </div>
        </div>

        <button
          type="button"
          className="btn-csv-download"
          onClick={handleDownloadCSV}
          disabled={historyLogs.length === 0}
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="history-table-wrapper">
        {loading ? (
          <div className="history-state">
            <RefreshCw className="spin-icon history-state-icon is-brand" size={24} />
            <p>Loading session history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="history-state">
            <Clock size={28} className="history-state-icon" />
            <p>No attendance records match your filter.</p>
          </div>
        ) : (
          <table className="history-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th>Faculty</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Marking Method</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={`${log.date}-${log.periodNumber || idx}-${idx}`} style={{ "--i": Math.min(idx, 12) }}>
                  <td data-label="Date"><strong>{log.date}</strong></td>
                  <td data-label="Period">Period {log.periodNumber || 1}</td>
                  <td data-label="Faculty">{log.faculty || subject.facultyName}</td>
                  <td data-label="Topic">{log.topic || "Core Curriculum Lecture"}</td>
                  <td data-label="Status"><StatusPill status={log.status} /></td>
                  <td data-label="Method">{log.markingMethod || "Digital Attendance Studio"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   5. DRAWER: CLICKED DATE INSPECTOR
   ========================================================================== */

function AttendanceDateInspectorDrawer({ dateInfo, subject, onClose }) {
  const isHol = dateInfo.state === "holiday";

  const formattedDate = new Date(dateInfo.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <ModalShell
      variant="drawer-modal"
      eyebrow="Date Attendance Audit"
      title={formattedDate}
      subtitle={`${subject.subjectName} (${subject.subjectCode || "CORE"})`}
      onClose={onClose}
    >
      {dateInfo.hasLecture ? (
        <div className="inspector-list">
          {dateInfo.sessions?.map((s, idx) => {
            const tone = isPresentStatus(s.status) ? "is-present" : s.status === "absent" ? "is-absent" : "is-pending";
            return (
              <div
                key={s.sessionId || idx}
                className={`inspector-lecture-card ${tone}`}
                style={{ "--i": idx }}
              >
                <div className="lec-time-row">
                  <span className="lec-period-badge">Period {s.periodNumber || idx + 1}</span>
                  <span className="lec-time-slot">
                    <Clock size={13} />
                    {s.startTime || "08:00 AM"} – {s.endTime || "09:00 AM"}
                  </span>
                  <StatusPill status={s.status} />
                </div>

                <h4 className="lec-subj-name">{subject.subjectName}</h4>
                <div className="lec-meta-tags">
                  <span className="meta-tag"><User size={12} /> {s.facultyName || subject.facultyName}</span>
                  <span className="meta-tag"><Building2 size={12} /> {s.roomNo || subject.roomNo || "Room 302"}</span>
                  <span className="meta-tag">Method: {s.markingMethod || "Digital Attendance Studio"}</span>
                </div>

                {s.topic && (
                  <p className="lec-topic">
                    Topic: <strong>{s.topic}</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : isHol ? (
        <div className="inspector-no-lectures is-holiday">
          <Calendar size={36} />
          <h4>Institutional Holiday</h4>
          <p>{dateInfo.holidayTitle || "Campus Closed — College Scheduled Holiday"}</p>
        </div>
      ) : (
        <div className="inspector-no-lectures">
          <Clock size={36} />
          <h4>No Curriculum Sessions</h4>
          <p>No lectures were scheduled or conducted for this subject on {formattedDate}.</p>
        </div>
      )}
    </ModalShell>
  );
}

/* ==========================================================================
   6. MAIN COMPONENT: STUDENT SUBJECT ATTENDANCE (CALENDAR-FIRST)
   ========================================================================== */

export default function StudentSubjectAttendance({ currentUser, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Core data
  const [subjectsData, setSubjectsData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  // Global & per-subject calendars
  const [globalYear, setGlobalYear] = useState(TERM_YEAR);
  const [globalMonth, setGlobalMonth] = useState(TERM_MONTH);
  const [calendarsMap, setCalendarsMap] = useState({});
  const [subjectNavMap, setSubjectNavMap] = useState({});
  const [loadingCalendars, setLoadingCalendars] = useState({});
  const [globalCalLoading, setGlobalCalLoading] = useState(false);
  const calRequestId = useRef(0);

  // Search, filter & sort
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | below60 | above60 | distinction
  const [sortKey, setSortKey] = useState("default"); // default | low | high | name

  // Modals
  const [activeGraphSubj, setActiveGraphSubj] = useState(null);
  const [activeAnalyticsSubj, setActiveAnalyticsSubj] = useState(null);
  const [activeForecastSubj, setActiveForecastSubj] = useState(null);
  const [activeHistorySubj, setActiveHistorySubj] = useState(null);
  const [activeDateModal, setActiveDateModal] = useState(null); // { dateInfo, subject }

  // 1. Fetch primary subjects list & summary
  const fetchSubjects = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await authApi.get("/attendance/student-subjects");
      if (res?.data?.success) {
        setSubjectsData(res.data.subjects || []);
        setSummaryData(res.data.summary || null);
      } else {
        setError(res?.data?.message || "Failed to load subjects.");
      }
    } catch (err) {
      console.error("[StudentSubjectAttendance] Error fetching subjects:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load subject attendance.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // 2. Fetch calendars for all subjects for the active month (latest request wins)
  const fetchAllCalendars = useCallback(async (year, month, subjects) => {
    if (!subjects || subjects.length === 0) return;
    const requestId = ++calRequestId.current;
    setGlobalCalLoading(true);
    try {
      const promises = subjects.map(async (s) => {
        try {
          const q = `subject=${encodeURIComponent(s.subjectName)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;
          const res = await authApi.get(`/attendance/subject-calendar?${q}`);
          if (res?.data?.success) {
            return { subjectName: s.subjectName, data: res.data };
          }
          return { subjectName: s.subjectName, data: null };
        } catch {
          return { subjectName: s.subjectName, data: null };
        }
      });

      const results = await Promise.all(promises);
      if (requestId !== calRequestId.current) return;

      const newMap = {};
      results.forEach((r) => {
        if (r && r.data) newMap[r.subjectName] = r.data;
      });
      setCalendarsMap(newMap);
    } catch (err) {
      console.error("[StudentSubjectAttendance] Error loading calendars:", err);
    } finally {
      if (requestId === calRequestId.current) setGlobalCalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (subjectsData.length > 0) {
      fetchAllCalendars(globalYear, globalMonth, subjectsData);
    }
  }, [globalYear, globalMonth, subjectsData, fetchAllCalendars]);

  // Individual subject month navigation
  const handleSubjectMonthChange = async (subjectName, newYear, newMonth) => {
    setSubjectNavMap((prev) => ({ ...prev, [subjectName]: { year: newYear, month: newMonth } }));
    setLoadingCalendars((prev) => ({ ...prev, [subjectName]: true }));
    try {
      const q = `subject=${encodeURIComponent(subjectName)}&year=${encodeURIComponent(newYear)}&month=${encodeURIComponent(newMonth)}`;
      const res = await authApi.get(`/attendance/subject-calendar?${q}`);
      if (res?.data?.success) {
        setCalendarsMap((prev) => ({ ...prev, [subjectName]: res.data }));
      }
    } catch (err) {
      console.error("[StudentSubjectAttendance] Error switching month for", subjectName, err);
    } finally {
      setLoadingCalendars((prev) => ({ ...prev, [subjectName]: false }));
    }
  };

  // Filtered + sorted subjects
  const filteredSubjects = useMemo(() => {
    const list = subjectsData.filter((subj) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = subj.subjectName?.toLowerCase().includes(q);
        const codeMatch = subj.subjectCode?.toLowerCase().includes(q);
        const facultyMatch = subj.facultyName?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !facultyMatch) return false;
      }

      const pct = pctOf(subj);
      if (filterType === "below60") return pct < BENCHMARK;
      if (filterType === "above60") return pct >= BENCHMARK;
      if (filterType === "distinction") return pct >= 80;
      return true;
    });

    if (sortKey === "low") list.sort((a, b) => pctOf(a) - pctOf(b));
    else if (sortKey === "high") list.sort((a, b) => pctOf(b) - pctOf(a));
    else if (sortKey === "name") {
      list.sort((a, b) => (a.subjectName || "").localeCompare(b.subjectName || ""));
    }
    return list;
  }, [subjectsData, searchQuery, filterType, sortKey]);

  // Summary counts
  const counts = useMemo(() => {
    let below = 0;
    let above = 0;
    let distinction = 0;
    for (const s of subjectsData) {
      const pct = pctOf(s);
      if (pct < BENCHMARK) below++;
      else above++;
      if (pct >= 80) distinction++;
    }
    return { total: subjectsData.length, below, above, distinction };
  }, [subjectsData]);

  // Global month switchers
  const handlePrevGlobalMonth = () => {
    if (globalMonth === 1) {
      setGlobalMonth(12);
      setGlobalYear((y) => y - 1);
    } else {
      setGlobalMonth((m) => m - 1);
    }
  };

  const handleNextGlobalMonth = () => {
    if (globalMonth === 12) {
      setGlobalMonth(1);
      setGlobalYear((y) => y + 1);
    } else {
      setGlobalMonth((m) => m + 1);
    }
  };

  const handleResetGlobalToday = () => {
    setGlobalYear(TERM_YEAR);
    setGlobalMonth(TERM_MONTH);
    setSubjectNavMap({});
  };

  const openDateInspector = (dateInfo, subject) => setActiveDateModal({ dateInfo, subject });

  const isOffTerm = globalMonth !== TERM_MONTH || globalYear !== TERM_YEAR;
  const filtersActive = searchQuery.trim() !== "" || filterType !== "all";

  return (
    <div className="student-subject-attendance-container calendar-first-layout">
      {/* 1. Header Bar */}
      <header className="page-header-unified">
        <div className="header-meta">
          <div className="breadcrumbs">
            <span>CollegeOS ERP</span>
            <span className="sep">/</span>
            <span>Student Dashboard</span>
            <span className="sep">/</span>
            <span className="active">Subject Attendance Intelligence</span>
          </div>
          <h1 className="header-title">
            <Calendar className="header-icon-inline" size={26} />
            Individual Subject Attendance Calendars
          </h1>
          <p className="header-subtitle">
            Academic Session 2026-27 • Semester 5 (CSE) • Autonomous course compliance & interactive
            intelligence.
          </p>
        </div>

        <div className="header-actions">
          <div className="global-month-bar">
            <button
              type="button"
              className="g-month-btn"
              onClick={handlePrevGlobalMonth}
              title="Previous Month"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="g-month-display" aria-live="polite">
              {MONTH_NAMES[globalMonth - 1]} {globalYear}
            </span>
            <button
              type="button"
              className="g-month-btn"
              onClick={handleNextGlobalMonth}
              title="Next Month"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
            {isOffTerm && (
              <button type="button" className="g-today-pill" onClick={handleResetGlobalToday}>
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-refresh-unified"
            onClick={() => fetchSubjects(true)}
            disabled={loading || refreshing}
            title="Refresh All Attendance Data"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* 2. KPI Overview Strip */}
      <section className="overview-strip-grid" aria-label="Attendance Overview">
        <div className="kpi-metric-card">
          <div className="kpi-icon-wrap icon-purple">
            <BookOpen size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-caption">Enrolled Subjects</span>
            <div className="kpi-num-row">
              <span className="kpi-number">
                <AnimatedNumber
                  value={
                    summaryData?.totalEnrolledSubjects ||
                    summaryData?.totalSubjects ||
                    subjectsData.length ||
                    8
                  }
                />
              </span>
              <span className="kpi-badge-neutral">CSE 5th Sem</span>
            </div>
            <span className="kpi-subtext">Active academic term</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-icon-wrap icon-blue">
            <Clock size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-caption">Lectures Conducted</span>
            <div className="kpi-num-row">
              <span className="kpi-number">
                <AnimatedNumber value={summaryData?.totalConductedLectures ?? 16} />
              </span>
              <span className="kpi-badge-blue">Official</span>
            </div>
            <span className="kpi-subtext">Held sessions to date</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-caption">Lectures Attended</span>
            <div className="kpi-num-row">
              <span className="kpi-number font-emerald">
                <AnimatedNumber value={summaryData?.totalAttendedLectures ?? 13} />
              </span>
              <span className="kpi-badge-green">Verified P</span>
            </div>
            <span className="kpi-subtext">{summaryData?.totalAbsentLectures ?? 3} Absences recorded</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-icon-wrap icon-cyan">
            <TrendingUp size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-caption">Conducted-to-Date %</span>
            <div className="kpi-num-row">
              <span className="kpi-number font-emerald">
                <AnimatedNumber
                  value={Number(summaryData?.overallConductedPercentage ?? 81.25)}
                  decimals={2}
                  suffix="%"
                />
              </span>
              <span className="kpi-badge-green">Attended / Conducted</span>
            </div>
            <span className="kpi-subtext">Active session performance</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-icon-wrap icon-amber">
            <Percent size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-caption">Curriculum Progress</span>
            <div className="kpi-num-row">
              <span className="kpi-number">
                <AnimatedNumber
                  value={Number(summaryData?.overallPlannedPercentage ?? 4.92)}
                  decimals={2}
                  suffix="%"
                />
              </span>
              <span className="kpi-badge-amber">Semester Goal</span>
            </div>
            <span className="kpi-subtext">Against 264 curriculum lectures</span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-icon-wrap icon-indigo">
            <ShieldCheck size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-caption">Compliance Status</span>
            <div className="kpi-compliance-badges">
              <span className="pill-metric pill-good">
                <CheckCircle2 size={12} />
                {counts.above} On Track
              </span>
              <span className="pill-metric pill-alert">
                <AlertTriangle size={12} />
                {counts.below} Shortage
              </span>
            </div>
            <span className="kpi-subtext">University {BENCHMARK}% minimum rule</span>
          </div>
        </div>
      </section>

      {/* 3. Filter, Sort & Search Toolbar */}
      <section className="calendar-controls-toolbar" aria-label="Filters">
        <div className="toolbar-row">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search subject by name, code (e.g. PCS-501A), or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search subjects"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <label className="sort-picker">
            <ArrowUpDown size={14} />
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort subjects">
              <option value="default">Default order</option>
              <option value="low">Lowest attendance first</option>
              <option value="high">Highest attendance first</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>

        <div className="filter-pills-row" role="group" aria-label="Attendance filter">
          <button
            type="button"
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Subjects ({counts.total})
          </button>
          <button
            type="button"
            className={`filter-pill filter-alert ${filterType === "below60" ? "active" : ""}`}
            onClick={() => setFilterType("below60")}
          >
            <AlertTriangle size={13} />
            Below {BENCHMARK}% ({counts.below})
          </button>
          <button
            type="button"
            className={`filter-pill filter-good ${filterType === "above60" ? "active" : ""}`}
            onClick={() => setFilterType("above60")}
          >
            <CheckCircle2 size={13} />
            On Track ({counts.above})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === "distinction" ? "active" : ""}`}
            onClick={() => setFilterType("distinction")}
          >
            <Sparkles size={13} />
            Distinction ≥80% ({counts.distinction})
          </button>
        </div>

        <div className="calendar-legend-strip" aria-label="Calendar legend">
          <span className="legend-item"><i className="legend-dot badge-present" />Present</span>
          <span className="legend-item"><i className="legend-dot badge-absent" />Absent</span>
          <span className="legend-item"><i className="legend-dot badge-pending" />Pending</span>
          <span className="legend-item"><i className="legend-dot badge-holiday" />Holiday</span>
          <span className="legend-hint">Tap a date with a lecture to see its audit.</span>
        </div>
      </section>

      {!loading && !error && subjectsData.length > 0 && (
        <p className="results-meta" aria-live="polite">
          Showing <strong>{filteredSubjects.length}</strong> of {subjectsData.length} subjects
          {filtersActive && (
            <button
              type="button"
              className="results-reset"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* 4. Individual Subject Calendars Grid */}
      <section
        className="subject-calendars-grid"
        aria-label="Subject Attendance Calendars"
        aria-busy={loading}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="subject-calendar-card subject-skeleton-card" style={{ "--i": i }}>
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-80 tall" />
              <div className="skeleton-line w-60" />
              <div className="skeleton-grid">
                {Array.from({ length: 35 }).map((__, j) => (
                  <div key={j} className="skeleton-cell" />
                ))}
              </div>
            </div>
          ))
        ) : error ? (
          <div className="error-state-container" role="alert">
            <AlertTriangle size={32} />
            <h3>Unable to Load Attendance</h3>
            <p>{error}</p>
            <button type="button" className="btn-retry" onClick={() => fetchSubjects()}>
              Try Again
            </button>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="empty-state-container">
            <Filter size={32} />
            <h3>No Subjects Match Filter</h3>
            <p>Try resetting the search query or filter selection.</p>
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSubjects.map((subject, index) => {
            const calData = calendarsMap[subject.subjectName];
            const isCardLoading = !!loadingCalendars[subject.subjectName] || globalCalLoading;

            const navState = subjectNavMap[subject.subjectName];
            const activeYear = navState?.year || calData?.year || globalYear;
            const activeMonth = navState?.month || calData?.month || globalMonth;

            const attendedCount = subject.attendedCount || 0;
            const conductedCount = subject.conductedCount || 0;
            const conductedPct = pctOf(subject);
            const plannedCount = subject.plannedCount;
            const plannedConfigured = subject.plannedConfigured && typeof plannedCount === "number" && plannedCount > 0;
            const plannedPct = plannedConfigured
              ? Number(subject.plannedPercentage ?? (attendedCount / plannedCount) * 100)
              : null;
            const isMeets = conductedPct >= BENCHMARK;

            // Blank leading slots for the first day of the active month
            const firstDayOfWeek = new Date(Date.UTC(activeYear, activeMonth - 1, 1)).getUTCDay();
            const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
            const cardOffTerm = activeMonth !== TERM_MONTH || activeYear !== TERM_YEAR;

            const renderedDays = calData?.calendarDays || generateFallbackCalendarDays(activeYear, activeMonth);

            return (
              <article
                key={subject.subjectName}
                className={`subject-calendar-card ${isMeets ? "card-on-track" : "card-shortage"}`}
                style={{ "--i": Math.min(index, 11) }}
              >
                {/* Card Top Bar */}
                <div className="card-top-bar">
                  <div className="subj-identity">
                    <div className="code-row">
                      <span className="subj-badge-code">{subject.subjectCode || "CORE"}</span>
                      <span className="subj-badge-credits">{subject.credits || 4} Credits</span>
                      <span className={`compliance-pill ${isMeets ? "pill-good" : "pill-warn"}`}>
                        {isMeets ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>On Track</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} />
                            <span>&lt; {BENCHMARK}% Shortage</span>
                          </>
                        )}
                      </span>
                    </div>
                    <h3 className="subj-name" title={subject.subjectName}>
                      {subject.subjectName}
                    </h3>
                    <div className="subj-faculty-room">
                      <span className="faculty-label">
                        <User size={13} />
                        {subject.facultyName || "Dept. Faculty"}
                      </span>
                      <span className="room-label">
                        <Building2 size={13} />
                        {subject.roomNo || "Room 302"}
                      </span>
                    </div>
                  </div>

                  <div className="subj-percentage-stack">
                    <div className="primary-pct-group">
                      {plannedConfigured ? (
                        <>
                          <span className="pct-val is-planned">
                            {plannedPct.toFixed(1)}%
                          </span>
                          <span className="pct-label">Semester Planned Progress</span>
                          <span className="pct-count-detail">
                            ({attendedCount} / {plannedCount} Lectures)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="pct-val pct-unconfigured">Semester total not configured</span>
                          <span className="pct-label">Curriculum Target Undefined</span>
                        </>
                      )}
                    </div>
                    <div className="secondary-pct-group">
                      <div className="sec-pct-line">
                        <span className={`sec-pct-val ${isMeets ? "is-good" : "is-bad"}`}>
                          {conductedCount > 0 ? `${conductedPct.toFixed(1)}%` : "0.0%"}
                        </span>
                        <span className={`sec-compliance-badge ${isMeets ? "badge-good" : "badge-warn"}`}>
                          {isMeets ? "On Track" : "< 60% Shortage"}
                        </span>
                      </div>
                      <span className="sec-pct-label">
                        Conducted to Date ({attendedCount} / {conductedCount} Held)
                      </span>
                    </div>
                  </div>
                </div>

                <AttendanceMeter
                  pct={plannedConfigured ? plannedPct : conductedPct}
                  hasData={plannedConfigured ? plannedCount > 0 : conductedCount > 0}
                  isPlanned={plannedConfigured}
                  attended={attendedCount}
                  total={plannedConfigured ? plannedCount : conductedCount}
                />

                {/* Month Navigation Strip */}
                <div className="card-month-strip">
                  <div className="month-selector">
                    <button
                      type="button"
                      className="month-nav-btn"
                      onClick={() => {
                        const newM = activeMonth === 1 ? 12 : activeMonth - 1;
                        const newY = activeMonth === 1 ? activeYear - 1 : activeYear;
                        handleSubjectMonthChange(subject.subjectName, newY, newM);
                      }}
                      title="Previous Month"
                      aria-label={`${subject.subjectName}: previous month`}
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="current-month-label">
                      {MONTH_NAMES[activeMonth - 1]} {activeYear}
                    </span>
                    <button
                      type="button"
                      className="month-nav-btn"
                      onClick={() => {
                        const newM = activeMonth === 12 ? 1 : activeMonth + 1;
                        const newY = activeMonth === 12 ? activeYear + 1 : activeYear;
                        handleSubjectMonthChange(subject.subjectName, newY, newM);
                      }}
                      title="Next Month"
                      aria-label={`${subject.subjectName}: next month`}
                    >
                      <ChevronRight size={15} />
                    </button>
                    {cardOffTerm && (
                      <button
                        type="button"
                        className="month-today-btn"
                        onClick={() => handleSubjectMonthChange(subject.subjectName, TERM_YEAR, TERM_MONTH)}
                        title="Jump to current term"
                      >
                        Today
                      </button>
                    )}
                  </div>

                  {isCardLoading ? (
                    <div className="month-quick-stat month-loading-stat">
                      <RefreshCw size={12} className="spin-icon" />
                      <span>Loading...</span>
                    </div>
                  ) : calData?.monthSummary ? (
                    <div className="month-quick-stat">
                      <span className="stat-attended">
                        {calData.monthSummary.attendedInMonth} / {calData.monthSummary.conductedInMonth} Attended
                      </span>
                      {calData.monthSummary.conductedInMonth > 0 && (
                        <span className="stat-pct">
                          ({calData.monthSummary.percentageInMonth?.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Monthly Calendar Grid */}
                <div className="card-calendar-wrapper">
                  <div className="calendar-week-header">
                    {WEEKDAYS.map((wd, i) => (
                      <span key={i} className={`weekday-col ${i === 0 ? "sunday-col" : ""}`}>
                        {wd}
                      </span>
                    ))}
                  </div>

                  <div
                    className={`calendar-cells-grid ${isCardLoading ? "is-loading-grid" : ""}`}
                    key={`${activeYear}-${activeMonth}`}
                  >
                    {leadingBlanks.map((b) => (
                      <div key={`blank-${b}`} className="cal-cell cell-empty" />
                    ))}

                    {renderedDays.map((d) => {
                      const dayNum = d.day || d.dayNumber;
                      const isToday = d.isToday;
                      const isSunday = d.dayOfWeek === 0;
                      const isHoliday = d.isHoliday;
                      const hasLecture = d.hasLecture;
                      const interactive = true;

                      let cellClass = "cal-cell";
                      if (isToday) cellClass += " cell-today";
                      if (isSunday) cellClass += " cell-sunday";
                      if (isHoliday && !isSunday) cellClass += " cell-holiday";
                      if (interactive) cellClass += " cell-interactive";

                      const indicatorText =
                        d.indicator ||
                        d.stateLabel ||
                        (d.state === "present" ? "P" : d.state === "absent" ? "A" : null);

                      let badgeClass = "badge-neutral";
                      if (d.state === "present") badgeClass = "badge-present";
                      else if (d.state === "absent") badgeClass = "badge-absent";
                      else if (d.state === "pending") badgeClass = "badge-pending";
                      else if (d.state === "holiday") badgeClass = "badge-holiday";
                      else if (d.state === "cancelled") badgeClass = "badge-cancelled";

                      const tooltipText = hasLecture
                        ? `${d.date}: ${d.state?.toUpperCase()} • ${d.lectureCount || 1} Lecture(s)`
                        : isHoliday
                        ? `${d.date}: Holiday (${d.holidayTitle || "Off"})`
                        : `${d.date}: No sessions`;

                      const open = () => openDateInspector(d, subject);

                      return (
                        <div
                          key={d.date}
                          className={cellClass}
                          data-state={d.state || undefined}
                          onClick={open}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              open();
                            }
                          }}
                          title={tooltipText}
                          role="button"
                          tabIndex={0}
                          aria-label={tooltipText}
                        >
                          <span className="cell-day-num">{dayNum}</span>
                          {d.state === "present" ? (
                            <span className="cell-status-badge badge-present" aria-label="Present">
                              <span className="badge-letter">P</span>
                            </span>
                          ) : d.state === "absent" ? (
                            <span className="cell-status-badge badge-absent" aria-label="Absent">
                              <span className="badge-letter">A</span>
                            </span>
                          ) : d.state === "partial" ? (
                            <span className="cell-status-badge badge-partial" aria-label="Partial Attendance">
                              <span className="badge-letter">P/A</span>
                            </span>
                          ) : d.state === "pending" ? (
                            <span className="cell-status-badge badge-pending" aria-label="Pending">
                              <span className="badge-letter">Pnd</span>
                            </span>
                          ) : isHoliday && !isSunday ? (
                            <span className="cell-status-badge badge-holiday" aria-label="Holiday">
                              <span className="badge-letter">H</span>
                            </span>
                          ) : isSunday ? (
                            <span className="cell-sunday-tag" aria-hidden="true">Sun</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="card-actions-bar">
                  <button
                    type="button"
                    className="action-icon-btn btn-graph"
                    onClick={() => setActiveGraphSubj(subject)}
                    title="Open Attendance Trend Graph"
                    aria-label="Attendance Graph"
                  >
                    <TrendingUp size={16} />
                    <span className="btn-label">Graph</span>
                  </button>

                  <button
                    type="button"
                    className="action-icon-btn btn-analytics"
                    onClick={() => setActiveAnalyticsSubj(subject)}
                    title="Open Subject Analytics & Statistics"
                    aria-label="Subject Analytics"
                  >
                    <PieChart size={16} />
                    <span className="btn-label">Analytics</span>
                  </button>

                  <button
                    type="button"
                    className="action-icon-btn btn-forecast"
                    onClick={() => setActiveForecastSubj(subject)}
                    title="Open Remaining Lectures / Forecast Calculator"
                    aria-label="Remaining Lectures Calculator"
                  >
                    <Clock size={16} />
                    <span className="btn-label">Forecast</span>
                  </button>

                  <button
                    type="button"
                    className="action-icon-btn btn-history"
                    onClick={() => setActiveHistorySubj(subject)}
                    title="Open Complete Attendance History Log"
                    aria-label="Attendance History"
                  >
                    <FileText size={16} />
                    <span className="btn-label">History</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* 5. Modals & Drawers */}
      {activeGraphSubj && (
        <AttendanceGraphModal subject={activeGraphSubj} onClose={() => setActiveGraphSubj(null)} />
      )}

      {activeAnalyticsSubj && (
        <AttendanceAnalyticsModal
          subject={activeAnalyticsSubj}
          onClose={() => setActiveAnalyticsSubj(null)}
        />
      )}

      {activeForecastSubj && (
        <AttendanceForecastModal
          subject={activeForecastSubj}
          onClose={() => setActiveForecastSubj(null)}
        />
      )}

      {activeHistorySubj && (
        <AttendanceHistoryModal
          subject={activeHistorySubj}
          onClose={() => setActiveHistorySubj(null)}
        />
      )}

      {activeDateModal && (
        <AttendanceDateInspectorDrawer
          dateInfo={activeDateModal.dateInfo}
          subject={activeDateModal.subject}
          onClose={() => setActiveDateModal(null)}
        />
      )}
    </div>
  );
}