import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  Clock,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Award,
  Layers,
  LayoutGrid,
  List,
  RefreshCw,
  Download,
  Plus,
  X,
  Lock,
  Edit3,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BarChart2,
  MapPin,
  Trash2,
  FileText,
  UserCheck,
  CalendarCheck
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODTeachers.css";

const STANDARD_WORKLOAD_LIMIT = 18; // Standard periods per week

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export default function HODTeachers({ currentUser, onNavigate, showToast }) {
  const deptBranch = currentUser?.department || "CSE";

  // State: Faculty list & pagination
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalCount: 0,
    totalPages: 1
  });

  // State: Real KPI stats
  const [stats, setStats] = useState({
    totalFaculty: 0,
    activeFaculty: 0,
    onLeaveFaculty: 0,
    pendingLeaves: 0,
    weeklyTeachingHours: 0,
    unassignedSlotsCount: 0,
    timetableConflictsCount: 0,
    pendingMarksCount: 0,
    approachingDeadlinesCount: 0
  });

  // State: Search & Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [designationFilter, setDesignationFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // State: Profile Drawer & 10 Tabs
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [profileTab, setProfileTab] = useState("overview");
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [deepDetails, setDeepDetails] = useState(null);

  // State: Profile Editing
  const [editForm, setEditForm] = useState({
    designation: "",
    responsibilities: "",
    bio: "",
    subjects: []
  });
  const [subjectInput, setSubjectInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State: Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    branch: deptBranch,
    academicYear: "2nd Year",
    semester: "Semester 3",
    dayOfWeek: "Monday",
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    subject: "",
    roomNo: "Room 101",
    type: "Lecture"
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignConflictError, setAssignConflictError] = useState("");

  // State: Leave Decision Modal
  const [leaveModal, setLeaveModal] = useState({
    open: false,
    leaveId: null,
    applicantName: "",
    action: "approved", // "approved" | "rejected"
    remarks: ""
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Stats
  const loadStats = useCallback(() => {
    setStatsLoading(true);
    authApi
      .getTeacherStats()
      .then((res) => {
        if (res?.success && res.stats) {
          setStats(res.stats);
        }
      })
      .catch((err) => {
        console.error("Failed to load teacher stats:", err);
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, []);

  // Fetch Directory
  const loadFaculty = useCallback(() => {
    setLoading(true);
    setErrorMsg("");

    const params = {
      search: debouncedSearch,
      status: statusFilter,
      subject: subjectFilter,
      designation: designationFilter,
      sort: sortBy,
      order: sortOrder,
      page: pagination.page,
      limit: pagination.limit
    };

    authApi
      .getTeachers(params)
      .then((res) => {
        if (res?.success) {
          setFacultyMembers(res.teachers || []);
          if (res.pagination) {
            setPagination((prev) => ({
              ...prev,
              totalCount: res.pagination.totalCount,
              totalPages: res.pagination.totalPages
            }));
          }
        } else {
          setFacultyMembers([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load faculty directory:", err);
        setErrorMsg(err.message || "Failed to load faculty directory.");
        setFacultyMembers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    debouncedSearch,
    statusFilter,
    subjectFilter,
    designationFilter,
    sortBy,
    sortOrder,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  // Fetch complete single teacher profile
  const fetchDeepDetails = useCallback((teacherId) => {
    setDrawerLoading(true);
    authApi
      .getTeacherDetails(teacherId)
      .then((res) => {
        if (res?.success) {
          setDeepDetails(res);
          setEditForm({
            designation: res.teacher?.designation || "",
            responsibilities: res.teacher?.responsibilities || "",
            bio: res.teacher?.bio || "",
            subjects: res.teacher?.subjects || []
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch teacher profile details:", err);
        showToast?.(err.message || "Failed to load complete profile.", true);
      })
      .finally(() => {
        setDrawerLoading(false);
      });
  }, [showToast]);

  // Handle open drawer
  const handleOpenDrawer = (teacher, tab = "overview") => {
    setSelectedTeacher(teacher);
    setProfileTab(tab);
    fetchDeepDetails(teacher.id || teacher.profileId);
  };

  const handleCloseDrawer = () => {
    setSelectedTeacher(null);
    setDeepDetails(null);
  };

  // Keyboard escape listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isAssignModalOpen) {
          setIsAssignModalOpen(false);
        } else if (leaveModal.open) {
          setLeaveModal((prev) => ({ ...prev, open: false }));
        } else if (selectedTeacher) {
          handleCloseDrawer();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTeacher, isAssignModalOpen, leaveModal.open]);

  // Save edited teacher profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setIsSavingProfile(true);

    try {
      const res = await authApi.updateTeacherProfile(
        selectedTeacher.id || selectedTeacher.profileId,
        editForm
      );
      if (res?.success) {
        showToast?.("Faculty profile updated successfully.");
        // Refresh local details
        fetchDeepDetails(selectedTeacher.id || selectedTeacher.profileId);
        loadFaculty();
      }
    } catch (err) {
      showToast?.(err.message || "Failed to update faculty profile.", true);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Subject tag management in edit form
  const handleAddSubjectTag = () => {
    if (!subjectInput.trim()) return;
    const clean = subjectInput.trim();
    if (!editForm.subjects.includes(clean)) {
      setEditForm((prev) => ({
        ...prev,
        subjects: [...prev.subjects, clean]
      }));
    }
    setSubjectInput("");
  };

  const handleRemoveSubjectTag = (sub) => {
    setEditForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== sub)
    }));
  };

  // Assign Subject / Slot
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setAssignLoading(true);
    setAssignConflictError("");

    try {
      const res = await authApi.assignTeacherSlot(
        selectedTeacher.id || selectedTeacher.profileId,
        assignForm
      );
      if (res?.success) {
        showToast?.(res.message || "Slot assigned successfully.");
        setIsAssignModalOpen(false);
        // Refresh deep profile and stats
        fetchDeepDetails(selectedTeacher.id || selectedTeacher.profileId);
        loadStats();
        loadFaculty();
      }
    } catch (err) {
      setAssignConflictError(err.message || "Failed to assign slot.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Unassign Slot
  const handleUnassignSlot = async (timetableId, slotId, subjectName) => {
    if (
      !window.confirm(
        `Are you sure you want to unassign ${selectedTeacher?.name} from "${subjectName}"?`
      )
    ) {
      return;
    }

    try {
      const res = await authApi.unassignTeacherSlot(
        selectedTeacher.id || selectedTeacher.profileId,
        { timetableId, slotId }
      );
      if (res?.success) {
        showToast?.(res.message || "Teaching slot unassigned.");
        fetchDeepDetails(selectedTeacher.id || selectedTeacher.profileId);
        loadStats();
        loadFaculty();
      }
    } catch (err) {
      showToast?.(err.message || "Failed to unassign teaching slot.", true);
    }
  };

  // Leave sanction decision
  const handleConfirmLeaveDecision = async () => {
    if (!leaveModal.leaveId) return;
    setLeaveSubmitting(true);

    try {
      const res = await authApi.updateLeaveStatus(leaveModal.leaveId, {
        status: leaveModal.action,
        remarks: leaveModal.remarks
      });
      if (res?.success) {
        showToast?.(
          `Leave request marked as ${leaveModal.action.toUpperCase()}.`
        );
        setLeaveModal({ open: false, leaveId: null, applicantName: "", action: "approved", remarks: "" });
        // Refresh details & stats
        if (selectedTeacher) {
          fetchDeepDetails(selectedTeacher.id || selectedTeacher.profileId);
        }
        loadStats();
        loadFaculty();
      }
    } catch (err) {
      showToast?.(err.message || "Failed to update leave status.", true);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (facultyMembers.length === 0) {
      showToast?.("No faculty records available to export.", true);
      return;
    }

    const headers = [
      "Employee ID",
      "Full Name",
      "Designation",
      "Department",
      "Email",
      "Phone",
      "Subjects",
      "Weekly Teaching Hours",
      "Status",
      "Leave Today"
    ];

    const rows = facultyMembers.map((f) => [
      `"${f.employeeId || ""}"`,
      `"${f.name || ""}"`,
      `"${f.designation || ""}"`,
      `"${f.department || ""}"`,
      `"${f.email || ""}"`,
      `"${f.phone || ""}"`,
      `"${(f.subjects || []).join(", ")}"`,
      `"${f.weeklyLoadHours || 0}"`,
      `"${f.status || ""}"`,
      `"${f.onLeaveToday ? "YES" : "NO"}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Faculty_Roster_${deptBranch}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.("Faculty roster exported to CSV.");
  };

  // Quick reset filters
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setSubjectFilter("ALL");
    setDesignationFilter("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  // Unique subjects collected from roster for subject filter dropdown
  const allUniqueSubjects = useMemo(() => {
    const set = new Set();
    facultyMembers.forEach((f) => {
      (f.subjects || []).forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [facultyMembers]);

  return (
    <div className="hod-role-view hod-faculty-command-container">
      {/* 1. Header Banner & Action Bar */}
      <div className="hod-pane-header hod-faculty-header">
        <div className="hod-faculty-header-info">
          <h2>
            <Users size={26} color="var(--hod-primary)" />
            Faculty Command Center & Department Roster
          </h2>
          <p>
            Real-time faculty administration, weekly teaching timetables, workload distribution, and leave sanctioning for{" "}
            <strong>{deptBranch} Engineering</strong>.
          </p>
        </div>

        <div className="hod-faculty-header-actions">
          <button
            type="button"
            className="hod-btn-secondary"
            onClick={handleExportCSV}
            title="Export roster to CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="hod-btn-secondary"
            onClick={() => {
              loadStats();
              loadFaculty();
            }}
            title="Refresh faculty directory"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Overview KPI Metrics (8 Database-Backed Cards) */}
      <div className="hod-faculty-metrics-grid">
        {/* Card 1: Total Faculty */}
        <div
          className={`hod-card hod-fmetric-card ${statusFilter === "ALL" ? "active-kpi" : ""}`}
          onClick={() => {
            setStatusFilter("ALL");
            setSubjectFilter("ALL");
          }}
          title="Click to view all faculty"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Total Faculty</span>
            <div className="hod-fmetric-icon-wrap indigo">
              <Users size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value">
            {statsLoading ? <Loader2 size={20} className="spin" /> : stats.totalFaculty}
          </div>
          <span className="hod-fmetric-sub">Registered in {deptBranch}</span>
        </div>

        {/* Card 2: Active Faculty */}
        <div
          className={`hod-card hod-fmetric-card ${statusFilter === "active" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter("active")}
          title="Click to filter active faculty"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Active on Duty</span>
            <div className="hod-fmetric-icon-wrap emerald">
              <UserCheck size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value emerald">
            {statsLoading ? <Loader2 size={20} className="spin" /> : stats.activeFaculty}
          </div>
          <span className="hod-fmetric-sub">Verified & active status</span>
        </div>

        {/* Card 3: Approved Leaves Today */}
        <div
          className="hod-card hod-fmetric-card"
          onClick={() => {
            if (onNavigate) onNavigate("dashboard", "leaves");
          }}
          title="Click to navigate to Department Leaves"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">On Approved Leave</span>
            <div className="hod-fmetric-icon-wrap amber">
              <CalendarCheck size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value amber">
            {statsLoading ? <Loader2 size={20} className="spin" /> : stats.onLeaveFaculty}
          </div>
          <span className="hod-fmetric-sub">Excused today</span>
        </div>

        {/* Card 4: Pending Leaves */}
        <div
          className="hod-card hod-fmetric-card"
          onClick={() => {
            if (onNavigate) onNavigate("dashboard", "leaves");
          }}
          title="Review pending leave applications"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Pending Leaves</span>
            <div className="hod-fmetric-icon-wrap rose">
              <Clock size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value rose">
            {statsLoading ? <Loader2 size={20} className="spin" /> : stats.pendingLeaves}
          </div>
          <span className="hod-fmetric-sub">Awaiting sanctioning</span>
        </div>

        {/* Card 5: Weekly Teaching Hours */}
        <div
          className="hod-card hod-fmetric-card"
          onClick={() => {
            setSortBy("workload");
            setSortOrder("desc");
          }}
          title="Sort by highest workload"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Weekly Periods</span>
            <div className="hod-fmetric-icon-wrap cyan">
              <BarChart2 size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value cyan">
            {statsLoading ? (
              <Loader2 size={20} className="spin" />
            ) : (
              `${stats.weeklyTeachingHours}h`
            )}
          </div>
          <span className="hod-fmetric-sub">Total timetable periods</span>
        </div>

        {/* Card 6: Unassigned Slots */}
        <div
          className="hod-card hod-fmetric-card"
          onClick={() => {
            if (onNavigate) onNavigate("dashboard", "timetable");
          }}
          title="Open Master Timetable to assign open slots"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Unassigned Slots</span>
            <div className="hod-fmetric-icon-wrap amber">
              <AlertTriangle size={17} />
            </div>
          </div>
          <div
            className={`hod-fmetric-value ${stats.unassignedSlotsCount > 0 ? "amber" : "emerald"}`}
          >
            {statsLoading ? (
              <Loader2 size={20} className="spin" />
            ) : (
              stats.unassignedSlotsCount
            )}
          </div>
          <span className="hod-fmetric-sub">Needs instructor assignment</span>
        </div>

        {/* Card 7: Pending Marks / Grading */}
        <div
          className="hod-card hod-fmetric-card"
          onClick={() => {
            if (onNavigate) onNavigate("dashboard", "results");
          }}
          title="Navigate to Results & Exam Submissions"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Pending Marks</span>
            <div className="hod-fmetric-icon-wrap violet">
              <BookOpen size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value violet">
            {statsLoading ? <Loader2 size={20} className="spin" /> : stats.pendingMarksCount}
          </div>
          <span className="hod-fmetric-sub">Unevaluated assessments</span>
        </div>

        {/* Card 8: Approaching Deadlines */}
        <div
          className="hod-card hod-fmetric-card"
          onClick={() => {
            if (onNavigate) onNavigate("dashboard", "assignments");
          }}
          title="Navigate to Academic Assignments"
        >
          <div className="hod-fmetric-top">
            <span className="hod-fmetric-label">Approaching Deadlines</span>
            <div className="hod-fmetric-icon-wrap rose">
              <Award size={17} />
            </div>
          </div>
          <div className="hod-fmetric-value rose">
            {statsLoading ? (
              <Loader2 size={20} className="spin" />
            ) : (
              stats.approachingDeadlinesCount
            )}
          </div>
          <span className="hod-fmetric-sub">Tasks due within 7 days</span>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Control Bar */}
      <div className="hod-card hod-faculty-filter-bar">
        <div className="hod-faculty-search-box">
          <Search size={16} className="hod-search-icon" />
          <input
            type="text"
            className="hod-input"
            style={{ paddingLeft: 38 }}
            placeholder="Search faculty by name, employee ID, email, designation, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="hod-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="hod-faculty-select-group">
          {/* Status Filter */}
          <select
            className="hod-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active on Duty</option>
            <option value="verified">Verified</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Designation Filter */}
          <select
            className="hod-select"
            value={designationFilter}
            onChange={(e) => {
              setDesignationFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="ALL">All Designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Lab Instructor">Lab Instructor</option>
          </select>

          {/* Subject Filter */}
          <select
            className="hod-select"
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="ALL">All Subjects</option>
            {allUniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            className="hod-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
            }}
          >
            <option value="createdAt-desc">Recently Registered</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="workload-desc">Workload (High → Low)</option>
            <option value="workload-asc">Workload (Low → High)</option>
            <option value="employeeId-asc">Employee ID (Asc)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="hod-view-toggle-wrap">
            <button
              type="button"
              className={`hod-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`hod-view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          {(search ||
            statusFilter !== "ALL" ||
            subjectFilter !== "ALL" ||
            designationFilter !== "ALL" ||
            sortBy !== "createdAt") && (
            <button
              type="button"
              className="hod-btn-secondary hod-reset-filters-btn"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Directory Content (Loading / Error / Empty / Grid / Table) */}
      {loading ? (
        <div className="hod-faculty-loading-state">
          <Loader2 size={36} className="spin" color="var(--hod-primary)" />
          <p>Accessing {deptBranch} Department Faculty Command Database...</p>
        </div>
      ) : errorMsg ? (
        <div className="hod-empty-box error">
          <AlertCircle size={40} color="var(--hod-rose)" />
          <h3>Database Synchronization Notice</h3>
          <p>{errorMsg}</p>
          <button
            type="button"
            className="hod-btn-primary"
            style={{ marginTop: 12 }}
            onClick={loadFaculty}
          >
            <RefreshCw size={14} />
            <span>Retry Query</span>
          </button>
        </div>
      ) : facultyMembers.length === 0 ? (
        <div className="hod-empty-box">
          <Users size={44} style={{ opacity: 0.4 }} />
          <h3>No Matching Faculty Members</h3>
          <p>
            {search || statusFilter !== "ALL" || subjectFilter !== "ALL"
              ? "No faculty records match your active search or filter criteria. Try resetting filters."
              : `No teaching staff or lecturers are currently registered for ${deptBranch} Engineering.`}
          </p>
          {(search || statusFilter !== "ALL" || subjectFilter !== "ALL") && (
            <button
              type="button"
              className="hod-btn-secondary"
              style={{ marginTop: 14 }}
              onClick={handleClearFilters}
            >
              Clear Search Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="hod-faculty-cards-grid">
          {facultyMembers.map((f) => {
            const initials = f.name
              ? f.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "FC";

            const isOverloaded = (f.weeklyLoadHours || 0) > STANDARD_WORKLOAD_LIMIT;
            const utilizationPct = Math.min(
              100,
              Math.round(((f.weeklyLoadHours || 0) / STANDARD_WORKLOAD_LIMIT) * 100)
            );

            return (
              <div key={f.id} className="hod-card hod-faculty-card">
                {/* Card Top: Avatar, Name, Designation, Badges */}
                <div className="hod-fcard-header">
                  <div className="hod-fcard-avatar-wrap">
                    {f.avatarUrl ? (
                      <img
                        src={f.avatarUrl}
                        alt={f.name}
                        className="hod-fcard-avatar"
                      />
                    ) : (
                      <div className="hod-fcard-initials">{initials}</div>
                    )}
                    <span
                      className={`hod-fcard-online-dot ${
                        f.onLeaveToday
                          ? "on-leave"
                          : f.status === "active"
                          ? "active"
                          : "pending"
                      }`}
                      title={
                        f.onLeaveToday
                          ? "On Approved Leave Today"
                          : f.status === "active"
                          ? "Active & On Duty"
                          : "Pending Approval"
                      }
                    />
                  </div>

                  <div className="hod-fcard-identity">
                    <h3 className="hod-fcard-name" title={f.name}>
                      {f.name}
                    </h3>
                    <span className="hod-fcard-desig" title={f.designation}>
                      {f.designation}
                    </span>
                    <div className="hod-fcard-badge-row">
                      <span className="hod-empid-pill">{f.employeeId}</span>
                      {f.onLeaveToday ? (
                        <span className="hod-pill amber" style={{ fontSize: "0.72rem" }}>
                          On Leave
                        </span>
                      ) : (
                        <span
                          className={`hod-pill ${
                            f.status === "active" ? "emerald" : "amber"
                          }`}
                          style={{ fontSize: "0.72rem" }}
                        >
                          {f.status === "active" ? "Active" : "Pending"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact info list */}
                <div className="hod-fcard-contact-list">
                  <div className="hod-fcard-contact-item">
                    <Mail size={13} color="var(--hod-cyan)" />
                    <span title={f.email}>{f.email || "No email on record"}</span>
                  </div>
                  {f.phone && (
                    <div className="hod-fcard-contact-item">
                      <Phone size={13} color="var(--hod-primary)" />
                      <span>{f.phone}</span>
                    </div>
                  )}
                </div>

                {/* Subjects Pills */}
                <div className="hod-fcard-subjects-box">
                  <span className="hod-fcard-subjects-label">
                    <BookOpen size={12} /> Assigned Subjects ({f.subjects?.length || 0})
                  </span>
                  <div className="hod-fcard-tags-wrap">
                    {f.subjects && f.subjects.length > 0 ? (
                      f.subjects.slice(0, 3).map((sub, idx) => (
                        <span key={idx} className="hod-subject-tag" title={sub}>
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="hod-tag-empty">No subjects assigned yet</span>
                    )}
                    {f.subjects && f.subjects.length > 3 && (
                      <span className="hod-subject-tag more">
                        +{f.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Workload Progress Bar */}
                <div className="hod-fcard-workload-box">
                  <div className="hod-fcard-workload-meta">
                    <span>
                      <strong>Weekly Teaching:</strong> {f.weeklyLoadHours || 0} hrs
                    </span>
                    <span className={isOverloaded ? "text-rose" : "text-secondary"}>
                      {utilizationPct}% standard load
                    </span>
                  </div>
                  <div className="hod-workload-bar-track">
                    <div
                      className={`hod-workload-bar-fill ${
                        isOverloaded ? "rose" : utilizationPct > 50 ? "emerald" : "indigo"
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="hod-fcard-actions">
                  <button
                    type="button"
                    className="hod-btn-primary"
                    onClick={() => handleOpenDrawer(f, "overview")}
                  >
                    <span>View Profile</span>
                  </button>

                  <button
                    type="button"
                    className="hod-btn-secondary icon-only"
                    onClick={() => handleOpenDrawer(f, "timetable")}
                    title="View Weekly Schedule"
                  >
                    <Calendar size={14} />
                  </button>

                  <button
                    type="button"
                    className="hod-btn-secondary icon-only"
                    onClick={() => handleOpenDrawer(f, "workload")}
                    title="View Workload Analytics"
                  >
                    <BarChart2 size={14} />
                  </button>

                  <button
                    type="button"
                    className="hod-btn-secondary icon-only"
                    onClick={() => handleOpenDrawer(f, "leaves")}
                    title="View Leave Ledger"
                  >
                    <Clock size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="hod-card hod-faculty-table-card">
          <div className="hod-table-responsive-wrapper">
            <table className="hod-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Employee ID</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Subjects</th>
                  <th>Weekly Load</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyMembers.map((f) => {
                  const initials = f.name
                    ? f.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "FC";

                  return (
                    <tr key={f.id} className="hod-table-row">
                      <td>
                        <div className="hod-table-user-cell">
                          <div className="hod-table-avatar">
                            {f.avatarUrl ? (
                              <img src={f.avatarUrl} alt={f.name} />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div>
                            <div className="hod-table-user-name">{f.name}</div>
                            <div className="hod-table-user-email">{f.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="hod-empid-pill">{f.employeeId}</span>
                      </td>
                      <td>{f.designation}</td>
                      <td>{f.department}</td>
                      <td>
                        <div className="hod-table-subjects-cell">
                          {f.subjects && f.subjects.length > 0 ? (
                            f.subjects.slice(0, 2).map((s, idx) => (
                              <span key={idx} className="hod-subject-tag-sm">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "var(--hod-text-muted)" }}>None</span>
                          )}
                          {f.subjects && f.subjects.length > 2 && (
                            <span className="hod-subject-tag-sm more">
                              +{f.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="hod-table-load-badge">
                          {f.weeklyLoadHours || 0} hrs/wk
                        </span>
                      </td>
                      <td>
                        {f.onLeaveToday ? (
                          <span className="hod-pill amber" style={{ fontSize: "0.75rem" }}>
                            On Leave
                          </span>
                        ) : (
                          <span
                            className={`hod-pill ${
                              f.status === "active" ? "emerald" : "amber"
                            }`}
                            style={{ fontSize: "0.75rem" }}
                          >
                            {f.status === "active" ? "Active" : "Pending"}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="hod-table-action-btns">
                          <button
                            type="button"
                            className="hod-btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                            onClick={() => handleOpenDrawer(f, "overview")}
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="hod-faculty-pagination-bar">
          <span className="hod-pagination-info">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
            {pagination.totalCount} faculty members
          </span>

          <div className="hod-pagination-controls">
            <button
              type="button"
              className="hod-btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>
            <span className="hod-page-number">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="hod-btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. ONE COMPLETE TEACHER PROFILE DRAWER (10 TABS)
          ========================================================================= */}
      {selectedTeacher && (
        <div className="hod-drawer-backdrop" onClick={handleCloseDrawer}>
          <div
            className="hod-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="hod-drawer-header">
              <div className="hod-drawer-header-left">
                <div className="hod-drawer-avatar">
                  {selectedTeacher.avatarUrl ? (
                    <img
                      src={selectedTeacher.avatarUrl}
                      alt={selectedTeacher.name}
                    />
                  ) : (
                    <span>
                      {selectedTeacher.name
                        ? selectedTeacher.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "FC"}
                    </span>
                  )}
                </div>
                <div className="hod-drawer-title-box">
                  <h3>{selectedTeacher.name}</h3>
                  <div className="hod-drawer-meta-badges">
                    <span className="hod-empid-pill">{selectedTeacher.employeeId}</span>
                    <span className="hod-desig-badge">{selectedTeacher.designation}</span>
                    <span className="hod-dept-badge">{selectedTeacher.department}</span>
                  </div>
                </div>
              </div>

              <div className="hod-drawer-header-right">
                <button
                  type="button"
                  className="hod-drawer-close-btn"
                  onClick={handleCloseDrawer}
                  title="Close Profile (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer 10 Tabs Navigation Bar */}
            <div className="hod-drawer-tab-bar">
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "overview" ? "active" : ""}`}
                onClick={() => setProfileTab("overview")}
              >
                Overview
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "professional" ? "active" : ""}`}
                onClick={() => setProfileTab("professional")}
              >
                Profile & Bio
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "subjects" ? "active" : ""}`}
                onClick={() => setProfileTab("subjects")}
              >
                Subjects & Classes
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "timetable" ? "active" : ""}`}
                onClick={() => setProfileTab("timetable")}
              >
                Weekly Timetable
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "workload" ? "active" : ""}`}
                onClick={() => setProfileTab("workload")}
              >
                Workload Analytics
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "leaves" ? "active" : ""}`}
                onClick={() => setProfileTab("leaves")}
              >
                Leaves ({deepDetails?.leaves?.length || 0})
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "responsibilities" ? "active" : ""}`}
                onClick={() => setProfileTab("responsibilities")}
              >
                Responsibilities
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "marks" ? "active" : ""}`}
                onClick={() => setProfileTab("marks")}
              >
                Marks & Syllabus
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "reports" ? "active" : ""}`}
                onClick={() => setProfileTab("reports")}
              >
                Reports
              </button>
              <button
                type="button"
                className={`hod-dtab-btn ${profileTab === "activity" ? "active" : ""}`}
                onClick={() => setProfileTab("activity")}
              >
                Activity History
              </button>
            </div>

            {/* Drawer Tab Content */}
            <div className="hod-drawer-body">
              {drawerLoading ? (
                <div className="hod-drawer-loading">
                  <Loader2 size={32} className="spin" color="var(--hod-primary)" />
                  <p>Retrieving authorized faculty records from institutional ledger...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {profileTab === "overview" && (
                    <div className="hod-dtab-content hod-overview-tab">
                      {/* Quick Snapshot KPIs */}
                      <div className="hod-overview-kpi-row">
                        <div className="hod-card hod-ov-kpi">
                          <span className="hod-ov-kpi-title">Weekly Periods</span>
                          <span className="hod-ov-kpi-val cyan">
                            {deepDetails?.workload?.weeklyLoadHours || 0} hrs
                          </span>
                          <span className="hod-ov-kpi-sub">
                            {deepDetails?.workload?.utilizationRate || 0}% utilization
                          </span>
                        </div>
                        <div className="hod-card hod-ov-kpi">
                          <span className="hod-ov-kpi-title">Subjects Taught</span>
                          <span className="hod-ov-kpi-val indigo">
                            {deepDetails?.teacher?.subjects?.length || 0}
                          </span>
                          <span className="hod-ov-kpi-sub">Assigned curriculum</span>
                        </div>
                        <div className="hod-card hod-ov-kpi">
                          <span className="hod-ov-kpi-title">Leave History</span>
                          <span className="hod-ov-kpi-val amber">
                            {deepDetails?.leaves?.length || 0}
                          </span>
                          <span className="hod-ov-kpi-sub">Total applications</span>
                        </div>
                        <div className="hod-card hod-ov-kpi">
                          <span className="hod-ov-kpi-title">Attendance Status</span>
                          <span
                            className={`hod-ov-kpi-val ${
                              selectedTeacher.onLeaveToday ? "amber" : "emerald"
                            }`}
                          >
                            {selectedTeacher.onLeaveToday ? "On Leave" : "On Duty"}
                          </span>
                          <span className="hod-ov-kpi-sub">Today's campus record</span>
                        </div>
                      </div>

                      {/* Official Information & Contact Card */}
                      <div className="hod-card hod-overview-info-card">
                        <h4 className="hod-section-title">
                          <ShieldCheck size={18} color="var(--hod-primary)" />
                          Official Institutional Credentials
                        </h4>
                        <div className="hod-info-grid">
                          <div className="hod-info-item">
                            <span className="hod-info-label">Full Name</span>
                            <span className="hod-info-value">{deepDetails?.teacher?.name}</span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Institutional Email</span>
                            <span className="hod-info-value">{deepDetails?.teacher?.email}</span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Employee ID</span>
                            <span className="hod-info-value">{deepDetails?.teacher?.employeeId}</span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Department</span>
                            <span className="hod-info-value">{deepDetails?.teacher?.department}</span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Designation</span>
                            <span className="hod-info-value">{deepDetails?.teacher?.designation}</span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Contact Phone</span>
                            <span className="hod-info-value">
                              {deepDetails?.teacher?.phone || "Extension on File"}
                            </span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Account Status</span>
                            <span className="hod-info-value">
                              <span
                                className={`hod-pill ${
                                  deepDetails?.teacher?.status === "active" ? "emerald" : "amber"
                                }`}
                              >
                                {deepDetails?.teacher?.status || "active"}
                              </span>
                            </span>
                          </div>
                          <div className="hod-info-item">
                            <span className="hod-info-label">Joining / Record Date</span>
                            <span className="hod-info-value">
                              {deepDetails?.teacher?.createdAt
                                ? new Date(deepDetails.teacher.createdAt).toLocaleDateString(
                                    undefined,
                                    { year: "numeric", month: "long", day: "numeric" }
                                  )
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Bio / Summary Quote */}
                        {deepDetails?.teacher?.bio && (
                          <div className="hod-bio-quote-box">
                            <strong>Academic Biography:</strong>
                            <p>{deepDetails.teacher.bio}</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Executive Shortcuts */}
                      <div className="hod-card hod-overview-shortcuts-card">
                        <h4 className="hod-section-title">
                          <Layers size={18} color="var(--hod-violet)" />
                          Department Executive Actions
                        </h4>
                        <div className="hod-shortcut-buttons-row">
                          <button
                            type="button"
                            className="hod-btn-primary"
                            onClick={() => {
                              setAssignForm((prev) => ({
                                ...prev,
                                branch: deptBranch,
                                subject: deepDetails?.teacher?.subjects?.[0] || ""
                              }));
                              setAssignConflictError("");
                              setIsAssignModalOpen(true);
                            }}
                          >
                            <Plus size={15} />
                            <span>Assign Class Slot</span>
                          </button>

                          <button
                            type="button"
                            className="hod-btn-secondary"
                            onClick={() => setProfileTab("timetable")}
                          >
                            <Calendar size={15} />
                            <span>Inspect Timetable</span>
                          </button>

                          <button
                            type="button"
                            className="hod-btn-secondary"
                            onClick={() => setProfileTab("leaves")}
                          >
                            <Clock size={15} />
                            <span>Review Leave Ledger</span>
                          </button>

                          <button
                            type="button"
                            className="hod-btn-secondary"
                            onClick={() => setProfileTab("workload")}
                          >
                            <BarChart2 size={15} />
                            <span>Analyze Workload</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PERSONAL & PROFESSIONAL (EDITABLE PROFILE) */}
                  {profileTab === "professional" && (
                    <form onSubmit={handleSaveProfile} className="hod-dtab-content hod-form-tab">
                      {/* Protected Official Ledger Notice */}
                      <div className="hod-notice-callout">
                        <Lock size={16} color="var(--hod-amber)" />
                        <div>
                          <strong>Strict RBAC & Department Isolation Policy:</strong> Official account
                          credentials (Email, Institutional Role, Department, Account ID) are managed by
                          Central Academic Administration and cannot be altered by HOD. Institutional
                          designations, departmental responsibilities, and curriculum subjects can be
                          curated below.
                        </div>
                      </div>

                      <div className="hod-card hod-form-card">
                        <h4 className="hod-section-title">
                          <Edit3 size={18} color="var(--hod-primary)" />
                          Departmental Faculty Information
                        </h4>

                        <div className="hod-form-field">
                          <label className="hod-form-label">Academic Designation</label>
                          <input
                            type="text"
                            className="hod-input"
                            value={editForm.designation}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, designation: e.target.value }))
                            }
                            placeholder="e.g. Associate Professor / Systems Lab Lead"
                            required
                          />
                        </div>

                        <div className="hod-form-field">
                          <label className="hod-form-label">Departmental Responsibilities</label>
                          <textarea
                            className="hod-textarea"
                            rows={3}
                            value={editForm.responsibilities}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                responsibilities: e.target.value
                              }))
                            }
                            placeholder="e.g. NBA Accreditation Lead, Operating Systems Lab In-charge, 3rd Year Mentorship..."
                          />
                        </div>

                        <div className="hod-form-field">
                          <label className="hod-form-label">Professional Bio / Academic Profile</label>
                          <textarea
                            className="hod-textarea"
                            rows={3}
                            value={editForm.bio}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                            }
                            placeholder="Academic background, research specializations, or teaching philosophies..."
                          />
                        </div>

                        {/* Curriculum Subjects Tag Manager */}
                        <div className="hod-form-field">
                          <label className="hod-form-label">
                            Authorized Curriculum Subjects ({editForm.subjects.length})
                          </label>
                          <div className="hod-tags-manager">
                            <div className="hod-tags-chip-list">
                              {editForm.subjects.map((sub, idx) => (
                                <span key={idx} className="hod-subject-tag-edit">
                                  {sub}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubjectTag(sub)}
                                    title="Remove subject"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="hod-tag-input-row">
                              <input
                                type="text"
                                className="hod-input"
                                placeholder="Add subject (e.g. Operating Systems)..."
                                value={subjectInput}
                                onChange={(e) => setSubjectInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSubjectTag();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="hod-btn-secondary"
                                onClick={handleAddSubjectTag}
                              >
                                <Plus size={14} />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="hod-form-actions">
                          <button
                            type="submit"
                            className="hod-btn-primary"
                            disabled={isSavingProfile}
                          >
                            {isSavingProfile ? (
                              <Loader2 size={16} className="spin" />
                            ) : (
                              <ShieldCheck size={16} />
                            )}
                            <span>Save Profile Changes</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* TAB 3: ASSIGNED SUBJECTS & CLASSES */}
                  {profileTab === "subjects" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <BookOpen size={18} color="var(--hod-primary)" />
                            Curriculum Subjects & Assigned Sessions
                          </h4>
                          <p className="hod-section-sub">
                            Active teaching assignments verified against Master Timetable slots.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="hod-btn-primary"
                          onClick={() => {
                            setAssignForm((prev) => ({
                              ...prev,
                              branch: deptBranch,
                              subject: deepDetails?.teacher?.subjects?.[0] || ""
                            }));
                            setAssignConflictError("");
                            setIsAssignModalOpen(true);
                          }}
                        >
                          <Plus size={15} />
                          <span>Assign New Slot</span>
                        </button>
                      </div>

                      {/* Slots List */}
                      {deepDetails?.timetableSlots?.length === 0 ? (
                        <div className="hod-empty-box">
                          <BookOpen size={36} style={{ opacity: 0.4 }} />
                          <h4>No Timetable Slots Assigned</h4>
                          <p>
                            This faculty member does not have any active class sections assigned in the
                            timetable. Click "Assign New Slot" above to allocate periods.
                          </p>
                        </div>
                      ) : (
                        <div className="hod-slots-list-grid">
                          {deepDetails.timetableSlots.map((slot, idx) => (
                            <div key={idx} className="hod-card hod-slot-card">
                              <div className="hod-slot-card-header">
                                <span className="hod-slot-day-pill">{slot.dayOfWeek}</span>
                                <span className="hod-slot-time">
                                  <Clock size={13} /> {slot.startTime} - {slot.endTime}
                                </span>
                              </div>

                              <div className="hod-slot-body">
                                <h4 className="hod-slot-subject">{slot.subject}</h4>
                                <div className="hod-slot-meta-row">
                                  <span>
                                    <strong>Sem:</strong> {slot.semester}
                                  </span>
                                  <span>
                                    <MapPin size={12} /> {slot.roomNo}
                                  </span>
                                  <span className="hod-pill indigo" style={{ fontSize: "0.72rem" }}>
                                    {slot.type}
                                  </span>
                                </div>
                              </div>

                              <div className="hod-slot-card-footer">
                                <span className="hod-slot-branch">{slot.branch}</span>
                                <button
                                  type="button"
                                  className="hod-btn-secondary danger icon-only"
                                  onClick={() =>
                                    handleUnassignSlot(slot.timetableId, slot.slotId, slot.subject)
                                  }
                                  title="Unassign this teaching slot"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: WEEKLY TIMETABLE */}
                  {profileTab === "timetable" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <Calendar size={18} color="var(--hod-primary)" />
                            Weekly Faculty Schedule Grid
                          </h4>
                          <p className="hod-section-sub">
                            Confirmed lectures, laboratory sessions, and tutorial hours from Monday to
                            Saturday.
                          </p>
                        </div>

                        {onNavigate && (
                          <button
                            type="button"
                            className="hod-btn-secondary"
                            onClick={() => onNavigate("dashboard", "timetable")}
                            title="Open Master Department Timetable"
                          >
                            <ExternalLink size={14} />
                            <span>Master Timetable</span>
                          </button>
                        )}
                      </div>

                      {/* Daily Timetable Breakdown */}
                      <div className="hod-timetable-days-container">
                        {DAYS_OF_WEEK.map((day) => {
                          const daySlots = (deepDetails?.timetableSlots || []).filter(
                            (s) => s.dayOfWeek === day
                          );

                          return (
                            <div key={day} className="hod-card hod-day-schedule-card">
                              <div className="hod-day-schedule-header">
                                <span className="hod-day-name">{day}</span>
                                <span className="hod-day-count-badge">
                                  {daySlots.length} {daySlots.length === 1 ? "Period" : "Periods"}
                                </span>
                              </div>

                              {daySlots.length === 0 ? (
                                <div className="hod-day-empty">No classes scheduled</div>
                              ) : (
                                <div className="hod-day-slots-list">
                                  {daySlots.map((s, idx) => (
                                    <div key={idx} className="hod-schedule-slot-item">
                                      <div className="hod-slot-time-col">
                                        <span>{s.startTime}</span>
                                        <span className="hod-slot-dash">-</span>
                                        <span>{s.endTime}</span>
                                      </div>
                                      <div className="hod-slot-details-col">
                                        <div className="hod-slot-title-text">{s.subject}</div>
                                        <div className="hod-slot-subtext">
                                          <span>{s.semester}</span>
                                          <span>•</span>
                                          <span>{s.roomNo}</span>
                                          <span>•</span>
                                          <span className="hod-pill indigo" style={{ fontSize: "0.68rem" }}>
                                            {s.type}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: WORKLOAD ANALYTICS */}
                  {profileTab === "workload" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <BarChart2 size={18} color="var(--hod-primary)" />
                            Workload Distribution & Department Utilization
                          </h4>
                          <p className="hod-section-sub">
                            Institutional teaching load compared to the AICTE/UGC norm of 18 hours per
                            week.
                          </p>
                        </div>
                      </div>

                      {/* Workload Metric Gauge Card */}
                      <div className="hod-card hod-workload-overview-card">
                        <div className="hod-workload-gauge-top">
                          <div>
                            <span className="hod-gauge-title">Weekly Teaching Hours</span>
                            <div className="hod-gauge-val-big">
                              {deepDetails?.workload?.weeklyLoadHours || 0} /{" "}
                              {STANDARD_WORKLOAD_LIMIT} hrs
                            </div>
                          </div>

                          <span
                            className={`hod-pill ${
                              (deepDetails?.workload?.weeklyLoadHours || 0) >
                              STANDARD_WORKLOAD_LIMIT
                                ? "rose"
                                : (deepDetails?.workload?.weeklyLoadHours || 0) >= 12
                                ? "emerald"
                                : "amber"
                            }`}
                            style={{ fontSize: "0.85rem", padding: "8px 14px" }}
                          >
                            {(deepDetails?.workload?.weeklyLoadHours || 0) >
                            STANDARD_WORKLOAD_LIMIT
                              ? "Overload Warning"
                              : (deepDetails?.workload?.weeklyLoadHours || 0) >= 12
                              ? "Standard Utilization"
                              : "Under-Utilized"}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="hod-gauge-bar-track">
                          <div
                            className={`hod-gauge-bar-fill ${
                              (deepDetails?.workload?.weeklyLoadHours || 0) >
                              STANDARD_WORKLOAD_LIMIT
                                ? "rose"
                                : (deepDetails?.workload?.weeklyLoadHours || 0) >= 12
                                ? "emerald"
                                : "indigo"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                ((deepDetails?.workload?.weeklyLoadHours || 0) /
                                  STANDARD_WORKLOAD_LIMIT) *
                                  100
                              )}%`
                            }}
                          />
                        </div>

                        <div className="hod-gauge-meta-grid">
                          <div className="hod-gauge-meta-item">
                            <span>Total Assigned Classes</span>
                            <strong>{deepDetails?.timetableSlots?.length || 0}</strong>
                          </div>
                          <div className="hod-gauge-meta-item">
                            <span>Subject Specializations</span>
                            <strong>{deepDetails?.teacher?.subjects?.length || 0}</strong>
                          </div>
                          <div className="hod-gauge-meta-item">
                            <span>Institutional Limit</span>
                            <strong>{STANDARD_WORKLOAD_LIMIT} periods/week</strong>
                          </div>
                        </div>
                      </div>

                      {/* Daily Load Distribution Bar Chart */}
                      <div className="hod-card hod-daily-load-card">
                        <h4 className="hod-section-title">
                          <Clock size={16} color="var(--hod-cyan)" />
                          Daily Teaching Distribution (Monday - Saturday)
                        </h4>

                        <div className="hod-daily-chart-bars">
                          {DAYS_OF_WEEK.map((day) => {
                            const hours = deepDetails?.workload?.dailyWorkload?.[day] || 0;
                            const maxDailyNorm = 4; // 4 periods/day reference
                            const pct = Math.min(100, Math.round((hours / maxDailyNorm) * 100));

                            return (
                              <div key={day} className="hod-daily-bar-col">
                                <div className="hod-bar-number">{hours}h</div>
                                <div className="hod-bar-col-track">
                                  <div
                                    className={`hod-bar-col-fill ${
                                      hours > maxDailyNorm ? "rose" : hours > 0 ? "indigo" : ""
                                    }`}
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                                <span className="hod-bar-day-label">{day.slice(0, 3)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: ATTENDANCE & LEAVE HISTORY */}
                  {profileTab === "leaves" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <Clock size={18} color="var(--hod-primary)" />
                            Faculty Leave Ledger & Sanction History
                          </h4>
                          <p className="hod-section-sub">
                            Formal duty leaves, medical absences, and executive approvals.
                          </p>
                        </div>
                      </div>

                      {deepDetails?.leaves?.length === 0 ? (
                        <div className="hod-empty-box">
                          <Clock size={36} style={{ opacity: 0.4 }} />
                          <h4>No Leave Records on File</h4>
                          <p>
                            {selectedTeacher.name} has not submitted any leave applications for this
                            academic session.
                          </p>
                        </div>
                      ) : (
                        <div className="hod-leaves-list">
                          {deepDetails.leaves.map((leave) => {
                            const startStr = new Date(leave.startDate).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            });
                            const endStr = new Date(leave.endDate).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            });

                            return (
                              <div key={leave.id || leave._id} className="hod-card hod-leave-record-card">
                                <div className="hod-leave-record-top">
                                  <div>
                                    <span className="hod-leave-type-pill">{leave.leaveType}</span>
                                    <span className="hod-leave-dates">
                                      <Calendar size={13} /> {startStr} → {endStr}
                                    </span>
                                  </div>

                                  <span
                                    className={`hod-pill ${
                                      leave.status === "approved"
                                        ? "emerald"
                                        : leave.status === "rejected"
                                        ? "rose"
                                        : "amber"
                                    }`}
                                  >
                                    {leave.status === "approved"
                                      ? "Sanctioned"
                                      : leave.status === "rejected"
                                      ? "Declined"
                                      : "Pending Review"}
                                  </span>
                                </div>

                                <div className="hod-leave-reason-text">
                                  <strong>Reason:</strong> {leave.reason}
                                </div>

                                {leave.reviewerRemarks && (
                                  <div className="hod-leave-remarks-text">
                                    <strong>Executive Remarks:</strong> {leave.reviewerRemarks}
                                  </div>
                                )}

                                {/* Inline Sanction Action if Pending */}
                                {leave.status === "pending" && (
                                  <div className="hod-leave-inline-decision-row">
                                    <button
                                      type="button"
                                      className="hod-btn-primary"
                                      style={{
                                        background: "var(--hod-emerald)",
                                        borderColor: "var(--hod-emerald)"
                                      }}
                                      onClick={() =>
                                        setLeaveModal({
                                          open: true,
                                          leaveId: leave.id || leave._id,
                                          applicantName: selectedTeacher.name,
                                          action: "approved",
                                          remarks: ""
                                        })
                                      }
                                    >
                                      <CheckCircle2 size={14} />
                                      <span>Sanction / Approve</span>
                                    </button>

                                    <button
                                      type="button"
                                      className="hod-btn-secondary danger"
                                      onClick={() =>
                                        setLeaveModal({
                                          open: true,
                                          leaveId: leave.id || leave._id,
                                          applicantName: selectedTeacher.name,
                                          action: "rejected",
                                          remarks: ""
                                        })
                                      }
                                    >
                                      <XCircle size={14} />
                                      <span>Decline / Reject</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: ACADEMIC RESPONSIBILITIES */}
                  {profileTab === "responsibilities" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <Briefcase size={18} color="var(--hod-primary)" />
                            Departmental Roles & Committee Responsibilities
                          </h4>
                          <p className="hod-section-sub">
                            Assigned institutional duties, laboratory oversight, and committee
                            memberships.
                          </p>
                        </div>
                      </div>

                      <div className="hod-card hod-responsibilities-card">
                        <div className="hod-resp-item">
                          <span className="hod-resp-label">Institutional Designation</span>
                          <span className="hod-resp-val">{deepDetails?.teacher?.designation}</span>
                        </div>
                        <div className="hod-resp-item">
                          <span className="hod-resp-label">Department</span>
                          <span className="hod-resp-val">{deepDetails?.teacher?.department}</span>
                        </div>
                        <div className="hod-resp-item">
                          <span className="hod-resp-label">Academic Portfolio</span>
                          <span className="hod-resp-val">
                            {deepDetails?.teacher?.responsibilities || (
                              <span style={{ color: "var(--hod-text-muted)" }}>
                                No specific committee responsibilities configured. Edit in Profile &
                                Bio tab to assign duties.
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 8: MARKS & SYLLABUS PROGRESS */}
                  {profileTab === "marks" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <Award size={18} color="var(--hod-primary)" />
                            Examination Evaluation & Course Progress
                          </h4>
                          <p className="hod-section-sub">
                            Verified marks submitted by this faculty member to the academic ledger.
                          </p>
                        </div>
                      </div>

                      {/* Evaluations list */}
                      {deepDetails?.examMarks?.length === 0 ? (
                        <div className="hod-empty-box">
                          <Award size={36} style={{ opacity: 0.4 }} />
                          <h4>No Evaluated Marks Found</h4>
                          <p>
                            This instructor has not submitted midterm or laboratory marks for the current
                            evaluation cycle yet.
                          </p>
                        </div>
                      ) : (
                        <div className="hod-card hod-table-card">
                          <div className="hod-table-responsive-wrapper">
                            <table className="hod-table">
                              <thead>
                                <tr>
                                  <th>Student Candidate</th>
                                  <th>Subject</th>
                                  <th>Exam Type</th>
                                  <th>Marks</th>
                                  <th>Grade</th>
                                  <th>Date Evaluated</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deepDetails.examMarks.map((em, idx) => (
                                  <tr key={idx}>
                                    <td>
                                      <strong>{em.studentId?.fullName || "Student"}</strong>
                                      <div style={{ fontSize: "0.75rem", color: "var(--hod-text-muted)" }}>
                                        {em.studentId?.rollNo || em.studentId?.email}
                                      </div>
                                    </td>
                                    <td>{em.subject}</td>
                                    <td>{em.examType}</td>
                                    <td>
                                      <strong>{em.marksObtained}</strong> / {em.maxMarks}
                                    </td>
                                    <td>
                                      <span className="hod-pill indigo">{em.grade}</span>
                                    </td>
                                    <td>
                                      {new Date(em.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 9: REPORTS & DOCUMENTS */}
                  {profileTab === "reports" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <FileText size={18} color="var(--hod-primary)" />
                            Official Faculty Dossier & Accreditation Records
                          </h4>
                          <p className="hod-section-sub">
                            Export verified faculty workload reports for NBA / NAAC compliance audits.
                          </p>
                        </div>
                      </div>

                      <div className="hod-card hod-reports-export-box">
                        <div className="hod-rexport-info">
                          <FileText size={32} color="var(--hod-primary)" />
                          <div>
                            <h4>Individual Faculty Workload Summary</h4>
                            <p>
                              Complete schedule breakdown, student hours, assigned curriculum, and
                              sanctioned leave ledger formatted for official faculty audit files.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="hod-btn-primary"
                          onClick={() => {
                            const content = `=====================================================
SVSU SUBHARTI POLYTECHNIC — FACULTY DOSSIER
=====================================================
Faculty Name: ${deepDetails?.teacher?.name}
Employee ID: ${deepDetails?.teacher?.employeeId}
Department: ${deepDetails?.teacher?.department}
Designation: ${deepDetails?.teacher?.designation}
Email: ${deepDetails?.teacher?.email}
Phone: ${deepDetails?.teacher?.phone || "N/A"}
Weekly Teaching Load: ${deepDetails?.workload?.weeklyLoadHours || 0} periods/week
Curriculum Subjects: ${(deepDetails?.teacher?.subjects || []).join(", ")}
Generated on: ${new Date().toLocaleString()}
=====================================================
SCHEDULE BREAKDOWN:
${(deepDetails?.timetableSlots || [])
  .map(
    (s) =>
      `• ${s.dayOfWeek}: ${s.startTime} - ${s.endTime} | ${s.subject} (${s.semester}) | Room: ${s.roomNo}`
  )
  .join("\n")}
=====================================================`;

                            const blob = new Blob([content], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `Faculty_Dossier_${deepDetails?.teacher?.employeeId}_${deepDetails?.teacher?.name?.replace(
                              /\s+/g,
                              "_"
                            )}.txt`;
                            link.click();
                            URL.revokeObjectURL(url);
                            showToast?.("Faculty dossier downloaded.");
                          }}
                        >
                          <Download size={15} />
                          <span>Download Official Dossier (.txt)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 10: ACTIVITY HISTORY */}
                  {profileTab === "activity" && (
                    <div className="hod-dtab-content">
                      <div className="hod-card-header-bar">
                        <div>
                          <h4 className="hod-section-title">
                            <ShieldCheck size={18} color="var(--hod-primary)" />
                            Institutional Ledger & Audit Log
                          </h4>
                          <p className="hod-section-sub">
                            Immutable system audit logs recording timetable modifications, profile
                            updates, and executive actions.
                          </p>
                        </div>
                      </div>

                      {deepDetails?.auditLogs?.length === 0 ? (
                        <div className="hod-empty-box">
                          <ShieldCheck size={36} style={{ opacity: 0.4 }} />
                          <h4>No Recent Audit Logs</h4>
                          <p>No administrative changes have been recorded for this faculty member.</p>
                        </div>
                      ) : (
                        <div className="hod-audit-list">
                          {deepDetails.auditLogs.map((log) => (
                            <div key={log.id || log._id} className="hod-card hod-audit-item-card">
                              <div className="hod-audit-top">
                                <span className="hod-audit-action">{log.action}</span>
                                <span className="hod-audit-time">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="hod-audit-performer">
                                Performed by <strong>{log.performerName}</strong> ({log.performerRole})
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. ASSIGN TEACHING SLOT MODAL (WITH TIMETABLE CONFLICT DETECTION)
          ========================================================================= */}
      {isAssignModalOpen && selectedTeacher && (
        <div
          className="hod-modal-backdrop"
          onClick={() => {
            if (!assignLoading) setIsAssignModalOpen(false);
          }}
        >
          <div
            className="hod-card hod-assign-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="hod-modal-header">
              <div>
                <h3 className="hod-modal-title">
                  <Calendar size={18} color="var(--hod-primary)" />
                  Assign Teaching Slot
                </h3>
                <p className="hod-modal-sub">
                  Assigning class session to <strong>{selectedTeacher.name}</strong> ({deptBranch})
                </p>
              </div>
              <button
                type="button"
                className="hod-modal-close"
                onClick={() => setIsAssignModalOpen(false)}
                disabled={assignLoading}
              >
                <X size={18} />
              </button>
            </div>

            {assignConflictError && (
              <div className="hod-conflict-alert" role="alert">
                <AlertTriangle size={18} />
                <div>
                  <strong>Assignment Conflict Detected:</strong>
                  <p>{assignConflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="hod-assign-form">
              <div className="hod-form-row">
                <div className="hod-form-field">
                  <label className="hod-form-label">Academic Year</label>
                  <select
                    className="hod-select"
                    value={assignForm.academicYear}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, academicYear: e.target.value }))
                    }
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>

                <div className="hod-form-field">
                  <label className="hod-form-label">Semester</label>
                  <select
                    className="hod-select"
                    value={assignForm.semester}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, semester: e.target.value }))
                    }
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                  </select>
                </div>
              </div>

              <div className="hod-form-field">
                <label className="hod-form-label">Subject Title / Code</label>
                <input
                  type="text"
                  className="hod-input"
                  placeholder="e.g. Operating Systems / CS-301"
                  value={assignForm.subject}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="hod-form-row">
                <div className="hod-form-field">
                  <label className="hod-form-label">Day of Week</label>
                  <select
                    className="hod-select"
                    value={assignForm.dayOfWeek}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
                    }
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hod-form-field">
                  <label className="hod-form-label">Session Type</label>
                  <select
                    className="hod-select"
                    value={assignForm.type}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab Session</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
              </div>

              <div className="hod-form-row">
                <div className="hod-form-field">
                  <label className="hod-form-label">Start Time</label>
                  <input
                    type="text"
                    className="hod-input"
                    placeholder="09:00 AM"
                    value={assignForm.startTime}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="hod-form-field">
                  <label className="hod-form-label">End Time</label>
                  <input
                    type="text"
                    className="hod-input"
                    placeholder="10:00 AM"
                    value={assignForm.endTime}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="hod-form-field">
                  <label className="hod-form-label">Room / Lab Hall</label>
                  <input
                    type="text"
                    className="hod-input"
                    placeholder="Room 101 / Lab 2"
                    value={assignForm.roomNo}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, roomNo: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="hod-modal-actions">
                <button
                  type="button"
                  className="hod-btn-secondary"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="hod-btn-primary" disabled={assignLoading}>
                  {assignLoading ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. LEAVE SANCTION / REMARKS MODAL
          ========================================================================= */}
      {leaveModal.open && (
        <div
          className="hod-modal-backdrop"
          onClick={() => {
            if (!leaveSubmitting) setLeaveModal((prev) => ({ ...prev, open: false }));
          }}
        >
          <div
            className="hod-card hod-leave-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="hod-modal-header">
              <div>
                <h3 className="hod-modal-title">
                  {leaveModal.action === "approved" ? (
                    <CheckCircle2 size={18} color="var(--hod-emerald)" />
                  ) : (
                    <XCircle size={18} color="var(--hod-rose)" />
                  )}
                  {leaveModal.action === "approved" ? "Sanction Leave Request" : "Decline Leave Request"}
                </h3>
                <p className="hod-modal-sub">Applicant: {leaveModal.applicantName}</p>
              </div>
              <button
                type="button"
                className="hod-modal-close"
                onClick={() => setLeaveModal((prev) => ({ ...prev, open: false }))}
                disabled={leaveSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="hod-leave-modal-body">
              <label className="hod-form-label">
                Executive Remarks / Approval Notes (Optional)
              </label>
              <textarea
                className="hod-textarea"
                rows={3}
                placeholder={
                  leaveModal.action === "approved"
                    ? "Leave sanctioned as per institutional duty provisions."
                    : "Declined due to conflicting scheduled midterm examinations."
                }
                value={leaveModal.remarks}
                onChange={(e) =>
                  setLeaveModal((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </div>

            <div className="hod-modal-actions">
              <button
                type="button"
                className="hod-btn-secondary"
                onClick={() => setLeaveModal((prev) => ({ ...prev, open: false }))}
                disabled={leaveSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`hod-btn-primary ${leaveModal.action === "rejected" ? "danger" : ""}`}
                style={
                  leaveModal.action === "approved"
                    ? { background: "var(--hod-emerald)", borderColor: "var(--hod-emerald)" }
                    : {}
                }
                onClick={handleConfirmLeaveDecision}
                disabled={leaveSubmitting}
              >
                {leaveSubmitting ? (
                  <Loader2 size={16} className="spin" />
                ) : leaveModal.action === "approved" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>
                  Confirm {leaveModal.action === "approved" ? "Sanction" : "Rejection"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}