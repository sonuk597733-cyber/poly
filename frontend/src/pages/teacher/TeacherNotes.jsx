import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  X,
  Loader2,
  BarChart3,
  Edit3,
  Eye,
  Sparkles,
  Layers,
  UploadCloud,
  Check,
  RefreshCw,
  Globe,
  Paperclip,
  Info,
  FolderOpen,
  LayoutGrid,
  List,
  Star,
  SlidersHorizontal,
  Users,
  TrendingUp,
  GraduationCap,
  Link2,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherNotes.css";

/* ==========================================================================
   Constants
   ========================================================================== */

const CATEGORIES = [
  "Lecture Notes",
  "Syllabus",
  "Lab Manual",
  "Assignment Material",
  "Important Questions",
  "Previous Year Papers",
  "Reference Material",
  "Viva Preparation",
  "Model Question Paper",
  "Academic Guidelines",
  "Question Bank"
];

const RESOURCE_TYPES = [
  { value: "reference_guide", label: "Reference Guide & Notes" },
  { value: "cloud_folder", label: "Cloud Storage Folder" },
  { value: "video_explanation", label: "Video Tutorial / Lecture" },
  { value: "source_code", label: "Source Code Repository" },
  { value: "documentation", label: "Official Documentation" },
  { value: "online_article", label: "Educational Article" }
];

const BRANCHES = ["CSE", "Mechanical", "Electrical", "Civil", "ECE"];
const SEMESTERS = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6"];
const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title A to Z" },
  { value: "title-desc", label: "Title Z to A" },
  { value: "downloads", label: "Most downloaded" }
];

const STATUS_META = {
  published: { label: "Published", tone: "ok" },
  draft: { label: "Draft", tone: "warn" },
  archived: { label: "Archived", tone: "muted" }
};

const MODE_META = {
  file: { label: "Files", icon: Paperclip },
  url: { label: "Links", icon: Globe },
  both: { label: "Files and links", icon: Layers }
};

const FILE_LIMIT_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "zip", "rar", "png", "jpg", "jpeg", "txt"];
const ACCEPT_ATTR = ALLOWED_EXT.map((e) => `.${e}`).join(",");

const STORAGE_PINNED = "teacher-notes:pinned";
const STORAGE_VIEW = "teacher-notes:view";

/* ==========================================================================
   Helpers
   ========================================================================== */

let keyCounter = 0;
const nextKey = () => {
  keyCounter += 1;
  return `k${keyCounter}`;
};

const blankResource = () => ({
  _key: nextKey(),
  title: "",
  url: "",
  resourceType: "reference_guide",
  description: ""
});

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoStr) {
  if (!isoStr) return "Not available";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "Not available";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getExt(name = "") {
  const i = name.lastIndexOf(".");
  return i > -1 ? name.slice(i + 1).toLowerCase() : "";
}

const getNoteId = (n) => n?._id || n?.id;
const getNoteDate = (n) => n?.createdAt || n?.uploadedAt || n?.updatedAt || null;
const getNoteFiles = (n) => (Array.isArray(n?.files) && n.files.length ? n.files : n?.file ? [n.file] : []);
const getFileName = (f) =>
  f?.originalName || f?.originalname || f?.fileName || f?.filename || f?.name || "Attached file";
const getFileSize = (f) => f?.fileSize || f?.size || 0;
const getNoteMode = (n) =>
  n?.uploadMode ||
  ((n?.externalResources?.length || 0) > 0 ? (getNoteFiles(n).length > 0 ? "both" : "url") : "file");
const getStatus = (n) => n?.publicationStatus || "published";

function detectUrlProvider(urlString) {
  if (!urlString || typeof urlString !== "string") {
    return { provider: "website", label: "Web link", tone: "violet" };
  }
  const lower = urlString.toLowerCase();
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
    return { provider: "google-drive", label: "Google Drive", tone: "ok" };
  }
  if (lower.includes("onedrive.live.com") || lower.includes("sharepoint.com") || lower.includes("1drv.ms")) {
    return { provider: "onedrive", label: "OneDrive", tone: "info" };
  }
  if (lower.includes("dropbox.com")) {
    return { provider: "dropbox", label: "Dropbox", tone: "info" };
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return { provider: "youtube", label: "YouTube", tone: "danger" };
  }
  if (lower.includes("github.com") || lower.includes("gitlab.com")) {
    return { provider: "github", label: "Code repo", tone: "muted" };
  }
  return { provider: "website", label: "Web resource", tone: "violet" };
}

/**
 * Client-side URL sanity check. This only gives fast feedback; the server must
 * still enforce SSRF protection because any client check can be bypassed.
 */
function validateExternalUrl(raw) {
  let u;
  try {
    u = new URL(String(raw).trim());
  } catch (e) {
    return "Enter a full link that starts with https://";
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return "Only http and https links are allowed.";
  }
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const privateV4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
  const localName = h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal");
  const localV6 = h === "::1" || h === "::" || (h.includes(":") && /^(fc|fd|fe80)/.test(h));
  if (privateV4 || localName || localV6) return "Local and private network links are not allowed.";
  return "";
}

function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : undefined;
  } catch (e) {
    return undefined;
  }
}

function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadStudentsCsv(note, students) {
  const header = ["Student", "Email", "Enrollment", "Status", "Downloads", "Last downloaded"];
  const rows = students.map((s) => [
    s.name,
    s.email,
    s.enrollmentNo,
    s.hasDownloaded ? "Downloaded" : "Not downloaded",
    s.downloadCount || 0,
    s.lastDownloadedAt ? new Date(s.lastDownloadedAt).toISOString() : ""
  ]);
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeTitle = String(note?.title || "notes").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60);
  a.href = href;
  a.download = `${safeTitle || "notes"}-downloads.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/* ==========================================================================
   Hooks
   ========================================================================== */

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    if (prefersReducedMotion() || end === 0) {
      setVal(end);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function useStoredSet(key) {
  const [set, setSet] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  });
  const toggle = useCallback(
    (id) => {
      setSet((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          window.localStorage.setItem(key, JSON.stringify([...next]));
        } catch (e) {
          /* storage unavailable: pins last for this session only */
        }
        return next;
      });
    },
    [key]
  );
  return [set, toggle];
}

function useStoredValue(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  });
  const update = useCallback(
    (next) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next);
      } catch (e) {
        /* ignore */
      }
    },
    [key]
  );
  return [value, update];
}

/* ==========================================================================
   Small building blocks
   ========================================================================== */

function AnimatedNumber({ value, suffix = "" }) {
  const shown = useCountUp(value);
  return (
    <span>
      {shown}
      {suffix}
    </span>
  );
}

function Badge({ tone = "muted", icon: Icon, children, className = "" }) {
  return (
    <span className={`tn-badge tn-tone-${tone} ${className}`.trim()}>
      {Icon ? <Icon size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function ExtBadge({ name }) {
  const ext = getExt(name);
  return (
    <span className="tn-ext" data-ext={ext} aria-hidden="true">
      {ext || "file"}
    </span>
  );
}

function FileThumb({ file }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!file || !file.type?.startsWith("image/")) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (src) return <img className="tn-thumb" src={src} alt="" />;
  return <ExtBadge name={file?.name} />;
}

const modalStack = [];

function Modal({ labelledBy, onClose, size = "md", dismissible = true, children }) {
  const shellRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const token = {};
    modalStack.push(token);
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    shellRef.current?.focus();

    const onKey = (e) => {
      if (modalStack[modalStack.length - 1] !== token) return;
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = shellRef.current?.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const i = modalStack.indexOf(token);
      if (i > -1) modalStack.splice(i, 1);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
    };
  }, [dismissible]);

  return createPortal(
    <div
      className="tn-portal tn-backdrop"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div
        ref={shellRef}
        className={`tn-modal tn-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function ModalHeader({ id, icon: Icon, title, subtitle, onClose, disabled, children }) {
  return (
    <div className="tn-modal-head">
      <div className="tn-modal-head-main">
        {Icon ? (
          <span className="tn-modal-icon" aria-hidden="true">
            <Icon size={20} />
          </span>
        ) : null}
        <div className="tn-modal-titles">
          {children}
          <h3 id={id}>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      <button type="button" className="tn-icon-btn" onClick={onClose} disabled={disabled} aria-label="Close dialog">
        <X size={18} />
      </button>
    </div>
  );
}

