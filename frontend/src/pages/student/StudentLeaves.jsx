import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  FileText,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Plus,
  Search,
  Download,
  Printer,
  Paperclip,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  User,
  Award,
  AlertTriangle,
  HeartPulse,
  Building2,
  Phone,
  Eye,
  LayoutGrid,
  List,
  CalendarDays,
  RefreshCw,
  Info,
  UploadCloud,
  BarChart3,
  Save
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentLeaves.css";

/* ==========================================================================
   CONSTANTS & CONFIGURATION
   ========================================================================== */

const LEAVE_TYPES = [
  {
    id: "Medical",
    name: "Medical Leave",
    category: "Health & Recovery",
    description: "Doctor prescription, illness, hospitalization, or post-operative recovery.",
    icon: HeartPulse,
    accentClass: "type-medical",
    badgeLabel: "Medical",
    maxRecommendedDays: 14,
    requiresProof: true
  },
  {
    id: "Academic / Duty",
    name: "Academic / Duty Leave",
    category: "Institutional Duty",
    description: "Representing university in hackathons, academic conferences, sports meets, or state seminars.",
    icon: Award,
    accentClass: "type-duty",
    badgeLabel: "On Duty",
    maxRecommendedDays: 7,
    requiresProof: true
  },
  {
    id: "Casual",
    name: "Casual Leave",
    category: "Personal & Domestic",
    description: "Personal travel, scheduled family events, or domestic obligations.",
    icon: CalendarDays,
    accentClass: "type-casual",
    badgeLabel: "Casual",
    maxRecommendedDays: 3,
    requiresProof: false
  },
  {
    id: "Personal",
    name: "Personal Leave",
    category: "Private Matters",
    description: "Urgent personal affairs, civil examinations, or documented individual commitments.",
    icon: User,
    accentClass: "type-personal",
    badgeLabel: "Personal",
    maxRecommendedDays: 4,
    requiresProof: false
  },
  {
    id: "Emergency",
    name: "Family Emergency",
    category: "Critical Situations",
    description: "Critical family medical emergencies, bereavement, or sudden unforeseen events.",
    icon: AlertTriangle,
    accentClass: "type-emergency",
    badgeLabel: "Emergency",
    maxRecommendedDays: 5,
    requiresProof: false
  }
];

const PRESET_REASONS = {
  "Medical": [
    "Viral fever and dehydration; advised bed rest by consulting physician.",
    "Dental root canal surgery with post-op medication rest.",
    "Severe migraine and eye strain requiring clinical recovery.",
    "Orthopedic injury requiring physical therapy and reduced campus mobility."
  ],
  "Academic / Duty": [
    "Official delegation representing Subharti Polytechnic at National Level Hackathon.",
    "Presenting research paper on Edge AI at IEEE Student Technical Symposium.",
    "Inter-university state athletics meet delegation sanctioned by Sports Board.",
    "Industry technical training workshop sanctioned under department curriculum."
  ],
  "Casual": [
    "Attending sibling's formal wedding ceremony in hometown.",
    "Family relocation and essential domestic property documentation.",
    "Pre-scheduled family religious pilgrimage.",
    "Urgent biometric passport verification appointment at regional passport seva kendra."
  ],
  "Personal": [
    "Appearing for State Polytechnic Competitive Scholarship Examination.",
    "Documented family commitment requiring presence in hometown.",
    "Urgent personal banking and administrative verification."
  ],
  "Emergency": [
    "Critical medical emergency of immediate family member requiring hospital care.",
    "Unforeseen household domestic emergency requiring immediate travel.",
    "Bereavement in immediate family."
  ]
};

const PAGE_SIZE = 8;
const DRAFT_KEY = "collegeos_leave_draft_v1";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const REASON_MIN = 10;
const REASON_MAX = 500;

/* ==========================================================================
   HELPERS
   ========================================================================== */

// Local (not UTC) yyyy-mm-dd so IST users never get a shifted date.
function toInputDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayKey(v) {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : toInputDate(d);
}

function calculateLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

