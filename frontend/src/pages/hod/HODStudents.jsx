import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Users,
  Search,
  GraduationCap,
  Eye,
  Loader2,
  Filter,
  AlertTriangle,
  UserCheck,
  TrendingDown,
  BookX,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
  X,
  Mail,
  SearchX,
  FilterX,
  Download,
  Keyboard,
  Copy,
  Check,
  BarChart3,
  Bookmark,
  BookmarkPlus,
  GitCompare,
  StickyNote,
  MoreHorizontal,
  Award,
  ShieldAlert,
  Plus,
  Info,
  Activity,
  SlidersHorizontal,
  AlignJustify,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODStudents.css";

/* ================================================================== *
 * CONFIG
 * ================================================================== */
const LOW_ATTENDANCE = 75; // % below which a student is flagged
const GOOD_ATTENDANCE = 85; // % at or above which attendance is "healthy"
const PAGE_SIZES = [10, 25, 50, 100];
const CLIENT_FETCH_LIMIT = 100; // used only when the API is not server-paginated
const EXPORT_FETCH_LIMIT = 1000; // used by "Export all matching"
const SEARCH_DEBOUNCE = 350;
const MAX_COMPARE = 3;
const MAX_NOTE_LENGTH = 400;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/* Column registry. "student" and "actions" are always visible. */
const COLUMNS = [
  { key: "roll", label: "Roll / Enrollment", sortField: "roll", default: true },
  { key: "semester", label: "Semester", sortField: "semester", default: true },
  { key: "batch", label: "Batch", sortField: "batch", default: true },
  { key: "year", label: "Academic year", sortField: "year", default: false },
  { key: "attendance", label: "Attendance", sortField: "attendance", default: true },
  { key: "performance", label: "Performance", sortField: "performance", default: true },
  { key: "backlogs", label: "Backlogs", sortField: "backlogs", default: false },
  { key: "risk", label: "Risk", sortField: null, default: false },
  { key: "status", label: "Status", sortField: "status", default: true },
];
const DEFAULT_COLUMNS = COLUMNS.filter((c) => c.default).map((c) => c.key);

/* Chips that apply one or more filters at once. */
const QUICK_FILTERS = [
  {
    id: "risk-attendance",
    label: "Low attendance",
    icon: TrendingDown,
    tone: "rose",
    patch: { attendance: "low" },
  },
  {
    id: "backlogs",
    label: "Has backlogs",
    icon: BookX,
    tone: "amber",
    patch: { backlog: "yes" },
  },
  {
    id: "top",
    label: "Top performers",
    icon: Award,
    tone: "emerald",
    patch: { performance: "high" },
  },
  {
    id: "active",
    label: "Active only",
    icon: UserCheck,
    tone: "indigo",
    patch: { status: "active" },
  },
];

const SHORTCUTS = [
  { keys: ["/"], text: "Focus the search box" },
  { keys: ["j", "k"], text: "Move down / up through rows" },
  { keys: ["Enter"], text: "Quick view the highlighted student" },
  { keys: ["x"], text: "Select the highlighted student" },
  { keys: ["["], text: "Previous page" },
  { keys: ["]"], text: "Next page" },
  { keys: ["t"], text: "Switch to table view" },
  { keys: ["g"], text: "Switch to card view" },
  { keys: ["d"], text: "Toggle compact density" },
  { keys: ["i"], text: "Show or hide insights" },
  { keys: ["e"], text: "Export the current view as CSV" },
  { keys: ["r"], text: "Refresh the directory" },
  { keys: ["?"], text: "Open this list" },
  { keys: ["Esc"], text: "Close any panel, menu or dialog" },
];

/* ================================================================== *
 * FIELD READERS — one place to adapt to your real student schema.
 * Anything the API does not return stays `null` and is shown as
 * "Not recorded". Nothing is ever invented.
 * ================================================================== */
const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const buildRisk = ({ attendance, perf10, backlogs, status }) => {
  const flags = [];
  if (attendance !== null && attendance < LOW_ATTENDANCE) {
    flags.push(`Attendance ${attendance}% is below ${LOW_ATTENDANCE}%`);
  }
  if (backlogs !== null && backlogs > 0) {
    flags.push(`${backlogs} active backlog${backlogs === 1 ? "" : "s"}`);
  }
  if (perf10 !== null && perf10 < 6) {
    flags.push("Academic performance is below 6.0");
  }
  if (status && ["suspended", "dropped", "inactive"].includes(status)) {
    flags.push(`Enrollment status is ${status}`);
  }
  const hasData = attendance !== null || perf10 !== null || backlogs !== null;
  let level = "nodata";
  if (hasData) level = flags.length === 0 ? "ok" : flags.length === 1 ? "watch" : "risk";
  return { flags, level, score: flags.length };
};

const normalizeStudent = (s) => {
  const id = s.id || s._id;
  const semMatch = String(s.semester ?? "").match(/\d+/);
  const attRaw =
    s.attendancePercentage ??
    s.attendance?.percentage ??
    (typeof s.attendance === "object" ? null : s.attendance);
  const perfRaw =
    s.cgpa ?? s.performance?.cgpa ?? s.academicPerformance?.cgpa ?? s.percentage;
  const backlogRaw = Array.isArray(s.backlogs)
    ? s.backlogs.length
    : s.backlogs ?? s.backlogCount ?? s.activeBacklogs;
  let status = s.status ?? s.enrollmentStatus ?? null;
  if (!status && typeof s.isActive === "boolean") {
    status = s.isActive ? "active" : "inactive";
  }

  const perf = num(perfRaw);
  const attendance = num(attRaw);
  const backlogs = num(backlogRaw);
  const perf10 = perf === null ? null : perf > 10 ? perf / 10 : perf; // CGPA or percentage
  const normStatus = status ? String(status).toLowerCase() : null;
  const risk = buildRisk({ attendance, perf10, backlogs, status: normStatus });

  return {
    raw: s,
    id,
    name: s.fullName || s.name || "Unnamed student",
    email: s.email || "",
    avatarUrl: s.avatarUrl || "",
    roll: s.rollNo || s.enrollmentNo || "",
    semesterLabel: s.semester ? String(s.semester) : "",
    semesterNo: semMatch ? Number(semMatch[0]) : null,
    batch: s.batch || s.admissionYear || "",
    year: s.academicYear || "",
    attendance,
    performance: perf,
    perf10,
    backlogs,
    status: normStatus,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskFlags: risk.flags,
  };
};

const initialsOf = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "ST";

const attendanceTone = (v) =>
  v === null ? "muted" : v < LOW_ATTENDANCE ? "rose" : v < GOOD_ATTENDANCE ? "amber" : "emerald";
const perfTone = (v) => (v === null ? "muted" : v >= 8 ? "emerald" : v >= 6 ? "indigo" : "amber");
const riskTone = (level) =>
  level === "risk" ? "rose" : level === "watch" ? "amber" : level === "ok" ? "emerald" : "muted";
const riskLabel = (level) =>
  level === "risk" ? "At risk" : level === "watch" ? "Watch" : level === "ok" ? "On track" : "No data";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const timeAgo = (date) => {
  if (!date) return "";
  const sec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  return `${hr} hr ago`;
};

const formatStamp = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/* ================================================================== *
 * CSV EXPORT
 * Values that start with = + - @ are prefixed so spreadsheets never
 * treat student data as a formula.
 * ================================================================== */
const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CSV_HEADER = [
  "Name",
  "Email",
  "Roll / Enrollment",
  "Semester",
  "Batch",
  "Academic year",
  "Attendance %",
  "Performance",
  "Backlogs",
  "Status",
  "Risk",
];

const studentToCsvRow = (s) => [
  s.name,
  s.email,
  s.roll,
  s.semesterLabel,
  s.batch,
  s.year,
  s.attendance,
  s.performance,
  s.backlogs,
  s.status ? cap(s.status) : "",
  riskLabel(s.riskLevel),
];

