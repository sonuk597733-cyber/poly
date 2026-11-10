import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import {
  TriangleAlert, RefreshCw, Sparkles, ShieldCheck, CircleCheck, Plus, Pen, Camera, Share2,
  Contact, X, Trash2, Search, MapPin, Mail, Phone, Copy,
  Globe, MessageCircle, CodeXml, GraduationCap, Trophy, Award, Briefcase,
  FolderGit2, Layers, User, Link2, ExternalLink, Printer, RotateCw, Target, TrendingUp,
  CalendarCheck, BookOpen, Clock, Star, ChevronRight, Save,
  FileText, UploadCloud
} from "lucide-react";
import { authApi } from "../../services/authApi";

import "./StudentTheme.css";
import "./StudentProfile.css";

/* ==========================================================================
   Local icons
   lucide-react v1 no longer ships brand logos, so brand icons (and a few
   small UI icons) are inline SVGs in the same 24px stroke style.
   No extra dependency is needed.
   ========================================================================== */
const makeIcon = (name, children) => {
  const Icon = ({ size = 24, strokeWidth = 2, className, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" {...rest}>{children}</svg>
  );
  Icon.displayName = name;
  return Icon;
};
const Github = makeIcon("Github", <>
  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
  <path d="M9 18c-4.51 2-5-2-7-2" />
</>);
const Linkedin = makeIcon("Linkedin", <>
  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
  <rect width="4" height="12" x="2" y="9" />
  <circle cx="4" cy="4" r="2" />
</>);
const Youtube = makeIcon("Youtube", <>
  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
  <path d="m10 15 5-3-5-3z" />
</>);
const Twitter = makeIcon("Twitter", <>
  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
</>);
const Instagram = makeIcon("Instagram", <>
  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
</>);
const Download = makeIcon("Download", <>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <path d="m7 10 5 5 5-5" />
  <path d="M12 15V3" />
</>);
const Ellipsis = makeIcon("Ellipsis", <>
  <circle cx="12" cy="12" r="1" />
  <circle cx="19" cy="12" r="1" />
  <circle cx="5" cy="12" r="1" />
</>);
const ChevronDown = makeIcon("ChevronDown", <path d="m6 9 6 6 6-6" />);

/* ==========================================================================
   Constants (exports kept so other files importing them keep working)
   ========================================================================== */
export const BRANCH_CHOICES = [
  { value: "CSE", label: "Computer Science & Engineering (CSE)" },
  { value: "Mechanical", label: "Mechanical Engineering" },
  { value: "Electrical", label: "Electrical Engineering" },
  { value: "Civil", label: "Civil Engineering" },
  { value: "ECE", label: "Electronics & Communication (ECE)" }
];

export const SEMESTER_CHOICES = [
  "Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6"
];

export const ACADEMIC_YEAR_CHOICES = ["1st Year", "2nd Year", "3rd Year"];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Merge user and roleProfile from backend into a consolidated structure.
 * Never overrides user values with hardcoded static strings.
 */
export function mergeProfileData(user, roleProfile, rawActivities = []) {
  if (!user && !roleProfile) return null;
  const u = user || {};
  const p = roleProfile || {};

  const resolvedBranch = p.branch || u.branch || u.department || "CSE";
  const resolvedEnrollment = p.enrollmentNo || u.enrollmentNo || p.rollNo || u.rollNo || "";
  const resolvedLocation = p.location || u.location || [p.city, p.state].filter(Boolean).join(", ") || "";
  const resolvedTagline = p.tagline || u.tagline || "";
  const resolvedSgpa = p.sgpa !== undefined ? p.sgpa : (p.cgpa !== undefined ? p.cgpa : 8.5);
  const resolvedAttendance = p.attendancePercentage !== undefined ? p.attendancePercentage : 85;

  // Real institutional activity synchronization from MongoDB AuditLogs
  const actSource = Array.isArray(rawActivities) && rawActivities.length
    ? rawActivities
    : (Array.isArray(p.activities) && p.activities.length
        ? p.activities
        : (Array.isArray(u.activities) && u.activities.length ? u.activities : []));

  const formattedActivities = actSource.map((a) => {
    if (a.title && a.subtitle) return a;
    const d = a.createdAt ? new Date(a.createdAt) : new Date();
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    switch (a.action) {
      case "DOCUMENT_UPLOAD":
        return {
          title: "Official Document Uploaded",
          subtitle: a.details?.name || a.details?.fileName || "Institutional record archived",
          time: dateStr
        };
      case "DOCUMENT_DELETE":
        return {
          title: "Document Removed",
          subtitle: a.details?.name || "Removed from repository",
          time: dateStr
        };
      case "PROFILE_UPDATE":
        return {
          title: "Profile Records Updated",
          subtitle: "Personal & academic information synced with MongoDB",
          time: dateStr
        };
      case "LOGIN":
      case "LOGIN_SUCCESS":
        return {
          title: "Campus Portal Login",
          subtitle: `Authorized session from ${a.ipAddress || "Campus Network"}`,
          time: dateStr
        };
      case "PASSWORD_CHANGE":
        return {
          title: "Account Security Updated",
          subtitle: "Password credentials re-hashed with Bcrypt",
          time: dateStr
        };
      default:
        return {
          title: a.action ? a.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Institutional Milestone",
          subtitle: a.details?.name || a.resourceType || "CollegeOS Verified Event",
          time: dateStr
        };
    }
  });

  const finalActivities = formattedActivities.length
    ? formattedActivities
    : [
        { title: "Academic Enrollment Active", subtitle: `${resolvedBranch} Engineering • Semester 5`, time: "Current" },
        { title: "Institutional Identity Verified", subtitle: "CollegeOS student profile synchronized", time: "Recent" }
      ];

  return {
    ...p,
    ...u,
    id: u.id || u._id || p.userId || "",
    fullName: u.fullName || p.fullName || "Student Candidate",
    email: u.email || p.email || "",
    phone: u.phone || p.phone || "",
    avatarUrl: u.avatarUrl || p.avatarUrl || "",
    coverUrl: u.coverUrl || p.coverUrl || "/campus-banner.jpg",
    branch: resolvedBranch,
    academicYear: p.academicYear || u.academicYear || "3rd Year",
    semester: p.semester || u.semester || "Semester 5",
    enrollmentNo: resolvedEnrollment,
    rollNo: resolvedEnrollment,
    degree: p.degree || p.programme || "Diploma in Engineering",
    location: resolvedLocation,
    tagline: resolvedTagline,
    sgpa: resolvedSgpa,
    attendancePercentage: resolvedAttendance,
    headline: p.headline || u.headline || `${resolvedBranch} Engineering • Semester 5`,
    bio: p.bio || u.bio || "",
    careerObjective: p.careerObjective || p.career?.objective || "",
    dateOfBirth: u.dateOfBirth || p.dateOfBirth || null,
    gender: u.gender || p.gender || "",
    address: u.address || p.address || "",
    city: u.city || p.city || "",
    state: u.state || p.state || "",
    pincode: u.pincode || p.pincode || "",
    emergencyContact: u.emergencyContact || p.emergencyContact || { name: "", relation: "", phone: "" },
    section: p.section || u.section || "A",
    studentId: p.studentId || u.studentId || resolvedEnrollment || "",
    admissionYear: p.admissionYear || "2024",
    academicSession: p.academicSession || "2024-2027",
    documents: Array.isArray(p.documents) ? p.documents : (Array.isArray(u.documents) ? u.documents : []),
    skills: Array.isArray(p.skills) && p.skills.length ? p.skills : (Array.isArray(u.skills) && u.skills.length ? u.skills : [
      "JavaScript", "React", "Node.js", "Python", "Data Structures & Algorithms", "Git & GitHub"
    ]),
    socialLinks: {
      linkedin: p.socialLinks?.linkedin || p.linkedin || u.linkedin || "",
      github: p.socialLinks?.github || p.github || u.github || "",
      youtube: p.socialLinks?.youtube || "",
      portfolio: p.socialLinks?.portfolio || p.portfolio || u.portfolio || p.website || u.website || "",
      twitter: p.socialLinks?.twitter || "",
      instagram: p.socialLinks?.instagram || "",
      discord: p.socialLinks?.discord || "",
      website: p.socialLinks?.website || p.website || "",
      leetcode: p.socialLinks?.leetcode || ""
    },
    projects: Array.isArray(p.projects) ? p.projects : [],
    certifications: Array.isArray(p.certifications) ? p.certifications : [],
    achievements: Array.isArray(p.achievements) ? p.achievements : [],
    experience: Array.isArray(p.experience) ? p.experience : [],
    recentActivities: finalActivities,
    status: u.status || "verified",
    createdAt: u.createdAt || p.createdAt || null
  };
}

/**
 * Intelligent Profile Completeness Calculation
 */
export function calculateProfileCompleteness(profile) {
  if (!profile) return { score: 0, missing: [] };
  let score = 0;
  const missing = [];

  if (profile.fullName && profile.fullName !== "Student Candidate") score += 15;
  if (profile.avatarUrl) score += 15;
  else missing.push({ key: "avatar", label: "Upload profile avatar", bonus: 15 });

  if (profile.bio && profile.bio.trim().length > 15) score += 15;
  else missing.push({ key: "bio", label: "Write a bio / summary", bonus: 15 });

  if (profile.enrollmentNo) score += 15;
  else missing.push({ key: "enrollment", label: "Add enrollment / roll number", bonus: 15 });

  if (Array.isArray(profile.skills) && profile.skills.length >= 3) score += 15;
  else missing.push({ key: "skills", label: "Add at least 3 skills", bonus: 15 });

  const hasSocial = profile.socialLinks && (profile.socialLinks.linkedin || profile.socialLinks.github || profile.socialLinks.portfolio);
  if (hasSocial) score += 15;
  else missing.push({ key: "social", label: "Connect GitHub or LinkedIn", bonus: 15 });

  if (Array.isArray(profile.projects) && profile.projects.length >= 1) score += 10;
  else missing.push({ key: "projects", label: "Add a featured project", bonus: 10 });

  return { score: Math.min(100, score), missing };
}

/* ==========================================================================
   Helpers
   ========================================================================== */
const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";
const cleanUrl = (u) => (u ? (/^https?:\/\//i.test(u) ? u : `https://${u}`) : "");
const handleOf = (u) => u.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
const hashHue = (str = "") => {
  let h = 7;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};
const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const SOCIALS = [
  { key: "github", label: "GitHub", Icon: Github, color: "#24292f" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0a66c2" },
  { key: "portfolio", label: "Portfolio", Icon: Globe, color: "#7c3aed" },
  { key: "leetcode", label: "LeetCode", Icon: CodeXml, color: "#f59e0b" },
  { key: "youtube", label: "YouTube", Icon: Youtube, color: "#ef4444" },
  { key: "twitter", label: "X / Twitter", Icon: Twitter, color: "#111827" },
  { key: "instagram", label: "Instagram", Icon: Instagram, color: "#db2777" },
  { key: "discord", label: "Discord", Icon: MessageCircle, color: "#5865f2" },
  { key: "website", label: "Website", Icon: Link2, color: "#0284c7" }
];

const TABS = [
  { id: "all", label: "Overview", short: "Home", Icon: Layers },
  { id: "academics", label: "Academics", short: "Study", Icon: GraduationCap },
  { id: "skills", label: "Skills", short: "Skills", Icon: Sparkles },
  { id: "projects", label: "Projects", short: "Work", Icon: FolderGit2 },
  { id: "certifications", label: "Certificates", short: "Certs", Icon: Award },
  { id: "experience", label: "Experience", short: "Career", Icon: Briefcase },
  { id: "documents", label: "Documents", short: "Docs", Icon: FileText }
];

/* Skills are grouped automatically from their names */
const SKILL_GROUPS = [
  { id: "lang", label: "Languages", exact: ["c", "c++", "c#", "go", "r", "sql", "java", "php", "dart", "rust", "kotlin", "swift", "python", "javascript", "typescript", "html", "css", "html5", "css3", "js", "ts"], has: [] },
  { id: "front", label: "Frontend", exact: [], has: ["react", "vue", "angular", "next", "tailwind", "bootstrap", "redux", "vite", "svelte", "sass", "figma"] },
  { id: "back", label: "Backend and data", exact: [], has: ["node", "express", "django", "flask", "spring", "laravel", "mongo", "mysql", "postgres", "firebase", "api", "graphql", "redis", "prisma"] },
  { id: "tools", label: "Tools and cloud", exact: [], has: ["git", "docker", "linux", "postman", "aws", "azure", "vercel", "vs code", "jira"] },
  { id: "core", label: "Computer science core", exact: [], has: ["data structure", "algorithm", "dsa", "oop", "dbms", "operating", "network", "system design", "machine learning"] },
  { id: "other", label: "More skills", exact: [], has: [] }
];

function categorize(skill) {
  const k = String(skill).toLowerCase().trim();
  for (const g of SKILL_GROUPS) if (g.exact.includes(k)) return g.id;
  for (const g of SKILL_GROUPS) if (g.has.some((w) => k.includes(w))) return g.id;
  return "other";
}

/* ==========================================================================
   Hooks and primitives
   ========================================================================== */
function useCountUp(target, duration = 1100, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    if (prefersReduced()) { setVal(end); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      setVal(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val.toFixed(decimals);
}

/* Follows the app's own theme (data-theme / .dark / .theme-dark). No toggle here. */
function useAppTheme() {
  const read = () => {
    if (typeof document === "undefined") return "light";
    const els = [document.documentElement, document.body].filter(Boolean);
    const dark = els.some((el) =>
      el.getAttribute("data-theme") === "dark" || el.classList.contains("dark") || el.classList.contains("theme-dark"));
    return dark ? "dark" : "light";
  };
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(read()));
    [document.documentElement, document.body].filter(Boolean).forEach((el) =>
      obs.observe(el, { attributes: true, attributeFilter: ["data-theme", "class"] }));
    return () => obs.disconnect();
  }, []);
  return theme;
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || !("IntersectionObserver" in window)) { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.06, rootMargin: "0px 0px -30px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`sp3-reveal ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function R({ children, d = 0 }) {
  return <Reveal delay={d}>{children}</Reveal>;
}

function Ring({ value, size = 64, stroke = 6, color = "var(--sp3-accent)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOff(c * (1 - Math.min(100, Math.max(0, value)) / 100)));
    return () => cancelAnimationFrame(id);
  }, [value, c]);
  return (
    <div className="sp3-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sp3-line)" strokeWidth={stroke} />
        <circle className="sp3-ring-arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="sp3-ring-inner">{children}</div>
    </div>
  );
}

function Card({ icon: Icon, title, sub, action, onAction, children, className = "", tone = "blue" }) {
  return (
    <section className={`sp3-card ${className}`}>
      <header className="sp3-card-head">
        <div className="sp3-card-title">
          {Icon && <span className={`sp3-ico ${tone}`}><Icon size={18} /></span>}
          <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
        </div>
        {action && (
          <button type="button" className="sp3-link" onClick={onAction}>{action}<ChevronRight size={14} /></button>
        )}
      </header>
      {children}
    </section>
  );
}

function Empty({ icon: Icon, text, cta, onClick }) {
  return (
    <div className="sp3-empty">
      <span className="sp3-empty-ico"><Icon size={22} /></span>
      <p>{text}</p>
      {cta && <button type="button" className="sp3-btn ghost sm" onClick={onClick}><Plus size={14} />{cta}</button>}
    </div>
  );
}

function buildVCard(p) {
  const esc = (s = "") => String(s).replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${esc(p.fullName)}`, "ORG:CollegeOS", `TITLE:${esc(`${p.degree} - ${p.branch}`)}`];
  if (p.phone) lines.push(`TEL;TYPE=CELL:${esc(p.phone)}`);
  if (p.email) lines.push(`EMAIL:${esc(p.email)}`);
  const web = p.socialLinks?.portfolio || p.socialLinks?.website;
  if (web) lines.push(`URL:${cleanUrl(web)}`);
  if (p.location) lines.push(`ADR;TYPE=HOME:;;${esc(p.location)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/* ==========================================================================
   Main component
   ========================================================================== */
export default function StudentProfile({ currentUser, onNavigate, showToast }) {
  const [profile, setProfile] = useState(() => (currentUser ? mergeProfileData(currentUser, authApi.getCachedProfile()) : null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Active Navigation Tab: "all" | "academics" | "skills" | "projects" | "certifications" | "experience"
  const [activeTab, setActiveTab] = useState("all");

  // Modals & Drawers
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState("basic");
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [projectView, setProjectView] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [toast, setToast] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const theme = useAppTheme();
  const rootRef = useRef(null);
  const navRef = useRef(null);
  const avatarInput = useRef(null);
  const coverInput = useRef(null);

  // Uses the app's showToast when given, otherwise shows its own toast
  const notify = useCallback((msg, isError = false) => {
    if (showToast) showToast(msg, isError);
    else setToast({ msg, isError, id: Date.now() });
  }, [showToast]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // Load Profile from Live Backend API
  useEffect(() => {
    let ignore = false;
    setError("");
    setLoading(true);

    Promise.all([
      authApi.getProfile(),
      authApi.getActivityLogs().catch(() => ({ activities: [] }))
    ])
      .then(([res, actRes]) => {
        if (ignore) return;
        const acts = (actRes?.activities && actRes.activities.length) ? actRes.activities : (res?.activities || []);
        const merged = mergeProfileData(res?.user, res?.profile, acts);
        if (merged) {
          setProfile(merged);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        if (currentUser) {
          const fallback = mergeProfileData(currentUser, authApi.getCachedProfile());
          setProfile(fallback);
        } else {
          setError(err?.message || "Could not load your profile from database.");
        }
        setLoading(false);
      });

    return () => { ignore = true; };
  }, [currentUser, reloadKey]);

  // Scroll progress bar + condensed nav state
  useEffect(() => {
    let raf = 0;
    let last = false;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        rootRef.current?.style.setProperty("--sp3-progress", p.toFixed(4));
        const s = window.scrollY > 340;
        if (s !== last) { last = s; setScrolled(s); }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [loading]);

  // ESC closes overlays, body scroll lock while an overlay is open
  useEffect(() => {
    const open = editorOpen || idCardOpen || !!projectView;
    const onKey = (e) => {
      if (e.key === "Escape") { setEditorOpen(false); setIdCardOpen(false); setProjectView(null); }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [editorOpen, idCardOpen, projectView]);

  // Dynamic Profile Completeness
  const completeness = useMemo(() => calculateProfileCompleteness(profile), [profile]);

  // Tab change handler
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    const top = navRef.current ? navRef.current.getBoundingClientRect().top + window.scrollY - 12 : 380;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  // Save profile updates to backend API
  const handleSaveProfile = useCallback(async (payload) => {
    try {
      const res = await authApi.updateProfile(payload);
      const updated = mergeProfileData(res?.user, res?.profile, profile?.recentActivities);
      if (updated) {
        setProfile(updated);
      }
      notify("Profile updated successfully!");
      return true;
    } catch (err) {
      notify(err?.message || "Failed to update profile.", true);
      return false;
    }
  }, [profile?.recentActivities, notify]);

  // Quick skill add
  const handleAddSkill = useCallback(async (newSkillName) => {
    if (!newSkillName || !profile) return false;
    const currentSkills = profile.skills || [];
    if (currentSkills.some((s) => s.toLowerCase() === newSkillName.toLowerCase())) {
      notify(`"${newSkillName}" is already listed.`, true);
      return false;
    }
    const updatedSkills = [...currentSkills, newSkillName];
    return handleSaveProfile({ skills: updatedSkills });
  }, [profile, handleSaveProfile, notify]);

  // Quick skill remove (same updateProfile call, skills only)
  const handleRemoveSkill = useCallback((name) => {
    if (!profile) return;
    handleSaveProfile({ skills: (profile.skills || []).filter((s) => s !== name) });
  }, [profile, handleSaveProfile]);

  // Upload Avatar
  const handleUploadAvatar = useCallback(async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      notify("Please choose a valid JPG, PNG, or WebP photo.", true);
      return;
    }
    setUploadingAvatar(true);
    try {
      const res = await authApi.uploadAvatar(file);
      setProfile((prev) => ({
        ...prev,
        avatarUrl: res.avatarUrl
      }));
      notify("Profile photo updated successfully!");
    } catch (err) {
      notify(err.message || "Failed to upload photo.", true);
    } finally {
      setUploadingAvatar(false);
    }
  }, [notify]);

  // Upload Cover
  const handleUploadCover = useCallback(async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      notify("Please choose a valid JPG, PNG, or WebP banner.", true);
      return;
    }
    setUploadingCover(true);
    try {
      const res = await authApi.uploadCover(file);
      setProfile((prev) => ({
        ...prev,
        coverUrl: res.coverUrl
      }));
      notify("Cover banner updated successfully!");
    } catch (err) {
      notify(err.message || "Failed to upload banner.", true);
    } finally {
      setUploadingCover(false);
    }
  }, [notify]);

  // Upload Document
  const handleUploadDocument = useCallback(async ({ file, name, type }) => {
    setUploadingDoc(true);
    try {
      const res = await authApi.uploadDocument(file, name, type);
      if (res?.document) {
        setProfile((prev) => ({
          ...prev,
          documents: [...(prev.documents || []), res.document]
        }));
      }
      setUploadDocModalOpen(false);
      notify("Document uploaded successfully!");
    } catch (err) {
      notify(err.message || "Failed to upload document.", true);
    } finally {
      setUploadingDoc(false);
    }
  }, [notify]);

  // Delete Document
  const handleDeleteDocument = useCallback(async (docId, docName) => {
    if (typeof window !== "undefined" && !window.confirm(`Are you sure you want to delete "${docName || "this document"}"?`)) {
      return;
    }
    setDeletingDocId(docId);
    try {
      await authApi.deleteDocument(docId);
      setProfile((prev) => ({
        ...prev,
        documents: (prev.documents || []).filter((d) => (d._id || d.id) !== docId)
      }));
      notify("Document deleted successfully.");
    } catch (err) {
      notify(err.message || "Failed to delete document.", true);
    } finally {
      setDeletingDocId(null);
    }
  }, [notify]);

  // Download Document
  const handleDownloadDocument = useCallback(async (docId, fileName) => {
    setDownloadingDocId(docId);
    try {
      await authApi.downloadDocument(docId, fileName);
      notify("Document download started.");
    } catch (err) {
      notify(err.message || "Failed to download document.", true);
    } finally {
      setDownloadingDocId(null);
    }
  }, [notify]);

  // Share profile
  const handleShareProfile = useCallback(() => {
    const url = window.location.href;
    if (navigator?.share) {
      navigator.share({
        title: `${profile?.fullName || "Student"} | CollegeOS Profile`,
        url
      }).catch(() => {});
    } else if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      notify("Profile link copied to clipboard!");
    }
  }, [profile?.fullName, notify]);

  const copyLink = useCallback(() => {
    navigator?.clipboard?.writeText(window.location.href);
    notify("Profile link copied to clipboard!");
  }, [notify]);

  const copyText = useCallback((text, label) => {
    if (!text) return;
    navigator?.clipboard?.writeText(text);
    notify(`${label} copied`);
  }, [notify]);

  const downloadVCard = useCallback(() => {
    if (!profile) return;
    const blob = new Blob([buildVCard(profile)], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile.fullName || "student").replace(/\s+/g, "-").toLowerCase()}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Contact card downloaded");
  }, [profile, notify]);

  // Print ID (only the ID card is printed)
  const handlePrintId = useCallback(() => {
    const done = () => { document.body.classList.remove("sp3-print-id"); window.removeEventListener("afterprint", done); };
    document.body.classList.add("sp3-print-id");
    window.addEventListener("afterprint", done);
    window.print();
  }, []);

  const openEditor = useCallback((tab = "basic") => { setEditorTab(tab); setEditorOpen(true); }, []);

  const onSpotlight = (e) => {
    e.currentTarget.querySelectorAll(".sp3-card").forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${e.clientX - r.left}px`);
      c.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  };

  /* ---------- states ---------- */
  if (loading) {
    return (
      <div className="sp3-root" data-theme={theme}>
        <div className="sp3-wrap">
          <div className="sp3-skel hero" />
          <div className="sp3-skel bar" />
          <div className="sp3-grid">
            <div className="sp3-col"><div className="sp3-skel card" /><div className="sp3-skel card" /></div>
            <div className="sp3-col"><div className="sp3-skel card" /><div className="sp3-skel card" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="sp3-root" data-theme={theme}>
        <div className="sp3-wrap">
          <div className="sp3-error">
            <TriangleAlert size={46} />
            <h3>Profile Unavailable</h3>
            <p>{error || "We could not fetch your student records."}</p>
            <button
              type="button"
              className="sp3-btn primary"
              onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}
            >
              <RefreshCw size={15} />Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { key: "sgpa", label: "SGPA", value: Number(profile.sgpa) || 0, decimals: 2, suffix: "/10", Icon: TrendingUp, tone: "violet", pct: ((Number(profile.sgpa) || 0) / 10) * 100 },
    { key: "att", label: "Attendance", value: Number(profile.attendancePercentage) || 0, decimals: 0, suffix: "%", Icon: CalendarCheck, tone: "green", pct: Number(profile.attendancePercentage) || 0 },
    { key: "proj", label: "Projects", value: profile.projects.length, decimals: 0, suffix: "", Icon: FolderGit2, tone: "blue", pct: Math.min(100, profile.projects.length * 20) },
    { key: "ach", label: "Achievements", value: profile.achievements.length + profile.certifications.length, decimals: 0, suffix: "", Icon: Trophy, tone: "amber", pct: Math.min(100, (profile.achievements.length + profile.certifications.length) * 15) }
  ];

  const counts = {
    skills: profile.skills.length,
    projects: profile.projects.length,
    certifications: profile.certifications.length,
    experience: profile.experience.length,
    documents: (profile.documents || []).length
  };

  const sections = {
    about: <AboutCard profile={profile} onEdit={() => openEditor("about")} />,
    strength: <StrengthCard completeness={completeness} onEdit={openEditor} />,
    academic: <AcademicCard profile={profile} onViewAll={() => onNavigate?.("results")} />,
    achievements: <AchievementsCard items={profile.achievements} onAdd={() => openEditor("achievements")} />,
    activity: <ActivityCard items={profile.recentActivities} onViewAll={() => onNavigate?.("dashboard")} />,
    social: <SocialCard profile={profile} onEdit={() => openEditor("social")} onCopy={copyText} />,
    skills: <SkillsCard skills={profile.skills} onAdd={handleAddSkill} onRemove={handleRemoveSkill} onEdit={() => openEditor("skills")} />,
    projects: <ProjectsCard items={profile.projects} onAdd={() => openEditor("projects")} onOpen={setProjectView} wide={activeTab === "projects"} />,
    experience: <ExperienceCard items={profile.experience} onAdd={() => openEditor("experience")} />,
    certs: <CertsCard items={profile.certifications} onAdd={() => openEditor("certifications")} />,
    documents: (
      <DocumentsCard
        documents={profile.documents || []}
        onUploadClick={() => setUploadDocModalOpen(true)}
        onDelete={handleDeleteDocument}
        onDownload={handleDownloadDocument}
        downloadingId={downloadingDocId}
        deletingId={deletingDocId}
      />
    )
  };

  return (
    <div className="sp3-root" data-theme={theme} ref={rootRef}>
      <div className="sp3-progress" aria-hidden="true"><i /></div>
      <div className="sp3-aurora" aria-hidden="true"><i /><i /><i /></div>

      {/* Main Responsive Canvas */}
      <main className="sp3-wrap">
        {/* Top Hero Section */}
        <section className="sp3-hero">
          <div className="sp3-cover">
            {profile.coverUrl && (
              <img src={profile.coverUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
            <div className="sp3-cover-mesh" />
            <div className="sp3-cover-shade" />
            <div className="sp3-cover-top">
              <span className="sp3-pill glass"><GraduationCap size={14} />CollegeOS</span>
              <button type="button" className="sp3-pill glass btn" onClick={() => coverInput.current?.click()} disabled={uploadingCover}>
                {uploadingCover ? <RefreshCw size={14} className="spin" /> : <Camera size={14} />}
                <span className="sp3-btn-label">{uploadingCover ? "Uploading…" : "Change cover"}</span>
              </button>
            </div>
            <input ref={coverInput} type="file" accept={IMAGE_TYPES.join(",")} hidden
              onChange={(e) => { handleUploadCover(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          <div className="sp3-hero-body">
            <div className="sp3-identity">
              <div className="sp3-avatar">
                <div className="sp3-avatar-ring">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.fullName} />
                    : <span>{initialsOf(profile.fullName)}</span>}
                </div>
                <button type="button" className="sp3-avatar-btn" onClick={() => avatarInput.current?.click()}
                  disabled={uploadingAvatar} aria-label="Change profile photo">
                  {uploadingAvatar ? <RefreshCw size={14} className="spin" /> : <Camera size={14} />}
                </button>
                <input ref={avatarInput} type="file" accept={IMAGE_TYPES.join(",")} hidden
                  onChange={(e) => { handleUploadAvatar(e.target.files?.[0]); e.target.value = ""; }} />
              </div>

              <div className="sp3-meta">
                <h1 className="sp3-name">
                  <span>{profile.fullName}</span>
                  {profile.status === "verified" && <CircleCheck size={22} className="sp3-check" />}
                </h1>
                <p className="sp3-headline">{profile.degree}<i>/</i>{profile.headline}</p>
                {profile.tagline
                  ? <button type="button" className="sp3-tagline" onClick={() => openEditor("basic")}>“{profile.tagline}”<Pen size={12} /></button>
                  : <button type="button" className="sp3-tagline empty" onClick={() => openEditor("basic")}><Plus size={12} />Add a tagline</button>}
                <div className="sp3-chips">
                  {profile.location && <span className="sp3-chip"><MapPin size={13} />{profile.location}</span>}
                  {profile.email && <a className="sp3-chip link" href={`mailto:${profile.email}`}><Mail size={13} />{profile.email}</a>}
                  {profile.phone && <a className="sp3-chip link" href={`tel:${profile.phone}`}><Phone size={13} />{profile.phone}</a>}
                </div>
              </div>
            </div>

            <div className="sp3-kpis">
              {stats.map((s) => <Kpi key={s.key} s={s} />)}
            </div>
          </div>

          <div className="sp3-actions">
            <div className="sp3-actions-left">
              <button type="button" className="sp3-btn primary" onClick={() => openEditor("basic")}><Pen size={15} />Edit profile</button>
              <button type="button" className="sp3-btn violet" onClick={() => setIdCardOpen(true)}><Contact size={15} />Digital ID</button>
              <button type="button" className="sp3-btn ghost" onClick={handleShareProfile}><Share2 size={15} />Share</button>
              <MoreMenu onCopy={copyLink} onVcard={downloadVCard} onPrint={() => window.print()} />
            </div>
            <button type="button" className="sp3-strength-pill" onClick={() => handleTabChange("all")}>
              <Ring value={completeness.score} size={36} stroke={4} color="var(--sp3-green)"><b>{completeness.score}</b></Ring>
              <span>{completeness.score === 100 ? "Profile complete" : `${completeness.missing.length} step${completeness.missing.length === 1 ? "" : "s"} to complete`}</span>
            </button>
          </div>
        </section>

        {/* Interactive Segmented Navigation Bar */}
        <TabNav navRef={navRef} active={activeTab} onChange={handleTabChange} counts={counts}
          scrolled={scrolled} profile={profile} onEdit={() => openEditor("basic")} />

        {/* Bento Grid Content Container */}
        <div className={`sp3-grid ${activeTab === "all" ? "" : "single"}`} key={activeTab} onMouseMove={onSpotlight}>
          {/* TAB: OVERVIEW */}
          {activeTab === "all" && (
            <>
              <div className="sp3-col sp3-col-main">
                <R>{sections.about}</R>
                <R d={60}>{sections.academic}</R>
                <R d={100}>{sections.documents}</R>
                <R d={140}>{sections.projects}</R>
                <R d={180}>{sections.experience}</R>
                <R d={220}>{sections.activity}</R>
              </div>
              <div className="sp3-col sp3-col-side">
                <R d={30}>{sections.strength}</R>
                <R d={70}>{sections.social}</R>
                <R d={110}>{sections.skills}</R>
                <R d={150}>{sections.achievements}</R>
                <R d={190}>{sections.certs}</R>
              </div>
            </>
          )}

          {/* TAB: ACADEMICS ONLY */}
          {activeTab === "academics" && (
            <div className="sp3-full" data-layout="split">
              <R>{sections.academic}</R>
              <R d={80}>{sections.achievements}</R>
            </div>
          )}

          {/* TAB: SKILLS ONLY */}
          {activeTab === "skills" && (
            <div className="sp3-full" data-layout="wide"><R>{sections.skills}</R></div>
          )}

          {/* TAB: PROJECTS ONLY */}
          {activeTab === "projects" && (
            <div className="sp3-full" data-layout="wide"><R>{sections.projects}</R></div>
          )}

          {/* TAB: CERTIFICATIONS ONLY */}
          {activeTab === "certifications" && (
            <div className="sp3-full" data-layout="split">
              <R>{sections.certs}</R>
              <R d={80}>{sections.achievements}</R>
            </div>
          )}

          {/* TAB: EXPERIENCE ONLY */}
          {activeTab === "experience" && (
            <div className="sp3-full" data-layout="split">
              <R>{sections.experience}</R>
              <R d={80}>{sections.activity}</R>
            </div>
          )}

          {/* TAB: DOCUMENTS ONLY */}
          {activeTab === "documents" && (
            <div className="sp3-full" data-layout="wide"><R>{sections.documents}</R></div>
          )}
        </div>
      </main>

      {/* Full-Feature Profile Editor Drawer */}
      {editorOpen && (
        <EditorDrawer profile={profile} tab={editorTab} setTab={setEditorTab} onClose={() => setEditorOpen(false)}
          onSave={async (payload) => { const ok = await handleSaveProfile(payload); if (ok) setEditorOpen(false); }} />
      )}

      {/* 3D Digital Student ID Card Modal */}
      {idCardOpen && <IdCardModal student={profile} onClose={() => setIdCardOpen(false)} onPrint={handlePrintId} />}

      {/* Upload Document Modal */}
      {uploadDocModalOpen && (
        <UploadDocumentModal
          open={uploadDocModalOpen}
          onClose={() => setUploadDocModalOpen(false)}
          onSubmit={handleUploadDocument}
          busy={uploadingDoc}
        />
      )}

      {projectView && <ProjectModal project={projectView} onClose={() => setProjectView(null)} />}

      {toast && <div key={toast.id} className={`sp3-toast ${toast.isError ? "err" : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}

/* ==========================================================================
   Navigation: sliding tab indicator, condensed identity, mobile dock
   ========================================================================== */
function TabNav({ navRef, active, onChange, counts, scrolled, profile, onEdit }) {
  const trackRef = useRef(null);
  const btnRefs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const el = btnRefs.current[active];
    if (!el) return;
    setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [active]);

  const countKey = Object.values(counts).join("-");
  useLayoutEffect(() => { measure(); }, [measure, countKey, scrolled]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready?.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    const el = btnRefs.current[active];
    const track = trackRef.current;
    if (!el || !track) return;
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2, behavior: prefersReduced() ? "auto" : "smooth" });
  }, [active]);

  return (
    <nav className={`sp3-nav ${scrolled ? "condensed" : ""}`} ref={navRef} aria-label="Profile sections">
      <button type="button" className="sp3-nav-me" onClick={onEdit} aria-label="Edit profile" tabIndex={scrolled ? 0 : -1}>
        <span className="sp3-nav-avatar">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initialsOf(profile.fullName)}
        </span>
        <b>{profile.fullName.split(" ")[0]}</b>
      </button>
      <div className="sp3-nav-track" ref={trackRef}>
        <span className={`sp3-nav-indicator ${ind.ready ? "ready" : ""}`} style={{ transform: `translateX(${ind.left}px)`, width: ind.width }} />
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" ref={(el) => { btnRefs.current[id] = el; }}
            className={`sp3-tab ${active === id ? "active" : ""}`} onClick={() => onChange(id)}
            aria-current={active === id ? "page" : undefined}>
            <Icon size={15} />{label}{counts[id] > 0 && <em>{counts[id]}</em>}
          </button>
        ))}
      </div>
    </nav>
  );
}

