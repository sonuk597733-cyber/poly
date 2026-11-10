import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
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
  TrendingUp,
  X,
  Check,
  Building,
  ShieldCheck,
  ChevronRight,
  Sliders,
  ExternalLink,
  Award,
  Video,
  Presentation
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODEvents.css";

const EVENT_CATEGORIES = [
  "ALL",
  "Technical Workshop",
  "Academic",
  "Faculty Development",
  "Sports & Fitness",
  "Cultural",
  "Examination"
];

const TIME_FILTERS = ["ALL", "UPCOMING", "COMPLETED"];

export default function HODEvents() {
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [events, setEvents] = useState([]);
  const [departmentBranch, setDepartmentBranch] = useState("CSE");

  // Filters
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Modal State (Create / Edit)
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Technical Workshop",
    startDate: "",
    endDate: "",
    location: "Central Computing Lab & AI Hub",
    coordinatorFaculty: "Dr. Sunita Deshpande",
    maxParticipants: 120,
    registeredStudentsCount: 0,
    approvalStatus: "approved"
  });

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Load Events ---
  const loadEventsData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await authApi.getDepartmentEvents({
          category: selectedCategory !== "ALL" ? selectedCategory : undefined,
          timeFilter: timeFilter !== "ALL" ? timeFilter : undefined
        });

        if (res && res.success) {
          setEvents(res.events || []);
          setDepartmentBranch(res.branch || "CSE");
        } else {
          throw new Error(res?.message || "Failed to load department events.");
        }
      } catch (err) {
        console.error("HODEvents load error:", err);
        setError(err.message || "Failed to load department activities.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, timeFilter]
  );

  useEffect(() => {
    loadEventsData();
  }, [loadEventsData]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // Metrics
  const stats = useMemo(() => {
    const now = new Date();
    const total = events.length;
    const upcoming = events.filter((e) => new Date(e.endDate || e.startDate) >= now).length;
    const completed = events.filter((e) => new Date(e.endDate || e.startDate) < now).length;
    const totalRegistrations = events.reduce(
      (acc, e) => acc + (e.registeredStudentsCount || 0),
      0
    );

    return { total, upcoming, completed, totalRegistrations };
  }, [events]);

  // Filtered List
  const filteredEvents = useMemo(() => {
    let list = [...events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.coordinatorFaculty && e.coordinatorFaculty.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [events, searchQuery]);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    const now = Date.now();
    setFormData({
      title: "",
      description: "",
      category: selectedCategory !== "ALL" ? selectedCategory : "Technical Workshop",
      startDate: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      endDate: new Date(now + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      location: "Central Computing Lab & AI Hub",
      coordinatorFaculty: "Dr. Sunita Deshpande",
      maxParticipants: 120,
      registeredStudentsCount: 0,
      approvalStatus: "approved"
    });
    setShowEventModal(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setEditingId(item.id || item._id);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Technical Workshop",
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "",
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "",
      location: item.location || "",
      coordinatorFaculty: item.coordinatorFaculty || "",
      maxParticipants: item.maxParticipants || 120,
      registeredStudentsCount: item.registeredStudentsCount || 0,
      approvalStatus: item.approvalStatus || "approved"
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startDate || !formData.endDate) {
      alert("Please provide the event title and start/end dates.");
      return;
    }

    setEventSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await authApi.createDepartmentEvent({
          ...formData,
          branch: departmentBranch
        });
        if (res && res.success) {
          setActionSuccess("Department event initiative registered & published!");
          setShowEventModal(false);
          loadEventsData(true);
        } else {
          throw new Error(res?.message || "Failed to create event.");
        }
      } else {
        const res = await authApi.updateDepartmentEvent(editingId, formData);
        if (res && res.success) {
          setActionSuccess("Department event details updated successfully.");
          setShowEventModal(false);
          loadEventsData(true);
        } else {
          throw new Error(res?.message || "Failed to update event.");
        }
      }
    } catch (err) {
      alert(err.message || "Error saving event.");
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    setDeleting(true);
    try {
      const res = await authApi.deleteDepartmentEvent(id);
      if (res && res.success) {
        setActionSuccess("Event removed from academic calendar.");
        setDeleteId(null);
        loadEventsData(true);
      } else {
        throw new Error(res?.message || "Failed to delete event.");
      }
    } catch (err) {
      alert(err.message || "Error deleting event.");
    } finally {
      setDeleting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      alert("No events to export.");
      return;
    }

    const headers = [
      "Event Title",
      "Category",
      "Start Date",
      "End Date",
      "Location / Venue",
      "Faculty Coordinator",
      "Registered Count",
      "Capacity",
      "Status"
    ];

    const rows = filteredEvents.map((e) => [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${new Date(e.startDate).toLocaleString()}"`,
      `"${new Date(e.endDate).toLocaleString()}"`,
      `"${(e.location || "").replace(/"/g, '""')}"`,
      `"${(e.coordinatorFaculty || "").replace(/"/g, '""')}"`,
      e.registeredStudentsCount || 0,
      e.maxParticipants || 100,
      e.approvalStatus || "approved"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HOD_Events_Calendar_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="hod-events-page">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="hod-event-toast-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="toast-close-btn">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <header className="hod-event-header-card">
        <div className="hod-event-header-left">
          <div className="hod-event-title-badge">
            <span className="hod-badge-pulse" />
            <Sparkles size={14} className="hod-badge-icon" />
            <span>Academic Enrichment & Co-Curricular Command</span>
          </div>
          <h1 className="hod-event-page-title">Department Events & Symposia</h1>
          <p className="hod-event-page-subtitle">
            Orchestrate technical hackathons, guest lectures, national seminars, and faculty
            development bootcamps for the {departmentBranch} department.
          </p>
        </div>

        <div className="hod-event-header-actions">
          <button
            onClick={() => loadEventsData(true)}
            disabled={loading || refreshing}
            className="hod-event-btn-ghost"
            title="Sync events calendar"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="hod-event-btn-secondary"
            title="Export events calendar to CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="hod-event-btn-secondary"
            title="Print activities schedule"
          >
            <Printer size={16} />
            <span>Print Schedule</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="hod-event-btn-primary"
            title="Create department event"
          >
            <Plus size={16} />
            <span>Create Event</span>
          </button>
        </div>
      </header>

      {/* KPI Metrics Strip */}
      <section className="hod-event-kpi-grid">
        {/* KPI 1 */}
        <div className="hod-event-kpi-card">
          <div className="kpi-icon-wrapper kpi-indigo">
            <Calendar size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Department Events</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.total}</span>
              <span className="kpi-tag-sub">Initiatives</span>
            </div>
            <div className="kpi-footer-metric">
              <Award size={12} />
              <span>Full Academic Year</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="hod-event-kpi-card">
          <div className="kpi-icon-wrapper kpi-teal">
            <Sparkles size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Upcoming Symposia</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.upcoming}</span>
              <span className="kpi-tag-sub">Active Sessions</span>
            </div>
            <div className="kpi-footer-metric">
              <Clock size={12} />
              <span>In Next 30 Days</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="hod-event-kpi-card">
          <div className="kpi-icon-wrapper kpi-emerald">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Registrations</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.totalRegistrations}</span>
              <span className="kpi-rate-badge">High Engagement</span>
            </div>
            <div className="kpi-footer-metric">
              <User size={12} />
              <span>Students & Faculty Members</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="hod-event-kpi-card">
          <div className="kpi-icon-wrapper kpi-amber">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed & Executed</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.completed}</span>
              <span className="kpi-tag-sub">Concluded</span>
            </div>
            <div className="kpi-footer-metric">
              <ShieldCheck size={12} />
              <span>Archived in ERP Registry</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Events Container */}
      <section className="hod-event-main-container">
        {/* Time Tabs */}
        <div className="hod-event-tabs-bar">
          <div className="tabs-scroll-area">
            {TIME_FILTERS.map((tf) => {
              const now = new Date();
              const count =
                tf === "ALL"
                  ? events.length
                  : tf === "UPCOMING"
                  ? events.filter((e) => new Date(e.endDate || e.startDate) >= now).length
                  : events.filter((e) => new Date(e.endDate || e.startDate) < now).length;
              const isActive = timeFilter === tf;

              return (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`hod-sem-tab ${isActive ? "active" : ""}`}
                >
                  <span>
                    {tf === "ALL"
                      ? "All Activities"
                      : tf === "UPCOMING"
                      ? "Upcoming & Active"
                      : "Completed & Past"}
                  </span>
                  <span className="tab-counter-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="hod-event-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by event title, coordinator or venue..."
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
            {/* Category Dropdown */}
            <div className="toolbar-select-wrapper">
              <Filter size={14} className="select-icon" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="toolbar-select"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat}
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
          <div className="hod-event-loading-state">
            <div className="event-spinner" />
            <p>Loading department activities and registration rosters...</p>
          </div>
        ) : error ? (
          <div className="hod-event-error-state">
            <AlertCircle size={36} className="text-red" />
            <h3>Unable to load events</h3>
            <p>{error}</p>
            <button onClick={() => loadEventsData(true)} className="hod-event-btn-primary">
              <RefreshCw size={15} />
              <span>Retry Load</span>
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="hod-event-empty-state">
            <Sparkles size={48} className="empty-icon" />
            <h3>No events found for this filter</h3>
            <p>Try switching between Upcoming or Completed filters, or create a new event.</p>
            <button onClick={handleOpenCreateModal} className="hod-event-btn-primary">
              <Plus size={16} />
              <span>Create Event</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="hod-event-grid">
            {filteredEvents.map((e) => {
              const reg = e.registeredStudentsCount || 0;
              const cap = e.maxParticipants || 120;
              const pct = cap > 0 ? Math.round((reg / cap) * 100) : 100;
              const isPast = new Date(e.endDate || e.startDate) < new Date();
              const startStr = e.startDate
                ? new Date(e.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "TBD";

              return (
                <div key={e.id || e._id} className="event-card animate-card">
                  <div className="event-card-top">
                    <span className="event-category-badge">{e.category}</span>
                    <span
                      className={`event-status-pill ${
                        isPast ? "status-concluded" : "status-upcoming"
                      }`}
                    >
                      {isPast ? "Concluded" : "Upcoming"}
                    </span>
                  </div>

                  <h3 className="event-card-title">{e.title}</h3>

                  <p className="event-card-desc">
                    {e.description || "Comprehensive department academic event session."}
                  </p>

                  <div className="event-info-strip">
                    <div className="event-info-item">
                      <Calendar size={13} className="info-icon" />
                      <span>{startStr}</span>
                    </div>
                    <div className="event-info-item">
                      <MapPin size={13} className="info-icon" />
                      <span>{e.location || "Main Auditorium"}</span>
                    </div>
                    <div className="event-info-item">
                      <User size={13} className="info-icon" />
                      <span>Coord: {e.coordinatorFaculty || "Department Faculty"}</span>
                    </div>
                  </div>

                  {/* Registration Capacity Meter */}
                  <div className="event-progress-container">
                    <div className="progress-labels">
                      <span>
                        Capacity: <strong>{reg}</strong> / {cap} Seats
                      </span>
                      <span className="text-pct">{pct}% Filled</span>
                    </div>
                    <div className="event-track">
                      <div
                        className="event-fill"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            pct > 80 ? "var(--hod-emerald-500, #10b981)" : "var(--hod-indigo-500, #6366f1)"
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="event-card-footer">
                    <button
                      onClick={() => handleOpenEditModal(e)}
                      className="edit-event-btn"
                    >
                      <Edit3 size={13} />
                      <span>Modify Schedule</span>
                    </button>
                    <button
                      onClick={() => setDeleteId(e.id || e._id)}
                      className="event-delete-btn"
                      title="Cancel event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="hod-event-table-wrapper">
            <table className="hod-event-table">
              <thead>
                <tr>
                  <th>Event Title & Agenda</th>
                  <th>Category</th>
                  <th>Date & Timing</th>
                  <th>Venue / Location</th>
                  <th>Faculty Coordinator</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => {
                  const reg = e.registeredStudentsCount || 0;
                  const cap = e.maxParticipants || 120;
                  const isPast = new Date(e.endDate || e.startDate) < new Date();
                  const startStr = e.startDate
                    ? new Date(e.startDate).toLocaleDateString()
                    : "TBD";

                  return (
                    <tr key={e.id || e._id}>
                      <td className="table-title-cell">
                        <span className="event-table-title">{e.title}</span>
                      </td>
                      <td>
                        <span className="event-category-badge">{e.category}</span>
                      </td>
                      <td>
                        <div className="table-date-cell">{startStr}</div>
                      </td>
                      <td>
                        <span className="location-pill">
                          <MapPin size={12} />
                          {e.location}
                        </span>
                      </td>
                      <td>{e.coordinatorFaculty || "Department Faculty"}</td>
                      <td>
                        <span className="reg-badge">
                          {reg} / {cap}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`event-status-pill ${
                            isPast ? "status-concluded" : "status-upcoming"
                          }`}
                        >
                          {isPast ? "Concluded" : "Upcoming"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <button
                            onClick={() => handleOpenEditModal(e)}
                            className="table-action-btn edit-btn"
                            title="Edit event"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(e.id || e._id)}
                            className="table-action-btn delete-btn"
                            title="Delete event"
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

      {/* --- MODAL 1: Create / Edit Event Modal --- */}
      {showEventModal && (
        <div className="hod-event-modal-backdrop" onClick={() => setShowEventModal(false)}>
          <div
            className="hod-event-modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Sparkles size={13} />
                  <span>Curriculum Enrichment</span>
                </div>
                <h3 className="modal-title">
                  {modalMode === "create" ? "Plan Department Activity" : "Edit Event Details"}
                </h3>
              </div>
              <button onClick={() => setShowEventModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="event-form">
              <div className="form-group">
                <label className="form-label">
                  Event Title <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polytechnic AI & IoT Smart Campus Hackathon"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Event Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                  >
                    {EVENT_CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Hall Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Central Computing Lab & AI Hub"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Start Date & Time <span className="text-red">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    End Date & Time <span className="text-red">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Faculty Coordinator</label>
                  <input
                    type="text"
                    placeholder="Dr. Sunita Deshpande"
                    value={formData.coordinatorFaculty}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinatorFaculty: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Participant Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({ ...formData, maxParticipants: Number(e.target.value) })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Activity Description & Learning Outcomes</label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered, guest speakers, prerequisites, and student deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="hod-event-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="hod-event-btn-primary"
                >
                  {eventSubmitting ? "Publishing Event..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {deleteId && (
        <div className="hod-event-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div
            className="hod-event-modal-content max-w-md confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box">
              <AlertTriangle size={28} className="text-red" />
            </div>
            <h3 className="confirm-title">Remove Event Activity?</h3>
            <p className="confirm-text">
              Are you sure you want to cancel and remove this activity? All associated student
              registrations and attendee records will be cancelled.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="hod-event-btn-ghost"
              >
                Keep Event
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteId)}
                disabled={deleting}
                className="hod-event-btn-danger"
              >
                {deleting ? "Removing..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
