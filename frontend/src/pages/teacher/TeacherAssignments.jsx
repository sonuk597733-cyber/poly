import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Plus,
  Send,
  Clock,
  AlertCircle,
  ClipboardList,
  Calendar,
  Layers,
  X,
  RefreshCw,
  Search,
  Eye,
  Award,
  Download,
  ExternalLink,
  Paperclip,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Trash2,
  CheckCheck,
  TrendingUp,
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Printer,
  FileSpreadsheet,
  Save,
  LayoutGrid,
  List,
  ArrowUpDown,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Timer,
  FilterX,
  CheckCircle2,
  Target
} from "lucide-react";
import { authApi } from "../../services/authApi";
import AssignmentPreviewModal from "../../components/assignment/AssignmentPreviewModal";
import "./TeacherTheme.css";
import "./TeacherAssignments.css";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const CATEGORIES = [
  "Lab Assignment",
  "Homework Problem Set",
  "Mini Project / Capstone",
  "Case Study",
  "Viva Preparation",
  "Theory Problem Set"
];

const BRANCHES = ["CSE", "Mechanical", "Civil", "Electrical", "Electronics", "IT"];
const SEMESTERS = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6"];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "due_asc", label: "Deadline: soonest" },
  { id: "due_desc", label: "Deadline: latest" },
  { id: "title", label: "Title A–Z" },
  { id: "submissions", label: "Most submissions" }
];

const SUB_STATUS_CHIPS = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "late", label: "Late" },
  { id: "resubmitted", label: "Resubmitted" },
  { id: "correction_required", label: "Revision" },
  { id: "evaluated", label: "Evaluated" }
];

const STEPS = [
  { step: 1, label: "Basics" },
  { step: 2, label: "Scope" },
  { step: 3, label: "Deadline & rules" },
  { step: 4, label: "Handouts & rubric" }
];

const QUICK_PERCENTS = [100, 90, 80, 70, 60, 40];

const DEFAULT_RUBRIC = [
  { title: "Methodology & Code Structure", maxPoints: 50, description: "Logical accuracy, efficiency, and cleanliness" },
  { title: "Test Cases & Execution", maxPoints: 30, description: "Edge case handling and verification" },
  { title: "Documentation & Viva Readiness", maxPoints: 20, description: "Clear explanations and comments" }
];

const STATUS_LABELS = {
  evaluated: "Evaluated",
  correction_required: "Revision requested",
  late: "Late submission",
  resubmitted: "Resubmitted",
  submitted: "Submitted"
};

