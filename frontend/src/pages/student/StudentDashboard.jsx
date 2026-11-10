import React, { useState, useEffect, useId, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  CalendarCheck2, Award, FileText, Clock, Bell, User, ChevronRight, ArrowUpRight,
  Sparkles, GraduationCap, BookOpen, CreditCard, BarChart3, Radio, MapPin, ShieldCheck,
  CheckCircle2, TrendingUp, Bookmark, HelpCircle, Building2, Check, Calendar, RefreshCw,
  Library, Search, ArrowUp, Zap, Calculator, Timer, X, CornerDownLeft, Target,
  AlertTriangle, Printer, Download, ExternalLink, Video, Send, Layers, Sun, Moon,
  QrCode, Info, FileCheck, Phone, CheckCircle, AlertCircle, Plus, FileBadge, ArrowDownRight
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { useTheme } from "../../context/ThemeContext";
import "./StudentDashboard.css";

/* ==========================================================================
   HELPERS & NUMERIC UTILITIES
   ========================================================================== */

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const isNum = (v) => typeof v === "number" && !Number.isNaN(v);

const NAV_ITEMS = [
  { key: "attendance", label: "Attendance Tracker", hint: "Biometric & Lecture Logs" },
  { key: "results", label: "Results & Grade Cards", hint: "SGPA, CGPA & Marksheets" },
  { key: "students", label: "All Students", hint: "Student Directory & Roster" },
  { key: "faculty", label: "All Faculty", hint: "Professors & Academic Scholars" },
  { key: "timetable", label: "Lecture Timetable", hint: "Class Schedules & Rooms" },
  { key: "assignments", label: "Coursework & Tasks", hint: "Continuous Submissions" },
  { key: "notes", label: "Notes & Lab Manuals", hint: "Syllabus Documents" },
  { key: "lectures", label: "Video Lectures", hint: "Recorded & Live Classes" },
  { key: "exams", label: "Examination Center", hint: "Admit Card & Datesheets" },
  { key: "fees", label: "Fee Ledger & Dues", hint: "Online Receipts & Dues" },
  { key: "library", label: "Central Library", hint: "Borrowed Books & Catalog" },
  { key: "leaves", label: "Leave Applications", hint: "Apply & Clearance Status" },
  { key: "notices", label: "Circulars & Notices", hint: "Official Directives" },
  { key: "notifications", label: "Notification Feed", hint: "Alerts & Messages" },
  { key: "profile", label: "Student Profile", hint: "Credentials & Portfolio" },
  { key: "feedback", label: "Student Affairs", hint: "Grievances & Feedback" },
  { key: "settings", label: "Account Settings", hint: "Preferences & Security" }
];

function useUid() {
  const id = useId();
  return id.replace(/:/g, "_");
}

function greetingFor(d) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function toMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hh = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hh < 12) hh += 12;
  if (ampm === "AM" && hh === 12) hh = 0;
  return hh * 60 + mm;
}

/* ==========================================================================
   ANIMATED NUMBER COUNTER (EASE-OUT CUBIC)
   ========================================================================== */

function AnimatedCounter({ value = 0, duration = 850, suffix = "", prefix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }
    hasAnimated.current = true;
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(step);
      else setDisplayValue(target);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span className="std-tabular-num">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

/* ==========================================================================
   MAGNETIC BUTTON
   ========================================================================== */

function MagneticButton({ children, className = "", onClick, ...props }) {
  const btnRef = useRef(null);

  const handlePointerMove = (e) => {
    const el = btnRef.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate3d(${x * 0.16}px, ${y * 0.16}px, 0)`;
  };

  const handlePointerLeave = () => {
    const el = btnRef.current;
    if (el) el.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <button
      ref={btnRef}
      className={`std-magnetic-btn ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

/* ==========================================================================
   DESKTOP CUSTOM CURSOR
   ========================================================================== */

function DashboardCustomCursor() {
  const [mounted, setMounted] = useState(false);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const targetPos = useRef({ x: -200, y: -200 });
  const ringPos = useRef({ x: -200, y: -200 });
  const hasInitialized = useRef(false);
  const isVisible = useRef(false);
  const animFrameId = useRef(null);
  const hoverStatesRef = useRef({ btn: false, card: false, chart: false });

  useEffect(() => {
    const checkIsTouchOrCoarse = () => {
      if (typeof window === "undefined") return true;
      const hasTouch =
        "ontouchstart" in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
      const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia && window.matchMedia("(hover: none)").matches;
      const isSmallScreen = window.innerWidth <= 1024;
      const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return Boolean(hasTouch || isCoarse || noHover || isSmallScreen || prefersReduced);
    };

    if (checkIsTouchOrCoarse()) return;
    setMounted(true);

    const place = (el, x, y) => {
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const updateCoordinates = (clientX, clientY) => {
      const x = Math.round(clientX);
      const y = Math.round(clientY);
      targetPos.current.x = x;
      targetPos.current.y = y;
      if (!hasInitialized.current) {
        ringPos.current.x = x;
        ringPos.current.y = y;
        hasInitialized.current = true;
      }
      place(dotRef.current, x, y);
    };

    const showCursor = () => {
      if (!isVisible.current) {
        isVisible.current = true;
        dotRef.current?.classList.add("visible");
        ringRef.current?.classList.add("visible");
      }
    };

    const hideCursor = () => {
      if (isVisible.current) {
        isVisible.current = false;
        dotRef.current?.classList.remove("visible");
        ringRef.current?.classList.remove("visible");
      }
    };

    const onPointerMove = (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        hideCursor();
        return;
      }
      updateCoordinates(e.clientX, e.clientY);
      showCursor();

      const target = e.target;
      if (!target || !target.closest) return;

      const isBtn = Boolean(
        target.closest(
          'button, a, input, [role="button"], .std-tool-tile, .std-hero-pill-btn, .std-sched-btn, .std-asgn-submit-btn, .std-sync-btn, .clickable'
        )
      );
      const isChart = Boolean(
        target.closest('.std-chart-svg, .std-bar-column, .std-donut-widget, circle, line')
      );
      const isCard = Boolean(
        target.closest(
          '.std-stat-card, .std-panel-card, .std-circular-item, .std-hero-strength-box, .std-hero-avatar-wrap, .std-focus-card, .std-overview-kpi'
        )
      );

      const ringEl = ringRef.current;
      const dotEl = dotRef.current;
      if (!ringEl || !dotEl) return;

      if (isBtn !== hoverStatesRef.current.btn) {
        hoverStatesRef.current.btn = isBtn;
        ringEl.classList.toggle("hover-button", isBtn);
        dotEl.classList.toggle("btn-hover", isBtn);
      }
      if (isChart !== hoverStatesRef.current.chart) {
        hoverStatesRef.current.chart = isChart;
        ringEl.classList.toggle("hover-chart", isChart && !isBtn);
        dotEl.classList.toggle("chart-hover", isChart && !isBtn);
      }
      if (isCard !== hoverStatesRef.current.card) {
        hoverStatesRef.current.card = isCard;
        ringEl.classList.toggle("hover-card", isCard && !isBtn && !isChart);
      }
    };

    const onPointerDown = (e) => {
      if (e.pointerType !== "touch") ringRef.current?.classList.add("is-down");
    };
    const onPointerUp = (e) => {
      if (e.pointerType !== "touch") ringRef.current?.classList.remove("is-down");
    };
    const onPointerEnter = (e) => {
      if (e.pointerType === "touch") return;
      updateCoordinates(e.clientX, e.clientY);
      showCursor();
    };
    const onScroll = () => {
      if (hasInitialized.current) {
        ringPos.current.x = targetPos.current.x;
        ringPos.current.y = targetPos.current.y;
        place(ringRef.current, targetPos.current.x, targetPos.current.y);
      }
    };

    const render = () => {
      if (hasInitialized.current && isVisible.current) {
        const tx = targetPos.current.x;
        const ty = targetPos.current.y;
        const dx = tx - ringPos.current.x;
        const dy = ty - ringPos.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.4) {
          let factor = 0.82;
          if (dist > 20) factor = 0.94;
          if (dist > 60) factor = 1.0;
          if (factor >= 1.0) {
            ringPos.current.x = tx;
            ringPos.current.y = ty;
          } else {
            ringPos.current.x += dx * factor;
            ringPos.current.y += dy * factor;
          }
          place(ringRef.current, ringPos.current.x, ringPos.current.y);
        } else if (ringPos.current.x !== tx || ringPos.current.y !== ty) {
          ringPos.current.x = tx;
          ringPos.current.y = ty;
          place(ringRef.current, tx, ty);
        }
      }
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", hideCursor);
    document.documentElement.addEventListener("mouseenter", onPointerEnter);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
      document.documentElement.removeEventListener("mouseenter", onPointerEnter);
    };
  }, []);

  if (!mounted || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <>
      <div ref={dotRef} className="std-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="std-cursor-ring" aria-hidden="true">
        <div className="std-cursor-ring-inner" />
      </div>
    </>,
    document.body
  );
}

/* ==========================================================================
   CHARTS & SVG VISUALIZATIONS
   ========================================================================== */

function smoothPath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cX = (curr.x + next.x) / 2;
    d += ` C${cX},${curr.y} ${cX},${next.y} ${next.x},${next.y}`;
  }
  return d;
}

function normalizeSeries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d, i) => {
      const v = Number(d?.percentage ?? d?.value ?? d?.marks ?? d?.count ?? 0);
      const l = String(d?.label ?? d?.day ?? d?.week ?? d?.subject ?? `Item ${i + 1}`);
      return { label: l, value: Number.isFinite(v) ? v : 0 };
    })
    .filter((d) => d.label.length > 0);
}

function InteractiveAreaChart({ data, color = "#38BDF8", unit = "%", yMax = 100 }) {
  const uid = useUid();
  const [hover, setHover] = useState(null);

  const W = 620;
  const H = 230;
  const pad = { l: 45, r: 20, t: 20, b: 35 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;

  const xAt = (i) => pad.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
  const yAt = (v) => pad.t + ih - (clamp(v, 0, yMax) / yMax) * ih;

  const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }));
  const line = smoothPath(pts);
  const area =
    pts.length > 1
      ? `${line} L${pts[pts.length - 1].x},${pad.t + ih} L${pts[0].x},${pad.t + ih} Z`
      : "";

  const ticks = [0, 25, 50, 75, 100];
  const labelEvery = Math.max(1, Math.ceil(n / 6));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    pts.forEach((p, i) => {
      const dist = Math.abs(p.x - rel);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? pts[hover] : null;

  return (
    <div className="std-areachart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="std-chart-svg"
        role="img"
        aria-label="Attendance trajectory trend chart"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${uid}-gradient`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="70%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor={color} floodOpacity="0.55" />
          </filter>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} className="std-chart-grid" />
            <text x={pad.l - 10} y={yAt(t) + 4} textAnchor="end" className="std-chart-tick">
              {t}%
            </text>
          </g>
        ))}

        {area && <path d={area} fill={`url(#${uid}-gradient)`} />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${uid}-glow)`}
          />
        )}

        {pts.map((p, i) => {
          const isAct = hover === i;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isAct ? 6 : 3.5}
                fill={isAct ? "#FFFFFF" : color}
                stroke={color}
                strokeWidth="2"
                className="std-chart-pt"
              />
              {i % labelEvery === 0 && (
                <text x={p.x} y={H - 10} textAnchor="middle" className="std-chart-label">
                  {data[i].label}
                </text>
              )}
            </g>
          );
        })}

        {hp && (
          <line
            x1={hp.x}
            x2={hp.x}
            y1={pad.t}
            y2={pad.t + ih}
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        )}
      </svg>

      {hp && (
        <div
          className="std-chart-tooltip"
          style={{
            left: `${(hp.x / W) * 100}%`,
            top: `${(hp.y / H) * 100}%`
          }}
        >
          <strong>{data[hover].label}</strong>
          <span>
            {data[hover].value}
            {unit}
          </span>
        </div>
      )}
    </div>
  );
}

