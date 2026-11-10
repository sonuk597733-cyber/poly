import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ArrowLeft, GraduationCap, BookOpen, Calendar, User2,
  Mail, Phone, CalendarCheck2, Award, FileText,
  AlertTriangle, Loader2, RefreshCw, CheckCircle2, XCircle, Clock,
  Copy, Check, Download, Printer, Share2, Search, X, TrendingUp,
  Trophy, BarChart3, LayoutDashboard, ArrowUpDown, Target,
  ArrowUp, Flame, Medal, ShieldCheck, LayoutGrid, List, Sparkles,
  ChevronDown, Star, RotateCw, BadgeCheck, Fingerprint
} from "lucide-react";
import { authApi } from "../services/authApi";
import "./StudentPublicProfile.css";

/* ======================================================
   Helpers
   ====================================================== */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const GRADE_POINTS = { "A+": 10, A: 9, "B+": 8, B: 7, C: 6, P: 5, F: 0 };
const GRADE_ORDER = ["A+", "A", "B+", "B", "C", "P", "F"];
const TARGET_ATTENDANCE = 75;
const PASS_MARK = 40;
const PAGE_SIZE = 10;

const clampPct = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const toneFor = (pct, good = 75, warn = 60) => (pct >= good ? "good" : pct >= warn ? "warn" : "poor");
const presentLike = (s) => s === "present" || s === "late";

const markPct = (m) =>
  m && Number(m.maxMarks) > 0 ? (Number(m.marksObtained) / Number(m.maxMarks)) * 100 : 0;

const fmtDate = (d, opts = { day: "numeric", month: "short", year: "2-digit" }) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", opts);
};

const dayKey = (d) => {
  const x = new Date(d);
  return isNaN(x.getTime()) ? null : x.toISOString().slice(0, 10);
};

const timeAgo = (ts) => {
  if (!ts) return "";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} hr ago`;
};

const standingFor = (avg) => {
  if (avg >= 75) return { label: "Distinction", tone: "good" };
  if (avg >= 60) return { label: "First Class", tone: "good" };
  if (avg >= 50) return { label: "Second Class", tone: "warn" };
  if (avg >= PASS_MARK) return { label: "Pass Class", tone: "warn" };
  return { label: "Needs Support", tone: "poor" };
};

const leaveDays = (l) => {
  const a = new Date(l.startDate);
  const b = new Date(l.endDate);
  if (isNaN(a) || isNaN(b)) return null;
  return Math.max(1, Math.round((b - a) / 864e5) + 1);
};

/** Consecutive lectures that must be attended to reach the target % */
const lecturesNeededForTarget = (attended, total, target = TARGET_ATTENDANCE) => {
  if (!total) return 0;
  const t = target / 100;
  if (attended / total >= t) return 0;
  return Math.ceil((t * total - attended) / (1 - t));
};

/** Lectures that can still be skipped while staying at/above the target % */
const lecturesCanSkip = (attended, total, target = TARGET_ATTENDANCE) => {
  if (!total) return 0;
  const t = target / 100;
  if (attended / total < t) return 0;
  return Math.max(0, Math.floor(attended / t - total));
};

const toCsv = (rows) =>
  rows
    .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

const downloadFile = (filename, content, type = "text/csv;charset=utf-8;") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through to legacy path */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

const readPref = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (_) {
    return fallback;
  }
};

const writePref = (key, value) => {
  try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }
};

/** Deterministic pseudo-random generator so the card art is stable per student */
const makeRng = (seedText) => {
  let h = 2166136261;
  const str = String(seedText || "collegeos");
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

/* ======================================================
   Hooks
   ====================================================== */

/** Animates a number from 0 to target */
function useCountUp(target, { duration = 1100, active = true, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const end = Number(target);
    if (!isFinite(end)) { setValue(0); return undefined; }
    if (prefersReducedMotion()) { setValue(end); return undefined; }

    let raf;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(end * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);

  return decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
}

/** True once the element has entered the viewport (one-shot) */
function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, options);
    obs.observe(node);
    return () => obs.disconnect();
    // eslint-disable-next-line
  }, []);

  return [ref, inView];
}

/** Works with any scroll container: true once the sentinel has scrolled above the viewport */
function useScrolledPast() {
  const [node, setNode] = useState(null);
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const obs = new IntersectionObserver(
      ([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [node]);

  return [past, setNode];
}

/** Small toast manager */
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, tone = "success") => {
    clearTimeout(timer.current);
    setToast({ message, tone, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, show, close];
}

/* ======================================================
   Small presentational components
   ====================================================== */

function AttendanceBadge({ percentage }) {
  const color = percentage >= 75 ? "good" : percentage >= 60 ? "warn" : "poor";
  return (
    <span className={`att-badge att-${color}`}>
      {percentage !== null && percentage !== undefined ? `${percentage}%` : "N/A"}
    </span>
  );
}

function GradeBadge({ grade }) {
  const map = {
    "A+": "grade-a-plus", A: "grade-a", "B+": "grade-b-plus",
    B: "grade-b", C: "grade-c", P: "grade-p", F: "grade-f"
  };
  return <span className={`grade-badge ${map[grade] || ""}`}>{grade || "N/A"}</span>;
}

function AttendanceStatusDot({ status }) {
  const map = {
    present: { cls: "dot-present", label: "Present" },
    absent: { cls: "dot-absent", label: "Absent" },
    late: { cls: "dot-late", label: "Late" },
    excused: { cls: "dot-excused", label: "Excused" }
  };
  const info = map[status] || { cls: "", label: status };
  return <span className={`status-dot ${info.cls}`} title={info.label} />;
}

/** Scroll-reveal wrapper */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "reveal-in" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Animated number */
function CountUp({ value, suffix = "", decimals = 0, active = true }) {
  const n = useCountUp(value, { active, decimals });
  return <>{n}{suffix}</>;
}

/** Animated circular progress */
function ProgressRing({ value, size = 120, stroke = 10, label, tone = "good" }) {
  const [ready, setReady] = useState(false);
  const safe = clampPct(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (ready ? safe : 0) / 100);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`ring ring-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <strong><CountUp value={safe} suffix="%" /></strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

