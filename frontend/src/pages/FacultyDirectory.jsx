import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search, Filter, Users, GraduationCap, Calendar,
  ChevronLeft, ChevronRight, UserCheck, UserX, Eye,
  AlertTriangle, RefreshCw, BookOpen, Loader2, RotateCw,
  BadgeCheck, Mail, Phone, X, Sparkles, Download,
  UserPlus, LayoutGrid, List, ArrowUpDown, ChevronDown,
  Check, CheckCircle2, ShieldAlert, Award, FileSpreadsheet,
  Layers, ExternalLink, Copy, SlidersHorizontal, Columns,
  Maximize2, QrCode, Printer, Share2, CheckSquare, Square,
  Flame, Zap, TrendingUp, Compass, Info, Star, Briefcase,
  Clock, Building, School, MapPin
} from "lucide-react";
import { authApi } from "../services/authApi";
import "./FacultyDirectory.css";

/* ======================================================
   CONSTANTS & CONFIGURATION
   ====================================================== */

const DEPARTMENTS = [
  "All Departments",
  "Computer Science & Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Applied Sciences & Humanities"
];

const DESIGNATIONS = [
  "All Designations",
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Head of Department"
];

const DUTY_STATUS_OPTIONS = [
  { value: "ALL", label: "All Duty Statuses" },
  { value: "duty", label: "On Duty Today" },
  { value: "leave", label: "On Approved Leave" },
  { value: "active", label: "Active Directory Status" }
];

const SORT_OPTIONS = [
  { value: "default", label: "Default Directory Order" },
  { value: "name_asc", label: "Faculty Name (A → Z)" },
  { value: "name_desc", label: "Faculty Name (Z → A)" },
  { value: "workload_desc", label: "Teaching Workload (High → Low)" },
  { value: "emp_asc", label: "Employee ID (Ascending)" },
  { value: "recent", label: "Recently Appointed" }
];

const PAGE_LIMIT = 12;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ======================================================
   DETERMINISTIC ART (QR CODE & DIGITAL BARCODE)
   ====================================================== */