function InteractiveBarChart({ data, color = "#818CF8", unit = "pts" }) {
  const [hover, setHover] = useState(null);
  const W = 620;
  const H = 230;
  const pad = { l: 45, r: 20, t: 20, b: 35 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;
  const maxVal = Math.max(100, ...data.map((d) => d.value));

  const barWidth = Math.max(18, Math.min(48, (iw / (n || 1)) * 0.62));
  const slotWidth = iw / (n || 1);

  return (
    <div className="std-barchart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="std-chart-svg" role="img" aria-label="Marks distribution chart">
        {[0, 25, 50, 75, 100].map((t) => {
          const y = pad.t + ih - (t / 100) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="std-chart-grid" />
              <text x={pad.l - 10} y={y + 4} textAnchor="end" className="std-chart-tick">
                {t}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = (clamp(d.value, 0, maxVal) / maxVal) * ih;
          const x = pad.l + i * slotWidth + (slotWidth - barWidth) / 2;
          const y = pad.t + ih - barH;
          const isAct = hover === i;

          return (
            <g
              key={i}
              className="std-bar-column"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="5"
                fill={isAct ? "#38BDF8" : color}
                className="std-bar-rect"
              />
              <text x={x + barWidth / 2} y={H - 10} textAnchor="middle" className="std-chart-label">
                {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="std-chart-tooltip"
          style={{
            left: `${((pad.l + hover * slotWidth + slotWidth / 2) / W) * 100}%`,
            top: `${((pad.t + ih - (data[hover].value / maxVal) * ih) / H) * 100}%`
          }}
        >
          <strong>{data[hover].label}</strong>
          <span>
            {data[hover].value} {unit}
          </span>
        </div>
      )}
    </div>
  );
}

function CircularDonutGauge({ percentage = 85, size = 135, stroke = 11, label = "AICTE Verified", color = "#38BDF8" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamp(percentage) / 100) * circ;

  return (
    <div className="std-donut-widget" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="std-donut-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="std-donut-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="std-donut-fill"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="std-donut-text">
        <span className="std-donut-val">
          <AnimatedCounter value={percentage} suffix="%" />
        </span>
        <span className="std-donut-lbl">{label}</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   VESSA SPARKLINE MINI WAVE
   ========================================================================== */

function Sparkline({ data = [30, 45, 38, 55, 48, 62, 58, 75, 70, 85], color = "#3B82F6", height = 36, width = 120 }) {
  const uid = useUid();
  const pts = useMemo(() => {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 4;
    const h = height - pad * 2;
    return data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * (width - pad * 2),
      y: pad + h - ((v - min) / range) * h
    }));
  }, [data, height, width]);

  const path = useMemo(() => smoothPath(pts), [pts]);
  const area = useMemo(() => {
    if (pts.length < 2) return "";
    return `${path} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;
  }, [path, pts, height]);

  if (pts.length < 2) return null;

  return (
    <div className="std-sparkline-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="std-sparkline-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-spark-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill={`url(#${uid}-spark-grad)`} />}
        {path && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}

/* ==========================================================================
   BOGDAN NIKITIN / NIXTIO RADIAL GAUGE (180 DEG ARC + STATUS LIST)
   ========================================================================== */

function NixtioRadialGauge({
  percentage = 88.5,
  categories = [
    { label: "Theory Lectures", value: "92.4%", color: "#FF7A00" },
    { label: "Lab Practicals", value: "86.0%", color: "#3B82F6" },
    { label: "Internal Assessment", value: "90.5%", color: "#10B981" },
    { label: "Tutorial & Viva", value: "84.0%", color: "#8B93FF" }
  ],
  isCompliant = true
}) {
  const uid = useUid();
  const radius = 72;
  const stroke = 12;
  const cx = 95;
  const cy = 92;
  const arcLength = Math.PI * radius;
  const offset = arcLength - (clamp(percentage, 0, 100) / 100) * arcLength;

  return (
    <div className="std-nixtio-gauge-container">
      <div className="std-nixtio-gauge-left">
        <div className="std-nixtio-arc-wrap">
          <svg viewBox="0 0 190 115" className="std-nixtio-arc-svg" aria-hidden="true">
            <defs>
              <linearGradient id={`${uid}-arc-grad`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B93FF" />
              </linearGradient>
            </defs>
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="var(--track)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke={`url(#${uid}-arc-grad)`}
              strokeWidth={stroke}
              strokeDasharray={arcLength}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="std-nixtio-arc-fill"
            />
          </svg>
          <div className="std-nixtio-arc-center">
            <span className="std-nixtio-arc-val">
              <AnimatedCounter value={percentage} suffix="%" />
            </span>
            <span className="std-nixtio-arc-lbl">Statutory Cadence</span>
            <span className={`std-nixtio-arc-pill ${isCompliant ? "good" : "warn"}`}>
              {isCompliant ? "AICTE Verified" : "Shortage Warning"}
            </span>
          </div>
        </div>
      </div>

      <div className="std-nixtio-gauge-right">
        <div className="std-nixtio-period-row">
          <span className="std-nixtio-breakdown-title">Cadence Breakdown</span>
          <span className="std-nixtio-term-chip">This Term</span>
        </div>
        <div className="std-nixtio-cat-list">
          {categories.map((cat, idx) => (
            <div key={idx} className="std-nixtio-cat-item">
              <div className="std-nixtio-cat-info">
                <span className="std-nixtio-dot" style={{ backgroundColor: cat.color }} />
                <span className="std-nixtio-cat-name">{cat.label}</span>
              </div>
              <span className="std-nixtio-cat-val">{cat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VESSA FAN GAUGE (STRIPED RADIAL ARC NEEDLES)
   ========================================================================== */

function VessaFanGauge({
  percentage = 85,
  title = "Syllabus & Degree Progress",
  credits = "84 / 120 Credits",
  semester = "5th Semester (CSE)"
}) {
  const totalTicks = 36;
  const activeTicks = Math.round((clamp(percentage, 0, 100) / 100) * totalTicks);
  const cx = 120;
  const cy = 112;
  const innerR = 68;
  const outerR = 94;

  const ticks = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalTicks; i++) {
      const ratio = i / (totalTicks - 1);
      const angle = Math.PI + ratio * Math.PI;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x1 = cx + innerR * cos;
      const y1 = cy + innerR * sin;
      const x2 = cx + outerR * cos;
      const y2 = cy + outerR * sin;
      const isActive = i < activeTicks;
      const hue = 145 + ratio * 85;
      const color = isActive ? `hsl(${hue}, 88%, 52%)` : "var(--track)";
      list.push({ id: i, x1, y1, x2, y2, isActive, color });
    }
    return list;
  }, [totalTicks, activeTicks, cx, cy, innerR, outerR]);

  return (
    <div className="std-vessa-fan-container">
      <div className="std-vessa-fan-chart-wrap">
        <svg viewBox="0 0 240 130" className="std-vessa-fan-svg" aria-hidden="true">
          {ticks.map((t) => (
            <line
              key={t.id}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.color}
              strokeWidth="2.8"
              strokeLinecap="round"
              className={t.isActive ? "std-fan-tick-active" : "std-fan-tick-idle"}
            />
          ))}
        </svg>
        <div className="std-vessa-fan-center">
          <span className="std-vessa-fan-val">
            <AnimatedCounter value={percentage} suffix="%" />
          </span>
          <span className="std-vessa-fan-lbl">{title}</span>
        </div>
      </div>
      <div className="std-vessa-fan-footer">
        <div className="std-vessa-fan-meta-item">
          <span className="meta-k">Degree Credits</span>
          <span className="meta-v">{credits}</span>
        </div>
        <div className="std-vessa-fan-divider" />
        <div className="std-vessa-fan-meta-item">
          <span className="meta-k">Standing</span>
          <span className="meta-v text-emerald">{semester}</span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   BOGDAN NIKITIN / NIXTIO MULTI-WAVE ORGANIC AREA CHART
   ========================================================================== */

function NixtioWaveAreaChart({
  data = [
    { label: "W1 Oct", value: 88, practical: 84 },
    { label: "W2 Oct", value: 92, practical: 86 },
    { label: "W3 Oct", value: 90, practical: 85 },
    { label: "W4 Oct", value: 95, practical: 89 },
    { label: "W1 Nov", value: 91, practical: 87 },
    { label: "W2 Nov", value: 89, practical: 85 }
  ],
  unit = "%",
  yMax = 100
}) {
  const uid = useUid();
  const [hover, setHover] = useState(null);

  const W = 620;
  const H = 220;
  const pad = { l: 40, r: 25, t: 25, b: 35 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;

  const xAt = (i) => pad.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
  const yAt = (v) => pad.t + ih - (clamp(v, 0, yMax) / yMax) * ih;

  const theoryPts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }));
  const practicalPts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.practical || d.value * 0.92) }));

  const theoryLine = smoothPath(theoryPts);
  const practicalLine = smoothPath(practicalPts);

  const theoryArea =
    theoryPts.length > 1
      ? `${theoryLine} L${theoryPts[theoryPts.length - 1].x},${pad.t + ih} L${theoryPts[0].x},${pad.t + ih} Z`
      : "";
  const practicalArea =
    practicalPts.length > 1
      ? `${practicalLine} L${practicalPts[practicalPts.length - 1].x},${pad.t + ih} L${practicalPts[0].x},${pad.t + ih} Z`
      : "";

  const ticks = [0, 25, 50, 75, 100];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    theoryPts.forEach((p, i) => {
      const dist = Math.abs(p.x - rel);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? theoryPts[hover] : null;

  return (
    <div className="std-nixtio-wave-wrap">
      <div className="std-nixtio-wave-top-stats">
        <div className="std-nixtio-mini-stat">
          <span className="mini-stat-lbl">Logged Attendance</span>
          <strong className="mini-stat-val text-emerald">88.5%</strong>
        </div>
        <div className="std-nixtio-mini-stat">
          <span className="mini-stat-lbl">Active Streak</span>
          <strong className="mini-stat-val text-cyan">14 Days</strong>
        </div>
        <div className="std-nixtio-mini-stat">
          <span className="mini-stat-lbl">Statutory Minimum</span>
          <strong className="mini-stat-val">75.0%</strong>
        </div>
        <div className="std-nixtio-wave-legend">
          <span className="legend-chip theory">
            <span className="dot" /> Theory
          </span>
          <span className="legend-chip practical">
            <span className="dot" /> Practical
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="std-chart-svg std-nixtio-wave-svg"
        role="img"
        aria-label="Interactive Attendance Trajectory Waves"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${uid}-theory-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.38" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`${uid}-practical-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B93FF" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#6366F1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.45" />
          </filter>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} className="std-chart-grid" />
            <text x={pad.l - 8} y={yAt(t) + 4} textAnchor="end" className="std-chart-tick">
              {t}%
            </text>
          </g>
        ))}

        {practicalArea && <path d={practicalArea} fill={`url(#${uid}-practical-grad)`} />}
        {practicalLine && (
          <path
            d={practicalLine}
            fill="none"
            stroke="#8B93FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 3"
            opacity="0.85"
          />
        )}

        {theoryArea && <path d={theoryArea} fill={`url(#${uid}-theory-grad)`} />}
        {theoryLine && (
          <path
            d={theoryLine}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${uid}-glow)`}
          />
        )}

        {theoryPts.map((p, i) => {
          const isAct = hover === i;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isAct ? 6 : 3.8}
                fill={isAct ? "#FFFFFF" : "#3B82F6"}
                stroke="#2563EB"
                strokeWidth="2"
                className="std-chart-pt"
              />
              <text x={p.x} y={H - 12} textAnchor="middle" className="std-chart-label">
                {data[i].label}
              </text>
            </g>
          );
        })}

        {hp && (
          <line
            x1={hp.x}
            x2={hp.x}
            y1={pad.t}
            y2={pad.t + ih}
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.9"
          />
        )}
      </svg>

      {hp && hover !== null && (
        <div
          className="std-nixtio-tooltip"
          style={{
            left: `${(hp.x / W) * 100}%`,
            top: `${(hp.y / H) * 100}%`
          }}
        >
          <div className="std-nixtio-tooltip-head">
            <span className="tooltip-title">{data[hover].label}</span>
            <span className="tooltip-delta">▲ +1.5%</span>
          </div>
          <div className="std-nixtio-tooltip-metrics">
            <div className="metric-row">
              <span className="dot dot-theory" />
              <span className="name">Theory:</span>
              <strong className="val">{data[hover].value}%</strong>
            </div>
            <div className="metric-row">
              <span className="dot dot-practical" />
              <span className="name">Practical:</span>
              <strong className="val">{data[hover].practical || Math.round(data[hover].value * 0.92)}%</strong>
            </div>
          </div>
        </div>
      )}

      <div className="std-nixtio-milestones-row">
        {data.map((d, i) => (
          <div key={i} className={`std-nixtio-milestone-chip ${hover === i ? "active" : ""}`}>
            <span>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   VESSA MULTI-COLUMN GROUPED BAR CHART & POPOVER CARD
   ========================================================================== */

function VessaBarChart({
  data = [
    { subject: "Operating Systems", midterm: 94, lab: 90, internal: 92, grade: "O" },
    { subject: "Computer Networks", midterm: 88, lab: 84, internal: 89, grade: "A+" },
    { subject: "Database Systems", midterm: 91, lab: 94, internal: 93, grade: "O" },
    { subject: "Cloud Computing", midterm: 85, lab: 82, internal: 86, grade: "A" },
    { subject: "Software Engineering", midterm: 80, lab: 78, internal: 82, grade: "B+" }
  ]
}) {
  const [hoverIndex, setHoverIndex] = useState(0);

  const W = 620;
  const H = 230;
  const pad = { l: 40, r: 20, t: 25, b: 35 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;
  const slotW = iw / (n || 1);
  const barW = 8;
  const groupGap = 4;
  const yMax = 100;

  const yAt = (v) => pad.t + ih - (clamp(v, 0, yMax) / yMax) * ih;
  const activeSubject = data[hoverIndex] || data[0];

  return (
    <div className="std-vessa-barchart-container">
      <div className="std-vessa-chart-topbar">
        <div className="std-vessa-legend-group">
          <span className="std-vessa-legend-item">
            <span className="dot dot-midterm" /> Midterm Exam
          </span>
          <span className="std-vessa-legend-item">
            <span className="dot dot-lab" /> Lab Practical
          </span>
          <span className="std-vessa-legend-item">
            <span className="dot dot-internal" /> Continuous Assessment
          </span>
        </div>
        <div className="std-vessa-period-pill">Semester 5 Marks</div>
      </div>

      <div className="std-vessa-chart-main">
        <svg viewBox={`0 0 ${W} ${H}`} className="std-chart-svg std-vessa-bars-svg" aria-label="Grouped Marks Chart">
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} className="std-chart-grid" />
              <text x={pad.l - 8} y={yAt(t) + 4} textAnchor="end" className="std-chart-tick">
                {t}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const centerX = pad.l + i * slotW + slotW / 2;
            const x1 = centerX - barW * 1.5 - groupGap;
            const x2 = centerX - barW / 2;
            const x3 = centerX + barW / 2 + groupGap;

            const h1 = (clamp(d.midterm, 0, yMax) / yMax) * ih;
            const h2 = (clamp(d.lab, 0, yMax) / yMax) * ih;
            const h3 = (clamp(d.internal, 0, yMax) / yMax) * ih;

            const isAct = hoverIndex === i;

            return (
              <g
                key={i}
                className={`std-vessa-bar-group ${isAct ? "active" : ""}`}
                onPointerEnter={() => setHoverIndex(i)}
                cursor="pointer"
              >
                <rect
                  x={pad.l + i * slotW + 4}
                  y={pad.t}
                  width={slotW - 8}
                  height={ih}
                  rx="8"
                  className="std-vessa-group-bg"
                />

                <rect
                  x={x1}
                  y={pad.t + ih - h1}
                  width={barW}
                  height={h1}
                  rx="4"
                  className="std-vessa-bar bar-midterm"
                />

                <rect
                  x={x2}
                  y={pad.t + ih - h2}
                  width={barW}
                  height={h2}
                  rx="4"
                  className="std-vessa-bar bar-lab"
                />

                <rect
                  x={x3}
                  y={pad.t + ih - h3}
                  width={barW}
                  height={h3}
                  rx="4"
                  className="std-vessa-bar bar-internal"
                />

                <text x={centerX} y={H - 12} textAnchor="middle" className="std-chart-label">
                  {d.subject.length > 10 ? `${d.subject.slice(0, 9)}…` : d.subject}
                </text>
              </g>
            );
          })}
        </svg>

        {activeSubject && (
          <div
            className="std-vessa-popover-card"
            style={{
              left: `${((pad.l + hoverIndex * slotW + slotW / 2) / W) * 100}%`,
              top: "12%"
            }}
          >
            <div className="std-vessa-popover-title">
              <span>{activeSubject.subject}</span>
              <span className="grade-badge">{activeSubject.grade}</span>
            </div>
            <div className="std-vessa-popover-rows">
              <div className="popover-row">
                <span className="dot dot-midterm" />
                <span className="name">Midterm:</span>
                <strong className="val">{activeSubject.midterm}/100</strong>
              </div>
              <div className="popover-row">
                <span className="dot dot-lab" />
                <span className="name">Lab Practical:</span>
                <strong className="val">{activeSubject.lab}/100</strong>
              </div>
              <div className="popover-row">
                <span className="dot dot-internal" />
                <span className="name">Assessment:</span>
                <strong className="val">{activeSubject.internal}/100</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   DIGITAL STUDENT ID CARD MODAL (OFFICIAL SVSU TEMPLATE)
   ========================================================================== */

function DigitalIdCardModal({ student, onClose }) {
  const cardRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="std-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Digital Student ID Card">
      <div className="std-modal-shell id-card-shell" onClick={(e) => e.stopPropagation()}>
        <div className="std-modal-header-strip">
          <div className="std-modal-title-row">
            <Sparkles size={16} className="std-icon-cyan" />
            <h3>Official Digital Student Identity</h3>
          </div>
          <button type="button" className="std-modal-close-btn" onClick={onClose} aria-label="Close ID card">
            <X size={16} />
          </button>
        </div>

        <div className="std-idcard-canvas" ref={cardRef}>
          {/* Card Header */}
          <div className="idcard-header">
            <div className="idcard-logo-badge">
              <Building2 size={22} className="idcard-logo-icon" />
            </div>
            <div className="idcard-inst-text">
              <h4>Swami Vivekanand Subharti University</h4>
              <p>Faculty of Engineering & Technology • Subharti Polytechnic</p>
              <span className="idcard-affil">UGC & AICTE Approved Institutional Pass</span>
            </div>
          </div>

          <div className="idcard-body">
            <div className="idcard-photo-col">
              <div className="idcard-avatar-wrap">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt={student.name} className="idcard-avatar-img" />
                ) : (
                  <div className="idcard-avatar-fallback">{student.initials}</div>
                )}
                <div className="idcard-verified-hologram" title="Digitally Authenticated Credentials">
                  <ShieldCheck size={14} />
                </div>
              </div>
              <div className="idcard-role-chip">STUDENT SCHOLAR</div>
            </div>

            <div className="idcard-details-col">
              <h2 className="idcard-name">{student.name}</h2>
              <p className="idcard-branch">
                <strong>{student.branch}</strong> ({student.academicYear})
              </p>

              <div className="idcard-meta-grid">
                <div className="idcard-meta-item">
                  <span className="meta-k">Enrollment No</span>
                  <span className="meta-v">{student.enrollmentNo}</span>
                </div>
                <div className="idcard-meta-item">
                  <span className="meta-k">Roll Number</span>
                  <span className="meta-v">{student.rollNo}</span>
                </div>
                <div className="idcard-meta-item">
                  <span className="meta-k">Current Semester</span>
                  <span className="meta-v">{student.semester}</span>
                </div>
                <div className="idcard-meta-item">
                  <span className="meta-k">Academic Session</span>
                  <span className="meta-v">2024–2027</span>
                </div>
                <div className="idcard-meta-item">
                  <span className="meta-k">Blood Group</span>
                  <span className="meta-v">O+ (Verified)</span>
                </div>
                <div className="idcard-meta-item">
                  <span className="meta-k">Emergency Contact</span>
                  <span className="meta-v">+91 98765 43210</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode & Security Stripe */}
          <div className="idcard-footer-strip">
            <div className="idcard-barcode-wrap">
              <div className="idcard-simulated-barcode" />
              <span className="idcard-barcode-digits">{student.enrollmentNo || "202427"}*SVSU*ERP</span>
            </div>
            <div className="idcard-seal">
              <div className="idcard-seal-icon">
                <CheckCircle2 size={16} />
              </div>
              <div className="idcard-seal-text">
                <strong>REGISTRAR AUTHORIZED</strong>
                <small>Valid Campus Pass</small>
              </div>
            </div>
          </div>
        </div>

        <div className="std-modal-actions-bar">
          <button type="button" className="std-btn-secondary" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Official ID</span>
          </button>
          <button type="button" className="std-btn-primary" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   QUICK LEAVE APPLICATION MODAL
   ========================================================================== */

function ApplyLeaveModal({ onClose, onSuccess }) {
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please specify start date, end date, and reason for leave.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await authApi.applyLeave({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim()
      });
      onSuccess("Leave application submitted to Dean & HOD for review.");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="std-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Apply for Leave">
      <div className="std-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="std-modal-header-strip">
          <div className="std-modal-title-row">
            <Calendar size={16} className="std-icon-amber" />
            <h3>Apply for Formal Leave of Absence</h3>
          </div>
          <button type="button" className="std-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="std-modal-form">
          {error && (
            <div className="std-form-alert error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="std-form-field">
            <label>Leave Category</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option value="Medical Leave">Medical Leave (Doctor's Note)</option>
              <option value="Academic Leave">Academic / Competition Leave</option>
              <option value="Personal / Family">Personal / Family Emergency</option>
              <option value="Special Duty">Subharti Institutional Duty</option>
            </select>
          </div>

          <div className="std-form-row">
            <div className="std-form-field">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="std-form-field">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="std-form-field">
            <label>Detailed Academic Reason & Supporting Context</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for your absence and how coursework will be caught up..."
              required
            />
          </div>

          <div className="std-modal-actions-bar">
            <button type="button" className="std-btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="std-btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit to HOD & Dean"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   HALL TICKET / ADMIT CARD PREVIEW MODAL
   ========================================================================== */

function AdmitCardModal({ student, onClose }) {
  return createPortal(
    <div className="std-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Hall Ticket">
      <div className="std-modal-shell admit-card-shell" onClick={(e) => e.stopPropagation()}>
        <div className="std-modal-header-strip">
          <div className="std-modal-title-row">
            <Award size={16} className="std-icon-violet" />
            <h3>Polytechnic Semester Examination Hall Ticket</h3>
          </div>
          <button type="button" className="std-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="std-admit-card-preview">
          <div className="admit-head">
            <Building2 size={24} className="admit-crest" />
            <div>
              <h4>Swami Vivekanand Subharti University</h4>
              <p>Office of the Controller of Examinations • Polytechnic Board</p>
              <strong>ADMIT CARD — END SEMESTER EXAMINATIONS 2025</strong>
            </div>
          </div>

          <div className="admit-cand-info">
            <div className="cand-item"><span>Student Name:</span> <strong>{student.name}</strong></div>
            <div className="cand-item"><span>Roll No:</span> <strong>{student.rollNo}</strong></div>
            <div className="cand-item"><span>Enrollment No:</span> <strong>{student.enrollmentNo}</strong></div>
            <div className="cand-item"><span>Branch / Sem:</span> <strong>{student.branch} ({student.semester})</strong></div>
            <div className="cand-item"><span>Exam Center:</span> <strong>Academic Block C, Hall 204</strong></div>
            <div className="cand-item"><span>Reporting Time:</span> <strong>09:15 AM IST</strong></div>
          </div>

          <table className="admit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject Code</th>
                <th>Subject Title</th>
                <th>Session</th>
                <th>Invigilator</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>18 Nov 2026</td>
                <td>CS-501</td>
                <td>Operating Systems & Linux Architecture</td>
                <td>Morning (10:00 - 01:00)</td>
                <td>Verified</td>
              </tr>
              <tr>
                <td>21 Nov 2026</td>
                <td>CS-502</td>
                <td>Relational Database Management Systems</td>
                <td>Morning (10:00 - 01:00)</td>
                <td>Verified</td>
              </tr>
              <tr>
                <td>24 Nov 2026</td>
                <td>CS-503</td>
                <td>Computer Networks & TCP/IP Protocols</td>
                <td>Morning (10:00 - 01:00)</td>
                <td>Verified</td>
              </tr>
            </tbody>
          </table>

          <div className="admit-footer-note">
            <p><strong>Important Candidate Instructions:</strong></p>
            <ul>
              <li>Candidates must display both this printed Hall Ticket and physical College ID Card.</li>
              <li>Electronic gadgets, smartwatches, and programmable devices are strictly prohibited in the exam hall.</li>
            </ul>
          </div>
        </div>

        <div className="std-modal-actions-bar">
          <button type="button" className="std-btn-secondary" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Print Hall Ticket</span>
          </button>
          <button type="button" className="std-btn-primary" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   SCROLL REVEAL & TOAST HOOKS
   ========================================================================== */

export function useReveal() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, seen] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`std-reveal ${seen ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = "good") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, push };
}

export function ToastHost({ toasts }) {
  return (
    <div className="std-toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`std-toast ${t.tone || "good"}`}>
          <CheckCircle2 size={15} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   MAIN STUDENT DASHBOARD V2 COMPONENT (15 ERP SECTIONS)
   ========================================================================== */

export default function StudentDashboard({
  currentUser,
  stats,
  charts,
  onNavigate,
  setActiveTab
}) {
  const { theme: ctxTheme, toggleTheme } = useTheme();
  const [now, setNow] = useState(() => new Date());
  const [activeChartTab, setActiveChartTab] = useState("attendance");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);

  // Deep parallel data states from direct endpoints
  const [extraFees, setExtraFees] = useState(null);
  const [extraBooks, setExtraBooks] = useState(null);
  const [extraMaterials, setExtraMaterials] = useState(null);
  const [extraEvents, setExtraEvents] = useState(null);

  const { toasts, push: showToast } = useToast();

  // Clock ticker
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Sync data loader
  const loadExtraRecords = useCallback(() => {
    setIsRefreshing(true);
    return Promise.allSettled([
      authApi.getFees(),
      authApi.getMyIssuedBooks(),
      authApi.getMaterials(),
      authApi.getCalendarEvents()
    ])
      .then(([feeRes, libRes, matRes, calRes]) => {
        if (feeRes.status === "fulfilled") setExtraFees(feeRes.value?.fees || feeRes.value);
        if (libRes.status === "fulfilled") setExtraBooks(libRes.value?.issues || libRes.value?.issuedBooks);
        if (matRes.status === "fulfilled") setExtraMaterials(matRes.value?.materials);
        if (calRes.status === "fulfilled") setExtraEvents(calRes.value?.events);
      })
      .finally(() => setIsRefreshing(false));
  }, []);

  useEffect(() => {
    loadExtraRecords();
  }, [loadExtraRecords]);

  const handleSync = async () => {
    await loadExtraRecords();
    showToast("ERP records synchronized from MongoDB Atlas");
  };

  const handleNav = (tabKey) => {
    if (setActiveTab) setActiveTab(tabKey);
    else if (onNavigate) onNavigate(tabKey);
  };

  const handleKeyDownNav = (e, tabKey) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNav(tabKey);
    }
  };

  /* ---------- Derived Metrics & Database Merging ---------- */
  const summary = stats?.summary || stats?.stats || {};
  const studentName = currentUser?.fullName || summary.fullName || "Sonu Kumar";
  const firstName = studentName.split(" ")[0];
  const userInitials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = currentUser?.avatarUrl || summary.avatarUrl || null;
  const branchName = currentUser?.branch || summary.branch || "CSE";
  const semesterName = currentUser?.semester || summary.semester || "Semester 5";
  const academicYear = currentUser?.academicYear || summary.academicYear || "3rd Year";
  const enrollmentNo = currentUser?.enrollmentNo || summary.enrollmentNo || "202427";
  const rollNo = summary.rollNo || enrollmentNo;

  // Attendance
  const attendancePct = isNum(summary.attendancePercentage) ? summary.attendancePercentage : 85;
  const attendedLectures = isNum(summary.attendedLectures) ? summary.attendedLectures : 2;
  const totalLectures = isNum(summary.totalLectures) ? summary.totalLectures : 2;
  const presentCount = isNum(summary.presentCount) ? summary.presentCount : attendedLectures;
  const absentCount = isNum(summary.absentCount) ? summary.absentCount : 0;
  const leaveAttendanceCount = isNum(summary.leaveAttendanceCount) ? summary.leaveAttendanceCount : 0;
  const attendanceOk = attendancePct >= 75;
  const subjectAttendance = Array.isArray(stats?.subjectAttendance) ? stats.subjectAttendance : [];

  // Academic Results / GPA
  const sgpa = summary.sgpa || 8.65;
  const cgpa = summary.cgpa || 8.52;
  const avgMarks = summary.avgMarks || 84;
  const recentMarks = Array.isArray(stats?.recentMarks) ? stats.recentMarks : [];

  // Assignments
  const pendingAssignments = Array.isArray(stats?.pendingAssignments)
    ? stats.pendingAssignments
    : [];
  const pendingAssignmentsCount = isNum(summary.pendingAssignmentsCount)
    ? summary.pendingAssignmentsCount
    : pendingAssignments.length;
  const totalAssignmentsCount = isNum(summary.totalAssignmentsCount)
    ? summary.totalAssignmentsCount
    : (Array.isArray(stats?.allAssignments) ? stats.allAssignments.length : pendingAssignmentsCount);

  // Timetable
  const upcomingClasses = Array.isArray(stats?.upcomingClasses) ? stats.upcomingClasses : [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Fees
  const feeSummary = summary.feeSummary || {};
  const feeRecords = Array.isArray(stats?.feeRecords)
    ? stats.feeRecords
    : (Array.isArray(extraFees) ? extraFees : []);
  const dueAmount = feeSummary.dueAmount !== undefined ? feeSummary.dueAmount : 5500;
  const paidAmount = feeSummary.paidAmount !== undefined ? feeSummary.paidAmount : 31700;
  const totalFee = feeSummary.totalAmount !== undefined ? feeSummary.totalAmount : 37200;
  const feeStatus = feeSummary.status || (dueAmount === 0 ? "PAID" : "PENDING");
  const latestFeeRecord = feeSummary.latestRecord || feeRecords[0] || null;

  // Library
  const bookIssues = Array.isArray(stats?.bookIssues)
    ? stats.bookIssues
    : (Array.isArray(extraBooks) ? extraBooks : []);
  const librarySummary = summary.librarySummary || { issuedCount: bookIssues.length, overdueCount: 0 };

  // Study Materials & Video Lectures
  const studyNotes = Array.isArray(stats?.studyNotes) && stats.studyNotes.length > 0
    ? stats.studyNotes
    : (Array.isArray(stats?.notes) && stats.notes.length > 0
      ? stats.notes
      : (Array.isArray(extraMaterials) ? extraMaterials.filter((m) => m.type !== "video") : []));
  const videoLectures = Array.isArray(stats?.videoLectures)
    ? stats.videoLectures
    : (Array.isArray(extraMaterials) ? extraMaterials.filter((m) => m.type === "video") : []);

  // Notices & Notifications
  const notices = Array.isArray(stats?.notices) ? stats.notices : [];
  const notifications = Array.isArray(stats?.notifications) ? stats.notifications : [];

  // Leaves
  const leaveSummary = summary.leaveSummary || { total: 0, pending: 0, approved: 0, rejected: 0 };
  const leaveApplications = Array.isArray(stats?.leaveApplications) ? stats.leaveApplications : [];

  // Campus Events
  const calendarEvents = Array.isArray(stats?.calendarEvents)
    ? stats.calendarEvents
    : (Array.isArray(extraEvents) ? extraEvents : []);

  // Charts
  const attendanceTrendData = normalizeSeries(
    charts?.attendanceTrend?.length
      ? charts.attendanceTrend
      : [
          { label: "W1 (Oct)", value: 88 },
          { label: "W2 (Oct)", value: 92 },
          { label: "W3 (Oct)", value: 90 },
          { label: "W4 (Oct)", value: attendancePct }
        ]
  );

  const marksDistributionData = normalizeSeries(
    charts?.marksDistribution?.length
      ? charts.marksDistribution
      : [
          { label: "Operating Sys", value: 94 },
          { label: "Networks", value: 88 },
          { label: "DBMS", value: 91 },
          { label: "Cloud Comp", value: 85 },
          { label: "Software Eng", value: 79 }
        ]
  );

  const isLight = ctxTheme === "light";
  const dateFormatted = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const timeFormatted = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  /* Student Object for Modals */
  const studentData = {
    name: studentName,
    initials: userInitials,
    avatarUrl,
    branch: branchName,
    semester: semesterName,
    academicYear,
    enrollmentNo,
    rollNo
  };

  /* Loading State */
  if (!stats) {
    return (
      <div
        className={`student-dashboard ${isLight ? "theme-light" : "theme-dark"}`}
        data-student-theme={ctxTheme}
        aria-busy="true"
        aria-label="Loading student ERP dashboard"
      >
        <DashboardCustomCursor />
        <div className="std-hero-skeleton">
          <div className="std-sk-shimmer" style={{ height: 180, borderRadius: 18 }} />
        </div>
        <div className="std-stats-grid-skeleton">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="std-sk-shimmer" style={{ height: 135, borderRadius: 14 }} />
          ))}
        </div>
        <div className="std-main-grid-skeleton">
          <div className="std-sk-shimmer" style={{ height: 380, borderRadius: 16 }} />
          <div className="std-sk-shimmer" style={{ height: 380, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`student-dashboard ${isLight ? "theme-light" : "theme-dark"}`}
      data-student-theme={ctxTheme}
      role="region"
      aria-label="Student ERP Academic Command Center"
    >
      <DashboardCustomCursor />

      {/* Background Decorative Ambient Mesh */}
      <div className="std-ambient-mesh std-mesh-top-right" aria-hidden="true" />
      <div className="std-ambient-mesh std-mesh-bottom-left" aria-hidden="true" />

      {/* ================================================================== */}
      {/* SECTION 1: WELCOME & STUDENT IDENTITY HERO BANNER                  */}
      {/* ================================================================== */}
      <section className="std-hero-card" aria-label="Student Identity Banner">
        <div className="std-hero-glow-clip" aria-hidden="true">
          <div className="std-hero-ambient-glow" />
        </div>

        {/* Top Strip */}
        <div className="std-hero-top-strip">
          <div className="std-hero-date-pill">
            <span className="std-live-dot" title="Live real-time ERP sync" />
            <Calendar size={12} />
            <span>{dateFormatted}</span>
            <span className="std-hero-time-divider">•</span>
            <Clock size={12} />
            <span>{timeFormatted}</span>
          </div>

          <div className="std-hero-actions-pill-group">
            <div className="std-hero-inst-pill">
              <Building2 size={13} className="std-icon-cyan" />
              <span>Subharti University • CollegeOS Student ERP</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="std-bell-btn"
              onClick={() => handleNav("notifications")}
              aria-label={`Notifications, ${summary.unreadNotificationsCount || 0} unread`}
              title="Open Notification Feed"
            >
              <Bell size={14} />
              {(summary.unreadNotificationsCount > 0 || notifications.length > 0) && (
                <span className="std-bell-badge">
                  {summary.unreadNotificationsCount || notifications.length}
                </span>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="std-theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${isLight ? "Dark" : "Light"} Mode`}
              aria-label="Toggle institutional color theme"
            >
              {isLight ? <Moon size={13} /> : <Sun size={13} />}
            </button>

            {/* Sync Button */}
            <MagneticButton
              type="button"
              className={`std-sync-btn ${isRefreshing ? "spinning" : ""}`}
              onClick={handleSync}
              title="Synchronize ERP records with MongoDB Atlas"
            >
              <RefreshCw size={12} />
              <span>Sync</span>
            </MagneticButton>
          </div>
        </div>

        {/* Hero Main Content Row */}
        <div className="std-hero-main-row">
          <div className="std-hero-profile-cell">
            <div
              className="std-hero-avatar-wrap clickable"
              onClick={() => handleNav("profile")}
              onKeyDown={(e) => handleKeyDownNav(e, "profile")}
              role="button"
              tabIndex={0}
              title="View student profile & credentials"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={studentName} className="std-hero-avatar-img" />
              ) : (
                <div className="std-hero-avatar-fallback">{userInitials}</div>
              )}
              <span className="std-hero-status-beacon" title="Enrolled & Verified Student" />
            </div>

            <div className="std-hero-text">
              <div className="std-hero-greeting-row">
                <Sparkles size={14} className="std-sparkle-icon" />
                <span className="std-greeting-subtext">
                  Welcome back, {firstName}!
                </span>
                <span className="std-active-status-tag">
                  <ShieldCheck size={11} />
                  <span>Verified Scholar</span>
                </span>
              </div>
              <h1
                className="std-hero-name clickable"
                onClick={() => handleNav("profile")}
                onKeyDown={(e) => handleKeyDownNav(e, "profile")}
                role="button"
                tabIndex={0}
              >
                {studentName}
              </h1>
              <p className="std-hero-agenda-subtext">
                Here's your academic agenda today — <strong>{upcomingClasses.length || 4} lectures</strong> scheduled and <strong>{pendingAssignmentsCount} coursework tasks</strong> waiting on submission.
              </p>
              <p className="std-hero-academic-path">
                <GraduationCap size={13} className="std-icon-muted" />
                <span>
                  <strong>Department of {branchName}</strong> • {academicYear} ({semesterName}) • Roll:{" "}
                  <code className="std-code-badge">{rollNo}</code> • Enr:{" "}
                  <code className="std-code-badge">{enrollmentNo}</code>
                </span>
              </p>
            </div>
          </div>

          {/* Vessa Quick Action Pills */}
          <div className="std-vessa-actions-group">
            <button
              type="button"
              className="std-vessa-btn-primary"
              onClick={() => handleNav("assignments")}
              title="Submit Coursework Tasks"
            >
              <Plus size={14} />
              <span>Submit Task</span>
            </button>
            <button
              type="button"
              className="std-vessa-btn-outline"
              onClick={() => setShowIdCardModal(true)}
              title="View Official Digital Student ID Card"
            >
              <QrCode size={13} />
              <span>Digital ID</span>
            </button>
            <button
              type="button"
              className="std-vessa-btn-outline"
              onClick={() => setShowAdmitCardModal(true)}
              title="Download Examination Hall Ticket"
            >
              <FileBadge size={13} />
              <span>Admit Card</span>
            </button>
            <button
              type="button"
              className="std-vessa-btn-outline"
              onClick={() => setShowLeaveModal(true)}
              title="Submit Leave Application"
            >
              <FileText size={13} />
              <span>Apply Leave</span>
            </button>
            <button
              type="button"
              className="std-vessa-btn-outline"
              onClick={() => handleNav("profile")}
              title="Student Portfolio & Profile"
            >
              <User size={13} />
              <span>Profile</span>
            </button>
          </div>
        </div>

        {/* Hero Quick KPI Ribbon */}
        <div className="std-hero-quick-row">
          <MagneticButton
            type="button"
            className="std-hero-pill-btn"
            onClick={() => handleNav("attendance")}
          >
            <CalendarCheck2 size={13} className="std-icon-cyan" />
            <span>
              Attendance: <strong>{attendancePct}%</strong>
            </span>
            <span className={`std-pill-indicator ${attendanceOk ? "good" : "warn"}`}>
              {attendanceOk ? "Compliant" : "Shortage"}
            </span>
          </MagneticButton>

          <MagneticButton
            type="button"
            className="std-hero-pill-btn"
            onClick={() => handleNav("results")}
          >
            <Award size={13} className="std-icon-violet" />
            <span>
              Latest SGPA: <strong>{sgpa}</strong>
            </span>
            <span className="std-pill-indicator good">Distinction</span>
          </MagneticButton>

          <MagneticButton
            type="button"
            className="std-hero-pill-btn"
            onClick={() => handleNav("assignments")}
          >
            <FileText size={13} className="std-icon-amber" />
            <span>
              Assignments: <strong>{pendingAssignmentsCount} Pending</strong>
            </span>
          </MagneticButton>

          <MagneticButton
            type="button"
            className="std-hero-pill-btn"
            onClick={() => handleNav("fees")}
          >
            <CreditCard size={13} className="std-icon-blue" />
            <span>
              Fee Due: <strong>{dueAmount > 0 ? `₹${dueAmount.toLocaleString("en-IN")}` : "Cleared"}</strong>
            </span>
          </MagneticButton>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 2: SIX ACADEMIC OVERVIEW KPI CARDS                         */}
      {/* ================================================================== */}
      <section className="std-kpi-cards-grid" aria-label="Academic KPI Metrics">
        {/* KPI 1: Overall Attendance */}
        <div
          className="std-stat-card card-cyan clickable"
          onClick={() => handleNav("attendance")}
          onKeyDown={(e) => handleKeyDownNav(e, "attendance")}
          role="button"
          tabIndex={0}
        >
          <div className="std-card-top-row">
            <span className="std-card-label">Overall Attendance</span>
            <div className="std-card-icon-wrap cyan">
              <CalendarCheck2 size={17} />
            </div>
          </div>
          <div className="std-card-value-row">
            <span className="std-card-number">
              <AnimatedCounter value={attendancePct} suffix="%" />
            </span>
            <span className={`std-kpi-badge ${attendanceOk ? "good" : "warn"}`}>
              {attendanceOk ? "▲ +3.2%" : "▼ Shortage"}
            </span>
          </div>
          <div className="std-card-sparkline-row">
            <Sparkline data={[80, 84, 82, 86, 85, 89, 88, 92, 90, attendancePct]} color="#3B82F6" />
          </div>
          <span className="std-card-footer-sub">
            {attendedLectures} of {totalLectures} lectures logged ({presentCount} present)
          </span>
        </div>

        {/* KPI 2: Latest Semester SGPA */}
        <div
          className="std-stat-card card-violet clickable"
          onClick={() => handleNav("results")}
          onKeyDown={(e) => handleKeyDownNav(e, "results")}
          role="button"
          tabIndex={0}
        >
          <div className="std-card-top-row">
            <span className="std-card-label">Latest Semester SGPA</span>
            <div className="std-card-icon-wrap violet">
              <Award size={17} />
            </div>
          </div>
          <div className="std-card-value-row">
            <span className="std-card-number">{sgpa}</span>
            <span className="std-kpi-badge good">★ Top 5% Rank</span>
          </div>
          <div className="std-card-sparkline-row">
            <Sparkline data={[7.8, 8.1, 8.0, 8.3, 8.5, 8.4, 8.7, 8.8, 8.7, Number(sgpa) || 8.9]} color="#8B93FF" />
          </div>
          <span className="std-card-footer-sub">
            Continuous evaluations & midterm examinations
          </span>
        </div>

        {/* KPI 3: Overall CGPA */}
        <div
          className="std-stat-card card-emerald clickable"
          onClick={() => handleNav("results")}
          onKeyDown={(e) => handleKeyDownNav(e, "results")}
          role="button"
          tabIndex={0}
        >
          <div className="std-card-top-row">
            <span className="std-card-label">Cumulative CGPA</span>
            <div className="std-card-icon-wrap emerald">
              <GraduationCap size={17} />
            </div>
          </div>
          <div className="std-card-value-row">
            <span className="std-card-number">{cgpa}</span>
            <span className="std-kpi-badge good">Distinction</span>
          </div>
          <div className="std-card-sparkline-row">
            <Sparkline data={[7.9, 8.0, 8.2, 8.3, 8.4, 8.5, 8.6, 8.6, 8.7, Number(cgpa) || 8.65]} color="#10B981" />
          </div>
          <span className="std-card-footer-sub">
            Cumulative academic score across 5 semesters
          </span>
        </div>

        {/* KPI 4: Pending Coursework Assignments */}
        <div
          className="std-stat-card card-amber clickable"
          onClick={() => handleNav("assignments")}
          onKeyDown={(e) => handleKeyDownNav(e, "assignments")}
          role="button"
          tabIndex={0}
        >
          <div className="std-card-top-row">
            <span className="std-card-label">Coursework Tasks</span>
            <div className="std-card-icon-wrap amber">
              <FileText size={17} />
            </div>
          </div>
          <div className="std-card-value-row">
            <span className="std-card-number">
              <AnimatedCounter value={pendingAssignmentsCount} />
            </span>
            <span className={`std-kpi-badge ${pendingAssignmentsCount === 0 ? "good" : "warn"}`}>
              {pendingAssignmentsCount === 0 ? "All Done" : `${pendingAssignmentsCount} Due`}
            </span>
          </div>
          <div className="std-card-sparkline-row">
            <Sparkline data={[6, 5, 4, 6, 3, 4, 2, 3, 1, pendingAssignmentsCount]} color="#FF7A00" />
          </div>
          <span className="std-card-footer-sub">
            {totalAssignmentsCount - pendingAssignmentsCount} of {totalAssignmentsCount} submissions completed
          </span>
        </div>

        {/* KPI 5: Upcoming Examinations */}
        <div
          className="std-stat-card card-rose clickable"
          onClick={() => handleNav("exams")}
          onKeyDown={(e) => handleKeyDownNav(e, "exams")}
          role="button"
          tabIndex={0}
        >
          <div className="std-card-top-row">
            <span className="std-card-label">Upcoming Examinations</span>
            <div className="std-card-icon-wrap rose">
              <Clock size={17} />
            </div>
          </div>
          <div className="std-card-value-row">
            <span className="std-card-number-text">End-Sem 2026</span>
            <span className="std-kpi-badge good">Hall Ticket OK</span>
          </div>
          <div className="std-card-sparkline-row">
            <Sparkline data={[12, 18, 24, 30, 45, 60, 75, 85, 95, 100]} color="#F0524F" />
          </div>
          <span className="std-card-footer-sub">
            Next: Operating Systems & Linux Architecture
          </span>
        </div>

        {/* KPI 6: Fee Clearance Status */}
        <div
          className="std-stat-card card-blue clickable"
          onClick={() => handleNav("fees")}
          onKeyDown={(e) => handleKeyDownNav(e, "fees")}
          role="button"
          tabIndex={0}
        >
          <div className="std-card-top-row">
            <span className="std-card-label">Fee Clearance Status</span>
            <div className="std-card-icon-wrap blue">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="std-card-value-row">
            <span className="std-card-number-text">
              {dueAmount > 0 ? `₹${dueAmount.toLocaleString("en-IN")}` : "All Clear"}
            </span>
            <span className={`std-kpi-badge ${dueAmount === 0 ? "good" : "warn"}`}>
              {dueAmount === 0 ? "No Dues" : "Pending"}
            </span>
          </div>
          <div className="std-card-sparkline-row">
            <Sparkline data={[32000, 28000, 24000, 18000, 12000, 8000, 6000, 5500, dueAmount, dueAmount]} color="#3B82F6" />
          </div>
          <span className="std-card-footer-sub">
            {dueAmount === 0 ? "Full tuition settled for Semester 5" : `₹${paidAmount.toLocaleString("en-IN")} paid of ₹${totalFee.toLocaleString("en-IN")}`}
          </span>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2-COLUMN MAIN CONTENT WORKSPACE                                     */}
      {/* ================================================================== */}
      <div className="std-content-split-layout">
        {/* LEFT / PRIMARY COLUMN */}
        <div className="std-primary-column">
          {/* ============================================================== */}
          {/* SECTION 3: TODAY'S TIMETABLE & LIVE CLASS STREAM               */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Today's Timetable">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge emerald">
                  <Clock size={16} />
                </div>
                <div>
                  <h3>Today's Lecture & Lab Schedule</h3>
                  <small className="std-panel-subhead">
                    {dateFormatted} • Current Semester Timetable
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("timetable")}
              >
                <span>Full Timetable</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-schedule-list">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((cls, idx) => {
                  const s = toMinutes(cls.startTime);
                  const e = toMinutes(cls.endTime);
                  const isLive = s !== null && e !== null && nowMinutes >= s && nowMinutes < e;
                  const isCompleted = e !== null && nowMinutes >= e;

                  return (
                    <div
                      key={cls.id || cls._id || idx}
                      className={`std-schedule-item ${isLive ? "live" : ""} ${isCompleted ? "completed" : ""}`}
                    >
                      <div className="std-sched-time-col">
                        <span className="sched-start">{cls.startTime}</span>
                        <span className="sched-end">{cls.endTime}</span>
                        {isLive && (
                          <span className="sched-live-pill">
                            <Radio size={10} className="std-pulse" /> Live Now
                          </span>
                        )}
                        {isCompleted && (
                          <span className="sched-status-tag done">
                            <Check size={10} /> Completed
                          </span>
                        )}
                      </div>

                      <div className="std-sched-body-col">
                        <div className="std-sched-title-row">
                          <h4 className="sched-subject">{cls.subject}</h4>
                          <span className={`std-type-pill ${(cls.type || "Lecture").toLowerCase()}`}>
                            {cls.type || "Lecture"}
                          </span>
                        </div>
                        <div className="std-sched-meta-row">
                          <span className="sched-meta-item">
                            <User size={12} />
                            <span>{cls.teacherName || "Assigned Faculty"}</span>
                          </span>
                          <span className="sched-meta-item">
                            <MapPin size={12} />
                            <span>Room: {cls.roomNo || "Room 101"}</span>
                          </span>
                        </div>
                      </div>

                      <div className="std-sched-action-col">
                        <button
                          type="button"
                          className="std-sched-btn"
                          onClick={() => handleNav("attendance")}
                          title="View attendance record for this class"
                        >
                          <CalendarCheck2 size={12} />
                          <span>Attendance</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="std-empty-schedule-box">
                  <CheckCircle2 size={28} className="std-empty-icon text-emerald" />
                  <h4>No lectures scheduled for today</h4>
                  <p>All classes for today are either complete or scheduled on an alternate session.</p>
                  <button
                    type="button"
                    className="std-btn-secondary"
                    onClick={() => handleNav("timetable")}
                  >
                    Inspect Weekly Master Timetable
                  </button>
                </div>
              )}
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 4: ATTENDANCE ANALYTICS & RISK CALCULATOR             */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Attendance Analytics">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge cyan">
                  <CalendarCheck2 size={16} />
                </div>
                <div>
                  <h3>Attendance Analytics & Statutory Compliance</h3>
                  <small className="std-panel-subhead">
                    AICTE 75% Statutory Minimum • Multi-Wave Biometric Trajectory
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("attendance")}
              >
                <span>Full Attendance Log</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-analytics-content-grid">
              {/* Left: Bogdan Nikitin / Nixtio Multi-Wave Organic Area Chart */}
              <div className="std-chart-viewport">
                <NixtioWaveAreaChart
                  data={[
                    { label: "W1 Oct", value: 88, practical: 84 },
                    { label: "W2 Oct", value: 92, practical: 86 },
                    { label: "W3 Oct", value: 90, practical: 85 },
                    { label: "W4 Oct", value: 95, practical: 89 },
                    { label: "W1 Nov", value: 91, practical: 87 },
                    { label: "W2 Nov", value: attendancePct, practical: Math.round(attendancePct * 0.94) }
                  ]}
                  unit="%"
                  yMax={100}
                />
              </div>

              {/* Right: Bogdan Nikitin / Nixtio Radial Arc Gauge & Category Breakdown */}
              <div className="std-gauge-sidebar">
                <NixtioRadialGauge
                  percentage={attendancePct}
                  isCompliant={attendanceOk}
                  categories={[
                    { label: "Theory Lectures", value: `${Math.min(100, Math.round(attendancePct * 1.04))}%`, color: "#FF7A00" },
                    { label: "Lab Practicals", value: `${Math.round(attendancePct * 0.94)}%`, color: "#3B82F6" },
                    { label: "Continuous Internal", value: "92.0%", color: "#10B981" },
                    { label: "Seminar & Tutorial", value: "88.0%", color: "#8B93FF" }
                  ]}
                />
              </div>
            </div>

            {/* Subject-Wise Attendance Progress */}
            {subjectAttendance.length > 0 && (
              <div className="std-subject-attendance-strip">
                <h4 className="std-section-subheading">Subject-Wise Attendance Breakdown</h4>
                <div className="std-sub-att-grid">
                  {subjectAttendance.map((sub, idx) => (
                    <div key={idx} className="std-sub-att-card">
                      <div className="sub-att-top">
                        <strong className="sub-name">{sub.subject}</strong>
                        <span className={`sub-pct-pill ${sub.percentage >= 75 ? "good" : "warn"}`}>
                          {sub.percentage}%
                        </span>
                      </div>
                      <div className="sub-att-bar">
                        <div
                          className={`sub-att-fill ${sub.percentage >= 75 ? "cyan" : "warn"}`}
                          style={{ width: `${clamp(sub.percentage)}%` }}
                        />
                      </div>
                      <span className="sub-att-foot">
                        {sub.attended} of {sub.total} classes attended
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Shortfall / Attendance Improvement Calculator */}
            <AttendanceCalculator attended={attendedLectures} total={totalLectures} />
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 5: ACADEMIC PERFORMANCE & RESULTS                     */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Academic Performance">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge violet">
                  <Award size={16} />
                </div>
                <div>
                  <h3>Academic Performance & Continuous Marks</h3>
                  <small className="std-panel-subhead">
                    SGPA: {sgpa} • CGPA: {cgpa} • First Class Distinction
                  </small>
                </div>
              </div>
              <div className="std-chart-switcher" role="tablist">
                <button
                  type="button"
                  className={`std-switch-btn ${activeChartTab === "attendance" ? "active" : ""}`}
                  onClick={() => setActiveChartTab("attendance")}
                >
                  <TrendingUp size={12} />
                  <span>Grouped Evaluations</span>
                </button>
                <button
                  type="button"
                  className={`std-switch-btn ${activeChartTab === "performance" ? "active" : ""}`}
                  onClick={() => setActiveChartTab("performance")}
                >
                  <Award size={12} />
                  <span>Semester Progression</span>
                </button>
              </div>
            </div>

            <div className="std-analytics-content-grid std-perf-grid">
              {/* Left: Vessa Grouped Bar Chart with Interactive Popover */}
              <div className="std-chart-viewport">
                {activeChartTab === "attendance" ? (
                  <VessaBarChart
                    data={[
                      { subject: "Operating Systems", midterm: 94, lab: 90, internal: 92, grade: "O" },
                      { subject: "Computer Networks", midterm: 88, lab: 84, internal: 89, grade: "A+" },
                      { subject: "Database Systems", midterm: 91, lab: 94, internal: 93, grade: "O" },
                      { subject: "Cloud Computing", midterm: 85, lab: 82, internal: 86, grade: "A" },
                      { subject: "Software Engineering", midterm: 80, lab: 78, internal: 82, grade: "B+" }
                    ]}
                  />
                ) : (
                  <InteractiveAreaChart
                    data={[
                      { label: "Sem 1", value: 82 },
                      { label: "Sem 2", value: 84 },
                      { label: "Sem 3", value: 85 },
                      { label: "Sem 4", value: 87 },
                      { label: "Sem 5", value: Math.round(Number(sgpa || 8.65) * 10) }
                    ]}
                    color="#8B93FF"
                    unit=" pts"
                    yMax={100}
                  />
                )}
              </div>

              {/* Right: Vessa Fan Arc Gauge with Illuminated Needles */}
              <div className="std-gauge-sidebar">
                <VessaFanGauge
                  percentage={Math.round((Number(sgpa || 8.65) / 10) * 100)}
                  title="Degree & Syllabus Progress"
                  credits="84 / 120 Credits"
                  semester={`Semester 5 • ${branchName}`}
                />
              </div>
            </div>

            {/* Latest Results Table Preview */}
            <div className="std-results-preview-strip">
              <div className="std-results-head">
                <h4>Published Results & Evaluations</h4>
                <button
                  type="button"
                  className="std-panel-link-btn"
                  onClick={() => handleNav("results")}
                >
                  <span>View All Results</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="std-results-table-wrap">
                <table className="std-data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Assessment</th>
                      <th>Marks</th>
                      <th>Max</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMarks.length > 0 ? (
                      recentMarks.map((m, idx) => (
                        <tr key={idx}>
                          <td><strong>{m.subject}</strong></td>
                          <td>{m.examType || "Midterm Evaluation"}</td>
                          <td><span className="text-cyan font-bold">{m.marksObtained}</span></td>
                          <td>{m.maxMarks || 100}</td>
                          <td><span className="std-grade-badge">A+</span></td>
                          <td><span className="std-status-pill pass">Passed</span></td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td><strong>Operating Systems</strong></td>
                          <td>Midterm Evaluation</td>
                          <td><span className="text-cyan font-bold">94</span></td>
                          <td>100</td>
                          <td><span className="std-grade-badge">O</span></td>
                          <td><span className="std-status-pill pass">Passed</span></td>
                        </tr>
                        <tr>
                          <td><strong>Computer Networks</strong></td>
                          <td>Continuous Assessment</td>
                          <td><span className="text-cyan font-bold">88</span></td>
                          <td>100</td>
                          <td><span className="std-grade-badge">A+</span></td>
                          <td><span className="std-status-pill pass">Passed</span></td>
                        </tr>
                        <tr>
                          <td><strong>Database Management</strong></td>
                          <td>Laboratory Viva</td>
                          <td><span className="text-cyan font-bold">91</span></td>
                          <td>100</td>
                          <td><span className="std-grade-badge">O</span></td>
                          <td><span className="std-status-pill pass">Passed</span></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 6: ASSIGNMENTS & COURSEWORK TASK MANAGEMENT            */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Coursework Assignments">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge amber">
                  <FileText size={16} />
                </div>
                <div>
                  <h3>Coursework & Assignments Management</h3>
                  <small className="std-panel-subhead">
                    {pendingAssignmentsCount} pending submission{pendingAssignmentsCount === 1 ? "" : "s"}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("assignments")}
              >
                <span>View All ({totalAssignmentsCount})</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-assignment-list">
              {pendingAssignments.length > 0 ? (
                pendingAssignments.map((asgn, idx) => (
                  <div key={asgn.id || asgn._id || idx} className="std-asgn-row">
                    <div className="std-asgn-icon-box">
                      <FileText size={16} />
                    </div>
                    <div className="std-asgn-info">
                      <h4 className="asgn-title">{asgn.title}</h4>
                      <div className="asgn-sub-row">
                        <span className="asgn-sub">{asgn.subject}</span>
                        <span className="asgn-due">
                          <Clock size={11} /> Due:{" "}
                          {asgn.dueDate
                            ? new Date(asgn.dueDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short"
                              })
                            : "Upcoming"}
                        </span>
                        <span className="asgn-marks">Max: {asgn.maxMarks || 20} pts</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="std-asgn-submit-btn"
                      onClick={() => handleNav("assignments")}
                    >
                      <span>Submit Solution</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="std-asgn-all-caught-up">
                  <Check size={18} className="text-emerald" />
                  <span>All assigned coursework submissions are completed and graded.</span>
                </div>
              )}
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 7: STUDY MATERIALS & VIDEO LECTURES                    */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Study Materials & Lectures">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge blue">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3>Course Materials & Video Lectures</h3>
                  <small className="std-panel-subhead">
                    Department notes, lab manuals, and syllabus lectures
                  </small>
                </div>
              </div>
              <div className="std-dual-btn-group">
                <button
                  type="button"
                  className="std-panel-link-btn"
                  onClick={() => handleNav("notes")}
                >
                  <span>Notes</span>
                </button>
                <button
                  type="button"
                  className="std-panel-link-btn"
                  onClick={() => handleNav("lectures")}
                >
                  <span>Lectures</span>
                </button>
              </div>
            </div>

            <div className="std-dual-materials-grid">
              {/* Study Notes Widget */}
              <div className="std-materials-column">
                <div className="materials-col-header">
                  <BookOpen size={14} className="text-cyan" />
                  <strong>Study Notes & Lab Manuals</strong>
                </div>
                <div className="materials-stack">
                  {studyNotes.length > 0 ? (
                    studyNotes.slice(0, 3).map((mat, i) => (
                      <div key={mat.id || mat._id || i} className="std-material-item">
                        <div className="mat-icon-wrap">
                          <FileText size={14} />
                        </div>
                        <div className="mat-details">
                          <strong className="mat-title">{mat.title}</strong>
                          <span className="mat-meta">
                            {mat.subject} • {(mat.category || mat.type || "Notes").toUpperCase()}
                          </span>
                        </div>
                        {mat.fileUrl ? (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="std-mat-btn"
                            title="Download / Open file"
                          >
                            <Download size={13} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="std-mat-btn"
                            onClick={() => handleNav("notes")}
                          >
                            <Download size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="std-empty-mat">
                      <p>No study notes uploaded for this semester yet.</p>
                      <button
                        type="button"
                        className="std-btn-text"
                        onClick={() => handleNav("notes")}
                      >
                        Check Notes Repository
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Lectures Widget */}
              <div className="std-materials-column">
                <div className="materials-col-header">
                  <Video size={14} className="text-violet" />
                  <strong>Video Lectures & Demonstrations</strong>
                </div>
                <div className="materials-stack">
                  {videoLectures.length > 0 ? (
                    videoLectures.slice(0, 3).map((v, i) => (
                      <div key={v.id || v._id || i} className="std-material-item">
                        <div className="mat-icon-wrap violet">
                          <Video size={14} />
                        </div>
                        <div className="mat-details">
                          <strong className="mat-title">{v.title}</strong>
                          <span className="mat-meta">{v.subject} • Video Lecture</span>
                        </div>
                        {v.videoUrl ? (
                          <a
                            href={v.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="std-mat-btn"
                          >
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="std-mat-btn"
                            onClick={() => handleNav("lectures")}
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="std-empty-mat">
                      <p>Syllabus video classes updated weekly by faculty.</p>
                      <button
                        type="button"
                        className="std-btn-text"
                        onClick={() => handleNav("lectures")}
                      >
                        Browse Lecture Archive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* RIGHT / SECONDARY COLUMN */}
        <div className="std-secondary-column">
          {/* ============================================================== */}
          {/* SECTION 8: EXAMINATION CENTER & HALL TICKET                    */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Examination Center">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge rose">
                  <Award size={16} />
                </div>
                <div>
                  <h3>Examination Center & Datesheets</h3>
                  <small className="std-panel-subhead">End-Semester Examinations 2025</small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("exams")}
              >
                <span>Full Datesheet</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-admit-card-summary">
              <div className="std-admit-status-row">
                <div className="admit-status-badge">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Admit Card Cleared & Released</span>
                </div>
                <button
                  type="button"
                  className="std-btn-preview-admit"
                  onClick={() => setShowAdmitCardModal(true)}
                >
                  <Printer size={12} />
                  <span>Preview Hall Ticket</span>
                </button>
              </div>

              <div className="std-next-exam-box">
                <div className="next-exam-header">
                  <span className="exam-countdown-chip">Next Exam: 18 Nov</span>
                  <span className="exam-type-chip">Theory Paper</span>
                </div>
                <h4 className="next-exam-title">Operating Systems & Linux Architecture</h4>
                <div className="next-exam-meta">
                  <span>Room: Academic Block C, Hall 204</span>
                  <span>10:00 AM – 01:00 PM IST</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 9: FINANCIAL OVERVIEW & FEE LEDGER                    */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Financial Overview">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge blue">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3>Institutional Fee Ledger</h3>
                  <small className="std-panel-subhead">Session 2024–2025 Semester Dues</small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("fees")}
              >
                <span>Fee Ledger</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-fee-overview-box">
              <div className="fee-stat-row">
                <div className="fee-item">
                  <span className="k">Total Tuition</span>
                  <strong className="v">₹{totalFee.toLocaleString("en-IN")}</strong>
                </div>
                <div className="fee-item">
                  <span className="k">Total Paid</span>
                  <strong className="v text-emerald">₹{paidAmount.toLocaleString("en-IN")}</strong>
                </div>
                <div className="fee-item">
                  <span className="k">Pending Dues</span>
                  <strong className={`v ${dueAmount > 0 ? "text-rose" : "text-emerald"}`}>
                    ₹{dueAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {latestFeeRecord && (
                <div className="std-latest-invoice-card">
                  <div className="invoice-top">
                    <span className="invoice-type">{latestFeeRecord.feeType}</span>
                    <span className={`invoice-status ${latestFeeRecord.paymentStatus}`}>
                      {latestFeeRecord.paymentStatus?.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                  <div className="invoice-body">
                    <strong>₹{(latestFeeRecord.dueAmount || latestFeeRecord.totalAmount || 0).toLocaleString("en-IN")}</strong>
                    <small>
                      Due Date:{" "}
                      {latestFeeRecord.dueDate
                        ? new Date(latestFeeRecord.dueDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "17 Nov 2026"}
                    </small>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="std-btn-pay-now"
                onClick={() => handleNav("fees")}
              >
                <CreditCard size={14} />
                <span>Pay Dues Online & Download Receipts</span>
              </button>
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 10: NOTICES & CIRCULARS (CATEGORIZED)                  */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Official Circulars">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge amber">
                  <Bell size={16} />
                </div>
                <div>
                  <h3>Official Circulars & Directives</h3>
                  <small className="std-panel-subhead">
                    Institutional announcements & department notices
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("notices")}
              >
                <span>All Notices ({notices.length})</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-circulars-stack">
              {notices.length > 0 ? (
                notices.slice(0, 3).map((n, idx) => {
                  const isUrgent = n.priority === "urgent" || n.priority === "high";
                  return (
                    <article
                      key={n.id || n._id || idx}
                      className="std-circular-item clickable"
                      onClick={() => handleNav("notices")}
                      onKeyDown={(e) => handleKeyDownNav(e, "notices")}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="std-circular-head">
                        <span className={`std-circular-pill ${isUrgent ? "urgent" : "normal"}`}>
                          {n.category || "Official Circular"}
                        </span>
                        <span className="std-circular-date">
                          {n.date
                            ? new Date(n.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short"
                              })
                            : "Today"}
                        </span>
                      </div>
                      <h4 className="std-circular-title">{n.title}</h4>
                      <p className="std-circular-body">
                        {n.content
                          ? n.content.length > 95
                            ? `${n.content.slice(0, 95)}…`
                            : n.content
                          : "Official academic directive for enrolled scholars."}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="std-empty-circulars">
                  <CheckCircle2 size={24} className="std-empty-icon text-emerald" />
                  <h4>All Directives Read</h4>
                  <p>No new campus notices published today.</p>
                </div>
              )}
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 11: NOTIFICATION CENTER & ACTIVITY FEED               */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Recent Notifications">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge cyan">
                  <Bell size={16} />
                </div>
                <div>
                  <h3>Recent Notifications & Alerts</h3>
                  <small className="std-panel-subhead">
                    Personalized ERP communication stream
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("notifications")}
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-notifications-list">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif, idx) => (
                  <div key={notif.id || notif._id || idx} className="std-notif-item">
                    <div className="notif-dot" />
                    <div className="notif-content">
                      <strong className="notif-title">{notif.title}</strong>
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-time">
                        {notif.createdAt
                          ? new Date(notif.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short"
                            })
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="std-empty-notif">
                  <CheckCircle2 size={20} className="text-emerald" />
                  <span>You're completely caught up with all institutional notifications.</span>
                </div>
              )}
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 12: LIBRARY OVERVIEW & BORROWED BOOKS                 */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Library Overview">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge fuchsia">
                  <Library size={16} />
                </div>
                <div>
                  <h3>Central Library Borrowings</h3>
                  <small className="std-panel-subhead">
                    {librarySummary.issuedCount} active book borrowing{librarySummary.issuedCount === 1 ? "" : "s"}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => handleNav("library")}
              >
                <span>Search Catalog</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="std-library-issues-list">
              {bookIssues.length > 0 ? (
                bookIssues.slice(0, 2).map((b, idx) => (
                  <div key={b.id || b._id || idx} className="std-book-item">
                    <div className="book-icon-wrap">
                      <BookOpen size={15} />
                    </div>
                    <div className="book-info">
                      <strong className="book-title">{b.bookTitle}</strong>
                      <span className="book-due">
                        Due Return:{" "}
                        {b.dueDate
                          ? new Date(b.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })
                          : "15 Nov 2026"}
                      </span>
                    </div>
                    <span className="book-status-badge good">Issued</span>
                  </div>
                ))
              ) : (
                <div className="std-empty-library">
                  <BookOpen size={22} className="std-empty-icon" />
                  <p>No active books currently borrowed from central library.</p>
                  <button
                    type="button"
                    className="std-btn-secondary"
                    onClick={() => handleNav("library")}
                  >
                    Browse Central Catalog
                  </button>
                </div>
              )}
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 13: LEAVE & APPLICATION STATUS                        */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Leave Applications">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge emerald">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3>Leave of Absence & Clearance</h3>
                  <small className="std-panel-subhead">Formal absence records</small>
                </div>
              </div>
              <button
                type="button"
                className="std-panel-link-btn"
                onClick={() => setShowLeaveModal(true)}
              >
                <span>+ Apply Leave</span>
              </button>
            </div>

            <div className="std-leave-summary-box">
              <div className="leave-stats-row">
                <div className="leave-pill approved">
                  <span>Approved: <b>{leaveSummary.approved}</b></span>
                </div>
                <div className="leave-pill pending">
                  <span>Pending: <b>{leaveSummary.pending}</b></span>
                </div>
                <div className="leave-pill total">
                  <span>Total: <b>{leaveSummary.total}</b></span>
                </div>
              </div>

              {leaveApplications.length > 0 ? (
                <div className="std-latest-leave-item">
                  <div className="leave-meta">
                    <strong>{leaveApplications[0].leaveType}</strong>
                    <span className={`status-badge ${leaveApplications[0].status}`}>
                      {leaveApplications[0].status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="leave-reason">"{leaveApplications[0].reason}"</p>
                  <small className="leave-dates">
                    {leaveApplications[0].startDate
                      ? new Date(leaveApplications[0].startDate).toLocaleDateString("en-IN")
                      : ""}{" "}
                    to{" "}
                    {leaveApplications[0].endDate
                      ? new Date(leaveApplications[0].endDate).toLocaleDateString("en-IN")
                      : ""}
                  </small>
                </div>
              ) : (
                <div className="std-empty-leave">
                  <p>No active leave applications on record.</p>
                  <button
                    type="button"
                    className="std-btn-text"
                    onClick={() => setShowLeaveModal(true)}
                  >
                    Submit Leave Application
                  </button>
                </div>
              )}
            </div>
          </Reveal>

          {/* ============================================================== */}
          {/* SECTION 14: CAMPUS LIFE & ACADEMIC EVENTS                     */}
          {/* ============================================================== */}
          <Reveal as="section" className="std-panel-card" aria-label="Campus Life & Events">
            <div className="std-panel-header">
              <div className="std-panel-title-group">
                <div className="std-panel-icon-badge violet">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3>Campus Life & Opportunities</h3>
                  <small className="std-panel-subhead">
                    Workshops, hackathons, seminars, and sports
                  </small>
                </div>
              </div>
            </div>

            <div className="std-events-stack">
              {calendarEvents.length > 0 ? (
                calendarEvents.slice(0, 3).map((ev, i) => (
                  <div key={ev.id || ev._id || i} className="std-event-item">
                    <div className="event-date-chip">
                      <span className="d">
                        {ev.startDate ? new Date(ev.startDate).getDate() : i + 10}
                      </span>
                      <span className="m">
                        {ev.startDate
                          ? new Date(ev.startDate).toLocaleString("default", { month: "short" })
                          : "Nov"}
                      </span>
                    </div>
                    <div className="event-info">
                      <strong className="event-title">{ev.title}</strong>
                      <span className="event-meta">
                        {ev.category || "Academic"} • {ev.location || "Auditorium"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="std-empty-events">
                  <p>Subharti Annual Tech Fest & Hackathon registration opens soon.</p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 15: QUICK ACCESS HUB (14 COMMERCIAL ERP SHORTCUTS)         */}
      {/* ================================================================== */}
      <Reveal as="section" className="std-panel-card std-quick-hub" aria-label="Quick Access Hub">
        <div className="std-panel-header">
          <div className="std-panel-title-group">
            <div className="std-panel-icon-badge cyan">
              <Layers size={16} />
            </div>
            <div>
              <h3>Institutional Navigation Hub</h3>
              <small className="std-panel-subhead">
                Direct access to all 14 student academic modules
              </small>
            </div>
          </div>
        </div>

        <div className="std-quick-tools-grid">
          {NAV_ITEMS.map((t) => (
            <button
              key={t.key}
              type="button"
              className="std-tool-tile"
              onClick={() => handleNav(t.key)}
            >
              <div className="tool-icon-wrap cyan">
                <Bookmark size={15} />
              </div>
              <div className="tool-text">
                <strong>{t.label}</strong>
                <span>{t.hint}</span>
              </div>
            </button>
          ))}
        </div>
      </Reveal>

      {/* ================================================================== */}
      {/* FLOATING TOOLS & INTERACTIVE MODALS                                */}
      {/* ================================================================== */}
      <ToastHost toasts={toasts} />
      <BackToTop />
      <CommandPalette items={NAV_ITEMS} onSelect={handleNav} />

      {/* Modals */}
      {showIdCardModal && (
        <DigitalIdCardModal student={studentData} onClose={() => setShowIdCardModal(false)} />
      )}
      {showLeaveModal && (
        <ApplyLeaveModal
          onClose={() => setShowLeaveModal(false)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
      {showAdmitCardModal && (
        <AdmitCardModal student={studentData} onClose={() => setShowAdmitCardModal(false)} />
      )}
    </div>
  );
}

/* ==========================================================================
   ATTENDANCE SHORTFALL & IMPROVEMENT CALCULATOR COMPONENT
   ========================================================================== */

function AttendanceCalculator({ attended, total }) {
  const [miss, setMiss] = useState(0);
  const pct = total > 0 ? (attended / total) * 100 : 85;
  const canSkip = Math.max(0, Math.floor(attended / 0.75 - total));
  const needAttend = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  const projected = total + miss > 0 ? (attended / (total + miss)) * 100 : pct;
  const ok = projected >= 75;

  return (
    <div className="std-planner-box" aria-label="Attendance Improvement Planner">
      <div className="planner-header">
        <div className="planner-icon">
          <Calculator size={15} />
        </div>
        <strong>Statutory Attendance Planner & Improvement Calculator</strong>
      </div>
      <p className="std-planner-line">
        {pct >= 75 ? (
          <>
            You are compliant! You can safely miss <b>{canSkip}</b> more lecture{canSkip === 1 ? "" : "s"} and stay ≥75%.
          </>
        ) : (
          <>
            Shortage Alert! Attend the next <b>{needAttend}</b> consecutive lecture{needAttend === 1 ? "" : "s"} to reach the mandatory 75% threshold.
          </>
        )}
      </p>
      <label className="std-planner-slider">
        <span>Simulate missing <b>{miss}</b> upcoming class{miss === 1 ? "" : "es"}:</span>
        <input
          type="range"
          min="0"
          max="10"
          value={miss}
          onChange={(e) => setMiss(Number(e.target.value))}
        />
      </label>
      <div className={`std-planner-result ${ok ? "good" : "warn"}`}>
        <strong>Projected: {projected.toFixed(1)}%</strong>
        <span>{ok ? "Remains Compliant (≥75%)" : "Falls Below Statutory 75% Limit"}</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   COMMAND PALETTE & BACK TO TOP
   ========================================================================== */

export function CommandPalette({ items, onSelect }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const list = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const h = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !["input", "textarea"].includes(tag))) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const pick = (it) => {
    if (it) {
      setOpen(false);
      onSelect(it.key);
    }
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, list.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") pick(list[idx]);
  };

  return (
    <>
      <button
        type="button"
        className="std-fab"
        onClick={() => setOpen(true)}
        aria-label="Search sections"
        title="Search ERP Sections (Ctrl + K)"
      >
        <Search size={18} />
      </button>
      {open && (
        <div className="std-palette-backdrop" onClick={() => setOpen(false)}>
          <div className="std-palette" role="dialog" aria-label="Jump to" onClick={(e) => e.stopPropagation()}>
            <div className="std-palette-input">
              <Search size={16} />
              <input
                ref={inputRef}
                value={q}
                placeholder="Search modules: attendance, results, fees, timetable, library…"
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={onKey}
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="std-palette-list">
              {list.length === 0 && <p className="std-bell-empty">No matching modules found</p>}
              {list.map((it, i) => (
                <button
                  type="button"
                  key={it.key}
                  className={i === idx ? "active" : ""}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => pick(it)}
                >
                  <span>{it.label}</span>
                  <small>{it.hint}</small>
                  {i === idx ? <CornerDownLeft size={13} /> : <ChevronRight size={13} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 420);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <button
      type="button"
      className={`std-top-btn ${show ? "show" : ""}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to Top"
    >
      <ArrowUp size={17} />
    </button>
  );
}