/** Decorative QR-style pattern, generated from the enrollment number (not a scannable code) */
function QrArt({ seed, size = 25 }) {
  const path = useMemo(() => {
    const rnd = makeRng(`qr-${seed}`);
    const cells = [];
    const inFinder = (x, y) =>
      (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (inFinder(x, y)) continue;
        if (rnd() > 0.5) cells.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    const finder = (ox, oy) =>
      `M${ox} ${oy}h7v7h-7z M${ox + 1} ${oy + 1}v5h5v-5z M${ox + 2} ${oy + 2}h3v3h-3z`;
    return `${cells.join("")}${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}`;
  }, [seed, size]);

  return (
    <svg className="idc-qr-svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" shapeRendering="crispEdges">
      <path d={path} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** Decorative barcode, generated from the enrollment number */
function BarcodeArt({ seed, bars = 46 }) {
  const rects = useMemo(() => {
    const rnd = makeRng(`bar-${seed}`);
    let x = 0;
    const out = [];
    for (let i = 0; i < bars; i += 1) {
      const w = 1 + Math.floor(rnd() * 3);
      if (i % 2 === 0) out.push({ x, w });
      x += w + (rnd() > 0.55 ? 1 : 0.6);
    }
    return { out, width: x };
  }, [seed, bars]);

  return (
    <svg className="idc-barcode-svg" viewBox={`0 0 ${rects.width} 10`} preserveAspectRatio="none" aria-hidden="true">
      {rects.out.map((r, i) => <rect key={i} x={r.x} y="0" width={r.w} height="10" fill="currentColor" />)}
    </svg>
  );
}

/** Loading skeleton that mirrors the real layout */
function ProfileSkeleton() {
  return (
    <div className="spp-page" aria-busy="true" aria-live="polite">
      <div className="sk sk-btn" />
      <div className="spp-idwrap">
        <div className="spp-idcol">
          <div className="sk sk-idcard" />
        </div>
        <div className="spp-idside">
          <div className="sk sk-line w60" />
          <div className="sk-row">
            <div className="sk sk-pill" />
            <div className="sk sk-pill" />
            <div className="sk sk-pill" />
          </div>
        </div>
      </div>
      <div className="spp-body">
        <aside className="spp-sidebar">
          <div className="spp-card"><div className="sk sk-line w60" /><div className="sk sk-line" /><div className="sk sk-line w80" /></div>
          <div className="spp-card"><div className="sk sk-line w50" /><div className="sk sk-line" /></div>
        </aside>
        <main className="spp-main">
          <div className="sk sk-tabs" />
          <div className="spp-card">
            <div className="sk sk-line w40" />
            <div className="sk-grid">
              <div className="sk sk-box" /><div className="sk sk-box" />
              <div className="sk sk-box" /><div className="sk sk-box" />
            </div>
          </div>
          <div className="spp-card"><div className="sk sk-line w50" /><div className="sk sk-line" /><div className="sk sk-line" /><div className="sk sk-line w80" /></div>
        </main>
      </div>
    </div>
  );
}

/** Accessible confirmation dialog (replaces window.confirm) */
function ConfirmModal({ open, title, message, confirmLabel, tone = "danger", busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="spp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="spp-modal" role="alertdialog" aria-modal="true" aria-labelledby="spp-modal-title" aria-describedby="spp-modal-msg">
        <div className={`spp-modal-icon ${tone}`}>
          {tone === "danger" ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
        </div>
        <h3 id="spp-modal-title">{title}</h3>
        <p id="spp-modal-msg">{message}</p>
        <div className="spp-modal-actions">
          <button type="button" ref={cancelRef} className="spp-modal-btn ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`spp-modal-btn ${tone}`} onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`spp-toast ${toast.tone}`} role="status" aria-live="polite" key={toast.id}>
      {toast.tone === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

/** Small icon button that copies a value and flashes a tick */
function CopyChip({ text, label, onCopied }) {
  const [done, setDone] = useState(false);
  const run = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyText(text);
    onCopied(ok, label);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    }
  };
  return (
    <button type="button" className={`spp-mini-copy ${done ? "done" : ""}`} onClick={run} aria-label={`Copy ${label}`}>
      {done ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

/* ======================================================
   Main component
   ====================================================== */

export default function StudentPublicProfile({ studentId, onBack }) {
  const currentUser = authApi.getCurrentUser();
  const callerRole = currentUser?.role || "student";
  const isSelf = currentUser?.id === studentId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoaded, setLastLoaded] = useState(null);
  const [, setTick] = useState(0);

  const [activeTab, setActiveTab] = useState("overview");
  const [attFilter, setAttFilter] = useState("all");
  const [attRange, setAttRange] = useState("all");
  const [attVisible, setAttVisible] = useState(PAGE_SIZE);
  const [attendN, setAttendN] = useState(0);
  const [missN, setMissN] = useState(0);

  const [marksSort, setMarksSort] = useState("subject");
  const [marksSortDir, setMarksSortDir] = useState("asc");
  const [marksQuery, setMarksQuery] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [marksView, setMarksView] = useState(() => readPref("spp_marks_view", "table"));

  const [leaveFilter, setLeaveFilter] = useState("all");
  const [skillsOpen, setSkillsOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'deactivate' | 'reactivate' }
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, showToast, closeToast] = useToast();
  const [scrolled, setSentinel] = useScrolledPast();

  const cardRef = useRef(null);
  const pageRef = useRef(null);
  const touchStart = useRef(null);

  /* ---------- data loading ---------- */

  const loadProfile = useCallback(async ({ silent = false } = {}) => {
    if (!studentId) {
      setError("No student ID provided.");
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const result = await authApi.getStudentPublicProfile(studentId);
      setData(result);
      setLastLoaded(Date.now());
    } catch (err) {
      if (err.status === 404) {
        setError("Student profile not found or no longer exists.");
      } else if (err.status === 403) {
        setError("You are not authorized to view this student's profile.");
      } else {
        setError(err.message || "Failed to load student profile.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadProfile();
    setActiveTab("overview");
    setFlipped(false);
  }, [loadProfile]);

  // keeps the "updated x min ago" label fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { writePref("spp_marks_view", marksView); }, [marksView]);
  useEffect(() => { setAttVisible(PAGE_SIZE); }, [attFilter, attRange]);

  /* ---------- derived data ---------- */

  const student = data?.student;
  const profile = data?.profile;
  const academic = data?.academicData;

  const initials = student?.fullName
    ? student.fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isStaff = ["teacher", "hod", "coordinator", "principal", "admin"].includes(callerRole);
  const canDelete = ["principal", "admin"].includes(callerRole);

  const examMarks = useMemo(() => academic?.examMarks || [], [academic]);
  const recentAttendance = useMemo(() => academic?.recentAttendance || [], [academic]);
  const leaves = useMemo(() => academic?.leaveApplications || [], [academic]);

  const attendedCount = Number(academic?.attendedLectures) || 0;
  const totalCount = Number(academic?.totalLectures) || 0;
  const absentCount = Math.max(0, totalCount - attendedCount);
  const attPct = academic?.attendancePercentage;

  const marksSummary = useMemo(() => {
    if (!examMarks.length) return null;
    const pcts = examMarks.map(markPct);
    const average = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const bestIdx = pcts.indexOf(Math.max(...pcts));
    const worstIdx = pcts.indexOf(Math.min(...pcts));
    const pointed = examMarks.filter((m) => m.grade && GRADE_POINTS[m.grade] !== undefined);
    const gpa = pointed.length
      ? pointed.reduce((s, m) => s + GRADE_POINTS[m.grade], 0) / pointed.length
      : null;
    const failed = examMarks.filter((m) => m.grade === "F").length;
    const passed = pcts.filter((p) => p >= PASS_MARK).length;
    const gradeCounts = GRADE_ORDER.reduce((acc, g) => {
      const c = examMarks.filter((m) => m.grade === g).length;
      if (c) acc.push({ grade: g, count: c });
      return acc;
    }, []);
    return {
      average,
      best: examMarks[bestIdx],
      bestPct: pcts[bestIdx],
      worst: examMarks[worstIdx],
      worstPct: pcts[worstIdx],
      gpa,
      failed,
      passed,
      gradeCounts
    };
  }, [examMarks]);

  const subjectPerf = useMemo(() => {
    const bucket = {};
    examMarks.forEach((m) => {
      const key = m.subject || "Unknown";
      if (!bucket[key]) bucket[key] = { subject: key, sum: 0, n: 0 };
      bucket[key].sum += markPct(m);
      bucket[key].n += 1;
    });
    return Object.values(bucket)
      .map((b) => ({ subject: b.subject, pct: b.sum / b.n, n: b.n }))
      .sort((a, b) => b.pct - a.pct);
  }, [examMarks]);

  const subjectAttendance = useMemo(() => {
    const bucket = {};
    recentAttendance.forEach((r) => {
      const key = r.subject || "Unknown";
      if (!bucket[key]) bucket[key] = { subject: key, total: 0, present: 0 };
      bucket[key].total += 1;
      if (presentLike(r.status)) bucket[key].present += 1;
    });
    return Object.values(bucket)
      .map((b) => ({ ...b, pct: Math.round((b.present / b.total) * 100) }))
      .sort((a, b) => a.pct - b.pct);
  }, [recentAttendance]);

  const streak = useMemo(() => {
    const list = [...recentAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    let n = 0;
    for (const r of list) {
      if (r.status === "excused") continue;
      if (presentLike(r.status)) n += 1;
      else break;
    }
    return n;
  }, [recentAttendance]);

  const heatDays = useMemo(() => {
    const map = new Map();
    recentAttendance.forEach((r) => {
      const key = dayKey(r.date);
      if (!key) return;
      const cur = map.get(key) || { key, absent: 0, late: 0, present: 0, excused: 0 };
      if (cur[r.status] !== undefined) cur[r.status] += 1;
      map.set(key, cur);
    });
    return [...map.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-35)
      .map((d) => ({
        ...d,
        status: d.absent ? "absent" : d.late ? "late" : d.present ? "present" : "excused"
      }));
  }, [recentAttendance]);

  const attendanceInRange = useMemo(() => {
    const sorted = [...recentAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (attRange === "all") return sorted;
    const cutoff = Date.now() - Number(attRange) * 864e5;
    return sorted.filter((r) => {
      const t = new Date(r.date).getTime();
      return !isNaN(t) && t >= cutoff;
    });
  }, [recentAttendance, attRange]);

  const attendanceCounts = useMemo(() => {
    const c = { all: attendanceInRange.length, present: 0, absent: 0, late: 0, excused: 0 };
    attendanceInRange.forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
    return c;
  }, [attendanceInRange]);

  const filteredAttendance = useMemo(
    () => (attFilter === "all" ? attendanceInRange : attendanceInRange.filter((r) => r.status === attFilter)),
    [attendanceInRange, attFilter]
  );

  const examTypes = useMemo(
    () => ["all", ...Array.from(new Set(examMarks.map((m) => m.examType).filter(Boolean)))],
    [examMarks]
  );

  const visibleMarks = useMemo(() => {
    const q = marksQuery.trim().toLowerCase();
    let list = examMarks.filter((m) => {
      const matchesQ = !q || (m.subject || "").toLowerCase().includes(q) || (m.examType || "").toLowerCase().includes(q);
      const matchesType = examFilter === "all" || m.examType === examFilter;
      return matchesQ && matchesType;
    });

    const dir = marksSortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (marksSort === "percent") return (markPct(a) - markPct(b)) * dir;
      if (marksSort === "grade") {
        const ai = GRADE_ORDER.indexOf(a.grade);
        const bi = GRADE_ORDER.indexOf(b.grade);
        return ((ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)) * dir;
      }
      return String(a.subject || "").localeCompare(String(b.subject || "")) * dir;
    });
    return list;
  }, [examMarks, marksQuery, examFilter, marksSort, marksSortDir]);

  const leaveCounts = useMemo(() => {
    const c = { all: leaves.length, approved: 0, pending: 0, rejected: 0 };
    leaves.forEach((l) => { if (c[l.status] !== undefined) c[l.status] += 1; });
    return c;
  }, [leaves]);

  const visibleLeaves = useMemo(
    () => (leaveFilter === "all" ? leaves : leaves.filter((l) => l.status === leaveFilter)),
    [leaves, leaveFilter]
  );

  const achievements = useMemo(() => {
    const hasAtt = totalCount > 0 && attPct !== null && attPct !== undefined;
    return [
      { id: "perfect", icon: ShieldCheck, title: "Perfect attendance", desc: "95% or higher", unlocked: hasAtt && attPct >= 95 },
      { id: "streak", icon: Flame, title: "On a roll", desc: "5+ lectures in a row", unlocked: streak >= 5 },
      { id: "top", icon: Star, title: "Top scorer", desc: "90%+ in any exam", unlocked: !!marksSummary && marksSummary.bestPct >= 90 },
      { id: "clean", icon: CheckCircle2, title: "No backlogs", desc: "No exam graded F", unlocked: examMarks.length > 0 && marksSummary.failed === 0 },
      { id: "allround", icon: Trophy, title: "High achiever", desc: "75%+ average marks", unlocked: !!marksSummary && marksSummary.average >= 75 },
      { id: "steady", icon: Medal, title: "Steady performer", desc: "75% attendance & 60% marks", unlocked: hasAtt && attPct >= 75 && !!marksSummary && marksSummary.average >= 60 }
    ];
  }, [totalCount, attPct, streak, marksSummary, examMarks.length]);

  const tabs = useMemo(() => {
    const t = [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
      { id: "results", label: "Results", icon: Award }
    ];
    if (isSelf && leaves.length > 0) t.push({ id: "leaves", label: "Leaves", icon: Clock });
    return t;
  }, [isSelf, leaves.length]);

  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : "overview";
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === currentTab));

  // keyboard shortcuts: 1-4 switch tabs, F flips the ID card
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      if (e.key === "f" || e.key === "F") { setFlipped((v) => !v); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= tabs.length) setActiveTab(tabs[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tabs]);

  /* ---------- actions ---------- */

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const handleCopied = useCallback((ok, label) => {
    showToast(ok ? `${label} copied` : "Could not copy. Please copy it manually.", ok ? "success" : "error");
  }, [showToast]);

  const handleCopyEnrollment = async (e) => {
    if (e) e.stopPropagation();
    if (!profile?.enrollmentNo) return;
    const ok = await copyText(profile.enrollmentNo);
    if (ok) {
      setCopied(true);
      showToast("Enrollment number copied");
      setTimeout(() => setCopied(false), 1600);
    } else {
      showToast("Could not copy. Please copy it manually.", "error");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${student?.fullName || "Student"} — profile`, url });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const ok = await copyText(url);
    showToast(ok ? "Profile link copied" : "Could not copy the link", ok ? "success" : "error");
  };

  const handleCopySummary = async () => {
    const lines = [
      student?.fullName,
      [profile?.branch, profile?.semester, profile?.academicYear].filter(Boolean).join(" • "),
      profile?.enrollmentNo ? `Enrollment: ${profile.enrollmentNo}` : null,
      totalCount ? `Attendance: ${attPct}% (${attendedCount}/${totalCount} lectures)` : null,
      marksSummary
        ? `Average marks: ${marksSummary.average.toFixed(1)}%${marksSummary.gpa !== null ? ` • GPA ${marksSummary.gpa.toFixed(1)}/10` : ""}`
        : null
    ].filter(Boolean);
    const ok = await copyText(lines.join("\n"));
    showToast(ok ? "Summary copied" : "Could not copy the summary", ok ? "success" : "error");
  };

  const handleExportMarks = () => {
    if (!visibleMarks.length) {
      showToast("No results to export", "error");
      return;
    }
    const rows = [
      ["Subject", "Exam Type", "Marks Obtained", "Max Marks", "Percentage", "Grade"],
      ...visibleMarks.map((m) => [
        m.subject, m.examType, m.marksObtained, m.maxMarks, `${markPct(m).toFixed(1)}%`, m.grade || ""
      ])
    ];
    const safeName = (student?.fullName || "student").replace(/\s+/g, "_");
    downloadFile(`${safeName}_results.csv`, toCsv(rows));
    showToast("Results exported as CSV");
  };

  const handleExportAttendance = () => {
    if (!filteredAttendance.length) {
      showToast("No attendance records to export", "error");
      return;
    }
    const rows = [
      ["Subject", "Date", "Status"],
      ...filteredAttendance.map((r) => [
        r.subject, fmtDate(r.date, { day: "2-digit", month: "short", year: "numeric" }), r.status
      ])
    ];
    const safeName = (student?.fullName || "student").replace(/\s+/g, "_");
    downloadFile(`${safeName}_attendance.csv`, toCsv(rows));
    showToast("Attendance exported as CSV");
  };

  const toggleSort = (key) => {
    if (marksSort === key) setMarksSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setMarksSort(key); setMarksSortDir(key === "percent" ? "desc" : "asc"); }
  };

  const scrollToTop = () => {
    pageRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const closeConfirm = useCallback(() => setConfirm(null), []);

  const runAccountAction = async () => {
    if (!confirm) return;
    setActionBusy(true);
    try {
      if (confirm.type === "deactivate") {
        await authApi.deactivateStudent(studentId);
        showToast("Account deactivated");
      } else {
        await authApi.reactivateStudent(studentId);
        showToast("Account reactivated");
      }
      setConfirm(null);
      await loadProfile({ silent: true });
    } catch (err) {
      showToast(err.message || "Action failed. Please try again.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  /* ID card: 3D tilt + light glare that follow the pointer (mouse / pen only) */
  const handleCardMove = (e) => {
    if (prefersReducedMotion() || e.pointerType === "touch" || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const el = cardRef.current;
    el.style.setProperty("--ry", `${((px - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - py) * 10).toFixed(2)}deg`);
    el.style.setProperty("--gx", px.toFixed(3));
    el.style.setProperty("--gy", py.toFixed(3));
    el.classList.add("is-hovered");
  };
  const handleCardLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--gx", "0.5");
    el.style.setProperty("--gy", "0.5");
    el.classList.remove("is-hovered");
  };
  const handleCardKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFlipped((v) => !v);
    }
  };

  /* keyboard navigation for tabs */
  const handleTabKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = e.key === "ArrowRight"
      ? (activeIndex + 1) % tabs.length
      : (activeIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    document.getElementById(`spp-tab-${tabs[next].id}`)?.focus();
  };

  /* swipe between tabs on touch devices */
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      const next = dx < 0 ? Math.min(activeIndex + 1, tabs.length - 1) : Math.max(activeIndex - 1, 0);
      if (next !== activeIndex) setActiveTab(tabs[next].id);
    }
  };

  /* ---------- early states ---------- */

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="spp-error">
        <div className="spp-error-icon"><AlertTriangle size={36} /></div>
        <h3>Profile Unavailable</h3>
        <p>{error}</p>
        <div className="spp-err-actions">
          <button type="button" className="spp-back-btn" onClick={handleBack}>
            <ArrowLeft size={16} /> Go Back
          </button>
          <button type="button" className="spp-retry-btn" onClick={() => loadProfile()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------- derived display values ---------- */

  const attTone = toneFor(attPct);
  const avgTone = marksSummary ? toneFor(marksSummary.average, 60, 40) : "good";
  const standing = marksSummary ? standingFor(marksSummary.average) : null;
  const needed = lecturesNeededForTarget(attendedCount, totalCount);
  const canSkip = lecturesCanSkip(attendedCount, totalCount);
  const hasAttPct = attPct !== null && attPct !== undefined;

  const projected = totalCount + attendN + missN > 0
    ? ((attendedCount + attendN) / (totalCount + attendN + missN)) * 100
    : 0;
  const projDelta = projected - (Number(attPct) || 0);

  const attFilters = [
    { id: "all", label: "All" },
    { id: "present", label: "Present" },
    { id: "absent", label: "Absent" },
    { id: "late", label: "Late" },
    { id: "excused", label: "Excused" }
  ].filter((f) => f.id === "all" || attendanceCounts[f.id] > 0);

  const rangeOptions = [
    { id: "all", label: "All time" },
    { id: "30", label: "30 days" },
    { id: "7", label: "7 days" }
  ];

  const leaveFilters = [
    { id: "all", label: "All" },
    { id: "approved", label: "Approved" },
    { id: "pending", label: "Pending" },
    { id: "rejected", label: "Rejected" }
  ].filter((f) => f.id === "all" || leaveCounts[f.id] > 0);

  const skillList = profile?.skills || [];
  const shownSkills = skillsOpen ? skillList : skillList.slice(0, 8);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const cardSeed = profile?.enrollmentNo || student?.fullName || studentId;
  const isSuspended = student?.status === "suspended";
  const idFields = [
    { label: "Branch", value: profile?.branch },
    { label: "Semester", value: profile?.semester },
    { label: "Session", value: profile?.academicYear },
    { label: "Standing", value: standing?.label }
  ].filter((f) => f.value);

  /* ---------- tab panels ---------- */

  const renderOverview = () => (
    <div className="spp-tab-panel" key="overview">
      <div className="spp-kpi-grid">
        {totalCount > 0 && (
          <div className="spp-kpi" style={{ "--i": 0 }}>
            <ProgressRing value={attPct ?? 0} label="Attendance" tone={attTone} />
          </div>
        )}
        {marksSummary && (
          <div className="spp-kpi" style={{ "--i": 1 }}>
            <ProgressRing value={marksSummary.average} label="Avg. marks" tone={avgTone} />
          </div>
        )}
        {marksSummary?.gpa !== null && marksSummary?.gpa !== undefined && (
          <div className="spp-kpi spp-kpi-number" style={{ "--i": 2 }}>
            <div className="kpi-big"><CountUp value={marksSummary.gpa} decimals={1} /></div>
            <div className="kpi-label">Grade point avg.</div>
            <div className="kpi-sub">out of 10</div>
          </div>
        )}
        {totalCount > 0 && (
          <div className="spp-kpi spp-kpi-number" style={{ "--i": 3 }}>
            <div className="kpi-big"><CountUp value={totalCount} /></div>
            <div className="kpi-label">Lectures held</div>
            <div className="kpi-sub">{attendedCount} attended</div>
          </div>
        )}
      </div>

      <div className="spp-insights">
        {totalCount > 0 && needed > 0 && (
          <div className="spp-insight warn" style={{ "--i": 0 }}>
            <Target size={18} />
            <div>
              <strong>Below {TARGET_ATTENDANCE}% target</strong>
              <p>Attending the next {needed} lecture{needed === 1 ? "" : "s"} in a row brings attendance back to {TARGET_ATTENDANCE}%.</p>
            </div>
          </div>
        )}
        {totalCount > 0 && needed === 0 && (
          <div className="spp-insight good" style={{ "--i": 0 }}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Attendance is on track</strong>
              <p>
                {canSkip > 0
                  ? `Up to ${canSkip} more lecture${canSkip === 1 ? "" : "s"} can be missed while staying above ${TARGET_ATTENDANCE}%.`
                  : `Right at the ${TARGET_ATTENDANCE}% line, so every lecture counts.`}
              </p>
            </div>
          </div>
        )}
        {streak >= 3 && (
          <div className="spp-insight streak" style={{ "--i": 1 }}>
            <Flame size={18} />
            <div>
              <strong>{streak}-lecture streak</strong>
              <p>Present in the last {streak} lectures in a row. Keep it going!</p>
            </div>
          </div>
        )}
        {marksSummary && (
          <div className="spp-insight info" style={{ "--i": 2 }}>
            <Trophy size={18} />
            <div>
              <strong>Strongest result</strong>
              <p>{marksSummary.best.subject} ({marksSummary.best.examType}) at {Math.round(marksSummary.bestPct)}%.</p>
            </div>
          </div>
        )}
        {marksSummary && examMarks.length > 1 && (
          <div className="spp-insight neutral" style={{ "--i": 3 }}>
            <TrendingUp size={18} />
            <div>
              <strong>Needs most attention</strong>
              <p>{marksSummary.worst.subject} ({marksSummary.worst.examType}) at {Math.round(marksSummary.worstPct)}%.</p>
            </div>
          </div>
        )}
        {marksSummary?.failed > 0 && (
          <div className="spp-insight poor" style={{ "--i": 4 }}>
            <AlertTriangle size={18} />
            <div>
              <strong>{marksSummary.failed} backlog{marksSummary.failed === 1 ? "" : "s"}</strong>
              <p>Graded F in {marksSummary.failed} exam{marksSummary.failed === 1 ? "" : "s"}.</p>
            </div>
          </div>
        )}
      </div>

      {(totalCount > 0 || marksSummary) && (
        <div className="spp-card">
          <div className="spp-card-head">
            <h3 className="spp-card-title"><Medal size={16} /> Achievements</h3>
            <span className="spp-count-pill">{unlockedCount}/{achievements.length} unlocked</span>
          </div>
          <div className="spp-ach-grid">
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className={`ach ${a.unlocked ? "on" : "off"}`} style={{ "--i": i }}>
                  <span className="ach-icon"><Icon size={18} /></span>
                  <div>
                    <strong>{a.title}</strong>
                    <small>{a.unlocked ? a.desc : `Locked · ${a.desc}`}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {marksSummary?.gradeCounts?.length > 0 && (
        <div className="spp-card">
          <h3 className="spp-card-title"><BarChart3 size={16} /> Grade distribution</h3>
          <div className="spp-dist">
            {marksSummary.gradeCounts.map((g, i) => (
              <div className="dist-row" key={g.grade} style={{ "--i": i }}>
                <GradeBadge grade={g.grade} />
                <div className="dist-track">
                  <span className="dist-fill" style={{ "--w": `${(g.count / examMarks.length) * 100}%` }} />
                </div>
                <span className="dist-count">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!totalCount && !marksSummary && (
        <div className="spp-card spp-no-academic">
          <FileText size={32} />
          <p>No attendance or exam data has been recorded yet.</p>
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className="spp-tab-panel" key="attendance">
      {totalCount > 0 ? (
        <div className="spp-card">
          <div className="spp-card-head">
            <h3 className="spp-card-title"><CalendarCheck2 size={16} /> Attendance Overview</h3>
            <div className="spp-head-actions">
              {streak > 0 && (
                <span className="spp-streak" title="Consecutive lectures attended">
                  <Flame size={13} /> {streak} streak
                </span>
              )}
              <button type="button" className="spp-chip-btn" onClick={handleExportAttendance}>
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="spp-att-stats">
            <div className="att-stat-box" style={{ "--i": 0 }}>
              <div className="att-stat-value">
                {hasAttPct ? <CountUp value={attPct} suffix="%" /> : "N/A"}
              </div>
              <div className="att-stat-label">Overall</div>
            </div>
            <div className="att-stat-box" style={{ "--i": 1 }}>
              <div className="att-stat-value attended"><CountUp value={attendedCount} /></div>
              <div className="att-stat-label">Present</div>
            </div>
            <div className="att-stat-box" style={{ "--i": 2 }}>
              <div className="att-stat-value absent"><CountUp value={absentCount} /></div>
              <div className="att-stat-label">Absent</div>
            </div>
            <div className="att-stat-box" style={{ "--i": 3 }}>
              <div className="att-stat-value total"><CountUp value={totalCount} /></div>
              <div className="att-stat-label">Total</div>
            </div>
          </div>

          {/* What-if planner */}
          <div className="spp-planner">
            <h4 className="spp-planner-title"><Sparkles size={14} /> Attendance planner</h4>
            <div className="spp-planner-grid">
              <label className="spp-slider" style={{ "--p": `${(attendN / 20) * 100}%` }}>
                <span>Attend next <b>{attendN}</b></span>
                <input type="range" min="0" max="20" value={attendN} onChange={(e) => setAttendN(+e.target.value)} />
              </label>
              <label className="spp-slider miss" style={{ "--p": `${(missN / 20) * 100}%` }}>
                <span>Miss next <b>{missN}</b></span>
                <input type="range" min="0" max="20" value={missN} onChange={(e) => setMissN(+e.target.value)} />
              </label>
            </div>
            <div className={`planner-result ${toneFor(projected)}`}>
              <strong>{projected.toFixed(1)}%</strong>
              <span>{projected >= TARGET_ATTENDANCE ? "Above the 75% target" : "Below the 75% target"}</span>
              {(attendN > 0 || missN > 0) && (
                <em>{projDelta >= 0 ? "+" : ""}{projDelta.toFixed(1)} pts</em>
              )}
            </div>
          </div>

          {heatDays.length > 0 && (
            <>
              <h4 className="spp-subsection-title spp-mt">Recent days</h4>
              <div className="spp-heat" role="img" aria-label="Recent attendance by day">
                {heatDays.map((d, i) => (
                  <span
                    key={d.key}
                    className={`heat-cell ${d.status}`}
                    style={{ "--i": i }}
                    title={`${fmtDate(d.key)} · ${d.status}`}
                  />
                ))}
              </div>
              <div className="spp-heat-legend">
                <span><i className="heat-cell present" /> Present</span>
                <span><i className="heat-cell late" /> Late</span>
                <span><i className="heat-cell absent" /> Absent</span>
                <span><i className="heat-cell excused" /> Excused</span>
              </div>
            </>
          )}

          {subjectAttendance.length > 0 && (
            <>
              <h4 className="spp-subsection-title spp-mt">Subjects in recent records</h4>
              <div className="spp-subject-bars">
                {subjectAttendance.map((s, i) => (
                  <div className="subject-bar" key={s.subject} style={{ "--i": i }}>
                    <div className="subject-bar-top">
                      <span>{s.subject}</span>
                      <AttendanceBadge percentage={s.pct} />
                    </div>
                    <div className="subject-bar-track">
                      <span className={`subject-bar-fill ${toneFor(s.pct)}`} style={{ "--w": `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {recentAttendance.length > 0 && (
            <>
              <div className="spp-record-head">
                <h4 className="spp-subsection-title">Recent Record</h4>
                <div className="spp-seg" role="group" aria-label="Date range">
                  {rangeOptions.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      className={attRange === r.id ? "on" : ""}
                      onClick={() => setAttRange(r.id)}
                      aria-pressed={attRange === r.id}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="spp-filter-row" role="group" aria-label="Filter attendance by status">
                {attFilters.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`spp-filter ${attFilter === f.id ? "active" : ""}`}
                    onClick={() => setAttFilter(f.id)}
                    aria-pressed={attFilter === f.id}
                  >
                    {f.label}
                    <span className="spp-filter-count">{attendanceCounts[f.id]}</span>
                  </button>
                ))}
              </div>

              <div className="spp-att-table" key={`${attFilter}-${attRange}`}>
                {filteredAttendance.length === 0 ? (
                  <p className="spp-empty-line">No records match this filter.</p>
                ) : (
                  filteredAttendance.slice(0, attVisible).map((rec, i) => (
                    <div key={`${rec.date}-${rec.subject}-${i}`} className="spp-att-row" style={{ "--i": Math.min(i, 12) }}>
                      <AttendanceStatusDot status={rec.status} />
                      <span className="att-subject">{rec.subject}</span>
                      <span className="att-date">{fmtDate(rec.date)}</span>
                      <span className={`att-status-label ${rec.status}`}>{rec.status}</span>
                    </div>
                  ))
                )}
              </div>

              {filteredAttendance.length > attVisible && (
                <button type="button" className="spp-more-btn" onClick={() => setAttVisible((v) => v + PAGE_SIZE)}>
                  <ChevronDown size={14} /> Show more ({filteredAttendance.length - attVisible} left)
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="spp-card spp-no-academic">
          <CalendarCheck2 size={32} />
          <p>No attendance has been recorded yet.</p>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="spp-tab-panel" key="results">
      {examMarks.length > 0 ? (
        <>
          <div className="spp-card">
            <div className="spp-card-head">
              <h3 className="spp-card-title"><Award size={16} /> Examination Results</h3>
              <button type="button" className="spp-chip-btn" onClick={handleExportMarks}>
                <Download size={13} /> Export CSV
              </button>
            </div>

            <div className="spp-result-chips">
              <div className="rchip" style={{ "--i": 0 }}>
                <strong><CountUp value={marksSummary.average} decimals={1} suffix="%" /></strong>
                <span>Average</span>
              </div>
              <div className="rchip" style={{ "--i": 1 }}>
                <strong>{marksSummary.gpa !== null ? <CountUp value={marksSummary.gpa} decimals={1} /> : "—"}</strong>
                <span>GPA / 10</span>
              </div>
              <div className="rchip" style={{ "--i": 2 }}>
                <strong><CountUp value={marksSummary.passed} />/{examMarks.length}</strong>
                <span>Passed</span>
              </div>
              {standing && (
                <div className={`rchip standing ${standing.tone}`} style={{ "--i": 3 }}>
                  <strong>{standing.label}</strong>
                  <span>Standing</span>
                </div>
              )}
            </div>
          </div>

          {subjectPerf.length > 1 && (
            <div className="spp-card">
              <h3 className="spp-card-title"><BarChart3 size={16} /> Performance by subject</h3>
              <div className="spp-perf">
                {subjectPerf.map((s, i) => (
                  <div className="perf-row" key={s.subject} style={{ "--i": i }}>
                    <span className="perf-name" title={s.subject}>{s.subject}</span>
                    <div className="perf-track">
                      <span className="perf-pass" style={{ left: `${PASS_MARK}%` }} aria-hidden="true" />
                      <span className={`perf-fill ${toneFor(s.pct, 60, 40)}`} style={{ "--w": `${clampPct(s.pct)}%` }} />
                    </div>
                    <span className="perf-val">{Math.round(s.pct)}%</span>
                  </div>
                ))}
              </div>
              <p className="perf-note"><i /> Marker shows the {PASS_MARK}% pass line</p>
            </div>
          )}

          <div className="spp-card">
            <div className="spp-toolbar">
              <label className="spp-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search subject or exam"
                  value={marksQuery}
                  onChange={(e) => setMarksQuery(e.target.value)}
                  aria-label="Search results"
                />
                {marksQuery && (
                  <button type="button" onClick={() => setMarksQuery("")} aria-label="Clear search"><X size={13} /></button>
                )}
              </label>

              {examTypes.length > 2 && (
                <select
                  className="spp-select"
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  aria-label="Filter by exam type"
                >
                  {examTypes.map((t) => (
                    <option key={t} value={t}>{t === "all" ? "All exam types" : t}</option>
                  ))}
                </select>
              )}

              <div className="spp-sort-mobile">
                <select
                  className="spp-select"
                  value={marksSort}
                  onChange={(e) => { setMarksSort(e.target.value); setMarksSortDir(e.target.value === "percent" ? "desc" : "asc"); }}
                  aria-label="Sort results"
                >
                  <option value="subject">Sort: Subject</option>
                  <option value="percent">Sort: Marks</option>
                  <option value="grade">Sort: Grade</option>
                </select>
                <button
                  type="button"
                  className="spp-icon-btn sm"
                  onClick={() => setMarksSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  aria-label="Toggle sort direction"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              <div className="spp-view-toggle" role="group" aria-label="Result layout">
                <button type="button" className={marksView === "table" ? "on" : ""} onClick={() => setMarksView("table")} aria-label="List view" aria-pressed={marksView === "table"}>
                  <List size={15} />
                </button>
                <button type="button" className={marksView === "cards" ? "on" : ""} onClick={() => setMarksView("cards")} aria-label="Card view" aria-pressed={marksView === "cards"}>
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>

            {visibleMarks.length === 0 ? (
              <p className="spp-empty-line">No results match your search.</p>
            ) : marksView === "cards" ? (
              <div className="spp-marks-cards" key="cards">
                {visibleMarks.map((m, i) => {
                  const pct = markPct(m);
                  return (
                    <div key={`${m.subject}-${m.examType}-${i}`} className={`mark-card ${toneFor(pct, 60, 40)}`} style={{ "--i": Math.min(i, 12) }}>
                      <div className="mark-card-top">
                        <span className="mark-card-subject">{m.subject}</span>
                        <GradeBadge grade={m.grade} />
                      </div>
                      <div className="mark-card-type">{m.examType}</div>
                      <div className="mark-card-score">
                        <strong>{Math.round(pct)}%</strong>
                        <span>{m.marksObtained}/{m.maxMarks}</span>
                      </div>
                      <div className="mark-card-bar"><span style={{ "--w": `${clampPct(pct)}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="spp-marks-table" key="table">
                <div className="marks-table-head">
                  <button type="button" className={`sort-btn ${marksSort === "subject" ? "on" : ""}`} onClick={() => toggleSort("subject")}>
                    Subject <ArrowUpDown size={11} />
                  </button>
                  <span>Exam Type</span>
                  <button type="button" className={`sort-btn ${marksSort === "percent" ? "on" : ""}`} onClick={() => toggleSort("percent")}>
                    Marks <ArrowUpDown size={11} />
                  </button>
                  <button type="button" className={`sort-btn ${marksSort === "grade" ? "on" : ""}`} onClick={() => toggleSort("grade")}>
                    Grade <ArrowUpDown size={11} />
                  </button>
                </div>

                {visibleMarks.map((m, i) => {
                  const pct = markPct(m);
                  return (
                    <div key={`${m.subject}-${m.examType}-${i}`} className="marks-table-row" style={{ "--i": Math.min(i, 12) }}>
                      <span className="marks-subject">{m.subject}</span>
                      <span className="marks-type">{m.examType}</span>
                      <span className="marks-score">
                        {m.marksObtained}/{m.maxMarks}
                        <span className="marks-pct">({Math.round(pct)}%)</span>
                      </span>
                      <GradeBadge grade={m.grade} />
                      <span className="marks-bar" aria-hidden="true">
                        <span style={{ "--w": `${clampPct(pct)}%` }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="spp-card spp-no-academic">
          <Award size={32} />
          <p>No exam results have been published yet.</p>
        </div>
      )}
    </div>
  );

  const renderLeaves = () => (
    <div className="spp-tab-panel" key="leaves">
      <div className="spp-card">
        <div className="spp-card-head">
          <h3 className="spp-card-title"><Clock size={16} /> My Leave Applications</h3>
        </div>

        <div className="spp-result-chips">
          <div className="rchip" style={{ "--i": 0 }}><strong><CountUp value={leaveCounts.approved} /></strong><span>Approved</span></div>
          <div className="rchip" style={{ "--i": 1 }}><strong><CountUp value={leaveCounts.pending} /></strong><span>Pending</span></div>
          <div className="rchip" style={{ "--i": 2 }}><strong><CountUp value={leaveCounts.rejected} /></strong><span>Rejected</span></div>
        </div>

        <div className="spp-filter-row" role="group" aria-label="Filter leaves by status">
          {leaveFilters.map((f) => (
            <button
              type="button"
              key={f.id}
              className={`spp-filter ${leaveFilter === f.id ? "active" : ""}`}
              onClick={() => setLeaveFilter(f.id)}
              aria-pressed={leaveFilter === f.id}
            >
              {f.label}
              <span className="spp-filter-count">{leaveCounts[f.id]}</span>
            </button>
          ))}
        </div>

        <div className="spp-leaves" key={leaveFilter}>
          {visibleLeaves.length === 0 && <p className="spp-empty-line">No leave applications here.</p>}
          {visibleLeaves.map((l, i) => {
            const days = leaveDays(l);
            return (
              <div key={i} className="spp-leave-row" style={{ "--i": Math.min(i, 12) }}>
                <div className="leave-left">
                  <span className="leave-type">{l.leaveType}</span>
                  <span className="leave-dates">
                    {fmtDate(l.startDate, { day: "numeric", month: "short" })}
                    {" — "}
                    {fmtDate(l.endDate)}
                    {days ? ` · ${days} day${days === 1 ? "" : "s"}` : ""}
                  </span>
                </div>
                <span className={`leave-status-badge ${l.status}`}>
                  {l.status === "approved" ? <CheckCircle2 size={12} /> :
                   l.status === "rejected" ? <XCircle size={12} /> :
                   <Clock size={12} />}
                  {l.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ---------- render ---------- */

  return (
    <div className="spp-page" ref={pageRef}>
      <div className={`spp-topbar ${scrolled ? "is-stuck" : ""}`}>
        <button type="button" className="spp-back-btn" onClick={handleBack}>
          <ArrowLeft size={16} /> <span className="spp-back-label">All Students</span>
        </button>

        <div className="spp-topbar-title" aria-hidden={!scrolled}>
          {student?.avatarUrl ? (
            <img src={student.avatarUrl} alt="" className="mini-avatar" />
          ) : (
            <span className="mini-avatar mini-initials">{initials}</span>
          )}
          <span className="mini-name">{student?.fullName}</span>
          {hasAttPct && <AttendanceBadge percentage={attPct} />}
        </div>

        <div className="spp-topbar-actions">
          <button type="button" className="spp-icon-btn" onClick={() => loadProfile({ silent: true })} disabled={refreshing} title="Refresh" aria-label="Refresh profile">
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
          </button>
          <button type="button" className="spp-icon-btn" onClick={handleCopySummary} title="Copy summary" aria-label="Copy summary">
            <FileText size={15} />
          </button>
          <button type="button" className="spp-icon-btn" onClick={handleShare} title="Share profile" aria-label="Share profile">
            <Share2 size={15} />
          </button>
          <button type="button" className="spp-icon-btn spp-hide-sm" onClick={() => window.print()} title="Print" aria-label="Print profile">
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* ================= Premium ID card ================= */}
      <section className="spp-idwrap" aria-label="Student identity card">
        <div className="spp-idcol">
          <div className="idc-holder">
            <div className="idc-lanyard" aria-hidden="true">
              <span className="idc-strap" />
              <span className="idc-clip" />
            </div>

            <div
              className={`idc ${flipped ? "is-flipped" : ""} ${isSuspended ? "is-suspended" : ""}`}
              ref={cardRef}
              onPointerMove={handleCardMove}
              onPointerLeave={handleCardLeave}
            >
              <div
                className="idc-inner"
                role="button"
                tabIndex={0}
                aria-pressed={flipped}
                aria-label={flipped ? "ID card back. Press to show the front" : "ID card front. Press to show the back"}
                onClick={() => setFlipped((v) => !v)}
                onKeyDown={handleCardKey}
              >
                {/* ---------- FRONT ---------- */}
                <div className="idc-face idc-front" aria-hidden={flipped}>
                  <span className="idc-bg" aria-hidden="true">
                    {student?.coverUrl && (
                      <img src={student.coverUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    )}
                  </span>
                  <span className="idc-guilloche" aria-hidden="true" />
                  <span className="idc-foil" aria-hidden="true" />
                  <span className="idc-glare" aria-hidden="true" />

                  <header className="idc-head">
                    <span className="idc-logo"><GraduationCap strokeWidth={2.2} /></span>
                    <span className="idc-org">
                      <strong>Subharti Polytechnic</strong>
                      <small>Student identity card</small>
                    </span>
                    <span className={`idc-status ${isSuspended ? "off" : "on"}`}>
                      <i /> {isSuspended ? "Deactivated" : "Active"}
                    </span>
                  </header>

                  <div className="idc-main">
                    <div className="idc-photo-col">
                      <div className="idc-photo">
                        {student?.avatarUrl ? (
                          <img
                            src={student.avatarUrl}
                            alt={student.fullName}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <span className="idc-initials" style={student?.avatarUrl ? { display: "none" } : undefined}>{initials}</span>
                        <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
                      </div>
                      <span className="idc-chip" aria-hidden="true"><b /><b /><b /><b /></span>
                    </div>

                    <div className="idc-info">
                      <h1 className="idc-name">{student?.fullName || "Unknown Student"}</h1>

                      {profile?.enrollmentNo && (
                        <div className="idc-enroll">
                          <span>Enrollment no.</span>
                          <code>{profile.enrollmentNo}</code>
                          <button
                            type="button"
                            className={`idc-copy ${copied ? "done" : ""}`}
                            onClick={handleCopyEnrollment}
                            onKeyDown={(e) => e.stopPropagation()}
                            tabIndex={flipped ? -1 : 0}
                            aria-label="Copy enrollment number"
                          >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}

                      {idFields.length > 0 && (
                        <dl className="idc-fields">
                          {idFields.map((f) => (
                            <div key={f.label}>
                              <dt>{f.label}</dt>
                              <dd>{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>

                    <div className="idc-qr">
                      <QrArt seed={cardSeed} />
                    </div>
                  </div>

                  <footer className="idc-foot">
                    <span className="idc-verified"><BadgeCheck /> Verified student</span>
                    <span className="idc-flip-hint"><RotateCw /> Tap to flip</span>
                  </footer>
                </div>

                {/* ---------- BACK ---------- */}
                <div className="idc-face idc-back" aria-hidden={!flipped}>
                  <span className="idc-guilloche" aria-hidden="true" />
                  <span className="idc-foil" aria-hidden="true" />
                  <span className="idc-glare" aria-hidden="true" />
                  <span className="idc-stripe" aria-hidden="true" />

                  <div className="idc-back-body">
                    <div className="idc-back-left">
                      <div className="idc-contact">
                        {(isStaff || isSelf) && student?.email && (
                          <a href={`mailto:${student.email}`} tabIndex={flipped ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                            <Mail /> <span>{student.email}</span>
                          </a>
                        )}
                        {isStaff && student?.phone && (
                          <a href={`tel:${student.phone}`} tabIndex={flipped ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                            <Phone /> <span>{student.phone}</span>
                          </a>
                        )}
                        {!((isStaff || isSelf) && student?.email) && !(isStaff && student?.phone) && (
                          <p className="idc-muted">Contact details are private.</p>
                        )}
                      </div>

                      <div className="idc-sign">
                        <span className="idc-sign-ink">{student?.fullName}</span>
                        <small>Holder's signature</small>
                      </div>
                    </div>

                    <div className="idc-back-right">
                      {(hasAttPct || marksSummary) && (
                        <div className="idc-mini-stats">
                          {hasAttPct && (
                            <div className={attTone}><strong>{Math.round(Number(attPct))}%</strong><span>Attendance</span></div>
                          )}
                          {marksSummary && (
                            <div className={avgTone}><strong>{Math.round(marksSummary.average)}%</strong><span>Avg. marks</span></div>
                          )}
                          {marksSummary?.gpa !== null && marksSummary?.gpa !== undefined && (
                            <div className="neutral"><strong>{marksSummary.gpa.toFixed(1)}</strong><span>GPA</span></div>
                          )}
                        </div>
                      )}
                      <div className="idc-seal" aria-hidden="true"><Fingerprint /></div>
                    </div>
                  </div>

                  <div className="idc-back-foot">
                    <div className="idc-barcode"><BarcodeArt seed={cardSeed} /></div>
                    <p>This card belongs to Subharti Polytechnic. If found, please return it to the college office.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel: quick numbers + actions */}
        <div className="spp-idside">
          <div className="spp-tags">
            {profile?.branch && (
              <span className="spp-tag branch-tag" style={{ "--i": 0 }}><BookOpen size={12} /> {profile.branch}</span>
            )}
            {profile?.semester && (
              <span className="spp-tag sem-tag" style={{ "--i": 1 }}><Calendar size={12} /> {profile.semester}</span>
            )}
            {profile?.academicYear && (
              <span className="spp-tag year-tag" style={{ "--i": 2 }}><GraduationCap size={12} /> {profile.academicYear}</span>
            )}
            {standing && (
              <span className={`spp-tag standing-tag ${standing.tone}`} style={{ "--i": 3 }}><Award size={12} /> {standing.label}</span>
            )}
            {isSuspended && (
              <span className="spp-tag suspended-tag" style={{ "--i": 4 }}>Deactivated</span>
            )}
          </div>

          {(hasAttPct || marksSummary) && (
            <div className="spp-hero-stats">
              {hasAttPct && (
                <div className={`hero-stat ${attTone}`}>
                  <strong><CountUp value={Number(attPct)} suffix="%" /></strong>
                  <span>Attendance</span>
                </div>
              )}
              {marksSummary && (
                <div className={`hero-stat ${avgTone}`}>
                  <strong><CountUp value={marksSummary.average} suffix="%" /></strong>
                  <span>Avg. marks</span>
                </div>
              )}
              {marksSummary?.gpa !== null && marksSummary?.gpa !== undefined && (
                <div className="hero-stat neutral">
                  <strong><CountUp value={marksSummary.gpa} decimals={1} /></strong>
                  <span>GPA</span>
                </div>
              )}
            </div>
          )}

          <div className="spp-id-actions">
            <button type="button" className="spp-flip-btn" onClick={() => setFlipped((v) => !v)}>
              <RotateCw size={15} /> {flipped ? "Show front" : "Show back"}
            </button>
            <span className="spp-kbd-hint"><kbd>F</kbd> flips the card</span>
          </div>

          {lastLoaded && <p className="spp-updated"><Clock size={11} /> Updated {timeAgo(lastLoaded)}</p>}
        </div>
      </section>
      <span ref={setSentinel} className="spp-sentinel" aria-hidden="true" />

      <div className="spp-body">
        {/* Left column */}
        <aside className="spp-sidebar">
          {(student?.bio || profile?.bio) && (
            <Reveal delay={0}>
              <div className="spp-card">
                <h3 className="spp-card-title"><User2 size={16} /> About</h3>
                <p className="spp-bio">{student?.bio || profile?.bio}</p>
              </div>
            </Reveal>
          )}

          {(isStaff || isSelf) && (
            <Reveal delay={60}>
              <div className="spp-card">
                <h3 className="spp-card-title"><Mail size={16} /> Contact</h3>
                <div className="spp-contact-list">
                  {student?.email && (
                    <a className="spp-contact-item" href={`mailto:${student.email}`}>
                      <Mail size={14} />
                      <span>{student.email}</span>
                      <CopyChip text={student.email} label="Email" onCopied={handleCopied} />
                    </a>
                  )}
                  {isStaff && student?.phone && (
                    <a className="spp-contact-item" href={`tel:${student.phone}`}>
                      <Phone size={14} />
                      <span>{student.phone}</span>
                      <CopyChip text={student.phone} label="Phone number" onCopied={handleCopied} />
                    </a>
                  )}
                  {!student?.email && !(isStaff && student?.phone) && (
                    <p className="spp-empty-line">No contact details available.</p>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {skillList.length > 0 && (
            <Reveal delay={120}>
              <div className="spp-card">
                <h3 className="spp-card-title"><Award size={16} /> Skills</h3>
                <div className="spp-skills">
                  {shownSkills.map((skill, i) => (
                    <span key={`${skill}-${i}`} className="spp-skill-pill" style={{ "--i": i }}>{skill}</span>
                  ))}
                </div>
                {skillList.length > 8 && (
                  <button type="button" className="spp-link-btn" onClick={() => setSkillsOpen((o) => !o)}>
                    {skillsOpen ? "Show less" : `Show all ${skillList.length}`}
                  </button>
                )}
              </div>
            </Reveal>
          )}

          {canDelete && !isSelf && (
            <Reveal delay={180}>
              <div className="spp-card spp-admin-card">
                <h3 className="spp-card-title danger-title">
                  <AlertTriangle size={16} /> Account Actions
                </h3>
                <p className="spp-admin-note">
                  As {callerRole === "principal" ? "Principal" : "System Administrator"}, you may deactivate this student's account. Academic records will be preserved.
                </p>
                {isSuspended ? (
                  <button type="button" className="spp-action-btn reactivate" onClick={() => setConfirm({ type: "reactivate" })}>
                    <CheckCircle2 size={15} /> Reactivate Account
                  </button>
                ) : (
                  <button type="button" className="spp-action-btn deactivate" onClick={() => setConfirm({ type: "deactivate" })}>
                    <XCircle size={15} /> Deactivate Account
                  </button>
                )}
              </div>
            </Reveal>
          )}
        </aside>

        {/* Right column */}
        <main className="spp-main">
          {academic ? (
            <>
              <div
                className="spp-tabs"
                role="tablist"
                aria-label="Student records"
                style={{ "--count": tabs.length, "--active": activeIndex }}
                onKeyDown={handleTabKey}
              >
                <span className="spp-tab-indicator" aria-hidden="true" />
                {tabs.map((t, idx) => {
                  const Icon = t.icon;
                  const selected = t.id === currentTab;
                  return (
                    <button
                      key={t.id}
                      id={`spp-tab-${t.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`spp-panel-${t.id}`}
                      aria-keyshortcuts={String(idx + 1)}
                      tabIndex={selected ? 0 : -1}
                      className={`spp-tab ${selected ? "active" : ""}`}
                      onClick={() => setActiveTab(t.id)}
                    >
                      <Icon size={15} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div
                role="tabpanel"
                id={`spp-panel-${currentTab}`}
                aria-labelledby={`spp-tab-${currentTab}`}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {currentTab === "overview" && renderOverview()}
                {currentTab === "attendance" && renderAttendance()}
                {currentTab === "results" && renderResults()}
                {currentTab === "leaves" && renderLeaves()}
              </div>
            </>
          ) : (
            <div className="spp-card spp-no-academic">
              <FileText size={32} />
              <p>Academic records are not available for public viewing.</p>
            </div>
          )}
        </main>
      </div>

      <button
        type="button"
        className={`spp-top-btn ${scrolled ? "show" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        tabIndex={scrolled ? 0 : -1}
      >
        <ArrowUp size={17} />
      </button>

      <ConfirmModal
        open={!!confirm}
        tone={confirm?.type === "deactivate" ? "danger" : "success"}
        title={confirm?.type === "deactivate" ? "Deactivate this account?" : "Reactivate this account?"}
        message={
          confirm?.type === "deactivate"
            ? `${student?.fullName || "This student"} will no longer be able to log in. Academic records are kept.`
            : `${student?.fullName || "This student"} will be able to log in again.`
        }
        confirmLabel={confirm?.type === "deactivate" ? "Deactivate" : "Reactivate"}
        busy={actionBusy}
        onConfirm={runAccountAction}
        onCancel={closeConfirm}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}