const downloadCsv = (filename, students) => {
  const lines = [CSV_HEADER, ...students.map(studentToCsvRow)]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const blob = new Blob([`\ufeff${lines}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

/* ================================================================== *
 * HOOKS
 * ================================================================== */
function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initial : JSON.parse(stored);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be blocked — preferences simply won't persist */
    }
  }, [key, value]);
  return [value, setValue];
}

function useOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside, active]);
}

/* Keeps Tab / Shift+Tab inside a dialog while it is open. */
function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const node = ref.current;
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll(selector)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [ref, active]);
}

/* Re-renders every `ms` so "Updated 2 min ago" stays honest. */
function useTick(ms) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/* ================================================================== *
 * SMALL PIECES
 * ================================================================== */
function CountUp({ value, duration = 700 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return undefined;
    }
    let raf;
    let start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{typeof value === "number" ? shown.toLocaleString() : "—"}</>;
}

function Avatar({ student, size = "md" }) {
  return (
    <div className={`hod-std-avatar ${size}`} aria-hidden="true">
      {student.avatarUrl ? (
        <img src={student.avatarUrl} alt="" loading="lazy" />
      ) : (
        <span>{initialsOf(student.name)}</span>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  if (!status) return <span className="hod-std-muted">Not recorded</span>;
  const tone =
    status === "active" || status === "verified"
      ? "emerald"
      : status === "suspended" || status === "dropped"
        ? "rose"
        : "amber";
  return (
    <span className={`hod-std-status ${tone}`}>
      <i aria-hidden="true" />
      {cap(status)}
    </span>
  );
}

function RiskPill({ level }) {
  const tone = riskTone(level);
  const Icon = level === "risk" ? ShieldAlert : level === "watch" ? AlertTriangle : level === "ok" ? CheckCircle2 : Info;
  return (
    <span className={`hod-std-risk ${tone}`}>
      <Icon size={12} aria-hidden="true" />
      {riskLabel(level)}
    </span>
  );
}

function AttendanceCell({ value }) {
  if (value === null) return <span className="hod-std-muted">Not recorded</span>;
  const tone = attendanceTone(value);
  return (
    <div className="hod-std-meter" title={`${value}% attendance`}>
      <div className="hod-std-meter-track" role="img" aria-label={`Attendance ${value} percent`}>
        <div className={`hod-std-meter-fill ${tone}`} style={{ "--fill": `${Math.min(value, 100)}%` }} />
      </div>
      <span className={`hod-std-meter-val ${tone}`}>{value}%</span>
    </div>
  );
}

function PerfCell({ student }) {
  if (student.performance === null) return <span className="hod-std-muted">Not recorded</span>;
  return <span className={`hod-std-chip ${perfTone(student.perf10)}`}>{student.performance}</span>;
}

function BacklogCell({ value }) {
  if (value === null) return <span className="hod-std-muted">Not recorded</span>;
  return value > 0 ? (
    <span className="hod-std-chip rose">{value} active</span>
  ) : (
    <span className="hod-std-chip emerald">Clear</span>
  );
}

function Checkbox({ checked, indeterminate = false, onChange, label, disabled = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <label className={`hod-std-check ${checked ? "on" : ""} ${indeterminate && !checked ? "mixed" : ""}`}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        disabled={disabled}
      />
      <span className="hod-std-check-box" aria-hidden="true">
        {checked ? <Check size={12} strokeWidth={3} /> : indeterminate ? <span className="hod-std-check-dash" /> : null}
      </span>
    </label>
  );
}

function KpiCard({ icon: Icon, label, value, hint, tone, delay, onClick, active }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? Boolean(active) : undefined}
      className={`hod-std-kpi ${tone} ${onClick ? "clickable" : ""} ${active ? "active" : ""}`}
      style={{ "--delay": `${delay}ms` }}
    >
      <div className="hod-std-kpi-icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="hod-std-kpi-body">
        <span className="hod-std-kpi-label">{label}</span>
        <strong className="hod-std-kpi-value">
          <CountUp value={value} />
        </strong>
        <span className="hod-std-kpi-hint">
          {value === null ? "Not tracked in current records" : hint}
        </span>
      </div>
    </Wrapper>
  );
}

function SortHead({ label, field, sort, onSort, align }) {
  const active = sort.by === field;
  const Icon = !active ? ArrowUpDown : sort.order === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}
      style={align ? { textAlign: align } : undefined}
    >
      <button
        type="button"
        className={`hod-std-sort ${active ? "active" : ""}`}
        onClick={() => onSort(field)}
      >
        {label}
        <Icon size={13} />
      </button>
    </th>
  );
}

function SkeletonRows({ view }) {
  const items = Array.from({ length: 6 });
  if (view === "grid") {
    return (
      <div className="hod-std-grid" aria-hidden="true">
        {items.map((_, i) => (
          <div key={i} className="hod-std-skel-card">
            <div className="hod-std-skel round" />
            <div className="hod-std-skel line w60" />
            <div className="hod-std-skel line w40" />
            <div className="hod-std-skel line w80" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="hod-std-skel-list" aria-hidden="true">
      {items.map((_, i) => (
        <div key={i} className="hod-std-skel-row">
          <div className="hod-std-skel round" />
          <div className="hod-std-skel line w30" />
          <div className="hod-std-skel line w15" />
          <div className="hod-std-skel line w15" />
          <div className="hod-std-skel line w20" />
        </div>
      ))}
    </div>
  );
}

function pageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…l");
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total - 1) out.push("…r");
  out.push(total);
  return out;
}

/* Small floating menu shell used by Export / Columns / Views. */
function Popover({ open, onClose, children, align = "right", label }) {
  const ref = useRef(null);
  useOutside(ref, onClose, open);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={`hod-std-popover ${align}`} role="menu" aria-label={label}>
      {children}
    </div>
  );
}

/* Local toast stack for the new actions (copy, export, bulk, views). */
function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="hod-std-toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`hod-std-toast ${t.error ? "error" : ""} ${t.leaving ? "leaving" : ""}`}>
          <span className="hod-std-toast-icon" aria-hidden="true">
            {t.error ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          </span>
          <span className="hod-std-toast-text">{t.text}</span>
          <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
          <i className="hod-std-toast-bar" style={{ "--life": `${t.life}ms` }} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

/* ================================================================== *
 * CHARTS (pure SVG / CSS — no extra dependency)
 * ================================================================== */
const SERIES_COLORS = [
  "var(--std-primary)",
  "var(--std-emerald)",
  "var(--std-amber)",
  "var(--std-rose)",
  "#0ea5e9",
  "#a855f7",
  "#14b8a6",
  "#f97316",
];

function Donut({ data, size = 148, stroke = 20, centerLabel, centerValue }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="hod-std-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
        <circle
          className="hod-std-donut-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * C;
            const gap = data.length > 1 ? 2 : 0;
            const seg = (
              <circle
                key={d.label}
                className="hod-std-donut-seg"
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(len - gap, 0)} ${C - Math.max(len - gap, 0)}`}
                strokeDashoffset={-acc}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ "--len": `${len}px`, "--circ": `${C}px`, animationDelay: `${i * 90}ms` }}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            acc += len;
            return seg;
          })}
      </svg>
      <div className="hod-std-donut-center">
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

const ATTENDANCE_BUCKETS = [
  { key: "lt50", label: "<50", test: (v) => v < 50, tone: "rose" },
  { key: "50", label: "50–64", test: (v) => v >= 50 && v < 65, tone: "rose" },
  { key: "65", label: "65–74", test: (v) => v >= 65 && v < LOW_ATTENDANCE, tone: "amber" },
  { key: "75", label: "75–84", test: (v) => v >= LOW_ATTENDANCE && v < GOOD_ATTENDANCE, tone: "amber" },
  { key: "85", label: "85–100", test: (v) => v >= GOOD_ATTENDANCE, tone: "emerald" },
];