function formatRefId(leave) {
  if (!leave) return "LV-2026-0000";
  const rawId = String(leave._id || leave.id || "");
  const suffix = rawId ? rawId.slice(-4).toUpperCase() : "0000";
  return `LV-2026-${suffix}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return formatDate(dateStr);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getStatus(leave) {
  const st = String(leave?.status || "pending").toLowerCase();
  return st === "approved" || st === "rejected" ? st : "pending";
}

function typeKey(v) {
  return String(v || "").toLowerCase().replace(/[^a-z]/g, "");
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function safeCsvCell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// Pointer-follow glow used by cards (sets CSS vars, no re-render).
function handleSpotlight(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function useCountUp(target, duration = 700) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || prev.current === target) {
      setVal(target);
      prev.current = target;
      return undefined;
    }
    const from = prev.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

function AnimatedNumber({ value }) {
  const v = useCountUp(value);
  return <>{v}</>;
}

function StatusBadge({ status, size = 13, label }) {
  const map = {
    approved: { Icon: CheckCircle2, text: "Sanctioned" },
    rejected: { Icon: XCircle, text: "Declined" },
    pending: { Icon: Clock, text: "Pending Review" }
  };
  const { Icon, text } = map[status] || map.pending;
  return (
    <span className={`status-badge-pill badge-${status}`}>
      <Icon size={size} />
      <span>{label || text}</span>
    </span>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function StudentLeaves({ showToast, currentUser, summary }) {
  // 1. Data states
  const [leavesList, setLeavesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 2. Active filters & search
  const [activeFilter, setActiveFilter] = useState("all"); // all | pending | approved | rejected
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("newest"); // newest | oldest | duration
  const [viewMode, setViewMode] = useState("table"); // table | cards
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 3. Application form
  const [leaveType, setLeaveType] = useState("Medical");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const fileInputRef = useRef(null);
  const wizardRef = useRef(null);
  const searchRef = useRef(null);
  const closeBtnRef = useRef(null);

  // 4. Detail drawer
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Student profile information
  const studentInfo = useMemo(() => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("collegeos_auth_user") || "{}");
    } catch {
      storedUser = null;
    }
    const user = currentUser || storedUser || {};
    const sum = summary || {};
    return {
      name: user.fullName || "Diploma Candidate",
      email: user.email || "student@subharti.edu.in",
      rollNo: user.rollNumber || user.enrollmentNo || "2026-CSE-042",
      branch: user.branch || sum.branch || "Computer Science & Engineering",
      semester: user.semester || sum.semester || "Semester 5 (Final Year)",
      session: "Academic Year 2026-27",
      campus: "Subharti Polytechnic Campus"
    };
  }, [currentUser, summary]);

  const initials = useMemo(
    () =>
      studentInfo.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ST",
    [studentInfo.name]
  );
  const firstName = studentInfo.name.split(" ")[0];

  // Fetch leave records from backend
  const fetchLeaves = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await authApi.getLeaves();
        if (res?.leaves) {
          setLeavesList(res.leaves);
        } else if (Array.isArray(res)) {
          setLeavesList(res);
        } else {
          setLeavesList([]);
        }
      } catch (err) {
        console.error("[StudentLeaves] Fetch error:", err);
        showToast?.(err.message || "Failed to load leave records.", true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Draft restore (once) + debounced autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d && (d.reason || d.startDate || d.endDate || d.emergencyContact)) {
        if (LEAVE_TYPES.some((t) => t.id === d.leaveType)) setLeaveType(d.leaveType);
        setStartDate(d.startDate || "");
        setEndDate(d.endDate || "");
        setReason(d.reason || "");
        setEmergencyContact(d.emergencyContact || "");
        setDraftRestored(true);
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (reason || startDate || endDate || emergencyContact) {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ leaveType, startDate, endDate, reason, emergencyContact })
          );
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        /* storage unavailable */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [leaveType, startDate, endDate, reason, emergencyContact]);

  // Reset pagination when the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter, selectedCategory, searchQuery, sortKey, viewMode]);

  // Keyboard: Esc closes layers, "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (confirmStep && !isSubmitting) setConfirmStep(false);
        else if (selectedLeave) setSelectedLeave(null);
        return;
      }
      if (e.key === "/" && !selectedLeave && !confirmStep) {
        const tag = document.activeElement?.tagName || "";
        if (!/INPUT|TEXTAREA|SELECT/.test(tag)) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmStep, isSubmitting, selectedLeave]);

  // Lock page scroll while a dialog is open
  const overlayOpen = !!selectedLeave || confirmStep;
  useEffect(() => {
    if (!overlayOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (selectedLeave) closeBtnRef.current?.focus();
  }, [selectedLeave]);

  // Real-time calculated duration
  const requestedDays = useMemo(() => calculateLeaveDays(startDate, endDate), [startDate, endDate]);
  const typeMeta = useMemo(() => LEAVE_TYPES.find((t) => t.id === leaveType) || LEAVE_TYPES[0], [leaveType]);

  // Overlap with an existing (non-declined) application
  const conflict = useMemo(() => {
    if (!startDate || !endDate || requestedDays === 0) return null;
    return (
      leavesList.find((l) => {
        if (getStatus(l) === "rejected") return false;
        const ls = dayKey(l.startDate);
        const le = dayKey(l.endDate);
        return ls && le && startDate <= le && endDate >= ls;
      }) || null
    );
  }, [leavesList, startDate, endDate, requestedDays]);

  // Required-step completion for progress bar
  const formProgress = useMemo(() => {
    const done = 1 + (requestedDays > 0 ? 1 : 0) + (reason.trim().length >= REASON_MIN ? 1 : 0);
    return Math.round((done / 3) * 100);
  }, [requestedDays, reason]);

  // KPI statistics from real database leaves
  const stats = useMemo(() => {
    const total = leavesList.length;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    let totalApprovedDays = 0;

    leavesList.forEach((l) => {
      const st = getStatus(l);
      if (st === "approved") {
        approved++;
        totalApprovedDays += calculateLeaveDays(l.startDate, l.endDate);
      } else if (st === "rejected") {
        rejected++;
      } else {
        pending++;
      }
    });

    return { total, approved, pending, rejected, totalApprovedDays };
  }, [leavesList]);

  // Approved days split by classification
  const breakdown = useMemo(() => {
    const map = {};
    leavesList.forEach((l) => {
      if (getStatus(l) !== "approved") return;
      const k = typeKey(l.leaveType);
      map[k] = (map[k] || 0) + calculateLeaveDays(l.startDate, l.endDate);
    });
    const segs = LEAVE_TYPES.map((t) => ({
      id: t.id,
      key: typeKey(t.id),
      name: t.badgeLabel,
      days: map[typeKey(t.id)] || 0
    })).filter((s) => s.days > 0);
    const total = segs.reduce((a, s) => a + s.days, 0);
    return { segs, total };
  }, [leavesList]);

  const nextLeave = useMemo(() => {
    const today = toInputDate(new Date());
    return (
      leavesList
        .filter((l) => getStatus(l) === "approved" && dayKey(l.endDate) >= today)
        .sort((a, b) => dayKey(a.startDate).localeCompare(dayKey(b.startDate)))[0] || null
    );
  }, [leavesList]);

  // Filtered & sorted ledger
  const filteredLeaves = useMemo(() => {
    let result = [...leavesList];

    if (activeFilter !== "all") {
      result = result.filter((l) => getStatus(l) === activeFilter.toLowerCase());
    }

    if (selectedCategory !== "all") {
      result = result.filter((l) => (l.leaveType || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        const ref = formatRefId(l).toLowerCase();
        const rsn = (l.reason || "").toLowerCase();
        const type = (l.leaveType || "").toLowerCase();
        const remarks = (l.reviewerRemarks || "").toLowerCase();
        return ref.includes(q) || rsn.includes(q) || type.includes(q) || remarks.includes(q);
      });
    }

    result.sort((a, b) => {
      if (sortKey === "newest") {
        return new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate);
      }
      if (sortKey === "oldest") {
        return new Date(a.createdAt || a.startDate) - new Date(b.createdAt || b.startDate);
      }
      if (sortKey === "duration") {
        return calculateLeaveDays(b.startDate, b.endDate) - calculateLeaveDays(a.startDate, a.endDate);
      }
      return 0;
    });

    return result;
  }, [leavesList, activeFilter, selectedCategory, searchQuery, sortKey]);

  const visibleLeaves = useMemo(() => filteredLeaves.slice(0, visibleCount), [filteredLeaves, visibleCount]);
  const hasActiveFilters = !!searchQuery || selectedCategory !== "all" || activeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setActiveFilter("all");
  };

  // Copy reference ID
  const handleCopyRef = (refId, e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(refId);
    setCopiedId(refId);
    showToast?.(`Reference ID ${refId} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Quick preset duration (local-date safe)
  const handleAddPresetDays = (days) => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    if (!startDate) setStartDate(toInputDate(start));
    setEndDate(toInputDate(end));
  };

  // File handling
  const processFile = (file) => {
    if (!file) return;
    const okType =
      ["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
      /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!okType) {
      showToast?.("Only PDF, PNG or JPG documents are allowed.", true);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showToast?.("Document size exceeds maximum 10MB limit.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type,
        dataUrl: reader.result
      });
      showToast?.(`Proof attached: ${file.name}`);
    };
    reader.onerror = () => showToast?.("Could not read the selected file.", true);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
    if (e.target) e.target.value = "";
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer?.files?.[0]);
  };

  const resetForm = () => {
    setReason("");
    setStartDate("");
    setEndDate("");
    setEmergencyContact("");
    setDraftRestored(false);
    handleRemoveFile();
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const scrollToWizard = () => {
    const w = wizardRef.current;
    w?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    setTimeout(() => w?.querySelector(".type-select-card.is-selected")?.focus({ preventScroll: true }), 350);
  };

  // Validation (same rules as before)
  const validateForm = () => {
    if (!startDate || !endDate) {
      showToast?.("Please choose both From and Till leave dates.", true);
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showToast?.("From Date cannot be after Till Date.", true);
      return false;
    }
    if (!reason.trim()) {
      showToast?.("Please enter a detailed reason for your leave sanction.", true);
      return false;
    }
    if (reason.trim().length < REASON_MIN) {
      showToast?.("Reason should be at least 10 characters describing your requirement.", true);
      return false;
    }
    return true;
  };

  // Step 1: validate and open the review dialog
  const handleSubmitLeave = (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    setConfirmStep(true);
  };

  // Step 2: send to backend (payload unchanged)
  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
        emergencyContact: emergencyContact.trim(),
        attachmentUrl: attachedFile?.dataUrl || ""
      };

      const res = await authApi.applyLeave(payload);
      showToast?.(res?.message || "Leave application transmitted to Department Dean & HOD!");

      resetForm();
      setConfirmStep(false);
      fetchLeaves(true);
    } catch (err) {
      console.error("[StudentLeaves] Submit error:", err);
      showToast?.(err.message || "Failed to submit leave application.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV export of the currently filtered ledger
  const handleExportCsv = () => {
    if (!filteredLeaves.length) {
      showToast?.("No leave records to export.", true);
      return;
    }
    const header = ["Reference", "Category", "From", "Till", "Days", "Status", "Reason", "Reviewer Remarks", "Applied On"];
    const rows = filteredLeaves.map((l) => [
      formatRefId(l),
      l.leaveType || "General",
      dayKey(l.startDate),
      dayKey(l.endDate),
      calculateLeaveDays(l.startDate, l.endDate),
      getStatus(l),
      l.reason || "",
      l.reviewerRemarks || "",
      dayKey(l.createdAt)
    ]);
    const csv = [header, ...rows].map((r) => r.map(safeCsvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-ledger-${toInputDate(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast?.(`Exported ${rows.length} record${rows.length !== 1 ? "s" : ""} to CSV.`);
  };

  // Print Gate Pass / Sanction Receipt (print CSS isolates the pass)
  const handlePrintReceipt = () => {
    window.print();
  };

  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  const kpiCards = [
    { key: "total", filter: "all", cls: "kpi-total", Icon: FileText, value: stats.total, label: "Total Submissions", note: "All recorded applications", title: "Filter: All Applications", meter: stats.total ? 100 : 0 },
    { key: "approved", filter: "approved", cls: "kpi-approved", Icon: CheckCircle2, value: stats.approved, label: "Sanctioned Leaves", note: stats.total > 0 ? `${pct(stats.approved)}% approval rate` : "Approved by Dean", title: "Filter: Sanctioned Leaves", meter: pct(stats.approved) },
    { key: "pending", filter: "pending", cls: "kpi-pending", Icon: Clock, value: stats.pending, label: "Pending Review", note: "Awaiting HOD verification", title: "Filter: Pending Applications", meter: pct(stats.pending) },
    { key: "rejected", filter: "rejected", cls: "kpi-rejected", Icon: XCircle, value: stats.rejected, label: "Declined Requests", note: "Audit remarks logged", title: "Filter: Declined Applications", meter: pct(stats.rejected) },
    { key: "days", filter: null, cls: "kpi-days", Icon: Calendar, value: stats.totalApprovedDays, label: "Approved Days", note: "Academic hours exempted", title: "Total sanctioned days", meter: 0 }
  ];

  const selStatus = selectedLeave ? getStatus(selectedLeave) : "pending";

  return (
    <div className="student-role-view student-leaves-page">
      {/* ====================================================================
          1. HERO HEADER
          ==================================================================== */}
      <header className="std-leaves-hero-header">
        <div className="hero-aurora aurora-a" aria-hidden="true" />
        <div className="hero-aurora aurora-b" aria-hidden="true" />
        <div className="hero-sheen" aria-hidden="true" />
        <div className="hero-content">
          <div className="student-profile-strip">
            <div className="std-avatar-box">
              <span className="std-avatar-text">{initials}</span>
              <span className="std-live-dot" title="Authenticated Session Live" />
            </div>
            <div className="std-profile-meta">
              <div className="std-profile-tags">
                <span className="std-pill std-pill-cyan">
                  <ShieldCheck size={12} />
                  {studentInfo.rollNo}
                </span>
                <span className="std-pill std-pill-indigo">
                  <Building2 size={12} />
                  {studentInfo.branch}
                </span>
                <span className="std-pill std-pill-amber">
                  <Clock size={12} />
                  {studentInfo.semester}
                </span>
              </div>
              <p className="hero-greeting">
                {getGreeting()}, {firstName}
              </p>
              <h1 className="hero-title">
                Academic & Medical Leave Portal
                <Sparkles size={20} className="sparkle-icon" />
              </h1>
              <p className="hero-subtitle">
                Official institutional leave sanction system. Direct review by Head of Department,
                Dean of Academic Affairs, and Campus Attendance Officer.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-refresh-leaves"
              onClick={() => fetchLeaves(true)}
              disabled={refreshing}
              title="Synchronize records with university database"
              aria-label="Refresh records"
            >
              <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
              <span>{refreshing ? "Synchronizing..." : "Sync Ledger"}</span>
            </button>

            <button type="button" className="btn-apply-leave-primary" onClick={scrollToWizard}>
              <Plus size={18} />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. KPI CARDS
          ==================================================================== */}
      <section className="std-leaves-kpi-grid" aria-label="Leave Overview Statistics">
        {kpiCards.map((k, i) => {
          const Icon = k.Icon;
          const clickable = !!k.filter;
          const isActive = clickable && activeFilter === k.filter;
          return (
            <div
              key={k.key}
              className={`kpi-card ${k.cls} ${isActive ? "kpi-active" : ""} ${clickable ? "is-clickable" : ""}`}
              style={{ "--i": i }}
              onMouseMove={handleSpotlight}
              onClick={clickable ? () => setActiveFilter(k.filter) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveFilter(k.filter);
                      }
                    }
                  : undefined
              }
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-pressed={clickable ? isActive : undefined}
              title={k.title}
            >
              <div className="kpi-icon-container">
                <Icon size={22} />
              </div>
              <div className="kpi-data-block">
                <span className="kpi-number">
                  <AnimatedNumber value={k.value} />
                </span>
                <span className="kpi-label">{k.label}</span>
                <span className="kpi-micro-note">{k.note}</span>
              </div>
              {clickable && (
                <span className="kpi-meter" aria-hidden="true">
                  <span style={{ width: `${k.meter}%` }} />
                </span>
              )}
            </div>
          );
        })}
      </section>

      {/* ====================================================================
          3. MAIN PANEL: WIZARD + LEDGER
          ==================================================================== */}
      <div className="std-leaves-main-layout">
        {/* ---------------- LEFT: APPLICATION WIZARD ---------------- */}
        <section className="std-leave-wizard-card" ref={wizardRef} aria-label="New Leave Application Form">
          <div className="card-top-header">
            <div className="header-badge-row">
              <span className="form-kicker-pill">
                <Sparkles size={13} />
                HOD Direct Routing
              </span>
              <span className="clause-tag">Regulation Clause 4.2</span>
            </div>
            <h2 className="form-main-heading">Apply for Official Leave</h2>
            <p className="form-main-desc">
              Applications are digitally logged and dispatched instantly to your Head of Department.
            </p>

            <div className="form-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={formProgress} aria-label="Form completion">
              <div className="form-progress-track">
                <div className={`form-progress-fill ${formProgress === 100 ? "is-done" : ""}`} style={{ width: `${formProgress}%` }} />
              </div>
              <span className="form-progress-label">
                {formProgress === 100 ? "Ready to submit" : `${formProgress}% complete`}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitLeave} className="leave-form-body" noValidate>
            {draftRestored && (
              <div className="draft-banner" role="status">
                <Save size={14} />
                <span>Your unsent draft was restored.</span>
                <button type="button" className="draft-dismiss" onClick={resetForm}>
                  Discard
                </button>
              </div>
            )}

            {/* Step 1: Classification */}
            <div className="form-section-block">
              <span className="section-title-label" id="leave-type-label">
                <span className="step-num">1</span>
                <span>Select Leave Classification</span>
                <span className="required-star">*</span>
              </span>

              <div className="classification-cards-grid" role="radiogroup" aria-labelledby="leave-type-label">
                {LEAVE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = leaveType === type.id;
                  return (
                    <div
                      key={type.id}
                      className={`type-select-card ${type.accentClass} ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setLeaveType(type.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setLeaveType(type.id);
                        }
                      }}
                    >
                      <div className="type-card-head">
                        <div className="type-card-icon">
                          <Icon size={18} />
                        </div>
                        <span className="type-card-badge">{type.badgeLabel}</span>
                      </div>
                      <div className="type-card-body">
                        <h4 className="type-name">{type.name}</h4>
                        <p className="type-desc">{type.description}</p>
                      </div>
                      {isSelected && (
                        <span className="type-card-check" aria-hidden="true">
                          <Check size={11} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Dates */}
            <div className="form-section-block">
              <div className="section-title-between">
                <span className="section-title-label">
                  <span className="step-num">2</span>
                  <span>Select Date Range</span>
                  <span className="required-star">*</span>
                </span>

                {requestedDays > 0 && (
                  <span className="duration-pill animate-pop" key={requestedDays}>
                    <Clock size={13} />
                    <strong>{requestedDays}</strong> Academic Day{requestedDays !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="date-pickers-row">
                <div className="date-field-group">
                  <label htmlFor="leave-start-date">From Date</label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input
                      id="leave-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="date-field-group">
                  <label htmlFor="leave-end-date">Till Date</label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input
                      id="leave-end-date"
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="quick-presets-row">
                <span className="presets-caption">Quick Presets:</span>
                {[
                  [1, "+1 Day (Today)"],
                  [2, "+2 Days"],
                  [3, "+3 Days"],
                  [7, "+1 Full Week"]
                ].map(([d, label]) => (
                  <button key={d} type="button" className="preset-chip" onClick={() => handleAddPresetDays(d)}>
                    {label}
                  </button>
                ))}
              </div>

              {requestedDays > 0 && (
                <div className={`duration-gauge ${requestedDays > typeMeta.maxRecommendedDays ? "is-over" : ""}`}>
                  <div className="duration-gauge-track">
                    <div
                      className="duration-gauge-fill"
                      style={{ width: `${Math.min(100, (requestedDays / typeMeta.maxRecommendedDays) * 100)}%` }}
                    />
                  </div>
                  <span className="gauge-label">
                    {requestedDays} / {typeMeta.maxRecommendedDays} recommended days for {typeMeta.badgeLabel}
                  </span>
                </div>
              )}

              {conflict && (
                <div className="form-advisory-box advisory-danger" role="alert">
                  <AlertTriangle size={15} />
                  <span>
                    These dates overlap with {formatRefId(conflict)} ({formatDate(conflict.startDate)} to{" "}
                    {formatDate(conflict.endDate)}), which is {getStatus(conflict) === "approved" ? "already sanctioned" : "still pending"}.
                  </span>
                </div>
              )}

              {requestedDays > 14 && (
                <div className="form-advisory-box">
                  <AlertCircle size={15} />
                  <span>
                    Leaves exceeding 14 calendar days require additional Dean & Medical Board
                    concurrence before exam hall eligibility is granted.
                  </span>
                </div>
              )}
            </div>

            {/* Step 3: Reason */}
            <div className="form-section-block">
              <div className="section-title-between">
                <label className="section-title-label" htmlFor="leave-reason">
                  <span className="step-num">3</span>
                  <span>Reason & Detailed Justification</span>
                  <span className="required-star">*</span>
                </label>
                <span className={`char-counter ${reason.length > REASON_MAX - 50 ? "near-limit" : ""}`}>
                  {reason.length} / {REASON_MAX}
                </span>
              </div>

              <textarea
                id="leave-reason"
                className="reason-textarea"
                rows={4}
                maxLength={REASON_MAX}
                placeholder="State the clinical diagnosis, event invitation, travel purpose, or personal circumstance..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />

              {reason.trim().length > 0 && reason.trim().length < REASON_MIN && (
                <span className="field-micro-hint hint-warn">
                  Add at least {REASON_MIN - reason.trim().length} more character
                  {REASON_MIN - reason.trim().length !== 1 ? "s" : ""}.
                </span>
              )}

              {PRESET_REASONS[leaveType] && (
                <div className="reason-suggestions-row">
                  <span className="suggestions-label">Suggestions:</span>
                  <div className="suggestions-scroll">
                    {PRESET_REASONS[leaveType].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="suggestion-tag-btn"
                        title={preset}
                        onClick={() => setReason(preset)}
                      >
                        {preset.length > 48 ? preset.substring(0, 48) + "..." : preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Proof & Contact */}
            <div className="form-section-block">
              <span className="section-title-label">
                <span className="step-num">4</span>
                <span>Supporting Proof & Emergency Contact</span>
                <span className="optional-tag">(Optional)</span>
              </span>

              {typeMeta.requiresProof && !attachedFile && (
                <div className="form-advisory-box advisory-info">
                  <Info size={15} />
                  <span>{typeMeta.name} is usually approved faster with a supporting document attached.</span>
                </div>
              )}

              <div className="supporting-row">
                <div
                  className="file-dropzone-box"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="leave-document-file"
                    className="file-input-hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />

                  {!attachedFile ? (
                    <label
                      htmlFor="leave-document-file"
                      className={`dropzone-label ${isDragging ? "is-dragging" : ""}`}
                    >
                      <div className="dropzone-icon-circle">
                        <UploadCloud size={20} />
                      </div>
                      <span className="dropzone-title">
                        {isDragging ? "Drop to attach" : "Attach Doctor Note / Proof"}
                      </span>
                      <span className="dropzone-hint">Drag & drop or browse. PDF, PNG, JPG (Max 10MB)</span>
                    </label>
                  ) : (
                    <div className="attached-file-pill">
                      {attachedFile.type?.startsWith("image/") ? (
                        <img className="attached-thumb" src={attachedFile.dataUrl} alt="" />
                      ) : (
                        <div className="attached-icon">
                          <FileText size={18} />
                        </div>
                      )}
                      <div className="attached-file-info">
                        <span className="file-name" title={attachedFile.name}>
                          {attachedFile.name}
                        </span>
                        <span className="file-size">{attachedFile.size}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-file"
                        onClick={handleRemoveFile}
                        title="Remove file"
                        aria-label="Remove attached file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="emergency-field-group">
                  <label htmlFor="leave-emergency-phone">Guardian / Emergency Contact</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input
                      id="leave-emergency-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                    />
                  </div>
                  <span className="field-micro-hint">For emergency verification by Dean</span>
                </div>
              </div>
            </div>

            {/* Live preview */}
            {(startDate || reason.trim()) && (
              <div className="live-preview-box">
                <div className="preview-header">
                  <Eye size={14} />
                  <span>Live HOD Dispatch Preview</span>
                </div>
                <div className="preview-card-inner">
                  <div className="preview-top-line">
                    <span className="preview-type-badge">{leaveType}</span>
                    <span className="preview-days-badge">
                      {requestedDays > 0 ? `${requestedDays} Academic Days` : "Dates pending"}
                    </span>
                  </div>
                  <div className="preview-dates">
                    <strong>{formatDate(startDate)}</strong> till <strong>{formatDate(endDate)}</strong>
                  </div>
                  <p className="preview-reason-text">
                    {reason.trim() || "Detailed reason will appear here..."}
                  </p>
                </div>
              </div>
            )}

            <div className="form-actions-row">
              <button type="button" className="btn-reset-form" onClick={resetForm}>
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                className="btn-submit-leave-final"
                disabled={isSubmitting || !startDate || !endDate || !reason.trim()}
              >
                <Send size={16} className={isSubmitting ? "spin-icon" : ""} />
                <span>{isSubmitting ? "Transmitting..." : "Review & Submit to HOD"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* ---------------- RIGHT: LEDGER ---------------- */}
        <section className="std-leave-history-section" aria-label="My Leave Applications Ledger">
          {/* Usage breakdown */}
          <div className="ledger-breakdown-card">
            <div className="breakdown-head">
              <span className="breakdown-title">
                <BarChart3 size={15} />
                Leave usage breakdown
              </span>
              <span className="breakdown-next">
                {nextLeave
                  ? `Next sanctioned leave: ${formatDate(nextLeave.startDate)}`
                  : "No upcoming sanctioned leave"}
              </span>
            </div>
            {breakdown.total > 0 ? (
              <>
                <div className="breakdown-bar" role="img" aria-label="Approved leave days by classification">
                  {breakdown.segs.map((s) => (
                    <span
                      key={s.id}
                      className={`breakdown-seg seg-${s.key}`}
                      style={{ flexGrow: s.days }}
                      title={`${s.name}: ${s.days} day${s.days !== 1 ? "s" : ""}`}
                    />
                  ))}
                </div>
                <div className="breakdown-legend">
                  {breakdown.segs.map((s) => (
                    <span key={s.id} className="legend-item">
                      <span className={`legend-dot seg-${s.key}`} />
                      {s.name}
                      <strong>{s.days}d</strong>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="breakdown-empty">
                Sanctioned leave days will be split by classification here once an application is approved.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="ledger-controls-card">
            <div className="controls-row-main">
              <div className="ledger-search-box">
                <Search size={16} className="search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by ID (e.g. 04D2), reason, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search leave applications"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd className="search-kbd" aria-hidden="true">/</kbd>
                )}
              </div>

              <div className="category-select-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-dropdown"
                  aria-label="Filter by classification"
                >
                  <option value="all">All Classifications</option>
                  <option value="Medical">Medical Leave</option>
                  <option value="Academic / Duty">Academic / Duty</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Personal">Personal Leave</option>
                  <option value="Emergency">Family Emergency</option>
                </select>
              </div>

              <div className="sort-select-wrap">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="sort-dropdown"
                  aria-label="Sort applications"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="duration">Longest Duration</option>
                </select>
              </div>

              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Dense Table View"
                  aria-label="Table view"
                  aria-pressed={viewMode === "table"}
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                  title="Visual Cards View"
                  aria-label="Cards view"
                  aria-pressed={viewMode === "cards"}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>

            <div className="ledger-filter-pills-row">
              <button
                type="button"
                className={`filter-pill-btn ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                <span>All Applications</span>
                <span className="pill-count">{stats.total}</span>
              </button>

              <button
                type="button"
                className={`filter-pill-btn pill-pending ${activeFilter === "pending" ? "active" : ""}`}
                onClick={() => setActiveFilter("pending")}
              >
                <Clock size={12} />
                <span>Pending Review</span>
                <span className="pill-count">{stats.pending}</span>
              </button>

              <button
                type="button"
                className={`filter-pill-btn pill-approved ${activeFilter === "approved" ? "active" : ""}`}
                onClick={() => setActiveFilter("approved")}
              >
                <CheckCircle2 size={12} />
                <span>Sanctioned</span>
                <span className="pill-count">{stats.approved}</span>
              </button>

              <button
                type="button"
                className={`filter-pill-btn pill-rejected ${activeFilter === "rejected" ? "active" : ""}`}
                onClick={() => setActiveFilter("rejected")}
              >
                <XCircle size={12} />
                <span>Declined</span>
                <span className="pill-count">{stats.rejected}</span>
              </button>

              {hasActiveFilters && (
                <button type="button" className="reset-all-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Result bar */}
          {!loading && leavesList.length > 0 && (
            <div className="ledger-result-bar">
              <span className="result-meta">
                Showing <strong>{visibleLeaves.length}</strong> of <strong>{filteredLeaves.length}</strong> record
                {filteredLeaves.length !== 1 ? "s" : ""}
              </span>
              <button type="button" className="btn-export-csv" onClick={handleExportCsv}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          )}

          {/* Ledger content */}
          <div className="ledger-container-box" aria-busy={loading}>
            {loading ? (
              <div className="ledger-skeleton" role="status" aria-label="Loading leave records">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div className="skeleton-row" key={i} style={{ "--i": i }}>
                    <span className="skeleton-line w-20" />
                    <span className="skeleton-line w-15" />
                    <span className="skeleton-line w-25" />
                    <span className="skeleton-line w-30" />
                    <span className="skeleton-line w-10" />
                  </div>
                ))}
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="ledger-empty-state">
                <div className="empty-icon-wrap">
                  <FileText size={32} />
                </div>
                <h3>No Leave Applications Found</h3>
                <p>
                  {leavesList.length === 0
                    ? "You haven't submitted any leave applications in the current academic semester."
                    : "No leave records match the active filter criteria."}
                </p>
                {leavesList.length === 0 ? (
                  <button type="button" className="btn-apply-empty" onClick={scrollToWizard}>
                    <Plus size={16} />
                    <span>Create First Leave Application</span>
                  </button>
                ) : (
                  <button type="button" className="btn-apply-empty" onClick={clearFilters}>
                    <RotateCcw size={16} />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            ) : viewMode === "table" ? (
              <div className="ledger-table-wrapper">
                <table className="std-leaves-data-table">
                  <thead>
                    <tr>
                      <th>Reference ID</th>
                      <th>Category</th>
                      <th>Leave Dates & Duration</th>
                      <th>Reason / Justification</th>
                      <th>Sanction Status</th>
                      <th>Authority Review</th>
                      <th className="th-action">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeaves.map((leave, idx) => {
                      const refId = formatRefId(leave);
                      const days = calculateLeaveDays(leave.startDate, leave.endDate);
                      const st = getStatus(leave);

                      return (
                        <tr
                          key={leave._id || leave.id || idx}
                          className={`ledger-row row-status-${st}`}
                          onClick={() => setSelectedLeave(leave)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setSelectedLeave(leave);
                          }}
                          tabIndex={0}
                          style={{ "--i": idx % PAGE_SIZE }}
                        >
                          <td className="td-ref-id" data-label="Reference">
                            <div className="td-ref-wrap">
                              <div className="ref-cell-inner">
                                <span className="ref-code">{refId}</span>
                                <button
                                  type="button"
                                  className="copy-ref-btn"
                                  onClick={(e) => handleCopyRef(refId, e)}
                                  title="Copy Reference ID"
                                  aria-label={`Copy reference ${refId}`}
                                >
                                  {copiedId === refId ? <Check size={12} className="copy-ok" /> : <Copy size={12} />}
                                </button>
                              </div>
                              <span className="ref-sub-date">{formatDate(leave.createdAt)}</span>
                            </div>
                          </td>

                          <td className="td-category" data-label="Category">
                            <span className={`category-tag tag-${typeKey(leave.leaveType)}`}>
                              {leave.leaveType || "General"}
                            </span>
                          </td>

                          <td className="td-dates" data-label="Dates">
                            <div className="td-dates-wrap">
                              <div className="dates-range">
                                <span>{formatDate(leave.startDate)}</span>
                                <span className="date-arrow">→</span>
                                <span>{formatDate(leave.endDate)}</span>
                              </div>
                              <span className="days-badge">
                                <Clock size={11} />
                                {days} Day{days !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </td>

                          <td className="td-reason" data-label="Reason">
                            <div className="td-reason-wrap">
                              <p className="reason-text-cell" title={leave.reason}>
                                {leave.reason}
                              </p>
                              {leave.attachmentUrl && (
                                <span className="proof-indicator" title="Supporting document attached">
                                  <Paperclip size={11} />
                                  Document Proof
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="td-status" data-label="Status">
                            <StatusBadge status={st} />
                          </td>

                          <td className="td-remarks" data-label="Review">
                            <span className="remarks-text" title={leave.reviewerRemarks}>
                              {leave.reviewerRemarks ||
                                (st === "approved"
                                  ? "Sanctioned on academic merit."
                                  : st === "rejected"
                                  ? "Declined by Dean."
                                  : "Awaiting HOD verification")}
                            </span>
                          </td>

                          <td className="td-action" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn-inspect-audit"
                              onClick={() => setSelectedLeave(leave)}
                              title="Inspect complete audit trail"
                            >
                              <Eye size={15} />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ledger-cards-grid">
                {visibleLeaves.map((leave, idx) => {
                  const refId = formatRefId(leave);
                  const days = calculateLeaveDays(leave.startDate, leave.endDate);
                  const st = getStatus(leave);

                  return (
                    <article
                      key={leave._id || leave.id || idx}
                      className={`leave-history-card card-status-${st}`}
                      onClick={() => setSelectedLeave(leave)}
                      onMouseMove={handleSpotlight}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedLeave(leave);
                      }}
                      tabIndex={0}
                      style={{ "--i": idx % PAGE_SIZE }}
                    >
                      <div className="card-top-line">
                        <span className="card-ref-badge">{refId}</span>
                        <StatusBadge status={st} size={12} />
                      </div>

                      <div className="card-type-row">
                        <span className="card-category-label">{leave.leaveType}</span>
                        <span className="card-days-pill">
                          <Clock size={11} />
                          {days} Day{days !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="card-dates-box">
                        <Calendar size={14} className="card-cal-icon" />
                        <span>
                          {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                        </span>
                      </div>

                      <p className="card-reason-snippet">{leave.reason}</p>

                      {leave.reviewerRemarks && (
                        <div className="card-remarks-box">
                          <strong>Dean Note:</strong> {leave.reviewerRemarks}
                        </div>
                      )}

                      <div className="card-footer-action">
                        <span className="card-submitted-time" title={formatDateTime(leave.createdAt)}>
                          Applied {timeAgo(leave.createdAt) || formatDate(leave.createdAt)}
                        </span>
                        <button
                          type="button"
                          className="btn-card-details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeave(leave);
                          }}
                        >
                          <span>View Audit</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && filteredLeaves.length > visibleCount && (
              <div className="load-more-wrap">
                <button type="button" className="btn-load-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  <ChevronDown size={15} />
                  <span>Show {Math.min(PAGE_SIZE, filteredLeaves.length - visibleCount)} more</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ====================================================================
          4. REVIEW & CONFIRM DIALOG
          ==================================================================== */}
      {confirmStep && (
        <div
          className="std-confirm-backdrop"
          onClick={() => !isSubmitting && setConfirmStep(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="std-confirm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-head">
              <span className="confirm-icon">
                <Send size={18} />
              </span>
              <div>
                <h3 id="confirm-title">Review before you submit</h3>
                <p>This goes straight to your Head of Department. Check the details below.</p>
              </div>
            </div>

            <div className="confirm-body">
              <div className="confirm-summary-grid">
                <div className="confirm-row">
                  <span>Classification</span>
                  <strong>{typeMeta.name}</strong>
                </div>
                <div className="confirm-row">
                  <span>Duration</span>
                  <strong>
                    {requestedDays} day{requestedDays !== 1 ? "s" : ""}
                  </strong>
                </div>
                <div className="confirm-row">
                  <span>From</span>
                  <strong>{formatDate(startDate)}</strong>
                </div>
                <div className="confirm-row">
                  <span>Till</span>
                  <strong>{formatDate(endDate)}</strong>
                </div>
                <div className="confirm-row">
                  <span>Emergency contact</span>
                  <strong>{emergencyContact.trim() || "Not provided"}</strong>
                </div>
                <div className="confirm-row">
                  <span>Proof</span>
                  <strong className="confirm-proof">{attachedFile ? attachedFile.name : "Not attached"}</strong>
                </div>
              </div>

              <div className="confirm-reason">
                <span>Reason</span>
                <p>{reason.trim()}</p>
              </div>

              {conflict && (
                <div className="form-advisory-box advisory-danger">
                  <AlertTriangle size={15} />
                  <span>
                    Heads up: these dates overlap with {formatRefId(conflict)}. You can still submit if this is intentional.
                  </span>
                </div>
              )}
              {typeMeta.requiresProof && !attachedFile && (
                <div className="form-advisory-box advisory-info">
                  <Info size={15} />
                  <span>No proof attached. The HOD may ask for one before sanctioning.</span>
                </div>
              )}
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn-confirm-edit"
                onClick={() => setConfirmStep(false)}
                disabled={isSubmitting}
              >
                Edit details
              </button>
              <button
                type="button"
                className="btn-confirm-send"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                <Send size={16} className={isSubmitting ? "spin-icon" : ""} />
                <span>{isSubmitting ? "Transmitting..." : "Submit to HOD"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. AUDIT DRAWER
          ==================================================================== */}
      {selectedLeave && (
        <div
          className="std-leave-drawer-backdrop"
          onClick={() => setSelectedLeave(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-drawer-title"
        >
          <div className="std-leave-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-left">
                <span className="drawer-ref-chip">
                  <ShieldCheck size={14} />
                  {formatRefId(selectedLeave)}
                </span>
                <StatusBadge
                  status={selStatus}
                  size={12}
                  label={
                    selStatus === "approved"
                      ? "Sanctioned by Dean"
                      : selStatus === "rejected"
                      ? "Declined"
                      : "Pending HOD Review"
                  }
                />
              </div>

              <div className="drawer-header-actions">
                <button
                  type="button"
                  className="drawer-icon-btn"
                  onClick={(e) => handleCopyRef(formatRefId(selectedLeave), e)}
                  title="Copy reference ID"
                  aria-label="Copy reference ID"
                >
                  {copiedId === formatRefId(selectedLeave) ? <Check size={16} className="copy-ok" /> : <Copy size={16} />}
                </button>
                <button
                  type="button"
                  className="drawer-icon-btn"
                  onClick={handlePrintReceipt}
                  title="Print official gate pass / receipt"
                  aria-label="Print receipt"
                >
                  <Printer size={16} />
                </button>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setSelectedLeave(null)}
                  title="Close audit drawer"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="drawer-scroll-body">
              <div>
                <h3 id="audit-drawer-title" className="drawer-title">
                  Leave Sanction Audit Record
                </h3>
                <p className="drawer-subtitle">
                  Official institutional sanction trail submitted under Subharti Polytechnic
                  Attendance Compliance Code.
                </p>
              </div>

              <div className="drawer-meta-card">
                <div className="meta-card-head">
                  <User size={16} />
                  <span>Applicant Information</span>
                </div>
                <div className="meta-grid">
                  <div className="meta-item">
                    <span className="meta-k">Candidate Name</span>
                    <strong className="meta-v">{selectedLeave.applicantName || studentInfo.name}</strong>
                  </div>
                  <div className="meta-item">
                    <span className="meta-k">Roll Number</span>
                    <strong className="meta-v">{studentInfo.rollNo}</strong>
                  </div>
                  <div className="meta-item">
                    <span className="meta-k">Department / Branch</span>
                    <strong className="meta-v">{selectedLeave.department || studentInfo.branch}</strong>
                  </div>
                  <div className="meta-item">
                    <span className="meta-k">Current Term</span>
                    <strong className="meta-v">{studentInfo.semester}</strong>
                  </div>
                </div>
              </div>

              <div className="drawer-meta-card">
                <div className="meta-card-head">
                  <Calendar size={16} />
                  <span>Leave Schedule & Duration</span>
                </div>
                <div className="meta-grid">
                  <div className="meta-item">
                    <span className="meta-k">Classification</span>
                    <span className="meta-v-highlight">{selectedLeave.leaveType}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-k">Total Academic Days</span>
                    <strong className="meta-v">
                      {calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate)} Days
                    </strong>
                  </div>
                  <div className="meta-item">
                    <span className="meta-k">Effective From</span>
                    <strong className="meta-v">{formatDate(selectedLeave.startDate)}</strong>
                  </div>
                  <div className="meta-item">
                    <span className="meta-k">Effective Till</span>
                    <strong className="meta-v">{formatDate(selectedLeave.endDate)}</strong>
                  </div>
                </div>
              </div>

              <div className="drawer-reason-box">
                <span className="reason-box-label">Statement of Reason</span>
                <div className="reason-box-content">
                  <p>{selectedLeave.reason}</p>
                </div>
              </div>

              {(selectedLeave.emergencyContact || selectedLeave.attachmentUrl) && (
                <div className="drawer-meta-card">
                  <div className="meta-card-head">
                    <Phone size={16} />
                    <span>Emergency & Verification</span>
                  </div>
                  <div className="meta-grid">
                    {selectedLeave.emergencyContact && (
                      <div className="meta-item">
                        <span className="meta-k">Emergency Contact</span>
                        <strong className="meta-v">{selectedLeave.emergencyContact}</strong>
                      </div>
                    )}
                    {selectedLeave.attachmentUrl && (
                      <div className="meta-item">
                        <span className="meta-k">Attached Verification</span>
                        <a
                          href={selectedLeave.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="proof-download-link"
                        >
                          <Paperclip size={13} />
                          <span>View Uploaded Proof</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval timeline */}
              <div className="drawer-timeline-card">
                <h4 className="timeline-heading">Institutional Approval Sequence</h4>
                <div className="timeline-steps-list">
                  <div className="timeline-step is-complete" style={{ "--s": 0 }}>
                    <div className="step-marker-line">
                      <div className="step-circle">
                        <Check size={12} />
                      </div>
                      <div className="step-connector" />
                    </div>
                    <div className="step-info">
                      <h5 className="step-title">Application Transmitted</h5>
                      <span className="step-time">{formatDateTime(selectedLeave.createdAt)}</span>
                      <p className="step-desc">
                        Logged by {selectedLeave.applicantName || studentInfo.name} via Student Gateway.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`timeline-step ${selStatus !== "pending" ? "is-complete" : "is-active"}`}
                    style={{ "--s": 1 }}
                  >
                    <div className="step-marker-line">
                      <div className="step-circle">
                        {selStatus === "approved" ? (
                          <Check size={12} />
                        ) : selStatus === "rejected" ? (
                          <X size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                      </div>
                      <div className="step-connector" />
                    </div>
                    <div className="step-info">
                      <h5 className="step-title">Department HOD Scrutiny</h5>
                      <span className="step-time">
                        {selectedLeave.updatedAt && selStatus !== "pending"
                          ? formatDateTime(selectedLeave.updatedAt)
                          : "In Scrutiny Queue"}
                      </span>
                      <p className="step-desc">
                        Department of {selectedLeave.department || "CSE"} review under Attendance Rules.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`timeline-step ${
                      selStatus === "approved" ? "is-complete" : selStatus === "rejected" ? "is-rejected" : "is-pending"
                    }`}
                    style={{ "--s": 2 }}
                  >
                    <div className="step-marker-line">
                      <div className="step-circle">
                        {selStatus === "approved" ? (
                          <ShieldCheck size={12} />
                        ) : selStatus === "rejected" ? (
                          <XCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                      </div>
                    </div>
                    <div className="step-info">
                      <h5 className="step-title">Dean Sanction & Gate Pass Issuance</h5>
                      <span className="step-time">
                        {selStatus === "approved"
                          ? "Official Sanction Enforced"
                          : selStatus === "rejected"
                          ? "Application Declined"
                          : "Pending Final Sanction"}
                      </span>
                      <p className="step-desc">
                        {selectedLeave.reviewerRemarks ||
                          (selStatus === "approved"
                            ? "Sanctioned on institutional merit. Attendance exemption credited."
                            : selStatus === "rejected"
                            ? "Declined by Academic Review Board."
                            : "Sanction pass will be generated upon HOD endorsement.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Printable gate pass */}
              <div className="print-gate-pass-box">
                <div className="pass-header">
                  <div className="pass-logo-badge">SUBHARTI POLYTECHNIC</div>
                  <div className="pass-serial">{formatRefId(selectedLeave)}</div>
                </div>
                <div className="pass-body">
                  <div className="pass-row">
                    <span>STUDENT:</span> <strong>{selectedLeave.applicantName || studentInfo.name}</strong>
                  </div>
                  <div className="pass-row">
                    <span>ROLL NO:</span> <strong>{studentInfo.rollNo}</strong>
                  </div>
                  <div className="pass-row">
                    <span>BRANCH:</span> <strong>{selectedLeave.department || studentInfo.branch}</strong>
                  </div>
                  <div className="pass-row">
                    <span>DATES:</span>{" "}
                    <strong>
                      {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
                    </strong>
                  </div>
                  <div className="pass-row">
                    <span>STATUS:</span>{" "}
                    <strong className={`pass-status pass-${selStatus}`}>{selStatus.toUpperCase()}</strong>
                  </div>
                </div>
                <div className="pass-footer">
                  <span>Authorized by Dean Academic Affairs • SVSU Campus</span>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn-drawer-print" onClick={handlePrintReceipt}>
                <Printer size={15} />
                <span>Print Official Receipt</span>
              </button>

              <button type="button" className="btn-drawer-close" onClick={() => setSelectedLeave(null)}>
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}