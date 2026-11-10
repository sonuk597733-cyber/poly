import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Briefcase,
  Building,
  TrendingUp,
  Award,
  Users,
  User,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart2,
  Sparkles,
  X,
  Check,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  ExternalLink,
  ChevronRight,
  Eye,
  FileCheck,
  Percent,
  Sliders
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODPlacements.css";

const BATCHES = ["ALL", "2024-2025", "2025-2026", "2026-2027"];
const TYPES = ["ALL", "Placement", "Internship"];
const STATUS_OPTIONS = ["ALL", "upcoming", "ongoing", "completed"];

export default function HODPlacements() {
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [drives, setDrives] = useState([]);
  const [stats, setStats] = useState({
    totalDrives: 0,
    upcomingDrivesCount: 0,
    totalPlacedCount: 0,
    highestPackageLPA: 7.2,
    avgPackageLPA: 5.8,
    placedStudentsList: []
  });

  // Filters & Search
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Drive Modal (Create / Edit)
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [driveSubmitting, setDriveSubmitting] = useState(false);
  const [driveForm, setDriveForm] = useState({
    companyName: "",
    jobRole: "",
    type: "Placement",
    academicBatch: "2025-2026",
    packageLPA: 6.5,
    companyLocation: "Noida / Gurugram (NCR)",
    driveDate: "",
    applicationDeadline: "",
    minCGPA: 6.5,
    status: "upcoming",
    selectionProcess: "Aptitude Test -> Technical Coding -> HR Round"
  });

  // Placed Students Drawer / Modal
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedDriveForStudents, setSelectedDriveForStudents] = useState(null);
  const [newStudentForm, setNewStudentForm] = useState({
    studentName: "",
    rollNumber: "",
    packageOffered: 6.5,
    offerLetterVerified: true
  });
  const [studentAdding, setStudentAdding] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Load Data ---
  const loadPlacementData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [drivesRes, statsRes] = await Promise.all([
        authApi.getPlacements({}),
        authApi.getPlacementStats()
      ]);

      if (drivesRes && drivesRes.success) {
        setDrives(drivesRes.records || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats || {});
      }
    } catch (err) {
      console.error("HODPlacements load error:", err);
      setError(err.message || "Failed to load placement records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlacementData();
  }, [loadPlacementData]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // Filtered Drives
  const filteredDrives = useMemo(() => {
    let list = [...drives];

    if (selectedBatch !== "ALL") {
      list = list.filter((d) => d.academicBatch === selectedBatch);
    }
    if (selectedType !== "ALL") {
      list = list.filter((d) => d.type === selectedType);
    }
    if (selectedStatus !== "ALL") {
      list = list.filter((d) => d.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          (d.companyName && d.companyName.toLowerCase().includes(q)) ||
          (d.jobRole && d.jobRole.toLowerCase().includes(q)) ||
          (d.companyLocation && d.companyLocation.toLowerCase().includes(q))
      );
    }

    return list;
  }, [drives, selectedBatch, selectedType, selectedStatus, searchQuery]);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    const now = Date.now();
    setDriveForm({
      companyName: "",
      jobRole: "",
      type: selectedType !== "ALL" ? selectedType : "Placement",
      academicBatch: selectedBatch !== "ALL" ? selectedBatch : "2025-2026",
      packageLPA: 6.5,
      companyLocation: "Noida / Gurugram (NCR)",
      driveDate: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      applicationDeadline: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      minCGPA: 6.5,
      status: "upcoming",
      selectionProcess: "Online Aptitude & Coding -> Technical Round -> Management Interview"
    });
    setShowDriveModal(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setEditingId(item.id || item._id);
    setDriveForm({
      companyName: item.companyName || "",
      jobRole: item.jobRole || "",
      type: item.type || "Placement",
      academicBatch: item.academicBatch || "2025-2026",
      packageLPA: item.packageLPA || 6.5,
      companyLocation: item.companyLocation || "",
      driveDate: item.driveDate ? new Date(item.driveDate).toISOString().split("T")[0] : "",
      applicationDeadline: item.applicationDeadline
        ? new Date(item.applicationDeadline).toISOString().split("T")[0]
        : "",
      minCGPA: item.minCGPA || 6.5,
      status: item.status || "upcoming",
      selectionProcess: item.selectionProcess || ""
    });
    setShowDriveModal(true);
  };

  const handleSaveDrive = async (e) => {
    e.preventDefault();
    if (!driveForm.companyName.trim() || !driveForm.jobRole.trim() || !driveForm.driveDate) {
      alert("Please provide the company name, job role, and drive date.");
      return;
    }

    setDriveSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await authApi.createPlacement(driveForm);
        if (res && res.success) {
          setActionSuccess("Corporate recruitment drive scheduled successfully!");
          setShowDriveModal(false);
          loadPlacementData(true);
        } else {
          throw new Error(res?.message || "Failed to schedule placement drive.");
        }
      } else {
        const res = await authApi.updatePlacement(editingId, driveForm);
        if (res && res.success) {
          setActionSuccess("Recruitment drive terms & details updated.");
          setShowDriveModal(false);
          loadPlacementData(true);
        } else {
          throw new Error(res?.message || "Failed to update placement drive.");
        }
      }
    } catch (err) {
      alert(err.message || "Error saving drive.");
    } finally {
      setDriveSubmitting(false);
    }
  };

  const handleDeleteDrive = async (id) => {
    setDeleting(true);
    try {
      const res = await authApi.deletePlacement(id);
      if (res && res.success) {
        setActionSuccess("Placement drive record removed.");
        setDeleteId(null);
        loadPlacementData(true);
      } else {
        throw new Error(res?.message || "Failed to delete placement drive.");
      }
    } catch (err) {
      alert(err.message || "Error deleting placement drive.");
    } finally {
      setDeleting(false);
    }
  };

  // Add Placed Student to Drive
  const handleAddPlacedStudent = async (e) => {
    e.preventDefault();
    if (!newStudentForm.studentName.trim() || !newStudentForm.rollNumber.trim()) {
      alert("Please provide student name and roll number.");
      return;
    }

    setStudentAdding(true);
    try {
      const currentPlaced = selectedDriveForStudents.placedStudents || [];
      const updatedPlaced = [
        ...currentPlaced,
        {
          studentName: newStudentForm.studentName.trim(),
          rollNumber: newStudentForm.rollNumber.trim(),
          packageOffered: Number(newStudentForm.packageOffered) || selectedDriveForStudents.packageLPA,
          offerLetterVerified: Boolean(newStudentForm.offerLetterVerified),
          placedDate: new Date()
        }
      ];

      const res = await authApi.updatePlacement(
        selectedDriveForStudents.id || selectedDriveForStudents._id,
        {
          placedStudents: updatedPlaced,
          status: "completed"
        }
      );

      if (res && res.success) {
        setActionSuccess("Student placement selection recorded & verified!");
        setSelectedDriveForStudents({
          ...selectedDriveForStudents,
          placedStudents: updatedPlaced
        });
        setNewStudentForm({
          studentName: "",
          rollNumber: "",
          packageOffered: selectedDriveForStudents.packageLPA,
          offerLetterVerified: true
        });
        loadPlacementData(true);
      } else {
        throw new Error(res?.message || "Failed to record placed student.");
      }
    } catch (err) {
      alert(err.message || "Error recording placed student.");
    } finally {
      setStudentAdding(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredDrives.length === 0) {
      alert("No placement records to export.");
      return;
    }

    const headers = [
      "Company Name",
      "Job Role",
      "Type",
      "Batch",
      "Package (LPA)",
      "Location",
      "Drive Date",
      "Min CGPA",
      "Status",
      "Placed Count"
    ];

    const rows = filteredDrives.map((d) => [
      `"${d.companyName.replace(/"/g, '""')}"`,
      `"${d.jobRole.replace(/"/g, '""')}"`,
      `"${d.type}"`,
      `"${d.academicBatch}"`,
      d.packageLPA,
      `"${(d.companyLocation || "").replace(/"/g, '""')}"`,
      `"${new Date(d.driveDate).toLocaleDateString()}"`,
      d.minCGPA,
      d.status,
      (d.placedStudents || []).length
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HOD_Placements_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="hod-place-page">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="hod-place-toast-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="toast-close-btn">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <header className="hod-place-header-card">
        <div className="hod-place-header-left">
          <div className="hod-place-title-badge">
            <span className="hod-badge-pulse" />
            <Briefcase size={14} className="hod-badge-icon" />
            <span>Corporate Relations & Career Placement Authority</span>
          </div>
          <h1 className="hod-place-page-title">Placements & Internships Command</h1>
          <p className="hod-place-page-subtitle">
            Oversee on-campus recruitment drives, monitor offer letters, audit department package
            analytics, and track summer industry internships.
          </p>
        </div>

        <div className="hod-place-header-actions">
          <button
            onClick={() => loadPlacementData(true)}
            disabled={loading || refreshing}
            className="hod-place-btn-ghost"
            title="Sync drives"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="hod-place-btn-secondary"
            title="Export placement data to CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="hod-place-btn-secondary"
            title="Print recruitment report"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="hod-place-btn-primary"
            title="Register new recruitment drive"
          >
            <Plus size={16} />
            <span>Schedule Drive</span>
          </button>
        </div>
      </header>

      {/* KPI Metrics Strip */}
      <section className="hod-place-kpi-grid">
        {/* KPI 1 */}
        <div className="hod-place-kpi-card">
          <div className="kpi-icon-wrapper kpi-indigo">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Placed Students Total</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.totalPlacedCount || 0}</span>
              <span className="kpi-tag-sub">Offers Logged</span>
            </div>
            <div className="kpi-footer-metric">
              <Sparkles size={12} />
              <span>Verified with T&P Cell</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="hod-place-kpi-card">
          <div className="kpi-icon-wrapper kpi-teal">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Highest Package</span>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{stats.highestPackageLPA || 7.2}</span>
              <span className="kpi-tag-sub">LPA CTC</span>
            </div>
            <div className="kpi-footer-metric">
              <Building size={12} />
              <span>Tier 1 MNC Offer</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="hod-place-kpi-card">
          <div className="kpi-icon-wrapper kpi-emerald">
            <Award size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Average Package</span>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{stats.avgPackageLPA || 5.8}</span>
              <span className="kpi-rate-badge">LPA CTC</span>
            </div>
            <div className="kpi-footer-metric">
              <CheckCircle2 size={12} />
              <span>Department Mean</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="hod-place-kpi-card">
          <div className="kpi-icon-wrapper kpi-amber">
            <Building size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Corporate Drives</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{drives.length}</span>
              <span className="kpi-tag-sub">Drives</span>
            </div>
            <div className="kpi-footer-metric">
              <Clock size={12} />
              <span>{stats.upcomingDrivesCount || 0} Upcoming Sessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="hod-place-main-container">
        {/* Batch Selection Tabs */}
        <div className="hod-place-tabs-bar">
          <div className="tabs-scroll-area">
            {BATCHES.map((batch) => {
              const count =
                batch === "ALL"
                  ? drives.length
                  : drives.filter((d) => d.academicBatch === batch).length;
              const isActive = selectedBatch === batch;

              return (
                <button
                  key={batch}
                  onClick={() => setSelectedBatch(batch)}
                  className={`hod-sem-tab ${isActive ? "active" : ""}`}
                >
                  <Briefcase size={14} />
                  <span>{batch === "ALL" ? "All Batches" : `Batch ${batch}`}</span>
                  <span className="tab-counter-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="hod-place-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by company name, job role, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="toolbar-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="search-clear-btn">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-filters-group">
            {/* Type Selector */}
            <div className="toolbar-select-wrapper">
              <Filter size={14} className="select-icon" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="toolbar-select"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All Types" : t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="toolbar-select-wrapper">
              <Sliders size={14} className="select-icon" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="toolbar-select"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === "ALL" ? "All Statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View Switcher */}
            <div className="toolbar-view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                title="Table View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="hod-place-loading-state">
            <div className="place-spinner" />
            <p>Loading placement drives and verified student selections...</p>
          </div>
        ) : error ? (
          <div className="hod-place-error-state">
            <AlertCircle size={36} className="text-red" />
            <h3>Unable to load placement records</h3>
            <p>{error}</p>
            <button onClick={() => loadPlacementData(true)} className="hod-place-btn-primary">
              <RefreshCw size={15} />
              <span>Retry Load</span>
            </button>
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="hod-place-empty-state">
            <Briefcase size={48} className="empty-icon" />
            <h3>No recruitment drives found</h3>
            <p>No drives match the current batch, drive type, or search query.</p>
            <button onClick={handleOpenCreateModal} className="hod-place-btn-primary">
              <Plus size={16} />
              <span>Schedule Recruitment Drive</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="hod-place-grid">
            {filteredDrives.map((d) => {
              const placedCount = (d.placedStudents || []).length;
              const isPlacement = d.type === "Placement";
              const dateStr = d.driveDate
                ? new Date(d.driveDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "TBD";

              return (
                <div key={d.id || d._id} className="place-card animate-card">
                  <div className="place-card-top">
                    <span className="place-type-badge">{d.type}</span>
                    <span className={`place-status-pill status-${d.status}`}>{d.status}</span>
                  </div>

                  <div className="place-company-row">
                    <div className="company-avatar-box">
                      {d.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="company-name">{d.companyName}</h3>
                      <span className="job-role-text">{d.jobRole}</span>
                    </div>
                  </div>

                  {/* CTC Package Banner */}
                  <div className="package-banner-box">
                    <span className="package-label">Offered CTC / Stipend</span>
                    <span className="package-val">
                      ₹{d.packageLPA} {isPlacement ? "LPA" : "/ Month"}
                    </span>
                  </div>

                  <div className="place-info-grid">
                    <div className="info-cell">
                      <Calendar size={13} className="info-icon" />
                      <span>Drive: {dateStr}</span>
                    </div>
                    <div className="info-cell">
                      <MapPin size={13} className="info-icon" />
                      <span>{d.companyLocation || "NCR"}</span>
                    </div>
                    <div className="info-cell">
                      <Award size={13} className="info-icon" />
                      <span>Min CGPA: {d.minCGPA || 6.0}</span>
                    </div>
                    <div className="info-cell">
                      <Users size={13} className="info-icon" />
                      <span>Batch: {d.academicBatch}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="place-card-footer">
                    <button
                      onClick={() => {
                        setSelectedDriveForStudents(d);
                        setShowStudentsModal(true);
                      }}
                      className="audit-selections-btn"
                    >
                      <Eye size={13} />
                      <span>Selected Candidates ({placedCount})</span>
                      <ChevronRight size={13} />
                    </button>
                    <div className="card-right-icons">
                      <button
                        onClick={() => handleOpenEditModal(d)}
                        className="card-icon-btn"
                        title="Edit drive terms"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(d.id || d._id)}
                        className="card-icon-btn delete"
                        title="Remove drive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="hod-place-table-wrapper">
            <table className="hod-place-table">
              <thead>
                <tr>
                  <th>Company & Role</th>
                  <th>Type</th>
                  <th>Batch</th>
                  <th>Package CTC</th>
                  <th>Location</th>
                  <th>Drive Date</th>
                  <th>Eligible CGPA</th>
                  <th>Selected Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrives.map((d) => {
                  const placedCount = (d.placedStudents || []).length;
                  const dateStr = d.driveDate
                    ? new Date(d.driveDate).toLocaleDateString()
                    : "TBD";

                  return (
                    <tr key={d.id || d._id}>
                      <td>
                        <div className="table-company-cell">
                          <span className="comp-name">{d.companyName}</span>
                          <span className="role-sub">{d.jobRole}</span>
                        </div>
                      </td>
                      <td>
                        <span className="place-type-badge">{d.type}</span>
                      </td>
                      <td>{d.academicBatch}</td>
                      <td>
                        <strong className="text-emerald">₹{d.packageLPA} LPA</strong>
                      </td>
                      <td>{d.companyLocation}</td>
                      <td>{dateStr}</td>
                      <td>{d.minCGPA}</td>
                      <td>
                        <span className="placed-count-pill">{placedCount} Offers</span>
                      </td>
                      <td>
                        <span className={`place-status-pill status-${d.status}`}>{d.status}</span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <button
                            onClick={() => {
                              setSelectedDriveForStudents(d);
                              setShowStudentsModal(true);
                            }}
                            className="table-action-btn view-btn"
                            title="View / record selections"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className="table-action-btn edit-btn"
                            title="Edit drive"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(d.id || d._id)}
                            className="table-action-btn delete-btn"
                            title="Delete drive"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- MODAL 1: Create / Edit Recruitment Drive Modal --- */}
      {showDriveModal && (
        <div className="hod-place-modal-backdrop" onClick={() => setShowDriveModal(false)}>
          <div
            className="hod-place-modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Briefcase size={13} />
                  <span>Corporate Drive Registration</span>
                </div>
                <h3 className="modal-title">
                  {modalMode === "create" ? "Schedule Recruitment Drive" : "Update Drive Terms"}
                </h3>
              </div>
              <button onClick={() => setShowDriveModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDrive} className="place-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Company / Organization <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Consultancy Services (TCS)"
                    value={driveForm.companyName}
                    onChange={(e) =>
                      setDriveForm({ ...driveForm, companyName: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Designation / Job Role <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graduate Trainee Engineer (Software)"
                    value={driveForm.jobRole}
                    onChange={(e) => setDriveForm({ ...driveForm, jobRole: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Drive Type</label>
                  <select
                    value={driveForm.type}
                    onChange={(e) => setDriveForm({ ...driveForm, type: e.target.value })}
                    className="form-input"
                  >
                    <option value="Placement">Full-Time Placement</option>
                    <option value="Internship">Summer Internship</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Batch</label>
                  <select
                    value={driveForm.academicBatch}
                    onChange={(e) =>
                      setDriveForm({ ...driveForm, academicBatch: e.target.value })
                    }
                    className="form-input"
                  >
                    {BATCHES.filter((b) => b !== "ALL").map((b) => (
                      <option key={b} value={b}>
                        Batch {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Package (CTC in LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={driveForm.packageLPA}
                    onChange={(e) =>
                      setDriveForm({ ...driveForm, packageLPA: Number(e.target.value) })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">
                    Drive Date <span className="text-red">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={driveForm.driveDate}
                    onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    value={driveForm.applicationDeadline}
                    onChange={(e) =>
                      setDriveForm({ ...driveForm, applicationDeadline: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Cutoff CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="4"
                    max="10"
                    value={driveForm.minCGPA}
                    onChange={(e) =>
                      setDriveForm({ ...driveForm, minCGPA: Number(e.target.value) })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Job Postings</label>
                <input
                  type="text"
                  placeholder="e.g. Noida / Gurugram (NCR) / Remote"
                  value={driveForm.companyLocation}
                  onChange={(e) =>
                    setDriveForm({ ...driveForm, companyLocation: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Selection Process & Rounds</label>
                <textarea
                  rows={3}
                  placeholder="Outline round details: Online Aptitude, Coding assessment, Group Discussion, Technical Interview, HR..."
                  value={driveForm.selectionProcess}
                  onChange={(e) =>
                    setDriveForm({ ...driveForm, selectionProcess: e.target.value })
                  }
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="hod-place-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={driveSubmitting}
                  className="hod-place-btn-primary"
                >
                  {driveSubmitting ? "Publishing Drive..." : "Publish Drive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Candidate Selections Audit Drawer / Modal --- */}
      {showStudentsModal && selectedDriveForStudents && (
        <div className="hod-place-modal-backdrop" onClick={() => setShowStudentsModal(false)}>
          <div
            className="hod-place-modal-content max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <CheckCircle2 size={13} />
                  <span>Verified Selections & Offer Letters</span>
                </div>
                <h3 className="modal-title">
                  {selectedDriveForStudents.companyName} — Selected Candidates
                </h3>
                <p className="modal-subtitle">
                  Job Role: {selectedDriveForStudents.jobRole} • Package: ₹
                  {selectedDriveForStudents.packageLPA} LPA
                </p>
              </div>
              <button onClick={() => setShowStudentsModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            {/* Quick Record Selection Form */}
            <form onSubmit={handleAddPlacedStudent} className="record-selection-strip">
              <h4 className="strip-title">Record New Selected Candidate:</h4>
              <div className="strip-inputs">
                <input
                  type="text"
                  required
                  placeholder="Student Full Name"
                  value={newStudentForm.studentName}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, studentName: e.target.value })
                  }
                  className="strip-input"
                />
                <input
                  type="text"
                  required
                  placeholder="Roll / Enrollment No"
                  value={newStudentForm.rollNumber}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, rollNumber: e.target.value })
                  }
                  className="strip-input"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Package (LPA)"
                  value={newStudentForm.packageOffered}
                  onChange={(e) =>
                    setNewStudentForm({
                      ...newStudentForm,
                      packageOffered: Number(e.target.value)
                    })
                  }
                  className="strip-input package-input"
                />
                <button
                  type="submit"
                  disabled={studentAdding}
                  className="hod-place-btn-primary strip-btn"
                >
                  <Plus size={15} />
                  <span>{studentAdding ? "Saving..." : "Record Offer"}</span>
                </button>
              </div>
            </form>

            {/* Placed Students List */}
            <div className="modal-students-scroll">
              {(selectedDriveForStudents.placedStudents || []).length === 0 ? (
                <div className="empty-students-notice">
                  <AlertCircle size={32} />
                  <p>No student placement selections recorded for this drive yet.</p>
                </div>
              ) : (
                <div className="students-cards-list">
                  {selectedDriveForStudents.placedStudents.map((s, idx) => (
                    <div key={idx} className="placed-student-card">
                      <div className="student-card-left">
                        <div className="student-avatar-box">
                          {s.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h4 className="student-name">{s.studentName}</h4>
                          <span className="student-roll">Roll No: {s.rollNumber}</span>
                        </div>
                      </div>

                      <div className="student-card-right">
                        <div className="package-tag">
                          ₹{s.packageOffered || selectedDriveForStudents.packageLPA} LPA
                        </div>
                        <span className="verified-pill">
                          <CheckCircle2 size={13} />
                          Offer Letter Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="students-summary-text">
                Total Placed Candidates:{" "}
                <strong>{(selectedDriveForStudents.placedStudents || []).length}</strong>
              </span>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="hod-place-btn-primary"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {deleteId && (
        <div className="hod-place-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div
            className="hod-place-modal-content max-w-md confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box">
              <AlertTriangle size={28} className="text-red" />
            </div>
            <h3 className="confirm-title">Remove Recruitment Drive?</h3>
            <p className="confirm-text">
              Are you sure you want to cancel and remove this corporate recruitment drive? All
              candidate offers and application histories associated will be removed.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="hod-place-btn-ghost"
              >
                Keep Drive
              </button>
              <button
                onClick={() => handleDeleteDrive(deleteId)}
                disabled={deleting}
                className="hod-place-btn-danger"
              >
                {deleting ? "Deleting..." : "Delete Drive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
