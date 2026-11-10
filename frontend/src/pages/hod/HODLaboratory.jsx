import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Cpu,
  Layers,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  User,
  Users,
  Download,
  Printer,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart2,
  TrendingUp,
  Sparkles,
  X,
  Check,
  Building,
  ShieldCheck,
  ChevronRight,
  Sliders,
  FileText,
  Activity,
  Server,
  Monitor,
  Wifi,
  Package
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODLaboratory.css";

const CATEGORIES = ["ALL", "Computing Workstation", "Networking & Security", "Server & Storage", "IoT & Embedded", "Power & Electronics"];
const STATUS_OPTIONS = ["ALL", "operational", "maintenance", "damaged", "decommissioned"];

export default function HODLaboratory() {
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [equipmentList, setEquipmentList] = useState([]);
  const [stats, setStats] = useState({
    totalLabs: 4,
    totalAssets: 0,
    totalEquipmentCount: 0,
    operationalCount: 0,
    maintenanceCount: 0,
    damagedCount: 0,
    operationalRate: 100,
    labsList: []
  });

  // Filter & Search Controls
  const [selectedLab, setSelectedLab] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | table

  // Add / Edit Equipment Modal
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [equipSubmitting, setEquipSubmitting] = useState(false);
  const [equipForm, setEquipForm] = useState({
    equipmentName: "",
    assetTag: "",
    category: "Computing Workstation",
    labName: "Computing & Artificial Intelligence Lab",
    roomNumber: "Room 301",
    quantity: 1,
    status: "operational",
    workingCondition: "Good",
    specifications: "",
    labAssistantInCharge: "Er. Rahul Verma",
    purchaseDate: "",
    warrantyExpiry: ""
  });

  // Maintenance Ticket Modal
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintItem, setMaintItem] = useState(null);
  const [maintSubmitting, setMaintSubmitting] = useState(false);
  const [maintForm, setMaintForm] = useState({
    status: "maintenance",
    issueDescription: "",
    technicianAssigned: "Subharti Hardware Maintenance Cell",
    repairCost: 0,
    resolutionDate: ""
  });

  // Lab Schedule / Utilization Drawer
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);
  const [activeScheduleLab, setActiveScheduleLab] = useState(null);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Fetch Data ---
  const loadLaboratoryData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [equipRes, statsRes] = await Promise.all([
        authApi.getLabEquipment({}),
        authApi.getLabStats()
      ]);

      if (equipRes && equipRes.success) {
        setEquipmentList(equipRes.equipment || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats || {});
      }
    } catch (err) {
      console.error("HODLaboratory load error:", err);
      setError(err.message || "Failed to load laboratory inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLaboratoryData();
  }, [loadLaboratoryData]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // Dynamic Labs List from data
  const availableLabs = useMemo(() => {
    const defaultLabs = [
      "Computing & Artificial Intelligence Lab",
      "Network Security & Cyber Forensics Lab",
      "Embedded Systems & IoT Workshop",
      "Advanced Software Engineering Lab"
    ];
    const fromData = Array.from(new Set(equipmentList.map((e) => e.labName).filter(Boolean)));
    const merged = Array.from(new Set([...defaultLabs, ...fromData]));
    return ["ALL", ...merged];
  }, [equipmentList]);

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    let list = [...equipmentList];

    if (selectedLab !== "ALL") {
      list = list.filter((e) => e.labName === selectedLab);
    }
    if (selectedCategory !== "ALL") {
      list = list.filter((e) => e.category === selectedCategory);
    }
    if (selectedStatus !== "ALL") {
      list = list.filter((e) => e.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.equipmentName && e.equipmentName.toLowerCase().includes(q)) ||
          (e.assetTag && e.assetTag.toLowerCase().includes(q)) ||
          (e.roomNumber && e.roomNumber.toLowerCase().includes(q)) ||
          (e.labName && e.labName.toLowerCase().includes(q)) ||
          (e.labAssistantInCharge && e.labAssistantInCharge.toLowerCase().includes(q))
      );
    }

    return list;
  }, [equipmentList, selectedLab, selectedCategory, selectedStatus, searchQuery]);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setEquipForm({
      equipmentName: "",
      assetTag: `CSE-LAB-${Math.floor(100 + Math.random() * 900)}`,
      category: selectedCategory !== "ALL" ? selectedCategory : "Computing Workstation",
      labName:
        selectedLab !== "ALL"
          ? selectedLab
          : "Computing & Artificial Intelligence Lab",
      roomNumber: "Room 301",
      quantity: 1,
      status: "operational",
      workingCondition: "Good",
      specifications: "Intel Core i7 13th Gen, 32GB RAM, 1TB NVMe SSD",
      labAssistantInCharge: "Er. Rahul Verma",
      purchaseDate: new Date().toISOString().split("T")[0],
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    });
    setShowEquipModal(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setEditingId(item.id || item._id);
    setEquipForm({
      equipmentName: item.equipmentName || "",
      assetTag: item.assetTag || "",
      category: item.category || "Computing Workstation",
      labName: item.labName || "Computing & Artificial Intelligence Lab",
      roomNumber: item.roomNumber || "Room 301",
      quantity: item.quantity || 1,
      status: item.status || "operational",
      workingCondition: item.workingCondition || "Good",
      specifications: item.specifications || "",
      labAssistantInCharge: item.labAssistantInCharge || "",
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split("T")[0]
        : "",
      warrantyExpiry: item.warrantyExpiry
        ? new Date(item.warrantyExpiry).toISOString().split("T")[0]
        : ""
    });
    setShowEquipModal(true);
  };

  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    if (!equipForm.equipmentName.trim() || !equipForm.assetTag.trim()) {
      alert("Please provide the equipment name and unique asset tag.");
      return;
    }

    setEquipSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await authApi.createLabEquipment(equipForm);
        if (res && res.success) {
          setActionSuccess("Laboratory asset registered into departmental inventory!");
          setShowEquipModal(false);
          loadLaboratoryData(true);
        } else {
          throw new Error(res?.message || "Failed to register equipment.");
        }
      } else {
        const res = await authApi.updateLabEquipment(editingId, equipForm);
        if (res && res.success) {
          setActionSuccess("Equipment asset specifications updated.");
          setShowEquipModal(false);
          loadLaboratoryData(true);
        } else {
          throw new Error(res?.message || "Failed to update equipment.");
        }
      }
    } catch (err) {
      alert(err.message || "Error saving equipment asset.");
    } finally {
      setEquipSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id) => {
    setDeleting(true);
    try {
      const res = await authApi.deleteLabEquipment(id);
      if (res && res.success) {
        setActionSuccess("Equipment asset removed from laboratory inventory.");
        setDeleteId(null);
        loadLaboratoryData(true);
      } else {
        throw new Error(res?.message || "Failed to delete equipment record.");
      }
    } catch (err) {
      alert(err.message || "Error deleting equipment.");
    } finally {
      setDeleting(false);
    }
  };

  // Maintenance Ticket Handlers
  const handleOpenMaintenanceModal = (item) => {
    setMaintItem(item);
    setMaintForm({
      status: item.status === "operational" ? "maintenance" : item.status,
      issueDescription: "",
      technicianAssigned: "Subharti Central Hardware Cell",
      repairCost: 0,
      resolutionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    });
    setShowMaintModal(true);
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    if (!maintItem) return;

    setMaintSubmitting(true);
    try {
      const existingLogs = maintItem.maintenanceLogs || [];
      const newLog = {
        issueDescription: maintForm.issueDescription.trim() || "Routine inspection & diagnosis",
        reportedDate: new Date(),
        technicianAssigned: maintForm.technicianAssigned.trim(),
        repairCost: Number(maintForm.repairCost) || 0,
        resolutionDate: maintForm.resolutionDate ? new Date(maintForm.resolutionDate) : null
      };

      const res = await authApi.updateLabEquipment(maintItem.id || maintItem._id, {
        status: maintForm.status,
        maintenanceLogs: [newLog, ...existingLogs]
      });

      if (res && res.success) {
        setActionSuccess("Maintenance service ticket logged & status updated.");
        setShowMaintModal(false);
        loadLaboratoryData(true);
      } else {
        throw new Error(res?.message || "Failed to log maintenance ticket.");
      }
    } catch (err) {
      alert(err.message || "Error saving maintenance log.");
    } finally {
      setMaintSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEquipment.length === 0) {
      alert("No equipment records to export.");
      return;
    }

    const headers = [
      "Asset Tag",
      "Equipment Name",
      "Lab Room",
      "Category",
      "Quantity",
      "Status",
      "Condition",
      "Lab Assistant",
      "Specifications",
      "Purchase Date"
    ];

    const rows = filteredEquipment.map((e) => [
      `"${e.assetTag}"`,
      `"${e.equipmentName.replace(/"/g, '""')}"`,
      `"${e.labName} (${e.roomNumber})"`,
      `"${e.category}"`,
      e.quantity || 1,
      e.status,
      e.workingCondition || "Good",
      `"${e.labAssistantInCharge || ""}"`,
      `"${(e.specifications || "").replace(/"/g, '""')}"`,
      e.purchaseDate ? new Date(e.purchaseDate).toLocaleDateString() : "N/A"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HOD_Lab_Inventory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="hod-lab-page">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="hod-lab-toast-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="toast-close-btn">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header Card */}
      <header className="hod-lab-header-card">
        <div className="hod-lab-header-left">
          <div className="hod-lab-title-badge">
            <span className="hod-badge-pulse" />
            <Cpu size={14} className="hod-badge-icon" />
            <span>Infrastructure & Asset Governance</span>
          </div>
          <h1 className="hod-lab-page-title">Laboratory & Equipment Command</h1>
          <p className="hod-lab-page-subtitle">
            Track departmental computing assets, oversee hardware operational readiness, schedule
            facility maintenance, and audit laboratory practical sessions.
          </p>
        </div>

        <div className="hod-lab-header-actions">
          <button
            onClick={() => loadLaboratoryData(true)}
            disabled={loading || refreshing}
            className="hod-lab-btn-ghost"
            title="Sync inventory"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="hod-lab-btn-secondary"
            title="Export laboratory inventory"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="hod-lab-btn-secondary"
            title="Print equipment inventory report"
          >
            <Printer size={16} />
            <span>Print Audit</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="hod-lab-btn-primary"
            title="Register new hardware equipment"
          >
            <Plus size={16} />
            <span>Register Asset</span>
          </button>
        </div>
      </header>

      {/* KPI Metric Strip */}
      <section className="hod-lab-kpi-grid">
        {/* KPI 1 */}
        <div className="hod-lab-kpi-card">
          <div className="kpi-icon-wrapper kpi-indigo">
            <Building size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Laboratories</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.totalLabs || 4}</span>
              <span className="kpi-tag-sub">Facilities</span>
            </div>
            <div className="kpi-footer-metric">
              <Layers size={12} />
              <span>Full Practical Coverage</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="hod-lab-kpi-card">
          <div className="kpi-icon-wrapper kpi-teal">
            <Package size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Equipment Units</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.totalEquipmentCount || equipmentList.length}</span>
              <span className="kpi-tag-sub">Units</span>
            </div>
            <div className="kpi-footer-metric">
              <Server size={12} />
              <span>{equipmentList.length} Unique Asset Records</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="hod-lab-kpi-card">
          <div className="kpi-icon-wrapper kpi-emerald">
            <Activity size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Operational Readiness</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{stats.operationalRate || 95}%</span>
              <span className="kpi-rate-badge">Healthy</span>
            </div>
            <div className="kpi-progress-bar-container">
              <div
                className="kpi-progress-fill"
                style={{ width: `${stats.operationalRate || 95}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="hod-lab-kpi-card">
          <div className="kpi-icon-wrapper kpi-amber">
            <Wrench size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Maintenance / Damaged</span>
            <div className="kpi-value-row">
              <span className="kpi-value">
                {(stats.maintenanceCount || 0) + (stats.damagedCount || 0)}
              </span>
              <span className="kpi-warning-tag">
                {stats.maintenanceCount || 0} Service Tickets
              </span>
            </div>
            <div className="kpi-footer-metric">
              <AlertTriangle size={12} />
              <span>{stats.damagedCount || 0} Damaged Assets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Laboratory Explorer */}
      <section className="hod-lab-main-container">
        {/* Lab Facility Selection Tabs */}
        <div className="hod-lab-tabs-bar">
          <div className="tabs-scroll-area">
            {availableLabs.map((lab) => {
              const count =
                lab === "ALL"
                  ? equipmentList.length
                  : equipmentList.filter((e) => e.labName === lab).length;
              const isActive = selectedLab === lab;

              return (
                <button
                  key={lab}
                  onClick={() => setSelectedLab(lab)}
                  className={`hod-sem-tab ${isActive ? "active" : ""}`}
                >
                  <Cpu size={14} />
                  <span>{lab === "ALL" ? "All Laboratories" : lab}</span>
                  <span className="tab-counter-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="hod-lab-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by asset tag, equipment name, room or assistant..."
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
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
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

        {/* Content Section */}
        {loading ? (
          <div className="hod-lab-loading-state">
            <div className="lab-spinner" />
            <p>Loading laboratory inventory records and maintenance tickets...</p>
          </div>
        ) : error ? (
          <div className="hod-lab-error-state">
            <AlertCircle size={36} className="text-red" />
            <h3>Unable to load laboratory assets</h3>
            <p>{error}</p>
            <button onClick={() => loadLaboratoryData(true)} className="hod-lab-btn-primary">
              <RefreshCw size={15} />
              <span>Retry Load</span>
            </button>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="hod-lab-empty-state">
            <Package size={48} className="empty-icon" />
            <h3>No laboratory assets found</h3>
            <p>No equipment matches your current laboratory selection or search filter.</p>
            <button onClick={handleOpenCreateModal} className="hod-lab-btn-primary">
              <Plus size={16} />
              <span>Register New Asset</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="hod-lab-grid">
            {filteredEquipment.map((item) => {
              const isOperational = item.status === "operational";
              const isMaintenance = item.status === "maintenance";
              const isDamaged = item.status === "damaged";

              return (
                <div key={item.id || item._id} className="equip-card animate-card">
                  <div className="equip-card-top">
                    <span className="asset-tag-badge">{item.assetTag}</span>
                    <span className={`status-pill pill-${item.status}`}>{item.status}</span>
                  </div>

                  <h3 className="equip-title">{item.equipmentName}</h3>

                  <div className="equip-lab-location">
                    <Building size={13} />
                    <span>
                      {item.labName} • <strong>{item.roomNumber}</strong>
                    </span>
                  </div>

                  <div className="equip-specs-box">
                    <span className="specs-label">Technical Specs:</span>
                    <p className="specs-text">{item.specifications || "Standard lab configuration"}</p>
                  </div>

                  <div className="equip-meta-grid">
                    <div className="equip-meta-item">
                      <span className="meta-label">Category</span>
                      <span className="meta-value">{item.category}</span>
                    </div>
                    <div className="equip-meta-item">
                      <span className="meta-label">Quantity</span>
                      <span className="meta-value">{item.quantity || 1} Units</span>
                    </div>
                    <div className="equip-meta-item">
                      <span className="meta-label">Condition</span>
                      <span className="meta-value">{item.workingCondition || "Good"}</span>
                    </div>
                    <div className="equip-meta-item">
                      <span className="meta-label">In-Charge</span>
                      <span className="meta-value">{item.labAssistantInCharge || "Staff"}</span>
                    </div>
                  </div>

                  {/* Maintenance notice if active */}
                  {isMaintenance && (
                    <div className="equip-alert-bar">
                      <Wrench size={13} />
                      <span>Under Maintenance Diagnosis</span>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="equip-card-footer">
                    <button
                      onClick={() => handleOpenMaintenanceModal(item)}
                      className="maint-action-btn"
                    >
                      <Wrench size={13} />
                      <span>Service Ticket</span>
                    </button>
                    <div className="footer-right-icons">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="card-icon-btn"
                        title="Edit asset details"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id || item._id)}
                        className="card-icon-btn delete"
                        title="Remove asset"
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
          <div className="hod-lab-table-wrapper">
            <table className="hod-lab-table">
              <thead>
                <tr>
                  <th>Asset Tag & Equipment</th>
                  <th>Laboratory & Room</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Condition</th>
                  <th>Assistant In-Charge</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>
                      <div className="table-equip-cell">
                        <span className="tag-mono">{item.assetTag}</span>
                        <span className="name-bold">{item.equipmentName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-lab-cell">
                        <span className="lab-bold">{item.labName}</span>
                        <span className="room-muted">{item.roomNumber}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-category">{item.category}</span>
                    </td>
                    <td>
                      <span className="quantity-badge">{item.quantity || 1}</span>
                    </td>
                    <td>{item.workingCondition || "Good"}</td>
                    <td>{item.labAssistantInCharge || "Staff"}</td>
                    <td>
                      <span className={`status-pill pill-${item.status}`}>{item.status}</span>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          onClick={() => handleOpenMaintenanceModal(item)}
                          className="table-action-btn maint-btn"
                          title="Log maintenance service"
                        >
                          <Wrench size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="table-action-btn edit-btn"
                          title="Edit asset details"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id || item._id)}
                          className="table-action-btn delete-btn"
                          title="Remove asset"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- MODAL 1: Add / Edit Equipment Modal --- */}
      {showEquipModal && (
        <div className="hod-lab-modal-backdrop" onClick={() => setShowEquipModal(false)}>
          <div
            className="hod-lab-modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Package size={13} />
                  <span>Asset Inventory Registration</span>
                </div>
                <h3 className="modal-title">
                  {modalMode === "create" ? "Register Laboratory Equipment" : "Edit Asset Specifications"}
                </h3>
              </div>
              <button onClick={() => setShowEquipModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="lab-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Equipment / Device Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Precision 3660 Workstation"
                    value={equipForm.equipmentName}
                    onChange={(e) => setEquipForm({ ...equipForm, equipmentName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Asset Tag / Serial ID <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE-LAB1-WS01"
                    value={equipForm.assetTag}
                    onChange={(e) => setEquipForm({ ...equipForm, assetTag: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Laboratory Room</label>
                  <select
                    value={equipForm.labName}
                    onChange={(e) => setEquipForm({ ...equipForm, labName: e.target.value })}
                    className="form-input"
                  >
                    {availableLabs.filter((l) => l !== "ALL").map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    placeholder="Room 301"
                    value={equipForm.roomNumber}
                    onChange={(e) => setEquipForm({ ...equipForm, roomNumber: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={equipForm.category}
                    onChange={(e) => setEquipForm({ ...equipForm, category: e.target.value })}
                    className="form-input"
                  >
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={equipForm.quantity}
                    onChange={(e) =>
                      setEquipForm({ ...equipForm, quantity: Number(e.target.value) })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={equipForm.status}
                    onChange={(e) => setEquipForm({ ...equipForm, status: e.target.value })}
                    className="form-input"
                  >
                    {STATUS_OPTIONS.filter((s) => s !== "ALL").map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Technical Specifications & Configuration</label>
                <textarea
                  rows={3}
                  placeholder="Detail CPU, RAM, GPU, storage, OS, and peripheral specifications..."
                  value={equipForm.specifications}
                  onChange={(e) => setEquipForm({ ...equipForm, specifications: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Lab Assistant In-Charge</label>
                  <input
                    type="text"
                    placeholder="Er. Rahul Verma"
                    value={equipForm.labAssistantInCharge}
                    onChange={(e) =>
                      setEquipForm({ ...equipForm, labAssistantInCharge: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Working Condition</label>
                  <select
                    value={equipForm.workingCondition}
                    onChange={(e) =>
                      setEquipForm({ ...equipForm, workingCondition: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="Excellent">Excellent (New / Premium)</option>
                    <option value="Good">Good (Operational)</option>
                    <option value="Fair">Fair (Needs Monitoring)</option>
                    <option value="Critical">Critical (Pending Repair)</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowEquipModal(false)}
                  className="hod-lab-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={equipSubmitting}
                  className="hod-lab-btn-primary"
                >
                  {equipSubmitting ? "Saving Asset..." : "Confirm Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Maintenance Ticket & Status Update --- */}
      {showMaintModal && maintItem && (
        <div className="hod-lab-modal-backdrop" onClick={() => setShowMaintModal(false)}>
          <div
            className="hod-lab-modal-content max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Wrench size={13} />
                  <span>Service Ticket Logging</span>
                </div>
                <h3 className="modal-title">Log Equipment Maintenance</h3>
                <p className="modal-subtitle">
                  {maintItem.equipmentName} ({maintItem.assetTag})
                </p>
              </div>
              <button onClick={() => setShowMaintModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="lab-form">
              <div className="form-group">
                <label className="form-label">Equipment Operational Status</label>
                <select
                  value={maintForm.status}
                  onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value })}
                  className="form-input"
                >
                  <option value="operational">Operational (Resolved / Normal)</option>
                  <option value="maintenance">Under Maintenance (In Repair)</option>
                  <option value="damaged">Damaged / Non-Functional</option>
                  <option value="decommissioned">Decommissioned / Scrapped</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Description & Fault Symptoms</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe hardware failure, power faults, OS crash, network failure or physical defect..."
                  value={maintForm.issueDescription}
                  onChange={(e) =>
                    setMaintForm({ ...maintForm, issueDescription: e.target.value })
                  }
                  className="form-textarea"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Assigned Technician / Vendor</label>
                  <input
                    type="text"
                    value={maintForm.technicianAssigned}
                    onChange={(e) =>
                      setMaintForm({ ...maintForm, technicianAssigned: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Repair Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maintForm.repairCost}
                    onChange={(e) => setMaintForm({ ...maintForm, repairCost: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Resolution Date</label>
                <input
                  type="date"
                  value={maintForm.resolutionDate}
                  onChange={(e) =>
                    setMaintForm({ ...maintForm, resolutionDate: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="hod-lab-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={maintSubmitting}
                  className="hod-lab-btn-primary"
                >
                  {maintSubmitting ? "Logging Ticket..." : "Save Maintenance Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {deleteId && (
        <div className="hod-lab-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div
            className="hod-lab-modal-content max-w-md confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box">
              <AlertTriangle size={28} className="text-red" />
            </div>
            <h3 className="confirm-title">Remove Equipment Record?</h3>
            <p className="confirm-text">
              Are you sure you want to delete this asset from the laboratory inventory? This
              action will remove all maintenance logs and warranty records for this asset.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="hod-lab-btn-ghost"
              >
                Keep Asset
              </button>
              <button
                onClick={() => handleDeleteEquipment(deleteId)}
                disabled={deleting}
                className="hod-lab-btn-danger"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
