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
  Flame, Zap, TrendingUp, Compass, Info, Star
} from "lucide-react";
import { authApi } from "../services/authApi";
import "./StudentsDirectory.css";

/* ======================================================
   CONSTANTS & CONFIGURATION
   ====================================================== */

const BRANCHES = ["All Branches", "CSE", "Mechanical", "Electrical", "Civil", "ECE"];

const SEMESTERS = [
  "All Semesters",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];

const YEARS = ["All Years", "1st Year", "2nd Year", "3rd Year"];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "verified", label: "Verified Credentials" },
  { value: "pending_verification", label: "Pending Verification" },
  { value: "suspended", label: "Suspended / Inactive" }
];

const SORT_OPTIONS = [
  { value: "default", label: "Default Academic Order" },
  { value: "name_asc", label: "Student Name (A → Z)" },
  { value: "name_desc", label: "Student Name (Z → A)" },
  { value: "enroll_asc", label: "Enrollment ID (Ascending)" },
  { value: "recent", label: "Recently Registered" }
];

const PAGE_LIMIT = 16;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ======================================================
   DETERMINISTIC ART (QR CODE & DIGITAL BARCODE)
   ====================================================== */

const makeRng = (seedText) => {
  let h = 2166136261;
  const str = String(seedText || "collegeos");
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
    const rnd = makeRng(`qr-${seed}`);
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
    <svg className="sd-qr-svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" shapeRendering="crispEdges">
      <path d={path} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

function BarcodeArt({ seed, bars = 36 }) {
  const data = useMemo(() => {
    const rnd = makeRng(`bar-${seed}`);
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
    <svg className="sd-barcode-svg" viewBox={`0 0 ${data.width} 10`} preserveAspectRatio="none" aria-hidden="true">
      {data.out.map((r, i) => (
        <rect key={i} x={r.x} y="0" width={r.w} height="10" fill="currentColor" />
      ))}
    </svg>
  );
}

/* ======================================================
   CARD 1: HOLOGRAPHIC 3D IDENTITY CARD (Grid View)
   ====================================================== */

function StudentCard({
  student,
  index,
  callerRole,
  isSelectedForCompare,
  onToggleCompare,
  onViewProfile,
  onShowDigitalPass,
  onDeactivate,
  onReactivate
}) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);

  const initials = (student.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const canManageStatus = ["principal", "admin"].includes(callerRole);
  const isSuspended = student.status === "suspended";
  const isPending = student.status === "pending_verification";
  const isVerified = student.status === "verified";
  const showStaffDetails = callerRole !== "student";
  const seed = student.enrollmentNo || student.id || student.fullName;
  const skills = student.skills || [];

  const branchLower = (student.branch || "").toLowerCase();
  const branchClass = branchLower.includes("cse")
    ? "branch-cse"
    : branchLower.includes("mech")
    ? "branch-mech"
    : branchLower.includes("elec")
    ? "branch-elec"
    : branchLower.includes("civil")
    ? "branch-civil"
    : branchLower.includes("ece")
    ? "branch-ece"
    : "branch-default";

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
      className={`sd-idcard ${branchClass} ${isSuspended ? "is-suspended" : ""} ${flipped ? "is-flipped" : ""} ${isSelectedForCompare ? "is-comparing" : ""}`}
      style={{ "--card-index": Math.min(index, 15) }}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label={`Student Identity Card: ${student.fullName}`}
    >
      <div className="sd-idcard-inner">
        {/* ================= FRONT FACE ================= */}
        <div className="sd-card-face sd-face-front" aria-hidden={flipped}>
          {/* Holographic Sheen Overlay */}
          <div className="sd-foil-sheen" aria-hidden="true" />

          {/* Card Top Branding Strip */}
          <div className="sd-card-topbar">
            <div className="sd-poly-brand">
              <span className="sd-poly-icon"><GraduationCap size={13} strokeWidth={2.4} /></span>
              <span className="sd-poly-text">SUBHARTI POLYTECHNIC</span>
            </div>

            <div className="sd-topbar-right-group">
              {/* Compare Checkbox */}
              <button
                type="button"
                className={`sd-compare-toggle ${isSelectedForCompare ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(student);
                }}
                title={isSelectedForCompare ? "Remove from comparison" : "Add to side-by-side comparison"}
                aria-label={`Compare ${student.fullName}`}
              >
                {isSelectedForCompare ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>Compare</span>
              </button>

              <div className="sd-status-indicator">
                {isSuspended ? (
                  <span className="sd-status-pill suspended">
                    <span className="sd-dot suspended" /> Paused
                  </span>
                ) : isPending ? (
                  <span className="sd-status-pill pending">
                    <span className="sd-dot pending" /> Pending
                  </span>
                ) : (
                  <span className="sd-status-pill verified">
                    <span className="sd-dot verified" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Header (Avatar + Name + Monospace ID) */}
          <div className="sd-card-header">
            <div className="sd-avatar-wrapper" onClick={() => onShowDigitalPass(student)} title="Click to view full digital credential pass">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.fullName}
                  className="sd-avatar-img"
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
                className="sd-avatar-initials"
                style={student.avatarUrl ? { display: "none" } : undefined}
                aria-hidden="true"
              >
                {initials}
              </div>
              <span className={`sd-live-status ${isSuspended ? "off" : "on"}`} />
              {isVerified && (
                <span className="sd-avatar-verified-badge" title="Identity Verified by Subharti Polytechnic">
                  <BadgeCheck size={12} strokeWidth={2.6} />
                </span>
              )}
            </div>

            <div className="sd-header-text">
              <h3 className="sd-student-name" title={student.fullName}>
                {student.fullName}
              </h3>
              <div className="sd-enroll-pill">
                <span className="sd-enroll-tag">ID</span>
                <code className="sd-enroll-code">
                  {student.enrollmentNo || "SUB-POLY-UNASSIGNED"}
                </code>
              </div>
            </div>
          </div>

          {/* Academic Metadata Chips */}
          <div className="sd-meta-cluster">
            <span className="sd-meta-chip branch" title={`Department: ${student.branch || "General"}`}>
              <BookOpen size={11} />
              <span>{student.branch || "General"}</span>
            </span>
            <span className="sd-meta-chip sem" title={`Current Semester: ${student.semester || "Semester 1"}`}>
              <Calendar size={11} />
              <span>{student.semester || "Sem 1"}</span>
            </span>
            <span className="sd-meta-chip year" title={`Academic Year: ${student.academicYear || "1st Year"}`}>
              <GraduationCap size={11} />
              <span>{student.academicYear || "1st Year"}</span>
            </span>
          </div>

          {/* Skills / Bio preview */}
          <div className="sd-card-snippet">
            {skills.length > 0 && (
              <div className="sd-card-skills-row">
                {skills.slice(0, 3).map((sk, idx) => (
                  <span key={idx} className="sd-mini-skill-pill">{sk}</span>
                ))}
                {skills.length > 3 && (
                  <span className="sd-mini-skill-pill more">+{skills.length - 3}</span>
                )}
              </div>
            )}

            {showStaffDetails && student.email ? (
              <div className="sd-snippet-row" title={student.email}>
                <Mail size={11} />
                <span className="sd-snippet-text">{student.email}</span>
              </div>
            ) : student.bio ? (
              <p className="sd-bio-snippet">{student.bio.slice(0, 85)}{student.bio.length > 85 ? "…" : ""}</p>
            ) : (
              <p className="sd-bio-snippet muted">Polytechnic Diploma Candidate • Academic Session 2024–2025</p>
            )}

            {showStaffDetails && student.attendancePercentage !== undefined && student.attendancePercentage !== null && (
              <div className="sd-attendance-pill">
                <span className="sd-att-label">Attendance</span>
                <span className={`sd-att-val ${student.attendancePercentage >= 75 ? "good" : "warn"}`}>
                  {student.attendancePercentage}%
                </span>
              </div>
            )}
          </div>

          {/* Perforated Security Divider */}
          <div className="sd-perf-divider" aria-hidden="true">
            <span className="sd-perf-line" />
          </div>

          {/* Card Foot: QR Code + Barcode + Actions */}
          <div className="sd-card-foot">
            <div className="sd-security-art" onClick={() => onShowDigitalPass(student)} title="Click to enlarge official digital ID pass">
              <div className="sd-qr-box" title="Institutional Security Stamp">
                <QrArt seed={seed} />
              </div>
              <div className="sd-barcode-box" title="Monospace Digital Barcode">
                <BarcodeArt seed={seed} />
              </div>
            </div>

            <div className="sd-card-actions">
              {/* Single primary View Profile button */}
              <button
                type="button"
                className="sd-btn sd-btn-profile"
                onClick={() => onViewProfile(student.id)}
                aria-label={`View full profile of ${student.fullName}`}
              >
                <Eye size={13} />
                <span>View Profile</span>
              </button>

              {/* Quick flip toggle button */}
              <button
                type="button"
                className={`sd-btn-icon sd-btn-flip ${flipped ? "active" : ""}`}
                onClick={() => setFlipped(true)}
                title="View student credentials & verified skills"
                aria-label="View back of identity card"
              >
                <RotateCw size={13} />
              </button>

              {/* Admin / Principal status actions */}
              {canManageStatus && !isSuspended && (
                <button
                  type="button"
                  className="sd-btn-icon sd-btn-deactivate"
                  onClick={() => onDeactivate(student)}
                  title="Pause student account access"
                  aria-label={`Deactivate ${student.fullName}`}
                >
                  <UserX size={13} />
                </button>
              )}

              {canManageStatus && isSuspended && (
                <button
                  type="button"
                  className="sd-btn-icon sd-btn-reactivate"
                  onClick={() => onReactivate(student)}
                  title="Restore active campus access"
                  aria-label={`Reactivate ${student.fullName}`}
                >
                  <UserCheck size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= BACK FACE ================= */}
        <div className="sd-card-face sd-face-back" aria-hidden={!flipped}>
          <div className="sd-back-topbar">
            <span className="sd-back-title">
              <Sparkles size={12} /> Institutional Dossier
            </span>
            <button
              type="button"
              className="sd-back-close"
              onClick={() => setFlipped(false)}
              aria-label="Return to front of card"
            >
              <RotateCw size={12} />
            </button>
          </div>

          <div className="sd-back-content">
            <div className="sd-back-section">
              <h4 className="sd-back-heading">Academic Profile</h4>
              <p className="sd-back-bio">
                {student.bio || "Candidate has not authored an extended biography. Academic curriculum status is compliant with department guidelines."}
              </p>
            </div>

            {skills.length > 0 && (
              <div className="sd-back-section">
                <h4 className="sd-back-heading">Verified Competencies</h4>
                <div className="sd-skills-cloud">
                  {skills.slice(0, 6).map((skill, i) => (
                    <span key={i} className="sd-skill-pill">
                      {skill}
                    </span>
                  ))}
                  {skills.length > 6 && (
                    <span className="sd-skill-pill more">+{skills.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {student.email && (
              <div className="sd-back-section">
                <h4 className="sd-back-heading">Official Directory Email</h4>
                <div className="sd-back-contact">
                  <Mail size={11} />
                  <span>{student.email}</span>
                </div>
              </div>
            )}
          </div>

          <div className="sd-back-foot">
            <p className="sd-property-text">
              Official Credential • Swami Vivekanand Subharti University
            </p>
            <div className="sd-back-action-row">
              <button
                type="button"
                className="sd-btn sd-btn-profile sd-back-profile-btn"
                onClick={() => onViewProfile(student.id)}
              >
                <Eye size={13} /> Full Profile
              </button>
              <button
                type="button"
                className="sd-btn sd-btn-secondary"
                onClick={() => onShowDigitalPass(student)}
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

function BentoStudentCard({
  student,
  index,
  callerRole,
  isSelectedForCompare,
  onToggleCompare,
  onViewProfile,
  onShowDigitalPass
}) {
  const initials = (student.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isVerified = student.status === "verified";
  const isSuspended = student.status === "suspended";
  const skills = student.skills || [];

  return (
    <div
      className={`sd-bento-profile-card ${isSelectedForCompare ? "is-comparing" : ""}`}
      style={{ "--bento-idx": Math.min(index, 12) }}
    >
      <div className="sd-bpc-top">
        <div className="sd-bpc-avatar-group">
          <div className="sd-bpc-avatar" onClick={() => onShowDigitalPass(student)}>
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt="" className="sd-bpc-img" />
            ) : (
              <span className="sd-bpc-initials">{initials}</span>
            )}
            <span className={`sd-live-status ${isSuspended ? "off" : "on"}`} />
          </div>
          <div>
            <div className="sd-bpc-name-row">
              <h4 className="sd-bpc-name" onClick={() => onViewProfile(student.id)}>
                {student.fullName}
              </h4>
              {isVerified && <BadgeCheck size={14} className="sd-verified-badge-icon" />}
            </div>
            <code className="sd-bpc-code">{student.enrollmentNo || "SUB-POLY-2024"}</code>
          </div>
        </div>

        <button
          type="button"
          className={`sd-bpc-compare-btn ${isSelectedForCompare ? "active" : ""}`}
          onClick={() => onToggleCompare(student)}
          title="Toggle side-by-side comparison"
        >
          {isSelectedForCompare ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>
      </div>

      <div className="sd-bpc-meta-row">
        <span className="sd-bpc-pill branch">{student.branch || "General"}</span>
        <span className="sd-bpc-pill sem">{student.semester || "Sem 1"}</span>
        <span className="sd-bpc-pill year">{student.academicYear || "1st Year"}</span>
        <span className={`sd-bpc-pill status ${student.status || "active"}`}>
          {student.status === "suspended" ? "Paused" : student.status === "pending_verification" ? "Pending" : "Active"}
        </span>
      </div>

      {skills.length > 0 && (
        <div className="sd-bpc-skills">
          {skills.slice(0, 4).map((sk, idx) => (
            <span key={idx} className="sd-bpc-skill-chip">{sk}</span>
          ))}
          {skills.length > 4 && <span className="sd-bpc-skill-chip more">+{skills.length - 4}</span>}
        </div>
      )}

      {student.bio && (
        <p className="sd-bpc-bio">{student.bio.slice(0, 95)}{student.bio.length > 95 ? "…" : ""}</p>
      )}

      <div className="sd-bpc-foot">
        <button
          type="button"
          className="sd-bpc-action-btn primary"
          onClick={() => onViewProfile(student.id)}
        >
          <Eye size={13} />
          <span>Profile Dossier</span>
        </button>

        <button
          type="button"
          className="sd-bpc-action-btn pass"
          onClick={() => onShowDigitalPass(student)}
          title="View digital ID pass"
        >
          <QrCode size={13} />
          <span>Digital ID</span>
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   VIEW 3: MASTER-DETAIL SPLIT INSPECTOR
   ====================================================== */

function SplitInspector({
  students,
  selectedStudent,
  onSelectStudent,
  onViewProfile,
  onShowDigitalPass
}) {
  const current = selectedStudent || students[0] || null;

  if (!current) {
    return (
      <div className="sd-split-empty">
        <Users size={32} />
        <p>No student selected for inspection</p>
      </div>
    );
  }

  const initials = (current.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isVerified = current.status === "verified";
  const skills = current.skills || [];

  return (
    <div className="sd-split-container">
      {/* Left Pane: Roster List */}
      <div className="sd-split-roster-pane">
        <div className="sd-split-roster-header">
          <Users size={14} />
          <span>Active Roster ({students.length})</span>
        </div>
        <div className="sd-split-roster-list">
          {students.map((st) => {
            const isCur = current.id === st.id;
            const ini = (st.fullName || "?").slice(0, 2).toUpperCase();
            return (
              <div
                key={st.id}
                className={`sd-split-roster-item ${isCur ? "selected" : ""}`}
                onClick={() => onSelectStudent(st)}
              >
                <div className="sd-sri-avatar">
                  {st.avatarUrl ? <img src={st.avatarUrl} alt="" /> : <span>{ini}</span>}
                </div>
                <div className="sd-sri-info">
                  <strong>{st.fullName}</strong>
                  <small>{st.enrollmentNo || "SUB-POLY-2024"} • {st.branch || "General"}</small>
                </div>
                {st.status === "verified" && <BadgeCheck size={14} className="sd-sri-verified" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Deep Inspector Dossier */}
      <div className="sd-split-detail-pane">
        <div className="sd-detail-hero">
          <div className="sd-detail-ambient-orb" />
          <div className="sd-detail-avatar-box">
            {current.avatarUrl ? (
              <img src={current.avatarUrl} alt="" className="sd-detail-avatar" />
            ) : (
              <span className="sd-detail-avatar-ini">{initials}</span>
            )}
            <span className={`sd-live-status ${current.status === "suspended" ? "off" : "on"}`} />
          </div>

          <div className="sd-detail-hero-info">
            <div className="sd-detail-name-row">
              <h2>{current.fullName}</h2>
              {isVerified && (
                <span className="sd-verified-tag">
                  <BadgeCheck size={13} /> Verified Scholar
                </span>
              )}
            </div>
            <code className="sd-detail-enrollment">{current.enrollmentNo || "SUB-CSE-2024-001"}</code>
            <p className="sd-detail-bio">{current.bio || "Student enrolled in Diploma Engineering program."}</p>
          </div>
        </div>

        {/* Quick KPI Cluster */}
        <div className="sd-detail-kpi-grid">
          <div className="sd-detail-kpi">
            <span className="sd-kpi-title">Department</span>
            <strong>{current.branch || "CSE"}</strong>
          </div>
          <div className="sd-detail-kpi">
            <span className="sd-kpi-title">Current Semester</span>
            <strong>{current.semester || "Semester 5"}</strong>
          </div>
          <div className="sd-detail-kpi">
            <span className="sd-kpi-title">Academic Year</span>
            <strong>{current.academicYear || "3rd Year"}</strong>
          </div>
          <div className="sd-detail-kpi">
            <span className="sd-kpi-title">Campus Status</span>
            <span className={`sd-status-pill ${current.status || "verified"}`}>
              {current.status === "suspended" ? "Paused" : "Active & Verified"}
            </span>
          </div>
        </div>

        {/* Skills & Competencies */}
        {skills.length > 0 && (
          <div className="sd-detail-skills-section">
            <h4><Sparkles size={14} /> Verified Technical Skills</h4>
            <div className="sd-detail-skills-cloud">
              {skills.map((s, idx) => (
                <span key={idx} className="sd-detail-skill-chip">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="sd-detail-contact-section">
          <h4><Mail size={14} /> Official Directory Communication</h4>
          <div className="sd-detail-contact-card">
            <span>Email Address:</span>
            <strong>{current.email || "student@subharti.edu.in"}</strong>
          </div>
        </div>

        {/* Detail Action Toolbar */}
        <div className="sd-detail-actions">
          <button
            type="button"
            className="sd-action-btn primary"
            onClick={() => onViewProfile(current.id)}
          >
            <Eye size={14} />
            <span>Open Comprehensive Student Dossier</span>
          </button>
          <button
            type="button"
            className="sd-action-btn secondary"
            onClick={() => onShowDigitalPass(current)}
          >
            <QrCode size={14} />
            <span>View Digital ID Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SIDE-BY-SIDE STUDENT COMPARISON DRAWER
   ====================================================== */

function CompareDrawer({
  selectedStudents,
  onRemoveFromCompare,
  onClearCompare,
  onViewProfile
}) {
  if (selectedStudents.length === 0) return null;

  return (
    <aside className="sd-compare-tray" aria-label="Selected students comparison tray">
      <div className="sd-compare-bar">
        <div className="sd-compare-left">
          <div className="sd-compare-icon-wrap">
            <Columns size={16} />
          </div>
          <div>
            <strong>Student Comparison Mode</strong>
            <small>{selectedStudents.length} of 3 students staged for comparison</small>
          </div>
        </div>

        <div className="sd-compare-pills-row">
          {selectedStudents.map((st) => (
            <div key={st.id} className="sd-compare-mini-chip">
              <span>{st.fullName}</span>
              <button
                type="button"
                onClick={() => onRemoveFromCompare(st.id)}
                aria-label={`Remove ${st.fullName}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="sd-compare-actions">
          <button type="button" className="sd-compare-btn clear" onClick={onClearCompare}>
            Clear
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Comparison Grid */}
      <div className="sd-compare-grid">
        {selectedStudents.map((st) => {
          const ini = (st.fullName || "?").slice(0, 2).toUpperCase();
          return (
            <div key={st.id} className="sd-compare-column">
              <div className="sd-comp-head">
                <div className="sd-comp-avatar">
                  {st.avatarUrl ? <img src={st.avatarUrl} alt="" /> : <span>{ini}</span>}
                </div>
                <div>
                  <h4>{st.fullName}</h4>
                  <code>{st.enrollmentNo || "SUB-POLY-2024"}</code>
                </div>
              </div>

              <div className="sd-comp-specs">
                <div className="sd-comp-row">
                  <span>Branch:</span>
                  <strong>{st.branch || "General"}</strong>
                </div>
                <div className="sd-comp-row">
                  <span>Semester:</span>
                  <strong>{st.semester || "Semester 1"}</strong>
                </div>
                <div className="sd-comp-row">
                  <span>Year:</span>
                  <strong>{st.academicYear || "1st Year"}</strong>
                </div>
                <div className="sd-comp-row">
                  <span>Status:</span>
                  <span className={`sd-status-pill ${st.status || "verified"}`}>
                    {st.status === "suspended" ? "Paused" : "Active"}
                  </span>
                </div>
                {st.email && (
                  <div className="sd-comp-row">
                    <span>Email:</span>
                    <strong className="truncate">{st.email}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="sd-btn sd-btn-profile w-full"
                onClick={() => onViewProfile(st.id)}
              >
                <Eye size={12} /> Inspect Profile
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ======================================================
   DIGITAL STUDENT ID PASS SHOWCASE MODAL
   ====================================================== */

function DigitalIdModal({ student, onClose, onViewProfile }) {
  if (!student) return null;

  const initials = (student.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const seed = student.enrollmentNo || student.id || student.fullName;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sd-modal-backdrop" onClick={onClose}>
      <div className="sd-id-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sd-idm-top">
          <div className="sd-idm-poly-seal">
            <GraduationCap size={18} />
            <div>
              <h3>SWAMI VIVEKANAND SUBHARTI UNIVERSITY</h3>
              <p>Subharti Polytechnic College • Digital Credential Pass</p>
            </div>
          </div>
          <button type="button" className="sd-modal-close-icon" onClick={onClose} aria-label="Close ID pass">
            <X size={18} />
          </button>
        </div>

        {/* Physical ID Pass Visual */}
        <div className="sd-physical-pass" id="printable-id-pass">
          <div className="sd-pass-header">
            <span className="sd-pass-inst">COLLEGEOS SMART CREDENTIAL PASS</span>
            <span className="sd-pass-session">SESSION 2024–2027</span>
          </div>

          <div className="sd-pass-body">
            <div className="sd-pass-photo-box">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt="" className="sd-pass-photo" />
              ) : (
                <span className="sd-pass-initials">{initials}</span>
              )}
              <span className="sd-pass-verified-seal"><BadgeCheck size={16} /></span>
            </div>

            <div className="sd-pass-details">
              <h2 className="sd-pass-name">{student.fullName}</h2>
              <div className="sd-pass-spec-grid">
                <div>
                  <span className="lbl">ENROLLMENT NO</span>
                  <strong>{student.enrollmentNo || "SUB-CSE-2024-042"}</strong>
                </div>
                <div>
                  <span className="lbl">DEPARTMENT</span>
                  <strong>{student.branch || "CSE"}</strong>
                </div>
                <div>
                  <span className="lbl">SEMESTER</span>
                  <strong>{student.semester || "5th Semester"}</strong>
                </div>
                <div>
                  <span className="lbl">ACADEMIC YEAR</span>
                  <strong>{student.academicYear || "3rd Year"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="sd-pass-security-footer">
            <div className="sd-pass-qr">
              <QrArt seed={seed} size={25} />
            </div>
            <div className="sd-pass-barcode-wrap">
              <BarcodeArt seed={seed} bars={48} />
              <code>* {student.enrollmentNo || student.id} *</code>
            </div>
          </div>
        </div>

        {/* Pass Actions */}
        <div className="sd-idm-actions">
          <button type="button" className="sd-action-btn secondary" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Official ID Card</span>
          </button>
          <button
            type="button"
            className="sd-action-btn primary"
            onClick={() => {
              onClose();
              onViewProfile(student.id);
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
  branch,
  setBranch,
  semester,
  setSemester,
  academicYear,
  setAcademicYear,
  status,
  setStatus,
  onApply,
  onReset
}) {
  if (!open) return null;

  return (
    <div className="sd-drawer-backdrop" onClick={onClose}>
      <div className="sd-filter-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="sd-drawer-header">
          <div className="sd-drawer-title">
            <SlidersHorizontal size={18} />
            <h3>Advanced Directory Filters</h3>
          </div>
          <button type="button" className="sd-modal-close-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="sd-drawer-body">
          {/* Branch Section */}
          <div className="sd-drawer-section">
            <label className="sd-drawer-label">Department / Branch</label>
            <div className="sd-drawer-chips-grid">
              {BRANCHES.map((b) => {
                const isAll = b === "All Branches";
                const isAct = isAll ? !branch : branch === b;
                return (
                  <button
                    key={b}
                    type="button"
                    className={`sd-drawer-chip ${isAct ? "active" : ""}`}
                    onClick={() => setBranch(isAll ? "" : b)}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Semester Section */}
          <div className="sd-drawer-section">
            <label className="sd-drawer-label">Current Academic Semester</label>
            <div className="sd-drawer-chips-grid">
              {SEMESTERS.map((s) => {
                const isAll = s === "All Semesters";
                const isAct = isAll ? !semester : semester === s;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`sd-drawer-chip ${isAct ? "active" : ""}`}
                    onClick={() => setSemester(isAll ? "" : s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Year Section */}
          <div className="sd-drawer-section">
            <label className="sd-drawer-label">Academic Year</label>
            <div className="sd-drawer-chips-grid">
              {YEARS.map((y) => {
                const isAll = y === "All Years";
                const isAct = isAll ? !academicYear : academicYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    className={`sd-drawer-chip ${isAct ? "active" : ""}`}
                    onClick={() => setAcademicYear(isAll ? "" : y)}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Status Section */}
          <div className="sd-drawer-section">
            <label className="sd-drawer-label">Institutional Status</label>
            <div className="sd-drawer-chips-grid">
              {STATUS_OPTIONS.map((st) => {
                const isAct = status === st.value;
                return (
                  <button
                    key={st.value || "all"}
                    type="button"
                    className={`sd-drawer-chip ${isAct ? "active" : ""}`}
                    onClick={() => setStatus(st.value)}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sd-drawer-footer">
          <button type="button" className="sd-drawer-btn reset" onClick={onReset}>
            Reset Filters
          </button>
          <button type="button" className="sd-drawer-btn apply" onClick={onApply}>
            Apply Criteria
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SHIMMER SKELETON LOADING CARD
   ====================================================== */

function SkeletonCard() {
  return (
    <div className="sd-idcard sd-skeleton" aria-hidden="true">
      <div className="sd-idcard-inner">
        <div className="sd-card-face sd-face-front">
          <div className="sd-card-topbar">
            <div className="sd-sk-line sd-sk-brand" />
            <div className="sd-sk-line sd-sk-badge" />
          </div>

          <div className="sd-card-header">
            <div className="sd-sk-avatar" />
            <div className="sd-sk-header-lines">
              <div className="sd-sk-line sd-sk-name" />
              <div className="sd-sk-line sd-sk-id" />
            </div>
          </div>

          <div className="sd-meta-cluster">
            <div className="sd-sk-line sd-sk-chip" />
            <div className="sd-sk-line sd-sk-chip" />
            <div className="sd-sk-line sd-sk-chip" />
          </div>

          <div className="sd-card-snippet">
            <div className="sd-sk-line sd-sk-bio1" />
            <div className="sd-sk-line sd-sk-bio2" />
          </div>

          <div className="sd-perf-divider" />

          <div className="sd-card-foot">
            <div className="sd-sk-line sd-sk-qr" />
            <div className="sd-sk-line sd-sk-btn" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   CONFIRMATION MODAL (DEACTIVATE / REACTIVATE)
   ====================================================== */

function ConfirmModal({ open, student, action, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !student) return null;
  const isDeactivate = action === "deactivate";

  return (
    <div className="sd-modal-backdrop" onClick={onCancel}>
      <div
        className="sd-modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sd-modal-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sd-modal-icon-ring ${isDeactivate ? "danger" : "success"}`}>
          {isDeactivate ? <UserX size={26} /> : <UserCheck size={26} />}
        </div>
        <h3 id="sd-modal-heading" className="sd-modal-title">
          {isDeactivate ? "Deactivate Student Access" : "Reactivate Student Access"}
        </h3>
        <p className="sd-modal-text">
          {isDeactivate
            ? "Are you sure you want to pause institutional access for "
            : "Are you sure you want to restore active campus access for "}
          <strong>{student.fullName}</strong> ({student.enrollmentNo || "Student"})?
        </p>
        <p className="sd-modal-subtext">
          {isDeactivate
            ? "The student will be temporarily blocked from signing into the portal. Academic history and records will remain safely intact."
            : "The student will be able to log in to CollegeOS immediately."}
        </p>

        <div className="sd-modal-actions">
          <button type="button" className="sd-modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`sd-modal-btn confirm ${isDeactivate ? "danger" : "success"}`}
            onClick={onConfirm}
          >
            {isDeactivate ? "Yes, Deactivate" : "Yes, Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   ADD STUDENT MODAL FOR AUTHORIZED STAFF
   ====================================================== */

function AddStudentModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "Student@12345",
    branch: "CSE",
    semester: "Semester 1",
    academicYear: "1st Year",
    enrollmentNo: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setFormError("Full Name and valid email are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password || "Student@12345",
          role: "student",
          branch: formData.branch,
          semester: formData.semester,
          academicYear: formData.academicYear,
          enrollmentNo: formData.enrollmentNo.trim() || undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Failed to register student.");
      }
      onSuccess(`Student ${formData.fullName} enrolled successfully!`);
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to enroll student.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sd-modal-backdrop" onClick={onClose}>
      <div className="sd-modal-card sd-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-add-modal-header">
          <div className="sd-modal-icon-ring primary">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="sd-modal-title">Enroll New Student Candidate</h3>
            <p className="sd-modal-subtext">Issue authenticated institutional credentials for Subharti Polytechnic.</p>
          </div>
          <button type="button" className="sd-modal-close-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {formError && (
          <div className="sd-form-error">
            <AlertTriangle size={14} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="sd-add-form">
          <div className="sd-form-grid">
            <div className="sd-form-field">
              <label>Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Satyam Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="sd-form-field">
              <label>Institutional Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. satyam@subharti.edu.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="sd-form-field">
              <label>Department / Branch *</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              >
                {BRANCHES.filter((b) => b !== "All Branches").map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="sd-form-field">
              <label>Current Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                {SEMESTERS.filter((s) => s !== "All Semesters").map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sd-form-field">
              <label>Academic Year</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              >
                {YEARS.filter((y) => y !== "All Years").map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="sd-form-field">
              <label>Enrollment Number</label>
              <input
                type="text"
                placeholder="e.g. SUB-CSE-2024-042"
                value={formData.enrollmentNo}
                onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
              />
            </div>
          </div>

          <div className="sd-modal-actions">
            <button type="button" className="sd-modal-btn cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="sd-modal-btn confirm primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
              <span>{submitting ? "Enrolling Candidate..." : "Enroll Student"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ======================================================
   MAIN COMPONENT: StudentsDirectory
   ====================================================== */

export default function StudentsDirectory({
  currentUser: propUser,
  onViewStudentProfile,
  onSelectStudent,
  onNavigate
}) {
  const currentUser = propUser || authApi.getCurrentUser();
  const callerRole = currentUser?.role || "student";
  const canAddStudent = ["admin", "principal", "hod", "coordinator"].includes(callerRole);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "bento" | "table" | "split"
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Modals & Interactive States
  const [confirmModal, setConfirmModal] = useState({ open: false, student: null, action: null });
  const [showAddModal, setShowAddModal] = useState(false);
  const [digitalPassStudent, setDigitalPassStudent] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [splitSelectedStudent, setSplitSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const searchInputRef = useRef(null);
  const searchTimeout = useRef(null);
  const toastTimeout = useRef(null);

  // Global Keyboard Shortcuts (Ctrl+K or / to search, Esc to close drawers)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (filterDrawerOpen) setFilterDrawerOpen(false);
        if (digitalPassStudent) setDigitalPassStudent(null);
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filterDrawerOpen, digitalPassStudent, showAddModal]);

  // Load students with backend API
  const loadStudents = useCallback(async (params, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const result = await authApi.getStudentsDirectory(params);
      setStudents(result.students || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load student directory from server.");
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const buildParams = useCallback(
    (overrides = {}) => {
      const p = {
        page: overrides.page ?? page,
        limit: PAGE_LIMIT
      };
      const s = overrides.search !== undefined ? overrides.search : search;
      const b = overrides.branch !== undefined ? overrides.branch : branch;
      const sm = overrides.semester !== undefined ? overrides.semester : semester;
      const ay = overrides.academicYear !== undefined ? overrides.academicYear : academicYear;
      const st = overrides.status !== undefined ? overrides.status : status;

      if (s) p.search = s;
      if (b) p.branch = b;
      if (sm) p.semester = sm;
      if (ay) p.academicYear = ay;
      if (st) p.status = st;
      return p;
    },
    [page, search, branch, semester, academicYear, status]
  );

  // Fetch when page, branch, semester, academicYear, or status changes
  useEffect(() => {
    const params = buildParams();
    loadStudents(params);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [page, branch, semester, academicYear, status]); // eslint-disable-line

  useEffect(() => () => clearTimeout(toastTimeout.current), []);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadStudents(buildParams({ search: val, page: 1 }));
    }, 350);
  };

  const clearSearch = () => {
    setSearch("");
    clearTimeout(searchTimeout.current);
    setPage(1);
    loadStudents(buildParams({ search: "", page: 1 }));
  };

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimeout.current);
    setToast({ show: true, message, type });
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleRefresh = () => {
    loadStudents(buildParams(), true);
  };

  const clearAllFilters = () => {
    setBranch("");
    setSemester("");
    setAcademicYear("");
    setStatus("");
    setSearch("");
    setSortBy("default");
    setPage(1);
    loadStudents({ page: 1, limit: PAGE_LIMIT });
  };

  // Client-side sort applied on fetched students
  const sortedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    const list = [...students];
    if (sortBy === "name_asc") {
      list.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    } else if (sortBy === "name_desc") {
      list.sort((a, b) => (b.fullName || "").localeCompare(a.fullName || ""));
    } else if (sortBy === "enroll_asc") {
      list.sort((a, b) => (a.enrollmentNo || "").localeCompare(b.enrollmentNo || ""));
    } else if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [students, sortBy]);

  // Analytics Bento Grid calculations
  const analyticsStats = useMemo(() => {
    const totalEnrolled = total || students.length;
    let verifiedCount = 0;
    let cseCount = 0;
    let otherBranchesCount = 0;

    students.forEach((s) => {
      if (s.status === "verified") verifiedCount += 1;
      const b = (s.branch || "").toUpperCase();
      if (b.includes("CSE") || b.includes("COMPUTER")) {
        cseCount += 1;
      } else {
        otherBranchesCount += 1;
      }
    });

    return {
      total: totalEnrolled,
      activeVerified: verifiedCount,
      cse: cseCount,
      otherBranches: otherBranchesCount
    };
  }, [students, total]);

  // Comparison Handlers
  const handleToggleCompare = (student) => {
    setSelectedForCompare((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) {
        return prev.filter((s) => s.id !== student.id);
      }
      if (prev.length >= 3) {
        showToast("You can compare up to 3 students simultaneously.", "warn");
        return prev;
      }
      return [...prev, student];
    });
  };

  const handleRemoveFromCompare = (id) => {
    setSelectedForCompare((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearCompare = () => {
    setSelectedForCompare([]);
  };

  // Profile navigation handler
  const handleViewProfile = (studentId) => {
    if (onSelectStudent) {
      onSelectStudent(studentId);
    } else if (onViewStudentProfile) {
      onViewStudentProfile(studentId);
    } else if (onNavigate) {
      onNavigate("student-profile", studentId);
    } else {
      window.location.hash = `#/students/${studentId}`;
    }
  };

  // Status moderation
  const handleDeactivate = (student) => {
    setConfirmModal({ open: true, student, action: "deactivate" });
  };

  const handleReactivate = (student) => {
    setConfirmModal({ open: true, student, action: "reactivate" });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, student: null, action: null });
  };

  const handleConfirmAction = async () => {
    const { student, action } = confirmModal;
    setActionLoading(true);
    try {
      if (action === "deactivate") {
        await authApi.deactivateStudent(student.id);
        showToast(`Account for ${student.fullName} has been deactivated.`, "warn");
      } else {
        await authApi.reactivateStudent(student.id);
        showToast(`Account for ${student.fullName} has been reactivated.`, "success");
      }
      closeConfirmModal();
      loadStudents(buildParams());
    } catch (err) {
      showToast(err.message || "Failed to update account status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast("No student records available to export.", "error");
      return;
    }

    const headers = [
      "Student ID",
      "Full Name",
      "Enrollment Number",
      "Department/Branch",
      "Semester",
      "Academic Year",
      "Account Status",
      "Email",
      "Registered Date"
    ];

    const rows = sortedStudents.map((s) => [
      `"${s.id || ""}"`,
      `"${(s.fullName || "").replace(/"/g, '""')}"`,
      `"${s.enrollmentNo || "N/A"}"`,
      `"${s.branch || "General"}"`,
      `"${s.semester || "Sem 1"}"`,
      `"${s.academicYear || "1st Year"}"`,
      `"${s.status || "active"}"`,
      `"${s.email || ""}"`,
      `"${s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collegeos_students_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 20000);
    showToast("Student directory CSV exported successfully!");
  };

  const activeFiltersCount = [branch, semester, academicYear, status].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || !!search;

  return (
    <div className="sd-page-container">
      {/* Decorative Cyber Ambient Glow Mesh */}
      <div className="sd-ambient-mesh orb-1" aria-hidden="true" />
      <div className="sd-ambient-mesh orb-2" aria-hidden="true" />
      <div className="sd-ambient-mesh orb-3" aria-hidden="true" />

      {/* ================= 1. PAGE HEADER ================= */}
      <header className="sd-header">
        <div className="sd-header-left">
          {/* Breadcrumb Navigation */}
          <nav className="sd-breadcrumbs" aria-label="Breadcrumb">
            <span className="sd-crumb root">CollegeOS</span>
            <span className="sd-crumb-sep">/</span>
            <span className="sd-crumb">Academic Command</span>
            <span className="sd-crumb-sep">/</span>
            <span className="sd-crumb active">All Students Directory</span>
          </nav>

          <div className="sd-title-cluster">
            <div className="sd-title-icon-box">
              <Users size={24} className="sd-title-icon" />
              <span className="sd-icon-glow" aria-hidden="true" />
            </div>
            <div>
              <div className="sd-heading-row">
                <h1 className="sd-page-title">All Students</h1>
                <span className="sd-count-badge">
                  <span className="sd-live-pulse-dot" />
                  {total} {total === 1 ? "Enrolled Scholar" : "Enrolled Scholars"}
                </span>
              </div>
              <p className="sd-page-subtitle">
                Official Polytechnic Enrollment Directory & Credential Registry • Academic Session 2024–2025
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Toolbar */}
        <div className="sd-header-actions">
          {/* Refresh button */}
          <button
            type="button"
            className={`sd-action-btn refresh ${refreshing ? "loading" : ""}`}
            onClick={handleRefresh}
            title="Synchronize student records with live MongoDB Atlas"
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            <span className="btn-label">Sync</span>
          </button>

          {/* Export CSV button */}
          <button
            type="button"
            className="sd-action-btn export"
            onClick={handleExportCSV}
            title="Export student directory to CSV spreadsheet"
          >
            <Download size={15} />
            <span className="btn-label">Export CSV</span>
          </button>

          {/* View Mode Toggle: Grid, Bento, Table, Split */}
          <div className="sd-view-toggle" role="group" aria-label="Directory view layout options">
            <button
              type="button"
              className={`sd-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="3D Holographic ID Card Grid View"
            >
              <LayoutGrid size={15} />
              <span className="sd-view-btn-text">ID Cards</span>
            </button>
            <button
              type="button"
              className={`sd-view-btn ${viewMode === "bento" ? "active" : ""}`}
              onClick={() => setViewMode("bento")}
              title="Modern Bento Profile View"
            >
              <Layers size={15} />
              <span className="sd-view-btn-text">Bento</span>
            </button>
            <button
              type="button"
              className={`sd-view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Compact Enterprise Table Ledger"
            >
              <List size={15} />
              <span className="sd-view-btn-text">Ledger</span>
            </button>
            <button
              type="button"
              className={`sd-view-btn ${viewMode === "split" ? "active" : ""}`}
              onClick={() => {
                setViewMode("split");
                if (!splitSelectedStudent && sortedStudents.length > 0) {
                  setSplitSelectedStudent(sortedStudents[0]);
                }
              }}
              title="Master-Detail Split Inspector"
            >
              <Columns size={15} />
              <span className="sd-view-btn-text">Inspector</span>
            </button>
          </div>

          {/* Add Student Button (Authorized Staff) */}
          {canAddStudent && (
            <button
              type="button"
              className="sd-action-btn primary add-student"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={15} />
              <span>Enroll Student</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= 2. ANALYTICS BENTO GRID ================= */}
      <section className="sd-bento-grid" aria-label="Student Directory Analytics Overview">
        {/* Bento 1: Total Enrolled */}
        <div
          className="sd-bento-card bento-total"
          onClick={() => {
            setBranch("");
            loadStudents(buildParams({ branch: "", page: 1 }));
          }}
          title="Click to reset branch filters and view all students"
        >
          <div className="sd-bento-top">
            <div className="sd-bento-icon-ring cyan">
              <Users size={20} />
            </div>
            <span className="sd-bento-badge cyan">Official Registry</span>
          </div>
          <div className="sd-bento-val-row">
            <span className="sd-bento-value">{analyticsStats.total}</span>
            <span className="sd-bento-trend cyan"><TrendingUp size={12} /> 100% Enrolled</span>
          </div>
          <h4 className="sd-bento-label">Total Polytechnic Candidates</h4>
          <p className="sd-bento-sub">Across all engineering & diploma programs</p>
          <div className="sd-bento-bar">
            <div className="sd-bento-bar-fill cyan" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Bento 2: Active & Verified */}
        <div
          className="sd-bento-card bento-active"
          onClick={() => {
            setStatus("verified");
            loadStudents(buildParams({ status: "verified", page: 1 }));
          }}
          title="Click to filter verified student accounts"
        >
          <div className="sd-bento-top">
            <div className="sd-bento-icon-ring green">
              <UserCheck size={20} />
            </div>
            <span className="sd-bento-badge green">Verified Accounts</span>
          </div>
          <div className="sd-bento-val-row">
            <span className="sd-bento-value">{analyticsStats.activeVerified}</span>
            <span className="sd-bento-trend good">
              {Math.round((analyticsStats.activeVerified / Math.max(1, analyticsStats.total)) * 100)}%
            </span>
          </div>
          <h4 className="sd-bento-label">Active & Verified</h4>
          <p className="sd-bento-sub">Granted full digital campus credentials</p>
          <div className="sd-bento-bar">
            <div
              className="sd-bento-bar-fill green"
              style={{
                width: `${Math.round((analyticsStats.activeVerified / Math.max(1, analyticsStats.total)) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Bento 3: CSE Students */}
        <div
          className="sd-bento-card bento-cse"
          onClick={() => {
            setBranch("CSE");
            loadStudents(buildParams({ branch: "CSE", page: 1 }));
          }}
          title="Click to view CSE Department students"
        >
          <div className="sd-bento-top">
            <div className="sd-bento-icon-ring blue">
              <GraduationCap size={20} />
            </div>
            <span className="sd-bento-badge blue">Computer Eng.</span>
          </div>
          <div className="sd-bento-val-row">
            <span className="sd-bento-value">{analyticsStats.cse}</span>
            <span className="sd-bento-trend blue">Major Cohort</span>
          </div>
          <h4 className="sd-bento-label">CSE Department</h4>
          <p className="sd-bento-sub">Software, Networking & Cloud Engineering</p>
          <div className="sd-bento-bar">
            <div
              className="sd-bento-bar-fill blue"
              style={{
                width: `${Math.round((analyticsStats.cse / Math.max(1, analyticsStats.total)) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Bento 4: Core Engineering */}
        <div
          className="sd-bento-card bento-other"
          onClick={() => {
            setBranch("Mechanical");
            loadStudents(buildParams({ branch: "Mechanical", page: 1 }));
          }}
          title="Click to inspect core engineering branches"
        >
          <div className="sd-bento-top">
            <div className="sd-bento-icon-ring purple">
              <BookOpen size={20} />
            </div>
            <span className="sd-bento-badge purple">Core Disciplines</span>
          </div>
          <div className="sd-bento-val-row">
            <span className="sd-bento-value">{analyticsStats.otherBranches}</span>
            <span className="sd-bento-trend purple">Multi-Branch</span>
          </div>
          <h4 className="sd-bento-label">Core Branches</h4>
          <p className="sd-bento-sub">Mechanical, Electrical, Civil & ECE</p>
          <div className="sd-bento-bar">
            <div
              className="sd-bento-bar-fill purple"
              style={{
                width: `${Math.round((analyticsStats.otherBranches / Math.max(1, analyticsStats.total)) * 100)}%`
              }}
            />
          </div>
        </div>
      </section>

      {/* ================= 3. SEARCH & FILTER TOOLBAR ================= */}
      <section className="sd-filter-toolbar" aria-label="Student Directory Filters">
        <div className="sd-toolbar-main">
          {/* Search Box */}
          <div className="sd-search-box">
            <Search size={16} className="sd-search-icon" />
            <input
              ref={searchInputRef}
              type="search"
              className="sd-search-input"
              placeholder="Search by student name, enrollment ID, email (Press / to focus)..."
              value={search}
              onChange={handleSearchChange}
              aria-label="Search student directory"
            />
            {search && (
              <button
                type="button"
                className="sd-search-clear"
                onClick={clearSearch}
                aria-label="Clear search query"
              >
                <X size={13} />
              </button>
            )}
            <kbd className="sd-search-kbd">Ctrl+K</kbd>
          </div>

          {/* Filter Dropdowns Cluster */}
          <div className="sd-dropdown-cluster">
            {/* Branch Filter */}
            <div className="sd-select-wrap">
              <label htmlFor="sd-branch-filter" className="sd-sr-only">Branch</label>
              <select
                id="sd-branch-filter"
                className="sd-select"
                value={branch || "All Branches"}
                onChange={(e) => {
                  const val = e.target.value === "All Branches" ? "" : e.target.value;
                  setBranch(val);
                  setPage(1);
                  loadStudents(buildParams({ branch: val, page: 1 }));
                }}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div className="sd-select-wrap">
              <label htmlFor="sd-semester-filter" className="sd-sr-only">Semester</label>
              <select
                id="sd-semester-filter"
                className="sd-select"
                value={semester || "All Semesters"}
                onChange={(e) => {
                  const val = e.target.value === "All Semesters" ? "" : e.target.value;
                  setSemester(val);
                  setPage(1);
                  loadStudents(buildParams({ semester: val, page: 1 }));
                }}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div className="sd-select-wrap">
              <label htmlFor="sd-year-filter" className="sd-sr-only">Academic Year</label>
              <select
                id="sd-year-filter"
                className="sd-select"
                value={academicYear || "All Years"}
                onChange={(e) => {
                  const val = e.target.value === "All Years" ? "" : e.target.value;
                  setAcademicYear(val);
                  setPage(1);
                  loadStudents(buildParams({ academicYear: val, page: 1 }));
                }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="sd-select-wrap">
              <label htmlFor="sd-status-filter" className="sd-sr-only">Account Status</label>
              <select
                id="sd-status-filter"
                className="sd-select"
                value={status}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatus(val);
                  setPage(1);
                  loadStudents(buildParams({ status: val, page: 1 }));
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="sd-select-wrap sort">
              <label htmlFor="sd-sort-select" className="sd-sr-only">Sort By</label>
              <select
                id="sd-sort-select"
                className="sd-select sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Drawer Button */}
            <button
              type="button"
              className={`sd-filter-drawer-btn ${activeFiltersCount > 0 ? "active" : ""}`}
              onClick={() => setFilterDrawerOpen(true)}
              title="Open advanced filter drawer"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeFiltersCount > 0 && <span className="sd-filter-badge">{activeFiltersCount}</span>}
            </button>
          </div>
        </div>

        {/* Active Filter Chips Strip */}
        {hasActiveFilters && (
          <div className="sd-active-chips-strip">
            <span className="sd-chips-lead">Active filters:</span>

            {search && (
              <span className="sd-filter-chip">
                Search: <strong>"{search}"</strong>
                <button type="button" onClick={clearSearch} aria-label="Remove search filter">
                  <X size={11} />
                </button>
              </span>
            )}

            {branch && (
              <span className="sd-filter-chip">
                Branch: <strong>{branch}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setBranch("");
                    setPage(1);
                    loadStudents(buildParams({ branch: "", page: 1 }));
                  }}
                  aria-label="Remove branch filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {semester && (
              <span className="sd-filter-chip">
                Semester: <strong>{semester}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setSemester("");
                    setPage(1);
                    loadStudents(buildParams({ semester: "", page: 1 }));
                  }}
                  aria-label="Remove semester filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {academicYear && (
              <span className="sd-filter-chip">
                Year: <strong>{academicYear}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setAcademicYear("");
                    setPage(1);
                    loadStudents(buildParams({ academicYear: "", page: 1 }));
                  }}
                  aria-label="Remove academic year filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {status && (
              <span className="sd-filter-chip">
                Status: <strong>{status}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("");
                    setPage(1);
                    loadStudents(buildParams({ status: "", page: 1 }));
                  }}
                  aria-label="Remove status filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            <button type="button" className="sd-clear-all-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>

            <span className="sd-results-counter">
              Showing <strong>{sortedStudents.length}</strong> of <strong>{total}</strong> students
            </span>
          </div>
        )}
      </section>

      {/* ================= 4. ERROR STATE ================= */}
      {error && (
        <div className="sd-error-card" role="alert">
          <AlertTriangle size={32} className="sd-error-icon" />
          <div className="sd-error-content">
            <h3>Failed to Load Student Records</h3>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="sd-action-btn primary"
            onClick={() => loadStudents(buildParams())}
          >
            <RefreshCw size={14} />
            <span>Retry Server Request</span>
          </button>
        </div>
      )}

      {/* ================= 5. SKELETON LOADING ================= */}
      {loading && !error && (
        <div className="sd-cards-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ================= 6. RESULTS: 3D HOLOGRAPHIC ID CARD GRID VIEW ================= */}
      {!loading && !error && sortedStudents.length > 0 && viewMode === "grid" && (
        <div className="sd-cards-grid">
          {sortedStudents.map((student, i) => (
            <StudentCard
              key={student.id}
              index={i}
              student={student}
              callerRole={callerRole}
              isSelectedForCompare={selectedForCompare.some((s) => s.id === student.id)}
              onToggleCompare={handleToggleCompare}
              onViewProfile={handleViewProfile}
              onShowDigitalPass={setDigitalPassStudent}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}

      {/* ================= 7. RESULTS: BENTO PROFILE CARD VIEW ================= */}
      {!loading && !error && sortedStudents.length > 0 && viewMode === "bento" && (
        <div className="sd-bento-cards-grid">
          {sortedStudents.map((student, i) => (
            <BentoStudentCard
              key={student.id}
              index={i}
              student={student}
              callerRole={callerRole}
              isSelectedForCompare={selectedForCompare.some((s) => s.id === student.id)}
              onToggleCompare={handleToggleCompare}
              onViewProfile={handleViewProfile}
              onShowDigitalPass={setDigitalPassStudent}
            />
          ))}
        </div>
      )}

      {/* ================= 8. RESULTS: MASTER-DETAIL SPLIT INSPECTOR ================= */}
      {!loading && !error && sortedStudents.length > 0 && viewMode === "split" && (
        <SplitInspector
          students={sortedStudents}
          selectedStudent={splitSelectedStudent || sortedStudents[0]}
          onSelectStudent={setSplitSelectedStudent}
          onViewProfile={handleViewProfile}
          onShowDigitalPass={setDigitalPassStudent}
        />
      )}

      {/* ================= 9. RESULTS: COMPACT TABLE VIEW ================= */}
      {!loading && !error && sortedStudents.length > 0 && viewMode === "table" && (
        <div className="sd-table-container">
          <table className="sd-data-table">
            <thead>
              <tr>
                <th className="th-check">
                  <span className="sd-sr-only">Compare</span>
                </th>
                <th>Student Candidate</th>
                <th>Enrollment ID</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Contact</th>
                <th className="th-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => {
                const initials = (student.fullName || "?")
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isSuspended = student.status === "suspended";
                const isPending = student.status === "pending_verification";
                const isSelected = selectedForCompare.some((s) => s.id === student.id);

                return (
                  <tr key={student.id} className={`${isSuspended ? "row-suspended" : ""} ${isSelected ? "row-selected" : ""}`}>
                    <td className="td-check">
                      <button
                        type="button"
                        className={`sd-table-check-btn ${isSelected ? "active" : ""}`}
                        onClick={() => handleToggleCompare(student)}
                        title="Compare student"
                      >
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                      </button>
                    </td>
                    <td className="td-student">
                      <div className="td-avatar-wrap" onClick={() => setDigitalPassStudent(student)}>
                        {student.avatarUrl ? (
                          <img
                            src={student.avatarUrl}
                            alt=""
                            className="td-avatar-img"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="td-avatar-initials">{initials}</span>
                        )}
                        <span className={`sd-live-status ${isSuspended ? "off" : "on"}`} />
                      </div>
                      <div className="td-name-block">
                        <strong onClick={() => handleViewProfile(student.id)}>{student.fullName}</strong>
                        {student.status === "verified" && (
                          <BadgeCheck size={12} className="td-verified-icon" />
                        )}
                      </div>
                    </td>
                    <td>
                      <code className="td-enroll-code">
                        {student.enrollmentNo || "—"}
                      </code>
                    </td>
                    <td>
                      <span className="td-branch-chip">{student.branch || "General"}</span>
                    </td>
                    <td>{student.semester || "—"}</td>
                    <td>{student.academicYear || "—"}</td>
                    <td>
                      {isSuspended ? (
                        <span className="sd-status-pill suspended">Paused</span>
                      ) : isPending ? (
                        <span className="sd-status-pill pending">Pending</span>
                      ) : (
                        <span className="sd-status-pill verified">Verified</span>
                      )}
                    </td>
                    <td>
                      <span className="td-email">{student.email || "—"}</span>
                    </td>
                    <td className="td-action">
                      <button
                        type="button"
                        className="sd-table-view-btn"
                        onClick={() => handleViewProfile(student.id)}
                      >
                        <Eye size={12} /> View
                      </button>
                      <button
                        type="button"
                        className="sd-table-pass-btn"
                        onClick={() => setDigitalPassStudent(student)}
                        title="Digital ID Pass"
                      >
                        <QrCode size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= 10. EMPTY STATE ================= */}
      {!loading && !error && sortedStudents.length === 0 && (
        <div className="sd-empty-card">
          <div className="sd-empty-icon-wrap">
            <Users size={44} className="sd-empty-icon" />
          </div>
          <h3 className="sd-empty-title">No Polytechnic Candidates Found</h3>
          <p className="sd-empty-text">
            {hasActiveFilters
              ? "No students match your selected search keywords or filter criteria. Try clearing specific filters or resetting all search options."
              : "No students are currently enrolled in the institutional database."}
          </p>
          {hasActiveFilters && (
            <button type="button" className="sd-action-btn primary" onClick={clearAllFilters}>
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* ================= 11. PAGINATION ================= */}
      {!loading && !error && totalPages > 1 && (
        <nav className="sd-pagination" aria-label="Student directory pagination">
          <button
            type="button"
            className="sd-page-nav-btn prev"
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            }}
            disabled={page <= 1}
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <div className="sd-page-info">
            <span>Page</span>
            <strong>{page}</strong>
            <span>of</span>
            <strong>{totalPages}</strong>
            <span className="sd-page-total">({total} total students)</span>
          </div>

          <button
            type="button"
            className="sd-page-nav-btn next"
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            }}
            disabled={page >= totalPages}
            aria-label="Next Page"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {/* ================= 12. SIDE-BY-SIDE STUDENT COMPARISON TRAY ================= */}
      <CompareDrawer
        selectedStudents={selectedForCompare}
        onRemoveFromCompare={handleRemoveFromCompare}
        onClearCompare={handleClearCompare}
        onViewProfile={handleViewProfile}
      />

      {/* ================= 13. DIGITAL ID PASS SHOWCASE MODAL ================= */}
      <DigitalIdModal
        student={digitalPassStudent}
        onClose={() => setDigitalPassStudent(null)}
        onViewProfile={handleViewProfile}
      />

      {/* ================= 14. SLIDE-OVER ADVANCED FILTER DRAWER ================= */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        branch={branch}
        setBranch={setBranch}
        semester={semester}
        setSemester={setSemester}
        academicYear={academicYear}
        setAcademicYear={setAcademicYear}
        status={status}
        setStatus={setStatus}
        onApply={() => {
          setFilterDrawerOpen(false);
          setPage(1);
          loadStudents(buildParams({ page: 1 }));
        }}
        onReset={() => {
          setBranch("");
          setSemester("");
          setAcademicYear("");
          setStatus("");
          setFilterDrawerOpen(false);
          clearAllFilters();
        }}
      />

      {/* ================= 15. ACTION CONFIRMATION & REGISTRATION MODALS ================= */}
      <ConfirmModal
        open={confirmModal.open}
        student={confirmModal.student}
        action={confirmModal.action}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmModal}
      />

      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(msg) => {
          showToast(msg, "success");
          loadStudents(buildParams());
        }}
      />

      {actionLoading && (
        <div className="sd-action-overlay">
          <Loader2 size={38} className="spin sd-loader-spin" />
        </div>
      )}

      {/* ================= 16. TOAST BANNER NOTIFICATION ================= */}
      {toast.show && (
        <div className={`sd-toast ${toast.type}`} role="status" aria-live="polite">
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : toast.type === "warn" ? (
            <AlertTriangle size={16} />
          ) : (
            <ShieldAlert size={16} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