function Histogram({ students, onPick, activeBucket }) {
  const counts = ATTENDANCE_BUCKETS.map((b) => ({
    ...b,
    count: students.filter((s) => s.attendance !== null && b.test(s.attendance)).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));
  const missing = students.filter((s) => s.attendance === null).length;
  return (
    <div className="hod-std-hist">
      <div className="hod-std-hist-bars">
        {counts.map((c, i) => (
          <button
            type="button"
            key={c.key}
            className={`hod-std-hist-col ${c.tone} ${(activeBucket === "low" && ["lt50", "50", "65"].includes(c.key)) || (activeBucket === "ok" && ["75", "85"].includes(c.key)) ? "active" : ""}`}
            onClick={() => onPick?.(c)}
            title={`${c.count} student${c.count === 1 ? "" : "s"} at ${c.label}%`}
            aria-label={`${c.count} students with attendance ${c.label} percent`}
          >
            <span className="hod-std-hist-count">{c.count}</span>
            <span
              className="hod-std-hist-bar"
              style={{ "--h": `${Math.round((c.count / max) * 100)}%`, animationDelay: `${i * 80}ms` }}
            />
            <span className="hod-std-hist-label">{c.label}</span>
          </button>
        ))}
      </div>
      {missing > 0 && (
        <p className="hod-std-hist-note">{missing} without attendance records are not shown.</p>
      )}
    </div>
  );
}

function PerformanceBands({ students }) {
  const bands = [
    { label: "Strong (8.0+)", tone: "emerald", test: (v) => v >= 8 },
    { label: "Average (6.0–7.9)", tone: "indigo", test: (v) => v >= 6 && v < 8 },
    { label: "Needs support", tone: "amber", test: (v) => v < 6 },
  ].map((b) => ({
    ...b,
    count: students.filter((s) => s.perf10 !== null && b.test(s.perf10)).length,
  }));
  const known = bands.reduce((a, b) => a + b.count, 0);
  const unknown = students.length - known;
  return (
    <div className="hod-std-bands">
      <div className="hod-std-bands-bar" role="img" aria-label="Performance distribution">
        {bands.map((b, i) =>
          b.count > 0 ? (
            <span
              key={b.label}
              className={`hod-std-bands-seg ${b.tone}`}
              style={{ flexGrow: b.count, animationDelay: `${i * 100}ms` }}
              title={`${b.label}: ${b.count}`}
            />
          ) : null,
        )}
        {known === 0 && <span className="hod-std-bands-seg muted" style={{ flexGrow: 1 }} />}
      </div>
      <ul className="hod-std-legend">
        {bands.map((b) => (
          <li key={b.label} className={b.tone}>
            <i aria-hidden="true" />
            <span>{b.label}</span>
            <strong>{b.count}</strong>
          </li>
        ))}
        {unknown > 0 && (
          <li className="muted">
            <i aria-hidden="true" />
            <span>Not recorded</span>
            <strong>{unknown}</strong>
          </li>
        )}
      </ul>
    </div>
  );
}

function InsightsPanel({ students, scope, open, onToggle, onPickStudent, onPickBucket, activeBucket }) {
  const semData = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const k = s.semesterLabel || "Not recorded";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([label, value]) => ({ label, value }));
  }, [students]);

  const attention = useMemo(
    () =>
      students
        .filter((s) => s.riskScore > 0)
        .sort((a, b) => b.riskScore - a.riskScore || (a.attendance ?? 101) - (b.attendance ?? 101))
        .slice(0, 5),
    [students],
  );

  const avgAttendance = useMemo(() => {
    const vals = students.map((s) => s.attendance).filter((v) => v !== null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }, [students]);

  const avgPerf = useMemo(() => {
    const vals = students.map((s) => s.perf10).filter((v) => v !== null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
  }, [students]);

  return (
    <section className={`hod-std-insights ${open ? "open" : ""}`} aria-label="Insights">
      <button
        type="button"
        className="hod-std-insights-head"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="hod-std-insights-body"
      >
        <span className="hod-std-insights-title">
          <BarChart3 size={17} aria-hidden="true" />
          Insights
          <small>{scope}</small>
        </span>
        <span className="hod-std-insights-summary">
          {avgAttendance !== null && <b className={attendanceTone(avgAttendance)}>Avg attendance {avgAttendance}%</b>}
          {avgPerf !== null && <b className={perfTone(avgPerf)}>Avg performance {avgPerf}</b>}
        </span>
        <ChevronDown size={18} className="hod-std-insights-chev" aria-hidden="true" />
      </button>

      <div id="hod-std-insights-body" className="hod-std-insights-body" aria-hidden={!open}>
        <div className="hod-std-insights-inner">
          {students.length === 0 ? (
            <p className="hod-std-muted">Insights appear once students are loaded.</p>
          ) : (
            <div className="hod-std-insights-grid">
              <div className="hod-std-panel">
                <h4>Attendance spread</h4>
                <p className="hod-std-panel-sub">Select a bar to show students below or above {LOW_ATTENDANCE}%.</p>
                <Histogram students={students} onPick={onPickBucket} activeBucket={activeBucket} />
              </div>

              <div className="hod-std-panel">
                <h4>By semester</h4>
                <p className="hod-std-panel-sub">Where your students are right now.</p>
                <div className="hod-std-donut-row">
                  <Donut data={semData} centerValue={students.length} centerLabel="students" />
                  <ul className="hod-std-legend vertical">
                    {semData.map((d, i) => (
                      <li key={d.label}>
                        <i style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} aria-hidden="true" />
                        <span>{d.label}</span>
                        <strong>{d.value}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="hod-std-panel">
                <h4>Academic performance</h4>
                <p className="hod-std-panel-sub">CGPA bands across loaded students.</p>
                <PerformanceBands students={students} />
              </div>

              <div className="hod-std-panel attention">
                <h4>Needs attention</h4>
                <p className="hod-std-panel-sub">Students with the most open flags.</p>
                {attention.length === 0 ? (
                  <div className="hod-std-allclear">
                    <Sparkles size={20} aria-hidden="true" />
                    <span>Nobody is flagged right now.</span>
                  </div>
                ) : (
                  <ul className="hod-std-attn-list">
                    {attention.map((s, i) => (
                      <li key={s.id} style={{ "--i": i }}>
                        <button type="button" onClick={(e) => onPickStudent(s, e)}>
                          <Avatar student={s} size="sm" />
                          <span className="hod-std-attn-name">
                            <strong>{s.name}</strong>
                            <small>{s.riskFlags[0]}</small>
                          </span>
                          <RiskPill level={s.riskLevel} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * MENUS & DIALOGS
 * ================================================================== */
function ShortcutsModal({ onClose }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useEffect(() => {
    ref.current?.querySelector("button")?.focus();
  }, []);
  return (
    <div className="hod-std-overlay center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className="hod-std-modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hod-std-keys-title"
      >
        <div className="hod-std-modal-top">
          <div className="hod-std-modal-icon info">
            <Keyboard size={22} />
          </div>
          <button type="button" className="hod-std-icon-btn" onClick={onClose} aria-label="Close shortcuts">
            <X size={15} />
          </button>
        </div>
        <h3 id="hod-std-keys-title">Keyboard shortcuts</h3>
        <p>Shortcuts work whenever you are not typing in a field.</p>
        <ul className="hod-std-keys">
          {SHORTCUTS.map((s) => (
            <li key={s.text}>
              <span>{s.text}</span>
              <span className="hod-std-keycaps">
                {s.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompareModal({ students, onClose, onRemove, onOpen }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useEffect(() => {
    ref.current?.querySelector("button")?.focus();
  }, []);

  const best = (field, higherIsBetter = true) => {
    const vals = students.map((s) => s[field]).filter((v) => v !== null);
    if (vals.length < 2) return null;
    return higherIsBetter ? Math.max(...vals) : Math.min(...vals);
  };
  const bestAtt = best("attendance");
  const bestPerf = best("perf10");
  const bestBack = best("backlogs", false);

  const rows = [
    {
      label: "Attendance",
      render: (s) => (s.attendance === null ? "—" : `${s.attendance}%`),
      win: (s) => bestAtt !== null && s.attendance === bestAtt,
    },
    {
      label: "Performance",
      render: (s) => (s.performance === null ? "—" : s.performance),
      win: (s) => bestPerf !== null && s.perf10 === bestPerf,
    },
    {
      label: "Backlogs",
      render: (s) => (s.backlogs === null ? "—" : s.backlogs),
      win: (s) => bestBack !== null && s.backlogs === bestBack,
    },
    { label: "Semester", render: (s) => s.semesterLabel || "—" },
    { label: "Batch", render: (s) => s.batch || "—" },
    { label: "Roll / Enrollment", render: (s) => s.roll || "—" },
    { label: "Status", render: (s) => (s.status ? cap(s.status) : "—") },
    { label: "Risk", render: (s) => riskLabel(s.riskLevel) },
  ];

  return (
    <div className="hod-std-overlay center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className="hod-std-modal compare"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hod-std-cmp-title"
      >
        <div className="hod-std-modal-top">
          <div className="hod-std-modal-icon info">
            <GitCompare size={22} />
          </div>
          <button type="button" className="hod-std-icon-btn" onClick={onClose} aria-label="Close comparison">
            <X size={15} />
          </button>
        </div>
        <h3 id="hod-std-cmp-title">Compare students</h3>
        <p>The strongest value in each row is highlighted.</p>

        <div className="hod-std-cmp-wrap">
          <table className="hod-std-cmp">
            <thead>
              <tr>
                <th scope="col" aria-label="Metric" />
                {students.map((s) => (
                  <th scope="col" key={s.id}>
                    <div className="hod-std-cmp-person">
                      <Avatar student={s} size="lg" />
                      <strong>{s.name}</strong>
                      <button type="button" className="hod-std-link" onClick={() => onRemove(s)}>
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {students.map((s) => (
                    <td key={s.id} className={row.win?.(s) ? "win" : ""}>
                      {row.render(s)}
                      {row.win?.(s) && <Award size={13} aria-label="Best value" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" aria-label="Actions" />
                {students.map((s) => (
                  <td key={s.id}>
                    <button type="button" className="hod-btn-secondary hod-std-open" onClick={() => onOpen(s)}>
                      View profile
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function BulkDeleteModal({ students, state, onChange, onCancel, onRun }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  const word = "DELETE";
  const canRun = state.text.trim() === word && !state.running;
  const pct = state.total ? Math.round((state.done / state.total) * 100) : 0;
  return (
    <div className="hod-std-overlay center" onMouseDown={(e) => e.target === e.currentTarget && !state.running && onCancel()}>
      <div
        ref={ref}
        className="hod-std-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hod-std-bulk-title"
        aria-describedby="hod-std-bulk-desc"
      >
        <div className="hod-std-modal-icon">
          <Trash2 size={22} />
        </div>
        <h3 id="hod-std-bulk-title">
          Delete {students.length} student{students.length === 1 ? "" : "s"}?
        </h3>
        <p id="hod-std-bulk-desc">
          Every selected record is removed from the directory. This can’t be undone from this page.
        </p>
        <ul className="hod-std-bulk-names">
          {students.slice(0, 5).map((s) => (
            <li key={s.id}>
              <Avatar student={s} size="sm" />
              <span>{s.name}</span>
            </li>
          ))}
          {students.length > 5 && <li className="more">and {students.length - 5} more</li>}
        </ul>
        <label className="hod-std-confirm">
          <span>
            Type <code>{word}</code> to confirm
          </span>
          <input
            className="hod-input"
            autoFocus
            value={state.text}
            onChange={(e) => onChange({ text: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && canRun && onRun()}
            disabled={state.running}
            autoComplete="off"
          />
        </label>
        {state.running && (
          <div className="hod-std-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="hod-std-progress-fill" style={{ width: `${pct}%` }} />
            <span>
              {state.done} of {state.total} removed
            </span>
          </div>
        )}
        {state.error && (
          <div className="hod-std-inline-error" role="alert">
            {state.error}
          </div>
        )}
        <div className="hod-std-modal-foot">
          <button type="button" className="hod-btn-secondary" onClick={onCancel} disabled={state.running}>
            Cancel
          </button>
          <button type="button" className="hod-std-danger-btn solid" onClick={onRun} disabled={!canRun}>
            {state.running ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
            {state.running ? "Deleting…" : `Delete ${students.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContextMenu({ menu, onClose, items }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });
  useOutside(ref, onClose, true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8)),
    });
    el.querySelector("button")?.focus();
  }, [menu.x, menu.y]);
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div ref={ref} className="hod-std-ctx" role="menu" style={pos} aria-label={`Actions for ${menu.student.name}`}>
      <div className="hod-std-ctx-head">
        <Avatar student={menu.student} size="sm" />
        <strong>{menu.student.name}</strong>
      </div>
      {items.map((item, i) =>
        item === "divider" ? (
          <hr key={`d${i}`} />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={item.danger ? "danger" : ""}
            onClick={() => {
              onClose();
              item.run();
            }}
          >
            <item.icon size={14} aria-hidden="true" />
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}

/* ================================================================== *
 * DRAWER PIECES
 * ================================================================== */
function Ring({ value, tone, label, size = 96 }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(value, 100));
  return (
    <div className={`hod-std-ring ${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle className="hod-std-ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="hod-std-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          style={{ "--circ": C, "--target": C - (pct / 100) * C }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="hod-std-ring-center">
        <strong>{value === null ? "—" : `${Math.round(value)}%`}</strong>
      </div>
    </div>
  );
}

function CopyButton({ text, label, onCopied }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!text) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      onCopied?.(`${label} copied`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1600);
    } catch {
      onCopied?.("Couldn’t copy — your browser blocked clipboard access.", true);
    }
  };
  return (
    <button type="button" className={`hod-std-copy ${done ? "done" : ""}`} onClick={copy} aria-label={`Copy ${label}`} title={`Copy ${label}`}>
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function NotesTab({ student, notes, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const list = notes || [];
  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    onAdd(student.id, clean);
    setText("");
  };
  return (
    <div className="hod-std-notes">
      <label className="hod-std-note-field">
        <span>Add a private note</span>
        <textarea
          className="hod-input"
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          value={text}
          placeholder="Follow-ups, meeting outcomes, reminders…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && submit()}
        />
        <small>
          {text.length}/{MAX_NOTE_LENGTH} · Ctrl + Enter to save
        </small>
      </label>
      <button type="button" className="hod-btn-primary hod-std-note-add" onClick={submit} disabled={!text.trim()}>
        <Plus size={14} /> Save note
      </button>
      <p className="hod-std-note">Notes are stored in this browser only. They are not shared with other staff.</p>

      {list.length === 0 ? (
        <div className="hod-std-notes-empty">
          <StickyNote size={22} aria-hidden="true" />
          <span>No notes for {student.name.split(" ")[0]} yet.</span>
        </div>
      ) : (
        <ul className="hod-std-note-list">
          {list.map((n) => (
            <li key={n.id}>
              <p>{n.text}</p>
              <div>
                <time dateTime={n.at}>{formatStamp(n.at)}</time>
                <button type="button" onClick={() => onDelete(student.id, n.id)} aria-label="Delete note">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================================================================== *
 * MAIN COMPONENT
 * ================================================================== */
export default function HODStudents({ currentUser, onSelectStudent, showToast }) {
  const deptBranch = currentUser?.department || "CSE";
  const canDelete = typeof authApi.deleteStudent === "function";
  const reducedMotion = usePrefersReducedMotion();
  useTick(30000);

  /* ---------------- data ---------------- */
  const [raw, setRaw] = useState([]);
  const [serverTotal, setServerTotal] = useState(null);
  const [serverSummary, setServerSummary] = useState(null);
  const [serverFilters, setServerFilters] = useState(null);
  const [mode, setMode] = useState("unknown"); // unknown | client | server
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* ---------------- controls ---------------- */
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("all");
  const [batch, setBatch] = useState("all");
  const [status, setStatus] = useState("all");
  const [attendance, setAttendance] = useState("all");
  const [performance, setPerformance] = useState("all");
  const [backlog, setBacklog] = useState("all");
  const [sort, setSort] = useState({ by: "name", order: "asc" });
  const [page, setPage] = useState(1);

  /* ---------------- remembered preferences ---------------- */
  const [pageSize, setPageSize] = useLocalState("hod-std:pageSize", 10);
  const [view, setView] = useLocalState("hod-std:view", "table");
  const [density, setDensity] = useLocalState("hod-std:density", "comfortable");
  const [columns, setColumns] = useLocalState("hod-std:columns", DEFAULT_COLUMNS);
  const [insightsOpen, setInsightsOpen] = useLocalState("hod-std:insights", true);
  const [savedViews, setSavedViews] = useLocalState(`hod-std:views:${deptBranch}`, []);
  const [notesStore, setNotesStore] = useLocalState(`hod-std:notes:${deptBranch}`, {});

  /* ---------------- selection & overlays ---------------- */
  const [selMap, setSelMap] = useState(() => new Map());
  const [cursor, setCursor] = useState(-1);
  const [selected, setSelected] = useState(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [bulk, setBulk] = useState({ open: false, text: "", running: false, done: 0, total: 0, error: "" });
  const [compareOpen, setCompareOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [exporting, setExporting] = useState(false);

  /* ---------------- toasts ---------------- */
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 260);
  }, []);
  const pushToast = useCallback(
    (text, isError = false) => {
      const id = ++toastId.current;
      const life = isError ? 6000 : 3200;
      setToasts((prev) => [...prev.slice(-3), { id, text, error: isError, life }]);
      setTimeout(() => dismissToast(id), life);
    },
    [dismissToast],
  );

  /* ---------------- refs ---------------- */
  const fetchedRef = useRef(null);
  const requestRef = useRef(0);
  const drawerRef = useRef(null);
  const drawerCloseRef = useRef(null);
  const lastFocusRef = useRef(null);
  const searchRef = useRef(null);
  const rowsRef = useRef([]);
  const keyRef = useRef(null);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ---------------- fetching ---------------- */
  const paramsKey = [
    page,
    pageSize,
    search,
    semester,
    batch,
    status,
    attendance,
    performance,
    backlog,
    sort.by,
    sort.order,
  ].join("|");
  const baseKey = `${deptBranch}|${reloadKey}`;

  const buildServerParams = useCallback(
    (overrides = {}) => {
      const params = {
        branch: deptBranch,
        page,
        limit: pageSize,
        sortBy: sort.by,
        order: sort.order,
      };
      if (search) params.search = search;
      if (semester !== "all") params.semester = semester;
      if (batch !== "all") params.batch = batch;
      if (status !== "all") params.status = status;
      if (attendance !== "all") params.attendance = attendance;
      if (performance !== "all") params.performance = performance;
      if (backlog !== "all") params.backlogs = backlog;
      return { ...params, ...overrides };
    },
    [deptBranch, page, pageSize, sort, search, semester, batch, status, attendance, performance, backlog],
  );

  const load = useCallback(() => {
    const id = ++requestRef.current;
    setLoading(true);
    setError("");

    // `branch` is a hint only — the backend must derive the department from the HOD's token.
    const params =
      mode === "client"
        ? { branch: deptBranch, limit: CLIENT_FETCH_LIMIT }
        : buildServerParams();

    authApi
      .getStudentsDirectory(params)
      .then((res) => {
        if (id !== requestRef.current) return;
        const list = res?.students || [];
        const paged = Boolean(res?.pagination) || typeof res?.total === "number";
        setRaw(list.map(normalizeStudent));
        setServerTotal(paged ? res?.pagination?.total ?? res.total : null);
        setServerSummary(res?.summary || null);
        setServerFilters(res?.filters || null);
        setMode(paged ? "server" : "client");
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((err) => {
        if (id !== requestRef.current) return;
        const msg = err?.message || "Failed to load the student directory.";
        setError(msg);
        setRaw([]);
        setLoading(false);
        showToast?.(msg, true);
      });
  }, [deptBranch, mode, buildServerParams, showToast]);

  useEffect(() => {
    const prev = fetchedRef.current;
    const same = prev && prev.base === baseKey && (mode === "client" || prev.params === paramsKey);
    if (same) return;
    fetchedRef.current = { base: baseKey, params: paramsKey };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, paramsKey, mode]);

  /* ---------------- derived data ---------------- */
  const hasAttendance = raw.some((r) => r.attendance !== null);
  const hasPerformance = raw.some((r) => r.performance !== null);
  const hasBacklogs = raw.some((r) => r.backlogs !== null);

  const batchOptions = useMemo(() => {
    if (serverFilters?.batches?.length) return serverFilters.batches.map(String);
    return [...new Set(raw.map((r) => String(r.batch)).filter(Boolean))].sort();
  }, [raw, serverFilters]);

  const statusOptions = useMemo(() => {
    if (serverFilters?.statuses?.length) return serverFilters.statuses.map((s) => String(s).toLowerCase());
    return [...new Set(raw.map((r) => r.status).filter(Boolean))].sort();
  }, [raw, serverFilters]);

  const processed = useMemo(() => {
    if (mode !== "client") return raw;
    const q = search.toLowerCase();
    let list = raw.filter((r) => {
      if (semester !== "all" && r.semesterLabel !== semester) return false;
      if (batch !== "all" && String(r.batch) !== batch) return false;
      if (status !== "all") {
        if (status === "active") {
          if (r.status !== "active" && r.status !== "verified" && !r.raw?.isActive) return false;
        } else if (r.status !== status) {
          return false;
        }
      }
      if (attendance !== "all") {
        if (r.attendance === null) {
          if (attendance !== "none") return false;
        } else if (attendance === "low" && r.attendance >= LOW_ATTENDANCE) return false;
        else if (attendance === "ok" && r.attendance < LOW_ATTENDANCE) return false;
        else if (attendance === "none") return false;
      }
      if (performance !== "all") {
        if (r.perf10 === null) return false;
        if (performance === "high" && r.perf10 < 8) return false;
        if (performance === "mid" && (r.perf10 < 6 || r.perf10 >= 8)) return false;
        if (performance === "low" && r.perf10 >= 6) return false;
      }
      if (backlog === "yes" && !(r.backlogs !== null && r.backlogs > 0)) return false;
      if (backlog === "no" && !(r.backlogs !== null && r.backlogs === 0)) return false;
      if (
        q &&
        !(
          r.name.toLowerCase().includes(q) ||
          r.roll.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });

    const key =
      {
        name: "name",
        roll: "roll",
        semester: "semesterNo",
        batch: "batch",
        year: "year",
        status: "status",
        attendance: "attendance",
        performance: "perf10",
        backlogs: "backlogs",
      }[sort.by] || "name";
    const dir = sort.order === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === null || av === "" || av === undefined) return 1; // missing data always last
      if (bv === null || bv === "" || bv === undefined) return -1;
      return typeof av === "number"
        ? (av - bv) * dir
        : String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
    return list;
  }, [raw, mode, search, semester, batch, status, attendance, performance, backlog, sort]);

  const totalCount = mode === "server" && serverTotal !== null ? serverTotal : processed.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = mode === "client" ? processed.slice((safePage - 1) * pageSize, safePage * pageSize) : processed;
  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalCount);
  rowsRef.current = rows;

  const kpis = useMemo(() => {
    const s = serverSummary;
    const pick = (serverVal, computeFrom, test) => {
      if (s && typeof serverVal === "number") return serverVal;
      if (!computeFrom) return null;
      return raw.filter(test).length;
    };
    return {
      total:
        s && typeof s.total === "number"
          ? s.total
          : mode === "server" && serverTotal !== null
            ? serverTotal
            : raw.length,
      active: pick(
        s?.active,
        raw.some((r) => r.status),
        (r) => r.status === "active" || r.status === "verified" || Boolean(r.raw?.isActive)
      ),
      low: pick(s?.lowAttendance, hasAttendance, (r) => r.attendance !== null && r.attendance < LOW_ATTENDANCE),
      backlogs: pick(s?.withBacklogs, hasBacklogs, (r) => r.backlogs !== null && r.backlogs > 0),
    };
  }, [serverSummary, raw, mode, serverTotal, hasAttendance, hasBacklogs]);

  const kpiScope = serverSummary ? "in department" : mode === "server" ? "on this page" : "in loaded records";
  const insightScope =
    mode === "client"
      ? `${processed.length} matching students`
      : `${raw.length} students on this page`;

  const filtersActive =
    Boolean(searchInput) ||
    semester !== "all" ||
    batch !== "all" ||
    status !== "all" ||
    attendance !== "all" ||
    performance !== "all" ||
    backlog !== "all";

  const activeFilterCount = [semester, batch, status, attendance, performance, backlog].filter((v) => v !== "all").length + (searchInput ? 1 : 0);

  const visibleColumns = COLUMNS.filter((c) => columns.includes(c.key));
  const selList = useMemo(() => [...selMap.values()], [selMap]);
  const pageAllSelected = rows.length > 0 && rows.every((r) => selMap.has(r.id));
  const pageSomeSelected = rows.some((r) => selMap.has(r.id)) && !pageAllSelected;
  const selIndex = selected ? rows.findIndex((r) => r.id === selected.id) : -1;

  /* ---------------- filter helpers ---------------- */
  const setters = {
    semester: setSemester,
    batch: setBatch,
    status: setStatus,
    attendance: setAttendance,
    performance: setPerformance,
    backlog: setBacklog,
  };
  const currentFilters = { semester, batch, status, attendance, performance, backlog };

  const quickActive = (qf) => Object.entries(qf.patch).every(([k, v]) => currentFilters[k] === v);
  const toggleQuick = (qf) => {
    const on = quickActive(qf);
    Object.entries(qf.patch).forEach(([k, v]) => setters[k](on ? "all" : v));
    setPage(1);
  };

  const setFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const toggleSort = (field) => {
    setSort((prev) =>
      prev.by === field
        ? { by: field, order: prev.order === "asc" ? "desc" : "asc" }
        : { by: field, order: "asc" },
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSemester("all");
    setBatch("all");
    setStatus("all");
    setAttendance("all");
    setPerformance("all");
    setBacklog("all");
    setPage(1);
  };

  const pickAttendanceBucket = (bucket) => {
    const group = ["lt50", "50", "65"].includes(bucket.key) ? "low" : "ok";
    setAttendance((prev) => (prev === group ? "all" : group));
    setPage(1);
    pushToast(
      group === "low"
        ? `Showing students with attendance below ${LOW_ATTENDANCE}%`
        : `Showing students with ${LOW_ATTENDANCE}% attendance or more`,
    );
  };

  /* ---------------- saved views ---------------- */
  const saveCurrentView = () => {
    const name = viewName.trim();
    if (!name) return;
    const snapshot = {
      id: `v${Date.now()}`,
      name,
      search: searchInput,
      semester,
      batch,
      status,
      attendance,
      performance,
      backlog,
      sort,
      layout: view,
    };
    setSavedViews((prev) => [...prev.filter((v) => v.name.toLowerCase() !== name.toLowerCase()), snapshot].slice(-8));
    setViewName("");
    pushToast(`View “${name}” saved`);
  };

  const applyView = (v) => {
    setSearchInput(v.search || "");
    setSearch((v.search || "").trim());
    setSemester(v.semester || "all");
    setBatch(v.batch || "all");
    setStatus(v.status || "all");
    setAttendance(v.attendance || "all");
    setPerformance(v.performance || "all");
    setBacklog(v.backlog || "all");
    setSort(v.sort || { by: "name", order: "asc" });
    if (v.layout) setView(v.layout);
    setPage(1);
    setViewsOpen(false);
    pushToast(`Applied view “${v.name}”`);
  };

  const removeView = (v) => {
    setSavedViews((prev) => prev.filter((x) => x.id !== v.id));
    pushToast(`Removed view “${v.name}”`);
  };

  /* ---------------- columns ---------------- */
  const toggleColumn = (key) => {
    setColumns((prev) => {
      if (prev.includes(key)) return prev.length <= 1 ? prev : prev.filter((k) => k !== key);
      return COLUMNS.map((c) => c.key).filter((k) => k === key || prev.includes(k));
    });
  };

  /* ---------------- selection ---------------- */
  const toggleSelect = (s) =>
    setSelMap((prev) => {
      const next = new Map(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.set(s.id, s);
      return next;
    });

  const togglePage = () =>
    setSelMap((prev) => {
      const next = new Map(prev);
      if (pageAllSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.set(r.id, r));
      return next;
    });

  const clearSelection = () => setSelMap(new Map());

  /* ---------------- export ---------------- */
  const stamp = () => new Date().toISOString().slice(0, 10);

  const exportCurrent = () => {
    const list = mode === "client" ? processed : rows;
    if (list.length === 0) {
      pushToast("There are no students in this view to export.", true);
      return;
    }
    downloadCsv(`students-${deptBranch}-${stamp()}.csv`, list);
    pushToast(`Exported ${list.length} student${list.length === 1 ? "" : "s"} to CSV`);
    setExportOpen(false);
  };

  const exportSelected = () => {
    if (selList.length === 0) return;
    downloadCsv(`students-${deptBranch}-selected-${stamp()}.csv`, selList);
    pushToast(`Exported ${selList.length} selected student${selList.length === 1 ? "" : "s"}`);
    setExportOpen(false);
  };

  const exportAllMatching = async () => {
    setExporting(true);
    try {
      const res = await authApi.getStudentsDirectory(buildServerParams({ page: 1, limit: EXPORT_FETCH_LIMIT }));
      const list = (res?.students || []).map(normalizeStudent);
      if (list.length === 0) {
        pushToast("There are no students to export.", true);
      } else {
        downloadCsv(`students-${deptBranch}-all-${stamp()}.csv`, list);
        const total = res?.pagination?.total ?? res?.total ?? list.length;
        pushToast(
          total > list.length
            ? `Exported the first ${list.length} of ${total} students`
            : `Exported ${list.length} students`,
        );
      }
      setExportOpen(false);
    } catch (err) {
      pushToast(err?.message || "The export could not be completed.", true);
    } finally {
      setExporting(false);
    }
  };

  /* ---------------- drawer ---------------- */
  const openDrawer = (student, e) => {
    lastFocusRef.current = e?.currentTarget || document.activeElement || null;
    setDrawerTab("overview");
    setSelected(student);
  };
  const closeDrawer = () => {
    setSelected(null);
    lastFocusRef.current?.focus?.();
  };
  const stepDrawer = (dir) => {
    const next = rows[selIndex + dir];
    if (next) {
      setSelected(next);
      setCursor(selIndex + dir);
    }
  };

  /* ---------------- notes ---------------- */
  const addNote = (id, text) =>
    setNotesStore((prev) => ({
      ...prev,
      [id]: [{ id: `n${Date.now()}`, text, at: new Date().toISOString() }, ...(prev[id] || [])].slice(0, 30),
    }));
  const deleteNote = (id, noteId) =>
    setNotesStore((prev) => ({ ...prev, [id]: (prev[id] || []).filter((n) => n.id !== noteId) }));

  /* ---------------- delete (single) ---------------- */
  const askDelete = (student) => {
    setDeleteTarget(student);
    setConfirmText("");
    setDeleteError("");
  };

  const confirmKey = deleteTarget ? deleteTarget.roll || deleteTarget.name : "";
  const canConfirm = confirmText.trim().toLowerCase() === confirmKey.trim().toLowerCase() && confirmKey !== "";

  const dropFromState = (ids) => {
    const set = new Set(ids);
    setRaw((prev) => prev.filter((r) => !set.has(r.id)));
    setServerTotal((t) => (t === null ? t : Math.max(0, t - set.size)));
    setSelMap((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setRemovingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (mode === "server") setReloadKey((k) => k + 1); // re-sync pages and summary
  };

  const runDelete = async () => {
    if (!deleteTarget || !canConfirm || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await authApi.deleteStudent(deleteTarget.id);
      const gone = deleteTarget;
      setRemovingIds((prev) => new Set(prev).add(gone.id));
      setDeleteTarget(null);
      setSelected(null);
      showToast?.(`${gone.name} was removed from the directory.`);
      setTimeout(() => dropFromState([gone.id]), reducedMotion ? 0 : 380);
    } catch (err) {
      setDeleteError(err?.message || "The student could not be deleted. Nothing was changed.");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- delete (bulk) ---------------- */
  const openBulkDelete = () => setBulk({ open: true, text: "", running: false, done: 0, total: selList.length, error: "" });
  const closeBulkDelete = () => setBulk((b) => (b.running ? b : { ...b, open: false, text: "", error: "" }));

  const runBulkDelete = async () => {
    const targets = [...selMap.values()];
    if (targets.length === 0 || bulk.running) return;
    setBulk((b) => ({ ...b, running: true, done: 0, total: targets.length, error: "" }));
    const removed = [];
    const failed = [];
    for (const s of targets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await authApi.deleteStudent(s.id);
        removed.push(s.id);
      } catch {
        failed.push(s);
      }
      setBulk((b) => ({ ...b, done: b.done + 1 }));
    }
    setRemovingIds((prev) => {
      const next = new Set(prev);
      removed.forEach((id) => next.add(id));
      return next;
    });
    setTimeout(() => dropFromState(removed), reducedMotion ? 0 : 380);
    if (failed.length === 0) {
      setBulk({ open: false, text: "", running: false, done: 0, total: 0, error: "" });
      pushToast(`Removed ${removed.length} student${removed.length === 1 ? "" : "s"} from the directory`);
    } else {
      setBulk((b) => ({
        ...b,
        running: false,
        text: "",
        error: `${failed.length} student${failed.length === 1 ? "" : "s"} could not be deleted and ${failed.length === 1 ? "is" : "are"} still selected. ${removed.length} removed.`,
      }));
    }
  };

  /* ---------------- clipboard ---------------- */
  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast(`${label} copied`);
    } catch {
      pushToast("Couldn’t copy — your browser blocked clipboard access.", true);
    }
  };

  /* ---------------- context menu ---------------- */
  const openContext = (e, student) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, student });
  };

  const ctxItems = (s) => [
    { label: "Quick view", icon: Eye, run: () => openDrawer(s, null) },
    { label: "Open full profile", icon: GraduationCap, run: () => onSelectStudent?.(s.id) },
    "divider",
    { label: selMap.has(s.id) ? "Remove from selection" : "Add to selection", icon: Check, run: () => toggleSelect(s) },
    ...(s.email ? [{ label: "Copy email", icon: Mail, run: () => copyText(s.email, "Email") }] : []),
    ...(s.roll ? [{ label: "Copy roll number", icon: Hash, run: () => copyText(s.roll, "Roll number") }] : []),
    ...(canDelete ? ["divider", { label: "Delete student", icon: Trash2, danger: true, run: () => askDelete(s) }] : []),
  ];

  /* ---------------- keyboard shortcuts ---------------- */
  keyRef.current = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target;
    const tag = el?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;

    if (e.key === "?") {
      e.preventDefault();
      setShortcutsOpen((o) => !o);
      return;
    }
    if (selected || deleteTarget || bulk.open || compareOpen || shortcutsOpen) return;

    const list = rowsRef.current;
    switch (e.key) {
      case "/":
        e.preventDefault();
        searchRef.current?.focus();
        break;
      case "j":
        setCursor((c) => Math.min(list.length - 1, c + 1));
        break;
      case "k":
        setCursor((c) => Math.max(0, c - 1));
        break;
      case "Enter":
        if (cursor >= 0 && list[cursor] && tag !== "BUTTON" && tag !== "A") openDrawer(list[cursor], null);
        break;
      case "x":
        if (cursor >= 0 && list[cursor]) toggleSelect(list[cursor]);
        break;
      case "[":
        setPage((p) => Math.max(1, Math.min(p, totalPages) - 1));
        break;
      case "]":
        setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1));
        break;
      case "t":
        setView("table");
        break;
      case "g":
        setView("grid");
        break;
      case "d":
        setDensity((d) => (d === "compact" ? "comfortable" : "compact"));
        break;
      case "i":
        setInsightsOpen((o) => !o);
        break;
      case "e":
        exportCurrent();
        break;
      case "r":
        setReloadKey((k) => k + 1);
        break;
      default:
    }
  };

  useEffect(() => {
    const handler = (e) => keyRef.current?.(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Escape closes the top-most overlay. */
  useEffect(() => {
    const open = selected || deleteTarget || bulk.open || compareOpen || shortcutsOpen;
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (shortcutsOpen) setShortcutsOpen(false);
      else if (compareOpen) setCompareOpen(false);
      else if (bulk.open) closeBulkDelete();
      else if (deleteTarget && !deleting) setDeleteTarget(null);
      else if (selected) closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, deleteTarget, bulk.open, bulk.running, compareOpen, shortcutsOpen, deleting]);

  useFocusTrap(drawerRef, Boolean(selected) && !deleteTarget);

  useEffect(() => {
    if (selected) drawerCloseRef.current?.focus();
  }, [selected]);

  /* keep the row cursor valid and visible */
  useEffect(() => {
    setCursor(-1);
  }, [paramsKey, view, reloadKey]);

  useEffect(() => {
    if (cursor < 0) return;
    const row = rowsRef.current[cursor];
    if (!row) return;
    const node = document.querySelector(`[data-row-id="${String(row.id).replace(/"/g, '\\"')}"]`);
    node?.scrollIntoView?.({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [cursor, reducedMotion]);

  /* lock body scroll while a modal-like layer is open */
  useEffect(() => {
    const locked = selected || deleteTarget || bulk.open || compareOpen || shortcutsOpen;
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected, deleteTarget, bulk.open, compareOpen, shortcutsOpen]);

  /* leaving compare mode when fewer than two students remain */
  useEffect(() => {
    if (compareOpen && selList.length < 2) setCompareOpen(false);
  }, [compareOpen, selList.length]);

  /* ---------------- render helpers ---------------- */
  const renderCell = (key, s) => {
    switch (key) {
      case "roll":
        return s.roll ? (
          <span className="hod-std-code-wrap">
            <code className="hod-std-code">{s.roll}</code>
            <CopyButton text={s.roll} label="Roll number" onCopied={pushToast} />
          </span>
        ) : (
          <span className="hod-std-muted">Not recorded</span>
        );
      case "semester":
        return s.semesterLabel ? (
          <span className="hod-pill indigo">{s.semesterLabel}</span>
        ) : (
          <span className="hod-std-muted">Not recorded</span>
        );
      case "batch":
        return s.batch || <span className="hod-std-muted">Not recorded</span>;
      case "year":
        return s.year || <span className="hod-std-muted">Not recorded</span>;
      case "attendance":
        return <AttendanceCell value={s.attendance} />;
      case "performance":
        return <PerfCell student={s} />;
      case "backlogs":
        return <BacklogCell value={s.backlogs} />;
      case "risk":
        return <RiskPill level={s.riskLevel} />;
      case "status":
        return <StatusPill status={s.status} />;
      default:
        return null;
    }
  };

  const rowActions = (s) => (
    <div className="hod-std-actions">
      <button
        type="button"
        className="hod-std-icon-btn"
        onClick={(e) => openDrawer(s, e)}
        aria-label={`Quick view ${s.name}`}
        title="Quick view"
      >
        <Eye size={15} />
      </button>
      <button type="button" className="hod-btn-secondary hod-std-open" onClick={() => onSelectStudent?.(s.id)}>
        <span>View profile</span>
      </button>
      <button
        type="button"
        className="hod-std-icon-btn"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setCtx({ x: r.left, y: r.bottom + 4, student: s });
        }}
        aria-label={`More actions for ${s.name}`}
        aria-haspopup="menu"
        title="More actions"
      >
        <MoreHorizontal size={15} />
      </button>
    </div>
  );

  const rowClass = (s, i) =>
    [
      removingIds.has(s.id) ? "removing" : "",
      selMap.has(s.id) ? "is-selected" : "",
      cursor === i ? "kbd-focus" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const showSkeleton = loading && rows.length === 0 && !error;
  const pageSizeOptions = PAGE_SIZES.includes(pageSize) ? PAGE_SIZES : [...PAGE_SIZES, pageSize].sort((a, b) => a - b);
  const compareDisabled = selList.length < 2 || selList.length > MAX_COMPARE;
  const drawerNotes = selected ? notesStore[selected.id] || [] : [];

  return (
    <div className={`hod-role-view hod-std-container ${density === "compact" ? "dens-compact" : ""}`}>
      {/* Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <GraduationCap size={24} color="var(--hod-primary)" />
            Student Directory · {deptBranch}
          </h2>
          <p>Review enrolled students, check attendance and results, and manage records for your department.</p>
        </div>
        <div className="hod-std-header-actions">
          {lastUpdated && (
            <span className="hod-std-updated" title={lastUpdated.toLocaleString()}>
              <Clock size={13} aria-hidden="true" /> Updated {timeAgo(lastUpdated)}
            </span>
          )}

          <div className="hod-std-menu-anchor">
            <button
              type="button"
              className="hod-btn-secondary hod-std-refresh"
              onClick={() => {
                setExportOpen((o) => !o);
                setColsOpen(false);
                setViewsOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              disabled={exporting}
            >
              {exporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
              <span>Export</span>
              <ChevronDown size={13} className={`hod-std-caret ${exportOpen ? "up" : ""}`} />
            </button>
            <Popover open={exportOpen} onClose={() => setExportOpen(false)} label="Export options">
              <div className="hod-std-pop-title">Export as CSV</div>
              <button type="button" role="menuitem" onClick={exportCurrent}>
                <List size={15} aria-hidden="true" />
                <span>
                  <strong>{mode === "client" ? "All matching students" : "This page"}</strong>
                  <small>
                    {mode === "client" ? processed.length : rows.length} row
                    {(mode === "client" ? processed.length : rows.length) === 1 ? "" : "s"} in the current view
                  </small>
                </span>
              </button>
              {mode === "server" && (
                <button type="button" role="menuitem" onClick={exportAllMatching}>
                  <Users size={15} aria-hidden="true" />
                  <span>
                    <strong>All matching students</strong>
                    <small>Up to {EXPORT_FETCH_LIMIT.toLocaleString()} rows with current filters</small>
                  </span>
                </button>
              )}
              <button type="button" role="menuitem" onClick={exportSelected} disabled={selList.length === 0}>
                <Check size={15} aria-hidden="true" />
                <span>
                  <strong>Selected students</strong>
                  <small>{selList.length === 0 ? "Select rows first" : `${selList.length} selected`}</small>
                </span>
              </button>
            </Popover>
          </div>

          <button
            type="button"
            className="hod-std-icon-btn lg"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={16} />
          </button>

          <button
            type="button"
            className="hod-btn-secondary hod-std-refresh"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <section className="hod-std-kpis" aria-label="Directory summary">
        <KpiCard
          icon={Users}
          label="Total students"
          value={kpis.total}
          hint={`Enrolled in ${deptBranch}`}
          tone="indigo"
          delay={0}
        />
        <KpiCard
          icon={UserCheck}
          label="Active students"
          value={kpis.active}
          hint={`Currently enrolled ${kpiScope}`}
          tone="emerald"
          delay={70}
          onClick={kpis.active === null ? undefined : () => toggleQuick(QUICK_FILTERS[3])}
          active={quickActive(QUICK_FILTERS[3])}
        />
        <KpiCard
          icon={TrendingDown}
          label={`Attendance below ${LOW_ATTENDANCE}%`}
          value={kpis.low}
          hint={`Need follow-up ${kpiScope}`}
          tone="rose"
          delay={140}
          onClick={kpis.low === null ? undefined : () => toggleQuick(QUICK_FILTERS[0])}
          active={quickActive(QUICK_FILTERS[0])}
        />
        <KpiCard
          icon={BookX}
          label="With backlogs"
          value={kpis.backlogs}
          hint={`Active backlogs ${kpiScope}`}
          tone="amber"
          delay={210}
          onClick={kpis.backlogs === null ? undefined : () => toggleQuick(QUICK_FILTERS[1])}
          active={quickActive(QUICK_FILTERS[1])}
        />
      </section>

      {/* Insights */}
      <InsightsPanel
        students={mode === "client" ? processed : raw}
        scope={insightScope}
        open={insightsOpen}
        onToggle={() => setInsightsOpen((o) => !o)}
        onPickStudent={openDrawer}
        onPickBucket={pickAttendanceBucket}
        activeBucket={attendance}
      />

      {/* Controls */}
      <div className="hod-std-toolbar">
        <div className="hod-std-controls">
          <div className="hod-search-wrap hod-std-search">
            <Search size={16} className="hod-search-icon" />
            <input
              ref={searchRef}
              type="search"
              className="hod-input"
              style={{ paddingLeft: 38, paddingRight: 44 }}
              placeholder="Search by name, roll number or email"
              aria-label="Search students"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <kbd className="hod-std-search-key" aria-hidden="true">/</kbd>
          </div>

          <div className="hod-std-menu-anchor">
            <button
              type="button"
              className={`hod-std-tool-btn ${savedViews.length ? "has" : ""}`}
              onClick={() => {
                setViewsOpen((o) => !o);
                setColsOpen(false);
                setExportOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={viewsOpen}
              title="Saved views"
            >
              <Bookmark size={16} />
              <span className="hod-std-tool-label">Views</span>
              {savedViews.length > 0 && <b>{savedViews.length}</b>}
            </button>
            <Popover open={viewsOpen} onClose={() => setViewsOpen(false)} label="Saved views" align="right">
              <div className="hod-std-pop-title">Saved views</div>
              {savedViews.length === 0 ? (
                <p className="hod-std-pop-empty">Save your current filters to reuse them in one click.</p>
              ) : (
                <ul className="hod-std-views">
                  {savedViews.map((v) => (
                    <li key={v.id}>
                      <button type="button" role="menuitem" onClick={() => applyView(v)}>
                        <Bookmark size={14} aria-hidden="true" />
                        <span>{v.name}</span>
                      </button>
                      <button
                        type="button"
                        className="hod-std-view-del"
                        onClick={() => removeView(v)}
                        aria-label={`Delete view ${v.name}`}
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="hod-std-pop-save">
                <input
                  className="hod-input"
                  value={viewName}
                  maxLength={28}
                  placeholder="Name this view"
                  aria-label="View name"
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCurrentView()}
                />
                <button type="button" className="hod-btn-primary" onClick={saveCurrentView} disabled={!viewName.trim()}>
                  <BookmarkPlus size={14} /> Save
                </button>
              </div>
            </Popover>
          </div>

          <div className="hod-std-menu-anchor">
            <button
              type="button"
              className="hod-std-tool-btn"
              onClick={() => {
                setColsOpen((o) => !o);
                setViewsOpen(false);
                setExportOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={colsOpen}
              title="Choose columns"
              disabled={view !== "table"}
            >
              <SlidersHorizontal size={16} />
              <span className="hod-std-tool-label">Columns</span>
            </button>
            <Popover open={colsOpen} onClose={() => setColsOpen(false)} label="Visible columns" align="right">
              <div className="hod-std-pop-title">Visible columns</div>
              <ul className="hod-std-cols">
                {COLUMNS.map((c) => (
                  <li key={c.key}>
                    <label>
                      <Checkbox
                        checked={columns.includes(c.key)}
                        onChange={() => toggleColumn(c.key)}
                        label={`Show ${c.label}`}
                      />
                      <span>{c.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <button type="button" className="hod-std-link pad" onClick={() => setColumns(DEFAULT_COLUMNS)}>
                Reset to default
              </button>
            </Popover>
          </div>

          <button
            type="button"
            className={`hod-std-tool-btn icon ${density === "compact" ? "on" : ""}`}
            onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
            aria-pressed={density === "compact"}
            title="Compact rows (d)"
            aria-label="Compact rows"
          >
            <AlignJustify size={16} />
          </button>

          <div className="hod-std-view-toggle" role="group" aria-label="Layout">
            <button
              type="button"
              className={view === "table" ? "on" : ""}
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              title="Table view (t)"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={view === "grid" ? "on" : ""}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              title="Card view (g)"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        <div className="hod-std-filters">
          <Filter size={15} color="var(--hod-text-muted)" aria-hidden="true" />
          <select className="hod-select" aria-label="Semester" value={semester} onChange={setFilter(setSemester)}>
            <option value="all">All semesters</option>
            {SEMESTERS.map((n) => (
              <option key={n} value={`Semester ${n}`}>
                Semester {n}
              </option>
            ))}
          </select>
          <select
            className="hod-select"
            aria-label="Batch"
            value={batch}
            onChange={setFilter(setBatch)}
            disabled={batchOptions.length === 0}
          >
            <option value="all">All batches</option>
            {batchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className="hod-select"
            aria-label="Status"
            value={status}
            onChange={setFilter(setStatus)}
            disabled={statusOptions.length === 0}
          >
            <option value="all">Any status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {cap(s)}
              </option>
            ))}
          </select>
          <select
            className="hod-select"
            aria-label="Attendance"
            value={attendance}
            onChange={setFilter(setAttendance)}
            disabled={!hasAttendance && mode !== "server"}
          >
            <option value="all">Any attendance</option>
            <option value="low">Below {LOW_ATTENDANCE}%</option>
            <option value="ok">{LOW_ATTENDANCE}% and above</option>
            <option value="none">Not recorded</option>
          </select>
          <select
            className="hod-select"
            aria-label="Academic performance"
            value={performance}
            onChange={setFilter(setPerformance)}
            disabled={!hasPerformance && mode !== "server"}
          >
            <option value="all">Any performance</option>
            <option value="high">Strong (8.0+)</option>
            <option value="mid">Average (6.0–7.9)</option>
            <option value="low">Needs support (below 6.0)</option>
          </select>
          <select
            className="hod-select"
            aria-label="Backlogs"
            value={backlog}
            onChange={setFilter(setBacklog)}
            disabled={!hasBacklogs && mode !== "server"}
          >
            <option value="all">Any backlog state</option>
            <option value="yes">Has backlogs</option>
            <option value="no">No backlogs</option>
          </select>
          {filtersActive && (
            <button type="button" className="hod-std-clear" onClick={clearFilters}>
              <FilterX size={14} /> Clear filters
              <b>{activeFilterCount}</b>
            </button>
          )}
        </div>

        <div className="hod-std-chips" role="group" aria-label="Quick filters">
          {QUICK_FILTERS.map((qf) => {
            const on = quickActive(qf);
            return (
              <button
                key={qf.id}
                type="button"
                className={`hod-std-qchip ${qf.tone} ${on ? "on" : ""}`}
                onClick={() => toggleQuick(qf)}
                aria-pressed={on}
              >
                <qf.icon size={13} aria-hidden="true" />
                {qf.label}
                {on && <X size={12} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory */}
      <div className="hod-card hod-std-card">
        <div className="hod-std-table-header">
          <div>
            <h3 className="hod-std-title">Registered students</h3>
            <p className="hod-std-sub" aria-live="polite">
              {loading
                ? "Loading students…"
                : totalCount === 0
                  ? "No students to show"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalCount.toLocaleString()} students`}
              {mode === "client" && raw.length >= CLIENT_FETCH_LIMIT ? ` (first ${CLIENT_FETCH_LIMIT} records)` : ""}
            </p>
          </div>
          <div className="hod-std-header-right">
            {view === "grid" && rows.length > 0 && (
              <label className="hod-std-selectall">
                <Checkbox
                  checked={pageAllSelected}
                  indeterminate={pageSomeSelected}
                  onChange={togglePage}
                  label="Select all students on this page"
                />
                <span>Select page</span>
              </label>
            )}
            <label className="hod-std-pagesize">
              <span>Rows</span>
              <select
                className="hod-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error ? (
          <div className="hod-std-state error" role="alert">
            <div className="hod-std-state-icon">
              <AlertTriangle size={26} />
            </div>
            <h3>We couldn’t load your students</h3>
            <p>{error}</p>
            <button type="button" className="hod-btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : showSkeleton ? (
          <SkeletonRows view={view} />
        ) : rows.length === 0 ? (
          <div className="hod-std-state">
            <div className="hod-std-state-icon">
              {filtersActive ? <SearchX size={26} /> : <GraduationCap size={26} />}
            </div>
            <h3>{filtersActive ? "No students match these filters" : "No students in this department yet"}</h3>
            <p>
              {filtersActive
                ? "Try a different search or clear the filters to see everyone."
                : `Students registered under ${deptBranch} will appear here.`}
            </p>
            {filtersActive && (
              <button type="button" className="hod-btn-secondary" onClick={clearFilters}>
                <FilterX size={14} /> Clear filters
              </button>
            )}
          </div>
        ) : view === "table" ? (
          <div className={`hod-table-wrap hod-std-table-wrap ${loading ? "is-busy" : ""}`}>
            <table className="hod-table hod-std-table">
              <thead>
                <tr>
                  <th scope="col" className="hod-std-th-check">
                    <Checkbox
                      checked={pageAllSelected}
                      indeterminate={pageSomeSelected}
                      onChange={togglePage}
                      label="Select all students on this page"
                    />
                  </th>
                  <SortHead label="Student" field="name" sort={sort} onSort={toggleSort} />
                  {visibleColumns.map((c) =>
                    c.sortField ? (
                      <SortHead key={c.key} label={c.label} field={c.sortField} sort={sort} onSort={toggleSort} />
                    ) : (
                      <th key={c.key} scope="col">
                        {c.label}
                      </th>
                    ),
                  )}
                  <th scope="col" style={{ textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr
                    key={s.id}
                    data-row-id={s.id}
                    className={rowClass(s, i)}
                    style={{ "--i": i }}
                    onContextMenu={(e) => openContext(e, s)}
                    onClick={(e) => {
                      if (!e.target.closest("button, input, a, label, .hod-std-chk")) {
                        openDrawer(s, e);
                      }
                    }}
                    onDoubleClick={() => openDrawer(s, null)}
                  >
                    <td data-label="Select" className="hod-std-td-check">
                      <Checkbox
                        checked={selMap.has(s.id)}
                        onChange={() => toggleSelect(s)}
                        label={`Select ${s.name}`}
                      />
                    </td>
                    <td data-label="Student">
                      <div className="hod-std-person">
                        <Avatar student={s} />
                        <div>
                          <strong>{s.name}</strong>
                          {s.email && <div className="hod-std-email">{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    {visibleColumns.map((c) => (
                      <td key={c.key} data-label={c.label}>
                        {renderCell(c.key, s)}
                      </td>
                    ))}
                    <td data-label="Actions" style={{ textAlign: "right" }}>
                      {rowActions(s)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`hod-std-grid ${loading ? "is-busy" : ""}`}>
            {rows.map((s, i) => (
              <article
                key={s.id}
                data-row-id={s.id}
                className={`hod-std-gcard ${rowClass(s, i)}`}
                style={{ "--i": i }}
                onContextMenu={(e) => openContext(e, s)}
                onClick={(e) => {
                  if (!e.target.closest("button, input, a, label, .hod-std-chk")) {
                    openDrawer(s, e);
                  }
                }}
              >
                <header>
                  <div className="hod-std-gcard-lead">
                    <Checkbox
                      checked={selMap.has(s.id)}
                      onChange={() => toggleSelect(s)}
                      label={`Select ${s.name}`}
                    />
                    <Avatar student={s} size="lg" />
                  </div>
                  <StatusPill status={s.status} />
                </header>
                <h4>{s.name}</h4>
                <p className="hod-std-email">{s.email || "No email on record"}</p>
                <div className="hod-std-gcard-risk">
                  <RiskPill level={s.riskLevel} />
                </div>
                <dl>
                  <div>
                    <dt>Roll no.</dt>
                    <dd>{s.roll || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Semester</dt>
                    <dd>{s.semesterLabel || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Batch</dt>
                    <dd>{s.batch || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Attendance</dt>
                    <dd>
                      <AttendanceCell value={s.attendance} />
                    </dd>
                  </div>
                  <div>
                    <dt>Performance</dt>
                    <dd>
                      <PerfCell student={s} />
                    </dd>
                  </div>
                  <div>
                    <dt>Backlogs</dt>
                    <dd>
                      <BacklogCell value={s.backlogs} />
                    </dd>
                  </div>
                </dl>
                {rowActions(s)}
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!error && totalCount > 0 && totalPages > 1 && (
          <nav className="hod-std-pager" aria-label="Pagination">
            <button
              type="button"
              className="hod-std-page-btn"
              disabled={safePage === 1 || loading}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {pageWindow(safePage, totalPages).map((p) =>
              typeof p === "string" ? (
                <span key={p} className="hod-std-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`hod-std-page-btn ${p === safePage ? "on" : ""}`}
                  aria-current={p === safePage ? "page" : undefined}
                  disabled={loading}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              className="hod-std-page-btn"
              disabled={safePage === totalPages || loading}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>

      {/* Floating bulk-action bar */}
      {selList.length > 0 && (
        <div className="hod-std-bulkbar" role="toolbar" aria-label="Actions for selected students">
          <span className="hod-std-bulk-count">
            <b>{selList.length}</b> selected
          </span>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            disabled={compareDisabled}
            title={compareDisabled ? `Select 2 to ${MAX_COMPARE} students to compare` : "Compare selected students"}
          >
            <GitCompare size={14} /> Compare
          </button>
          <button type="button" onClick={exportSelected}>
            <Download size={14} /> Export
          </button>
          {canDelete && (
            <button type="button" className="danger" onClick={openBulkDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button type="button" className="hod-std-bulk-x" onClick={clearSelection} aria-label="Clear selection">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Quick-view drawer */}
      {selected && (
        <div className="hod-std-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeDrawer()}>
          <aside
            ref={drawerRef}
            className="hod-std-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hod-std-drawer-title"
          >
            <div className="hod-std-drawer-bar">
              <div className="hod-std-stepper" aria-label="Browse students">
                <button
                  type="button"
                  className="hod-std-icon-btn"
                  onClick={() => stepDrawer(-1)}
                  disabled={selIndex <= 0}
                  aria-label="Previous student"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  className="hod-std-icon-btn"
                  onClick={() => stepDrawer(1)}
                  disabled={selIndex < 0 || selIndex >= rows.length - 1}
                  aria-label="Next student"
                >
                  <ChevronDown size={15} />
                </button>
                {selIndex >= 0 && (
                  <span>
                    {selIndex + 1} of {rows.length}
                  </span>
                )}
              </div>
              <button
                ref={drawerCloseRef}
                type="button"
                className="hod-std-drawer-close"
                onClick={closeDrawer}
                aria-label="Close student details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="hod-std-drawer-head" key={selected.id}>
              <Avatar student={selected} size="xl" />
              <div>
                <h3 id="hod-std-drawer-title">{selected.name}</h3>
                {selected.email && (
                  <p className="hod-std-email">
                    <Mail size={13} /> {selected.email}
                    <CopyButton text={selected.email} label="Email" onCopied={pushToast} />
                  </p>
                )}
                <div className="hod-std-drawer-pills">
                  <StatusPill status={selected.status} />
                  <RiskPill level={selected.riskLevel} />
                </div>
              </div>
            </div>

            <div className="hod-std-tabs" role="tablist" aria-label="Student sections">
              {[
                ["overview", "Overview", Info],
                ["academics", "Academics", Activity],
                ["notes", `Notes${drawerNotes.length ? ` (${drawerNotes.length})` : ""}`, StickyNote],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`hod-std-tab-${id}`}
                  aria-selected={drawerTab === id}
                  aria-controls={`hod-std-panel-${id}`}
                  className={drawerTab === id ? "on" : ""}
                  onClick={() => setDrawerTab(id)}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            <div
              className="hod-std-tabpanel"
              role="tabpanel"
              id={`hod-std-panel-${drawerTab}`}
              aria-labelledby={`hod-std-tab-${drawerTab}`}
              key={`${selected.id}-${drawerTab}`}
            >
              {drawerTab === "overview" && (
                <>
                  <div className="hod-std-drawer-stats">
                    <div className={`hod-std-stat ${attendanceTone(selected.attendance)}`}>
                      <span>Attendance</span>
                      <strong>{selected.attendance === null ? "—" : `${selected.attendance}%`}</strong>
                      {selected.attendance !== null && (
                        <div className="hod-std-meter-track">
                          <div
                            className={`hod-std-meter-fill ${attendanceTone(selected.attendance)}`}
                            style={{ "--fill": `${Math.min(selected.attendance, 100)}%` }}
                          />
                        </div>
                      )}
                      {selected.attendance === null && <small>Not recorded</small>}
                    </div>
                    <div className={`hod-std-stat ${perfTone(selected.perf10)}`}>
                      <span>Performance</span>
                      <strong>{selected.performance === null ? "—" : selected.performance}</strong>
                      {selected.performance === null && <small>Not recorded</small>}
                    </div>
                    <div
                      className={`hod-std-stat ${selected.backlogs ? "rose" : selected.backlogs === 0 ? "emerald" : "muted"}`}
                    >
                      <span>Backlogs</span>
                      <strong>{selected.backlogs === null ? "—" : selected.backlogs}</strong>
                      {selected.backlogs === null && <small>Not recorded</small>}
                    </div>
                  </div>

                  <dl className="hod-std-drawer-list">
                    <div>
                      <dt>Roll / Enrollment</dt>
                      <dd>
                        {selected.roll || "Not recorded"}
                        <CopyButton text={selected.roll} label="Roll number" onCopied={pushToast} />
                      </dd>
                    </div>
                    <div>
                      <dt>Semester</dt>
                      <dd>{selected.semesterLabel || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt>Batch</dt>
                      <dd>{selected.batch || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt>Academic year</dt>
                      <dd>{selected.year || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt>Department</dt>
                      <dd>{deptBranch}</dd>
                    </div>
                  </dl>
                </>
              )}

              {drawerTab === "academics" && (
                <>
                  <div className="hod-std-rings">
                    <div>
                      <Ring
                        value={selected.attendance}
                        tone={attendanceTone(selected.attendance)}
                        label={`Attendance ${selected.attendance ?? "not recorded"}`}
                      />
                      <span>Attendance</span>
                    </div>
                    <div>
                      <Ring
                        value={selected.perf10 === null ? null : selected.perf10 * 10}
                        tone={perfTone(selected.perf10)}
                        label={`Performance ${selected.performance ?? "not recorded"}`}
                      />
                      <span>Performance{selected.performance !== null ? ` · ${selected.performance}` : ""}</span>
                    </div>
                  </div>

                  <div className={`hod-std-assess ${riskTone(selected.riskLevel)}`}>
                    <div className="hod-std-assess-head">
                      <RiskPill level={selected.riskLevel} />
                      <strong>
                        {selected.riskLevel === "ok"
                          ? "No open flags"
                          : selected.riskLevel === "nodata"
                            ? "Not enough data to assess"
                            : `${selected.riskScore} open flag${selected.riskScore === 1 ? "" : "s"}`}
                      </strong>
                    </div>
                    {selected.riskFlags.length > 0 ? (
                      <ul>
                        {selected.riskFlags.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        {selected.riskLevel === "ok"
                          ? "Attendance, results and backlogs are all within healthy limits."
                          : "Attendance, results and backlog data are missing from this record."}
                      </p>
                    )}
                  </div>
                </>
              )}

              {drawerTab === "notes" && (
                <NotesTab student={selected} notes={drawerNotes} onAdd={addNote} onDelete={deleteNote} />
              )}
            </div>

            <p className="hod-std-note">Full results, transcripts and attendance history are in the complete profile.</p>

            <div className="hod-std-drawer-foot">
              <button type="button" className="hod-btn-primary" onClick={() => onSelectStudent?.(selected.id)}>
                <Eye size={14} /> Open full profile
              </button>
              {canDelete && (
                <button type="button" className="hod-std-danger-btn" onClick={() => askDelete(selected)}>
                  <Trash2 size={14} /> Delete student
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="hod-std-overlay center"
          onMouseDown={(e) => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}
        >
          <div
            className="hod-std-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="hod-std-del-title"
            aria-describedby="hod-std-del-desc"
          >
            <div className="hod-std-modal-icon">
              <Trash2 size={22} />
            </div>
            <h3 id="hod-std-del-title">Delete {deleteTarget.name}?</h3>
            <p id="hod-std-del-desc">
              This removes the student from the {deptBranch} directory. This action can’t be undone from this page.
            </p>
            <label className="hod-std-confirm">
              <span>
                Type <code>{confirmKey}</code> to confirm
              </span>
              <input
                className="hod-input"
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runDelete()}
                disabled={deleting}
                autoComplete="off"
              />
            </label>
            {deleteError && (
              <div className="hod-std-inline-error" role="alert">
                {deleteError}
              </div>
            )}
            <div className="hod-std-modal-foot">
              <button type="button" className="hod-btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="hod-std-danger-btn solid" onClick={runDelete} disabled={!canConfirm || deleting}>
                {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting…" : "Delete student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete */}
      {bulk.open && (
        <BulkDeleteModal
          students={selList}
          state={bulk}
          onChange={(patch) => setBulk((b) => ({ ...b, ...patch }))}
          onCancel={closeBulkDelete}
          onRun={runBulkDelete}
        />
      )}

      {/* Compare */}
      {compareOpen && selList.length >= 2 && (
        <CompareModal
          students={selList.slice(0, MAX_COMPARE)}
          onClose={() => setCompareOpen(false)}
          onRemove={toggleSelect}
          onOpen={(s) => {
            setCompareOpen(false);
            onSelectStudent?.(s.id);
          }}
        />
      )}

      {/* Shortcuts */}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {/* Context menu */}
      {ctx && <ContextMenu menu={ctx} items={ctxItems(ctx.student)} onClose={() => setCtx(null)} />}

      {/* Toasts */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}