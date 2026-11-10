import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import {
  Mail,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  GraduationCap,
  Award,
  BookOpen,
  Layers,
  Phone,
  Edit2,
  Save,
  X,
  LogOut,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Tag,
  Key,
  Users,
  Search,
  Eye,
  EyeOff,
  Percent,
  Copy,
  Check,
  Download,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Lock,
  TrendingUp,
  User,
  Shield,
  ArrowUp
} from "lucide-react";
import { authApi } from "../services/authApi";
import Navbar from "../components/Navbar";
import ImageCropModal from "../components/ImageCropModal";
import "./Profile.css";

/* ======================================================
   Constants & helpers
   ====================================================== */
const ATTENDANCE_LIMIT = 75;
const ROSTER_PAGE_SIZE = 12;
const MAX_BIO = 300;
const MAX_SKILLS = 12;
const DEFAULT_BRANCHES = ["CSE", "Mechanical", "Electrical", "Civil", "ECE"];
const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;
const MOBILE_QUERY = "(max-width: 820px)";

const ROLE_LABELS = {
  student: "Diploma Candidate",
  teacher: "Faculty / Lecturer",
  hod: "Head of Department (HOD)",
  coordinator: "Academic Coordinator",
  principal: "Principal / Executive Leadership",
  admin: "Institutional Administrator"
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(MOBILE_QUERY).matches;

const haptic = (ms = 8) => {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
};

const getInitials = (name, fallback = "?") => {
  const out = (name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return out || fallback;
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const memberSince = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  if (days < 1) return "Joined today";
  if (days < 30) return `Member for ${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Member for ${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `Member for ${years} year${years === 1 ? "" : "s"}`;
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const downloadTextFile = (filename, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

const passwordChecks = (pwd) => [
  { id: "len", label: "8+ characters", ok: pwd.length >= 8 },
  { id: "case", label: "Upper & lower case", ok: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
  { id: "num", label: "A number", ok: /\d/.test(pwd) },
  { id: "sym", label: "A symbol", ok: /[^A-Za-z0-9]/.test(pwd) }
];

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

/** Wrap matching text in <mark> for search highlighting. */
const highlight = (text, term) => {
  const value = String(text ?? "");
  const q = term.trim();
  if (!q) return value;
  const idx = value.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return value;
  return (
    <>
      {value.slice(0, idx)}
      <mark className="search-hit">{value.slice(idx, idx + q.length)}</mark>
      {value.slice(idx + q.length)}
    </>
  );
};

/* ======================================================
   Hooks
   ====================================================== */
function useCountUp(target, { duration = 1000, delay = 0 } = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof target !== "number" || Number.isNaN(target)) {
      setValue(0);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    let raf;
    let start = null;
    const timer = setTimeout(() => {
      const tick = (now) => {
        if (start === null) start = now;
        const p = Math.min((now - start) / duration, 1);
        setValue(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
}

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const dismiss = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (type, message) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((p) => [...p, { id, type, message }].slice(-4));
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );
  return { toasts, push, dismiss };
}

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/* ======================================================
   Small components
   ====================================================== */
function StudentRosterAvatar({ student, size = "md" }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const initials = getInitials(student?.fullName, "S");
  const isFailed = Boolean(student?.avatarUrl && failedUrl === student.avatarUrl);

  if (student?.avatarUrl && !isFailed) {
    return (
      <img
        src={student.avatarUrl}
        alt={student.fullName}
        className={`roster-avatar-img size-${size}`}
        onError={() => setFailedUrl(student.avatarUrl)}
      />
    );
  }
  return <div className={`roster-avatar-initials size-${size}`}>{initials}</div>;
}

function AnimatedNumber({ value, decimals = 0, suffix = "", delay = 0 }) {
  const animated = useCountUp(typeof value === "number" ? value : NaN, { delay });
  if (typeof value !== "number" || Number.isNaN(value)) return <>N/A</>;
  return <>{animated.toFixed(decimals)}{suffix}</>;
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, seen] = useInView();
  return (
    <div
      ref={ref}
      className={`pf-reveal ${seen ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CopyButton({ text, label, onCopied }) {
  const [done, setDone] = useState(false);
  const handle = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      haptic(10);
      onCopied?.(label);
      setTimeout(() => setDone(false), 1600);
    } catch {
      onCopied?.(null);
    }
  };
  return (
    <button
      type="button"
      className={`copy-btn ${done ? "copied" : ""}`}
      onClick={handle}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function CompletenessRing({ percent }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, []);
  const offset = RING_C * (1 - (drawn ? percent / 100 : 0));
  const tone = percent >= 80 ? "good" : percent >= 50 ? "mid" : "low";
  return (
    <div className={`completeness-ring tone-${tone}`} role="img" aria-label={`Profile ${percent}% complete`}>
      <svg viewBox="0 0 110 110" width="110" height="110">
        <circle className="cr-track" cx="55" cy="55" r={RING_R} />
        <circle
          className="cr-fill"
          cx="55"
          cy="55"
          r={RING_R}
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="cr-center">
        <strong><AnimatedNumber value={percent} suffix="%" /></strong>
        <span>complete</span>
      </div>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pf-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pf-toast toast-${t.type}`} role="status">
          {t.type === "success" ? <CheckCircle2 size={17} /> : t.type === "error" ? <AlertCircle size={17} /> : <Sparkles size={17} />}
          <span>{t.message}</span>
          <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
          <i className="toast-timer" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel, busy, onCancel, onConfirm }) {
  const btnRef = useRef(null);
  useLockBodyScroll(open);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => btnRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="pf-dialog-backdrop" onMouseDown={() => !busy && onCancel()}>
      <div
        className="pf-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pf-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="sheet-grabber" aria-hidden="true" />
        <div className="pf-dialog-icon"><AlertTriangle size={22} /></div>
        <h3 id="pf-dialog-title">{title}</h3>
        <p>{message}</p>
        <div className="pf-dialog-actions">
          <button type="button" className="profile-action-btn secondary" onClick={onCancel} disabled={busy}>
            Stay signed in
          </button>
          <button type="button" ref={btnRef} className="profile-action-btn danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 size={15} className="spinner" /> : <LogOut size={15} />}
            {busy ? "Signing out…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, children }) {
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  return (
    <div className="profile-field-group">
      <label htmlFor={id}>{label}</label>
      <div className="pwd-input-wrap">
        <Lock size={15} className="pwd-lead-icon" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="profile-input pwd-input"
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") || false)}
          onBlur={() => setCaps(false)}
          required
        />
        <button
          type="button"
          className="pwd-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {caps && (
        <span className="caps-warning"><AlertTriangle size={12} /> Caps Lock is on</span>
      )}
      {children}
    </div>
  );
}

function SkillsEditor({ skills, onChange }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const addSkill = (raw) => {
    const clean = raw.trim().replace(/,+$/, "").trim();
    if (!clean) return;
    if (skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setDraft("");
      return;
    }
    if (skills.length >= MAX_SKILLS) return;
    onChange([...skills, clean]);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === "Backspace" && !draft && skills.length) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="skills-editor" onClick={() => inputRef.current?.focus()}>
      {skills.map((sk) => (
        <span key={sk} className="skill-chip editable">
          <Tag size={12} /> {sk}
          <button
            type="button"
            className="chip-remove"
            onClick={(e) => {
              e.stopPropagation();
              onChange(skills.filter((s) => s !== sk));
            }}
            aria-label={`Remove ${sk}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id="edit-skills"
        type="text"
        className="skills-editor-input"
        placeholder={skills.length ? "Add another…" : "Type a skill and press Enter"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addSkill(draft)}
        disabled={skills.length >= MAX_SKILLS}
      />
      {draft.trim() && (
        <button type="button" className="chip-add" onClick={() => addSkill(draft)} aria-label="Add skill">
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}

function ProfileSkeleton({ onNavigate }) {
  return (
    <div className="profile-page-shell" aria-busy="true">
      <Navbar onNavigate={onNavigate} />
      <main className="profile-main-container">
        <section className="profile-card profile-hero-card">
          <div className="pf-sk pf-sk-cover" />
          <div className="profile-header-content">
            <div className="pf-sk pf-sk-avatar" />
            <div className="pf-sk pf-sk-line w-40" />
            <div className="pf-sk pf-sk-line w-60" />
            <div className="pf-sk pf-sk-line w-30" />
          </div>
        </section>
        <section className="profile-card profile-content-section">
          <div className="pf-sk pf-sk-block" />
        </section>
        <span className="sr-only">Loading your institutional profile…</span>
      </main>
    </div>
  );
}

/* ======================================================
   Main component
   ====================================================== */
export default function Profile({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const { toasts, push, dismiss } = useToasts();

  // Image load error fallbacks
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);
  const [failedCoverUrl, setFailedCoverUrl] = useState(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSkills, setEditSkills] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Cropper
  const [cropModal, setCropModal] = useState({
    isOpen: false,
    type: "avatar",
    imageSrc: null,
    title: "",
    cropShape: "round",
    aspect: 1
  });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const avatarFileRef = useRef(null);
  const coverFileRef = useRef(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("overview");
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const touchRef = useRef(null);
  const [tabDir, setTabDir] = useState("forward");

  // Scroll helpers (back-to-top button)
  const [showTop, setShowTop] = useState(false);

  // Roster
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [attFilter, setAttFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(ROSTER_PAGE_SIZE);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Sign out
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  /* ---------- load profile ---------- */
  useEffect(() => {
    let ignore = false;
    authApi
      .getProfile()
      .then((data) => {
        if (ignore) return;
        setUser(data.user);
        setProfile(data.profile);
        setEditFullName(data.user?.fullName || "");
        setEditBio(data.user?.bio || data.profile?.bio || "");
        setEditPhone(data.user?.phone || "");
        setEditSkills(Array.isArray(data.profile?.skills) ? data.profile.skills : []);
        setLoading(false);

        if (data.user?.role && data.user.role !== "student") {
          setStudentsLoading(true);
          authApi
            .getStudents()
            .then((res) => {
              if (!ignore && res?.students) setStudents(res.students);
            })
            .catch((err) => {
              console.warn("[Profile] Failed to load student roster:", err.message);
            })
            .finally(() => {
              if (!ignore) setStudentsLoading(false);
            });
        }
      })
      .catch((err) => {
        if (ignore) return;
        setErrorMsg(err.message || "Failed to load profile. Please sign in again.");
        setLoading(false);
        if (err.status === 401) onNavigate?.("login");
      });
    return () => {
      ignore = true;
    };
  }, [onNavigate]);

  const isStaff = Boolean(user?.role && user.role !== "student");

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview & Details", short: "Overview", Icon: User },
      {
        id: "credentials",
        label: isStaff ? "Student Roster & Ledger" : "Academic Ledger",
        short: isStaff ? "Roster" : "Ledger",
        Icon: isStaff ? Users : GraduationCap
      },
      { id: "security", label: "Security & Password", short: "Security", Icon: Shield }
    ],
    [isStaff]
  );

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));

  /* ---------- sliding tab indicator ---------- */
  const measureIndicator = useCallback(() => {
    const el = tabRefs.current[activeTab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator, loading, tabs]);

  useEffect(() => {
    window.addEventListener("resize", measureIndicator);
    return () => window.removeEventListener("resize", measureIndicator);
  }, [measureIndicator]);

  /** Change tab and remember the direction so the panel can slide the right way. */
  const changeTab = useCallback(
    (id, { scroll = false } = {}) => {
      const next = tabs.findIndex((t) => t.id === id);
      if (next === -1 || id === activeTab) return;
      setTabDir(next > activeIndex ? "forward" : "back");
      setActiveTab(id);
      haptic(8);
      if (scroll && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    },
    [tabs, activeTab, activeIndex]
  );

  const handleTabKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = tabs.findIndex((t) => t.id === activeTab);
    const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    changeTab(tabs[next].id);
    tabRefs.current[tabs[next].id]?.focus();
  };

  /* ---------- swipe between tabs (touch devices) ---------- */
  const SWIPE_IGNORE = "input, textarea, select, .skills-editor, .roster-filter-row, .hero-quickstats";
  const handleTouchStart = (e) => {
    if (!isMobileViewport() || e.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    if (e.target.closest?.(SWIPE_IGNORE)) {
      touchRef.current = null;
      return;
    }
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };
  const handleTouchEnd = (e) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - start.time > 700) return;
    const nextIdx = activeIndex + (dx < 0 ? 1 : -1);
    if (nextIdx < 0 || nextIdx >= tabs.length) return;
    changeTab(tabs[nextIdx].id, { scroll: true });
  };

  /* ---------- back-to-top visibility ---------- */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowTop(window.scrollY > 520);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  /* ---------- derived: edit state ---------- */
  const originalSkills = useMemo(
    () => (Array.isArray(profile?.skills) ? profile.skills : []),
    [profile]
  );

  const hasChanges = useMemo(() => {
    if (!isEditing || !user) return false;
    const skillsChanged =
      !isStaff &&
      (editSkills.length !== originalSkills.length ||
        editSkills.some((s, i) => s !== originalSkills[i]));
    return (
      editFullName.trim() !== (user.fullName || "") ||
      editBio.trim() !== (user.bio || profile?.bio || "") ||
      editPhone.trim() !== (user.phone || "") ||
      skillsChanged
    );
  }, [isEditing, user, profile, isStaff, editFullName, editBio, editPhone, editSkills, originalSkills]);

  const phoneInvalid = editPhone.trim() !== "" && !/^[+\d][\d\s-]{6,17}$/.test(editPhone.trim());

  /* ---------- derived: completeness ---------- */
  const completeness = useMemo(() => {
    if (!user) return { percent: 0, items: [] };
    const items = [
      { id: "avatar", label: "Add a profile photo", done: Boolean(user.avatarUrl) },
      { id: "cover", label: "Add a cover banner", done: Boolean(user.coverUrl) },
      { id: "bio", label: "Write a short bio", done: Boolean(user.bio || profile?.bio) },
      { id: "phone", label: "Add a contact phone", done: Boolean(user.phone) },
      { id: "email", label: "Verify your email", done: Boolean(user.isEmailVerified) }
    ];
    if (!isStaff) {
      items.push({ id: "skills", label: "List your technical skills", done: originalSkills.length > 0 });
    }
    const done = items.filter((i) => i.done).length;
    return { percent: Math.round((done / items.length) * 100), items };
  }, [user, profile, isStaff, originalSkills]);

  /* ---------- derived: roster ---------- */
  const branchOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.branch).filter(Boolean));
    const list = set.size ? Array.from(set) : DEFAULT_BRANCHES;
    return ["ALL", ...list];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = students.filter((st) => {
      const matchesSearch =
        !q ||
        (st.fullName || "").toLowerCase().includes(q) ||
        (st.email || "").toLowerCase().includes(q) ||
        (st.enrollmentNo || "").toLowerCase().includes(q);
      const matchesBranch = branchFilter === "ALL" || st.branch === branchFilter;
      const att = st.attendancePercentage;
      const matchesAtt =
        attFilter === "all" ||
        (attFilter === "low" && typeof att === "number" && att < ATTENDANCE_LIMIT) ||
        (attFilter === "good" && typeof att === "number" && att >= ATTENDANCE_LIMIT);
      return matchesSearch && matchesBranch && matchesAtt;
    });

    const byName = (a, b) => String(a.fullName).localeCompare(String(b.fullName));
    if (sortKey === "name") list.sort(byName);
    else if (sortKey === "att-desc") list.sort((a, b) => (b.attendancePercentage ?? -1) - (a.attendancePercentage ?? -1));
    else if (sortKey === "att-asc") list.sort((a, b) => (a.attendancePercentage ?? 101) - (b.attendancePercentage ?? 101));
    else if (sortKey === "branch") list.sort((a, b) => String(a.branch).localeCompare(String(b.branch)) || byName(a, b));
    return list;
  }, [students, debouncedSearch, branchFilter, attFilter, sortKey]);

  const rosterStats = useMemo(() => {
    const withAtt = students.filter((s) => typeof s.attendancePercentage === "number");
    const avg = withAtt.length
      ? withAtt.reduce((sum, s) => sum + s.attendancePercentage, 0) / withAtt.length
      : null;
    const low = withAtt.filter((s) => s.attendancePercentage < ATTENDANCE_LIMIT).length;
    const branchCount = {};
    students.forEach((s) => {
      if (s.branch) branchCount[s.branch] = (branchCount[s.branch] || 0) + 1;
    });
    const branches = Object.entries(branchCount).sort((a, b) => b[1] - a[1]);
    return { total: students.length, avg, low, branches };
  }, [students]);

  useEffect(() => {
    setVisibleCount(ROSTER_PAGE_SIZE);
  }, [debouncedSearch, branchFilter, attFilter, sortKey]);

  useLockBodyScroll(Boolean(selectedStudent));

  useEffect(() => {
    if (!selectedStudent) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedStudent(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedStudent]);

  /* ---------- handlers ---------- */
  const startEditing = () => {
    setEditFullName(user?.fullName || "");
    setEditBio(user?.bio || profile?.bio || "");
    setEditPhone(user?.phone || "");
    setEditSkills(originalSkills);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFullName(user?.fullName || "");
    setEditBio(user?.bio || profile?.bio || "");
    setEditPhone(user?.phone || "");
    setEditSkills(originalSkills);
  };

  const validateImage = (file, maxMb, msg) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("Please upload a valid JPG, PNG, or WebP image.");
      return false;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setErrorMsg(msg);
      return false;
    }
    return true;
  };

  const openCropper = (file, cfg) => {
    const reader = new FileReader();
    reader.onload = () => setCropModal({ isOpen: true, imageSrc: reader.result, ...cfg });
    reader.readAsDataURL(file);
  };

  const handleAvatarFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (validateImage(file, 5, "Image file size must be less than 5MB.")) {
      setErrorMsg("");
      openCropper(file, { type: "avatar", title: "Crop Profile Avatar", cropShape: "round", aspect: 1 });
    }
    e.target.value = "";
  };

  const handleCoverFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (validateImage(file, 8, "Cover banner image must be less than 8MB.")) {
      setErrorMsg("");
      openCropper(file, { type: "cover", title: "Adjust Cover Banner", cropShape: "rect", aspect: 3 });
    }
    e.target.value = "";
  };

  const handleSaveCroppedImage = async (croppedBlob) => {
    setErrorMsg("");
    const isAvatar = cropModal.type === "avatar";
    const setBusy = isAvatar ? setAvatarLoading : setCoverLoading;
    setBusy(true);
    try {
      const file = new File([croppedBlob], `${cropModal.type}_${Date.now()}.jpg`, { type: "image/jpeg" });
      if (isAvatar) {
        const res = await authApi.uploadAvatar(file);
        setUser((prev) => ({ ...prev, avatarUrl: res.avatarUrl }));
        push("success", "Profile photo updated.");
      } else {
        const res = await authApi.uploadCover(file);
        setUser((prev) => ({ ...prev, coverUrl: res.coverUrl }));
        push("success", "Cover banner updated.");
      }
      setCropModal((prev) => ({ ...prev, isOpen: false, imageSrc: null }));
    } catch (err) {
      setErrorMsg(err.message || `Failed to upload ${isAvatar ? "avatar photo" : "cover banner"}.`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (phoneInvalid) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    setSavingProfile(true);
    setErrorMsg("");
    try {
      const res = await authApi.updateProfile({
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim(),
        skills: editSkills
      });
      setUser(res.user);
      setProfile(res.profile);
      setIsEditing(false);
      push("success", "Profile details updated.");
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Ctrl/Cmd + S saves while editing
  const saveRef = useRef(handleSaveProfile);
  saveRef.current = handleSaveProfile;
  useEffect(() => {
    if (!isEditing) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (hasChanges && !savingProfile) saveRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isEditing, hasChanges, savingProfile]);

  const handleChangePassword = async (e) => {
    e?.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwdError("New password must be different from your current password.");
      return;
    }

    setPwdLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPwdSuccess("Password updated successfully!");
      push("success", "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdSuccess(""), 4000);
    } catch (err) {
      setPwdError(err.message || "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authApi.logout();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
      onNavigate?.("home");
    }
  };

  const onCopied = (label) => {
    if (label) push("success", `${label} copied.`);
    else push("error", "Copy is not supported in this browser.");
  };

  const exportRosterCsv = () => {
    if (!filteredStudents.length) {
      push("info", "No students to export.");
      return;
    }
    const header = ["Name", "Email", "Enrollment No", "Branch", "Academic Year", "Semester", "Attendance %", "Phone"];
    const rows = filteredStudents.map((s) => [
      s.fullName, s.email, s.enrollmentNo, s.branch, s.academicYear, s.semester,
      s.attendancePercentage ?? "", s.phone
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    downloadTextFile("student_roster.csv", csv);
    push("success", `Exported ${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"}.`);
  };

  const handleHeroMove = (e) => {
    if (prefersReducedMotion()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.setProperty("--mx", `${(x * 18).toFixed(1)}px`);
    e.currentTarget.style.setProperty("--my", `${(y * 10).toFixed(1)}px`);
  };

  const handleHeroLeave = (e) => {
    e.currentTarget.style.setProperty("--mx", "0px");
    e.currentTarget.style.setProperty("--my", "0px");
  };

  const clearRosterFilters = () => {
    setSearchTerm("");
    setBranchFilter("ALL");
    setAttFilter("all");
  };

  /* ---------- early return (after all hooks) ---------- */
  if (loading) return <ProfileSkeleton onNavigate={onNavigate} />;

  const userInitials = getInitials(user?.fullName, "SP");
  const strengthChecks = passwordChecks(newPassword);
  const strengthScore = strengthChecks.filter((c) => c.ok).length;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const rosterFiltersActive = searchTerm || branchFilter !== "ALL" || attFilter !== "all";
  const attendanceValue = typeof profile?.attendancePercentage === "number" ? profile.attendancePercentage : null;
  const registered = formatDate(user?.createdAt);

  const quickStats = isStaff
    ? [
        { id: "students", icon: Users, label: "Students", node: <AnimatedNumber value={rosterStats.total} /> },
        { id: "avg", icon: TrendingUp, label: "Avg. attendance", node: <AnimatedNumber value={rosterStats.avg} decimals={1} suffix="%" delay={80} /> },
        { id: "low", icon: AlertTriangle, label: `Below ${ATTENDANCE_LIMIT}%`, node: <AnimatedNumber value={rosterStats.low} delay={160} /> }
      ]
    : [
        { id: "branch", icon: Building2, label: "Branch", node: <>{profile?.branch || "—"}</> },
        { id: "sem", icon: Layers, label: "Semester", node: <>{profile?.semester || "Sem 1"}</> },
        {
          id: "att",
          icon: CheckCircle2,
          label: "Attendance",
          node: attendanceValue === null ? <>—</> : <AnimatedNumber value={attendanceValue} suffix="%" delay={160} />
        }
      ];

  /* ---------- render ---------- */
  return (
    <div className="profile-page-shell">
      <Navbar onNavigate={onNavigate} />

      <main
        className="profile-main-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {errorMsg && (
          <div className="profile-banner-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")} className="alert-close-btn" aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}

        {/* ================= HERO CARD ================= */}
        <section
          className="profile-card profile-hero-card"
          onMouseMove={handleHeroMove}
          onMouseLeave={handleHeroLeave}
        >
          <div className="profile-cover-banner">
            <div className="cover-media">
              {user?.coverUrl && failedCoverUrl !== user.coverUrl ? (
                <img
                  src={user.coverUrl}
                  alt="Profile Cover Banner"
                  className="cover-banner-img"
                  onError={() => setFailedCoverUrl(user.coverUrl)}
                />
              ) : (
                <img
                  src="/subharti-polytechnic-main-building.jpg"
                  alt="Subharti Polytechnic College Main Academic Campus"
                  className="cover-banner-img default-cover-img"
                />
              )}
            </div>
            <div className="cover-ambient-glow" />
            <div className="cover-scrim-overlay" />
            <div className="cover-shine" aria-hidden="true" />

            <button
              type="button"
              className="cover-change-btn"
              onClick={() => coverFileRef.current?.click()}
              title="Change Cover Banner"
              aria-label="Upload new cover photo"
            >
              <Camera size={14} />
              <span>{user?.coverUrl ? "Edit Cover" : "Add Cover"}</span>
            </button>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden-file-input"
              onChange={handleCoverFileSelected}
            />

            {coverLoading && (
              <div className="cover-upload-overlay">
                <Loader2 size={24} className="spinner" />
                <span>Uploading cover…</span>
              </div>
            )}

            <div className="cover-brand-tag">
              <Sparkles size={13} />
              <span>Subharti Polytechnic Digital Identity</span>
            </div>
          </div>

          <div className="profile-header-content">
            <div className="avatar-wrapper">
              <div className="avatar-frame">
                {user?.avatarUrl && failedAvatarUrl !== user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="avatar-img"
                    onError={() => setFailedAvatarUrl(user.avatarUrl)}
                  />
                ) : (
                  <div className="avatar-initials">{userInitials}</div>
                )}
                {avatarLoading && (
                  <div className="avatar-upload-overlay">
                    <Loader2 size={24} className="spinner" />
                  </div>
                )}
              </div>
              <span className="avatar-halo" aria-hidden="true" />
              <button
                type="button"
                className="avatar-change-btn"
                onClick={() => avatarFileRef.current?.click()}
                title="Change Profile Photo"
                aria-label="Upload new profile picture"
              >
                <Camera size={15} />
              </button>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden-file-input"
                onChange={handleAvatarFileSelected}
              />
            </div>

            <div className="profile-header-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="profile-action-btn primary"
                  onClick={() => {
                    changeTab("overview");
                    startEditing();
                  }}
                >
                  <Edit2 size={15} /> Edit Profile
                </button>
              ) : (
                <button type="button" className="profile-action-btn secondary" onClick={cancelEditing}>
                  <X size={15} /> Cancel
                </button>
              )}
              <button type="button" className="profile-action-btn signout" onClick={() => setSignOutOpen(true)}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>

            <div className="profile-identity-info">
              <div className="identity-title-row">
                <h1 className="profile-name">{user?.fullName}</h1>
                <span className={`status-badge-chip ${user?.status}`}>
                  {user?.status === "verified" || user?.status === "active" ? (
                    <><CheckCircle2 size={13} /> Verified</>
                  ) : (
                    <>
                      <Clock size={13} />{" "}
                      {user?.status === "pending_approval" ? "Pending Dean Authorization" : "Ledger Verification"}
                    </>
                  )}
                </span>
              </div>

              <p className="profile-headline">
                {ROLE_LABELS[user?.role] || user?.role} •{" "}
                {profile?.branch ? `${profile.branch} Engineering` : profile?.department || "Subharti Polytechnic"}
              </p>

              <div className="profile-metadata-row">
                <div className="meta-pill">
                  <Mail size={13} />
                  <span>{user?.email}</span>
                  {user?.email && <CopyButton text={user.email} label="Email" onCopied={onCopied} />}
                  {user?.isEmailVerified && (
                    <span className="email-verified-tag" title="Institutional Email Verified">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                {user?.phone && (
                  <div className="meta-pill">
                    <Phone size={13} />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="meta-pill">
                  <Building2 size={13} />
                  <span>Swami Vivekanand Subharti University</span>
                </div>
              </div>

              {user?.bio && !isEditing && <p className="profile-bio-text">{user.bio}</p>}
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="hero-quickstats">
            {quickStats.map((q, i) => {
              const Icon = q.icon;
              return (
                <div key={q.id} className="qs-tile" style={{ "--i": i }}>
                  <span className={`qs-icon qs-${q.id}`}><Icon size={15} /></span>
                  <div>
                    <strong>{q.node}</strong>
                    <span>{q.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="profile-tabs-bar" role="tablist" aria-label="Profile sections" onKeyDown={handleTabKey}>
            {tabs.map((t) => {
              const Icon = t.Icon;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  tabIndex={activeTab === t.id ? 0 : -1}
                  className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => changeTab(t.id)}
                >
                  <Icon size={15} className="tab-ico" />
                  {t.label}
                </button>
              );
            })}
            <span
              className="tab-indicator"
              aria-hidden="true"
              style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
            />
          </div>
        </section>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className={`tab-panel dir-${tabDir}`} key="overview">
            <Reveal>
              <section className="profile-card profile-content-section">
                {isEditing ? (
                  <form className="edit-profile-form" onSubmit={handleSaveProfile}>
                    <div className="form-section-header">
                      <h3>Edit Profile Details</h3>
                      <p>Update your display name, bio, and contact details. Press Ctrl/⌘ + S to save quickly.</p>
                    </div>

                    <div className="form-grid-fields">
                      <div className="profile-field-group">
                        <label htmlFor="edit-name">Full Name</label>
                        <input
                          id="edit-name"
                          type="text"
                          className="profile-input"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="profile-field-group">
                        <label htmlFor="edit-phone">Contact Phone</label>
                        <input
                          id="edit-phone"
                          type="tel"
                          inputMode="tel"
                          className={`profile-input ${phoneInvalid ? "invalid" : ""}`}
                          placeholder="+91 98765 43210"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          aria-invalid={phoneInvalid}
                        />
                        {phoneInvalid && <span className="field-error">Enter a valid phone number.</span>}
                      </div>

                      <div className="profile-field-group full-width">
                        <div className="label-row">
                          <label htmlFor="edit-bio">Bio & Professional Summary</label>
                          <span className={`char-counter ${editBio.length > MAX_BIO * 0.9 ? "near" : ""}`}>
                            {editBio.length}/{MAX_BIO}
                          </span>
                        </div>
                        <textarea
                          id="edit-bio"
                          className="profile-textarea"
                          rows={3}
                          maxLength={MAX_BIO}
                          placeholder="Share a short introduction about your academic focus or engineering interests..."
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                        />
                      </div>

                      {!isStaff && (
                        <div className="profile-field-group full-width">
                          <div className="label-row">
                            <label htmlFor="edit-skills">Technical Skills</label>
                            <span className="char-counter">{editSkills.length}/{MAX_SKILLS}</span>
                          </div>
                          <SkillsEditor skills={editSkills} onChange={setEditSkills} />
                          <span className="field-hint">Press Enter or comma to add. Backspace removes the last one.</span>
                        </div>
                      )}
                    </div>

                    <div className="form-submit-row">
                      <button
                        type="submit"
                        className="profile-action-btn primary"
                        disabled={savingProfile || !hasChanges || phoneInvalid}
                      >
                        {savingProfile ? (
                          <><Loader2 size={16} className="spinner" /> Saving...</>
                        ) : (
                          <><Save size={16} /> Save Changes</>
                        )}
                      </button>
                      <button type="button" className="profile-action-btn secondary" onClick={cancelEditing}>
                        Cancel
                      </button>
                      {hasChanges && <span className="unsaved-pill"><i /> Unsaved changes</span>}
                    </div>
                  </form>
                ) : (
                  <div className="overview-display-grid">
                    <div className="info-block">
                      <span className="block-label">Account Role</span>
                      <div className="block-val-pill">
                        {user?.role === "student" ? <GraduationCap size={16} /> : <BookOpen size={16} />}
                        <strong>{ROLE_LABELS[user?.role] || user?.role}</strong>
                      </div>
                    </div>

                    <div className="info-block">
                      <span className="block-label">Institutional Status</span>
                      <strong className="block-value capitalize">{user?.status?.replace("_", " ")}</strong>
                    </div>

                    <div className="info-block">
                      <span className="block-label">Email Verification</span>
                      <div className={`status-indicator-tag ${user?.isEmailVerified ? "verified" : "pending"}`}>
                        {user?.isEmailVerified ? (
                          <><CheckCircle2 size={14} /> Verified via OTP</>
                        ) : (
                          <><Clock size={14} /> Not verified yet</>
                        )}
                      </div>
                    </div>

                    <div className="info-block">
                      <span className="block-label">Registration Date</span>
                      <strong className="block-value">{registered || "Active"}</strong>
                      {memberSince(user?.createdAt) && (
                        <span className="block-sub">{memberSince(user?.createdAt)}</span>
                      )}
                    </div>

                    {!isStaff && originalSkills.length > 0 && (
                      <div className="info-block full-width">
                        <span className="block-label">Engineering & Technical Skills</span>
                        <div className="skills-tags-cluster">
                          {originalSkills.map((skill, idx) => (
                            <span key={skill + idx} className="skill-chip" style={{ "--i": idx }}>
                              <Tag size={12} /> {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </Reveal>

            {!isEditing && (
              <Reveal delay={80}>
                <section className="profile-card profile-content-section completeness-card">
                  <CompletenessRing percent={completeness.percent} />
                  <div className="completeness-body">
                    <h3>
                      {completeness.percent === 100 ? "Your profile is complete" : "Strengthen your profile"}
                    </h3>
                    <p>
                      {completeness.percent === 100
                        ? "Everything is filled in. Faculty and classmates can see a full picture of you."
                        : "A complete profile helps faculty recognise you. Finish these steps:"}
                    </p>
                    <ul className="completeness-list">
                      {completeness.items.map((item, i) => (
                        <li key={item.id} className={item.done ? "done" : ""} style={{ "--i": i }}>
                          <span className="cl-icon">{item.done ? <Check size={12} /> : null}</span>
                          {item.done ? item.label.replace(/^Add a |^Write a |^List your |^Verify your /, "") : item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </Reveal>
            )}
          </div>
        )}

        {/* ================= TAB 2: CREDENTIALS / ROSTER ================= */}
        {activeTab === "credentials" && (
          <div className={`tab-panel dir-${tabDir}`} key="credentials">
            <section className="profile-card profile-content-section">
              {!isStaff ? (
                <>
                  <div className="form-section-header">
                    <h3>Academic Program Credentials</h3>
                    <p>Official records provisioned in the Subharti Academic Ledger.</p>
                  </div>

                  <div className="credentials-cards-grid">
                    {[
                      { icon: Building2, title: "Engineering Branch", value: profile?.branch ? `${profile.branch} Engineering` : "Not assigned" },
                      { icon: Award, title: "Academic Year", value: profile?.academicYear || "1st Year" },
                      { icon: Layers, title: "Current Semester", value: profile?.semester || "Semester 1" },
                      { icon: ShieldCheck, title: "Enrollment Number", value: profile?.enrollmentNo || "Pending ID Card Issue", mono: true }
                    ].map((c, i) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.title} className="cred-card" style={{ "--i": i }}>
                          <span className="cred-icon-box"><Icon size={20} /></span>
                          <div>
                            <span className="cred-title">{c.title}</span>
                            <strong className={c.mono ? "mono" : ""}>{c.value}</strong>
                          </div>
                          {c.mono && profile?.enrollmentNo && (
                            <CopyButton text={profile.enrollmentNo} label="Enrollment number" onCopied={onCopied} />
                          )}
                        </div>
                      );
                    })}

                    <div className="cred-card attendance-card" style={{ "--i": 4 }}>
                      <span className="cred-icon-box attendance"><CheckCircle2 size={20} /></span>
                      <div className="attendance-body">
                        <span className="cred-title">Ledger Attendance</span>
                        <strong>
                          {attendanceValue === null ? "Not recorded yet" : (
                            <><AnimatedNumber value={attendanceValue} suffix="%" /> Recorded</>
                          )}
                        </strong>
                        {attendanceValue !== null && (
                          <div className="att-meter" aria-hidden="true">
                            <div
                              className={`att-meter-fill ${attendanceValue >= ATTENDANCE_LIMIT ? "good" : "warning"}`}
                              style={{ "--w": `${Math.min(100, attendanceValue)}%` }}
                            />
                            <i className="att-meter-limit" style={{ left: `${ATTENDANCE_LIMIT}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="staff-roster-container">
                  <div className="form-section-header">
                    <div className="staff-header-row">
                      <div>
                        <h3>Polytechnic Student Directory & Academic Ledger</h3>
                        <p>View enrolled candidates, avatars, attendance records, and branch distribution.</p>
                      </div>
                      <div className="roster-header-tools">
                        <div className="roster-count-badge">
                          <Users size={16} />
                          <span>{filteredStudents.length} Students</span>
                        </div>
                        <button type="button" className="tool-btn" onClick={exportRosterCsv}>
                          <Download size={14} /> Export CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats summary */}
                  {!studentsLoading && rosterStats.total > 0 && (
                    <div className="roster-stats">
                      <div className="stat-tile" style={{ "--i": 0 }}>
                        <span className="stat-icon"><Users size={16} /></span>
                        <div>
                          <strong><AnimatedNumber value={rosterStats.total} /></strong>
                          <span>Enrolled</span>
                        </div>
                      </div>
                      <div className="stat-tile" style={{ "--i": 1 }}>
                        <span className="stat-icon green"><TrendingUp size={16} /></span>
                        <div>
                          <strong><AnimatedNumber value={rosterStats.avg} decimals={1} suffix="%" delay={100} /></strong>
                          <span>Avg. attendance</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{ "--i": 2 }}
                        className={`stat-tile clickable ${attFilter === "low" ? "selected" : ""}`}
                        onClick={() => setAttFilter(attFilter === "low" ? "all" : "low")}
                        title="Toggle low-attendance filter"
                      >
                        <span className="stat-icon amber"><AlertTriangle size={16} /></span>
                        <div>
                          <strong><AnimatedNumber value={rosterStats.low} delay={200} /></strong>
                          <span>Below {ATTENDANCE_LIMIT}%</span>
                        </div>
                      </button>
                      <div className="stat-tile branches-tile" style={{ "--i": 3 }}>
                        {rosterStats.branches.slice(0, 4).map(([name, count], i) => (
                          <div key={name} className="branch-bar-row" style={{ "--i": i }}>
                            <span>{name}</span>
                            <div className="branch-bar-track">
                              <div className="branch-bar-fill" style={{ "--w": `${(count / rosterStats.total) * 100}%` }} />
                            </div>
                            <em>{count}</em>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Toolbar */}
                  <div className="roster-toolbar">
                    <div className="roster-search-box">
                      <Search size={16} className="search-icon" />
                      <input
                        type="search"
                        enterKeyHint="search"
                        placeholder="Search by name, email, or enrollment no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="roster-search-input"
                        aria-label="Search students"
                      />
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm("")} className="search-clear-btn" aria-label="Clear search">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="roster-toolbar-right">
                      <label className="sort-select">
                        <ArrowUpDown size={13} />
                        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort students">
                          <option value="name">Name A–Z</option>
                          <option value="att-desc">Attendance: high to low</option>
                          <option value="att-asc">Attendance: low to high</option>
                          <option value="branch">Branch</option>
                        </select>
                      </label>
                      <div className="view-toggle" role="group" aria-label="Layout">
                        <button
                          type="button"
                          className={viewMode === "grid" ? "active" : ""}
                          onClick={() => setViewMode("grid")}
                          aria-label="Grid view"
                          aria-pressed={viewMode === "grid"}
                        >
                          <LayoutGrid size={15} />
                        </button>
                        <button
                          type="button"
                          className={viewMode === "list" ? "active" : ""}
                          onClick={() => setViewMode("list")}
                          aria-label="List view"
                          aria-pressed={viewMode === "list"}
                        >
                          <ListIcon size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="roster-filter-row">
                    <div className="roster-branch-filter">
                      {branchOptions.map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`filter-pill ${branchFilter === b ? "active" : ""}`}
                          onClick={() => setBranchFilter(b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <div className="roster-branch-filter">
                      {[
                        { id: "all", label: "Any attendance" },
                        { id: "good", label: `≥ ${ATTENDANCE_LIMIT}%` },
                        { id: "low", label: `< ${ATTENDANCE_LIMIT}%` }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`filter-pill alt ${attFilter === f.id ? "active" : ""}`}
                          onClick={() => setAttFilter(f.id)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  {studentsLoading ? (
                    <div className="roster-grid">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="pf-sk pf-sk-roster" style={{ "--i": i }} />
                      ))}
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="roster-empty-state">
                      <Users size={40} className="empty-icon" />
                      <h4>No student records match your filter</h4>
                      <p>Try clearing your search query or selecting "ALL" branches.</p>
                      {rosterFiltersActive && (
                        <button type="button" className="profile-action-btn secondary" onClick={clearRosterFilters}>
                          Clear all filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className={`roster-grid ${viewMode === "list" ? "as-list" : ""}`}>
                        {filteredStudents.slice(0, visibleCount).map((st, i) => {
                          const att = st.attendancePercentage;
                          const good = typeof att === "number" && att >= ATTENDANCE_LIMIT;
                          return (
                            <div
                              key={st.id}
                              className="student-roster-card"
                              style={{ "--i": i % ROSTER_PAGE_SIZE }}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                haptic(6);
                                setSelectedStudent(st);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedStudent(st);
                                }
                              }}
                              title="Click to view full student profile"
                            >
                              <div className="roster-card-top">
                                <StudentRosterAvatar student={st} />
                                <div className="roster-card-info">
                                  <h4 className="roster-student-name">{highlight(st.fullName, debouncedSearch)}</h4>
                                  <span className="roster-student-branch">
                                    {st.branch} Engineering • {st.academicYear}
                                  </span>
                                  <span className="roster-enrollment-badge">
                                    {highlight(st.enrollmentNo || "Pending ID", debouncedSearch)}
                                  </span>
                                </div>
                              </div>

                              <div className="roster-card-metrics">
                                <div className="metric-pill">
                                  <Percent size={13} />
                                  <span>{typeof att === "number" ? `${att}% Attendance` : "No attendance"}</span>
                                </div>
                                <span className={`attendance-indicator-dot ${good ? "good" : "warning"}`} />
                              </div>

                              {st.skills && st.skills.length > 0 && (
                                <div className="roster-card-skills">
                                  {st.skills.slice(0, 3).map((sk, idx) => (
                                    <span key={idx} className="roster-skill-tag">{sk}</span>
                                  ))}
                                  {st.skills.length > 3 && (
                                    <span className="roster-skill-more">+{st.skills.length - 3}</span>
                                  )}
                                </div>
                              )}

                              <div className="roster-card-footer">
                                <span className="view-detail-link"><Eye size={13} /> View Details</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {filteredStudents.length > visibleCount && (
                        <button
                          type="button"
                          className="load-more-btn"
                          onClick={() => setVisibleCount((v) => v + ROSTER_PAGE_SIZE)}
                        >
                          Show {Math.min(ROSTER_PAGE_SIZE, filteredStudents.length - visibleCount)} more
                          <span>{filteredStudents.length - visibleCount} remaining</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= TAB 3: SECURITY ================= */}
        {activeTab === "security" && (
          <div className={`tab-panel dir-${tabDir}`} key="security">
            <section className="profile-card profile-content-section">
              <div className="form-section-header">
                <h3>Security & Password Management</h3>
                <p>Keep your account secure by using a strong password with letters and numbers.</p>
              </div>

              {pwdError && (
                <div className="profile-banner-alert error" role="alert">
                  <AlertCircle size={18} />
                  <span>{pwdError}</span>
                </div>
              )}
              {pwdSuccess && (
                <div className="profile-banner-alert success" role="alert">
                  <CheckCircle2 size={18} />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <form className="password-change-form" onSubmit={handleChangePassword}>
                <PasswordField
                  id="current-pwd"
                  label="Current Password"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                />

                <PasswordField
                  id="new-pwd"
                  label="New Password"
                  placeholder="At least 8 characters with numbers"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={setNewPassword}
                >
                  {newPassword && (
                    <div className="strength-block">
                      <div className={`strength-meter level-${strengthScore}`} aria-hidden="true">
                        {[0, 1, 2, 3].map((n) => (
                          <i key={n} className={n < strengthScore ? "on" : ""} />
                        ))}
                      </div>
                      <span className={`strength-label level-${strengthScore}`}>{STRENGTH_LABELS[strengthScore]}</span>
                    </div>
                  )}
                  <ul className="pwd-rules">
                    {strengthChecks.map((c) => (
                      <li key={c.id} className={c.ok ? "ok" : ""}>
                        <span>{c.ok ? <Check size={11} /> : null}</span>
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </PasswordField>

                <PasswordField
                  id="confirm-new-pwd"
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                >
                  {confirmPassword && (
                    <span className={`match-indicator ${passwordsMatch ? "ok" : "bad"}`}>
                      {passwordsMatch ? <><CheckCircle2 size={13} /> Passwords match</> : <><AlertCircle size={13} /> Passwords don't match yet</>}
                    </span>
                  )}
                </PasswordField>

                <div className="form-submit-row">
                  <button type="submit" className="profile-action-btn primary" disabled={pwdLoading}>
                    {pwdLoading ? (
                      <><Loader2 size={16} className="spinner" /> Updating...</>
                    ) : (
                      <><Key size={16} /> Update Password</>
                    )}
                  </button>
                  <button type="button" className="profile-action-btn secondary" onClick={() => onNavigate?.("forgot-password")}>
                    Forgot your password?
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      {/* ================= MOBILE APP-STYLE BOTTOM NAV ================= */}
      <nav
        className="pf-bottom-nav"
        aria-label="Profile sections"
        style={{ "--tabs": tabs.length, "--idx": activeIndex }}
      >
        <span className="pbn-pill" aria-hidden="true" />
        {tabs.map((t) => {
          const Icon = t.Icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`pbn-btn ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => changeTab(t.id, { scroll: true })}
            >
              <Icon size={20} />
              <span>{t.short}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className={`pf-top-fab ${showTop ? "show" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={18} />
      </button>

      {/* ================= STUDENT DETAIL MODAL ================= */}
      {selectedStudent && (
        <div className="student-detail-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
          <div className="student-detail-backdrop" onClick={() => setSelectedStudent(null)} />
          <div className="student-detail-container">
            <span className="sheet-grabber" aria-hidden="true" />
            <div className="student-detail-header">
              <div className="detail-header-left">
                <StudentRosterAvatar student={selectedStudent} size="lg" />
                <div>
                  <h3 id="student-modal-title" className="detail-modal-name">{selectedStudent.fullName}</h3>
                  <span className="detail-modal-subtitle">
                    {selectedStudent.branch} Engineering • {selectedStudent.academicYear} ({selectedStudent.semester})
                  </span>
                </div>
              </div>
              <button type="button" className="detail-modal-close" onClick={() => setSelectedStudent(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div className="student-detail-body">
              {typeof selectedStudent.attendancePercentage === "number" && (
                <div className="detail-att-block">
                  <div className="detail-att-top">
                    <span className="detail-label">Attendance Record</span>
                    <strong className={selectedStudent.attendancePercentage >= ATTENDANCE_LIMIT ? "good" : "warning"}>
                      <AnimatedNumber value={selectedStudent.attendancePercentage} suffix="%" />
                    </strong>
                  </div>
                  <div className="att-meter large" aria-hidden="true">
                    <div
                      className={`att-meter-fill ${selectedStudent.attendancePercentage >= ATTENDANCE_LIMIT ? "good" : "warning"}`}
                      style={{ "--w": `${Math.min(100, selectedStudent.attendancePercentage)}%` }}
                    />
                    <i className="att-meter-limit" style={{ left: `${ATTENDANCE_LIMIT}%` }} />
                  </div>
                  <span className="field-hint">
                    {selectedStudent.attendancePercentage >= ATTENDANCE_LIMIT
                      ? `Meets the ${ATTENDANCE_LIMIT}% requirement.`
                      : `Below the ${ATTENDANCE_LIMIT}% requirement, so this student needs follow-up.`}
                  </span>
                </div>
              )}

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Enrollment Number</span>
                  <div className="detail-val-row">
                    <strong className="detail-val mono">{selectedStudent.enrollmentNo || "Pending ID"}</strong>
                    {selectedStudent.enrollmentNo && (
                      <CopyButton text={selectedStudent.enrollmentNo} label="Enrollment number" onCopied={onCopied} />
                    )}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Phone</span>
                  <strong className="detail-val">{selectedStudent.phone || "Not provided"}</strong>
                </div>
                <div className="detail-item full">
                  <span className="detail-label">Institutional Email</span>
                  <div className="detail-val-row">
                    <a className="detail-val-email" href={`mailto:${selectedStudent.email}`}>{selectedStudent.email}</a>
                    <CopyButton text={selectedStudent.email} label="Email" onCopied={onCopied} />
                  </div>
                </div>
              </div>

              {selectedStudent.bio && (
                <div className="detail-bio-box">
                  <span className="detail-label">Student Statement / Bio</span>
                  <p>{selectedStudent.bio}</p>
                </div>
              )}

              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div className="detail-skills-box">
                  <span className="detail-label">Technical Skills</span>
                  <div className="skills-tags-cluster">
                    {selectedStudent.skills.map((sk, idx) => (
                      <span key={idx} className="skill-chip"><Tag size={12} /> {sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="student-detail-footer">
              <a className="profile-action-btn primary" href={`mailto:${selectedStudent.email}`}>
                <Mail size={15} /> Send Email
              </a>
              <button type="button" className="profile-action-btn secondary" onClick={() => setSelectedStudent(null)}>
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={signOutOpen}
        title="Sign out of CollegeOS?"
        message="You will need to log in again to access your profile, ledger and roster."
        confirmLabel="Sign out"
        busy={signingOut}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={handleSignOut}
      />

      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        title={cropModal.title}
        cropShape={cropModal.cropShape}
        aspect={cropModal.aspect}
        onCancel={() => setCropModal((prev) => ({ ...prev, isOpen: false, imageSrc: null }))}
        onSave={handleSaveCroppedImage}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}