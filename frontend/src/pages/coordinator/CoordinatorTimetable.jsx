import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  Users,
  User,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Download,
  Loader2,
  Sparkles,
  RefreshCw,
  Save,
  Send,
  Eye,
  Undo,
  Redo,
  ArrowLeftRight,
  Trash2,
  Edit3,
  Settings,
  BookOpen,
  Building,
  ShieldAlert,
  History,
  BarChart3,
  Printer,
  ChevronRight,
  Check,
  X,
  Copy,
  ScanText,
  Image,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileImage,
  UploadCloud,
  Search,
  Lightbulb,
  Inbox,
  FileDown
} from "lucide-react";
import { authApi } from "../../services/authApi";
import OfficialCollegeTimetableGrid from "../../components/timetable/OfficialCollegeTimetableGrid";
import "./CoordinatorTimetable.css";

const BRANCHES = ["CSE", "ME", "EE", "CE", "ECE"];
const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];
const SECTIONS = ["A", "B", "C"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

/* -------------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------------- */
const revokeIfBlob = (url) => {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
};

const downloadCsv = (filename, header, rows) => {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const suggestionText = (s) =>
  typeof s === "string" ? s : s?.message || s?.text || s?.title || "";

/* -------------------------------------------------------------------------
   Reusable presentational components
   ------------------------------------------------------------------------- */
function StatusBadge({ status }) {
  switch (status) {
    case "published":
      return <span className="tt-badge tt-badge-published"><CheckCircle2 size={13} /> Published</span>;
    case "approved":
      return <span className="tt-badge tt-badge-approved"><Check size={13} /> Approved</span>;
    case "under_review":
      return <span className="tt-badge tt-badge-review"><Eye size={13} /> Under Review</span>;
    case "changes_requested":
      return <span className="tt-badge tt-badge-rejected"><XCircle size={13} /> Changes Requested</span>;
    case "generated":
      return <span className="tt-badge tt-badge-generated"><Sparkles size={13} /> Auto-Generated</span>;
    default:
      return <span className="tt-badge tt-badge-draft"><Edit3 size={13} /> Draft</span>;
  }
}

function Modal({ title, onClose, children, size = "md" }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="tt-modal-backdrop" onClick={() => closeRef.current?.()}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`tt-modal-dialog tt-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tt-modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={() => closeRef.current?.()} className="tt-modal-close" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ dialog, onClose }) {
  if (!dialog.open) return null;
  return (
    <Modal title={dialog.title} onClose={onClose} size="sm">
      <div className="tt-modal-body">
        <p className="tt-modal-desc">{dialog.message}</p>
      </div>
      <div className="tt-modal-footer">
        <button type="button" className="tt-btn tt-btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={`tt-btn ${dialog.tone === "danger" ? "tt-btn-danger" : dialog.tone === "success" ? "tt-btn-publish" : "tt-btn-primary"}`}
          onClick={() => {
            const fn = dialog.onConfirm;
            onClose();
            fn?.();
          }}
        >
          {dialog.confirmLabel || "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

function EmptyState({ icon: Icon = Inbox, title, text }) {
  return (
    <div className="tt-empty-state">
      <span className="tt-empty-icon"><Icon size={22} /></span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}

function LoadingSkeleton({ label }) {
  return (
    <div className="tt-loading-view" role="status" aria-live="polite">
      <div className="tt-skel-metrics">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="tt-skel tt-skel-card" />
        ))}
      </div>
      <div className="tt-skel tt-skel-block" />
      <p><Loader2 size={16} className="tt-spin" /> {label}</p>
    </div>
  );
}

function SearchField({ value, onChange, placeholder, label }) {
  return (
    <label className="tt-search-field">
      <Search size={15} aria-hidden="true" />
      <span className="tt-sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="tt-search-clear">
          <X size={13} />
        </button>
      )}
    </label>
  );
}

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function CoordinatorTimetable({ showToast }) {
  // Navigation & Cohort Filter State
  const [activeTab, setActiveTab] = useState("grid"); // grid, ocr_import, photo_direct, generator, dashboard, config, subjects, rooms, conflicts, versions, reports
  const [academicSession, setAcademicSession] = useState("2025-2026");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState("Semester 5");
  const [section, setSection] = useState("A");

  // Core Data State
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [conflicts, setConflicts] = useState({ isValid: true, blockingErrors: [], warnings: [], suggestions: [] });
  const [versions, setVersions] = useState([]);
  const [reports, setReports] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");

  // Undo / Redo History Stack
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatorRunning, setGeneratorRunning] = useState(false);
  const [generatorProgress, setGeneratorProgress] = useState(null);

  // Modals & Popovers
  const [editSlotModal, setEditSlotModal] = useState({ open: false, day: null, slotIndex: null, slotData: null });
  const [swapMode, setSwapMode] = useState({ active: false, source: null });
  const [workflowModal, setWorkflowModal] = useState({ open: false, action: "submit_for_approval", remarks: "" });
  const [roomModal, setRoomModal] = useState({ open: false, roomData: null });
  const [selectedDayFilter, setSelectedDayFilter] = useState("All");
  const [copyDayModal, setCopyDayModal] = useState({ open: false, sourceDay: null, targetDay: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    tone: "primary",
    onConfirm: null
  });

  // List filters (subjects / rooms)
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");

  // Option B — Photo OCR State
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState("");
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState("");
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrExtractedDays, setOcrExtractedDays] = useState([]);

  // Option C — Direct Photo Publishing State
  const [photoDirectFile, setPhotoDirectFile] = useState(null);
  const [photoDirectPreviewUrl, setPhotoDirectPreviewUrl] = useState("");
  const [photoDirectUploading, setPhotoDirectUploading] = useState(false);
  const [photoTitle, setPhotoTitle] = useState(`${branch} ${semester} Master Timetable`);
  const [photoCollegeName, setPhotoCollegeName] = useState("Swami Vivekanand Subharti University");
  const [photoEffectiveDate, setPhotoEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [photoNotes, setPhotoNotes] = useState("");
  const [photoZoom, setPhotoZoom] = useState(1.0);
  const [photoFullscreen, setPhotoFullscreen] = useState(false);
  const [dragTarget, setDragTarget] = useState(null); // "ocr" | "photo" | null

  const notify = (msg, type = "success") => {
    if (showToast) showToast(msg, type);
  };

  const dirty = useMemo(() => JSON.stringify(scheduleDays) !== savedSnapshot, [scheduleDays, savedSnapshot]);
  const totalPeriods = useMemo(
    () => scheduleDays.reduce((acc, d) => acc + (d.slots?.length || 0), 0),
    [scheduleDays]
  );

  const openConfirm = (opts) =>
    setConfirmDialog({ open: true, confirmLabel: "Confirm", tone: "primary", onConfirm: null, ...opts });
  const closeConfirm = () => setConfirmDialog((c) => ({ ...c, open: false }));

  // Initial Data Fetch
  useEffect(() => {
    loadAllTimetableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicSession, branch, semester, section]);

  // Release blob URLs on unmount
  const blobRefs = useRef({ ocr: "", photo: "" });
  blobRefs.current = { ocr: ocrPreviewUrl, photo: photoDirectPreviewUrl };
  useEffect(
    () => () => {
      revokeIfBlob(blobRefs.current.ocr);
      revokeIfBlob(blobRefs.current.photo);
    },
    []
  );

  // Fullscreen viewer: Escape closes
  useEffect(() => {
    if (!photoFullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setPhotoFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photoFullscreen]);

  // Grid shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redo
  useEffect(() => {
    const onKey = (e) => {
      if (activeTab !== "grid") return;
      const tag = e.target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, history, historyIndex]);

  const loadAllTimetableData = async () => {
    try {
      setLoading(true);
      const params = { academicSession, branch, semester, section };

      // Parallel data fetching for performance
      const [statsRes, configRes, subjectsRes, staffRes, roomsRes, manageRes, versionsRes, reportsRes] = await Promise.allSettled([
        authApi.getTimetableDashboardStats(params),
        authApi.getTimetableConfig(params),
        authApi.getTimetableSubjects({ branch, semester }),
        authApi.getAcademicStaffList(),
        authApi.getTimetableRooms({ branch }),
        authApi.getManageTimetable(params),
        authApi.getTimetableVersions(params),
        authApi.getTimetableReports(params)
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.stats);
      }
      if (configRes.status === "fulfilled" && configRes.value?.success) {
        setConfig(configRes.value.config);
      }
      if (subjectsRes.status === "fulfilled" && subjectsRes.value?.success) {
        setSubjects(subjectsRes.value.subjects || []);
        if (subjectsRes.value.availableTeachers && subjectsRes.value.availableTeachers.length > 0) {
          setAvailableTeachers(subjectsRes.value.availableTeachers);
        }
      }
      if (staffRes.status === "fulfilled" && staffRes.value?.success && staffRes.value.staff) {
        setAvailableTeachers(staffRes.value.staff);
      }
      if (roomsRes.status === "fulfilled" && roomsRes.value?.success) {
        setRooms(roomsRes.value.rooms || []);
      }
      if (manageRes.status === "fulfilled" && manageRes.value?.success) {
        const tt = manageRes.value.timetable;
        setTimetable(tt);
        if (tt?.imageUrl) setPhotoDirectPreviewUrl(tt.imageUrl);
        if (tt?.title) setPhotoTitle(tt.title);
        if (tt?.collegeName) setPhotoCollegeName(tt.collegeName);
        if (tt?.effectiveDate) {
          try {
            setPhotoEffectiveDate(new Date(tt.effectiveDate).toISOString().slice(0, 10));
          } catch {
            // Keep default
          }
        }
        if (tt?.scheduleDays && tt.scheduleDays.length > 0) {
          setScheduleDays(tt.scheduleDays);
          setSavedSnapshot(JSON.stringify(tt.scheduleDays));
          setHistory([JSON.stringify(tt.scheduleDays)]);
          setHistoryIndex(0);
          runConflictValidation(tt.scheduleDays);
        } else {
          setScheduleDays([]);
          setSavedSnapshot("[]");
          setHistory(["[]"]);
          setHistoryIndex(0);
        }
      }
      if (versionsRes.status === "fulfilled" && versionsRes.value?.success) {
        setVersions(versionsRes.value.versions || []);
      }
      if (reportsRes.status === "fulfilled" && reportsRes.value?.success) {
        setReports(reportsRes.value);
      }
    } catch (err) {
      console.error("Failed to load timetable data:", err);
      notify(err.message || "Failed to load timetable data.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Conflict Checking
  const runConflictValidation = async (days) => {
    try {
      const res = await authApi.checkTimetableConflicts({
        academicSession,
        branch,
        semester,
        section,
        scheduleDays: days
      });
      if (res && res.success !== undefined) {
        setConflicts({
          isValid: res.isValid,
          blockingErrors: res.blockingErrors || [],
          warnings: res.warnings || [],
          suggestions: res.suggestions || []
        });
      }
    } catch (err) {
      console.error("Conflict check error:", err);
    }
  };

  // Push to Undo Stack
  const updateScheduleDaysWithHistory = (newDays) => {
    setScheduleDays(newDays);
    const serialized = JSON.stringify(newDays);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(serialized);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    runConflictValidation(newDays);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = JSON.parse(history[historyIndex - 1]);
      setScheduleDays(prev);
      setHistoryIndex(historyIndex - 1);
      runConflictValidation(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = JSON.parse(history[historyIndex + 1]);
      setScheduleDays(next);
      setHistoryIndex(historyIndex + 1);
      runConflictValidation(next);
    }
  };

  // 1. Automatic Timetable Generation
  const handleAutoGenerate = async () => {
    try {
      setGeneratorRunning(true);
      setGeneratorProgress({ step: "Solving CSP constraints...", log: [] });

      const res = await authApi.generateTimetable({
        academicSession,
        branch,
        semester,
        section
      });

      if (res.success && res.timetable) {
        setTimetable(res.timetable);
        setScheduleDays(res.timetable.scheduleDays || []);
        setGeneratorProgress({
          step: "Completed successfully!",
          summary: res.summary,
          log: res.summary?.diagnosticLog || []
        });
        updateScheduleDaysWithHistory(res.timetable.scheduleDays || []);
        notify(`Generated ${res.summary?.totalPeriods || 0} periods with 0 collisions!`, "success");
        // Reload dashboard stats and reports
        loadAllTimetableData();
      } else {
        throw new Error(res.message || "Generation failed.");
      }
    } catch (err) {
      console.error("Auto-generation error:", err);
      notify(err.message || "Failed to generate timetable.", "error");
    } finally {
      setGeneratorRunning(false);
    }
  };

  // 2. Save Manual Changes to Database
  const handleSaveDraft = async () => {
    try {
      setActionLoading(true);
      const res = await authApi.saveManualTimetable({
        academicSession,
        branch,
        semester,
        section,
        scheduleDays,
        creationMode: "manual",
        title: photoTitle || `${branch} ${semester} Master Timetable`,
        collegeName: photoCollegeName,
        effectiveDate: photoEffectiveDate,
        status: timetable?.status === "published" ? "draft" : timetable?.status || "draft"
      });

      if (res.success) {
        setTimetable(res.timetable);
        setSavedSnapshot(JSON.stringify(scheduleDays));
        notify("Timetable draft successfully saved.", "success");
        runConflictValidation(scheduleDays);
      } else {
        throw new Error(res.message || "Failed to save.");
      }
    } catch (err) {
      notify(err.message || "Failed to save manual timetable.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Day Copy Feature
  const openCopyDay = () => {
    const firstWithSlots = DAYS.find((d) =>
      scheduleDays.some((s) => s.dayOfWeek === d && s.slots && s.slots.length > 0)
    );
    setCopyDayModal({ open: true, sourceDay: firstWithSlots || DAYS[0], targetDay: "" });
  };

  const handleCopyDay = () => {
    if (!copyDayModal.sourceDay || !copyDayModal.targetDay) {
      notify("Please select a target day to copy to.", "error");
      return;
    }
    const sourceSchedule = scheduleDays.find((d) => d.dayOfWeek === copyDayModal.sourceDay);
    if (!sourceSchedule || !sourceSchedule.slots || sourceSchedule.slots.length === 0) {
      notify(`No periods found on ${copyDayModal.sourceDay} to copy.`, "error");
      return;
    }

    const newDays = scheduleDays.map((d) => {
      if (d.dayOfWeek === copyDayModal.targetDay) {
        return {
          ...d,
          slots: sourceSchedule.slots.map((s) => ({ ...s }))
        };
      }
      return d;
    });

    if (!newDays.some((d) => d.dayOfWeek === copyDayModal.targetDay)) {
      newDays.push({
        dayOfWeek: copyDayModal.targetDay,
        slots: sourceSchedule.slots.map((s) => ({ ...s }))
      });
    }

    updateScheduleDaysWithHistory(newDays);
    notify(`Cloned ${copyDayModal.sourceDay} schedule to ${copyDayModal.targetDay}!`, "success");
    setCopyDayModal({ open: false, sourceDay: null, targetDay: "" });
  };

  // Option B — Photo OCR Handlers
  const acceptOcrFile = (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      notify("Please choose an image file (JPG, PNG or WebP).", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify("Selected image exceeds 25 MB limit.", "error");
      return;
    }
    revokeIfBlob(ocrPreviewUrl);
    setOcrFile(file);
    setOcrPreviewUrl(URL.createObjectURL(file));
    setOcrResult(null);
    setOcrExtractedDays([]);
  };

  const handleOcrFileChange = (e) => acceptOcrFile(e.target.files?.[0]);

  const handleRunOcr = async () => {
    if (!ocrFile && !ocrPreviewUrl) {
      notify("Please select a timetable image first.", "error");
      return;
    }
    try {
      setOcrProcessing(true);
      setOcrProgressText("Uploading timetable photograph...");
      let uploadedUrl = ocrPreviewUrl;

      if (ocrFile) {
        const formData = new FormData();
        formData.append("timetablePhoto", ocrFile);
        const uploadRes = await authApi.uploadTimetablePhoto(formData);
        if (uploadRes?.success && uploadRes.file?.url) {
          uploadedUrl = uploadRes.file.url;
        }
      }

      setOcrProgressText("Analyzing layout with neural OCR & fuzzy-matching academic entities...");
      const extractRes = await authApi.extractTimetablePhoto({
        imageUrl: uploadedUrl,
        branch,
        semester,
        section
      });

      if (extractRes?.success && extractRes.extraction) {
        setOcrResult(extractRes.extraction);
        setOcrExtractedDays(extractRes.extraction.scheduleDays || []);
        notify(`OCR extraction complete! Extracted with ${extractRes.extraction.confidence || 0}% confidence.`, "success");
      } else {
        throw new Error(extractRes?.message || "Failed to extract timetable.");
      }
    } catch (err) {
      console.error("OCR extraction error:", err);
      notify(err.message || "OCR extraction failed.", "error");
    } finally {
      setOcrProcessing(false);
      setOcrProgressText("");
    }
  };

  const handleApplyOcrToGrid = async () => {
    if (!ocrExtractedDays || ocrExtractedDays.length === 0) {
      notify("No extracted schedule days available.", "error");
      return;
    }
    try {
      setActionLoading(true);
      const res = await authApi.saveManualTimetable({
        academicSession,
        branch,
        semester,
        section,
        scheduleDays: ocrExtractedDays,
        creationMode: "ocr_import",
        title: `${branch} ${semester} Master Timetable`,
        status: "draft"
      });
      if (res?.success) {
        setScheduleDays(ocrExtractedDays);
        setSavedSnapshot(JSON.stringify(ocrExtractedDays));
        updateScheduleDaysWithHistory(ocrExtractedDays);
        notify("Extracted schedule applied to Master Grid & saved as Draft!", "success");
        setActiveTab("grid");
      }
    } catch (err) {
      notify(err.message || "Failed to apply extracted schedule.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Option C — Direct Photo Handlers
  const acceptPhotoDirectFile = (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      notify("Please choose an image file (JPG, PNG or WebP).", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify("Selected image exceeds 25 MB limit.", "error");
      return;
    }
    revokeIfBlob(photoDirectPreviewUrl);
    setPhotoDirectFile(file);
    setPhotoDirectPreviewUrl(URL.createObjectURL(file));
    setPhotoZoom(1.0);
  };

  const handlePhotoDirectFileChange = (e) => acceptPhotoDirectFile(e.target.files?.[0]);

  // Shared drag & drop handlers
  const dropHandlers = (target, onFile) => ({
    onDragOver: (e) => {
      e.preventDefault();
      if (dragTarget !== target) setDragTarget(target);
    },
    onDragLeave: () => setDragTarget(null),
    onDrop: (e) => {
      e.preventDefault();
      setDragTarget(null);
      onFile(e.dataTransfer?.files?.[0]);
    }
  });

  const handleSavePhotoDirect = async (submitForReview = false) => {
    if (!photoDirectFile && !photoDirectPreviewUrl) {
      notify("Please select a high-resolution timetable photograph to upload.", "error");
      return;
    }
    try {
      setPhotoDirectUploading(true);
      let finalImageUrl = photoDirectPreviewUrl;
      let originalName = photoDirectFile?.name || "timetable.jpg";
      let mimeType = photoDirectFile?.type || "image/jpeg";
      let sizeBytes = photoDirectFile?.size || 0;

      if (photoDirectFile) {
        const formData = new FormData();
        formData.append("timetablePhoto", photoDirectFile);
        const upRes = await authApi.uploadTimetablePhoto(formData);
        if (upRes?.success && upRes.file?.url) {
          finalImageUrl = upRes.file.url;
          originalName = upRes.file.originalName;
          mimeType = upRes.file.mimeType;
          sizeBytes = upRes.file.sizeBytes;
        }
      }

      const payload = {
        academicSession,
        branch,
        semester,
        section,
        title: photoTitle,
        collegeName: photoCollegeName,
        effectiveDate: photoEffectiveDate,
        imageUrl: finalImageUrl,
        imageOriginalName: originalName,
        imageMimeType: mimeType,
        imageSizeBytes: sizeBytes,
        notes: photoNotes,
        status: submitForReview ? "under_review" : "draft"
      };

      const res = await authApi.savePhotoTimetable(payload);
      if (res?.success) {
        setTimetable(res.timetable);
        notify(
          submitForReview
            ? "Photograph timetable submitted to HOD for review & approval!"
            : "Photograph timetable saved successfully as Draft!",
          "success"
        );
        loadAllTimetableData();
      }
    } catch (err) {
      console.error("Save photo timetable error:", err);
      notify(err.message || "Failed to save photo timetable.", "error");
    } finally {
      setPhotoDirectUploading(false);
    }
  };

  // 3. Workflow Action (Submit for Approval)
  const handleWorkflowAction = async () => {
    try {
      setActionLoading(true);
      const res = await authApi.handleTimetableWorkflow({
        academicSession,
        branch,
        semester,
        section,
        action: workflowModal.action,
        remarks: workflowModal.remarks
      });

      if (res.success) {
        setTimetable(res.timetable);
        setWorkflowModal({ open: false, action: "submit_for_approval", remarks: "" });
        notify(res.message || "Workflow updated successfully.", "success");
        loadAllTimetableData();
      } else {
        throw new Error(res.message || "Workflow update failed.");
      }
    } catch (err) {
      console.error("Workflow error:", err);
      notify(err.message || "Workflow action failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Publish Timetable
  const runPublish = async () => {
    try {
      setActionLoading(true);
      const res = await authApi.publishTimetable({
        academicSession,
        branch,
        semester,
        section,
        changeNotes: `Official publication for ${branch} ${semester} Section ${section}`
      });

      if (res.success) {
        setTimetable(res.timetable);
        notify(`Timetable published successfully! Version ${res.timetable?.version} snapshot created.`, "success");
        loadAllTimetableData();
      } else {
        throw new Error(res.message || "Publication failed.");
      }
    } catch (err) {
      console.error("Publish error:", err);
      notify(err.message || "Failed to publish timetable.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishTimetable = () => {
    if (conflicts.blockingErrors && conflicts.blockingErrors.length > 0) {
      notify("Cannot publish schedule with blocking conflicts. Please resolve them first.", "error");
      setActiveTab("conflicts");
      return;
    }
    openConfirm({
      title: "Publish this timetable?",
      message: dirty
        ? "You have unsaved changes in the grid. Save the draft first if you want them included. Publishing makes the saved timetable visible immediately to all students and faculty."
        : "It will become visible immediately to all students and faculty, and a version snapshot will be archived.",
      confirmLabel: "Publish now",
      tone: "success",
      onConfirm: runPublish
    });
  };

  // 5. Restore Previous Version
  const runRestoreVersion = async (versionId, versionNumber) => {
    try {
      setActionLoading(true);
      const res = await authApi.restoreTimetableVersion({ versionId });
      if (res.success) {
        setTimetable(res.timetable);
        setScheduleDays(res.timetable.scheduleDays || []);
        notify(`Timetable successfully restored from Version ${versionNumber}.`, "success");
        loadAllTimetableData();
      } else {
        throw new Error(res.message || "Failed to restore version.");
      }
    } catch (err) {
      console.error("Restore error:", err);
      notify(err.message || "Failed to restore version.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreVersion = (versionId, versionNumber) => {
    openConfirm({
      title: `Restore Version ${versionNumber}?`,
      message: "Current changes will be replaced by the archived snapshot.",
      confirmLabel: "Restore version",
      tone: "danger",
      onConfirm: () => runRestoreVersion(versionId, versionNumber)
    });
  };

  // Slot Editing & Deletion
  const handleOpenEditSlot = (dayName, slotIndex, slot) => {
    setEditSlotModal({
      open: true,
      day: dayName,
      slotIndex,
      slotData: slot
        ? { ...slot }
        : {
            periodNumber: (config?.slots?.filter((s) => !s.isBreak).length || 7),
            startTime: "08:00",
            endTime: "09:00",
            subject: subjects[0]?.name || "",
            subjectCode: subjects[0]?.code || "",
            teacherName: subjects[0]?.assignedTeacherName || "",
            roomNo: rooms[0]?.roomNumber || "LT-101",
            type: "Theory",
            color: "#EFF6FF"
          }
    });
  };

  const closeEditSlot = () => setEditSlotModal({ open: false, day: null, slotIndex: null, slotData: null });

  const handleSaveSlotModal = () => {
    const { day, slotIndex, slotData } = editSlotModal;
    if (!slotData.subject) {
      notify("Subject is required.", "error");
      return;
    }

    const newDays = JSON.parse(JSON.stringify(scheduleDays));
    let targetDay = newDays.find((d) => d.dayOfWeek === day);

    if (!targetDay) {
      targetDay = { dayOfWeek: day, slots: [] };
      newDays.push(targetDay);
    }

    // Auto assign subject details if matched
    const subObj = subjects.find((s) => s.name === slotData.subject || s.code === slotData.subjectCode);
    const selTeacher = availableTeachers.find(
      (t) => t.fullName === slotData.teacherName || String(t._id) === String(slotData.teacherId)
    );

    const enrichedSlot = {
      ...slotData,
      subjectCode: subObj?.code || slotData.subjectCode,
      teacherId: selTeacher?._id || subObj?.assignedTeacherId?._id || subObj?.assignedTeacherId || slotData.teacherId,
      teacherName: selTeacher?.fullName || slotData.teacherName || subObj?.assignedTeacherName || "Faculty Lead",
      teacherDesignation: selTeacher?.designation || slotData.teacherDesignation || "",
      type: slotData.type || (subObj?.type === "practical" ? "Practical" : "Theory"),
      color: slotData.type === "Practical" ? "#F5F3FF" : "#EFF6FF",
      isConsecutive: Boolean(slotData.isConsecutive),
      consecutiveIndex: slotData.isConsecutive ? 1 : undefined,
      notes: slotData.notes || ""
    };

    if (slotIndex !== null && targetDay.slots[slotIndex]) {
      targetDay.slots[slotIndex] = enrichedSlot;
    } else {
      targetDay.slots.push(enrichedSlot);
    }

    // Sort slots by start time
    targetDay.slots.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    if (activeTab === "ocr_import") {
      const newExtracted = JSON.parse(JSON.stringify(ocrExtractedDays));
      let ocrDay = newExtracted.find((d) => d.dayOfWeek === day);
      if (!ocrDay) {
        ocrDay = { dayOfWeek: day, slots: [] };
        newExtracted.push(ocrDay);
      }
      if (slotIndex !== null && ocrDay.slots[slotIndex]) {
        ocrDay.slots[slotIndex] = enrichedSlot;
      } else {
        ocrDay.slots.push(enrichedSlot);
      }
      ocrDay.slots.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
      setOcrExtractedDays(newExtracted);
      closeEditSlot();
      notify("Extracted period updated.", "success");
      return;
    }

    closeEditSlot();
    updateScheduleDaysWithHistory(newDays);
    notify("Class period updated.", "success");
  };

  const handleDeleteSlot = (dayName, slotIndex) => {
    if (activeTab === "ocr_import") {
      const newExtracted = JSON.parse(JSON.stringify(ocrExtractedDays));
      const targetDay = newExtracted.find((d) => d.dayOfWeek === dayName);
      if (targetDay && targetDay.slots) {
        targetDay.slots.splice(slotIndex, 1);
        setOcrExtractedDays(newExtracted);
        notify("Extracted period removed.", "success");
      }
      return;
    }
    const newDays = JSON.parse(JSON.stringify(scheduleDays));
    const targetDay = newDays.find((d) => d.dayOfWeek === dayName);
    if (targetDay && targetDay.slots) {
      targetDay.slots.splice(slotIndex, 1);
      updateScheduleDaysWithHistory(newDays);
      notify("Period removed.", "success");
    }
  };

  // Swap Slots
  const handleSlotClickForSwap = (dayName, slotIndex, slot) => {
    if (!swapMode.active) return;

    if (!swapMode.source) {
      setSwapMode({ active: true, source: { day: dayName, slotIndex, slot } });
      notify("Selected first slot. Now click the second slot to swap.", "info");
    } else {
      // Execute swap
      const source = swapMode.source;
      const newDays = JSON.parse(JSON.stringify(scheduleDays));

      const dayA = newDays.find((d) => d.dayOfWeek === source.day);
      const dayB = newDays.find((d) => d.dayOfWeek === dayName);

      if (dayA && dayB) {
        const slotA = dayA.slots[source.slotIndex];
        const slotB = dayB.slots[slotIndex];

        // Swap subject, teacher, room, type but preserve time/period
        const temp = {
          subject: slotA.subject,
          subjectCode: slotA.subjectCode,
          teacherId: slotA.teacherId,
          teacherName: slotA.teacherName,
          room: slotA.room,
          roomNo: slotA.roomNo,
          type: slotA.type,
          color: slotA.color
        };

        dayA.slots[source.slotIndex] = {
          ...slotA,
          subject: slotB.subject,
          subjectCode: slotB.subjectCode,
          teacherId: slotB.teacherId,
          teacherName: slotB.teacherName,
          room: slotB.room,
          roomNo: slotB.roomNo,
          type: slotB.type,
          color: slotB.color
        };

        dayB.slots[slotIndex] = {
          ...slotB,
          ...temp
        };

        updateScheduleDaysWithHistory(newDays);
        setSwapMode({ active: false, source: null });
        notify(`Swapped "${slotA.subject}" with "${slotB.subject}".`, "success");
      }
    }
  };

  // Config Saving
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await authApi.saveTimetableConfig(config);
      if (res.success) {
        setConfig(res.config);
        notify("Academic timetable configuration updated.", "success");
      }
    } catch (err) {
      notify(err.message || "Failed to save configuration.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Report exports
  const exportFacultyCsv = () => {
    const rows = (reports?.facultyWorkload || []).map((fw) => [
      fw.teacherName,
      fw.periods,
      fw.maxAllowed,
      `${fw.utilizationPercentage}%`
    ]);
    if (rows.length === 0) {
      notify("No faculty workload data to export.", "error");
      return;
    }
    downloadCsv(
      `faculty-workload-${branch}-${semester.replace(/\s+/g, "")}.csv`,
      ["Faculty", "Weekly Periods", "Max Allowed", "Utilization"],
      rows
    );
  };

  const exportRoomsCsv = () => {
    const rows = (reports?.roomUtilization || []).map((ru) => [
      ru.roomNo,
      ru.periodsBooked,
      ru.maxSlots,
      `${ru.utilizationPercentage}%`
    ]);
    if (rows.length === 0) {
      notify("No room utilization data to export.", "error");
      return;
    }
    downloadCsv(
      `room-utilization-${branch}-${semester.replace(/\s+/g, "")}.csv`,
      ["Room", "Periods Booked", "Weekly Slots", "Utilization"],
      rows
    );
  };

  // Filtered lists
  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return subjects.filter((s) => {
      if (subjectTypeFilter !== "all" && s.type !== subjectTypeFilter) return false;
      if (!q) return true;
      return (
        String(s.code || "").toLowerCase().includes(q) ||
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.assignedTeacherName || "").toLowerCase().includes(q)
      );
    });
  }, [subjects, subjectSearch, subjectTypeFilter]);

  const roomTypes = useMemo(() => Array.from(new Set(rooms.map((r) => r.type).filter(Boolean))), [rooms]);

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    return rooms.filter((r) => {
      if (roomTypeFilter !== "all" && r.type !== roomTypeFilter) return false;
      if (!q) return true;
      return (
        String(r.roomNumber || "").toLowerCase().includes(q) ||
        String(r.building || "").toLowerCase().includes(q) ||
        String(r.type || "").toLowerCase().includes(q)
      );
    });
  }, [rooms, roomSearch, roomTypeFilter]);

  // Tab definitions
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "grid", label: "Option A: Manual Grid", icon: Edit3, count: totalPeriods > 0 ? totalPeriods : null },
    { id: "ocr_import", label: "Option B: Photo OCR", icon: ScanText },
    { id: "photo_direct", label: "Option C: Photo Publish", icon: Image },
    { id: "generator", label: "Auto-Generator", icon: Sparkles },
    { id: "conflicts", label: "Conflict Center", icon: ShieldAlert, conflictBadge: true },
    { id: "config", label: "Academic Config", icon: Settings },
    { id: "subjects", label: "Staff Mapping", icon: BookOpen, count: subjects.length },
    { id: "rooms", label: "Classrooms & Labs", icon: Building, count: rooms.length },
    { id: "versions", label: "Versions", icon: History, count: versions.length },
    { id: "reports", label: "Reports & Print", icon: Printer }
  ];

  const handleTabKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActiveTab(tabs[next].id);
    setTimeout(() => document.getElementById(`tt-tab-${tabs[next].id}`)?.focus(), 0);
  };

  const blockingCount = conflicts.blockingErrors?.length || 0;
  const warningCount = conflicts.warnings?.length || 0;

  return (
    <div className="coord-tt-studio">
      {/* 1. TOP HEADER & COHORT SELECTOR */}
      <header className="tt-studio-header">
        <div className="tt-header-title-row">
          <div className="tt-header-copy">
            <div className="tt-breadcrumb">
              <span>Academic Management</span>
              <ChevronRight size={14} aria-hidden="true" />
              <span>Timetable Studio</span>
            </div>
            <h1 className="tt-main-title">Timetable Management Studio</h1>
            <p className="tt-subtitle">
              Automated constraint-based scheduling, manual master grid editor, and multi-department publication workflow.
            </p>
          </div>

          <div className="tt-header-status-box">
            <div className="tt-current-status-label">Master Status</div>
            <StatusBadge status={timetable?.status || "draft"} />
            <div className="tt-status-meta">
              <span className="tt-version-pill">Version {timetable?.version || 1}.0</span>
              {dirty && (
                <span className="tt-dirty-pill" title="The grid has changes that are not saved yet">
                  <span className="tt-dirty-dot" aria-hidden="true" /> Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* COHORT FILTERS BAR */}
        <div className="tt-filters-bar">
          <div className="tt-filter-item">
            <label htmlFor="tt-f-session">Academic Session</label>
            <select
              id="tt-f-session"
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              className="tt-select"
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="tt-filter-item">
            <label htmlFor="tt-f-branch">Branch / Department</label>
            <select
              id="tt-f-branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="tt-select"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="tt-filter-item">
            <label htmlFor="tt-f-sem">Semester</label>
            <select
              id="tt-f-sem"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="tt-select"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="tt-filter-item">
            <label htmlFor="tt-f-sec">Section</label>
            <select
              id="tt-f-sec"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="tt-select"
            >
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div className="tt-filter-actions">
            <button
              onClick={handleAutoGenerate}
              disabled={generatorRunning || actionLoading}
              className="tt-btn tt-btn-primary"
              title="Run constraint-based automatic timetable generator"
            >
              {generatorRunning ? <Loader2 size={15} className="tt-spin" /> : <Sparkles size={15} />}
              <span>Auto-Generate</span>
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={actionLoading}
              className="tt-btn tt-btn-secondary"
            >
              {actionLoading ? <Loader2 size={15} className="tt-spin" /> : <Save size={15} />}
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => setWorkflowModal({ open: true, action: "submit_for_approval", remarks: "" })}
              disabled={actionLoading || timetable?.status === "published"}
              className="tt-btn tt-btn-accent"
            >
              <Send size={15} />
              <span>Submit to HOD</span>
            </button>

            <button
              onClick={handlePublishTimetable}
              disabled={actionLoading}
              className="tt-btn tt-btn-publish"
            >
              <CheckCircle2 size={15} />
              <span>Publish</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS BAR */}
        <nav className="tt-nav-tabs" role="tablist" aria-label="Timetable studio sections">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tt-tab-${tab.id}`}
                role="tab"
                aria-selected={active}
                aria-controls="tt-tab-panel"
                tabIndex={active ? 0 : -1}
                className={`tt-nav-tab ${active ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count !== undefined && <span className="tt-tab-count">{tab.count}</span>}
                {tab.conflictBadge &&
                  (blockingCount > 0 ? (
                    <span className="tt-tab-badge-error">{blockingCount}</span>
                  ) : (
                    <span className="tt-tab-badge-ok">0</span>
                  ))}
              </button>
            );
          })}
        </nav>
      </header>

      {/* 2. BODY CONTENT ROUTED BY TAB */}
      <main className="tt-studio-content">
        {loading ? (
          <LoadingSkeleton label={`Loading ${branch} ${semester} timetable configuration...`} />
        ) : (
          <div
            key={activeTab}
            className="tt-panel"
            id="tt-tab-panel"
            role="tabpanel"
            aria-labelledby={`tt-tab-${activeTab}`}
          >
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="tt-dashboard-tab">
                {/* METRICS ROW */}
                <div className="tt-metrics-grid">
                  <div className="tt-metric-card">
                    <div className="tt-metric-icon tt-icon-orange">
                      <BarChart3 size={20} />
                    </div>
                    <div className="tt-metric-info">
                      <span className="tt-metric-label">Weekly Completion</span>
                      <span className="tt-metric-val">{stats?.weeklyCompletionRate || 0}%</span>
                      <div
                        className="tt-progress-track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={stats?.weeklyCompletionRate || 0}
                        aria-label="Weekly completion"
                      >
                        <div
                          className="tt-progress-fill"
                          style={{ width: `${Math.min(100, stats?.weeklyCompletionRate || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="tt-metric-card">
                    <div className="tt-metric-icon tt-icon-blue">
                      <Calendar size={20} />
                    </div>
                    <div className="tt-metric-info">
                      <span className="tt-metric-label">Scheduled Periods</span>
                      <span className="tt-metric-val">{stats?.totalScheduledPeriods || 0}</span>
                      <span className="tt-metric-sub">
                        {stats?.theoryPeriods || 0} Theory · {stats?.practicalPeriods || 0} Practical
                      </span>
                    </div>
                  </div>

                  <div className="tt-metric-card">
                    <div className="tt-metric-icon tt-icon-green">
                      <Users size={20} />
                    </div>
                    <div className="tt-metric-info">
                      <span className="tt-metric-label">Active Faculty</span>
                      <span className="tt-metric-val">{stats?.activeFacultyCount || 0}</span>
                      <span className="tt-metric-sub">Out of {stats?.totalFaculty || 0} department teachers</span>
                    </div>
                  </div>

                  <div className="tt-metric-card">
                    <div className="tt-metric-icon tt-icon-purple">
                      <Building size={20} />
                    </div>
                    <div className="tt-metric-info">
                      <span className="tt-metric-label">Rooms Booked</span>
                      <span className="tt-metric-val">{stats?.activeRoomsCount || 0}</span>
                      <span className="tt-metric-sub">{stats?.totalRooms || 0} campus rooms available</span>
                    </div>
                  </div>
                </div>

                {/* QUICK ACTIONS & NOTICES */}
                <div className="tt-dashboard-row">
                  <div className="tt-card tt-quick-actions-card">
                    <h3 className="tt-card-title">Quick Actions</h3>
                    <div className="tt-action-pills-list">
                      <button onClick={() => setActiveTab("generator")} className="tt-action-pill">
                        <Sparkles size={16} className="tt-color-orange" />
                        <div>
                          <strong>Run Auto-Scheduler</strong>
                          <p>Generate optimized schedule adhering to faculty & room constraints.</p>
                        </div>
                      </button>

                      <button onClick={() => setActiveTab("grid")} className="tt-action-pill">
                        <Calendar size={16} className="tt-color-blue" />
                        <div>
                          <strong>Interactive Grid Editor</strong>
                          <p>Click, add, swap or modify individual class periods.</p>
                        </div>
                      </button>

                      <button onClick={() => setActiveTab("conflicts")} className="tt-action-pill">
                        <ShieldAlert size={16} className="tt-color-red" />
                        <div>
                          <strong>Conflict Diagnostic Center</strong>
                          <p>
                            {blockingCount > 0
                              ? `${blockingCount} blocking collisions detected!`
                              : "All constraints verified. 0 clashes found."}
                          </p>
                        </div>
                      </button>

                      <button onClick={() => setActiveTab("reports")} className="tt-action-pill">
                        <Printer size={16} className="tt-color-green" />
                        <div>
                          <strong>Print Official Timetable</strong>
                          <p>Export department master grid or faculty workload distribution.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* RECENT ACTIVITIES LIST */}
                  <div className="tt-card tt-recent-activity-card">
                    <h3 className="tt-card-title">Timetable Change History</h3>
                    <div className="tt-activity-timeline">
                      {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                        stats.recentActivities.map((act) => (
                          <div key={act.id} className="tt-timeline-item">
                            <div className="tt-timeline-dot" />
                            <div className="tt-timeline-body">
                              <div className="tt-timeline-title">
                                <strong>{act.branch} {act.semester} (Sec {act.section})</strong>
                                <span className={`tt-status-badge-${act.status}`}>{act.status}</span>
                              </div>
                              <div className="tt-timeline-sub">
                                Version {act.version}.0 · {act.lastAction?.remarks || "Updated"}
                              </div>
                              <span className="tt-timeline-time">
                                {new Date(act.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          icon={History}
                          title="No activity yet"
                          text="Saves, submissions and publications will appear here."
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE WEEKLY GRID EDITOR */}
            {activeTab === "grid" && (
              <div className="tt-grid-tab">
                {/* GRID TOOLBAR */}
                <div className="tt-grid-toolbar">
                  <div className="tt-toolbar-left">
                    <span className="tt-grid-cohort-badge">
                      {branch} — {semester} (Section {section})
                    </span>

                    {/* DAY FILTER PILLS */}
                    <div className="tt-day-pills" role="group" aria-label="Filter by day">
                      <button
                        className={`tt-day-pill ${selectedDayFilter === "All" ? "active" : ""}`}
                        aria-pressed={selectedDayFilter === "All"}
                        onClick={() => setSelectedDayFilter("All")}
                      >
                        All Days
                      </button>
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          className={`tt-day-pill ${selectedDayFilter === d ? "active" : ""}`}
                          aria-pressed={selectedDayFilter === d}
                          onClick={() => setSelectedDayFilter(d)}
                          title={d}
                        >
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tt-toolbar-right">
                    {/* SWAP MODE BUTTON */}
                    <button
                      className={`tt-tool-btn ${swapMode.active ? "tt-tool-active" : ""}`}
                      onClick={() => setSwapMode({ active: !swapMode.active, source: null })}
                      title="Click two periods to swap them"
                      aria-pressed={swapMode.active}
                    >
                      <ArrowLeftRight size={15} />
                      <span>{swapMode.active ? "Cancel Swap" : "Swap Periods"}</span>
                    </button>

                    <button
                      className="tt-tool-btn"
                      onClick={openCopyDay}
                      title="Duplicate one day's periods onto another day"
                    >
                      <Copy size={15} />
                      <span>Clone Day</span>
                    </button>

                    {/* UNDO / REDO BUTTONS */}
                    <button
                      className="tt-tool-btn tt-tool-icon"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      title="Undo last modification (Ctrl+Z)"
                      aria-label="Undo"
                    >
                      <Undo size={15} />
                    </button>
                    <button
                      className="tt-tool-btn tt-tool-icon"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      title="Redo modification (Ctrl+Y)"
                      aria-label="Redo"
                    >
                      <Redo size={15} />
                    </button>

                    <button
                      className="tt-btn tt-btn-primary"
                      onClick={() => handleOpenEditSlot(DAYS[0], null, null)}
                    >
                      <Plus size={15} />
                      <span>Add Class</span>
                    </button>
                  </div>
                </div>

                {swapMode.active && (
                  <div className="tt-swap-hint" role="status">
                    <ArrowLeftRight size={16} />
                    <span>
                      {swapMode.source
                        ? `Selected ${swapMode.source.slot?.subject || "first period"}. Now pick the second period to swap with.`
                        : "Swap mode is on. Pick the first period to swap."}
                    </span>
                  </div>
                )}

                {/* CONFLICT WARNING BANNER ON TOP OF GRID */}
                {blockingCount > 0 && (
                  <div className="tt-conflict-alert-banner" role="alert">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>{blockingCount} Scheduling Conflicts Detected</strong>
                      <p>{conflicts.blockingErrors[0].message}</p>
                    </div>
                    <button onClick={() => setActiveTab("conflicts")} className="tt-alert-action-btn">
                      View All
                    </button>
                  </div>
                )}

                {/* MASTER TIMETABLE GRID TABLE */}
                <OfficialCollegeTimetableGrid
                  scheduleDays={scheduleDays}
                  isOcrDraft={false}
                  editable={true}
                  onEditSlot={(day, slotIdx, slot) => handleOpenEditSlot(day, slotIdx, slot)}
                  onDeleteSlot={(day, slotIdx) => handleDeleteSlot(day, slotIdx)}
                  onAddSlot={(day, periodNumber, defaultData) => handleOpenEditSlot(day, null, defaultData)}
                  onSlotClickForSwap={(day, slotIdx, slot) => handleSlotClickForSwap(day, slotIdx, slot)}
                  swapMode={swapMode}
                  branch={branch}
                  semester={semester}
                  academicSession={academicSession}
                  selectedDayFilter={selectedDayFilter}
                  status={timetable?.status || "draft"}
                />
              </div>
            )}

            {/* TAB: OPTION B — PHOTO OCR IMPORT */}
            {activeTab === "ocr_import" && (
              <div className="tt-ocr-tab">
                <div className="tt-ocr-hero">
                  <div className="tt-ocr-hero-content">
                    <span className="tt-mode-badge tt-mode-b">
                      <ScanText size={14} /> Option B Engine
                    </span>
                    <h2>Upload Timetable Photograph & Import via AI OCR</h2>
                    <p>
                      Upload a scanned photograph or document of your physical timetable. The OCR engine reads the grid layout,
                      detects subjects, faculty, classrooms, and period timings, fuzzy-matching them against verified MongoDB academic records
                      to create a structured, editable draft.
                    </p>
                  </div>
                </div>

                {/* UPLOAD & CONTROLS CARD */}
                <div className="tt-card tt-ocr-upload-card">
                  <div className="tt-ocr-upload-grid">
                    <div
                      className={`tt-dropzone-box ${dragTarget === "ocr" ? "is-dragging" : ""}`}
                      {...dropHandlers("ocr", acceptOcrFile)}
                    >
                      <input
                        type="file"
                        id="tt-ocr-file-input"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleOcrFileChange}
                        className="tt-file-input"
                      />
                      <label htmlFor="tt-ocr-file-input" className="tt-dropzone-label">
                        <UploadCloud size={40} className="tt-color-orange" />
                        <span className="tt-dropzone-title">
                          {ocrFile ? ocrFile.name : "Select or Drop Timetable Photograph"}
                        </span>
                        <span className="tt-dropzone-sub">
                          Supports high-res JPG, PNG, WebP up to 25 MB
                        </span>
                        <span className="tt-btn tt-btn-secondary tt-btn-small">
                          <FileImage size={14} /> Browse Photo
                        </span>
                      </label>
                    </div>

                    {ocrPreviewUrl ? (
                      <div className="tt-ocr-preview-panel">
                        <div className="tt-ocr-preview-header">
                          <span className="tt-preview-label">Document Scan Preview</span>
                          <span className="tt-preview-meta">
                            {ocrFile ? `${(ocrFile.size / (1024 * 1024)).toFixed(2)} MB` : "Uploaded"}
                          </span>
                        </div>
                        <div className="tt-ocr-img-wrap">
                          <img src={ocrPreviewUrl} alt="Timetable Document" className="tt-ocr-preview-img" />
                        </div>
                        <div className="tt-ocr-extract-actions">
                          <button
                            type="button"
                            onClick={handleRunOcr}
                            disabled={ocrProcessing}
                            className="tt-btn tt-btn-primary tt-btn-large"
                          >
                            {ocrProcessing ? (
                              <>
                                <Loader2 size={16} className="tt-spin" />
                                <span>{ocrProgressText || "Extracting Timetable..."}</span>
                              </>
                            ) : (
                              <>
                                <ScanText size={16} />
                                <span>Run AI OCR Extraction</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="tt-ocr-empty-preview">
                        <ScanText size={48} className="tt-color-muted" />
                        <p>Upload a photograph to run layout analysis and entity extraction.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* EXTRACTED DRAFT RESULTS */}
                {ocrResult && (
                  <div className="tt-ocr-results-wrapper">
                    <OfficialCollegeTimetableGrid
                      scheduleDays={ocrExtractedDays}
                      isOcrDraft={true}
                      ocrConfidenceScore={ocrResult?.confidence || 96}
                      onApplyOcr={handleApplyOcrToGrid}
                      editable={true}
                      onEditSlot={(day, slotIdx, slot) => handleOpenEditSlot(day, slotIdx, slot)}
                      onDeleteSlot={(day, slotIdx) => handleDeleteSlot(day, slotIdx)}
                      onAddSlot={(day, periodNumber, defaultData) => handleOpenEditSlot(day, null, defaultData)}
                      branch={branch}
                      semester={semester}
                      academicSession={academicSession}
                      selectedDayFilter={selectedDayFilter}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB: OPTION C — DIRECT PHOTO PUBLISHING */}
            {activeTab === "photo_direct" && (
              <div className="tt-photo-direct-tab">
                <div className="tt-photo-hero">
                  <div className="tt-photo-hero-content">
                    <span className="tt-mode-badge tt-mode-c">
                      <Image size={14} /> Option C Engine
                    </span>
                    <h2>Upload & Publish Official Timetable Photograph Directly</h2>
                    <p>
                      Publish approved physical, signed, or stamped timetable documents without creating synthetic lecture records.
                      The official photograph is saved directly in MongoDB and served to students and teachers with interactive zoom,
                      pan, full-screen, and print controls.
                    </p>
                  </div>
                </div>

                <div className="tt-photo-direct-layout">
                  {/* METADATA FORM CARD */}
                  <div className="tt-card tt-photo-meta-card">
                    <h3 className="tt-card-title">Timetable Photograph Details</h3>
                    <p className="tt-card-sub">Set academic metadata to accompany the official timetable photograph.</p>

                    <div className="tt-form-group">
                      <label htmlFor="tt-photo-title">Timetable Title</label>
                      <input
                        id="tt-photo-title"
                        type="text"
                        value={photoTitle}
                        onChange={(e) => setPhotoTitle(e.target.value)}
                        className="tt-input"
                        placeholder="e.g. B.Tech Computer Science & Engineering - Semester 5 Master Timetable (Fall 2025)"
                      />
                    </div>

                    <div className="tt-form-row">
                      <div className="tt-form-group">
                        <label htmlFor="tt-photo-college">College / Institution Name</label>
                        <input
                          id="tt-photo-college"
                          type="text"
                          value={photoCollegeName}
                          onChange={(e) => setPhotoCollegeName(e.target.value)}
                          className="tt-input"
                        />
                      </div>
                      <div className="tt-form-group">
                        <label htmlFor="tt-photo-date">Effective Date</label>
                        <input
                          id="tt-photo-date"
                          type="date"
                          value={photoEffectiveDate}
                          onChange={(e) => setPhotoEffectiveDate(e.target.value)}
                          className="tt-input"
                        />
                      </div>
                    </div>

                    <div className="tt-form-row tt-form-row-3">
                      <div className="tt-form-group">
                        <label htmlFor="tt-photo-branch">Branch</label>
                        <input id="tt-photo-branch" type="text" value={branch} disabled className="tt-input tt-input-disabled" />
                      </div>
                      <div className="tt-form-group">
                        <label htmlFor="tt-photo-sem">Semester</label>
                        <input id="tt-photo-sem" type="text" value={semester} disabled className="tt-input tt-input-disabled" />
                      </div>
                      <div className="tt-form-group">
                        <label htmlFor="tt-photo-sec">Section</label>
                        <input id="tt-photo-sec" type="text" value={`Section ${section}`} disabled className="tt-input tt-input-disabled" />
                      </div>
                    </div>

                    <div className="tt-form-group">
                      <label htmlFor="tt-photo-notes">Administrative Remarks / Notes</label>
                      <textarea
                        id="tt-photo-notes"
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        className="tt-textarea"
                        placeholder="e.g. Approved by Dean of Academics. Includes all lab groups A1, A2."
                        rows={3}
                      />
                    </div>

                    {/* ACTIONS */}
                    <div className="tt-photo-actions-row">
                      <button
                        type="button"
                        onClick={() => handleSavePhotoDirect(false)}
                        disabled={photoDirectUploading}
                        className="tt-btn tt-btn-secondary"
                      >
                        {photoDirectUploading ? <Loader2 size={15} className="tt-spin" /> : <Save size={15} />}
                        <span>Save Photo Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSavePhotoDirect(true)}
                        disabled={photoDirectUploading}
                        className="tt-btn tt-btn-accent"
                      >
                        {photoDirectUploading ? <Loader2 size={15} className="tt-spin" /> : <Send size={15} />}
                        <span>Submit Photo to HOD</span>
                      </button>
                    </div>
                  </div>

                  {/* PHOTOGRAPH VIEWER & UPLOADER */}
                  <div className="tt-card tt-photo-viewer-card">
                    <div className="tt-photo-viewer-header">
                      <div>
                        <h3 className="tt-card-title">Interactive Photograph Viewer</h3>
                        <span className="tt-card-sub tt-card-sub-inline">Crisp high-resolution pan and zoom viewer</span>
                      </div>

                      {photoDirectPreviewUrl && (
                        <div className="tt-photo-controls" role="toolbar" aria-label="Photograph controls">
                          <button
                            type="button"
                            className="tt-photo-ctrl-btn"
                            onClick={() => setPhotoZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
                            title="Zoom Out"
                            aria-label="Zoom out"
                          >
                            <ZoomOut size={15} />
                          </button>
                          <span className="tt-photo-zoom-level" aria-live="polite">{Math.round(photoZoom * 100)}%</span>
                          <button
                            type="button"
                            className="tt-photo-ctrl-btn"
                            onClick={() => setPhotoZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
                            title="Zoom In"
                            aria-label="Zoom in"
                          >
                            <ZoomIn size={15} />
                          </button>
                          <button
                            type="button"
                            className="tt-photo-ctrl-btn"
                            onClick={() => setPhotoZoom(1.0)}
                            title="Reset Zoom"
                            aria-label="Reset zoom"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            type="button"
                            className="tt-photo-ctrl-btn"
                            onClick={() => setPhotoFullscreen(true)}
                            title="Fullscreen"
                            aria-label="Open fullscreen"
                          >
                            <Maximize2 size={15} />
                          </button>
                          <a
                            href={photoDirectPreviewUrl}
                            download="timetable_official.jpg"
                            target="_blank"
                            rel="noreferrer"
                            className="tt-photo-ctrl-btn"
                            title="Download Image"
                            aria-label="Download image"
                          >
                            <Download size={15} />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="tt-photo-viewer-viewport">
                      {photoDirectPreviewUrl ? (
                        <div
                          className="tt-photo-img-scroller"
                          style={{
                            transform: `scale(${photoZoom})`,
                            transformOrigin: "top center"
                          }}
                        >
                          <img
                            src={photoDirectPreviewUrl}
                            alt="Official Timetable Photograph"
                            className="tt-photo-interactive-img"
                          />
                        </div>
                      ) : (
                        <div
                          className={`tt-photo-empty-dropzone ${dragTarget === "photo" ? "is-dragging" : ""}`}
                          {...dropHandlers("photo", acceptPhotoDirectFile)}
                        >
                          <input
                            type="file"
                            id="tt-direct-photo-input"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handlePhotoDirectFileChange}
                            className="tt-file-input"
                          />
                          <label htmlFor="tt-direct-photo-input" className="tt-dropzone-label">
                            <UploadCloud size={48} className="tt-color-orange" />
                            <span className="tt-dropzone-title">Upload Official Timetable Photograph</span>
                            <span className="tt-dropzone-sub">
                              High-resolution camera photo, scan, or digital timetable sheet (JPG, PNG, WebP up to 25 MB)
                            </span>
                            <span className="tt-btn tt-btn-primary tt-btn-small">
                              <FileImage size={14} /> Select Timetable Photo
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {photoDirectPreviewUrl && (
                      <div className="tt-photo-change-bar">
                        <input
                          type="file"
                          id="tt-change-photo-input"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handlePhotoDirectFileChange}
                          className="tt-file-input"
                        />
                        <label htmlFor="tt-change-photo-input" className="tt-btn tt-btn-secondary tt-btn-small">
                          <FileImage size={13} /> Replace Photograph
                        </label>
                        <span className="tt-photo-status-indicator">
                          <CheckCircle2 size={13} /> Photograph loaded and ready for publishing
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AUTOMATIC GENERATOR STUDIO */}
            {activeTab === "generator" && (
              <div className="tt-generator-tab">
                <div className="tt-generator-hero">
                  <div className="tt-generator-hero-content">
                    <span className="tt-generator-badge">
                      <Sparkles size={14} /> Intelligent CSP Engine
                    </span>
                    <h2>Constraint-Based Automatic Timetable Generator</h2>
                    <p>
                      The solver employs Most-Constrained-First heuristics, placing multi-period laboratory sessions first
                      into specialized labs, then arranging theory lectures to minimize room transitions and prevent teacher double-bookings.
                    </p>

                    <div className="tt-generator-controls">
                      <button
                        onClick={handleAutoGenerate}
                        disabled={generatorRunning}
                        className="tt-btn tt-btn-primary tt-btn-large"
                      >
                        {generatorRunning ? (
                          <>
                            <Loader2 size={18} className="tt-spin" />
                            <span>Solving Constraints...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            <span>Generate Timetable Now</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveTab("grid")}
                        className="tt-btn tt-btn-secondary"
                      >
                        <Eye size={16} />
                        <span>View Master Grid</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* GENERATION SUMMARY & DIAGNOSTICS */}
                {generatorProgress && (
                  <div className="tt-generator-results">
                    <div className="tt-card tt-summary-card">
                      <h3 className="tt-card-title">Generation Metrics</h3>
                      <p className="tt-card-sub tt-card-sub-inline">{generatorProgress.step}</p>
                      <div className="tt-summary-stats-grid">
                        <div className="tt-summary-stat">
                          <label>Total Allocated Periods</label>
                          <span>{generatorProgress.summary?.totalPeriods || 0}</span>
                        </div>
                        <div className="tt-summary-stat">
                          <label>Theory Lectures</label>
                          <span>{generatorProgress.summary?.theoryPeriods || 0}</span>
                        </div>
                        <div className="tt-summary-stat">
                          <label>Practical Lab Blocks</label>
                          <span>{generatorProgress.summary?.practicalPeriods || 0}</span>
                        </div>
                        <div className="tt-summary-stat">
                          <label>Faculty Involved</label>
                          <span>{generatorProgress.summary?.facultyCount || 0}</span>
                        </div>
                        <div className="tt-summary-stat">
                          <label>Candidates Evaluated</label>
                          <span>{generatorProgress.summary?.candidatesGenerated || 1}</span>
                        </div>
                        <div className="tt-summary-stat">
                          <label>Optimization Score</label>
                          <span className="tt-color-green">{generatorProgress.summary?.bestScore || 1000}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tt-card tt-diagnostics-card">
                      <h3 className="tt-card-title">Real-time Diagnostic Log</h3>
                      <div className="tt-log-terminal" role="log" aria-live="polite">
                        {generatorProgress.log?.length > 0 ? (
                          generatorProgress.log.map((item, idx) => (
                            <div key={idx} className="tt-log-line">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="tt-log-line tt-log-muted">Waiting for solver output…</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CONFLICT DETECTION CENTER */}
            {activeTab === "conflicts" && (
              <div className="tt-conflicts-tab">
                <div className="tt-conflicts-header-card">
                  <div>
                    <h2>Real-time Institutional Conflict Center</h2>
                    <p>
                      Automated validation verifies teacher double-bookings, room overlaps, student cohort overlaps,
                      faculty unavailabilities, and break overlaps across all published timetables.
                    </p>
                  </div>
                  <button
                    onClick={() => runConflictValidation(scheduleDays)}
                    className="tt-btn tt-btn-secondary"
                  >
                    <RefreshCw size={15} />
                    <span>Re-Scan Clashes</span>
                  </button>
                </div>

                <div className="tt-conflict-stats">
                  <div className={`tt-conflict-stat ${blockingCount > 0 ? "is-error" : "is-ok"}`}>
                    <span className="tt-conflict-stat-num">{blockingCount}</span>
                    <span className="tt-conflict-stat-label">Blocking</span>
                  </div>
                  <div className={`tt-conflict-stat ${warningCount > 0 ? "is-warn" : "is-ok"}`}>
                    <span className="tt-conflict-stat-num">{warningCount}</span>
                    <span className="tt-conflict-stat-label">Warnings</span>
                  </div>
                  <div className="tt-conflict-stat is-info">
                    <span className="tt-conflict-stat-num">{conflicts.suggestions?.length || 0}</span>
                    <span className="tt-conflict-stat-label">Suggestions</span>
                  </div>
                </div>

                <div className="tt-conflicts-lists">
                  {/* BLOCKING ERRORS */}
                  <div className="tt-conflict-section">
                    <div className="tt-conflict-sec-header tt-sec-header-error">
                      <AlertCircle size={18} />
                      <h3>Blocking Errors ({blockingCount})</h3>
                      <span className="tt-sec-badge-error">Must resolve before publishing</span>
                    </div>

                    {blockingCount === 0 ? (
                      <div className="tt-no-conflicts-card">
                        <CheckCircle2 size={24} className="tt-color-green" />
                        <div>
                          <strong>Zero Blocking Collisions</strong>
                          <p>No faculty, room, or student schedule clashes found.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="tt-conflict-items-list">
                        {conflicts.blockingErrors.map((err, idx) => (
                          <div key={idx} className="tt-conflict-card tt-card-error">
                            <XCircle size={18} className="tt-color-red" />
                            <div className="tt-conflict-body">
                              <span className="tt-conflict-code">{err.code}</span>
                              <p className="tt-conflict-msg">{err.message}</p>
                            </div>
                            <button
                              onClick={() => setActiveTab("grid")}
                              className="tt-btn tt-btn-small tt-btn-secondary"
                            >
                              Resolve in Grid
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* WARNINGS */}
                  <div className="tt-conflict-section">
                    <div className="tt-conflict-sec-header tt-sec-header-warn">
                      <AlertTriangle size={18} />
                      <h3>Optimization Warnings ({warningCount})</h3>
                    </div>

                    {warningCount === 0 ? (
                      <p className="tt-empty-text">No soft constraint warnings.</p>
                    ) : (
                      <div className="tt-conflict-items-list">
                        {conflicts.warnings.map((w, idx) => (
                          <div key={idx} className="tt-conflict-card tt-card-warn">
                            <AlertTriangle size={18} className="tt-color-amber" />
                            <div className="tt-conflict-body">
                              <span className="tt-conflict-code">{w.code}</span>
                              <p className="tt-conflict-msg">{w.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SUGGESTIONS */}
                  {conflicts.suggestions?.length > 0 && (
                    <div className="tt-conflict-section">
                      <div className="tt-conflict-sec-header tt-sec-header-info">
                        <Lightbulb size={18} />
                        <h3>Suggested Fixes ({conflicts.suggestions.length})</h3>
                      </div>
                      <div className="tt-conflict-items-list">
                        {conflicts.suggestions.map((s, idx) => (
                          <div key={idx} className="tt-conflict-card tt-card-info">
                            <Lightbulb size={18} className="tt-color-blue" />
                            <div className="tt-conflict-body">
                              <p className="tt-conflict-msg">{suggestionText(s)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: ACADEMIC CONFIGURATION & VISUAL SLOT BUILDER */}
            {activeTab === "config" && (
              <div className="tt-config-tab">
                <form onSubmit={handleSaveConfig} className="tt-config-form">
                  <div className="tt-card">
                    <h3 className="tt-card-title">Academic Schedule Parameters</h3>

                    <div className="tt-form-grid">
                      <div className="tt-form-group">
                        <label htmlFor="tt-cfg-start">College Start Time</label>
                        <input
                          id="tt-cfg-start"
                          type="time"
                          value={config?.collegeStartTime || "09:00"}
                          onChange={(e) =>
                            setConfig({ ...config, collegeStartTime: e.target.value })
                          }
                          className="tt-input"
                        />
                      </div>

                      <div className="tt-form-group">
                        <label htmlFor="tt-cfg-end">College End Time</label>
                        <input
                          id="tt-cfg-end"
                          type="time"
                          value={config?.collegeEndTime || "17:00"}
                          onChange={(e) =>
                            setConfig({ ...config, collegeEndTime: e.target.value })
                          }
                          className="tt-input"
                        />
                      </div>

                      <div className="tt-form-group">
                        <label htmlFor="tt-cfg-duration">Period Duration (Minutes)</label>
                        <input
                          id="tt-cfg-duration"
                          type="number"
                          value={config?.periodDuration || 50}
                          onChange={(e) =>
                            setConfig({ ...config, periodDuration: parseInt(e.target.value, 10) })
                          }
                          className="tt-input"
                          min="30"
                          max="120"
                        />
                      </div>

                      <div className="tt-form-group">
                        <label htmlFor="tt-cfg-periods">Daily Teaching Periods</label>
                        <input
                          id="tt-cfg-periods"
                          type="number"
                          value={config?.dailyPeriods || 7}
                          onChange={(e) =>
                            setConfig({ ...config, dailyPeriods: parseInt(e.target.value, 10) })
                          }
                          className="tt-input"
                          min="4"
                          max="10"
                        />
                      </div>
                    </div>

                    {/* WORKING DAYS CHECKBOXES */}
                    <div className="tt-form-group tt-form-group-spaced">
                      <label id="tt-working-days-label">Active Working Days</label>
                      <div className="tt-working-days-picker" role="group" aria-labelledby="tt-working-days-label">
                        {DAYS.map((d) => {
                          const isChecked = Boolean(config?.workingDays?.includes(d));
                          return (
                            <label key={d} className={`tt-day-checkbox ${isChecked ? "active" : ""}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = config?.workingDays || [];
                                  const updated = e.target.checked
                                    ? [...current, d]
                                    : current.filter((x) => x !== d);
                                  setConfig({ ...config, workingDays: updated });
                                }}
                              />
                              <span>{d}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* VISUAL BREAKS CONFIGURATOR */}
                  <div className="tt-card">
                    <div className="tt-card-header-row">
                      <h3 className="tt-card-title">Daily Slots & Breaks Sequence</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newSlots = [...(config?.slots || [])];
                          newSlots.push({
                            slotNumber: newSlots.length + 1,
                            label: "Tea Break",
                            startTime: "15:00",
                            endTime: "15:20",
                            isBreak: true,
                            breakType: "short_break"
                          });
                          setConfig({ ...config, slots: newSlots });
                        }}
                        className="tt-btn tt-btn-small tt-btn-secondary"
                      >
                        <Plus size={14} /> Add Break
                      </button>
                    </div>

                    <div className="tt-slots-builder-list">
                      {config?.slots?.length ? (
                        config.slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className={`tt-builder-slot-row ${slot.isBreak ? "tt-break-row" : ""}`}
                          >
                            <span className="tt-slot-index-pill">
                              {slot.isBreak ? "Break" : `P${slot.slotNumber || idx + 1}`}
                            </span>

                            <input
                              type="text"
                              value={slot.label || ""}
                              onChange={(e) => {
                                const slots = [...config.slots];
                                slots[idx].label = e.target.value;
                                setConfig({ ...config, slots });
                              }}
                              className="tt-input tt-slot-name-input"
                              placeholder="Slot Label"
                              aria-label={`Label for slot ${idx + 1}`}
                            />

                            <div className="tt-slot-time-range">
                              <input
                                type="time"
                                value={slot.startTime || ""}
                                onChange={(e) => {
                                  const slots = [...config.slots];
                                  slots[idx].startTime = e.target.value;
                                  setConfig({ ...config, slots });
                                }}
                                className="tt-input tt-time-input"
                                aria-label={`Start time for slot ${idx + 1}`}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={slot.endTime || ""}
                                onChange={(e) => {
                                  const slots = [...config.slots];
                                  slots[idx].endTime = e.target.value;
                                  setConfig({ ...config, slots });
                                }}
                                className="tt-input tt-time-input"
                                aria-label={`End time for slot ${idx + 1}`}
                              />
                            </div>

                            <label className="tt-break-toggle">
                              <input
                                type="checkbox"
                                checked={slot.isBreak || false}
                                onChange={(e) => {
                                  const slots = [...config.slots];
                                  slots[idx].isBreak = e.target.checked;
                                  setConfig({ ...config, slots });
                                }}
                              />
                              <span>Is Break</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const slots = config.slots.filter((_, i) => i !== idx);
                                setConfig({ ...config, slots });
                              }}
                              className="tt-btn-icon-danger"
                              title="Remove slot"
                              aria-label={`Remove slot ${idx + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          icon={Settings}
                          title="No slots configured"
                          text="Add a break to start building the daily sequence."
                        />
                      )}
                    </div>

                    <div className="tt-form-actions">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="tt-btn tt-btn-primary"
                      >
                        {actionLoading ? <Loader2 size={15} className="tt-spin" /> : <Save size={15} />}
                        <span>Save Academic Configuration</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 6: SUBJECT & FACULTY MAPPING */}
            {activeTab === "subjects" && (
              <div className="tt-subjects-tab">
                <div className="tt-card">
                  <div className="tt-card-header-row">
                    <div>
                      <h3 className="tt-card-title">Curriculum Subjects & Faculty Load</h3>
                      <p className="tt-card-sub tt-card-sub-inline">
                        Configure weekly hours, assign primary faculty, and designate laboratory requirements for {branch} {semester}.
                      </p>
                    </div>
                  </div>

                  <div className="tt-list-toolbar">
                    <SearchField
                      value={subjectSearch}
                      onChange={setSubjectSearch}
                      placeholder="Search code, subject or teacher"
                      label="Search subjects"
                    />
                    <div className="tt-chip-group" role="group" aria-label="Filter by subject type">
                      {[
                        ["all", "All"],
                        ["theory", "Theory"],
                        ["practical", "Practical"]
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          className={`tt-chip ${subjectTypeFilter === val ? "active" : ""}`}
                          aria-pressed={subjectTypeFilter === val}
                          onClick={() => setSubjectTypeFilter(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <span className="tt-result-count">
                      {filteredSubjects.length} of {subjects.length}
                    </span>
                  </div>

                  {filteredSubjects.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title={subjects.length === 0 ? "No subjects for this semester" : "No subjects match your filters"}
                      text={subjects.length === 0 ? "Subjects added to the curriculum will show up here." : "Try a different search or clear the type filter."}
                    />
                  ) : (
                    <div className="tt-table-container">
                      <table className="tt-data-table tt-stack-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Subject Name</th>
                            <th>Type</th>
                            <th>Hours/Wk</th>
                            <th>Assigned Teacher</th>
                            <th>Consecutive Labs</th>
                            <th>Room Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubjects.map((sub) => (
                            <tr key={sub._id}>
                              <td data-label="Code" className="tt-code-cell">{sub.code}</td>
                              <td data-label="Subject" className="tt-name-cell">{sub.name}</td>
                              <td data-label="Type">
                                <span className={`tt-type-pill ${sub.type === "practical" ? "practical" : "theory"}`}>
                                  {sub.type}
                                </span>
                              </td>
                              <td data-label="Hours/Wk">{sub.hoursPerWeek || 4} hrs</td>
                              <td data-label="Teacher">
                                <select
                                  value={sub.assignedTeacherId?._id || sub.assignedTeacherId || ""}
                                  onChange={async (e) => {
                                    try {
                                      const teacherId = e.target.value;
                                      await authApi.updateTimetableSubject({
                                        subjectId: sub._id,
                                        assignedTeacherId: teacherId
                                      });
                                      notify(`Updated faculty assignment for ${sub.name}.`, "success");
                                      loadAllTimetableData();
                                    } catch (err) {
                                      notify(err.message, "error");
                                    }
                                  }}
                                  className="tt-select tt-select-small"
                                  aria-label={`Assigned teacher for ${sub.name}`}
                                >
                                  <option value="">-- Select Teacher / Staff --</option>
                                  {availableTeachers.map((t) => (
                                    <option key={t._id} value={t._id}>
                                      {t.label || `${t.fullName} (${t.designation || t.role})`}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td data-label="Labs">
                                {sub.type === "practical" ? (
                                  <span className="tt-badge-consecutive">2 Consecutive Periods</span>
                                ) : (
                                  <span className="tt-text-muted">1 Period</span>
                                )}
                              </td>
                              <td data-label="Room Type">
                                <span className="tt-room-type-tag">
                                  {sub.preferredRoomType || (sub.type === "practical" ? "Laboratory" : "Classroom")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: ROOMS & LABS */}
            {activeTab === "rooms" && (
              <div className="tt-rooms-tab">
                <div className="tt-card">
                  <div className="tt-card-header-row">
                    <div>
                      <h3 className="tt-card-title">Campus Classrooms & Specialized Labs</h3>
                      <p className="tt-card-sub tt-card-sub-inline">
                        Manage room capacities and avoid physical room double-booking collisions.
                      </p>
                    </div>
                    <button
                      onClick={() => setRoomModal({ open: true, roomData: null })}
                      className="tt-btn tt-btn-primary tt-btn-small"
                    >
                      <Plus size={14} /> Add Room
                    </button>
                  </div>

                  <div className="tt-list-toolbar">
                    <SearchField
                      value={roomSearch}
                      onChange={setRoomSearch}
                      placeholder="Search room, building or type"
                      label="Search rooms"
                    />
                    <div className="tt-chip-group" role="group" aria-label="Filter by room type">
                      <button
                        type="button"
                        className={`tt-chip ${roomTypeFilter === "all" ? "active" : ""}`}
                        aria-pressed={roomTypeFilter === "all"}
                        onClick={() => setRoomTypeFilter("all")}
                      >
                        All
                      </button>
                      {roomTypes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`tt-chip ${roomTypeFilter === t ? "active" : ""}`}
                          aria-pressed={roomTypeFilter === t}
                          onClick={() => setRoomTypeFilter(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <span className="tt-result-count">
                      {filteredRooms.length} of {rooms.length}
                    </span>
                  </div>

                  {filteredRooms.length === 0 ? (
                    <EmptyState
                      icon={Building}
                      title={rooms.length === 0 ? "No rooms added yet" : "No rooms match your filters"}
                      text={rooms.length === 0 ? "Add a classroom or lab so periods can be assigned to it." : "Try a different search or room type."}
                    />
                  ) : (
                    <div className="tt-rooms-grid">
                      {filteredRooms.map((room) => (
                        <div key={room._id} className="tt-room-card">
                          <div className="tt-room-card-top">
                            <div className="tt-room-badge">{room.roomNumber}</div>
                            <span className={`tt-room-avail-pill ${room.isAvailable ? "available" : "busy"}`}>
                              {room.isAvailable ? "Active" : "Maintenance"}
                            </span>
                          </div>
                          <div className="tt-room-type-name">{room.type}</div>
                          <div className="tt-room-details">
                            <span><Building size={13} /> {room.building} ({room.floor})</span>
                            <span><Users size={13} /> Capacity: {room.capacity} seats</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 8: VERSION HISTORY & ROLLBACK */}
            {activeTab === "versions" && (
              <div className="tt-versions-tab">
                <div className="tt-card">
                  <h3 className="tt-card-title">Immutable Version Snapshots</h3>
                  <p className="tt-card-sub">
                    Every published timetable is permanently archived. Roll back to any previous version with 1-click.
                  </p>

                  <div className="tt-versions-list">
                    {versions.length === 0 ? (
                      <EmptyState
                        icon={History}
                        title="No publication snapshots yet"
                        text="Publish this timetable to archive its first version."
                      />
                    ) : (
                      versions.map((ver) => (
                        <div key={ver._id} className="tt-version-card">
                          <div className="tt-version-card-left">
                            <div className="tt-ver-number">v{ver.version}.0</div>
                            <div>
                              <strong>{ver.changeSummary || "Publication Snapshot"}</strong>
                              <p className="tt-ver-meta">
                                Published on {new Date(ver.publishedAt).toLocaleString()} by {ver.createdBy?.fullName || "Coordinator"}
                              </p>
                              <div className="tt-ver-counts">
                                {ver.metrics?.totalPeriods || 0} Total Periods · {ver.metrics?.theoryPeriods || 0} Theory · {ver.metrics?.practicalPeriods || 0} Practical
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRestoreVersion(ver._id, ver.version)}
                            disabled={actionLoading}
                            className="tt-btn tt-btn-secondary tt-btn-small"
                          >
                            <History size={14} />
                            <span>Restore this Version</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: REPORTS & PRINT VIEW */}
            {activeTab === "reports" && (
              <div className="tt-reports-tab">
                <div className="tt-reports-action-bar">
                  <div>
                    <h2>Institutional Timetable Reports & Analytics</h2>
                    <p>Print-ready format with faculty workload distribution and room utilization rates.</p>
                  </div>
                  <button onClick={() => window.print()} className="tt-btn tt-btn-primary">
                    <Printer size={16} />
                    <span>Print Schedule</span>
                  </button>
                </div>

                {/* FACULTY WORKLOAD TABLE */}
                <div className="tt-card">
                  <div className="tt-card-header-row">
                    <h3 className="tt-card-title">Department Faculty Teaching Load</h3>
                    <button onClick={exportFacultyCsv} className="tt-btn tt-btn-secondary tt-btn-small tt-no-print">
                      <FileDown size={14} /> Export CSV
                    </button>
                  </div>
                  {reports?.facultyWorkload?.length ? (
                    <div className="tt-table-container">
                      <table className="tt-data-table tt-stack-table">
                        <thead>
                          <tr>
                            <th>Faculty Name</th>
                            <th>Assigned Weekly Periods</th>
                            <th>Max Allowed Load</th>
                            <th>Load Utilization Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.facultyWorkload.map((fw, idx) => (
                            <tr key={idx}>
                              <td data-label="Faculty" className="tt-name-cell">
                                <span className="tt-cell-icon"><User size={13} /></span>
                                {fw.teacherName}
                              </td>
                              <td data-label="Periods"><strong>{fw.periods}</strong> periods/week</td>
                              <td data-label="Max load">{fw.maxAllowed} periods</td>
                              <td data-label="Utilization">
                                <div className="tt-util-cell">
                                  <div className="tt-util-track">
                                    <div
                                      className="tt-util-fill"
                                      style={{
                                        width: `${Math.min(100, fw.utilizationPercentage)}%`,
                                        backgroundColor: fw.utilizationPercentage > 90 ? "#EF4444" : "#FF6B0A"
                                      }}
                                    />
                                  </div>
                                  <span>{fw.utilizationPercentage}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={Users} title="No workload data yet" text="Schedule periods to see faculty load." />
                  )}
                </div>

                {/* ROOM UTILIZATION TABLE */}
                <div className="tt-card">
                  <div className="tt-card-header-row">
                    <h3 className="tt-card-title">Campus Room & Laboratory Utilization</h3>
                    <button onClick={exportRoomsCsv} className="tt-btn tt-btn-secondary tt-btn-small tt-no-print">
                      <FileDown size={14} /> Export CSV
                    </button>
                  </div>
                  {reports?.roomUtilization?.length ? (
                    <div className="tt-table-container">
                      <table className="tt-data-table tt-stack-table">
                        <thead>
                          <tr>
                            <th>Room Number</th>
                            <th>Total Periods Booked</th>
                            <th>Weekly Capacity</th>
                            <th>Utilization Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.roomUtilization.map((ru, idx) => (
                            <tr key={idx}>
                              <td data-label="Room" className="tt-code-cell">
                                <span className="tt-cell-icon"><Building size={13} /></span>
                                {ru.roomNo}
                              </td>
                              <td data-label="Booked"><strong>{ru.periodsBooked}</strong> periods</td>
                              <td data-label="Capacity">{ru.maxSlots} slots/week</td>
                              <td data-label="Utilization">
                                <div className="tt-util-cell">
                                  <div className="tt-util-track">
                                    <div
                                      className="tt-util-fill"
                                      style={{
                                        width: `${Math.min(100, ru.utilizationPercentage)}%`,
                                        backgroundColor: "#3B82F6"
                                      }}
                                    />
                                  </div>
                                  <span>{ru.utilizationPercentage}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={Building} title="No room usage yet" text="Assign rooms to periods to see utilization." />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. MODAL: EDIT / ADD CLASS PERIOD */}
      {editSlotModal.open && (
        <Modal
          title={`${editSlotModal.slotIndex !== null ? "Edit Class Period" : "Schedule New Class"} — ${editSlotModal.day}`}
          onClose={closeEditSlot}
        >
          <div className="tt-modal-body">
            {editSlotModal.slotIndex === null && (
              <div className="tt-form-group">
                <label htmlFor="tt-slot-day">Day</label>
                <select
                  id="tt-slot-day"
                  value={editSlotModal.day || DAYS[0]}
                  onChange={(e) => setEditSlotModal({ ...editSlotModal, day: e.target.value })}
                  className="tt-select"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="tt-form-group">
              <label htmlFor="tt-slot-subject">Subject</label>
              <select
                id="tt-slot-subject"
                value={editSlotModal.slotData?.subject || ""}
                onChange={(e) => {
                  const selSub = subjects.find((s) => s.name === e.target.value);
                  setEditSlotModal({
                    ...editSlotModal,
                    slotData: {
                      ...editSlotModal.slotData,
                      subject: selSub?.name || e.target.value,
                      subjectCode: selSub?.code || "",
                      teacherName: selSub?.assignedTeacherName || "",
                      type: selSub?.type === "practical" ? "Practical" : "Theory"
                    }
                  });
                }}
                className="tt-select"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.code} — {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="tt-form-row">
              <div className="tt-form-group">
                <label htmlFor="tt-slot-teacher">Faculty / Academic Staff</label>
                <select
                  id="tt-slot-teacher"
                  value={editSlotModal.slotData?.teacherName || ""}
                  onChange={(e) => {
                    const sel = availableTeachers.find((t) => t.fullName === e.target.value);
                    setEditSlotModal({
                      ...editSlotModal,
                      slotData: {
                        ...editSlotModal.slotData,
                        teacherName: e.target.value,
                        teacherId: sel?._id || null,
                        teacherDesignation: sel?.designation || ""
                      }
                    });
                  }}
                  className="tt-select"
                >
                  <option value="">-- Select Faculty / Staff Member --</option>
                  {availableTeachers.map((t) => (
                    <option key={t._id} value={t.fullName}>
                      {t.label || `${t.fullName} (${t.designation || t.role})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tt-form-group">
                <label htmlFor="tt-slot-room">Classroom / Lab</label>
                <select
                  id="tt-slot-room"
                  value={editSlotModal.slotData?.roomNo || ""}
                  onChange={(e) =>
                    setEditSlotModal({
                      ...editSlotModal,
                      slotData: { ...editSlotModal.slotData, roomNo: e.target.value }
                    })
                  }
                  className="tt-select"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r.roomNumber}>
                      {r.roomNumber} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tt-form-row tt-form-row-3">
              <div className="tt-form-group">
                <label htmlFor="tt-slot-start">Start Time</label>
                <input
                  id="tt-slot-start"
                  type="time"
                  value={editSlotModal.slotData?.startTime || "09:00"}
                  onChange={(e) =>
                    setEditSlotModal({
                      ...editSlotModal,
                      slotData: { ...editSlotModal.slotData, startTime: e.target.value }
                    })
                  }
                  className="tt-input"
                />
              </div>

              <div className="tt-form-group">
                <label htmlFor="tt-slot-end">End Time</label>
                <input
                  id="tt-slot-end"
                  type="time"
                  value={editSlotModal.slotData?.endTime || "09:50"}
                  onChange={(e) =>
                    setEditSlotModal({
                      ...editSlotModal,
                      slotData: { ...editSlotModal.slotData, endTime: e.target.value }
                    })
                  }
                  className="tt-input"
                />
              </div>

              <div className="tt-form-group">
                <label htmlFor="tt-slot-type">Type</label>
                <select
                  id="tt-slot-type"
                  value={editSlotModal.slotData?.type || "Theory"}
                  onChange={(e) =>
                    setEditSlotModal({
                      ...editSlotModal,
                      slotData: { ...editSlotModal.slotData, type: e.target.value }
                    })
                  }
                  className="tt-select"
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                  <option value="Tutorial">Tutorial</option>
                </select>
              </div>
            </div>

            <div className="tt-form-row">
              <div className="tt-form-group">
                <label htmlFor="tt-slot-notes">Lecture Notes / Simulator (Optional)</label>
                <input
                  id="tt-slot-notes"
                  type="text"
                  value={editSlotModal.slotData?.notes || ""}
                  onChange={(e) =>
                    setEditSlotModal({
                      ...editSlotModal,
                      slotData: { ...editSlotModal.slotData, notes: e.target.value }
                    })
                  }
                  className="tt-input"
                  placeholder="e.g. Lab Group A1 / Projector Demo"
                />
              </div>

              <div className="tt-form-group tt-checkbox-group">
                <label className="tt-checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(editSlotModal.slotData?.isConsecutive)}
                    onChange={(e) =>
                      setEditSlotModal({
                        ...editSlotModal,
                        slotData: { ...editSlotModal.slotData, isConsecutive: e.target.checked }
                      })
                    }
                    className="tt-checkbox"
                  />
                  <span>Consecutive 2-Period Lab Session</span>
                </label>
              </div>
            </div>
          </div>

          <div className="tt-modal-footer">
            <button type="button" onClick={closeEditSlot} className="tt-btn tt-btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSaveSlotModal} className="tt-btn tt-btn-primary">
              <Save size={15} /> Save Period
            </button>
          </div>
        </Modal>
      )}

      {/* 4. MODAL: WORKFLOW SUBMISSION */}
      {workflowModal.open && (
        <Modal
          title="Submit Timetable for HOD Approval"
          onClose={() => setWorkflowModal({ open: false, action: "submit_for_approval", remarks: "" })}
        >
          <div className="tt-modal-body">
            <p className="tt-modal-desc">
              Submitting this timetable locks it for HOD review. The HOD can approve or request adjustments.
            </p>

            <div className="tt-form-group">
              <label htmlFor="tt-wf-remarks">Submission Remarks (Optional)</label>
              <textarea
                id="tt-wf-remarks"
                value={workflowModal.remarks}
                onChange={(e) => setWorkflowModal({ ...workflowModal, remarks: e.target.value })}
                className="tt-textarea"
                placeholder="e.g. Generated with 0 collisions. All faculty loads balanced within 20 hrs/week."
                rows={4}
              />
            </div>
          </div>

          <div className="tt-modal-footer">
            <button
              type="button"
              onClick={() => setWorkflowModal({ open: false, action: "submit_for_approval", remarks: "" })}
              className="tt-btn tt-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleWorkflowAction}
              disabled={actionLoading}
              className="tt-btn tt-btn-accent"
            >
              {actionLoading ? <Loader2 size={15} className="tt-spin" /> : <Send size={15} />}
              <span>Submit to HOD</span>
            </button>
          </div>
        </Modal>
      )}

      {/* 5. MODAL: ADD / UPDATE ROOM */}
      {roomModal.open && (
        <Modal title="Add Campus Classroom / Laboratory" onClose={() => setRoomModal({ open: false, roomData: null })}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const fd = new FormData(e.target);
                await authApi.saveTimetableRoom({
                  roomNumber: fd.get("roomNumber"),
                  building: fd.get("building"),
                  floor: fd.get("floor"),
                  type: fd.get("type"),
                  capacity: parseInt(fd.get("capacity"), 10) || 60,
                  branch
                });
                notify("Room added successfully.", "success");
                setRoomModal({ open: false, roomData: null });
                loadAllTimetableData();
              } catch (err) {
                notify(err.message, "error");
              }
            }}
          >
            <div className="tt-modal-body">
              <div className="tt-form-group">
                <label htmlFor="tt-room-number">Room Number / Name</label>
                <input
                  id="tt-room-number"
                  name="roomNumber"
                  required
                  placeholder="e.g. LT-103 or Hardware Lab"
                  className="tt-input"
                />
              </div>
              <div className="tt-form-row">
                <div className="tt-form-group">
                  <label htmlFor="tt-room-building">Building</label>
                  <input id="tt-room-building" name="building" defaultValue="Academic Block A" className="tt-input" />
                </div>
                <div className="tt-form-group">
                  <label htmlFor="tt-room-floor">Floor</label>
                  <input id="tt-room-floor" name="floor" defaultValue="1st Floor" className="tt-input" />
                </div>
              </div>
              <div className="tt-form-row">
                <div className="tt-form-group">
                  <label htmlFor="tt-room-type">Type</label>
                  <select id="tt-room-type" name="type" className="tt-select">
                    <option value="Classroom">Classroom</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Electronics Lab">Electronics Lab</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                  </select>
                </div>
                <div className="tt-form-group">
                  <label htmlFor="tt-room-capacity">Seating Capacity</label>
                  <input id="tt-room-capacity" name="capacity" type="number" min="1" defaultValue="60" className="tt-input" />
                </div>
              </div>
            </div>
            <div className="tt-modal-footer">
              <button type="button" onClick={() => setRoomModal({ open: false, roomData: null })} className="tt-btn tt-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="tt-btn tt-btn-primary">
                Save Room
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. MODAL: CLONE / COPY DAY */}
      {copyDayModal.open && (
        <Modal
          title="Clone Daily Timetable Schedule"
          onClose={() => setCopyDayModal({ open: false, sourceDay: null, targetDay: "" })}
        >
          <div className="tt-modal-body">
            <p className="tt-modal-desc">
              Duplicate all allocated periods, subjects, teachers, and rooms from <strong>{copyDayModal.sourceDay}</strong> to another working day.
              The target day's existing periods are replaced.
            </p>
            <div className="tt-form-row">
              <div className="tt-form-group">
                <label htmlFor="tt-copy-source">Copy From</label>
                <select
                  id="tt-copy-source"
                  value={copyDayModal.sourceDay || ""}
                  onChange={(e) =>
                    setCopyDayModal({
                      ...copyDayModal,
                      sourceDay: e.target.value,
                      targetDay: copyDayModal.targetDay === e.target.value ? "" : copyDayModal.targetDay
                    })
                  }
                  className="tt-select"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="tt-form-group">
                <label htmlFor="tt-copy-target">Select Target Day</label>
                <select
                  id="tt-copy-target"
                  value={copyDayModal.targetDay}
                  onChange={(e) => setCopyDayModal({ ...copyDayModal, targetDay: e.target.value })}
                  className="tt-select"
                >
                  <option value="">-- Choose Day to Apply To --</option>
                  {DAYS.filter((d) => d !== copyDayModal.sourceDay).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="tt-modal-footer">
            <button
              type="button"
              onClick={() => setCopyDayModal({ open: false, sourceDay: null, targetDay: "" })}
              className="tt-btn tt-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopyDay}
              disabled={!copyDayModal.targetDay}
              className="tt-btn tt-btn-primary"
            >
              <Copy size={14} /> Clone to {copyDayModal.targetDay || "Target Day"}
            </button>
          </div>
        </Modal>
      )}

      {/* 7. FULLSCREEN PHOTO MODAL */}
      {photoFullscreen && photoDirectPreviewUrl && (
        <div
          className="tt-photo-fs-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen timetable photograph"
          onClick={() => setPhotoFullscreen(false)}
        >
          <div className="tt-photo-fs-content" onClick={(e) => e.stopPropagation()}>
            <div className="tt-photo-fs-bar">
              <div className="tt-photo-fs-title">{photoTitle}</div>
              <div className="tt-photo-fs-actions">
                <button
                  type="button"
                  className="tt-photo-ctrl-btn"
                  onClick={() => setPhotoZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
                  aria-label="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="tt-photo-zoom-level">{Math.round(photoZoom * 100)}%</span>
                <button
                  type="button"
                  className="tt-photo-ctrl-btn"
                  onClick={() => setPhotoZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
                  aria-label="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="tt-photo-ctrl-btn"
                  onClick={() => setPhotoZoom(1.0)}
                  aria-label="Reset zoom"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  className="tt-photo-ctrl-btn"
                  onClick={() => setPhotoFullscreen(false)}
                  aria-label="Exit fullscreen"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>
            <div className="tt-photo-fs-viewport">
              <img
                src={photoDirectPreviewUrl}
                alt="Fullscreen Timetable"
                style={{ transform: `scale(${photoZoom})`, transformOrigin: "top center" }}
                className="tt-photo-fs-img"
              />
            </div>
          </div>
        </div>
      )}

      {/* 8. CONFIRM DIALOG (publish / restore) */}
      <ConfirmDialog dialog={confirmDialog} onClose={closeConfirm} />
    </div>
  );
}