const makeRng = (seedText) => {
  let h = 2166136261;
  const str = String(seedText || "subharti-faculty");
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = (h >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
};

function QrArt({ seed, size = 21 }) {
  const path = useMemo(() => {
    const rnd = makeRng(`qr-fac-${seed}`);
    const cells = [];
    const inFinder = (x, y) =>
      (x < 6 && y < 6) || (x >= size - 6 && y < 6) || (x < 6 && y >= size - 6);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (inFinder(x, y)) continue;
        if (rnd() > 0.5) cells.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    const finder = (ox, oy) =>
      `M${ox} ${oy}h6v6h-6z M${ox + 1} ${oy + 1}v4h4v-4z M${ox + 2} ${oy + 2}h2v2h-2z`;
    return `${cells.join("")}${finder(0, 0)}${finder(size - 6, 0)}${finder(0, size - 6)}`;
  }, [seed, size]);

  return (
    <svg className="fd-qr-svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" shapeRendering="crispEdges">
      <path d={path} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

function BarcodeArt({ seed, bars = 36 }) {
  const data = useMemo(() => {
    const rnd = makeRng(`bar-fac-${seed}`);
    let x = 0;
    const out = [];
    for (let i = 0; i < bars; i += 1) {
      const w = 1 + Math.floor(rnd() * 2.8);
      if (i % 2 === 0) out.push({ x, w });
      x += w + (rnd() > 0.6 ? 1 : 0.6);
    }
    return { out, width: x };
  }, [seed, bars]);

  return (
    <svg className="fd-barcode-svg" viewBox={`0 0 ${data.width} 10`} preserveAspectRatio="none" aria-hidden="true">
      {data.out.map((r, i) => (
        <rect key={i} x={r.x} y="0" width={r.w} height="10" fill="currentColor" />
      ))}
    </svg>
  );
}

function getDeptClass(dept) {
  const d = (dept || "").toLowerCase();
  if (d.includes("cse") || d.includes("comp")) return "dept-cse";
  if (d.includes("mech")) return "dept-mech";
  if (d.includes("elec") || d.includes("ee")) return "dept-elec";
  if (d.includes("civil")) return "dept-civil";
  if (d.includes("ece") || d.includes("comm")) return "dept-ece";
  return "dept-default";
}

function getDeptShortName(dept) {
  const d = (dept || "").toLowerCase();
  if (d.includes("cse") || d.includes("computer")) return "CSE";
  if (d.includes("mech")) return "MECH";
  if (d.includes("elec") || d.includes("ee")) return "ELECTRICAL";
  if (d.includes("civil")) return "CIVIL";
  if (d.includes("ece") || d.includes("comm")) return "ECE";
  return dept || "ACADEMICS";
}

/* ======================================================
   CARD 1: HOLOGRAPHIC 3D IDENTITY CARD (Grid View)
   ====================================================== */

function FacultyCard({
  faculty,
  index,
  callerRole,
  isSelectedForCompare,
  onToggleCompare,
  onViewProfile,
  onShowDigitalPass,
  onCopyEmail
}) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);

  const initials = (faculty.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSuspended = faculty.status === "suspended";
  const isOnLeave = faculty.onLeaveToday;
  const seed = faculty.employeeId || faculty.id || faculty.name;
  const subjects = faculty.subjects || [];
  const deptClass = getDeptClass(faculty.department);
  const deptShort = getDeptShortName(faculty.department);

  // Micro 3D perspective tilt on pointer movement
  const handlePointerMove = (e) => {
    if (prefersReducedMotion() || e.pointerType === "touch" || !cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${((0.5 - py) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };

  const handlePointerLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  };

  return (
    <article
      className={`fd-idcard ${deptClass} ${isSuspended ? "is-suspended" : ""} ${flipped ? "is-flipped" : ""} ${isSelectedForCompare ? "is-comparing" : ""}`}
      style={{ "--card-index": Math.min(index, 15) }}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label={`Faculty Identity Card: ${faculty.name}`}
    >
      <div className="fd-idcard-inner">
        {/* ================= FRONT FACE ================= */}
        <div className="fd-card-face fd-face-front" aria-hidden={flipped}>
          {/* Holographic Sheen Overlay */}
          <div className="fd-foil-sheen" aria-hidden="true" />

          {/* Card Top Branding Strip */}
          <div className="fd-card-topbar">
            <div className="fd-poly-brand">
              <span className="fd-poly-icon"><School size={13} strokeWidth={2.4} /></span>
              <span className="fd-poly-text">SUBHARTI FACULTY CORPS</span>
            </div>

            <div className="fd-topbar-right-group">
              {/* Compare Checkbox */}
              <button
                type="button"
                className={`fd-compare-toggle ${isSelectedForCompare ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(faculty);
                }}
                title={isSelectedForCompare ? "Remove from comparison" : "Add to side-by-side comparison"}
                aria-label={`Compare ${faculty.name}`}
              >
                {isSelectedForCompare ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>Compare</span>
              </button>

              <div className="fd-status-indicator">
                {isOnLeave ? (
                  <span className="fd-status-pill on-leave" title="Faculty member is on approved leave today">
                    <span className="fd-dot leave" /> On Leave
                  </span>
                ) : isSuspended ? (
                  <span className="fd-status-pill suspended">
                    <span className="fd-dot suspended" /> Inactive
                  </span>
                ) : (
                  <span className="fd-status-pill on-duty" title="Active and On Duty on campus today">
                    <span className="fd-dot duty" /> On Duty Today
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Header (Avatar + Name + Monospace ID) */}
          <div className="fd-card-header">
            <div
              className="fd-avatar-wrapper"
              onClick={() => onShowDigitalPass(faculty)}
              title="Click to inspect official digital credential pass"
            >
              {faculty.avatarUrl ? (
                <img
                  src={faculty.avatarUrl}
                  alt={faculty.name}
                  className="fd-avatar-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = "grid";
                    }
                  }}
                />
              ) : null}
              <div
                className="fd-avatar-initials"
                style={faculty.avatarUrl ? { display: "none" } : undefined}
                aria-hidden="true"
              >
                {initials}
              </div>
              <span className={`fd-live-status ${isOnLeave ? "leave" : isSuspended ? "off" : "on"}`} />
              <span className="fd-avatar-verified-badge" title="Official Faculty Appointment Verified">
                <BadgeCheck size={12} strokeWidth={2.6} />
              </span>
            </div>

            <div className="fd-header-text">
              <h3 className="fd-faculty-name" title={faculty.name}>
                {faculty.name}
              </h3>
              <div className="fd-enroll-pill">
                <span className="fd-enroll-tag">EMP ID</span>
                <code className="fd-enroll-code">
                  {faculty.employeeId || "SUB-FAC-UNASSIGNED"}
                </code>
              </div>
            </div>
          </div>

          {/* Academic Metadata Chips */}
          <div className="fd-meta-cluster">
            <span className="fd-meta-chip dept" title={`Department: ${faculty.department}`}>
              <Building size={11} />
              <span>{deptShort}</span>
            </span>
            <span className="fd-meta-chip desig" title={`Designation: ${faculty.designation}`}>
              <Award size={11} />
              <span className="truncate">{faculty.designation}</span>
            </span>
            <span className="fd-meta-chip load" title={`Weekly Workload: ${faculty.weeklyLoadHours || 0} teaching hours scheduled`}>
              <Clock size={11} />
              <span>{faculty.weeklyLoadHours || 0} hrs/wk</span>
            </span>
          </div>

          {/* Bio / Responsibilities Snippet */}
          <div className="fd-card-snippet">
            {faculty.responsibilities ? (
              <p className="fd-bio-snippet" title={faculty.responsibilities}>
                <span className="fd-snippet-label">Key Duty:</span> {faculty.responsibilities.slice(0, 80)}{faculty.responsibilities.length > 80 ? "…" : ""}
              </p>
            ) : faculty.bio ? (
              <p className="fd-bio-snippet">{faculty.bio.slice(0, 85)}{faculty.bio.length > 85 ? "…" : ""}</p>
            ) : (
              <p className="fd-bio-snippet muted">Department Scholar • Faculty of Engineering & Technology</p>
            )}

            {/* Subjects Tags */}
            {subjects.length > 0 && (
              <div className="fd-card-skills-row" title="Assigned Subjects">
                {subjects.slice(0, 3).map((sub, idx) => (
                  <span key={idx} className="fd-mini-skill-pill">{sub}</span>
                ))}
                {subjects.length > 3 && (
                  <span className="fd-mini-skill-pill more">+{subjects.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {/* Perforated Security Divider */}
          <div className="fd-perf-divider" aria-hidden="true">
            <span className="fd-perf-line" />
          </div>

          {/* Card Foot: QR Code + Barcode + Actions */}
          <div className="fd-card-foot">
            <div
              className="fd-security-art"
              onClick={() => onShowDigitalPass(faculty)}
              title="Click to enlarge official digital faculty pass"
            >
              <div className="fd-qr-box" title="Institutional Security Stamp">
                <QrArt seed={seed} />
              </div>
              <div className="fd-barcode-box" title="Monospace Institutional Barcode">
                <BarcodeArt seed={seed} />
              </div>
            </div>

            <div className="fd-card-actions">
              {/* Primary View Profile button */}
              <button
                type="button"
                className="fd-btn fd-btn-profile"
                onClick={() => onViewProfile(faculty.id || faculty.userId)}
                aria-label={`View academic profile of ${faculty.name}`}
              >
                <Eye size={13} />
                <span>Dossier</span>
              </button>

              {/* Quick flip toggle button */}
              <button
                type="button"
                className={`fd-btn-icon fd-btn-flip ${flipped ? "active" : ""}`}
                onClick={() => setFlipped(true)}
                title="View consultation hours & contact credentials"
                aria-label="View back of identity card"
              >
                <RotateCw size={13} />
              </button>

              {/* Copy email action */}
              {faculty.email && (
                <button
                  type="button"
                  className="fd-btn-icon fd-btn-copy"
                  onClick={() => onCopyEmail(faculty.email, faculty.name)}
                  title={`Copy ${faculty.email}`}
                  aria-label={`Copy email of ${faculty.name}`}
                >
                  <Copy size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= BACK FACE ================= */}
        <div className="fd-card-face fd-face-back" aria-hidden={!flipped}>
          <div className="fd-back-topbar">
            <span className="fd-back-title">
              <Sparkles size={12} /> Faculty Institutional Dossier
            </span>
            <button
              type="button"
              className="fd-back-close"
              onClick={() => setFlipped(false)}
              aria-label="Return to front of card"
            >
              <RotateCw size={12} />
            </button>
          </div>

          <div className="fd-back-content">
            <div className="fd-back-section">
              <h4 className="fd-back-heading">Academic Specialization</h4>
              <p className="fd-back-bio">
                {faculty.bio || "Faculty member conducts undergraduate engineering lectures, laboratory instruction, and technical evaluation under institutional curriculum standards."}
              </p>
            </div>

            {faculty.responsibilities && (
              <div className="fd-back-section">
                <h4 className="fd-back-heading">Department Responsibilities</h4>
                <p className="fd-back-resp">{faculty.responsibilities}</p>
              </div>
            )}

            {subjects.length > 0 && (
              <div className="fd-back-section">
                <h4 className="fd-back-heading">Assigned Subject Curriculum</h4>
                <div className="fd-skills-cloud">
                  {subjects.slice(0, 5).map((sub, i) => (
                    <span key={i} className="fd-skill-pill">
                      {sub}
                    </span>
                  ))}
                  {subjects.length > 5 && (
                    <span className="fd-skill-pill more">+{subjects.length - 5}</span>
                  )}
                </div>
              </div>
            )}

            <div className="fd-back-section">
              <h4 className="fd-back-heading">Official Directory Communication</h4>
              {faculty.email && (
                <div
                  className="fd-back-contact clickable"
                  onClick={() => onCopyEmail(faculty.email, faculty.name)}
                  title="Click to copy email"
                >
                  <Mail size={11} />
                  <span>{faculty.email}</span>
                </div>
              )}
              <div className="fd-back-contact">
                <MapPin size={11} />
                <span>Faculty Block • Tech Cabin {faculty.employeeId?.split("-")[2] || "102"}</span>
              </div>
              <div className="fd-back-contact">
                <Clock size={11} />
                <span>Office Hours: Mon–Fri • 02:00 PM – 04:00 PM</span>
              </div>
            </div>
          </div>

          <div className="fd-back-foot">
            <p className="fd-property-text">
              Official Credential • Swami Vivekanand Subharti University
            </p>
            <div className="fd-back-action-row">
              <button
                type="button"
                className="fd-btn fd-btn-profile fd-back-profile-btn"
                onClick={() => onViewProfile(faculty.id || faculty.userId)}
              >
                <Eye size={13} /> Full Dossier
              </button>
              <button
                type="button"
                className="fd-btn fd-btn-secondary"
                onClick={() => onShowDigitalPass(faculty)}
              >
                <QrCode size={13} /> Pass
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ======================================================
   CARD 2: BENTO PROFILE CARD (Bento Layout View)
   ====================================================== */

function BentoFacultyCard({
  faculty,
  index,
  isSelectedForCompare,
  onToggleCompare,
  onViewProfile,
  onShowDigitalPass,
  onCopyEmail
}) {
  const initials = (faculty.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSuspended = faculty.status === "suspended";
  const isOnLeave = faculty.onLeaveToday;
  const subjects = faculty.subjects || [];
  const deptShort = getDeptShortName(faculty.department);

  return (
    <div
      className={`fd-bento-profile-card ${isSelectedForCompare ? "is-comparing" : ""}`}
      style={{ "--bento-idx": Math.min(index, 12) }}
    >
      <div className="fd-bpc-top">
        <div className="fd-bpc-avatar-group">
          <div className="fd-bpc-avatar" onClick={() => onShowDigitalPass(faculty)}>
            {faculty.avatarUrl ? (
              <img src={faculty.avatarUrl} alt="" className="fd-bpc-img" />
            ) : (
              <span className="fd-bpc-initials">{initials}</span>
            )}
            <span className={`fd-live-status ${isOnLeave ? "leave" : isSuspended ? "off" : "on"}`} />
          </div>
          <div>
            <div className="fd-bpc-name-row">
              <h4 className="fd-bpc-name" onClick={() => onViewProfile(faculty.id || faculty.userId)}>
                {faculty.name}
              </h4>
              <BadgeCheck size={14} className="fd-verified-badge-icon" />
            </div>
            <code className="fd-bpc-code">{faculty.employeeId || "EMP-SVSU-FAC"}</code>
          </div>
        </div>

        <button
          type="button"
          className={`fd-bpc-compare-btn ${isSelectedForCompare ? "active" : ""}`}
          onClick={() => onToggleCompare(faculty)}
          title="Toggle side-by-side comparison"
        >
          {isSelectedForCompare ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>
      </div>

      <div className="fd-bpc-meta-row">
        <span className="fd-bpc-pill dept">{deptShort}</span>
        <span className="fd-bpc-pill desig">{faculty.designation}</span>
        <span className="fd-bpc-pill load">{faculty.weeklyLoadHours || 0} hrs/wk</span>
        <span className={`fd-bpc-pill status ${isOnLeave ? "leave" : isSuspended ? "suspended" : "active"}`}>
          {isOnLeave ? "On Leave" : isSuspended ? "Inactive" : "On Duty Today"}
        </span>
      </div>

      {subjects.length > 0 && (
        <div className="fd-bpc-skills">
          {subjects.slice(0, 4).map((sub, idx) => (
            <span key={idx} className="fd-bpc-skill-chip">{sub}</span>
          ))}
          {subjects.length > 4 && <span className="fd-bpc-skill-chip more">+{subjects.length - 4}</span>}
        </div>
      )}

      {faculty.bio && (
        <p className="fd-bpc-bio">{faculty.bio.slice(0, 95)}{faculty.bio.length > 95 ? "…" : ""}</p>
      )}

      <div className="fd-bpc-foot">
        <button
          type="button"
          className="fd-bpc-action-btn primary"
          onClick={() => onViewProfile(faculty.id || faculty.userId)}
        >
          <Eye size={13} />
          <span>Academic Dossier</span>
        </button>

        <button
          type="button"
          className="fd-bpc-action-btn pass"
          onClick={() => onShowDigitalPass(faculty)}
          title="View digital ID pass"
        >
          <QrCode size={13} />
          <span>Digital Pass</span>
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   VIEW 3: MASTER-DETAIL SPLIT INSPECTOR
   ====================================================== */

function SplitInspector({
  facultyList,
  selectedFaculty,
  onSelectFaculty,
  onViewProfile,
  onShowDigitalPass,
  onCopyEmail
}) {
  const current = selectedFaculty || facultyList[0] || null;

  if (!current) {
    return (
      <div className="fd-split-empty">
        <Users size={32} />
        <p>No faculty member selected for inspection</p>
      </div>
    );
  }

  const initials = (current.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const subjects = current.subjects || [];
  const isOnLeave = current.onLeaveToday;
  const isSuspended = current.status === "suspended";

  return (
    <div className="fd-split-container">
      {/* Left Pane: Roster List */}
      <div className="fd-split-roster-pane">
        <div className="fd-split-roster-header">
          <Users size={14} />
          <span>Faculty Roster ({facultyList.length})</span>
        </div>
        <div className="fd-split-roster-list">
          {facultyList.map((f) => {
            const isCur = (current.id || current.userId) === (f.id || f.userId);
            const ini = (f.name || "?").slice(0, 2).toUpperCase();
            return (
              <div
                key={f.id || f.userId}
                className={`fd-split-roster-item ${isCur ? "selected" : ""}`}
                onClick={() => onSelectFaculty(f)}
              >
                <div className="fd-sri-avatar">
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" /> : <span>{ini}</span>}
                </div>
                <div className="fd-sri-info">
                  <strong>{f.name}</strong>
                  <small>{f.employeeId || "EMP-FAC"} • {getDeptShortName(f.department)}</small>
                </div>
                <BadgeCheck size={14} className="fd-sri-verified" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Deep Inspector Dossier */}
      <div className="fd-split-detail-pane">
        <div className="fd-detail-hero">
          <div className="fd-detail-ambient-orb" />
          <div className="fd-detail-avatar-box">
            {current.avatarUrl ? (
              <img src={current.avatarUrl} alt="" className="fd-detail-avatar" />
            ) : (
              <span className="fd-detail-avatar-ini">{initials}</span>
            )}
            <span className={`fd-live-status ${isOnLeave ? "leave" : isSuspended ? "off" : "on"}`} />
          </div>

          <div className="fd-detail-hero-info">
            <div className="fd-detail-name-row">
              <h2>{current.name}</h2>
              <span className="fd-verified-tag">
                <BadgeCheck size={13} /> Verified Professor
              </span>
            </div>
            <code className="fd-detail-enrollment">{current.employeeId || "SUB-FAC-001"}</code>
            <p className="fd-detail-bio">{current.bio || current.responsibilities || "Faculty member in Engineering Sciences."}</p>
          </div>
        </div>

        {/* Quick KPI Cluster */}
        <div className="fd-detail-kpi-grid">
          <div className="fd-detail-kpi">
            <span className="fd-kpi-title">Department</span>
            <strong>{current.department || "CSE"}</strong>
          </div>
          <div className="fd-detail-kpi">
            <span className="fd-kpi-title">Designation</span>
            <strong>{current.designation || "Assistant Professor"}</strong>
          </div>
          <div className="fd-detail-kpi">
            <span className="fd-kpi-title">Weekly Load</span>
            <strong>{current.weeklyLoadHours || 0} Hours</strong>
          </div>
          <div className="fd-detail-kpi">
            <span className="fd-kpi-title">Duty Status</span>
            <span className={`fd-status-pill ${isOnLeave ? "on-leave" : "on-duty"}`}>
              {isOnLeave ? "On Leave" : "On Duty Today"}
            </span>
          </div>
        </div>

        {/* Subjects & Competencies */}
        {subjects.length > 0 && (
          <div className="fd-detail-skills-section">
            <h4><Sparkles size={14} /> Assigned Subjects & Curriculum</h4>
            <div className="fd-detail-skills-cloud">
              {subjects.map((s, idx) => (
                <span key={idx} className="fd-detail-skill-chip">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="fd-detail-contact-section">
          <h4><Mail size={14} /> Official Directory Communication</h4>
          <div className="fd-detail-contact-card">
            <span>Official Email:</span>
            <strong>{current.email || "faculty@subharti.edu.in"}</strong>
          </div>
        </div>

        {/* Detail Action Toolbar */}
        <div className="fd-detail-actions">
          <button
            type="button"
            className="fd-action-btn primary"
            onClick={() => onViewProfile(current.id || current.userId)}
          >
            <Eye size={14} />
            <span>Open Comprehensive Faculty Dossier</span>
          </button>
          <button
            type="button"
            className="fd-action-btn secondary"
            onClick={() => onShowDigitalPass(current)}
          >
            <QrCode size={14} />
            <span>View Digital Faculty Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SIDE-BY-SIDE FACULTY COMPARISON DRAWER
   ====================================================== */

function CompareDrawer({
  selectedFaculty,
  onRemoveFromCompare,
  onClearCompare,
  onViewProfile
}) {
  if (selectedFaculty.length === 0) return null;

  return (
    <aside className="fd-compare-tray" aria-label="Selected faculty comparison tray">
      <div className="fd-compare-bar">
        <div className="fd-compare-left">
          <div className="fd-compare-icon-wrap">
            <Columns size={16} />
          </div>
          <div>
            <strong>Faculty Academic Comparison</strong>
            <small>{selectedFaculty.length} of 3 faculty staged for comparison</small>
          </div>
        </div>

        <div className="fd-compare-pills-row">
          {selectedFaculty.map((f) => (
            <div key={f.id || f.userId} className="fd-compare-mini-chip">
              <span>{f.name}</span>
              <button
                type="button"
                onClick={() => onRemoveFromCompare(f.id || f.userId)}
                aria-label={`Remove ${f.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="fd-compare-actions">
          <button type="button" className="fd-compare-btn clear" onClick={onClearCompare}>
            Clear
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="fd-compare-grid">
        {selectedFaculty.map((f) => {
          const ini = (f.name || "?").slice(0, 2).toUpperCase();
          return (
            <div key={f.id || f.userId} className="fd-compare-column">
              <div className="fd-comp-head">
                <div className="fd-comp-avatar">
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" /> : <span>{ini}</span>}
                </div>
                <div>
                  <h4>{f.name}</h4>
                  <code>{f.employeeId || "EMP-SVSU"}</code>
                </div>
              </div>

              <div className="fd-comp-specs">
                <div className="fd-comp-row">
                  <span>Department:</span>
                  <strong>{getDeptShortName(f.department)}</strong>
                </div>
                <div className="fd-comp-row">
                  <span>Designation:</span>
                  <strong>{f.designation}</strong>
                </div>
                <div className="fd-comp-row">
                  <span>Workload:</span>
                  <strong>{f.weeklyLoadHours || 0} hrs / week</strong>
                </div>
                <div className="fd-comp-row">
                  <span>Duty Status:</span>
                  <span className={`fd-status-pill ${f.onLeaveToday ? "on-leave" : "on-duty"}`}>
                    {f.onLeaveToday ? "On Leave" : "On Duty Today"}
                  </span>
                </div>
                {f.email && (
                  <div className="fd-comp-row">
                    <span>Email:</span>
                    <strong className="truncate">{f.email}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="fd-btn fd-btn-profile w-full"
                onClick={() => onViewProfile(f.id || f.userId)}
              >
                <Eye size={12} /> Inspect Dossier
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ======================================================
   DIGITAL FACULTY ID PASS SHOWCASE MODAL
   ====================================================== */

function DigitalFacultyPassModal({ faculty, onClose, onViewProfile }) {
  if (!faculty) return null;

  const initials = (faculty.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const seed = faculty.employeeId || faculty.id || faculty.name;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-id-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="fd-idm-top">
          <div className="fd-idm-poly-seal">
            <School size={18} />
            <div>
              <h3>SWAMI VIVEKANAND SUBHARTI UNIVERSITY</h3>
              <p>Faculty Corps • Institutional Credential Pass</p>
            </div>
          </div>
          <button type="button" className="fd-modal-close-icon" onClick={onClose} aria-label="Close ID pass">
            <X size={18} />
          </button>
        </div>

        {/* Physical Faculty ID Pass Visual */}
        <div className="fd-physical-pass" id="printable-faculty-pass">
          <div className="fd-pass-header">
            <span className="fd-pass-inst">COLLEGEOS FACULTY CREDENTIAL CARD</span>
            <span className="fd-pass-session">PERMANENT ACADEMIC CORPS</span>
          </div>

          <div className="fd-pass-body">
            <div className="fd-pass-photo-box">
              {faculty.avatarUrl ? (
                <img src={faculty.avatarUrl} alt="" className="fd-pass-photo" />
              ) : (
                <span className="fd-pass-initials">{initials}</span>
              )}
              <span className="fd-pass-verified-seal"><BadgeCheck size={16} /></span>
            </div>

            <div className="fd-pass-details">
              <h2 className="fd-pass-name">{faculty.name}</h2>
              <div className="fd-pass-spec-grid">
                <div>
                  <span className="lbl">EMPLOYEE ID</span>
                  <strong>{faculty.employeeId || "EMP-CSE-108"}</strong>
                </div>
                <div>
                  <span className="lbl">DEPARTMENT</span>
                  <strong>{faculty.department || "Computer Science & Engineering"}</strong>
                </div>
                <div>
                  <span className="lbl">DESIGNATION</span>
                  <strong>{faculty.designation || "Associate Professor"}</strong>
                </div>
                <div>
                  <span className="lbl">CAMPUS STATUS</span>
                  <strong>{faculty.onLeaveToday ? "ON APPROVED LEAVE" : "ON ACTIVE DUTY"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="fd-pass-security-footer">
            <div className="fd-pass-qr">
              <QrArt seed={seed} size={25} />
            </div>
            <div className="fd-pass-barcode-wrap">
              <BarcodeArt seed={seed} bars={48} />
              <code>* {faculty.employeeId || faculty.id} *</code>
            </div>
          </div>
        </div>

        {/* Pass Actions */}
        <div className="fd-idm-actions">
          <button type="button" className="fd-action-btn secondary" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Official Faculty Pass</span>
          </button>
          <button
            type="button"
            className="fd-action-btn primary"
            onClick={() => {
              onClose();
              onViewProfile(faculty.id || faculty.userId);
            }}
          >
            <Eye size={14} />
            <span>Go to Academic Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SLIDE-OVER ADVANCED FILTER DRAWER
   ====================================================== */

function FilterDrawer({
  open,
  onClose,
  department,
  setDepartment,
  designation,
  setDesignation,
  dutyStatus,
  setDutyStatus,
  onApply,
  onReset
}) {
  if (!open) return null;

  return (
    <div className="fd-drawer-backdrop" onClick={onClose}>
      <div className="fd-filter-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="fd-drawer-header">
          <div className="fd-drawer-title">
            <SlidersHorizontal size={18} />
            <h3>Faculty Directory Filters</h3>
          </div>
          <button type="button" className="fd-modal-close-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="fd-drawer-body">
          <div className="fd-filter-group">
            <label>Academic Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept === "All Departments" ? "" : dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="fd-filter-group">
            <label>Academic Designation</label>
            <select value={designation} onChange={(e) => setDesignation(e.target.value)}>
              {DESIGNATIONS.map((des) => (
                <option key={des} value={des === "All Designations" ? "" : des}>
                  {des}
                </option>
              ))}
            </select>
          </div>

          <div className="fd-filter-group">
            <label>Duty & Presence Status</label>
            <select value={dutyStatus} onChange={(e) => setDutyStatus(e.target.value)}>
              {DUTY_STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="fd-drawer-actions">
          <button type="button" className="fd-action-btn secondary" onClick={onReset}>
            Reset Filters
          </button>
          <button type="button" className="fd-action-btn primary" onClick={onApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SLIDE-OVER COMPREHENSIVE FACULTY PROFILE DRAWER
   ====================================================== */

function FacultyProfileDrawer({
  facultyId,
  onClose,
  onShowDigitalPass
}) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!facultyId) return;
    let isMounted = true;
    setLoading(true);
    setError("");

    authApi.getFacultyDetails(facultyId)
      .then((res) => {
        if (!isMounted) return;
        setProfileData(res);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load faculty dossier.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [facultyId]);

  if (!facultyId) return null;

  const teacher = profileData?.teacher;
  const timetableSlots = profileData?.timetableSlots || [];
  const workload = profileData?.workload;
  const initials = (teacher?.name || "?").slice(0, 2).toUpperCase();

  return (
    <div className="fd-drawer-backdrop" onClick={onClose}>
      <div className="fd-profile-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="fd-pd-header">
          <div className="fd-pd-title">
            <Sparkles size={16} />
            <span>Comprehensive Faculty Dossier</span>
          </div>
          <button type="button" className="fd-modal-close-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="fd-pd-loading">
            <Loader2 size={32} className="spin" />
            <p>Loading authenticated academic records...</p>
          </div>
        ) : error ? (
          <div className="fd-pd-error">
            <AlertTriangle size={24} />
            <p>{error}</p>
          </div>
        ) : teacher ? (
          <div className="fd-pd-body">
            {/* Hero Section */}
            <div className="fd-pd-hero">
              <div className="fd-pd-avatar-wrap">
                {teacher.avatarUrl ? (
                  <img src={teacher.avatarUrl} alt="" className="fd-pd-avatar" />
                ) : (
                  <span className="fd-pd-ini">{initials}</span>
                )}
                <span className="fd-pd-badge"><BadgeCheck size={16} /></span>
              </div>
              <div className="fd-pd-meta">
                <h2>{teacher.name}</h2>
                <div className="fd-pd-tags">
                  <span className="fd-pd-tag emp">{teacher.employeeId || "EMP-FAC"}</span>
                  <span className="fd-pd-tag dept">{teacher.department}</span>
                  <span className="fd-pd-tag desig">{teacher.designation}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="fd-pd-kpi-row">
              <div className="fd-pd-kpi">
                <span className="kpi-lbl">Assigned Classes</span>
                <strong>{teacher.assignedClassesCount || timetableSlots.length || 0}</strong>
              </div>
              <div className="fd-pd-kpi">
                <span className="kpi-lbl">Weekly Load</span>
                <strong>{workload?.weeklyTeachingHours || teacher.weeklyLoadHours || 0} hrs</strong>
              </div>
              <div className="fd-pd-kpi">
                <span className="kpi-lbl">Campus Status</span>
                <strong className={teacher.onLeaveToday ? "text-amber" : "text-emerald"}>
                  {teacher.onLeaveToday ? "On Leave" : "Active / On Duty"}
                </strong>
              </div>
            </div>

            {/* Bio & Academic Vision */}
            {teacher.bio && (
              <div className="fd-pd-section">
                <h4>Academic Background & Profile</h4>
                <p>{teacher.bio}</p>
              </div>
            )}

            {/* Key Responsibilities */}
            {teacher.responsibilities && (
              <div className="fd-pd-section">
                <h4>Institutional Responsibilities</h4>
                <p className="fd-pd-resp-box">{teacher.responsibilities}</p>
              </div>
            )}

            {/* Subjects */}
            {teacher.subjects && teacher.subjects.length > 0 && (
              <div className="fd-pd-section">
                <h4>Curriculum & Teaching Disciplines</h4>
                <div className="fd-pd-skills">
                  {teacher.subjects.map((sub, i) => (
                    <span key={i} className="fd-pd-chip">{sub}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Timetable Slots if present */}
            {timetableSlots.length > 0 && (
              <div className="fd-pd-section">
                <h4>Weekly Timetable Lecture Schedule</h4>
                <div className="fd-pd-slots-list">
                  {timetableSlots.map((slot, i) => (
                    <div key={i} className="fd-pd-slot-card">
                      <div className="slot-day">{slot.dayOfWeek}</div>
                      <div className="slot-time">{slot.timeRange || "09:00 - 10:00"}</div>
                      <div className="slot-sub">
                        <strong>{slot.subject}</strong>
                        <small>{slot.semester} • Room {slot.roomNo || "Lab 2"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directory Contact Card */}
            <div className="fd-pd-contact-box">
              <div className="c-row">
                <Mail size={14} />
                <span>{teacher.email}</span>
              </div>
              {teacher.phone && (
                <div className="c-row">
                  <Phone size={14} />
                  <span>{teacher.phone}</span>
                </div>
              )}
              <div className="c-row">
                <MapPin size={14} />
                <span>Faculty Block • Tech Wing</span>
              </div>
            </div>

            {/* Actions */}
            <div className="fd-pd-foot-actions">
              <button
                type="button"
                className="fd-action-btn primary"
                onClick={() => {
                  onClose();
                  onShowDigitalPass(teacher);
                }}
              >
                <QrCode size={14} />
                <span>View Digital Faculty Pass</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ======================================================
   SHIMMER SKELETON LOADING CARD
   ====================================================== */

function SkeletonCard() {
  return (
    <div className="fd-idcard fd-skeleton" aria-hidden="true">
      <div className="fd-idcard-inner">
        <div className="fd-card-face fd-face-front">
          <div className="fd-card-topbar">
            <div className="fd-sk-line fd-sk-brand" />
            <div className="fd-sk-line fd-sk-badge" />
          </div>

          <div className="fd-card-header">
            <div className="fd-sk-avatar" />
            <div className="fd-sk-header-lines">
              <div className="fd-sk-line fd-sk-name" />
              <div className="fd-sk-line fd-sk-id" />
            </div>
          </div>

          <div className="fd-meta-cluster">
            <div className="fd-sk-line fd-sk-chip" />
            <div className="fd-sk-line fd-sk-chip" />
            <div className="fd-sk-line fd-sk-chip" />
          </div>

          <div className="fd-card-snippet">
            <div className="fd-sk-line fd-sk-bio1" />
            <div className="fd-sk-line fd-sk-bio2" />
          </div>

          <div className="fd-perf-divider" />

          <div className="fd-card-foot">
            <div className="fd-sk-line fd-sk-qr" />
            <div className="fd-sk-line fd-sk-btn" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   MAIN COMPONENT: FacultyDirectory
   ====================================================== */

export default function FacultyDirectory({
  currentUser: propUser,
  callerRole: propRole,
  onNavigate
}) {
  const currentUser = propUser || authApi.getCurrentUser();
  const callerRole = propRole || currentUser?.role || "student";

  const [facultyList, setFacultyList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [dutyStatus, setDutyStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "bento" | "table" | "split"
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Modals & Interactive States
  const [digitalPassFaculty, setDigitalPassFaculty] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [splitSelectedFaculty, setSplitSelectedFaculty] = useState(null);
  const [drawerFacultyId, setDrawerFacultyId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const searchInputRef = useRef(null);
  const searchTimeout = useRef(null);
  const toastTimeout = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ show: true, message: msg, type });
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3200);
  }, []);

  const handleCopyEmail = useCallback((email, name) => {
    if (!email) return;
    navigator.clipboard?.writeText(email)
      .then(() => showToast(`Copied ${name}'s email to clipboard!`))
      .catch(() => showToast(`Email: ${email}`));
  }, [showToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (filterDrawerOpen) setFilterDrawerOpen(false);
        if (digitalPassFaculty) setDigitalPassFaculty(null);
        if (drawerFacultyId) setDrawerFacultyId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filterDrawerOpen, digitalPassFaculty, drawerFacultyId]);

  // Load faculty directory with backend API
  const loadFaculty = useCallback(async (params, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const result = await authApi.getFacultyDirectory(params);
      const list = result.teachers || [];
      setFacultyList(list);
      setTotal(result.pagination?.totalCount || list.length);
      setTotalPages(result.pagination?.totalPages || Math.ceil(list.length / PAGE_LIMIT) || 1);
    } catch (err) {
      setError(err.message || "Failed to load faculty directory from server.");
      setFacultyList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load overview stats
  const loadStats = useCallback(async () => {
    try {
      const res = await authApi.getTeacherStats();
      if (res?.stats) setStats(res.stats);
    } catch {
      // Stats failure is non-blocking
    }
  }, []);

  const buildParams = useCallback(
    (overrides = {}) => {
      const p = {
        page: overrides.page ?? page,
        limit: PAGE_LIMIT
      };
      const s = overrides.search !== undefined ? overrides.search : search;
      if (s.trim()) p.search = s.trim();

      const d = overrides.department !== undefined ? overrides.department : department;
      if (d) p.department = d;

      const des = overrides.designation !== undefined ? overrides.designation : designation;
      if (des) p.designation = des;

      const st = overrides.dutyStatus !== undefined ? overrides.dutyStatus : dutyStatus;
      if (st && st !== "ALL") p.status = st;

      const sb = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
      if (sb === "name_asc") {
        p.sort = "name";
        p.order = "asc";
      } else if (sb === "name_desc") {
        p.sort = "name";
        p.order = "desc";
      } else if (sb === "workload_desc") {
        p.sort = "workload";
        p.order = "desc";
      } else if (sb === "emp_asc") {
        p.sort = "employeeId";
        p.order = "asc";
      } else if (sb === "recent") {
        p.sort = "createdAt";
        p.order = "desc";
      }

      return p;
    },
    [page, search, department, designation, dutyStatus, sortBy]
  );

  // Initial load
  useEffect(() => {
    loadFaculty(buildParams());
    loadStats();
  }, [loadFaculty, loadStats, buildParams]);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadFaculty(buildParams({ search: val, page: 1 }));
    }, 350);
  };

  const handleDepartmentChange = (val) => {
    setDepartment(val);
    setPage(1);
    loadFaculty(buildParams({ department: val, page: 1 }));
  };

  const handleDesignationChange = (val) => {
    setDesignation(val);
    setPage(1);
    loadFaculty(buildParams({ designation: val, page: 1 }));
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    loadFaculty(buildParams({ sortBy: val }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    loadFaculty(buildParams({ page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = () => {
    loadFaculty(buildParams(), true);
    loadStats();
    showToast("Directory synchronized with campus database.");
  };

  // Compare toggles
  const handleToggleCompare = (faculty) => {
    const id = faculty.id || faculty.userId;
    setSelectedForCompare((prev) => {
      const exists = prev.some((f) => (f.id || f.userId) === id);
      if (exists) {
        return prev.filter((f) => (f.id || f.userId) !== id);
      }
      if (prev.length >= 3) {
        showToast("You can compare up to 3 faculty members at a time.", "warn");
        return prev;
      }
      showToast(`Staged ${faculty.name} for comparison.`);
      return [...prev, faculty];
    });
  };

  const handleRemoveFromCompare = (id) => {
    setSelectedForCompare((prev) => prev.filter((f) => (f.id || f.userId) !== id));
  };

  const handleClearCompare = () => {
    setSelectedForCompare([]);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (facultyList.length === 0) {
      showToast("No faculty records available to export.", "warn");
      return;
    }
    const headers = ["Employee ID", "Faculty Name", "Department", "Designation", "Email", "Workload (Hrs)", "Duty Status", "Subjects"];
    const rows = facultyList.map((f) => [
      `"${f.employeeId || ""}"`,
      `"${f.name || ""}"`,
      `"${f.department || ""}"`,
      `"${f.designation || ""}"`,
      `"${f.email || ""}"`,
      `"${f.weeklyLoadHours || 0}"`,
      `"${f.onLeaveToday ? "On Leave" : "On Duty"}"`,
      `"${(f.subjects || []).join("; ")}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subharti_faculty_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Faculty directory exported to CSV successfully.");
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (department) c += 1;
    if (designation) c += 1;
    if (dutyStatus && dutyStatus !== "ALL") c += 1;
    return c;
  }, [department, designation, dutyStatus]);

  // Senior scholars count
  const seniorCount = useMemo(() => {
    return facultyList.filter((f) =>
      (f.designation || "").toLowerCase().includes("prof") ||
      (f.designation || "").toLowerCase().includes("dean") ||
      (f.designation || "").toLowerCase().includes("head")
    ).length;
  }, [facultyList]);

  return (
    <div className="fd-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fd-toast ${toast.type}`} role="status">
          {toast.type === "warn" ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <header className="fd-hero">
        <div className="fd-hero-content">
          <div className="fd-hero-badge">
            <School size={13} />
            <span>SUBHARTI ACADEMIC DIRECTORY</span>
          </div>
          <h1 className="fd-hero-title">All Faculty & Professors</h1>
          <p className="fd-hero-subtitle">
            Explore authentic faculty appointments, departmental designations, research specializations, assigned subjects, and weekly teaching loads across Swami Vivekanand Subharti University.
          </p>
        </div>

        {/* Top Analytics KPI Ribbon */}
        <div className="fd-kpi-ribbon">
          <div className="fd-kpi-card">
            <div className="fd-kpi-icon total">
              <Users size={18} />
            </div>
            <div className="fd-kpi-info">
              <span className="fd-kpi-lbl">Total Faculty</span>
              <strong className="fd-kpi-val">{stats?.totalFaculty || total}</strong>
            </div>
            <span className="fd-kpi-spark"><TrendingUp size={12} /> Active</span>
          </div>

          <div className="fd-kpi-card">
            <div className="fd-kpi-icon duty">
              <Zap size={18} />
            </div>
            <div className="fd-kpi-info">
              <span className="fd-kpi-lbl">On Duty Today</span>
              <strong className="fd-kpi-val">{stats?.activeFaculty || total}</strong>
            </div>
            <span className="fd-kpi-spark green"><Flame size={12} /> Live</span>
          </div>

          <div className="fd-kpi-card">
            <div className="fd-kpi-icon scholars">
              <Award size={18} />
            </div>
            <div className="fd-kpi-info">
              <span className="fd-kpi-lbl">Senior Scholars</span>
              <strong className="fd-kpi-val">{seniorCount || 8}</strong>
            </div>
            <span className="fd-kpi-spark purple"><Star size={12} /> Ph.D. / Prof</span>
          </div>

          <div className="fd-kpi-card">
            <div className="fd-kpi-icon load">
              <Clock size={18} />
            </div>
            <div className="fd-kpi-info">
              <span className="fd-kpi-lbl">Teaching Hours</span>
              <strong className="fd-kpi-val">{stats?.weeklyTeachingHours || 28}+ hrs</strong>
            </div>
            <span className="fd-kpi-spark blue"><BookOpen size={12} /> Scheduled</span>
          </div>
        </div>
      </header>

      {/* Control Bar: Search + Quick Filters + View Mode + Actions */}
      <section className="fd-control-bar" aria-label="Faculty Directory Controls">
        <div className="fd-search-wrap">
          <Search size={16} className="fd-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="fd-search-input"
            placeholder="Search by faculty name, employee ID, department, or subject... (Press / or Ctrl+K)"
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              className="fd-clear-search"
              onClick={() => {
                setSearch("");
                loadFaculty(buildParams({ search: "" }));
              }}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="fd-filters-wrap">
          {/* Department Select */}
          <div className="fd-select-wrap">
            <Building size={14} className="fd-select-icon" />
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="fd-select"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept === "All Departments" ? "" : dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Designation Select */}
          <div className="fd-select-wrap">
            <Award size={14} className="fd-select-icon" />
            <select
              value={designation}
              onChange={(e) => handleDesignationChange(e.target.value)}
              className="fd-select"
            >
              {DESIGNATIONS.map((des) => (
                <option key={des} value={des === "All Designations" ? "" : des}>
                  {des}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="fd-select-wrap">
            <ArrowUpDown size={14} className="fd-select-icon" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="fd-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filter Drawer Trigger */}
          <button
            type="button"
            className={`fd-filter-btn ${activeFilterCount > 0 ? "has-filters" : ""}`}
            onClick={() => setFilterDrawerOpen(true)}
            title="Open Advanced Filters"
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
            {activeFilterCount > 0 && <span className="fd-filter-count">{activeFilterCount}</span>}
          </button>

          {/* View Mode Toggle */}
          <div className="fd-view-modes" role="radiogroup" aria-label="Directory Layout View Modes">
            <button
              type="button"
              className={`fd-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="3D Holographic Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`fd-mode-btn ${viewMode === "bento" ? "active" : ""}`}
              onClick={() => setViewMode("bento")}
              title="Bento Card View"
              aria-label="Bento View"
            >
              <Layers size={15} />
            </button>
            <button
              type="button"
              className={`fd-mode-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Institutional Table View"
              aria-label="Table View"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={`fd-mode-btn ${viewMode === "split" ? "active" : ""}`}
              onClick={() => setViewMode("split")}
              title="Split Master-Detail Inspector"
              aria-label="Split View"
            >
              <Columns size={15} />
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            className="fd-action-btn secondary fd-export-btn"
            onClick={handleExportCSV}
            title="Export roster to CSV"
          >
            <Download size={14} />
            <span className="desktop-only">Export</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className={`fd-action-btn icon-only ${refreshing ? "spin" : ""}`}
            onClick={handleRefresh}
            title="Synchronize directory"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </section>

      {/* Main Directory Display Area */}
      <main className="fd-main-display">
        {error ? (
          <div className="fd-error-state">
            <AlertTriangle size={32} />
            <h3>Unable to Load Faculty Directory</h3>
            <p>{error}</p>
            <button type="button" className="fd-action-btn primary" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="fd-grid-display">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : facultyList.length === 0 ? (
          <div className="fd-empty-state">
            <School size={48} />
            <h3>No Faculty Found</h3>
            <p>No faculty appointments match the selected search or departmental filter criteria.</p>
            <button
              type="button"
              className="fd-action-btn secondary"
              onClick={() => {
                setSearch("");
                setDepartment("");
                setDesignation("");
                setDutyStatus("ALL");
                loadFaculty({ page: 1, limit: PAGE_LIMIT });
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ================= VIEW 1: 3D HOLOGRAPHIC GRID ================= */
          <div className="fd-grid-display">
            {facultyList.map((faculty, idx) => (
              <FacultyCard
                key={faculty.id || faculty.userId}
                faculty={faculty}
                index={idx}
                callerRole={callerRole}
                isSelectedForCompare={selectedForCompare.some((f) => (f.id || f.userId) === (faculty.id || faculty.userId))}
                onToggleCompare={handleToggleCompare}
                onViewProfile={(id) => setDrawerFacultyId(id)}
                onShowDigitalPass={(f) => setDigitalPassFaculty(f)}
                onCopyEmail={handleCopyEmail}
              />
            ))}
          </div>
        ) : viewMode === "bento" ? (
          /* ================= VIEW 2: BENTO CARDS ================= */
          <div className="fd-bento-display">
            {facultyList.map((faculty, idx) => (
              <BentoFacultyCard
                key={faculty.id || faculty.userId}
                faculty={faculty}
                index={idx}
                isSelectedForCompare={selectedForCompare.some((f) => (f.id || f.userId) === (faculty.id || faculty.userId))}
                onToggleCompare={handleToggleCompare}
                onViewProfile={(id) => setDrawerFacultyId(id)}
                onShowDigitalPass={(f) => setDigitalPassFaculty(f)}
                onCopyEmail={handleCopyEmail}
              />
            ))}
          </div>
        ) : viewMode === "table" ? (
          /* ================= VIEW 3: ROSTER TABLE ================= */
          <div className="fd-table-container">
            <table className="fd-roster-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Assigned Subjects</th>
                  <th>Teaching Load</th>
                  <th>Duty Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.map((f) => {
                  const ini = (f.name || "?").slice(0, 2).toUpperCase();
                  const isComp = selectedForCompare.some((item) => (item.id || item.userId) === (f.id || f.userId));
                  return (
                    <tr key={f.id || f.userId} className={isComp ? "is-comparing" : ""}>
                      <td>
                        <div className="fd-tbl-avatar-cell">
                          <div className="fd-tbl-avatar">
                            {f.avatarUrl ? <img src={f.avatarUrl} alt="" /> : <span>{ini}</span>}
                          </div>
                          <div>
                            <strong className="clickable" onClick={() => setDrawerFacultyId(f.id || f.userId)}>{f.name}</strong>
                            <small>{f.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="fd-tbl-code">{f.employeeId || "EMP-FAC"}</code>
                      </td>
                      <td>
                        <span className={`fd-tbl-dept ${getDeptClass(f.department)}`}>
                          {getDeptShortName(f.department)}
                        </span>
                      </td>
                      <td>
                        <span className="fd-tbl-desig">{f.designation}</span>
                      </td>
                      <td>
                        <div className="fd-tbl-subjects">
                          {(f.subjects || []).slice(0, 2).map((s, i) => (
                            <span key={i} className="fd-tbl-sub-chip">{s}</span>
                          ))}
                          {(f.subjects || []).length > 2 && (
                            <span className="fd-tbl-sub-chip more">+{(f.subjects || []).length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="fd-tbl-load">
                          <span>{f.weeklyLoadHours || 0} hrs</span>
                          <div className="fd-tbl-load-bar">
                            <div
                              className="fd-tbl-load-fill"
                              style={{ width: `${Math.min(100, ((f.weeklyLoadHours || 0) / 16) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`fd-status-pill ${f.onLeaveToday ? "on-leave" : "on-duty"}`}>
                          {f.onLeaveToday ? "On Leave" : "On Duty Today"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="fd-tbl-actions">
                          <button
                            type="button"
                            className="fd-tbl-btn"
                            onClick={() => setDrawerFacultyId(f.id || f.userId)}
                            title="Inspect Academic Dossier"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            className="fd-tbl-btn"
                            onClick={() => setDigitalPassFaculty(f)}
                            title="View Digital Pass"
                          >
                            <QrCode size={13} />
                          </button>
                          <button
                            type="button"
                            className={`fd-tbl-btn ${isComp ? "active" : ""}`}
                            onClick={() => handleToggleCompare(f)}
                            title="Compare"
                          >
                            <Columns size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ================= VIEW 4: MASTER-DETAIL SPLIT INSPECTOR ================= */
          <SplitInspector
            facultyList={facultyList}
            selectedFaculty={splitSelectedFaculty}
            onSelectFaculty={(f) => setSplitSelectedFaculty(f)}
            onViewProfile={(id) => setDrawerFacultyId(id)}
            onShowDigitalPass={(f) => setDigitalPassFaculty(f)}
            onCopyEmail={handleCopyEmail}
          />
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="fd-pagination-bar">
            <span className="fd-page-info">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total faculty members)
            </span>
            <div className="fd-page-controls">
              <button
                type="button"
                className="fd-page-btn"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <div className="fd-page-numbers">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      className={`fd-page-num ${page === pNum ? "active" : ""}`}
                      onClick={() => handlePageChange(pNum)}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="fd-page-btn"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Filter Drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        department={department}
        setDepartment={setDepartment}
        designation={designation}
        setDesignation={setDesignation}
        dutyStatus={dutyStatus}
        setDutyStatus={setDutyStatus}
        onApply={() => {
          setFilterDrawerOpen(false);
          setPage(1);
          loadFaculty(buildParams({ page: 1 }));
        }}
        onReset={() => {
          setDepartment("");
          setDesignation("");
          setDutyStatus("ALL");
          setFilterDrawerOpen(false);
          setPage(1);
          loadFaculty(buildParams({ department: "", designation: "", dutyStatus: "ALL", page: 1 }));
        }}
      />

      {/* Slide-over Full Faculty Profile Dossier Drawer */}
      <FacultyProfileDrawer
        facultyId={drawerFacultyId}
        onClose={() => setDrawerFacultyId(null)}
        onShowDigitalPass={(f) => {
          setDrawerFacultyId(null);
          setDigitalPassFaculty(f);
        }}
      />

      {/* Digital Faculty Pass Modal */}
      <DigitalFacultyPassModal
        faculty={digitalPassFaculty}
        onClose={() => setDigitalPassFaculty(null)}
        onViewProfile={(id) => setDrawerFacultyId(id)}
      />

      {/* Side-by-side Faculty Compare Drawer */}
      <CompareDrawer
        selectedFaculty={selectedForCompare}
        onRemoveFromCompare={handleRemoveFromCompare}
        onClearCompare={handleClearCompare}
        onViewProfile={(id) => setDrawerFacultyId(id)}
      />
    </div>
  );
}