/* ==========================================================================
   HELPERS
   ========================================================================== */

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Returns { tone, label } describing how close the deadline is. */
function getDueInfo(asgn) {
  if (!asgn?.dueDate) return null;
  const d = new Date(asgn.dueDate);
  if (isNaN(d.getTime())) return null;
  const [h, m] = String(asgn.dueTime || "23:59").split(":");
  d.setHours(Number(h) || 23, Number(m) || 59, 0, 0);

  const diff = d.getTime() - Date.now();
  if (diff < 0) return { tone: "overdue", label: "Deadline passed" };

  const hours = Math.ceil(diff / 3600000);
  if (hours <= 24) return { tone: "urgent", label: `Due in ${hours}h` };

  const days = Math.ceil(diff / 86400000);
  if (days <= 3) return { tone: "soon", label: `Due in ${days} days` };
  return { tone: "calm", label: `${days} days left` };
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Smoothly animates a number from its previous value to the new target. */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const to = Number(target) || 0;
    const from = prev.current;
    if (from === to) {
      setValue(to);
      return undefined;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      prev.current = to;
      setValue(to);
      return undefined;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function KpiCard({ icon, tone, label, value, suffix = "", hint, index = 0, display }) {
  const animated = useCountUp(value);
  return (
    <div className="tch-kpi-card" style={{ "--i": index }}>
      <div className={`kpi-icon ${tone}`}>{icon}</div>
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-num">{display !== undefined ? display : `${animated}${suffix}`}</strong>
        {hint && <small className="kpi-hint">{hint}</small>}
      </div>
    </div>
  );
}

function SkeletonCards({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="tch-asgn-card skeleton-card" style={{ "--i": i }} aria-hidden="true">
      <div className="sk-line sk-sm" />
      <div className="sk-line sk-lg" />
      <div className="sk-line" />
      <div className="sk-line sk-md" />
      <div className="sk-block" />
    </div>
  ));
}

/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function TeacherAssignments({ currentUser, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tabs & views
  const [activeTab, setActiveTab] = useState("assignments");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("newest");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subSort, setSubSort] = useState({ key: "submittedAt", dir: "desc" });
  const [selectedRows, setSelectedRows] = useState(() => new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchRef = useRef(null);

  // Action menu (stores open assignment id)
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Preview modal
  const [previewAssignment, setPreviewAssignment] = useState(null);

  // Create / edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [createStep, setCreateStep] = useState(1);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubject, setFormSubject] = useState("Operating Systems");
  const [formSubjectCode, setFormSubjectCode] = useState("CS-501");
  const [formBranch, setFormBranch] = useState("CSE");
  const [formSemester, setFormSemester] = useState("Semester 5");
  const [formAcademicYear, setFormAcademicYear] = useState("3rd Year");
  const [formUnit, setFormUnit] = useState("Unit 3");
  const [formCategory, setFormCategory] = useState("Lab Assignment");
  const [formPriority, setFormPriority] = useState("normal");
  const [formTotalPoints, setFormTotalPoints] = useState(100);
  const [formPassingMarks, setFormPassingMarks] = useState(40);
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("23:59");
  const [formLatePolicy, setFormLatePolicy] = useState("allowed_penalty");
  const [formLatePenalty, setFormLatePenalty] = useState(10);
  const [formMaxFileSize, setFormMaxFileSize] = useState(50);

  // Attachments & rubric in form
  const [existingRefFiles, setExistingRefFiles] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [newRefFiles, setNewRefFiles] = useState([]);
  const [formExtUrls, setFormExtUrls] = useState([]);
  const [newUrlTitle, setNewUrlTitle] = useState("");
  const [newUrlAddress, setNewUrlAddress] = useState("");
  const [formRubric, setFormRubric] = useState(DEFAULT_RUBRIC);
  const [newRubricTitle, setNewRubricTitle] = useState("");
  const [newRubricPoints, setNewRubricPoints] = useState(10);
  const [dragOver, setDragOver] = useState(false);

  // Publish / delete dialogs
  const [publishTargetAsgn, setPublishTargetAsgn] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [deleteTargetAsgn, setDeleteTargetAsgn] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Evaluation workspace
  const [evaluatingAsgn, setEvaluatingAsgn] = useState(null);
  const [evaluatingSub, setEvaluatingSub] = useState(null);
  const [evalGrade, setEvalGrade] = useState("");
  const [evalFeedback, setEvalFeedback] = useState("");
  const [evalCorrectionInstructions, setEvalCorrectionInstructions] = useState("");
  const [evalPrivateRemarks, setEvalPrivateRemarks] = useState("");
  const [evalRubricScores, setEvalRubricScores] = useState([]);
  const [evaluating, setEvaluating] = useState(false);

  /* ------------------------------------------------------------------------
     DATA LOADING
     ------------------------------------------------------------------------ */

  const loadData = useCallback(() => {
    setLoading(true);
    authApi
      .getAssignments({ status: statusFilter })
      .then((res) => {
        setAssignments(res?.assignments || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading teacher assignments:", err);
        setLoading(false);
      });

    authApi
      .getAssignmentAnalytics()
      .then((res) => {
        if (res?.analytics) setAnalytics(res.analytics);
      })
      .catch((err) => console.warn("Analytics error:", err.message));
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // Close action menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => setOpenActionMenuId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Lock page scroll while any modal is open
  const anyModalOpen = showFormModal || !!publishTargetAsgn || !!deleteTargetAsgn || !!evaluatingAsgn;
  useEffect(() => {
    if (!anyModalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyModalOpen]);

  // Clear row selection whenever the visible dataset changes context
  useEffect(() => {
    setSelectedRows(new Set());
  }, [activeTab, selectedBranch, selectedSemester, subStatusFilter, searchQuery]);

  /* ------------------------------------------------------------------------
     DERIVED DATA
     ------------------------------------------------------------------------ */

  const allSubmissionsRoster = useMemo(() => {
    const list = [];
    assignments.forEach((asgn) => {
      (asgn.submissions || []).forEach((sub) => {
        list.push({
          ...sub,
          assignmentId: asgn.id || asgn._id,
          assignmentTitle: asgn.title,
          subject: asgn.subject,
          branch: asgn.branch,
          semester: asgn.semester,
          totalPoints: asgn.totalPoints,
          passingMarks: asgn.passingMarks,
          dueDate: asgn.dueDate,
          rubricCriteria: asgn.rubricCriteria || []
        });
      });
    });
    return list;
  }, [assignments]);

  const pendingCount = useMemo(
    () => allSubmissionsRoster.filter((s) => s.status !== "evaluated").length,
    [allSubmissionsRoster]
  );
  const evaluatedCount = allSubmissionsRoster.length - pendingCount;

  // Real insights computed from the roster
  const insights = useMemo(() => {
    const graded = allSubmissionsRoster.filter(
      (s) => s.status === "evaluated" && s.grade !== null && s.grade !== undefined && s.totalPoints > 0
    );
    const avgPct = graded.length
      ? Math.round(graded.reduce((acc, s) => acc + (Number(s.grade) / s.totalPoints) * 100, 0) / graded.length)
      : null;
    const passed = graded.filter((s) => Number(s.grade) >= (Number(s.passingMarks) || 0)).length;
    const passRate = graded.length ? Math.round((passed / graded.length) * 100) : null;
    const lateCount = allSubmissionsRoster.filter((s) => s.status === "late").length;
    const onTimeRate = allSubmissionsRoster.length
      ? Math.round(((allSubmissionsRoster.length - lateCount) / allSubmissionsRoster.length) * 100)
      : null;

    const buckets = [
      { label: "Below 40%", count: 0, tone: "rose" },
      { label: "40–59%", count: 0, tone: "amber" },
      { label: "60–79%", count: 0, tone: "cyan" },
      { label: "80–100%", count: 0, tone: "emerald" }
    ];
    graded.forEach((s) => {
      const pct = (Number(s.grade) / s.totalPoints) * 100;
      if (pct < 40) buckets[0].count += 1;
      else if (pct < 60) buckets[1].count += 1;
      else if (pct < 80) buckets[2].count += 1;
      else buckets[3].count += 1;
    });

    return { avgPct, passRate, onTimeRate, buckets, gradedCount: graded.length };
  }, [allSubmissionsRoster]);

  const avgScoreValue = insights.avgPct ?? (analytics?.averageMarks !== undefined ? Number(analytics.averageMarks) : null);

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = assignments.filter((a) => {
      if (selectedBranch !== "all" && a.branch !== selectedBranch) return false;
      if (selectedSemester !== "all" && a.semester !== selectedSemester) return false;
      if (statusFilter === "published" && a.status !== "published") return false;
      if (statusFilter === "draft" && a.status !== "draft") return false;
      if (statusFilter === "archived" && !a.isArchived && a.status !== "archived") return false;

      if (q) {
        const pool = [a.title, a.subject, a.subjectCode, a.unit, a.category, a.description].join(" ").toLowerCase();
        if (!pool.includes(q)) return false;
      }
      return true;
    });

    const time = (v) => (v ? new Date(v).getTime() || 0 : 0);
    const subTotal = (a) => a.submissionsCount || (a.submissions || []).length;
    const sorted = [...list];
    switch (sortBy) {
      case "due_asc":
        sorted.sort((a, b) => (time(a.dueDate) || Infinity) - (time(b.dueDate) || Infinity));
        break;
      case "due_desc":
        sorted.sort((a, b) => time(b.dueDate) - time(a.dueDate));
        break;
      case "title":
        sorted.sort((a, b) => String(a.title).localeCompare(String(b.title)));
        break;
      case "submissions":
        sorted.sort((a, b) => subTotal(b) - subTotal(a));
        break;
      default:
        sorted.sort((a, b) => time(b.createdAt) - time(a.createdAt));
    }
    return sorted;
  }, [assignments, selectedBranch, selectedSemester, statusFilter, searchQuery, sortBy]);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = allSubmissionsRoster.filter((sub) => {
      if (activeTab === "pending_eval" && sub.status === "evaluated") return false;
      if (subStatusFilter !== "all" && sub.status !== subStatusFilter) return false;
      if (selectedBranch !== "all" && sub.branch !== selectedBranch) return false;
      if (selectedSemester !== "all" && sub.semester !== selectedSemester) return false;

      if (q) {
        const student = sub.studentId || {};
        const pool = [
          sub.assignmentTitle,
          sub.subject,
          student.fullName,
          student.email,
          student.rollNumber,
          student.enrollmentNumber
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!pool.includes(q)) return false;
      }
      return true;
    });

    const { key, dir } = subSort;
    const mult = dir === "asc" ? 1 : -1;
    const val = (s) => {
      if (key === "student") return (s.studentId?.fullName || "").toLowerCase();
      if (key === "assignment") return String(s.assignmentTitle || "").toLowerCase();
      if (key === "grade") return s.grade === null || s.grade === undefined ? -1 : Number(s.grade);
      return s.submittedAt ? new Date(s.submittedAt).getTime() : 0;
    };
    return [...list].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  }, [allSubmissionsRoster, activeTab, subStatusFilter, selectedBranch, selectedSemester, searchQuery, subSort]);

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedBranch !== "all" ? 1 : 0) +
    (selectedSemester !== "all" ? 1 : 0) +
    (activeTab === "assignments" ? (statusFilter !== "all" ? 1 : 0) : subStatusFilter !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedBranch("all");
    setSelectedSemester("all");
    setStatusFilter("all");
    setSubStatusFilter("all");
  };

  const rowKey = (sub, idx) => `${sub.assignmentId}-${sub._id || idx}`;
  const allVisibleSelected =
    filteredSubmissions.length > 0 && filteredSubmissions.every((s, i) => selectedRows.has(rowKey(s, i)));

  const toggleRow = (key) =>
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAllRows = () =>
    setSelectedRows(() => {
      if (allVisibleSelected) return new Set();
      return new Set(filteredSubmissions.map((s, i) => rowKey(s, i)));
    });

  const toggleSort = (key) =>
    setSubSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  /* ------------------------------------------------------------------------
     FORM HELPERS
     ------------------------------------------------------------------------ */

  const rubricTotal = formRubric.reduce((acc, r) => acc + (Number(r.maxPoints) || 0), 0);
  const rubricMismatch = formRubric.length > 0 && rubricTotal !== Number(formTotalPoints);

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formTitle.trim()) errors.title = "Add a title students will recognise.";
      if (!formDescription.trim()) errors.description = "Write the instructions or problem statement.";
    }
    if (step === 2) {
      if (!formSubject.trim()) errors.subject = "Subject is required.";
    }
    if (step === 3) {
      if (Number(formPassingMarks) > Number(formTotalPoints)) {
        errors.passing = "Passing marks cannot exceed total marks.";
      }
    }
    return errors;
  };

  const stepHasError = (step) => Object.keys(validateStep(step)).length > 0 && Object.keys(formErrors).length > 0;

  const goNextStep = () => {
    const errors = validateStep(createStep);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showToast?.("Please fix the highlighted fields to continue.", true);
      return;
    }
    setFormErrors({});
    setCreateStep((s) => Math.min(4, s + 1));
  };

  const resetFormDefaults = () => {
    setFormTitle("");
    setFormShortDesc("");
    setFormDescription("");
    setFormSubject("Operating Systems");
    setFormSubjectCode("CS-501");
    setFormBranch("CSE");
    setFormSemester("Semester 5");
    setFormAcademicYear("3rd Year");
    setFormUnit("Unit 3");
    setFormCategory("Lab Assignment");
    setFormPriority("normal");
    setFormTotalPoints(100);
    setFormPassingMarks(40);
    setFormDueDate("");
    setFormDueTime("23:59");
    setFormLatePolicy("allowed_penalty");
    setFormLatePenalty(10);
    setFormMaxFileSize(50);
    setExistingRefFiles([]);
    setRemovedAttachmentIds([]);
    setNewRefFiles([]);
    setFormExtUrls([]);
    setFormRubric(DEFAULT_RUBRIC);
  };

  const handleOpenCreateModal = useCallback(() => {
    setEditingAssignment(null);
    setCreateStep(1);
    setFormErrors({});
    resetFormDefaults();
    setShowFormModal(true);
  }, []);

  const handleOpenEditModal = (asgn) => {
    setEditingAssignment(asgn);
    setCreateStep(1);
    setFormErrors({});
    setFormTitle(asgn.title || "");
    setFormShortDesc(asgn.shortDescription || "");
    setFormDescription(asgn.description || "");
    setFormSubject(asgn.subject || "Operating Systems");
    setFormSubjectCode(asgn.subjectCode || "");
    setFormBranch(asgn.branch || "CSE");
    setFormSemester(asgn.semester || "Semester 5");
    setFormAcademicYear(asgn.academicYear || "3rd Year");
    setFormUnit(asgn.unit || "");
    setFormCategory(asgn.category || "Lab Assignment");
    setFormPriority(asgn.priority || "normal");
    setFormTotalPoints(asgn.totalPoints || 100);
    setFormPassingMarks(asgn.passingMarks || 40);

    const d = asgn.dueDate ? new Date(asgn.dueDate).toISOString().slice(0, 10) : "";
    setFormDueDate(d);
    setFormDueTime(asgn.dueTime || "23:59");
    setFormLatePolicy(asgn.lateSubmissionPolicy || "allowed_penalty");
    setFormLatePenalty(asgn.latePenaltyPercent !== undefined ? asgn.latePenaltyPercent : 10);
    setFormMaxFileSize(asgn.maxFileSizeMB || 50);

    setExistingRefFiles(asgn.referenceAttachments || []);
    setRemovedAttachmentIds([]);
    setNewRefFiles([]);
    setFormExtUrls(asgn.externalResources || []);
    setFormRubric(
      asgn.rubricCriteria && asgn.rubricCriteria.length > 0
        ? asgn.rubricCriteria
        : DEFAULT_RUBRIC.map((r) => ({ ...r, description: "" }))
    );
    setShowFormModal(true);
  };

  const setDeadlineShortcut = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setFormDueDate(d.toISOString().slice(0, 10));
  };

  const scaleRubricToTotal = () => {
    if (!formRubric.length || rubricTotal <= 0) return;
    const target = Number(formTotalPoints) || 100;
    const scaled = formRubric.map((r) => ({
      ...r,
      maxPoints: Math.max(1, Math.round(((Number(r.maxPoints) || 0) / rubricTotal) * target))
    }));
    // fix rounding drift on the largest criterion
    const drift = target - scaled.reduce((acc, r) => acc + r.maxPoints, 0);
    if (drift !== 0) {
      let idx = 0;
      scaled.forEach((r, i) => {
        if (r.maxPoints > scaled[idx].maxPoints) idx = i;
      });
      scaled[idx] = { ...scaled[idx], maxPoints: Math.max(1, scaled[idx].maxPoints + drift) };
    }
    setFormRubric(scaled);
    showToast?.("Rubric points rescaled to match total marks.");
  };

  const addFilesFromList = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const limit = (Number(formMaxFileSize) || 50) * 1024 * 1024;
    const accepted = incoming.filter((f) => f.size <= limit);
    if (accepted.length < incoming.length) {
      showToast?.(`Some files exceed the ${formMaxFileSize} MB limit and were skipped.`, true);
    }
    setNewRefFiles((prev) => [...prev, ...accepted]);
  };

  /* ------------------------------------------------------------------------
     ACTIONS
     ------------------------------------------------------------------------ */

  const handleSaveAssignmentForm = async (targetStatus = "published") => {
    const e1 = validateStep(1);
    const e2 = validateStep(2);
    const e3 = validateStep(3);
    const all = { ...e1, ...e2, ...e3 };

    if (Object.keys(all).length) {
      setFormErrors(all);
      setCreateStep(Object.keys(e1).length ? 1 : Object.keys(e2).length ? 2 : 3);
      showToast?.("Please complete Assignment Title and Instructions.", true);
      return;
    }
    if (targetStatus === "published" && !formDueDate) {
      setFormErrors({ dueDate: "Pick a deadline to publish." });
      setCreateStep(3);
      showToast?.("Due Date is required to publish an assignment.", true);
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("shortDescription", formShortDesc.trim());
      formData.append("description", formDescription.trim());
      formData.append("subject", formSubject.trim());
      formData.append("subjectCode", formSubjectCode.trim());
      formData.append("branch", formBranch);
      formData.append("semester", formSemester);
      formData.append("academicYear", formAcademicYear);
      formData.append("unit", formUnit.trim());
      formData.append("category", formCategory);
      formData.append("priority", formPriority);
      formData.append("status", targetStatus);
      formData.append("totalPoints", String(formTotalPoints));
      formData.append("passingMarks", String(formPassingMarks));
      formData.append("dueDate", formDueDate || new Date().toISOString().slice(0, 10));
      formData.append("dueTime", formDueTime);
      formData.append("lateSubmissionPolicy", formLatePolicy);
      formData.append("latePenaltyPercent", String(formLatePenalty));
      formData.append("maxFileSizeMB", String(formMaxFileSize));

      for (const f of newRefFiles) {
        formData.append("referenceFiles", f);
      }
      if (removedAttachmentIds.length > 0) {
        formData.append("removedAttachmentIds", JSON.stringify(removedAttachmentIds));
      }
      if (formExtUrls.length > 0) {
        formData.append("externalResources", JSON.stringify(formExtUrls));
      }
      if (formRubric.length > 0) {
        formData.append("rubricCriteria", JSON.stringify(formRubric));
      }

      if (editingAssignment) {
        const id = editingAssignment.id || editingAssignment._id;
        await authApi.updateAssignment(id, formData);
        showToast?.(
          targetStatus === "draft"
            ? "Assignment changes saved as draft."
            : "Assignment updated and published successfully!"
        );
      } else {
        await authApi.createAssignment(formData);
        showToast?.(
          targetStatus === "draft"
            ? "Assignment saved as draft."
            : "Assignment published and distributed to students!"
        );
      }

      setShowFormModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to save assignment.", true);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!publishTargetAsgn) return;
    setPublishing(true);
    try {
      const id = publishTargetAsgn.id || publishTargetAsgn._id;
      await authApi.publishAssignment(id);
      showToast?.(`"${publishTargetAsgn.title}" is now published and visible to students!`);
      setPublishTargetAsgn(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to publish assignment.", true);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async (asgn) => {
    try {
      const id = asgn.id || asgn._id;
      await authApi.unpublishAssignment(id);
      showToast?.(`"${asgn.title}" returned to draft status.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to unpublish assignment.", true);
    }
  };

  const handleDuplicate = async (asgn) => {
    try {
      const id = asgn.id || asgn._id;
      await authApi.duplicateAssignment(id);
      showToast?.(`Cloned draft created for "${asgn.title}".`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to duplicate assignment.", true);
    }
  };

  const handleArchive = async (asgn) => {
    try {
      const id = asgn.id || asgn._id;
      await authApi.archiveAssignment(id);
      showToast?.(
        asgn.isArchived ? `"${asgn.title}" restored from archive.` : `"${asgn.title}" moved to archive.`
      );
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to update archive status.", true);
    }
  };

  const handleConfirmDelete = async (force = false) => {
    if (!deleteTargetAsgn) return;
    setDeleting(true);
    try {
      const id = deleteTargetAsgn.id || deleteTargetAsgn._id;
      await authApi.deleteAssignment(id, force);
      showToast?.("Assignment removed successfully.");
      setDeleteTargetAsgn(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast?.(err.message || "Failed to delete assignment.", true);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await authApi.exportAssignmentReportCSV({
        branch: selectedBranch !== "all" ? selectedBranch : undefined,
        semester: selectedSemester !== "all" ? selectedSemester : undefined
      });
      showToast?.("Assignment analytics exported to CSV.");
    } catch (err) {
      showToast?.(err.message || "Failed to export CSV report.", true);
    }
  };

  // Client-side export of the rows the teacher ticked (or all visible rows)
  const handleExportSelected = () => {
    const rows = filteredSubmissions.filter((s, i) => selectedRows.has(rowKey(s, i)));
    const source = rows.length ? rows : filteredSubmissions;
    if (!source.length) {
      showToast?.("There are no submissions to export.", true);
      return;
    }
    const header = [
      "Student",
      "Roll / Enrollment",
      "Assignment",
      "Subject",
      "Branch",
      "Semester",
      "Submitted At",
      "Status",
      "Score",
      "Total Marks"
    ];
    const lines = source.map((s) => {
      const st = s.studentId || {};
      return [
        st.fullName || "",
        st.rollNumber || st.enrollmentNumber || "",
        s.assignmentTitle,
        s.subject,
        s.branch,
        s.semester,
        s.submittedAt ? new Date(s.submittedAt).toLocaleString("en-IN") : "",
        STATUS_LABELS[s.status] || s.status,
        s.grade ?? "",
        s.totalPoints
      ]
        .map(csvEscape)
        .join(",");
    });
    downloadTextFile(`submissions-${new Date().toISOString().slice(0, 10)}.csv`, [header.join(","), ...lines].join("\n"));
    showToast?.(`${source.length} submission${source.length > 1 ? "s" : ""} exported.`);
  };

  /* ------------------------------------------------------------------------
     EVALUATION
     ------------------------------------------------------------------------ */

  const handleOpenEvaluation = (asgn, sub) => {
    setEvaluatingAsgn(asgn);
    setEvaluatingSub(sub);
    setEvalGrade(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : "");
    setEvalFeedback(sub.feedback || "");
    setEvalCorrectionInstructions(sub.correctionInstructions || "");
    setEvalPrivateRemarks(sub.privateRemarks || "");

    const criteria = asgn.rubricCriteria || [];
    if (sub.rubricScores && sub.rubricScores.length > 0) {
      setEvalRubricScores(sub.rubricScores);
    } else {
      setEvalRubricScores(
        criteria.map((c) => ({
          criteriaTitle: c.title,
          awardedPoints: Math.round(c.maxPoints * 0.8),
          maxPoints: c.maxPoints
        }))
      );
    }
  };

  const handleCloseEvaluation = useCallback(() => {
    setEvaluatingAsgn(null);
    setEvaluatingSub(null);
  }, []);

  const findAssignmentForSub = (sub) =>
    assignments.find((a) => (a.id || a._id) === sub.assignmentId) || sub;

  // Previous / next submission inside the currently filtered roster
  const evalIndex = useMemo(() => {
    if (!evaluatingSub) return -1;
    return filteredSubmissions.findIndex(
      (s) => s._id && evaluatingSub._id && s._id === evaluatingSub._id
    );
  }, [filteredSubmissions, evaluatingSub]);

  const navigateEvaluation = (dir) => {
    const target = filteredSubmissions[evalIndex + dir];
    if (!target) return;
    handleOpenEvaluation(findAssignmentForSub(target), target);
  };

  const rubricAwardedTotal = evalRubricScores.reduce((acc, r) => acc + (Number(r.awardedPoints) || 0), 0);
  const rubricMaxTotal = evalRubricScores.reduce((acc, r) => acc + (Number(r.maxPoints) || 0), 0);
  const evalTotalPoints = Number(evaluatingAsgn?.totalPoints) || 0;
  const evalGradeNum = evalGrade === "" ? null : Number(evalGrade);
  const evalPercent =
    evalGradeNum !== null && evalTotalPoints > 0 ? Math.max(0, Math.min(100, (evalGradeNum / evalTotalPoints) * 100)) : 0;
  const evalPassing = Number(evaluatingAsgn?.passingMarks) || 0;
  const evalPassed = evalGradeNum !== null && evalGradeNum >= evalPassing;

  const applyRubricTotal = () => {
    if (!evalRubricScores.length) return;
    const scaled = rubricMaxTotal > 0 && rubricMaxTotal !== evalTotalPoints
      ? Math.round((rubricAwardedTotal / rubricMaxTotal) * evalTotalPoints)
      : rubricAwardedTotal;
    setEvalGrade(String(scaled));
  };

  const handleProcessEvaluation = useCallback(
    async (action = "evaluate") => {
      if (!evaluatingAsgn || !evaluatingSub) return;
      if (action === "evaluate") {
        const g = Number(evalGrade);
        if (evalGrade === "" || isNaN(g) || g < 0 || g > evaluatingAsgn.totalPoints) {
          showToast?.(`Awarded marks must be between 0 and total marks (${evaluatingAsgn.totalPoints}).`, true);
          return;
        }
      }
      if (action === "return_for_correction" && !evalCorrectionInstructions.trim()) {
        showToast?.("Add correction instructions so the student knows what to fix.", true);
        return;
      }

      setEvaluating(true);
      try {
        const studentId = evaluatingSub.studentId?._id || evaluatingSub.studentId;
        await authApi.gradeAssignment(evaluatingAsgn.id || evaluatingAsgn._id, {
          studentId,
          grade: Number(evalGrade),
          feedback: evalFeedback,
          correctionInstructions: evalCorrectionInstructions,
          privateRemarks: evalPrivateRemarks,
          rubricScores: evalRubricScores,
          action
        });

        showToast?.(
          action === "return_for_correction"
            ? "Assignment returned to student with revision instructions."
            : "Deliverable evaluated and marks published successfully!"
        );

        handleCloseEvaluation();
        setRefreshKey((k) => k + 1);
      } catch (err) {
        showToast?.(err.message || "Failed to grade submission.", true);
      } finally {
        setEvaluating(false);
      }
    },
    [
      evaluatingAsgn,
      evaluatingSub,
      evalGrade,
      evalFeedback,
      evalCorrectionInstructions,
      evalPrivateRemarks,
      evalRubricScores,
      showToast,
      handleCloseEvaluation
    ]
  );

  /* ------------------------------------------------------------------------
     KEYBOARD SHORTCUTS
     ------------------------------------------------------------------------ */

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "Escape") {
        if (previewAssignment) return; // preview modal owns its own close
        if (evaluatingAsgn) handleCloseEvaluation();
        else if (deleteTargetAsgn) setDeleteTargetAsgn(null);
        else if (publishTargetAsgn) setPublishTargetAsgn(null);
        else if (showFormModal) setShowFormModal(false);
        else if (showShortcuts) setShowShortcuts(false);
        else setOpenActionMenuId(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && evaluatingAsgn) {
        e.preventDefault();
        handleProcessEvaluation("evaluate");
        return;
      }

      if (typing || e.ctrlKey || e.metaKey || e.altKey || anyModalOpen) return;

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleOpenCreateModal();
      } else if (e.key.toLowerCase() === "g") {
        setViewMode((v) => (v === "grid" ? "list" : "grid"));
      } else if (e.key.toLowerCase() === "r") {
        setRefreshKey((k) => k + 1);
      } else if (e.key === "?") {
        setShowShortcuts((s) => !s);
      } else if (e.key === "1") setActiveTab("assignments");
      else if (e.key === "2") setActiveTab("submissions");
      else if (e.key === "3") setActiveTab("pending_eval");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    previewAssignment,
    evaluatingAsgn,
    deleteTargetAsgn,
    publishTargetAsgn,
    showFormModal,
    showShortcuts,
    anyModalOpen,
    handleCloseEvaluation,
    handleProcessEvaluation,
    handleOpenCreateModal
  ]);

  const deleteSubmissionCount = deleteTargetAsgn
    ? deleteTargetAsgn.submissionsCount !== undefined && deleteTargetAsgn.submissionsCount !== null
      ? deleteTargetAsgn.submissionsCount
      : (deleteTargetAsgn.submissions || []).filter((s) => s.status !== "draft").length
    : 0;
  const deleteHasSubmissions =
    deleteTargetAsgn &&
    (deleteTargetAsgn.submissionsCount > 0 ||
      (deleteTargetAsgn.submissions || []).filter((s) => s.status !== "draft").length > 0);

  /* ------------------------------------------------------------------------
     RENDER HELPERS
     ------------------------------------------------------------------------ */

  const renderSortHeader = (key, label) => (
    <th
      className={`sortable ${subSort.key === key ? "sorted" : ""}`}
      onClick={() => toggleSort(key)}
      aria-sort={subSort.key === key ? (subSort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="th-inner">
        {label}
        <ArrowUpDown size={12} className={`sort-icon ${subSort.key === key ? subSort.dir : ""}`} />
      </span>
    </th>
  );

  const renderAssignmentCard = (asgn, index) => {
    const id = asgn.id || asgn._id;
    const subCount = asgn.submissionsCount || (asgn.submissions || []).length;
    const evalCount =
      asgn.evaluatedCount || (asgn.submissions || []).filter((s) => s.status === "evaluated").length;
    const isDraft = asgn.status === "draft";
    const isArchived = asgn.isArchived || asgn.status === "archived";
    const isActionOpen = openActionMenuId === id;
    const due = !isDraft && !isArchived ? getDueInfo(asgn) : null;
    const progress = subCount > 0 ? Math.round((evalCount / subCount) * 100) : 0;

    return (
      <div
        key={id}
        className={`tch-asgn-card ${isDraft ? "draft-card" : isArchived ? "archived-card" : ""} ${
          isActionOpen ? "menu-open" : ""
        }`}
        style={{ "--i": Math.min(index, 12) }}
      >
        <div className="tch-card-top">
          <span className="tch-tag-sub">{asgn.subject}</span>
          <span className="tch-tag-sem">
            {asgn.branch} · {asgn.semester}
          </span>
          <span className={`tch-tag-priority ${asgn.priority || "normal"}`}>{asgn.priority || "normal"}</span>

          <span className={`tch-status-pill ${isDraft ? "draft" : isArchived ? "archived" : "published"}`}>
            {isDraft ? "Draft" : isArchived ? "Archived" : "Published"}
          </span>

          <div className="tch-card-menu-anchor" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="tch-btn-menu-trigger"
              onClick={() => setOpenActionMenuId(isActionOpen ? null : id)}
              title="Assignment actions"
              aria-haspopup="menu"
              aria-expanded={isActionOpen}
            >
              <MoreVertical size={16} />
            </button>

            {isActionOpen && (
              <div className="tch-action-dropdown" role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    setPreviewAssignment(asgn);
                  }}
                >
                  <Eye size={14} />
                  <span>Preview assignment</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    handleOpenEditModal(asgn);
                  }}
                >
                  <Edit size={14} />
                  <span>Edit assignment</span>
                </button>

                {isDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null);
                      setPublishTargetAsgn(asgn);
                    }}
                  >
                    <Send size={14} />
                    <span>Publish assignment</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null);
                      handleUnpublish(asgn);
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Return to draft</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    setPreviewAssignment(asgn);
                  }}
                >
                  <Printer size={14} />
                  <span>Download / print PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    handleDuplicate(asgn);
                  }}
                >
                  <Copy size={14} />
                  <span>Duplicate as draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    handleArchive(asgn);
                  }}
                >
                  <Archive size={14} />
                  <span>{isArchived ? "Restore from archive" : "Archive assignment"}</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="danger-item"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    setDeleteTargetAsgn(asgn);
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete assignment</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="tch-card-main">
          <h4 className="tch-card-title">{asgn.title}</h4>
          <p className="tch-card-desc">{asgn.shortDescription || asgn.description}</p>
        </div>

        <div className="tch-card-meta-row">
          <span>
            <Calendar size={13} /> Due: <strong>{formatDate(asgn.dueDate)}</strong>
          </span>
          <span>
            <Award size={13} /> {asgn.totalPoints} marks
          </span>
          {asgn.referenceAttachments && asgn.referenceAttachments.length > 0 && (
            <span>
              <Paperclip size={13} /> {asgn.referenceAttachments.length} handout
              {asgn.referenceAttachments.length > 1 ? "s" : ""}
            </span>
          )}
          {due && (
            <span className={`due-chip ${due.tone}`}>
              <Timer size={12} /> {due.label}
            </span>
          )}
        </div>

        <div className="tch-card-sub-stats">
          <div className="sub-stat-bar">
            <span>
              Submissions: <strong>{subCount}</strong>
            </span>
            <span>
              Graded: <strong>{evalCount}</strong>
            </span>
            <span className="progress-pct">{progress}%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ "--w": `${progress}%` }} />
          </div>
        </div>

        <div className="tch-card-actions">
          <button
            type="button"
            className="btn-card-preview"
            onClick={() => setPreviewAssignment(asgn)}
            title="Preview student perspective and attached handouts"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            className="btn-card-eval"
            onClick={() => {
              setActiveTab("submissions");
              setSearchQuery(asgn.title);
            }}
          >
            <ClipboardList size={14} />
            <span>Submissions ({subCount})</span>
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  const tabIndex = activeTab === "assignments" ? 0 : activeTab === "submissions" ? 1 : 2;

  return (
    <div className="teacher-asgn-container">
      {/* ================= HEADER ================= */}
      <div className="tch-pane-header">
        <div className="tch-header-copy">
          <h2>
            <span className="header-icon">
              <FileText size={22} />
            </span>
            Coursework &amp; laboratory assignments
          </h2>
          <p>
            Create assignments, track submissions, and grade against rubrics — all in one place, with a complete
            academic record.
          </p>
        </div>

        <div className="tch-header-actions">
          <button
            type="button"
            className="tch-btn-icon"
            onClick={() => setShowShortcuts((s) => !s)}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard size={16} />
          </button>

          <button
            type="button"
            className="tch-btn-secondary"
            onClick={handleExportCSV}
            title="Export assignment report to CSV"
          >
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="tch-btn-secondary"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh assignment roster (R)"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Sync</span>
          </button>

          <button type="button" className="tch-btn-primary" onClick={handleOpenCreateModal} title="New assignment (N)">
            <Plus size={16} />
            <span>Create assignment</span>
          </button>
        </div>

        {showShortcuts && (
          <div className="shortcuts-popover" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-head">
              <strong>Keyboard shortcuts</strong>
              <button type="button" className="btn-close" onClick={() => setShowShortcuts(false)}>
                <X size={14} />
              </button>
            </div>
            <ul>
              <li><kbd>/</kbd><span>Focus search</span></li>
              <li><kbd>N</kbd><span>New assignment</span></li>
              <li><kbd>G</kbd><span>Toggle grid / list</span></li>
              <li><kbd>R</kbd><span>Refresh data</span></li>
              <li><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd><span>Switch tabs</span></li>
              <li><kbd>Ctrl</kbd>+<kbd>Enter</kbd><span>Publish grade (while grading)</span></li>
              <li><kbd>Esc</kbd><span>Close dialog</span></li>
            </ul>
          </div>
        )}
      </div>

      {/* ================= KPI METRICS ================= */}
      <section className="tch-kpi-grid">
        <KpiCard index={0} tone="indigo" icon={<BookOpen size={20} />} label="Assignments" value={assignments.length} />
        <KpiCard index={1} tone="cyan" icon={<Send size={20} />} label="Submissions received" value={allSubmissionsRoster.length} />
        <KpiCard
          index={2}
          tone="amber"
          icon={<Clock size={20} />}
          label="Pending evaluation"
          value={pendingCount}
          hint={pendingCount > 0 ? "Needs your review" : "All caught up"}
        />
        <KpiCard index={3} tone="emerald" icon={<Award size={20} />} label="Evaluated" value={evaluatedCount} />
        <KpiCard
          index={4}
          tone="violet"
          icon={<TrendingUp size={20} />}
          label="Average score"
          value={avgScoreValue ?? 0}
          suffix="%"
          display={avgScoreValue === null ? "—" : undefined}
          hint={insights.passRate !== null ? `${insights.passRate}% pass rate` : "No graded work yet"}
        />
      </section>

      {/* ================= TABS ================= */}
      <div className="tch-tabs-nav" style={{ "--tab-index": tabIndex }}>
        <button
          type="button"
          className={`tch-tab-btn ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          <Layers size={15} />
          <span>Assignments</span>
          <em className="tab-count">{assignments.length}</em>
        </button>

        <button
          type="button"
          className={`tch-tab-btn ${activeTab === "submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          <ClipboardList size={15} />
          <span>Submissions</span>
          <em className="tab-count">{allSubmissionsRoster.length}</em>
        </button>

        <button
          type="button"
          className={`tch-tab-btn ${activeTab === "pending_eval" ? "active" : ""}`}
          onClick={() => setActiveTab("pending_eval")}
        >
          <AlertCircle size={15} />
          <span>Pending review</span>
          <em className={`tab-count ${pendingCount > 0 ? "attention" : ""}`}>{pendingCount}</em>
        </button>
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="tch-toolbar">
        <div className="tch-search-box">
          <Search size={16} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search assignments, topics, or students…   ( / )"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="tch-toolbar-right">
          <div className="tch-filter-selects">
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="all">All departments</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="all">All semesters</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {activeTab === "assignments" && (
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort assignments">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            )}
          </div>

          {activeTab === "assignments" && (
            <div className="view-toggle" role="group" aria-label="Layout">
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={15} />
              </button>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button type="button" className="btn-clear-filters" onClick={clearAllFilters}>
              <FilterX size={14} />
              <span>Clear ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Chips row */}
      {activeTab === "assignments" ? (
        <div className="tch-chip-row">
          <div className="tch-status-chips">
            {[
              { id: "all", label: "All" },
              { id: "published", label: "Published" },
              { id: "draft", label: "Drafts" },
              { id: "archived", label: "Archived" }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`tch-status-chip ${statusFilter === chip.id ? "active" : ""}`}
                onClick={() => setStatusFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <span className="result-count">
            {filteredAssignments.length} result{filteredAssignments.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : (
        <div className="tch-chip-row">
          <div className="tch-status-chips">
            {SUB_STATUS_CHIPS.filter((c) => !(activeTab === "pending_eval" && c.id === "evaluated")).map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`tch-status-chip ${subStatusFilter === chip.id ? "active" : ""}`}
                onClick={() => setSubStatusFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <span className="result-count">
            {filteredSubmissions.length} result{filteredSubmissions.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {/* ================= TAB: ASSIGNMENT CARDS ================= */}
      {activeTab === "assignments" && (
        <div className={`tch-asgn-grid ${viewMode === "list" ? "view-list" : ""}`}>
          {loading && assignments.length === 0 ? (
            <SkeletonCards />
          ) : filteredAssignments.length === 0 ? (
            <div className="tch-empty-grid-card">
              <div className="empty-art">
                <BookOpen size={34} />
              </div>
              <h3>No assignments found</h3>
              <p>
                Nothing matches the current filters. Clear them, or create an assignment to share work with your
                students.
              </p>
              <div className="empty-actions">
                {activeFilterCount > 0 && (
                  <button type="button" className="tch-btn-secondary" onClick={clearAllFilters}>
                    <FilterX size={15} /> Clear filters
                  </button>
                )}
                <button type="button" className="tch-btn-primary" onClick={handleOpenCreateModal}>
                  <Plus size={15} /> Create assignment
                </button>
              </div>
            </div>
          ) : (
            filteredAssignments.map((asgn, i) => renderAssignmentCard(asgn, i))
          )}
        </div>
      )}

      {/* ================= TAB: SUBMISSIONS ================= */}
      {(activeTab === "submissions" || activeTab === "pending_eval") && (
        <>
          {/* Insights panel */}
          {allSubmissionsRoster.length > 0 && (
            <div className="tch-insights">
              <div className="insight-block">
                <span className="insight-label">On-time submissions</span>
                <strong>{insights.onTimeRate ?? "—"}{insights.onTimeRate !== null && "%"}</strong>
                <div className="progress-track slim">
                  <div className="progress-fill emerald" style={{ "--w": `${insights.onTimeRate || 0}%` }} />
                </div>
              </div>

              <div className="insight-block">
                <span className="insight-label">Pass rate</span>
                <strong>{insights.passRate ?? "—"}{insights.passRate !== null && "%"}</strong>
                <div className="progress-track slim">
                  <div className="progress-fill cyan" style={{ "--w": `${insights.passRate || 0}%` }} />
                </div>
              </div>

              <div className="insight-block wide">
                <span className="insight-label">Grade distribution ({insights.gradedCount} graded)</span>
                <div className="dist-bars">
                  {insights.buckets.map((b) => {
                    const max = Math.max(1, ...insights.buckets.map((x) => x.count));
                    return (
                      <div key={b.label} className="dist-col" title={`${b.label}: ${b.count}`}>
                        <span className="dist-count">{b.count}</span>
                        <div className="dist-bar-wrap">
                          <div className={`dist-bar ${b.tone}`} style={{ "--h": `${(b.count / max) * 100}%` }} />
                        </div>
                        <small>{b.label}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="tch-table-card">
            <table className="tch-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllRows}
                      aria-label="Select all visible submissions"
                    />
                  </th>
                  {renderSortHeader("student", "Student")}
                  {renderSortHeader("assignment", "Assignment")}
                  <th>Subject &amp; scope</th>
                  {renderSortHeader("submittedAt", "Submitted on")}
                  <th>Status</th>
                  {renderSortHeader("grade", "Score")}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="tch-empty-row">
                      <CheckCircle2 size={22} />
                      <span>
                        {activeTab === "pending_eval" && !searchQuery
                          ? "Nothing waiting for review. Nice work."
                          : "No submissions match the current filters."}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, idx) => {
                    const s = sub.studentId || {};
                    const asgn = findAssignmentForSub(sub);
                    const key = rowKey(sub, idx);
                    const selected = selectedRows.has(key);
                    const initial = (s.fullName || "S").trim().charAt(0).toUpperCase();

                    return (
                      <tr
                        key={key}
                        className={selected ? "row-selected" : ""}
                        style={{ "--i": Math.min(idx, 14) }}
                      >
                        <td className="col-check" data-label="Select">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleRow(key)}
                            aria-label={`Select ${s.fullName || "student"}`}
                          />
                        </td>
                        <td data-label="Student">
                          <div className="tch-student-cell">
                            <span className="avatar-dot">{initial}</span>
                            <div>
                              <strong>{s.fullName || "Enrolled Student"}</strong>
                              <small>{s.rollNumber || s.enrollmentNumber || s.email || "CSE-2026"}</small>
                            </div>
                          </div>
                        </td>
                        <td data-label="Assignment">
                          <strong className="asgn-title-cell">{sub.assignmentTitle}</strong>
                          <small className="receipt-cell">{sub.submissionReceipt || "SUB-OK"}</small>
                        </td>
                        <td data-label="Subject">
                          <span>{sub.subject}</span>
                          <small>
                            {sub.branch} · {sub.semester}
                          </small>
                        </td>
                        <td data-label="Submitted">
                          <span>{formatDate(sub.submittedAt)}</span>
                          <small>{formatTime(sub.submittedAt)}</small>
                        </td>
                        <td data-label="Status">
                          <span className={`tch-badge-status status-${sub.status}`}>
                            {STATUS_LABELS[sub.status] || "Submitted"}
                          </span>
                        </td>
                        <td data-label="Score">
                          {sub.grade !== null && sub.grade !== undefined ? (
                            <span
                              className={`tch-grade-pill ${
                                Number(sub.grade) >= (Number(sub.passingMarks) || 0) ? "pass" : "fail"
                              }`}
                            >
                              {sub.grade} / {sub.totalPoints}
                            </span>
                          ) : (
                            <span className="tch-ungraded-text">—</span>
                          )}
                        </td>
                        <td data-label="Action">
                          <button type="button" className="btn-table-grade" onClick={() => handleOpenEvaluation(asgn, sub)}>
                            <Award size={14} />
                            <span>{sub.status === "evaluated" ? "Review / edit" : "Grade"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Floating bulk bar */}
          {selectedRows.size > 0 && (
            <div className="bulk-bar" role="region" aria-label="Bulk actions">
              <strong>{selectedRows.size} selected</strong>
              <button type="button" className="tch-btn-primary compact" onClick={handleExportSelected}>
                <Download size={14} />
                <span>Export selected</span>
              </button>
              <button type="button" className="tch-btn-secondary compact" onClick={() => setSelectedRows(new Set())}>
                <X size={14} />
                <span>Clear</span>
              </button>
            </div>
          )}

          {filteredSubmissions.length > 0 && selectedRows.size === 0 && (
            <div className="table-footer-actions">
              <button type="button" className="tch-btn-secondary compact" onClick={handleExportSelected}>
                <Download size={14} />
                <span>Export visible ({filteredSubmissions.length})</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ================= CREATE / EDIT MODAL ================= */}
      {showFormModal &&
        createPortal(
          <div className="tch-modal-backdrop" onClick={() => setShowFormModal(false)}>
            <div className="tch-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="modal-header">
                <div>
                  <h3>{editingAssignment ? "Edit assignment" : "Create assignment"}</h3>
                  <p>Set the task, deadline, handouts and grading rubric. Save a draft any time.</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-stepper-bar">
                {STEPS.map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    className={`step-btn ${createStep === s.step ? "active" : createStep > s.step ? "done" : ""} ${
                      stepHasError(s.step) ? "has-error" : ""
                    }`}
                    onClick={() => setCreateStep(s.step)}
                  >
                    <span className="step-num">{createStep > s.step ? "✓" : s.step}</span>
                    <span className="step-label">{s.label}</span>
                  </button>
                ))}
                <div className="step-progress" style={{ "--p": `${(createStep / STEPS.length) * 100}%` }} />
              </div>

              <div className="modal-form-body">
                {/* STEP 1 */}
                {createStep === 1 && (
                  <div className="step-pane" key="s1">
                    <div className={`form-group ${formErrors.title ? "has-error" : ""}`}>
                      <label>Assignment title *</label>
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Distributed Deadlock Detection & Chandy-Misra Algorithm"
                        value={formTitle}
                        onChange={(e) => {
                          setFormTitle(e.target.value);
                          if (formErrors.title) setFormErrors((p) => ({ ...p, title: undefined }));
                        }}
                      />
                      {formErrors.title && <small className="field-error">{formErrors.title}</small>}
                    </div>

                    <div className="form-group">
                      <label>Short summary</label>
                      <input
                        type="text"
                        placeholder="e.g. Implement edge-chasing deadlock simulation in C++"
                        value={formShortDesc}
                        onChange={(e) => setFormShortDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Category</label>
                        <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Priority</label>
                        <div className="segmented">
                          {[
                            { id: "normal", label: "Normal" },
                            { id: "medium", label: "Medium" },
                            { id: "high", label: "High" }
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className={`${p.id} ${formPriority === p.id ? "active" : ""}`}
                              onClick={() => setFormPriority(p.id)}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`form-group ${formErrors.description ? "has-error" : ""}`}>
                      <label>Instructions / problem statement *</label>
                      <textarea
                        rows={6}
                        placeholder="Provide the complete question, expected input/output, constraints, and submission format…"
                        value={formDescription}
                        onChange={(e) => {
                          setFormDescription(e.target.value);
                          if (formErrors.description) setFormErrors((p) => ({ ...p, description: undefined }));
                        }}
                      />
                      <div className="field-foot">
                        {formErrors.description ? (
                          <small className="field-error">{formErrors.description}</small>
                        ) : (
                          <small />
                        )}
                        <small className="char-count">{formDescription.length} characters</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {createStep === 2 && (
                  <div className="step-pane" key="s2">
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Department / branch *</label>
                        <select value={formBranch} onChange={(e) => setFormBranch(e.target.value)}>
                          {BRANCHES.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Semester *</label>
                        <select value={formSemester} onChange={(e) => setFormSemester(e.target.value)}>
                          {SEMESTERS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className={`form-group ${formErrors.subject ? "has-error" : ""}`}>
                        <label>Course subject *</label>
                        <input
                          type="text"
                          value={formSubject}
                          onChange={(e) => {
                            setFormSubject(e.target.value);
                            if (formErrors.subject) setFormErrors((p) => ({ ...p, subject: undefined }));
                          }}
                        />
                        {formErrors.subject && <small className="field-error">{formErrors.subject}</small>}
                      </div>

                      <div className="form-group">
                        <label>Subject code</label>
                        <input type="text" value={formSubjectCode} onChange={(e) => setFormSubjectCode(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Academic year</label>
                        <select value={formAcademicYear} onChange={(e) => setFormAcademicYear(e.target.value)}>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Unit / chapter</label>
                        <input
                          type="text"
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          placeholder="e.g. Unit 3 (Concurrency & Deadlocks)"
                        />
                      </div>
                    </div>

                    <div className="scope-summary">
                      <Target size={16} />
                      <span>
                        This assignment will be sent to <strong>{formBranch}</strong> students in{" "}
                        <strong>{formSemester}</strong> ({formAcademicYear}).
                      </span>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {createStep === 3 && (
                  <div className="step-pane" key="s3">
                    <div className="form-row-2">
                      <div className={`form-group ${formErrors.dueDate ? "has-error" : ""}`}>
                        <label>Submission deadline *</label>
                        <input
                          type="date"
                          value={formDueDate}
                          onChange={(e) => {
                            setFormDueDate(e.target.value);
                            if (formErrors.dueDate) setFormErrors((p) => ({ ...p, dueDate: undefined }));
                          }}
                        />
                        {formErrors.dueDate && <small className="field-error">{formErrors.dueDate}</small>}
                        <div className="quick-chips">
                          {[
                            { d: 3, l: "+3 days" },
                            { d: 7, l: "+1 week" },
                            { d: 14, l: "+2 weeks" }
                          ].map((q) => (
                            <button key={q.d} type="button" onClick={() => setDeadlineShortcut(q.d)}>
                              {q.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Cut-off time</label>
                        <input type="time" value={formDueTime} onChange={(e) => setFormDueTime(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Total marks *</label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={formTotalPoints}
                          onChange={(e) => setFormTotalPoints(Number(e.target.value))}
                        />
                      </div>

                      <div className={`form-group ${formErrors.passing ? "has-error" : ""}`}>
                        <label>Passing marks</label>
                        <input
                          type="number"
                          min={1}
                          max={formTotalPoints}
                          value={formPassingMarks}
                          onChange={(e) => {
                            setFormPassingMarks(Number(e.target.value));
                            if (formErrors.passing) setFormErrors((p) => ({ ...p, passing: undefined }));
                          }}
                        />
                        {formErrors.passing && <small className="field-error">{formErrors.passing}</small>}
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Late submission policy</label>
                        <select value={formLatePolicy} onChange={(e) => setFormLatePolicy(e.target.value)}>
                          <option value="allowed_penalty">Allowed with penalty</option>
                          <option value="allowed_no_penalty">Allowed without penalty</option>
                          <option value="disallowed">Not allowed (hard deadline)</option>
                        </select>
                      </div>

                      {formLatePolicy === "allowed_penalty" ? (
                        <div className="form-group">
                          <label>Late penalty ({formLatePenalty}%)</label>
                          <input
                            type="range"
                            min={1}
                            max={50}
                            value={formLatePenalty}
                            onChange={(e) => setFormLatePenalty(Number(e.target.value))}
                            className="range-input"
                          />
                        </div>
                      ) : (
                        <div className="form-group">
                          <label>Max upload size (MB)</label>
                          <input
                            type="number"
                            min={1}
                            max={200}
                            value={formMaxFileSize}
                            onChange={(e) => setFormMaxFileSize(Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>

                    {formLatePolicy === "allowed_penalty" && (
                      <div className="form-group">
                        <label>Max upload size (MB)</label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={formMaxFileSize}
                          onChange={(e) => setFormMaxFileSize(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4 */}
                {createStep === 4 && (
                  <div className="step-pane" key="s4">
                    {existingRefFiles.length > 0 && (
                      <div className="form-group">
                        <label>Previously attached handouts</label>
                        <div className="ref-files-preview">
                          {existingRefFiles.map((f, i) => {
                            const isRemoved = removedAttachmentIds.includes(f._id || f.fileName);
                            return (
                              <span key={f._id || i} className={`ref-tag ${isRemoved ? "staged-removal" : ""}`}>
                                <Paperclip size={12} />
                                <span style={{ textDecoration: isRemoved ? "line-through" : "none" }}>
                                  {f.originalFileName || f.fileName} ({formatFileSize(f.fileSize)})
                                </span>
                                <button
                                  type="button"
                                  className="btn-remove-ref"
                                  onClick={() => {
                                    const fid = f._id || f.fileName;
                                    setRemovedAttachmentIds((prev) =>
                                      prev.includes(fid) ? prev.filter((x) => x !== fid) : [...prev, fid]
                                    );
                                  }}
                                  title={isRemoved ? "Undo removal" : "Remove handout"}
                                >
                                  {isRemoved ? <RotateCcw size={12} /> : <X size={12} />}
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Attach handouts or problem specifications</label>
                      <label
                        className={`dropzone ${dragOver ? "over" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          addFilesFromList(e.dataTransfer.files);
                        }}
                      >
                        <Paperclip size={20} />
                        <strong>Drop files here or click to browse</strong>
                        <small>PDF, DOCX, images, code — up to {formMaxFileSize} MB each</small>
                        <input
                          type="file"
                          multiple
                          hidden
                          onChange={(e) => {
                            addFilesFromList(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {newRefFiles.length > 0 && (
                        <div className="ref-files-preview">
                          {newRefFiles.map((f, i) => (
                            <span key={`${f.name}-${i}`} className="ref-tag new-tag">
                              <Paperclip size={12} /> {f.name} ({formatFileSize(f.size)})
                              <button
                                type="button"
                                className="btn-remove-ref"
                                onClick={() => setNewRefFiles((prev) => prev.filter((_, idx) => idx !== i))}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>External resources</label>
                      <div className="add-url-row">
                        <input
                          type="text"
                          placeholder="Link title (e.g. GitHub starter code)"
                          value={newUrlTitle}
                          onChange={(e) => setNewUrlTitle(e.target.value)}
                        />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/…"
                          value={newUrlAddress}
                          onChange={(e) => setNewUrlAddress(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-add-item"
                          onClick={() => {
                            if (!newUrlAddress.trim()) return;
                            setFormExtUrls((prev) => [
                              ...prev,
                              { title: newUrlTitle.trim() || "Cloud Link", url: newUrlAddress.trim(), provider: "website" }
                            ]);
                            setNewUrlTitle("");
                            setNewUrlAddress("");
                          }}
                        >
                          Add link
                        </button>
                      </div>

                      {formExtUrls.length > 0 && (
                        <div className="items-list">
                          {formExtUrls.map((u, i) => (
                            <div key={i} className="item-badge">
                              <ExternalLink size={12} />
                              <strong>{u.title}</strong>
                              <span className="item-url">{u.url}</span>
                              <button type="button" onClick={() => setFormExtUrls((p) => p.filter((_, idx) => idx !== i))}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <div className="rubric-head">
                        <label>Grading rubric</label>
                        <span className={`rubric-total ${rubricMismatch ? "mismatch" : "ok"}`}>
                          {rubricTotal} / {formTotalPoints} pts
                        </span>
                      </div>

                      {rubricMismatch && (
                        <div className="rubric-warning">
                          <AlertTriangle size={14} />
                          <span>Rubric points don’t add up to the total marks.</span>
                          <button type="button" onClick={scaleRubricToTotal}>
                            Rescale to {formTotalPoints}
                          </button>
                        </div>
                      )}

                      <div className="add-url-row">
                        <input
                          type="text"
                          placeholder="Criterion (e.g. Algorithm correctness)"
                          value={newRubricTitle}
                          onChange={(e) => setNewRubricTitle(e.target.value)}
                        />
                        <input
                          type="number"
                          className="pts-input"
                          placeholder="Pts"
                          value={newRubricPoints}
                          onChange={(e) => setNewRubricPoints(Number(e.target.value))}
                        />
                        <button
                          type="button"
                          className="btn-add-item"
                          onClick={() => {
                            if (!newRubricTitle.trim()) return;
                            setFormRubric((prev) => [
                              ...prev,
                              { title: newRubricTitle.trim(), maxPoints: Number(newRubricPoints) || 10, description: "" }
                            ]);
                            setNewRubricTitle("");
                            setNewRubricPoints(10);
                          }}
                        >
                          Add criterion
                        </button>
                      </div>

                      <div className="rubric-preview-list">
                        {formRubric.map((r, i) => (
                          <div key={i} className="rubric-item-row">
                            <strong>{r.title}</strong>
                            <input
                              type="number"
                              min={1}
                              className="rubric-pts-edit"
                              value={r.maxPoints}
                              onChange={(e) => {
                                const pts = Math.max(1, Number(e.target.value) || 1);
                                setFormRubric((prev) => prev.map((x, idx) => (idx === i ? { ...x, maxPoints: pts } : x)));
                              }}
                              aria-label={`Points for ${r.title}`}
                            />
                            <span>pts</span>
                            <button type="button" onClick={() => setFormRubric((p) => p.filter((_, idx) => idx !== i))}>
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-form-footer">
                <button
                  type="button"
                  className="tch-btn-secondary"
                  disabled={formSubmitting}
                  onClick={() => handleSaveAssignmentForm("draft")}
                  title="Save progress without notifying students"
                >
                  <Save size={14} />
                  <span>Save as draft</span>
                </button>

                <div className="footer-spacer" />

                {createStep > 1 && (
                  <button type="button" className="tch-btn-secondary" onClick={() => setCreateStep((s) => s - 1)}>
                    <ChevronLeft size={15} />
                    <span>Back</span>
                  </button>
                )}

                {createStep < 4 ? (
                  <button type="button" className="tch-btn-primary" onClick={goNextStep}>
                    <span>Next</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tch-btn-primary"
                    disabled={formSubmitting}
                    onClick={() => handleSaveAssignmentForm("published")}
                  >
                    <Send size={15} />
                    <span>
                      {formSubmitting ? "Saving…" : editingAssignment ? "Save & publish changes" : "Publish assignment"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= PUBLISH CONFIRMATION ================= */}
      {publishTargetAsgn &&
        createPortal(
          <div className="tch-modal-backdrop" onClick={() => setPublishTargetAsgn(null)}>
            <div className="tch-confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="dialog-header">
                <span className="dialog-icon primary">
                  <Send size={20} />
                </span>
                <div>
                  <h3>Publish to students</h3>
                  <p>Check the details below. Students are notified as soon as you publish.</p>
                </div>
              </div>

              <div className="dialog-summary-card">
                <div className="summary-row">
                  <span>Title</span>
                  <strong>{publishTargetAsgn.title}</strong>
                </div>
                <div className="summary-row">
                  <span>Subject</span>
                  <strong>{publishTargetAsgn.subject}</strong>
                </div>
                <div className="summary-row">
                  <span>Audience</span>
                  <strong>
                    {publishTargetAsgn.branch} · {publishTargetAsgn.semester}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Total marks</span>
                  <strong>{publishTargetAsgn.totalPoints} points</strong>
                </div>
                <div className="summary-row">
                  <span>Deadline</span>
                  <strong>
                    {formatDate(publishTargetAsgn.dueDate)} ({publishTargetAsgn.dueTime || "23:59"})
                  </strong>
                </div>
              </div>

              <p className="dialog-note">
                The assignment appears on the student dashboard immediately, and every enrolled student gets an in-app
                notification.
              </p>

              <div className="dialog-actions">
                <button type="button" className="tch-btn-secondary" onClick={() => setPublishTargetAsgn(null)}>
                  Cancel
                </button>
                <button type="button" className="tch-btn-primary" disabled={publishing} onClick={handleConfirmPublish}>
                  <Send size={15} />
                  <span>{publishing ? "Publishing…" : "Publish now"}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= DELETE CONFIRMATION ================= */}
      {deleteTargetAsgn &&
        createPortal(
          <div className="tch-modal-backdrop" onClick={() => setDeleteTargetAsgn(null)}>
            <div
              className="tch-confirm-dialog danger-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="dialog-header">
                <span className="dialog-icon danger">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h3>Delete assignment</h3>
                  <p>Check the academic records before you remove it.</p>
                </div>
              </div>

              <div className="dialog-summary-card danger-summary">
                <div className="summary-row">
                  <span>Assignment</span>
                  <strong>{deleteTargetAsgn.title}</strong>
                </div>
                <div className="summary-row">
                  <span>Student submissions</span>
                  <strong>{deleteSubmissionCount} turned in</strong>
                </div>
              </div>

              {deleteHasSubmissions ? (
                <div className="dialog-warning-banner">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>This assignment has student work.</strong>
                    <p>
                      Deleting it permanently removes grades and submission history. Archiving keeps the records and
                      hides the assignment instead.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="dialog-note">
                  No students have submitted work, so this can be removed safely.
                </p>
              )}

              <div className="dialog-actions">
                <button type="button" className="tch-btn-secondary" onClick={() => setDeleteTargetAsgn(null)}>
                  Cancel
                </button>

                {deleteHasSubmissions ? (
                  <>
                    <button
                      type="button"
                      className="tch-btn-secondary"
                      onClick={() => {
                        handleArchive(deleteTargetAsgn);
                        setDeleteTargetAsgn(null);
                      }}
                    >
                      <Archive size={14} /> Archive instead
                    </button>
                    <button
                      type="button"
                      className="tch-btn-danger"
                      disabled={deleting}
                      onClick={() => handleConfirmDelete(true)}
                    >
                      <span>{deleting ? "Deleting…" : "Delete permanently"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="tch-btn-danger"
                    disabled={deleting}
                    onClick={() => handleConfirmDelete(false)}
                  >
                    <span>{deleting ? "Deleting…" : "Delete"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= EVALUATION WORKSPACE ================= */}
      {evaluatingAsgn &&
        evaluatingSub &&
        createPortal(
          <div className="tch-modal-backdrop" onClick={handleCloseEvaluation}>
            <div className="tch-eval-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="eval-sheet-header">
                <div className="eval-title-block">
                  <span className="eval-sub-tag">
                    {evaluatingAsgn.subject} · {evaluatingAsgn.title}
                  </span>
                  <h3>Evaluate: {evaluatingSub.studentId?.fullName || "Student deliverable"}</h3>
                  <small>
                    Roll no: {evaluatingSub.studentId?.rollNumber || "CSE-2026"} · Submitted{" "}
                    {new Date(evaluatingSub.submittedAt).toLocaleString("en-IN")}
                  </small>
                </div>

                <div className="eval-header-tools">
                  {evalIndex >= 0 && (
                    <div className="eval-pager">
                      <button
                        type="button"
                        onClick={() => navigateEvaluation(-1)}
                        disabled={evalIndex <= 0}
                        title="Previous submission"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>
                        {evalIndex + 1} / {filteredSubmissions.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigateEvaluation(1)}
                        disabled={evalIndex >= filteredSubmissions.length - 1}
                        title="Next submission"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                  <button type="button" className="btn-close" onClick={handleCloseEvaluation} aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="eval-sheet-body">
                {/* Left pane */}
                <div className="eval-left-pane">
                  <div className="eval-section">
                    <h4>Written solution</h4>
                    <div className="student-solution-box">
                      {evaluatingSub.answerText || evaluatingSub.submissionText || (
                        <em>No written answer was submitted. Check the attached files.</em>
                      )}
                    </div>
                  </div>

                  {evaluatingSub.previousVersions && evaluatingSub.previousVersions.length > 0 && (
                    <div className="eval-section">
                      <h4>
                        Revision history ({evaluatingSub.previousVersions.length} earlier version
                        {evaluatingSub.previousVersions.length > 1 ? "s" : ""})
                      </h4>
                      <div className="eval-versions-list">
                        {evaluatingSub.previousVersions.map((v, i) => (
                          <div key={v._id || i} className="eval-version-chip">
                            <span>Version {v.version || i + 1}</span>
                            <small>{formatDate(v.submittedAt)}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="eval-section">
                    <h4>Attachments ({(evaluatingSub.attachments || []).length})</h4>
                    <div className="eval-files-list">
                      {(evaluatingSub.attachments || []).length === 0 && (
                        <div className="eval-no-files">No files attached.</div>
                      )}
                      {(evaluatingSub.attachments || []).map((f, i) => (
                        <div key={f._id || i} className="eval-file-card">
                          <FileText size={18} />
                          <div className="eval-file-info">
                            <strong>{f.originalFileName || f.fileName}</strong>
                            <span>{formatFileSize(f.fileSize)}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-eval-dl"
                            onClick={() =>
                              authApi.downloadAssignmentSubmission(
                                evaluatingAsgn.id || evaluatingAsgn._id,
                                evaluatingSub._id,
                                f._id || f.fileName,
                                f.originalFileName
                              )
                            }
                          >
                            <Download size={14} /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right pane */}
                <div className="eval-right-pane">
                  {evalRubricScores.length > 0 && (
                    <div className="eval-section">
                      <div className="rubric-head">
                        <h4>Rubric scoring</h4>
                        <span className="rubric-total ok">
                          {rubricAwardedTotal} / {rubricMaxTotal}
                        </span>
                      </div>
                      <div className="rubric-eval-list">
                        {evalRubricScores.map((r, i) => (
                          <div key={i} className="rubric-eval-row">
                            <label>
                              {r.criteriaTitle}
                              <small> max {r.maxPoints}</small>
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={r.maxPoints}
                              value={r.awardedPoints}
                              onChange={(e) => {
                                const pts = Math.max(0, Math.min(Number(r.maxPoints), Number(e.target.value) || 0));
                                setEvalRubricScores((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, awardedPoints: pts } : item))
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <button type="button" className="btn-use-rubric" onClick={applyRubricTotal}>
                        Use rubric total as final marks
                      </button>
                    </div>
                  )}

                  <div className="eval-section">
                    <label className="marks-label">Final marks (out of {evaluatingAsgn.totalPoints}) *</label>
                    <input
                      type="number"
                      min={0}
                      max={evaluatingAsgn.totalPoints}
                      className="marks-input-box"
                      value={evalGrade}
                      onChange={(e) => setEvalGrade(e.target.value)}
                    />

                    <div className="quick-chips">
                      {QUICK_PERCENTS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEvalGrade(String(Math.round((p / 100) * evalTotalPoints)))}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>

                    <div className="grade-meter">
                      <div className="grade-meter-track">
                        <div
                          className={`grade-meter-fill ${evalGradeNum === null ? "" : evalPassed ? "pass" : "fail"}`}
                          style={{ "--w": `${evalPercent}%` }}
                        />
                        {evalTotalPoints > 0 && (
                          <span className="pass-marker" style={{ left: `${(evalPassing / evalTotalPoints) * 100}%` }} />
                        )}
                      </div>
                      <div className="grade-meter-foot">
                        <span>{evalGradeNum === null ? "Enter marks" : `${Math.round(evalPercent)}%`}</span>
                        {evalGradeNum !== null && (
                          <span className={`result-pill ${evalPassed ? "pass" : "fail"}`}>
                            {evalPassed ? "Pass" : "Below passing"} (min {evalPassing})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="eval-section">
                    <label>Feedback for student</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Clear methodology and well-structured code. Add more edge-case tests next time."
                      value={evalFeedback}
                      onChange={(e) => setEvalFeedback(e.target.value)}
                    />
                  </div>

                  <div className="eval-section">
                    <label>Private remarks (faculty only — hidden from student)</label>
                    <input
                      type="text"
                      placeholder="Internal viva note or moderation remark…"
                      value={evalPrivateRemarks}
                      onChange={(e) => setEvalPrivateRemarks(e.target.value)}
                    />
                  </div>

                  <div className="eval-section correction-box">
                    <label>Revision instructions (needed to return for correction)</label>
                    <textarea
                      rows={2}
                      placeholder="Say exactly what the student needs to fix before resubmitting…"
                      value={evalCorrectionInstructions}
                      onChange={(e) => setEvalCorrectionInstructions(e.target.value)}
                    />
                  </div>

                  <div className="eval-actions-row">
                    <button
                      type="button"
                      className="btn-return-correction"
                      disabled={evaluating}
                      onClick={() => handleProcessEvaluation("return_for_correction")}
                    >
                      <RotateCcw size={14} />
                      <span>Return for correction</span>
                    </button>

                    <button
                      type="button"
                      className="tch-btn-primary"
                      disabled={evaluating}
                      onClick={() => handleProcessEvaluation("evaluate")}
                      title="Ctrl + Enter"
                    >
                      <CheckCheck size={15} />
                      <span>{evaluating ? "Publishing…" : "Publish grade"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= PREVIEW MODAL ================= */}
      {previewAssignment && (
        <AssignmentPreviewModal assignment={previewAssignment} onClose={() => setPreviewAssignment(null)} />
      )}
    </div>
  );
}