function Field({ id, label, required, hint, error, wide, children }) {
  return (
    <div className={`tn-field${wide ? " is-wide" : ""}${error ? " has-error" : ""}`}>
      <label className="tn-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="tn-req" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="tn-error-text" role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="tn-hint">{hint}</p>
      ) : null}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }) {
  return (
    <Modal labelledBy="tn-confirm-title" onClose={onCancel} size="sm" dismissible={!busy}>
      <div className="tn-confirm">
        <span className="tn-confirm-icon" aria-hidden="true">
          <Trash2 size={22} />
        </span>
        <h3 id="tn-confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="tn-confirm-actions">
          <button type="button" className="tn-btn tn-btn-ghost" onClick={onCancel} disabled={busy}>
            Keep material
          </button>
          <button type="button" className="tn-btn tn-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 size={16} className="tn-spin" /> : <Trash2 size={16} />}
            <span>{busy ? "Deleting..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SkeletonGrid({ count = 6 }) {
  return (
    <div className="tn-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tn-card tn-skeleton-card">
          <div className="tn-sk tn-sk-pill" />
          <div className="tn-sk tn-sk-line tn-w-80" />
          <div className="tn-sk tn-sk-line tn-w-95" />
          <div className="tn-sk tn-sk-line tn-w-60" />
          <div className="tn-sk tn-sk-row" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   Note card (grid + list)
   ========================================================================== */

const NoteCard = React.memo(function NoteCard({
  note,
  index,
  animate,
  selected,
  pinned,
  onToggleSelect,
  onTogglePin,
  onOpen,
  onEdit,
  onDelete,
  onAnalytics
}) {
  const id = getNoteId(note);
  const mode = getNoteMode(note);
  const status = getStatus(note);
  const files = getNoteFiles(note);
  const urls = note.externalResources || [];
  const totalSize = files.reduce((acc, f) => acc + getFileSize(f), 0);
  const ModeIcon = MODE_META[mode]?.icon || Paperclip;
  const firstUrl = urls[0];
  const firstHref = firstUrl ? safeHref(firstUrl.url) : undefined;
  const provider = firstUrl ? detectUrlProvider(firstUrl.url) : null;

  return (
    <article
      className={`tn-card${selected ? " is-selected" : ""}${animate ? " tn-enter" : ""}`}
      style={{ "--i": Math.min(index, 11) }}
      data-mode={mode}
    >
      <div className="tn-card-lead">
        <label className="tn-check" title="Select material">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(id)}
            aria-label={`Select ${note.title}`}
          />
          <span className="tn-check-box">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </span>
        </label>
        <span className={`tn-mode-pill tn-mode-${mode}`} title={MODE_META[mode]?.label}>
          <ModeIcon size={18} aria-hidden="true" />
        </span>
      </div>

      <div className="tn-card-main">
        <h3 className="tn-card-title">
          <button type="button" className="tn-card-title-btn" onClick={() => onOpen(note)}>
            {note.title}
          </button>
        </h3>
        <p className="tn-card-desc">{note.description || "No description added yet."}</p>
        <div className="tn-tags">
          <Badge tone="accent">{note.subject}</Badge>
          <Badge tone="muted">{note.category}</Badge>
          {status !== "published" ? <Badge tone={STATUS_META[status]?.tone || "muted"}>{STATUS_META[status]?.label || status}</Badge> : null}
          {note.isImportant ? (
            <Badge tone="hot" icon={Sparkles}>
              High priority
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="tn-card-meta">
        <dl className="tn-facts">
          <div>
            <dt>Class</dt>
            <dd>
              {note.branch}, {note.semester}
              {note.academicYear ? `, ${note.academicYear}` : ""}
            </dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>
              {note.unit || "General"}
              {note.chapter ? `, ${note.chapter}` : ""}
            </dd>
          </div>
          <div>
            <dt>Added</dt>
            <dd>{formatDate(getNoteDate(note))}</dd>
          </div>
        </dl>
        <div className="tn-resources">
          {files.length > 0 ? (
            <Badge tone="accent" icon={Paperclip}>
              {files.length} {files.length === 1 ? "file" : "files"}
              {totalSize > 0 ? `, ${formatFileSize(totalSize)}` : ""}
            </Badge>
          ) : null}
          {urls.length > 0 ? (
            <>
              <Badge tone={provider?.tone || "violet"} icon={Globe}>
                {urls.length > 1 ? `${urls.length} links` : provider?.label || "1 link"}
              </Badge>
              {firstHref ? (
                <a
                  className="tn-link-chip"
                  href={firstHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open first link in a new tab"
                  aria-label={`Open ${firstUrl.title || "first link"} in a new tab`}
                >
                  <ExternalLink size={13} />
                </a>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="tn-card-foot">
        <div className="tn-dl" title="Total downloads by students">
          <Download size={15} aria-hidden="true" />
          <strong>{note.downloadCount || 0}</strong>
          <span>downloads</span>
        </div>
        <div className="tn-actions">
          <button
            type="button"
            className={`tn-icon-btn tn-pin${pinned ? " is-on" : ""}`}
            onClick={() => onTogglePin(id)}
            aria-pressed={pinned}
            aria-label={pinned ? "Remove from starred" : "Star this material"}
            title={pinned ? "Remove star" : "Star this material"}
          >
            <Star size={16} />
          </button>
          <button
            type="button"
            className="tn-btn tn-btn-soft tn-btn-sm"
            onClick={() => onAnalytics(note)}
            aria-label={`View download analytics for ${note.title}`}
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </button>
          <button
            type="button"
            className="tn-icon-btn"
            onClick={() => onOpen(note)}
            aria-label={`View details of ${note.title}`}
            title="View details"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="tn-icon-btn"
            onClick={() => onEdit(note)}
            aria-label={`Edit ${note.title}`}
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            className="tn-icon-btn tn-icon-danger"
            onClick={() => onDelete(note)}
            aria-label={`Delete ${note.title}`}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
});

/* ==========================================================================
   Details modal
   ========================================================================== */

function NoteDetailsModal({ note, onClose, onEdit, onAnalytics, onDelete }) {
  const files = getNoteFiles(note);
  const urls = note.externalResources || [];
  const status = getStatus(note);

  return (
    <Modal labelledBy="tn-details-title" onClose={onClose} size="md">
      <ModalHeader id="tn-details-title" icon={BookOpen} title={note.title} onClose={onClose}>
        <div className="tn-tags tn-tags-tight">
          <Badge tone="accent">{note.subject}</Badge>
          <Badge tone="muted">{note.category}</Badge>
          <Badge tone={STATUS_META[status]?.tone || "muted"}>{STATUS_META[status]?.label || status}</Badge>
          {note.isImportant ? (
            <Badge tone="hot" icon={Sparkles}>
              High priority
            </Badge>
          ) : null}
        </div>
      </ModalHeader>

      <div className="tn-modal-body">
        {note.description ? <p className="tn-details-desc">{note.description}</p> : null}

        <dl className="tn-detail-grid">
          <div>
            <dt>Subject</dt>
            <dd>
              {note.subject}
              {note.subjectCode ? ` (${note.subjectCode})` : ""}
            </dd>
          </div>
          <div>
            <dt>Target class</dt>
            <dd>
              {note.branch}, {note.semester}
              {note.academicYear ? `, ${note.academicYear}` : ""}
            </dd>
          </div>
          <div>
            <dt>Unit and chapter</dt>
            <dd>
              {note.unit || "General"}
              {note.chapter ? `, ${note.chapter}` : ""}
            </dd>
          </div>
          <div>
            <dt>Added on</dt>
            <dd>{formatDate(getNoteDate(note))}</dd>
          </div>
          <div>
            <dt>Student downloads</dt>
            <dd>{note.downloadCount || 0}</dd>
          </div>
        </dl>

        <section className="tn-detail-block">
          <h4>
            <Paperclip size={15} aria-hidden="true" /> Files ({files.length})
          </h4>
          {files.length === 0 ? (
            <p className="tn-muted-text">No files attached to this material.</p>
          ) : (
            <ul className="tn-mini-list">
              {files.map((f, i) => (
                <li key={`${getFileName(f)}-${i}`}>
                  <ExtBadge name={getFileName(f)} />
                  <span className="tn-mini-name" title={getFileName(f)}>
                    {getFileName(f)}
                  </span>
                  <span className="tn-mini-meta">{getFileSize(f) ? formatFileSize(getFileSize(f)) : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tn-detail-block">
          <h4>
            <Link2 size={15} aria-hidden="true" /> External links ({urls.length})
          </h4>
          {urls.length === 0 ? (
            <p className="tn-muted-text">No external links added.</p>
          ) : (
            <ul className="tn-mini-list">
              {urls.map((r, i) => {
                const p = detectUrlProvider(r.url);
                const href = safeHref(r.url);
                const typeLabel = RESOURCE_TYPES.find((t) => t.value === r.resourceType)?.label;
                return (
                  <li key={`${r.url}-${i}`} className="tn-link-row">
                    <Badge tone={p.tone}>{p.label}</Badge>
                    <span className="tn-mini-name">
                      {r.title || r.url}
                      {r.description || typeLabel ? (
                        <small>{[typeLabel, r.description].filter(Boolean).join(". ")}</small>
                      ) : null}
                    </span>
                    {href ? (
                      <a className="tn-btn tn-btn-ghost tn-btn-sm" href={href} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} />
                        <span>Open</span>
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="tn-modal-foot tn-modal-foot-split">
        <button
          type="button"
          className="tn-btn tn-btn-danger tn-btn-sm"
          onClick={() => {
            onClose();
            onDelete?.(note);
          }}
          title="Delete this study material"
        >
          <Trash2 size={15} />
          <span>Delete material</span>
        </button>
        <div className="tn-modal-foot-group">
          <button type="button" className="tn-btn tn-btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="tn-btn tn-btn-soft" onClick={() => onAnalytics(note)}>
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>
          <button type="button" className="tn-btn tn-btn-primary" onClick={() => onEdit(note)}>
            <Edit3 size={16} />
            <span>Edit material</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ==========================================================================
   Upload / edit modal
   ========================================================================== */

function NoteFormModal({ note, onClose, onSaved, showToast, onDelete }) {
  const isEdit = Boolean(note);
  const [form, setForm] = useState(() => ({
    title: note?.title || "",
    description: note?.description || "",
    category: note?.category || "Lecture Notes",
    isImportant: Boolean(note?.isImportant),
    publicationStatus: note?.publicationStatus || "published",
    subject: note?.subject || "Operating Systems",
    subjectCode: note ? note.subjectCode || "" : "CS-501",
    branch: note?.branch || "CSE",
    semester: note?.semester || "Semester 5",
    academicYear: note?.academicYear || "3rd Year",
    unit: note?.unit || "Unit 1",
    chapter: note?.chapter || "",
    uploadMode: note ? getNoteMode(note) : "file"
  }));
  const [resources, setResources] = useState(() =>
    note?.externalResources?.length
      ? note.externalResources.map((r) => ({
          _key: nextKey(),
          title: r.title || "",
          url: r.url || "",
          resourceType: r.resourceType || "reference_guide",
          description: r.description || ""
        }))
      : [blankResource()]
  );
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [fileIssues, setFileIssues] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(null); // null = unknown, number = real percentage
  const [submitError, setSubmitError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  // Existing file management states (Edit mode)
  const existingFiles = isEdit ? getNoteFiles(note) : [];
  const [stagedRemovedIds, setStagedRemovedIds] = useState(() => new Set());
  const [replacements, setReplacements] = useState({}); // { [fileId]: File }
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);
  const replaceInputRefs = useRef({});

  const activeExistingCount = existingFiles.filter((f) => {
    const fid = String(f._id || f.id || getFileName(f));
    return !stagedRemovedIds.has(fid);
  }).length;

  const totalSize = useMemo(() => files.reduce((acc, f) => acc + (f.file.size || 0), 0), [files]);
  const showFiles = form.uploadMode === "file" || form.uploadMode === "both";
  const showUrls = form.uploadMode === "url" || form.uploadMode === "both";

  const setField = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  };

  const triggerReplace = (fileId) => {
    replaceInputRefs.current[fileId]?.click();
  };

  const handleReplaceFile = (fileId, file) => {
    if (!file) return;
    const ext = getExt(file.name);
    if (!ALLOWED_EXT.includes(ext)) {
      showToast?.(`.${ext || "unknown"} format is not supported.`, true);
      return;
    }
    if (file.size > FILE_LIMIT_BYTES) {
      showToast?.(`File exceeds 100 MB limit (${formatFileSize(file.size)}).`, true);
      return;
    }
    // Cancel staged removal if it was marked
    setStagedRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
    setReplacements((prev) => ({
      ...prev,
      [fileId]: file
    }));
    showToast?.(`Selected replacement: ${file.name}. Click Save Changes to apply.`);
  };

  const cancelReplace = (fileId) => {
    setReplacements((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  };

  const stageRemoveFile = (fileId) => {
    setStagedRemovedIds((prev) => new Set([...prev, fileId]));
    setReplacements((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
    setConfirmRemoveId(null);
  };

  const undoRemoveFile = (fileId) => {
    setStagedRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  };

  const handleDeleteNoteFromModal = async () => {
    setDeletingNote(true);
    try {
      const noteId = getNoteId(note);
      await authApi.deleteNote(noteId);
      showToast?.("Study material and all files deleted successfully.");
      setDeleteConfirmOpen(false);
      onClose();
      onSaved();
    } catch (err) {
      showToast?.(err?.message || "Failed to delete this study material.", true);
    } finally {
      setDeletingNote(false);
    }
  };

  const addFiles = (list) => {
    if (!list || list.length === 0) return;
    const issues = [];
    const known = new Set(files.map((f) => `${f.file.name}_${f.file.size}`));
    const accepted = [];
    Array.from(list).forEach((file) => {
      const key = `${file.name}_${file.size}`;
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.includes(ext)) {
        issues.push(`${file.name}: .${ext || "unknown"} files are not supported.`);
      } else if (file.size === 0) {
        issues.push(`${file.name}: the file is empty.`);
      } else if (file.size > FILE_LIMIT_BYTES) {
        issues.push(`${file.name}: larger than 100 MB (${formatFileSize(file.size)}).`);
      } else if (known.has(key)) {
        issues.push(`${file.name}: already added.`);
      } else {
        known.add(key);
        accepted.push({ id: nextKey(), file });
      }
    });
    setFileIssues(issues);
    if (accepted.length > 0) {
      setFiles((p) => [...p, ...accepted]);
      setErrors((p) => (p.files ? { ...p, files: undefined } : p));
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const updateResource = (key, field, value) => {
    setResources((p) => p.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
    if (field === "url") setErrors((p) => (p.urls?.[key] ? { ...p, urls: { ...p.urls, [key]: undefined } } : p));
  };

  const removeResource = (key) => {
    setResources((p) => {
      const next = p.filter((r) => r._key !== key);
      return next.length > 0 ? next : [blankResource()];
    });
  };

  const focusFirstProblem = () => {
    setTimeout(() => {
      const el = bodyRef.current?.querySelector(".has-error input, .has-error select, .has-error textarea, .tn-field-urlerr input");
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const validUrls = resources.filter((r) => r.url && r.url.trim());
    const next = { urls: {} };
    if (!form.title.trim()) next.title = "Add a title so students can find this material.";
    if (!form.subject.trim()) next.subject = "Enter the subject name.";

    if (showFiles && !isEdit && files.length === 0) {
      next.files = "Attach at least one file (PDF, PPTX, DOCX, ZIP and similar).";
    }
    if (showUrls) {
      if (validUrls.length === 0) {
        next.urlsGeneral = "Add at least one external link.";
      }
      validUrls.forEach((r) => {
        const msg = validateExternalUrl(r.url);
        if (msg) next.urls[r._key] = msg;
      });
    }

    const hasUrlErrors = Object.values(next.urls).some(Boolean);
    if (next.title || next.subject || next.files || next.urlsGeneral || hasUrlErrors) {
      setErrors(next);
      setSubmitError("");
      focusFirstProblem();
      return;
    }

    setErrors({});
    setSubmitError("");
    setSubmitting(true);
    setProgress(null);

    const cleanUrls = validUrls.map(({ title, url, resourceType, description }) => ({
      title: title.trim(),
      url: url.trim(),
      resourceType,
      description: description.trim()
    }));
    const requestOptions = {
      // Used only if authApi forwards it to axios/XHR. Percentages shown are real events, never simulated.
      onUploadProgress: (evt) => {
        if (evt && evt.total) setProgress(Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
      }
    };

    try {
      if (isEdit) {
        const updateData = {
          title: form.title.trim(),
          description: form.description.trim(),
          subject: form.subject.trim(),
          subjectCode: form.subjectCode.trim(),
          unit: form.unit.trim(),
          chapter: form.chapter.trim(),
          category: form.category,
          isImportant: form.isImportant,
          publicationStatus: form.publicationStatus,
          uploadMode: form.uploadMode,
          externalResources: cleanUrls
        };
        const noteId = getNoteId(note);
        const formData = new FormData();
        Object.keys(updateData).forEach((k) => {
          formData.append(k, k === "externalResources" ? JSON.stringify(updateData[k]) : updateData[k]);
        });

        // Staged removals
        if (stagedRemovedIds.size > 0) {
          formData.append("removedFileIds", JSON.stringify(Array.from(stagedRemovedIds)));
        }

        // Staged replacements
        const replacementEntries = Object.entries(replacements);
        if (replacementEntries.length > 0) {
          const replacementTargetIds = replacementEntries.map(([targetId]) => targetId);
          formData.append("replacementTargetIds", JSON.stringify(replacementTargetIds));
          replacementEntries.forEach(([, replFile]) => {
            formData.append("replacementFiles", replFile);
          });
        }

        // Newly added files
        files.forEach(({ file }) => formData.append("files", file));

        await authApi.updateNote(noteId, formData, requestOptions);
        showToast?.("Changes saved successfully.");
        onSaved();
      } else {
        const formData = new FormData();
        formData.append("title", form.title.trim());
        formData.append("description", form.description.trim());
        formData.append("subject", form.subject.trim());
        formData.append("subjectCode", form.subjectCode.trim());
        formData.append("branch", form.branch);
        formData.append("semester", form.semester);
        formData.append("academicYear", form.academicYear);
        formData.append("unit", form.unit.trim());
        formData.append("chapter", form.chapter.trim());
        formData.append("category", form.category);
        formData.append("isImportant", String(form.isImportant));
        formData.append("publicationStatus", form.publicationStatus);
        formData.append("uploadMode", form.uploadMode);
        if (cleanUrls.length > 0) formData.append("externalResources", JSON.stringify(cleanUrls));
        files.forEach(({ file }) => formData.append("files", file));

        const res = await authApi.createNote(formData, requestOptions);
        showToast?.(res?.message || "Material saved and visible to the selected class.");
        onSaved();
      }
    } catch (err) {
      console.error("Save note error:", err);
      const message = err?.message || "The upload did not finish. Check your connection and try again.";
      setSubmitError(message);
      showToast?.(message, true);
      setSubmitting(false);
      setProgress(null);
    }
  };

  const submitLabel = submitError
    ? "Try again"
    : isEdit
      ? "Save changes"
      : form.publicationStatus === "draft"
        ? "Save draft"
        : form.publicationStatus === "archived"
          ? "Save as archived"
          : "Publish to students";

  return (
    <Modal labelledBy="tn-form-title" onClose={onClose} size="lg" dismissible={!submitting}>
      <ModalHeader
        id="tn-form-title"
        icon={isEdit ? Edit3 : UploadCloud}
        title={isEdit ? "Edit study material" : "Upload study material"}
        subtitle={
          isEdit
            ? "Update details or add more files. Existing files stay attached."
            : "Choose who it is for, then add files, links, or both."
        }
        onClose={onClose}
        disabled={submitting}
      />

      <form onSubmit={handleSubmit} className="tn-form" noValidate>
        <div className="tn-modal-body" ref={bodyRef}>
          {submitError ? (
            <div className="tn-banner tn-banner-error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <div>
                <strong>Could not save this material</strong>
                <p>{submitError}</p>
              </div>
            </div>
          ) : null}

          {/* Details */}
          <section className="tn-section">
            <header className="tn-section-head">
              <span className="tn-section-icon" aria-hidden="true">
                <FileText size={16} />
              </span>
              <div>
                <h4>Details</h4>
                <p>What students will see in their library</p>
              </div>
            </header>
            <div className="tn-form-grid">
              <Field id="tn-f-title" label="Title" required wide error={errors.title}>
                <input
                  id="tn-f-title"
                  type="text"
                  className="tn-input"
                  placeholder="e.g. Unit 3 process synchronization handout"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  aria-invalid={Boolean(errors.title)}
                  maxLength={200}
                />
              </Field>
              <Field id="tn-f-category" label="Category" required>
                <select
                  id="tn-f-category"
                  className="tn-select"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="tn-f-status" label="Visibility">
                <select
                  id="tn-f-status"
                  className="tn-select"
                  value={form.publicationStatus}
                  onChange={(e) => setField("publicationStatus", e.target.value)}
                >
                  <option value="published">Published, visible to students</option>
                  <option value="draft">Draft, only you can see it</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field id="tn-f-desc" label="Description" wide hint="Topics covered, learning goals, or revision tips.">
                <textarea
                  id="tn-f-desc"
                  className="tn-textarea"
                  rows={3}
                  placeholder="Summarize what this material covers"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </Field>
              <label className="tn-switch is-wide" htmlFor="tn-f-important">
                <input
                  id="tn-f-important"
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(e) => setField("isImportant", e.target.checked)}
                />
                <span className="tn-switch-track" aria-hidden="true">
                  <span className="tn-switch-thumb" />
                </span>
                <span className="tn-switch-copy">
                  <strong>Mark as high priority</strong>
                  <small>Highlights this material for exam and viva preparation.</small>
                </span>
              </label>
            </div>
          </section>

          {/* Audience */}
          <section className="tn-section">
            <header className="tn-section-head">
              <span className="tn-section-icon" aria-hidden="true">
                <GraduationCap size={16} />
              </span>
              <div>
                <h4>Audience and syllabus</h4>
                <p>
                  {isEdit
                    ? "Class targeting is fixed after publishing. Create a new material to reach another class."
                    : "Only students in this class will see the material"}
                </p>
              </div>
            </header>
            <div className="tn-form-grid">
              <Field id="tn-f-branch" label="Branch" required>
                <select
                  id="tn-f-branch"
                  className="tn-select"
                  value={form.branch}
                  onChange={(e) => setField("branch", e.target.value)}
                  disabled={isEdit}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="tn-f-semester" label="Semester" required>
                <select
                  id="tn-f-semester"
                  className="tn-select"
                  value={form.semester}
                  onChange={(e) => setField("semester", e.target.value)}
                  disabled={isEdit}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="tn-f-year" label="Academic year">
                <select
                  id="tn-f-year"
                  className="tn-select"
                  value={form.academicYear}
                  onChange={(e) => setField("academicYear", e.target.value)}
                  disabled={isEdit}
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="tn-f-subject" label="Subject" required error={errors.subject}>
                <input
                  id="tn-f-subject"
                  type="text"
                  className="tn-input"
                  placeholder="e.g. Operating Systems"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  aria-invalid={Boolean(errors.subject)}
                />
              </Field>
              <Field id="tn-f-code" label="Subject code">
                <input
                  id="tn-f-code"
                  type="text"
                  className="tn-input"
                  placeholder="e.g. CS-501"
                  value={form.subjectCode}
                  onChange={(e) => setField("subjectCode", e.target.value)}
                />
              </Field>
              <Field id="tn-f-unit" label="Unit or module">
                <input
                  id="tn-f-unit"
                  type="text"
                  className="tn-input"
                  placeholder="e.g. Unit 3"
                  value={form.unit}
                  onChange={(e) => setField("unit", e.target.value)}
                />
              </Field>
              <Field id="tn-f-chapter" label="Chapter or topic" wide>
                <input
                  id="tn-f-chapter"
                  type="text"
                  className="tn-input"
                  placeholder="e.g. Process scheduling and semaphores"
                  value={form.chapter}
                  onChange={(e) => setField("chapter", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Resources */}
          <section className="tn-section">
            <header className="tn-section-head">
              <span className="tn-section-icon" aria-hidden="true">
                <Layers size={16} />
              </span>
              <div>
                <h4>Files and links</h4>
                <p>Upload documents, share cloud links, or combine both</p>
              </div>
            </header>

            <div className="tn-segmented" role="radiogroup" aria-label="Resource type">
              {[
                { v: "file", label: "Upload files", icon: Paperclip },
                { v: "url", label: "External links", icon: Globe },
                { v: "both", label: "Files and links", icon: Layers }
              ].map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={form.uploadMode === v}
                  className={`tn-segment${form.uploadMode === v ? " is-active" : ""}`}
                  onClick={() => setField("uploadMode", v)}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {showFiles ? (
              <div className="tn-pane">
                {isEdit && existingFiles.length > 0 ? (
                  <div className="tn-existing-attachments">
                    <div className="tn-pane-head">
                      <p className="tn-subtle-title">
                        Already Attached Files ({activeExistingCount} active, {existingFiles.length} total)
                      </p>
                      {stagedRemovedIds.size > 0 ? (
                        <span className="tn-staged-warn-badge">
                          {stagedRemovedIds.size} {stagedRemovedIds.size === 1 ? "file" : "files"} marked for removal on Save
                        </span>
                      ) : null}
                    </div>

                    <ul className="tn-existing-file-list">
                      {existingFiles.map((f, i) => {
                        const fileId = String(f._id || f.id || `${getFileName(f)}-${i}`);
                        const fName = getFileName(f);
                        const fSize = getFileSize(f);
                        const isRemoved = stagedRemovedIds.has(fileId);
                        const replFile = replacements[fileId];
                        const isConfirming = confirmRemoveId === fileId;

                        return (
                          <li
                            key={fileId}
                            className={`tn-existing-file-item${isRemoved ? " is-staged-remove" : ""}${replFile ? " is-staged-replace" : ""}`}
                          >
                            {isConfirming ? (
                              <div className="tn-inline-confirm" role="alert">
                                <span>Remove "{fName}" on save?</span>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    type="button"
                                    className="tn-btn tn-btn-danger tn-btn-sm"
                                    onClick={() => stageRemoveFile(fileId)}
                                  >
                                    Yes, remove
                                  </button>
                                  <button
                                    type="button"
                                    className="tn-btn tn-btn-ghost tn-btn-sm"
                                    onClick={() => setConfirmRemoveId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="tn-existing-file-main">
                                  <ExtBadge name={replFile ? replFile.name : fName} />
                                  <div className="tn-existing-file-meta">
                                    <span
                                      className={`tn-existing-file-name${isRemoved ? " tn-strikethrough" : ""}`}
                                      title={fName}
                                    >
                                      {fName}
                                    </span>
                                    <div className="tn-existing-file-badges">
                                      <span className="tn-mini-meta">
                                        {fSize ? formatFileSize(fSize) : "Original size"}
                                      </span>
                                      {isRemoved ? (
                                        <Badge tone="danger">Marked for removal</Badge>
                                      ) : null}
                                      {replFile ? (
                                        <Badge tone="accent">
                                          Replacing with: {replFile.name} ({formatFileSize(replFile.size)})
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="tn-existing-actions">
                                  {isRemoved ? (
                                    <button
                                      type="button"
                                      className="tn-btn tn-btn-soft tn-btn-sm"
                                      onClick={() => undoRemoveFile(fileId)}
                                      title="Undo removal and keep file"
                                    >
                                      <RotateCcw size={13} />
                                      <span>Undo</span>
                                    </button>
                                  ) : replFile ? (
                                    <button
                                      type="button"
                                      className="tn-btn tn-btn-ghost tn-btn-sm"
                                      onClick={() => cancelReplace(fileId)}
                                      title="Cancel replacement and keep original"
                                    >
                                      <X size={13} />
                                      <span>Cancel replace</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="tn-btn tn-btn-soft tn-btn-sm"
                                        onClick={() => triggerReplace(fileId)}
                                        title="Replace this attachment with a newer file"
                                      >
                                        <RefreshCw size={13} />
                                        <span>Replace</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="tn-icon-btn tn-icon-danger"
                                        onClick={() => setConfirmRemoveId(fileId)}
                                        title="Remove this attachment"
                                        aria-label={`Remove ${fName}`}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </>
                                  )}
                                  <input
                                    ref={(el) => (replaceInputRefs.current[fileId] = el)}
                                    type="file"
                                    hidden
                                    accept={ACCEPT_ATTR}
                                    onChange={(e) => {
                                      handleReplaceFile(fileId, e.target.files?.[0]);
                                      e.target.value = "";
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                <div className="tn-new-attachments">
                  {isEdit ? <p className="tn-subtle-title">Add More Attachments</p> : null}
                  <div
                    className={`tn-dropzone${dragging ? " is-dragover" : ""}${errors.files ? " has-error" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label="Add files. Drag and drop or press Enter to browse."
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
                    }}
                  >
                    <span className="tn-drop-icon" aria-hidden="true">
                      <UploadCloud size={26} />
                    </span>
                    <p>{dragging ? "Drop to add files" : isEdit ? "Choose or drag additional files here" : "Drag files here or browse"}</p>
                    <small>PDF, PPT, DOC, XLS, ZIP, RAR, images, TXT. Up to 100 MB each.</small>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      hidden
                      accept={ACCEPT_ATTR}
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </div>
                </div>

                {errors.files ? (
                  <p className="tn-error-text" role="alert">
                    <AlertCircle size={13} aria-hidden="true" />
                    {errors.files}
                  </p>
                ) : null}

                {fileIssues.length > 0 ? (
                  <div className="tn-banner tn-banner-warn" role="status">
                    <Info size={18} aria-hidden="true" />
                    <div>
                      <strong>
                        {fileIssues.length === 1 ? "1 file was skipped" : `${fileIssues.length} files were skipped`}
                      </strong>
                      <ul>
                        {fileIssues.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {files.length > 0 ? (
                  <div className="tn-filelist">
                    <p className="tn-subtle-title">
                      Ready to upload ({files.length}), {formatFileSize(totalSize)} total
                    </p>
                    <ul>
                      {files.map(({ id, file }) => (
                        <li key={id} className="tn-file-item">
                          <FileThumb file={file} />
                          <div className="tn-file-info">
                            <span className="tn-file-name" title={file.name}>
                              {file.name}
                            </span>
                            <small>{formatFileSize(file.size)}</small>
                          </div>
                          <button
                            type="button"
                            className="tn-icon-btn tn-icon-danger"
                            onClick={() => setFiles((p) => p.filter((f) => f.id !== id))}
                            disabled={submitting}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {showUrls ? (
              <div className="tn-pane">
                <div className="tn-pane-head">
                  <p className="tn-subtle-title">External links (Google Drive, OneDrive, Dropbox, YouTube)</p>
                  <button
                    type="button"
                    className="tn-btn tn-btn-soft tn-btn-sm"
                    onClick={() => setResources((p) => [...p, blankResource()])}
                  >
                    <Plus size={14} />
                    <span>Add link</span>
                  </button>
                </div>
                {errors.urlsGeneral ? (
                  <p className="tn-error-text" role="alert">
                    <AlertCircle size={13} aria-hidden="true" />
                    {errors.urlsGeneral}
                  </p>
                ) : null}

                <div className="tn-url-list">
                  {resources.map((r, idx) => {
                    const p = detectUrlProvider(r.url);
                    const urlError = errors.urls?.[r._key];
                    return (
                      <div key={r._key} className="tn-url-card">
                        <div className="tn-url-top">
                          <div className="tn-url-id">
                            <Badge tone={p.tone}>{p.label}</Badge>
                            <span>Link {idx + 1}</span>
                          </div>
                          {resources.length > 1 ? (
                            <button
                              type="button"
                              className="tn-icon-btn tn-icon-danger"
                              onClick={() => removeResource(r._key)}
                              aria-label={`Remove link ${idx + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                        <div className="tn-form-grid">
                          <div className={urlError ? "tn-field-urlerr is-wide" : "is-wide"}>
                            <Field id={`tn-u-url-${r._key}`} label="Link" error={urlError} wide>
                              <input
                                id={`tn-u-url-${r._key}`}
                                type="url"
                                className="tn-input"
                                placeholder="https://drive.google.com/file/d/..."
                                value={r.url}
                                onChange={(e) => updateResource(r._key, "url", e.target.value)}
                                aria-invalid={Boolean(urlError)}
                              />
                            </Field>
                          </div>
                          <Field id={`tn-u-title-${r._key}`} label="Label">
                            <input
                              id={`tn-u-title-${r._key}`}
                              type="text"
                              className="tn-input"
                              placeholder="e.g. Lab experiments folder"
                              value={r.title}
                              onChange={(e) => updateResource(r._key, "title", e.target.value)}
                            />
                          </Field>
                          <Field id={`tn-u-type-${r._key}`} label="Type">
                            <select
                              id={`tn-u-type-${r._key}`}
                              className="tn-select"
                              value={r.resourceType}
                              onChange={(e) => updateResource(r._key, "resourceType", e.target.value)}
                            >
                              {RESOURCE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field id={`tn-u-note-${r._key}`} label="Note for students" wide>
                            <input
                              id={`tn-u-note-${r._key}`}
                              type="text"
                              className="tn-input"
                              placeholder="e.g. Sign in with your college email to open"
                              value={r.description}
                              onChange={(e) => updateResource(r._key, "description", e.target.value)}
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <div className="tn-summary">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>
              Reaches <strong>{form.branch}</strong>, <strong>{form.semester}</strong> studying{" "}
              <strong>{form.subject.trim() || "this subject"}</strong>
              {form.publicationStatus === "published" ? "." : ` (${STATUS_META[form.publicationStatus]?.label.toLowerCase()}, not visible yet).`}
            </span>
          </div>
        </div>

        <div className={`tn-modal-foot tn-modal-foot-form${isEdit ? " tn-modal-foot-split" : ""}`}>
          {isEdit && !submitting ? (
            <button
              type="button"
              className="tn-btn tn-btn-danger"
              onClick={() => setDeleteConfirmOpen(true)}
              title="Permanently delete this entire study material and its attachments"
            >
              <Trash2 size={16} />
              <span>Delete material</span>
            </button>
          ) : null}

          {submitting ? (
            <div className="tn-upload-status" role="status" aria-live="polite">
              <div className="tn-upload-status-text">
                <Loader2 size={15} className="tn-spin" aria-hidden="true" />
                <span>
                  {files.length > 0 || Object.keys(replacements).length > 0
                    ? `Saving and updating files...`
                    : "Saving changes..."}
                  {progress !== null ? ` ${progress}%` : ""}
                </span>
              </div>
              <div
                className={`tn-progress${progress === null ? " is-indeterminate" : ""}`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress === null ? undefined : progress}
              >
                <span style={progress === null ? undefined : { width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="tn-modal-foot-group">
              <button type="button" className="tn-btn tn-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="tn-btn tn-btn-primary">
                {submitError ? <RefreshCw size={16} /> : isEdit ? <Check size={16} /> : <Send size={16} />}
                <span>{submitLabel}</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {deleteConfirmOpen ? (
        <ConfirmDialog
          title={`Delete "${form.title.trim() || note?.title}"?`}
          message="This study material and all attached files will be permanently removed from student portals and servers. This cannot be undone."
          confirmLabel="Delete material"
          busy={deletingNote}
          onConfirm={handleDeleteNoteFromModal}
          onCancel={() => (deletingNote ? undefined : setDeleteConfirmOpen(false))}
        />
      ) : null}
    </Modal>
  );
}

/* ==========================================================================
   Analytics modal
   ========================================================================== */

const STUDENT_SORTS = [
  { value: "name", label: "Name A to Z" },
  { value: "downloads", label: "Most downloads" },
  { value: "recent", label: "Latest download" },
  { value: "pending", label: "Not downloaded first" }
];

function AnalyticsModal({ note, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [ring, setRing] = useState(0);
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setData(null);
    authApi
      .getSingleNoteAnalytics(getNoteId(note))
      .then((res) => {
        if (!alive) return;
        setData(res?.analytics || null);
        setStatus("ready");
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Analytics load error:", err);
        const message = err?.message || "Could not load download analytics.";
        setErrorMsg(message);
        setStatus("error");
        toastRef.current?.(message, true);
      });
    return () => {
      alive = false;
    };
  }, [note, attempt]);

  const overview = data?.overview || {};
  const students = useMemo(() => data?.students || [], [data]);
  const rate = Math.max(0, Math.min(100, Number(overview.downloadRatePercentage) || 0));

  useEffect(() => {
    if (status !== "ready") return undefined;
    if (prefersReducedMotion()) {
      setRing(rate);
      return undefined;
    }
    const t = requestAnimationFrame(() => setRing(rate));
    return () => cancelAnimationFrame(t);
  }, [status, rate]);

  const counts = useMemo(() => {
    const done = students.filter((s) => s.hasDownloaded).length;
    return { all: students.length, done, pending: students.length - done };
  }, [students]);

  const maxDownloads = useMemo(() => students.reduce((m, s) => Math.max(m, s.downloadCount || 0), 0), [students]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = students.filter((s) => {
      if (filter === "done" && !s.hasDownloaded) return false;
      if (filter === "pending" && s.hasDownloaded) return false;
      if (!q) return true;
      return [s.name, s.email, s.enrollmentNo].some((v) => String(v || "").toLowerCase().includes(q));
    });
    const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""));
    const time = (s) => (s.lastDownloadedAt ? new Date(s.lastDownloadedAt).getTime() : 0);
    list.sort((a, b) => {
      if (sort === "downloads") return (b.downloadCount || 0) - (a.downloadCount || 0) || byName(a, b);
      if (sort === "recent") return time(b) - time(a) || byName(a, b);
      if (sort === "pending") return Number(a.hasDownloaded) - Number(b.hasDownloaded) || byName(a, b);
      return byName(a, b);
    });
    return list;
  }, [students, query, filter, sort]);

  return (
    <Modal labelledBy="tn-analytics-title" onClose={onClose} size="xl">
      <ModalHeader id="tn-analytics-title" icon={BarChart3} title={`Download analytics: ${note.title}`} onClose={onClose}>
        <div className="tn-tags tn-tags-tight">
          <Badge tone="accent">{note.subject}</Badge>
          <Badge tone="muted">{note.category}</Badge>
        </div>
      </ModalHeader>

      <div className="tn-modal-body">
        {status === "loading" ? (
          <div className="tn-analytics-skeleton" aria-busy="true" aria-label="Loading analytics">
            <div className="tn-kpi-row">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="tn-sk tn-sk-kpi" />
              ))}
            </div>
            <div className="tn-sk tn-sk-block" />
          </div>
        ) : status === "error" ? (
          <div className="tn-empty tn-empty-inline">
            <span className="tn-empty-icon tn-empty-icon-danger" aria-hidden="true">
              <AlertCircle size={26} />
            </span>
            <h3>Analytics did not load</h3>
            <p>{errorMsg}</p>
            <button type="button" className="tn-btn tn-btn-primary" onClick={() => setAttempt((a) => a + 1)}>
              <RefreshCw size={16} />
              <span>Try again</span>
            </button>
          </div>
        ) : !data ? (
          <div className="tn-empty tn-empty-inline">
            <span className="tn-empty-icon" aria-hidden="true">
              <BarChart3 size={26} />
            </span>
            <h3>No analytics yet</h3>
            <p>Analytics appear once this material is published to a class with enrolled students.</p>
          </div>
        ) : (
          <>
            <div className="tn-kpi-row">
              <div className="tn-kpi-card">
                <span className="tn-kpi-icon tn-tone-accent" aria-hidden="true">
                  <Users size={16} />
                </span>
                <span className="tn-kpi-label">Eligible students</span>
                <strong>
                  <AnimatedNumber value={overview.eligibleStudentsCount || 0} />
                </strong>
              </div>
              <div className="tn-kpi-card">
                <span className="tn-kpi-icon tn-tone-ok" aria-hidden="true">
                  <CheckCircle2 size={16} />
                </span>
                <span className="tn-kpi-label">Unique downloaders</span>
                <strong>
                  <AnimatedNumber value={overview.uniqueDownloadersCount || 0} />
                </strong>
              </div>
              <div className="tn-kpi-card">
                <span className="tn-kpi-icon tn-tone-violet" aria-hidden="true">
                  <Download size={16} />
                </span>
                <span className="tn-kpi-label">Total downloads</span>
                <strong>
                  <AnimatedNumber value={overview.totalDownloadsCount || 0} />
                </strong>
              </div>
              <div className="tn-kpi-card tn-kpi-ring">
                <div className="tn-ring" role="img" aria-label={`${rate} percent of eligible students downloaded`}>
                  <svg viewBox="0 0 44 44" aria-hidden="true">
                    <circle className="tn-ring-track" cx="22" cy="22" r="18" pathLength="100" />
                    <circle
                      className="tn-ring-value"
                      cx="22"
                      cy="22"
                      r="18"
                      pathLength="100"
                      strokeDasharray={`${ring} 100`}
                    />
                  </svg>
                  <b>
                    <AnimatedNumber value={Math.round(rate)} suffix="%" />
                  </b>
                </div>
                <div>
                  <span className="tn-kpi-label">Download rate</span>
                  <small>
                    {counts.pending} of {counts.all} not yet downloaded
                  </small>
                </div>
              </div>
            </div>

            <div className="tn-reach">
              <div className="tn-reach-head">
                <span>
                  <TrendingUp size={14} aria-hidden="true" /> Reach across the class
                </span>
                <strong>
                  {counts.done} of {counts.all} students
                </strong>
              </div>
              <div className="tn-progress tn-progress-lg" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rate)}>
                <span style={{ width: `${rate}%` }} />
              </div>
            </div>

            <div className="tn-student-tools">
              <div className="tn-search tn-search-sm">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  className="tn-input"
                  placeholder="Search by name, email, or enrollment"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search students"
                />
              </div>
              <label className="tn-inline-select">
                <span className="tn-sr">Sort students</span>
                <select className="tn-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {STUDENT_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="tn-btn tn-btn-soft"
                onClick={() => downloadStudentsCsv(note, rows)}
                disabled={rows.length === 0}
                title="Exports the students currently shown"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="tn-chips" role="tablist" aria-label="Filter students by status">
              {[
                { v: "all", label: "All", n: counts.all },
                { v: "done", label: "Downloaded", n: counts.done },
                { v: "pending", label: "Not downloaded", n: counts.pending }
              ].map((c) => (
                <button
                  key={c.v}
                  type="button"
                  role="tab"
                  aria-selected={filter === c.v}
                  className={`tn-chip${filter === c.v ? " is-active" : ""}`}
                  onClick={() => setFilter(c.v)}
                >
                  {c.label}
                  <span>{c.n}</span>
                </button>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="tn-empty tn-empty-inline">
                <span className="tn-empty-icon" aria-hidden="true">
                  <Users size={24} />
                </span>
                <h3>No students match</h3>
                <p>Try a different search or status filter.</p>
              </div>
            ) : (
              <div className="tn-table-wrap">
                <table className="tn-table">
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Enrollment</th>
                      <th scope="col">Status</th>
                      <th scope="col">Downloads</th>
                      <th scope="col">Last downloaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((st) => (
                      <tr key={st.studentId || st.email || st.enrollmentNo}>
                        <td data-label="Student">
                          <strong>{st.name}</strong>
                          <small>{st.email}</small>
                        </td>
                        <td data-label="Enrollment">
                          <code>{st.enrollmentNo || "Not available"}</code>
                        </td>
                        <td data-label="Status">
                          {st.hasDownloaded ? (
                            <Badge tone="ok" icon={Check}>
                              Downloaded
                            </Badge>
                          ) : (
                            <Badge tone="muted">Not downloaded</Badge>
                          )}
                        </td>
                        <td data-label="Downloads">
                          <div className="tn-minibar-cell">
                            <strong>{st.downloadCount || 0}</strong>
                            <span className="tn-minibar" aria-hidden="true">
                              <i style={{ width: maxDownloads ? `${((st.downloadCount || 0) / maxDownloads) * 100}%` : "0%" }} />
                            </span>
                          </div>
                        </td>
                        <td data-label="Last downloaded">{st.lastDownloadedAt ? formatDate(st.lastDownloadedAt) : "Never"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="tn-result-note" aria-live="polite">
              Showing {rows.length} of {counts.all} students
            </p>
          </>
        )}
      </div>

      <div className="tn-modal-foot">
        <button type="button" className="tn-btn tn-btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

/* ==========================================================================
   Page
   ========================================================================== */

export default function TeacherNotes({ showToast }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState({ subject: "all", semester: "all", year: "all", mode: "all", status: "all" });
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useStoredValue(STORAGE_VIEW, "grid");
  const [pinned, togglePin] = useStoredSet(STORAGE_PINNED);

  const [selected, setSelected] = useState(() => new Set());
  const [formState, setFormState] = useState({ open: false, note: null });
  const [analyticsNote, setAnalyticsNote] = useState(null);
  const [detailsNote, setDetailsNote] = useState(null);
  const [confirm, setConfirm] = useState(null); // { notes: [...] }
  const [deleting, setDeleting] = useState(false);
  const [entrance, setEntrance] = useState(true);

  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const fetchNotes = useCallback(() => {
    setLoading(true);
    setLoadError("");
    authApi
      .getNotes({ myUploads: "true" })
      .then((res) => {
        const list = res?.notes || [];
        setNotes(list);
        setSelected((prev) => {
          const ids = new Set(list.map(getNoteId));
          const next = new Set([...prev].filter((id) => ids.has(id)));
          return next.size === prev.size ? prev : next;
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading notes:", err);
        const message = err?.message || "Failed to load uploaded notes.";
        setLoadError(message);
        toastRef.current?.(message, true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => setEntrance(false), 1200);
    return () => clearTimeout(t);
  }, [loading]);

  /* ----- Derived data ----- */

  const stats = useMemo(() => {
    const s = { total: notes.length, published: 0, draft: 0, archived: 0, downloads: 0, important: 0, top: null };
    notes.forEach((n) => {
      const st = getStatus(n);
      if (st === "draft") s.draft += 1;
      else if (st === "archived") s.archived += 1;
      else s.published += 1;
      s.downloads += n.downloadCount || 0;
      if (n.isImportant) s.important += 1;
      if ((n.downloadCount || 0) > (s.top?.downloadCount || 0)) s.top = n;
    });
    return s;
  }, [notes]);

  const recent = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(getNoteDate(b) || 0).getTime() - new Date(getNoteDate(a) || 0).getTime())
      .slice(0, 5);
  }, [notes]);

  const options = useMemo(() => {
    const uniq = (pick) => [...new Set(notes.map(pick).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
    return { subjects: uniq((n) => n.subject), semesters: uniq((n) => n.semester), years: uniq((n) => n.academicYear) };
  }, [notes]);

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (filters.subject !== "all" && n.subject !== filters.subject) return false;
      if (filters.semester !== "all" && n.semester !== filters.semester) return false;
      if (filters.year !== "all" && n.academicYear !== filters.year) return false;
      if (filters.status !== "all" && getStatus(n) !== filters.status) return false;
      if (filters.mode !== "all" && getNoteMode(n) !== filters.mode) return false;
      if (pinnedOnly && !pinned.has(getNoteId(n))) return false;
      if (q) {
        const hay = [n.title, n.subject, n.subjectCode, n.unit, n.chapter, n.category, n.description]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notes, filters, search, pinnedOnly, pinned]);

  const categoryCounts = useMemo(() => {
    const map = {};
    baseFiltered.forEach((n) => {
      map[n.category] = (map[n.category] || 0) + 1;
    });
    return map;
  }, [baseFiltered]);

  const visible = useMemo(() => {
    const list = category === "all" ? [...baseFiltered] : baseFiltered.filter((n) => n.category === category);
    const time = (n) => new Date(getNoteDate(n) || 0).getTime();
    const title = (n) => String(n.title || "");
    list.sort((a, b) => {
      const pin = Number(pinned.has(getNoteId(b))) - Number(pinned.has(getNoteId(a)));
      if (pin !== 0) return pin;
      switch (sort) {
        case "oldest":
          return time(a) - time(b);
        case "title-asc":
          return title(a).localeCompare(title(b));
        case "title-desc":
          return title(b).localeCompare(title(a));
        case "downloads":
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        default:
          return time(b) - time(a);
      }
    });
    return list;
  }, [baseFiltered, category, sort, pinned]);

  const tabCategories = useMemo(
    () => CATEGORIES.filter((c) => categoryCounts[c] > 0 || c === category),
    [categoryCounts, category]
  );

  const activeFilterCount =
    Object.values(filters).filter((v) => v !== "all").length + (pinnedOnly ? 1 : 0);

  const clearFilters = () => {
    setFilters({ subject: "all", semester: "all", year: "all", mode: "all", status: "all" });
    setPinnedOnly(false);
    setSearch("");
    setCategory("all");
  };

  /* ----- Actions ----- */

  const openCreate = () => setFormState({ open: true, note: null });
  const openEdit = useCallback((note) => {
    setDetailsNote(null);
    setFormState({ open: true, note });
  }, []);
  const openAnalytics = useCallback((note) => {
    setDetailsNote(null);
    setAnalyticsNote(note);
  }, []);
  const openDetails = useCallback((note) => setDetailsNote(note), []);
  const askDelete = useCallback((note) => setConfirm({ notes: [note] }), []);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allVisibleSelected = visible.length > 0 && visible.every((n) => selected.has(getNoteId(n)));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((n) => next.delete(getNoteId(n)));
      else visible.forEach((n) => next.add(getNoteId(n)));
      return next;
    });
  };

  const askBulkDelete = () => {
    const picked = notes.filter((n) => selected.has(getNoteId(n)));
    if (picked.length > 0) setConfirm({ notes: picked });
  };

  const runDelete = async () => {
    if (!confirm) return;
    const targets = confirm.notes;
    setDeleting(true);
    try {
      if (targets.length === 1) {
        await authApi.deleteNote(getNoteId(targets[0]));
        showToast?.("Material deleted.");
      } else {
        const results = await Promise.allSettled(targets.map((n) => authApi.deleteNote(getNoteId(n))));
        const failed = results.filter((r) => r.status === "rejected").length;
        const ok = targets.length - failed;
        if (failed === 0) showToast?.(`${ok} materials deleted.`);
        else showToast?.(`${ok} deleted, ${failed} could not be deleted. They are still selected.`, true);
        if (failed > 0) {
          const failedIds = new Set(
            targets.filter((_, i) => results[i].status === "rejected").map(getNoteId)
          );
          setSelected(failedIds);
        } else {
          setSelected(new Set());
        }
      }
      if (targets.length === 1) {
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(getNoteId(targets[0]));
          return next;
        });
      }
      setConfirm(null);
      fetchNotes();
    } catch (err) {
      showToast?.(err?.message || "Failed to delete this material.", true);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = () => {
    setFormState({ open: false, note: null });
    fetchNotes();
  };

  /* ----- Render ----- */

  const hasNotes = notes.length > 0;
  const totalForBar = stats.total || 1;

  return (
    <div className="teacher-role-view teacher-notes-container">
      <div className="tn-aurora" aria-hidden="true" />

      {/* Header */}
      <header className="tn-header tn-rise" style={{ "--d": 0 }}>
        <div className="tn-header-copy">
          <h2>
            <span className="tn-title-icon" aria-hidden="true">
              <BookOpen size={22} />
            </span>
            Study notes and handouts
          </h2>
          <p>
            Publish files and cloud links to your classes, then see exactly which students have downloaded them.
          </p>
        </div>
        <button type="button" className="tn-btn tn-btn-primary tn-btn-lg" onClick={openCreate}>
          <Plus size={18} />
          <span>Upload material</span>
        </button>
      </header>

      {/* Overview */}
      <section className="tn-stats tn-rise" style={{ "--d": 1 }} aria-label="Library overview">
        <div className="tn-hero">
          <div className="tn-hero-top">
            <div>
              <span className="tn-hero-label">Materials in your library</span>
              <p className="tn-hero-number">
                <AnimatedNumber value={stats.total} />
              </p>
            </div>
            <Badge tone="accent" icon={Eye}>
              {stats.published} visible to students
            </Badge>
          </div>
          <div
            className="tn-statusbar"
            role="img"
            aria-label={`${stats.published} published, ${stats.draft} drafts, ${stats.archived} archived`}
          >
            {stats.total === 0 ? null : (
              <>
                <span className="tn-seg tn-seg-ok" style={{ width: `${(stats.published / totalForBar) * 100}%` }} />
                <span className="tn-seg tn-seg-warn" style={{ width: `${(stats.draft / totalForBar) * 100}%` }} />
                <span className="tn-seg tn-seg-muted" style={{ width: `${(stats.archived / totalForBar) * 100}%` }} />
              </>
            )}
          </div>
          <ul className="tn-legend">
            <li>
              <i className="tn-dot tn-dot-ok" /> Published <b>{stats.published}</b>
            </li>
            <li>
              <i className="tn-dot tn-dot-warn" /> Drafts <b>{stats.draft}</b>
            </li>
            <li>
              <i className="tn-dot tn-dot-muted" /> Archived <b>{stats.archived}</b>
            </li>
          </ul>
        </div>

        <div className="tn-kpis">
          <div className="tn-kpi">
            <span className="tn-kpi-icon tn-tone-violet" aria-hidden="true">
              <Download size={16} />
            </span>
            <span className="tn-kpi-label">Student downloads</span>
            <strong>
              <AnimatedNumber value={stats.downloads} />
            </strong>
          </div>
          <div className="tn-kpi">
            <span className="tn-kpi-icon tn-tone-hot" aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <span className="tn-kpi-label">High priority</span>
            <strong>
              <AnimatedNumber value={stats.important} />
            </strong>
          </div>
          <div className="tn-kpi tn-kpi-wide">
            <span className="tn-kpi-icon tn-tone-ok" aria-hidden="true">
              <TrendingUp size={16} />
            </span>
            <span className="tn-kpi-label">Most downloaded</span>
            {stats.top ? (
              <button type="button" className="tn-kpi-link" onClick={() => openDetails(stats.top)} title={stats.top.title}>
                {stats.top.title}
                <small>{stats.top.downloadCount} downloads</small>
              </button>
            ) : (
              <span className="tn-kpi-empty">Appears after the first download</span>
            )}
          </div>
        </div>
      </section>

      {/* Recent uploads */}
      {recent.length > 0 ? (
        <details className="tn-recent tn-rise" style={{ "--d": 2 }}>
          <summary>
            <span>Recent uploads</span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <ul>
            {recent.map((n) => {
              const st = getStatus(n);
              return (
                <li key={getNoteId(n)}>
                  <button type="button" onClick={() => openDetails(n)}>
                    <span className="tn-recent-title">{n.title}</span>
                    <span className="tn-recent-meta">
                      {n.subject}, {formatDate(getNoteDate(n))}
                    </span>
                  </button>
                  <Badge tone={STATUS_META[st]?.tone || "muted"}>{STATUS_META[st]?.label || st}</Badge>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      {/* Toolbar */}
      <section className="tn-toolbar tn-rise" style={{ "--d": 3 }} aria-label="Search and filters">
        <div className="tn-toolbar-row">
          <div className="tn-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              className="tn-input"
              placeholder="Search by title, subject, unit, or topic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search materials"
            />
            {search ? (
              <button type="button" className="tn-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} />
              </button>
            ) : null}
          </div>

          <label className="tn-inline-select tn-sort">
            <span className="tn-sr">Sort materials</span>
            <select className="tn-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={`tn-btn tn-btn-ghost tn-filter-btn${filtersOpen ? " is-open" : ""}`}
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="tn-filters-panel"
            aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters"}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFilterCount > 0 ? <em className="tn-count-dot">{activeFilterCount}</em> : null}
          </button>

          <div className="tn-view-toggle" role="group" aria-label="Layout">
            <button
              type="button"
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
              title="List view"
            >
              <List size={16} />
            </button>
          </div>

          <button type="button" className="tn-icon-btn tn-refresh" onClick={fetchNotes} aria-label="Refresh list" title="Refresh">
            <RefreshCw size={16} className={loading ? "tn-spin" : ""} />
          </button>
        </div>

        <div id="tn-filters-panel" className={`tn-filters${filtersOpen ? " is-open" : ""}`}>
          <div className="tn-filters-inner">
            <div className="tn-filters-grid">
              <label className="tn-field">
                <span className="tn-label">Subject</span>
                <select className="tn-select" value={filters.subject} onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}>
                  <option value="all">All subjects</option>
                  {options.subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tn-field">
                <span className="tn-label">Semester</span>
                <select className="tn-select" value={filters.semester} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}>
                  <option value="all">All semesters</option>
                  {options.semesters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tn-field">
                <span className="tn-label">Academic year</span>
                <select className="tn-select" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
                  <option value="all">All years</option>
                  {options.years.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tn-field">
                <span className="tn-label">Visibility</span>
                <select className="tn-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="tn-field">
                <span className="tn-label">Content</span>
                <select className="tn-select" value={filters.mode} onChange={(e) => setFilters((f) => ({ ...f, mode: e.target.value }))}>
                  <option value="all">Files and links</option>
                  <option value="file">Files only</option>
                  <option value="url">Links only</option>
                  <option value="both">Files and links together</option>
                </select>
              </label>
              <div className="tn-filter-actions">
                <button
                  type="button"
                  className={`tn-btn tn-btn-ghost tn-btn-sm${pinnedOnly ? " is-on" : ""}`}
                  onClick={() => setPinnedOnly((p) => !p)}
                  aria-pressed={pinnedOnly}
                >
                  <Star size={14} />
                  <span>Starred only</span>
                </button>
                <button type="button" className="tn-btn tn-btn-ghost tn-btn-sm" onClick={clearFilters} disabled={activeFilterCount === 0 && !search && category === "all"}>
                  <X size={14} />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasNotes ? (
          <div className="tn-tabs" role="tablist" aria-label="Material categories">
            <button
              type="button"
              role="tab"
              aria-selected={category === "all"}
              className={`tn-tab${category === "all" ? " is-active" : ""}`}
              onClick={() => setCategory("all")}
            >
              All
              <span>{baseFiltered.length}</span>
            </button>
            {tabCategories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                className={`tn-tab${category === c ? " is-active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
                <span>{categoryCounts[c] || 0}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {/* Content */}
      <main className="tn-content" aria-busy={loading}>
        {loading ? (
          <SkeletonGrid />
        ) : loadError && !hasNotes ? (
          <div className="tn-empty">
            <span className="tn-empty-icon tn-empty-icon-danger" aria-hidden="true">
              <AlertCircle size={30} />
            </span>
            <h3>Your materials did not load</h3>
            <p>{loadError}</p>
            <button type="button" className="tn-btn tn-btn-primary" onClick={fetchNotes}>
              <RefreshCw size={16} />
              <span>Try again</span>
            </button>
          </div>
        ) : !hasNotes ? (
          <div className="tn-empty">
            <span className="tn-empty-icon" aria-hidden="true">
              <FolderOpen size={30} />
            </span>
            <h3>Your library is empty</h3>
            <p>Upload your first handout, lab manual, or question bank and choose which class can see it.</p>
            <button type="button" className="tn-btn tn-btn-primary" onClick={openCreate}>
              <Plus size={16} />
              <span>Upload your first material</span>
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="tn-empty">
            <span className="tn-empty-icon" aria-hidden="true">
              <Search size={28} />
            </span>
            <h3>No materials match</h3>
            <p>Nothing fits the current search and filters. Clear them to see everything again.</p>
            <button type="button" className="tn-btn tn-btn-soft" onClick={clearFilters}>
              <X size={16} />
              <span>Clear search and filters</span>
            </button>
          </div>
        ) : (
          <>
            <div className="tn-results-bar">
              <label className="tn-check tn-check-labeled">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                <span className="tn-check-box">
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                </span>
                <span>Select all</span>
              </label>
              <p aria-live="polite">
                Showing <b>{visible.length}</b> of <b>{notes.length}</b> materials
              </p>
            </div>
            <div key={category} className={`tn-grid tn-fade${view === "list" ? " is-list" : ""}`}>
              {visible.map((note, i) => {
                const id = getNoteId(note);
                return (
                  <NoteCard
                    key={id}
                    note={note}
                    index={i}
                    animate={entrance}
                    selected={selected.has(id)}
                    pinned={pinned.has(id)}
                    onToggleSelect={toggleSelect}
                    onTogglePin={togglePin}
                    onOpen={openDetails}
                    onEdit={openEdit}
                    onDelete={askDelete}
                    onAnalytics={openAnalytics}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Bulk actions */}
      {selected.size > 0 ? (
        <div className="tn-bulkbar" role="region" aria-label="Bulk actions">
          <span className="tn-bulk-count">
            <b>{selected.size}</b> selected
          </span>
          <div className="tn-bulk-actions">
            <button type="button" className="tn-btn tn-btn-ghost tn-btn-sm" onClick={() => setSelected(new Set())}>
              <X size={14} />
              <span>Clear</span>
            </button>
            <button type="button" className="tn-btn tn-btn-danger tn-btn-sm" onClick={askBulkDelete}>
              <Trash2 size={14} />
              <span>Delete selected</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      {formState.open ? (
        <NoteFormModal
          key={formState.note ? getNoteId(formState.note) : "new"}
          note={formState.note}
          onClose={() => setFormState({ open: false, note: null })}
          onSaved={handleSaved}
          onDelete={askDelete}
          showToast={showToast}
        />
      ) : null}

      {detailsNote ? (
        <NoteDetailsModal
          note={detailsNote}
          onClose={() => setDetailsNote(null)}
          onEdit={openEdit}
          onAnalytics={openAnalytics}
          onDelete={askDelete}
        />
      ) : null}

      {analyticsNote ? <AnalyticsModal note={analyticsNote} onClose={() => setAnalyticsNote(null)} showToast={showToast} /> : null}

      {confirm ? (
        <ConfirmDialog
          title={confirm.notes.length === 1 ? "Delete this material?" : `Delete ${confirm.notes.length} materials?`}
          message={
            confirm.notes.length === 1
              ? `"${confirm.notes[0].title}" and its files will be removed from student portals. This cannot be undone.`
              : "These materials and their files will be removed from student portals. This cannot be undone."
          }
          confirmLabel={confirm.notes.length === 1 ? "Delete material" : `Delete ${confirm.notes.length}`}
          busy={deleting}
          onConfirm={runDelete}
          onCancel={() => (deleting ? undefined : setConfirm(null))}
        />
      ) : null}
    </div>
  );
}