function MoreMenu({ onCopy, onVcard, onPrint }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const run = (fn) => () => { setOpen(false); fn(); };
  return (
    <div className="sp3-more" ref={ref}>
      <button type="button" className={`sp3-btn ghost icon ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu" aria-expanded={open} aria-label="More options">
        <Ellipsis size={18} />
      </button>
      {open && (
        <div className="sp3-menu" role="menu">
          <button type="button" role="menuitem" onClick={run(onCopy)}><Link2 size={15} />Copy profile link</button>
          <button type="button" role="menuitem" onClick={run(onVcard)}><Download size={15} />Save as contact (.vcf)</button>
          <button type="button" role="menuitem" onClick={run(onPrint)}><Printer size={15} />Print profile</button>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Hero KPI
   ========================================================================== */
function Kpi({ s }) {
  const num = useCountUp(s.value, 1100, s.decimals);
  const Icon = s.Icon;
  return (
    <div className={`sp3-kpi ${s.tone}`}>
      <span className="sp3-kpi-ico"><Icon size={16} /></span>
      <div className="sp3-kpi-val"><b>{num}</b><small>{s.suffix}</small></div>
      <div className="sp3-kpi-lbl">{s.label}</div>
      <div className="sp3-kpi-bar"><i style={{ width: `${Math.min(100, s.pct)}%` }} /></div>
    </div>
  );
}

/* ==========================================================================
   Section cards
   ========================================================================== */
function StrengthCard({ completeness, onEdit }) {
  const { score, missing } = completeness;
  const map = { avatar: "basic", bio: "about", enrollment: "basic", skills: "skills", social: "social", projects: "projects" };
  const level = score === 100 ? "Complete" : score >= 70 ? "Strong" : score >= 40 ? "Growing" : "Getting started";
  return (
    <Card icon={Target} title="Profile strength" sub={score === 100 ? "Everything is in place" : "Finish these to stand out to recruiters"} tone="green" className="sp3-strength">
      <div className="sp3-strength-body">
        <Ring value={score} size={104} stroke={10} color="var(--sp3-green)">
          <div className="sp3-ring-stack"><b className="sp3-ring-num">{score}%</b><small>{level}</small></div>
        </Ring>
        <ul className="sp3-todo">
          {missing.length === 0 && <li className="done"><CircleCheck size={16} />All sections complete</li>}
          {missing.map((m) => (
            <li key={m.key}>
              <button type="button" onClick={() => onEdit(map[m.key] || "basic")}>
                <Plus size={14} /><span>{m.label}</span><em>+{m.bonus}%</em>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function AboutCard({ profile, onEdit }) {
  const [open, setOpen] = useState(false);
  const long = (profile.bio || "").length > 220;
  return (
    <Card icon={User} title="About me" sub="Who you are in a few lines" action="Edit" onAction={onEdit}>
      {profile.bio ? (
        <>
          <p className={`sp3-bio ${open ? "open" : ""}`}>{profile.bio}</p>
          {long && (
            <button type="button" className="sp3-link tight" onClick={() => setOpen((o) => !o)}>
              {open ? "Show less" : "Read more"}
            </button>
          )}
        </>
      ) : (
        <Empty icon={User} text="Your bio is empty. Two or three lines about what you build and what you want next is enough." cta="Write bio" onClick={onEdit} />
      )}
      {profile.careerObjective && (
        <div className="sp3-objective">
          <Target size={16} />
          <div><strong>Career objective</strong><p>{profile.careerObjective}</p></div>
        </div>
      )}
    </Card>
  );
}

function AcademicCard({ profile, onViewAll }) {
  const sgpa = Number(profile.sgpa) || 0;
  const att = Number(profile.attendancePercentage) || 0;
  const total = SEMESTER_CHOICES.length;
  const semNum = Math.min(total, Math.max(1, parseInt(String(profile.semester || "").replace(/\D/g, ""), 10) || 1));
  const progress = total > 1 ? ((semNum - 1) / (total - 1)) * 100 : 0;
  return (
    <Card icon={GraduationCap} title="Academic details" sub={`${profile.degree} · ${profile.branch}`} action="Results" onAction={onViewAll} tone="violet">
      <div className="sp3-scores">
        <div className="sp3-score violet">
          <Ring value={sgpa * 10} size={112} stroke={10} color="var(--sp3-violet)">
            <div className="sp3-ring-stack"><b className="sp3-ring-num">{sgpa.toFixed(2)}</b><small>SGPA</small></div>
          </Ring>
          <span>Out of 10</span>
        </div>
        <div className="sp3-score green">
          <Ring value={att} size={112} stroke={10} color={att >= 75 ? "var(--sp3-green)" : "var(--sp3-rose)"}>
            <div className="sp3-ring-stack"><b className="sp3-ring-num">{att}%</b><small>Attendance</small></div>
          </Ring>
          <span className={att >= 75 ? "" : "warn"}>{att >= 75 ? "Above the 75% rule" : "Below the 75% rule"}</span>
        </div>
      </div>

      <div className="sp3-stepper-wrap">
        <div className="sp3-stepper-head"><span>Course progress</span><b>Semester {semNum} of {total}</b></div>
        <ol className="sp3-stepper" style={{ "--p": `${progress}%` }}>
          {SEMESTER_CHOICES.map((s, i) => {
            const n = i + 1;
            const state = n < semNum ? "done" : n === semNum ? "now" : "next";
            return (
              <li key={s} className={state}>
                <span>{state === "done" ? <CircleCheck size={14} /> : n}</span>
                <small>Sem {n}</small>
              </li>
            );
          })}
        </ol>
      </div>

      <dl className="sp3-facts">
        <div><dt>Year</dt><dd>{profile.academicYear}</dd></div>
        <div><dt>Branch</dt><dd>{profile.branch}</dd></div>
        <div><dt>Enrollment</dt><dd>{profile.enrollmentNo || "Not added"}</dd></div>
      </dl>
    </Card>
  );
}

function AchievementsCard({ items, onAdd }) {
  return (
    <Card icon={Trophy} title="Achievements" sub="Honors and recognitions" action="Add" onAction={onAdd} tone="amber">
      {items.length === 0 ? (
        <Empty icon={Trophy} text="No achievements yet. Hackathons, topper lists and awards go here." cta="Add achievement" onClick={onAdd} />
      ) : (
        <div className="sp3-ach-grid">
          {items.map((a, i) => (
            <article key={i} className="sp3-ach">
              <span className="sp3-ach-ico"><Star size={18} /></span>
              <div>
                <h4>{a.title || a.name}</h4>
                {(a.issuer || a.year) && <p>{[a.issuer, a.year].filter(Boolean).join(" · ")}</p>}
                {a.description && <small>{a.description}</small>}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityCard({ items, onViewAll }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Card icon={Clock} title="Recent activity" sub="Latest milestones" action="Dashboard" onAction={onViewAll} tone="cyan">
      {list.length === 0 ? (
        <Empty icon={Clock} text="Nothing yet. Results, awards and class updates will show up here." />
      ) : (
        <ol className="sp3-activity">
          {list.slice(0, 6).map((a, i) => (
            <li key={i}>
              <i />
              <div><h4>{a.title}</h4>{a.subtitle && <p>{a.subtitle}</p>}</div>
              {a.time && <time>{a.time}</time>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function SocialCard({ profile, onEdit, onCopy }) {
  const linked = SOCIALS.filter((s) => profile.socialLinks?.[s.key]);
  return (
    <Card icon={Link2} title="Handles and links" sub="Where people can find your work" action="Edit" onAction={onEdit} tone="cyan">
      {linked.length === 0 ? (
        <Empty icon={Link2} text="Connect GitHub or LinkedIn so recruiters can see your work." cta="Add links" onClick={onEdit} />
      ) : (
        <div className="sp3-social">
          {linked.map(({ key, label, Icon, color }) => {
            const url = profile.socialLinks[key];
            return (
              <div key={key} className="sp3-handle" style={{ "--brand": color }}>
                <a className="sp3-handle-ico" href={cleanUrl(url)} target="_blank" rel="noreferrer noopener" aria-label={`Open ${label}`}>
                  <Icon size={17} />
                </a>
                <div>
                  <small>{label}</small>
                  <a href={cleanUrl(url)} target="_blank" rel="noreferrer noopener">{handleOf(url)}</a>
                </div>
                <button type="button" onClick={() => onCopy(cleanUrl(url), `${label} link`)} aria-label={`Copy ${label} link`}>
                  <Copy size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function SkillsCard({ skills, onAdd, onRemove, onEdit }) {
  const [q, setQ] = useState("");
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("grouped");
  const shown = skills.filter((s) => s.toLowerCase().includes(q.toLowerCase()));

  const groups = useMemo(() => {
    const map = {};
    shown.forEach((s) => { (map[categorize(s)] = map[categorize(s)] || []).push(s); });
    return SKILL_GROUPS.filter((g) => map[g.id]?.length).map((g) => ({ ...g, items: map[g.id] }));
  }, [shown]);

  const submit = async (e) => {
    e.preventDefault();
    if (!val.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd(val.trim());
    setBusy(false);
    if (ok) setVal("");
  };

  const chip = (s, i) => (
    <span key={s} className="sp3-skill" style={{ animationDelay: `${Math.min(i, 14) * 35}ms` }}>
      {s}
      <button type="button" onClick={() => onRemove(s)} aria-label={`Remove ${s}`}><X size={12} /></button>
    </span>
  );

  return (
    <Card icon={Sparkles} title="Skills and technologies" sub={`${skills.length} listed`} action="Manage" onAction={onEdit} tone="violet">
      <form className="sp3-skill-form" onSubmit={submit}>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add a skill, e.g. TypeScript" maxLength={40} aria-label="New skill" />
        <button type="submit" className="sp3-btn primary sm" disabled={busy || !val.trim()}>
          {busy ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}Add
        </button>
      </form>

      <div className="sp3-skill-tools">
        {skills.length > 6 && (
          <label className="sp3-search"><Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter skills" aria-label="Filter skills" />
          </label>
        )}
        <div className="sp3-seg" role="tablist" aria-label="Skill view">
          <button type="button" role="tab" aria-selected={view === "grouped"} className={view === "grouped" ? "on" : ""} onClick={() => setView("grouped")}>Grouped</button>
          <button type="button" role="tab" aria-selected={view === "all"} className={view === "all" ? "on" : ""} onClick={() => setView("all")}>All</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="sp3-muted">{q ? `No skill matches “${q}”.` : "No skills yet."}</p>
      ) : view === "all" ? (
        <div className="sp3-skill-cloud">{shown.map(chip)}</div>
      ) : (
        <div className="sp3-skill-groups">
          {groups.map((g) => (
            <div key={g.id} className="sp3-skill-group">
              <h4>{g.label}<em>{g.items.length}</em></h4>
              <div className="sp3-skill-cloud">{g.items.map(chip)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ProjectsCard({ items, onAdd, onOpen, wide }) {
  return (
    <Card icon={FolderGit2} title="Featured projects" sub="Things you have built" action="Manage" onAction={onAdd} tone="blue">
      {items.length === 0 ? (
        <Empty icon={FolderGit2} text="Add your best project with a live link and a short description." cta="Add project" onClick={onAdd} />
      ) : (
        <div className={`sp3-projects ${wide ? "wide" : ""}`}>
          {items.map((p, i) => {
            const title = p.title || p.name || "Untitled";
            const tech = Array.isArray(p.tech) ? p.tech : Array.isArray(p.technologies) ? p.technologies : [];
            const live = p.liveUrl || p.link || p.url;
            const repo = p.githubUrl || p.github || p.repo;
            return (
              <article key={i} className="sp3-project" style={{ "--h": hashHue(title) }} role="button" tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(p); } }}>
                <div className="sp3-project-thumb"><span>{initialsOf(title)}</span><i /><i /></div>
                <div className="sp3-project-body">
                  <div className="sp3-project-top">
                    <h4>{title}</h4>
                    <div onClick={(e) => e.stopPropagation()}>
                      {repo && <a href={cleanUrl(repo)} target="_blank" rel="noreferrer noopener" aria-label="Source code"><Github size={15} /></a>}
                      {live && <a href={cleanUrl(live)} target="_blank" rel="noreferrer noopener" aria-label="Live demo"><ExternalLink size={15} /></a>}
                    </div>
                  </div>
                  {p.description && <p>{p.description}</p>}
                  {tech.length > 0 && <div className="sp3-tags">{tech.slice(0, 5).map((t) => <span key={t}>{t}</span>)}{tech.length > 5 && <span>+{tech.length - 5}</span>}</div>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ExperienceCard({ items, onAdd }) {
  return (
    <Card icon={Briefcase} title="Experience and internships" sub="Work that shaped you" action="Manage" onAction={onAdd} tone="green">
      {items.length === 0 ? (
        <Empty icon={Briefcase} text="Internships, freelance work and club roles count too." cta="Add experience" onClick={onAdd} />
      ) : (
        <ol className="sp3-timeline">
          {items.map((x, i) => (
            <li key={i}>
              <i />
              <div>
                <h4>{x.role || x.title}</h4>
                <p>{[x.company || x.organization, x.location].filter(Boolean).join(" · ")}</p>
                {(x.duration || x.period) && <time>{x.duration || x.period}</time>}
                {x.description && <small>{x.description}</small>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function CertsCard({ items, onAdd }) {
  return (
    <Card icon={Award} title="Certifications" sub="Verified learning" action="Manage" onAction={onAdd} tone="amber">
      {items.length === 0 ? (
        <Empty icon={Award} text="Add courses and certificates with their credential links." cta="Add certificate" onClick={onAdd} />
      ) : (
        <div className="sp3-certs">
          {items.map((c, i) => (
            <article key={i} className="sp3-cert">
              <span className="sp3-ach-ico"><Award size={18} /></span>
              <div>
                <h4>{c.title || c.name}</h4>
                <p>{[c.issuer, c.year].filter(Boolean).join(" · ")}</p>
                <div className="sp3-cert-meta">
                  {c.credentialId && <code>ID {c.credentialId}</code>}
                  {(c.url || c.link || c.credentialUrl) && (
                    <a href={cleanUrl(c.url || c.link || c.credentialUrl)} target="_blank" rel="noreferrer noopener">Verify<ExternalLink size={12} /></a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentsCard({ documents = [], onUploadClick, onDelete, onDownload, downloadingId, deletingId }) {
  const verifiedCount = documents.filter((d) => d.verificationStatus === "verified").length;

  const formatBytes = (bytes = 0) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <Card
      icon={FileText}
      title="Official Documents"
      sub={`${documents.length} document${documents.length === 1 ? "" : "s"} uploaded • ${verifiedCount} verified`}
      action="Upload document"
      onAction={onUploadClick}
      tone="violet"
    >
      {documents.length === 0 ? (
        <Empty
          icon={FileText}
          text="No official documents uploaded yet. Upload your ID proof, marksheets, or certificates."
          cta="Upload document"
          onClick={onUploadClick}
        />
      ) : (
        <div className="sp3-docs-list">
          {documents.map((doc) => {
            const isVerified = doc.verificationStatus === "verified";
            const isRejected = doc.verificationStatus === "rejected";
            const docId = doc._id || doc.id;
            return (
              <div key={docId} className="sp3-doc-item">
                <div className="sp3-doc-info">
                  <div className="sp3-doc-ico">
                    <FileText size={20} />
                  </div>
                  <div className="sp3-doc-details">
                    <h4>{doc.name}</h4>
                    <div className="sp3-doc-meta">
                      <span className="badge type">{doc.type || "ID Proof"}</span>
                      <span>{doc.fileName}</span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="sp3-doc-status">
                  {isVerified ? (
                    <span className="sp3-pill ok"><ShieldCheck size={12} /> Verified</span>
                  ) : isRejected ? (
                    <span className="sp3-pill rose"><TriangleAlert size={12} /> Rejected</span>
                  ) : (
                    <span className="sp3-pill amber"><Clock size={12} /> Under Review</span>
                  )}
                  <div className="sp3-doc-actions">
                    <button
                      type="button"
                      className="sp3-doc-btn"
                      onClick={() => onDownload(docId, doc.fileName || `${doc.name}.pdf`)}
                      disabled={downloadingId === docId}
                      title="Download document"
                    >
                      {downloadingId === docId ? <RefreshCw size={13} className="spin" /> : <Download size={13} />}
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      className="sp3-doc-btn danger"
                      onClick={() => onDelete(docId, doc.name)}
                      disabled={deletingId === docId}
                      title="Delete document"
                    >
                      {deletingId === docId ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function UploadDocumentModal({ open, onClose, onSubmit, busy }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("ID Proof");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (!name) {
      const ext = f.name.lastIndexOf(".");
      const base = ext > 0 ? f.name.slice(0, ext) : f.name;
      setName(base.replace(/[-_]/g, " "));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onSubmit({ file, name, type });
  };

  return (
    <div className="sp3-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Upload document">
      <div className="sp3-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <header className="sp3-drawer-head" style={{ padding: "18px 24px" }}>
          <div>
            <h3>Upload Verification Document</h3>
            <p>PDF, JPG, PNG or WebP files up to 10MB</p>
          </div>
          <button type="button" className="sp3-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleFormSubmit} style={{ padding: "0 24px 24px" }}>
          <div className="sp3-form-grid" style={{ marginBottom: 18 }}>
            <Field label="Document title / label" wide>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aadhaar Card, 10th Marksheet, Caste Certificate"
                required
              />
            </Field>

            <Field label="Document category" wide>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ID Proof">Aadhaar / Government ID Proof</option>
                <option value="Academic Marksheet">Academic Marksheet (10th/12th/Semester)</option>
                <option value="Certificate">Certificate / Achievement</option>
                <option value="Income / Caste Certificate">Income / Caste / Domicile Certificate</option>
                <option value="Admission Slip">Admission / Fee Receipt</option>
                <option value="Other Document">Other Institutional Document</option>
              </select>
            </Field>

            <div
              className={`sp3-dropzone ${dragOver ? "drag" : ""}`}
              style={{ gridColumn: "1 / -1" }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <div className="sp3-dropzone-icon">
                <UploadCloud size={32} />
              </div>
              {file ? (
                <div>
                  <b style={{ color: "var(--sp3-ink)", display: "block", marginBottom: 4 }}>{file.name}</b>
                  <span style={{ fontSize: 12, color: "var(--sp3-mute)" }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                  </span>
                </div>
              ) : (
                <div>
                  <b style={{ color: "var(--sp3-ink)", display: "block", marginBottom: 4 }}>Click to choose a file or drag & drop here</b>
                  <span style={{ fontSize: 12, color: "var(--sp3-mute)" }}>Accepted formats: PDF, JPG, PNG, WebP (Max 10MB)</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="sp3-btn ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="sp3-btn primary" disabled={!file || busy}>
              {busy ? <RefreshCw size={14} className="spin" /> : <UploadCloud size={14} />}
              {busy ? "Uploading…" : "Upload document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   Project quick view
   ========================================================================== */
function ProjectModal({ project: p, onClose }) {
  const title = p.title || p.name || "Untitled";
  const tech = Array.isArray(p.tech) ? p.tech : Array.isArray(p.technologies) ? p.technologies : [];
  const live = p.liveUrl || p.link || p.url;
  const repo = p.githubUrl || p.github || p.repo;
  return (
    <div className="sp3-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="sp3-modal" onClick={(e) => e.stopPropagation()} style={{ "--h": hashHue(title) }}>
        <div className="sp3-modal-hero">
          <span>{initialsOf(title)}</span>
          <button type="button" className="sp3-icon-glass" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="sp3-modal-body">
          <h3>{title}</h3>
          {p.description ? <p>{p.description}</p> : <p className="sp3-muted">No description added yet.</p>}
          {tech.length > 0 && <div className="sp3-tags">{tech.map((t) => <span key={t}>{t}</span>)}</div>}
          <div className="sp3-modal-links">
            {live && <a className="sp3-btn primary" href={cleanUrl(live)} target="_blank" rel="noreferrer noopener"><ExternalLink size={15} />Live demo</a>}
            {repo && <a className="sp3-btn ghost" href={cleanUrl(repo)} target="_blank" rel="noreferrer noopener"><Github size={15} />Source code</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Digital ID card (3D tilt, flip, print)
   ========================================================================== */
function QrPattern({ seed }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of seed || "collegeos") { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const n = 17;
    const out = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const finder = (x < 5 && y < 5) || (x > 11 && y < 5) || (x < 5 && y > 11);
        h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
        if (finder ? (x % 4 === 0 || y % 4 === 0 || x % 6 === 2 || y % 6 === 2) : (h & 3) > 0) out.push([x, y]);
      }
    }
    return out;
  }, [seed]);
  return (
    <svg viewBox="0 0 17 17" className="sp3-qr" shapeRendering="crispEdges" aria-label="Student QR code">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}
    </svg>
  );
}

function IdCardModal({ student, onClose, onPrint }) {
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef(null);
  const onMove = (e) => {
    const el = tiltRef.current;
    if (!el || prefersReduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ty", `${(x * 14).toFixed(2)}deg`);
  };
  const onLeave = () => {
    tiltRef.current?.style.setProperty("--tx", "0deg");
    tiltRef.current?.style.setProperty("--ty", "0deg");
  };
  return (
    <div className="sp3-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Digital student ID">
      <div className="sp3-id-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="sp3-id-bar">
          <span className="sp3-pill glass"><span className="live" />Live ID</span>
          <button type="button" className="sp3-icon-glass" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="sp3-id-stage sp3-idprint" onMouseMove={onMove} onMouseLeave={onLeave}>
          <div className="sp3-id-tilt" ref={tiltRef}>
            <div className={`sp3-id-flip ${flipped ? "flipped" : ""}`}>
              <div className="sp3-id-face front">
                <div className="sp3-id-head">
                  <GraduationCap size={22} />
                  <div><b>CollegeOS</b><small>Student identity card</small></div>
                  <span>STUDENT</span>
                </div>
                <div className="sp3-id-main">
                  <div className="sp3-id-photo">{student.avatarUrl ? <img src={student.avatarUrl} alt="" /> : <span>{initialsOf(student.fullName)}</span>}</div>
                  <div>
                    <h3>{student.fullName}</h3>
                    <p>{student.degree}</p>
                    <dl>
                      <div><dt>Enrollment</dt><dd>{student.enrollmentNo || "—"}</dd></div>
                      <div><dt>Branch</dt><dd>{student.branch}</dd></div>
                      <div><dt>Year</dt><dd>{student.academicYear}</dd></div>
                      <div><dt>Semester</dt><dd>{student.semester}</dd></div>
                    </dl>
                  </div>
                </div>
                <div className="sp3-id-foot"><i className="bars" /><small>{student.enrollmentNo || student.id}</small></div>
              </div>
              <div className="sp3-id-face back">
                <div className="sp3-id-back-grid">
                  <div className="sp3-qr-box"><QrPattern seed={student.enrollmentNo || student.email || student.id} /><small>Scan to verify</small></div>
                  <div>
                    <h4>Card rules</h4>
                    <ul>
                      <li>Carry this card inside campus at all times.</li>
                      <li>Report a lost card to the office at once.</li>
                      <li>This card cannot be transferred.</li>
                    </ul>
                    {student.phone && <p className="sp3-id-contact">Contact <b>{student.phone}</b></p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="sp3-id-hint">Move your mouse over the card to tilt it</p>
        <div className="sp3-id-actions">
          <button type="button" className="sp3-btn violet" onClick={() => setFlipped((f) => !f)}><RotateCw size={15} />Flip card</button>
          <button type="button" className="sp3-btn primary" onClick={onPrint}><Printer size={15} />Print</button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Editor drawer (schema driven). Saves only the fields that changed.
   ========================================================================== */
const LIST_SCHEMAS = {
  projects: {
    label: "Project",
    empty: { title: "", description: "", tech: "", liveUrl: "", githubUrl: "" },
    fields: [["title", "Title"], ["description", "Description", "area"], ["tech", "Technologies (comma separated)"], ["liveUrl", "Live link"], ["githubUrl", "GitHub link"]]
  },
  certifications: {
    label: "Certificate",
    empty: { title: "", issuer: "", year: "", credentialId: "", url: "" },
    fields: [["title", "Title"], ["issuer", "Issuer"], ["year", "Year"], ["credentialId", "Credential ID"], ["url", "Verification link"]]
  },
  experience: {
    label: "Experience",
    empty: { role: "", company: "", location: "", duration: "", description: "" },
    fields: [["role", "Role"], ["company", "Company"], ["location", "Location"], ["duration", "Duration"], ["description", "Description", "area"]]
  },
  achievements: {
    label: "Achievement",
    empty: { title: "", issuer: "", year: "", description: "" },
    fields: [["title", "Title"], ["issuer", "Awarded by"], ["year", "Year"], ["description", "Description", "area"]]
  }
};

const EDITOR_TABS = [
  { id: "basic", label: "Basics", Icon: User },
  { id: "about", label: "About", Icon: BookOpen },
  { id: "social", label: "Links", Icon: Link2 },
  { id: "skills", label: "Skills", Icon: Sparkles },
  { id: "projects", label: "Projects", Icon: FolderGit2 },
  { id: "certifications", label: "Certificates", Icon: Award },
  { id: "experience", label: "Experience", Icon: Briefcase },
  { id: "achievements", label: "Achievements", Icon: Trophy }
];

function Field({ label, children, wide }) {
  return <label className={`sp3-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

const toDraft = (p) => ({
  fullName: p.fullName === "Student Candidate" ? "" : p.fullName,
  phone: p.phone || "",
  tagline: p.tagline || "",
  headline: p.headline || "",
  location: p.location || "",
  enrollmentNo: p.enrollmentNo || "",
  branch: p.branch || "CSE",
  academicYear: p.academicYear || "3rd Year",
  semester: p.semester || "Semester 5",
  section: p.section || "A",
  studentId: p.studentId || "",
  admissionYear: p.admissionYear || "2024",
  academicSession: p.academicSession || "2024-2027",
  dateOfBirth: p.dateOfBirth ? (typeof p.dateOfBirth === "string" ? p.dateOfBirth.split("T")[0] : new Date(p.dateOfBirth).toISOString().split("T")[0]) : "",
  gender: p.gender || "",
  address: p.address || "",
  city: p.city || "",
  state: p.state || "",
  pincode: p.pincode || "",
  emergencyContactName: p.emergencyContact?.name || "",
  emergencyContactRelation: p.emergencyContact?.relation || "",
  emergencyContactPhone: p.emergencyContact?.phone || "",
  sgpa: p.sgpa,
  attendancePercentage: p.attendancePercentage,
  bio: p.bio || "",
  careerObjective: p.careerObjective || "",
  socialLinks: { ...p.socialLinks },
  skills: [...p.skills],
  projects: p.projects.map((x) => ({
    ...x,
    tech: Array.isArray(x.tech) ? x.tech.join(", ") : Array.isArray(x.technologies) ? x.technologies.join(", ") : x.tech || ""
  })),
  certifications: p.certifications.map((x) => ({
    ...x,
    url: x.url || x.credentialUrl || ""
  })),
  experience: p.experience.map((x) => ({
    ...x,
    role: x.role || x.title || "",
    duration: x.duration || x.period || (x.startDate ? `${x.startDate} - ${x.endDate || "Present"}` : "")
  })),
  achievements: p.achievements.map((x) => ({ ...x }))
});

const buildPayload = (d) => ({
  ...d,
  fullName: (d.fullName || "").trim(),
  dateOfBirth: d.dateOfBirth || null,
  gender: d.gender || "",
  address: (d.address || "").trim(),
  city: (d.city || "").trim(),
  state: (d.state || "").trim(),
  pincode: (d.pincode || "").trim(),
  emergencyContact: {
    name: (d.emergencyContactName || "").trim(),
    relation: (d.emergencyContactRelation || "").trim(),
    phone: (d.emergencyContactPhone || "").trim()
  },
  section: (d.section || "").trim(),
  studentId: (d.studentId || "").trim(),
  admissionYear: (d.admissionYear || "").trim(),
  academicSession: (d.academicSession || "").trim(),
  sgpa: d.sgpa === "" || d.sgpa === null || d.sgpa === undefined ? undefined : Number(d.sgpa),
  attendancePercentage: d.attendancePercentage === "" || d.attendancePercentage === null || d.attendancePercentage === undefined ? undefined : Number(d.attendancePercentage),
  careerObjective: (d.careerObjective || "").trim(),
  projects: d.projects
    .filter((x) => x.title && x.title.trim())
    .map((x) => {
      const parsed = Array.isArray(x.tech)
        ? x.tech
        : String(x.tech || "").split(",").map((t) => t.trim()).filter(Boolean);
      return { ...x, tech: parsed, technologies: parsed };
    }),
  certifications: d.certifications
    .filter((x) => x.title && x.title.trim())
    .map((x) => ({
      ...x,
      credentialUrl: (x.url || x.credentialUrl || "").trim(),
      url: (x.url || x.credentialUrl || "").trim()
    })),
  experience: d.experience
    .filter((x) => (x.role || x.title) && (x.role || x.title).trim())
    .map((x) => ({
      ...x,
      role: (x.role || x.title || "").trim(),
      title: (x.title || x.role || "").trim(),
      duration: (x.duration || "").trim()
    })),
  achievements: d.achievements.filter((x) => x.title && x.title.trim())
});

function EditorDrawer({ profile, tab, setTab, onClose, onSave }) {
  const [d, setD] = useState(() => toDraft(profile));
  const [saving, setSaving] = useState(false);
  const [skillIn, setSkillIn] = useState("");
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const setList = (k, i, f, v) => setD((s) => ({ ...s, [k]: s[k].map((it, idx) => (idx === i ? { ...it, [f]: v } : it)) }));

  const submit = async (e) => {
    e.preventDefault();
    const next = buildPayload(d);
    const base = buildPayload(toDraft(profile));
    const payload = {};
    Object.keys(next).forEach((k) => {
      if (JSON.stringify(next[k]) !== JSON.stringify(base[k])) payload[k] = next[k];
    });
    if (Object.keys(payload).length === 0) { onClose(); return; }
    setSaving(true);
    await onSave(payload);
    setSaving(false);
  };

  const renderList = (key) => {
    const schema = LIST_SCHEMAS[key];
    return (
      <div className="sp3-list-editor">
        {d[key].map((item, i) => (
          <div key={i} className="sp3-list-item">
            <div className="sp3-list-item-head">
              <b>{schema.label} {i + 1}</b>
              <button type="button" onClick={() => setD((s) => ({ ...s, [key]: s[key].filter((_, idx) => idx !== i) }))} aria-label="Remove"><Trash2 size={14} /></button>
            </div>
            <div className="sp3-form-grid">
              {schema.fields.map(([f, label, kind]) => (
                <Field key={f} label={label} wide={kind === "area" || f === "title"}>
                  {kind === "area"
                    ? <textarea rows={3} value={item[f] || ""} onChange={(e) => setList(key, i, f, e.target.value)} />
                    : <input value={item[f] || ""} onChange={(e) => setList(key, i, f, e.target.value)} />}
                </Field>
              ))}
            </div>
          </div>
        ))}
        <button type="button" className="sp3-btn ghost sp3-add-list-btn" onClick={() => setD((s) => ({ ...s, [key]: [...s[key], { ...schema.empty }] }))}>
          <Plus size={15} />Add {schema.label.toLowerCase()}
        </button>
      </div>
    );
  };

  return (
    <div className="sp3-backdrop right" onClick={onClose}>
      <form className="sp3-drawer" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label="Edit profile">
        <header className="sp3-drawer-head">
          <div><h2>Edit profile</h2><p>Only the fields you change are sent to your student record.</p></div>
          <button type="button" className="sp3-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>
        <div className="sp3-drawer-tabs">
          {EDITOR_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              onClick={(e) => {
                setTab(id);
                e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
              }}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
        <div className="sp3-drawer-body" key={tab}>
          {tab === "basic" && (
            <div className="sp3-form-grid">
              <Field label="Full name" wide><input value={d.fullName || ""} onChange={(e) => set("fullName", e.target.value)} /></Field>
              <Field label="Tagline" wide><input value={d.tagline || ""} maxLength={90} placeholder="One line about you" onChange={(e) => set("tagline", e.target.value)} /></Field>
              <Field label="Headline" wide><input value={d.headline || ""} onChange={(e) => set("headline", e.target.value)} /></Field>
              <Field label="Date of birth">
                <input type="date" value={d.dateOfBirth || ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Gender">
                <select value={d.gender || ""} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Phone"><input value={d.phone || ""} inputMode="tel" onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Enrollment number"><input value={d.enrollmentNo || ""} onChange={(e) => set("enrollmentNo", e.target.value)} /></Field>
              <Field label="Student ID"><input value={d.studentId || ""} placeholder="e.g., SUB2024CSE042" onChange={(e) => set("studentId", e.target.value)} /></Field>
              <Field label="Section"><input value={d.section || ""} placeholder="e.g., A" maxLength={10} onChange={(e) => set("section", e.target.value)} /></Field>
              <Field label="Academic session"><input value={d.academicSession || ""} placeholder="e.g., 2024-2027" onChange={(e) => set("academicSession", e.target.value)} /></Field>
              <Field label="Admission year"><input value={d.admissionYear || ""} placeholder="e.g., 2024" maxLength={10} onChange={(e) => set("admissionYear", e.target.value)} /></Field>
              <Field label="Branch">
                <select value={d.branch} onChange={(e) => set("branch", e.target.value)}>
                  {BRANCH_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </Field>
              <Field label="Academic year">
                <select value={d.academicYear} onChange={(e) => set("academicYear", e.target.value)}>
                  {ACADEMIC_YEAR_CHOICES.map((y) => <option key={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="Semester">
                <select value={d.semester} onChange={(e) => set("semester", e.target.value)}>
                  {SEMESTER_CHOICES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="SGPA"><input type="number" step="0.01" min="0" max="10" value={d.sgpa ?? ""} onChange={(e) => set("sgpa", e.target.value)} /></Field>
              <Field label="Attendance %"><input type="number" min="0" max="100" value={d.attendancePercentage ?? ""} onChange={(e) => set("attendancePercentage", e.target.value)} /></Field>
              <Field label="Residential address" wide>
                <input value={d.address || ""} placeholder="House / Flat, Street / Village" onChange={(e) => set("address", e.target.value)} />
              </Field>
              <Field label="City"><input value={d.city || ""} placeholder="e.g., Meerut" onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="State"><input value={d.state || ""} placeholder="e.g., Uttar Pradesh" onChange={(e) => set("state", e.target.value)} /></Field>
              <Field label="PIN Code"><input value={d.pincode || ""} placeholder="e.g., 250005" maxLength={10} onChange={(e) => set("pincode", e.target.value)} /></Field>
              <Field label="Location (Display)" wide><input value={d.location || ""} placeholder="City, State" onChange={(e) => set("location", e.target.value)} /></Field>
              <Field label="Emergency contact name"><input value={d.emergencyContactName || ""} placeholder="Parent / Guardian name" onChange={(e) => set("emergencyContactName", e.target.value)} /></Field>
              <Field label="Emergency contact relation"><input value={d.emergencyContactRelation || ""} placeholder="e.g., Father, Mother, Guardian" onChange={(e) => set("emergencyContactRelation", e.target.value)} /></Field>
              <Field label="Emergency contact phone"><input value={d.emergencyContactPhone || ""} inputMode="tel" placeholder="Mobile number" onChange={(e) => set("emergencyContactPhone", e.target.value)} /></Field>
            </div>
          )}
          {tab === "about" && (
            <div className="sp3-form-grid">
              <Field label="Bio" wide><textarea rows={6} value={d.bio || ""} onChange={(e) => set("bio", e.target.value)} /></Field>
              <Field label="Career objective" wide><textarea rows={4} value={d.careerObjective || ""} onChange={(e) => set("careerObjective", e.target.value)} /></Field>
            </div>
          )}
          {tab === "social" && (
            <div className="sp3-form-grid">
              {SOCIALS.map(({ key, label }) => (
                <Field key={key} label={label} wide>
                  <input value={d.socialLinks[key] || ""} placeholder="https://"
                    onChange={(e) => setD((s) => ({ ...s, socialLinks: { ...s.socialLinks, [key]: e.target.value } }))} />
                </Field>
              ))}
            </div>
          )}
          {tab === "skills" && (
            <div className="sp3-skills-editor">
              <div className="sp3-skill-form">
                <input
                  value={skillIn}
                  placeholder="Type a skill and press Enter"
                  aria-label="New skill"
                  onChange={(e) => setSkillIn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const v = skillIn.trim();
                    if (v && !d.skills.some((s) => s.toLowerCase() === v.toLowerCase())) set("skills", [...d.skills, v]);
                    setSkillIn("");
                  }}
                />
                <button
                  type="button"
                  className="sp3-btn primary sp3-add-skill-btn"
                  onClick={() => {
                    const v = skillIn.trim();
                    if (v && !d.skills.some((s) => s.toLowerCase() === v.toLowerCase())) set("skills", [...d.skills, v]);
                    setSkillIn("");
                  }}
                  disabled={!skillIn.trim()}
                >
                  <Plus size={15} />Add
                </button>
              </div>
              <div className="sp3-skill-cloud">
                {d.skills.map((s) => (
                  <span key={s} className="sp3-skill">{s}
                    <button type="button" onClick={() => set("skills", d.skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {LIST_SCHEMAS[tab] && renderList(tab)}
        </div>
        <footer className="sp3-drawer-foot">
          <button type="button" className="sp3-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="sp3-btn primary" disabled={saving}>
            {saving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}{saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}