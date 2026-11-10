import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  User,
  Filter,
  Loader2,
  RefreshCw,
  Award,
  Layers,
  Send,
  Calendar,
  AlertCircle,
  Eye,
  X,
  Building2,
  ExternalLink,
  Paperclip,
  Download,
  FileSpreadsheet,
  Archive,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { authApi } from "../../services/authApi";
import AssignmentPreviewModal from "../../components/assignment/AssignmentPreviewModal";
import "./CoordinatorAssignments.css";

const BRANCHES = ["ALL", "CSE", "IT", "Mechanical", "Electrical", "Civil", "ECE"];

const STATUS_FILTERS = [
  { id: "ALL", label: "All Active" },
  { id: "ACTIVE", label: "Active Deliverables" },
  { id: "PAST_DUE", label: "Past Due" },
  { id: "DRAFT", label: "Faculty Drafts" },
  { id: "ARCHIVED", label: "Archived Records" }
];

export default function CoordinatorAssignments({ showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAsgn, setSelectedAsgn] = useState(null);

  // Preview Modal States
  const [previewAssignment, setPreviewAssignment] = useState(null);
  const [previewTab, setPreviewTab] = useState("overview");

  // Delete State
  const [deleteTargetAsgn, setDeleteTargetAsgn] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Coordinator retrieves all assignments including drafts and archives
      const res = await authApi.getAssignments({
        status: "all",
        branch: branchFilter !== "ALL" ? branchFilter : undefined
      });
      const raw = res?.assignments || [];
      setAssignments(raw);
    } catch (err) {
      console.error("Failed to load coordinator assignments:", err);
      showToast?.("Failed to synchronize assignments feed.", true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchFilter, showToast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = assignments.filter((a) => !a.isArchived && a.status !== "archived").length;
    let submitted = 0;
    let graded = 0;
    let late = 0;

    assignments.forEach((a) => {
      if (a.isArchived || a.status === "archived") return;
      const subs = a.submissions || [];
      submitted += subs.length;
      subs.forEach((s) => {
        if (s.status === "evaluated" || (s.grade !== null && s.grade !== undefined)) {
          graded += 1;
        }
        if (s.status === "late") {
          late += 1;
        }
      });
    });

    const pending = Math.max(0, submitted - graded);
    const completionRate = submitted > 0 ? Math.round((graded / submitted) * 100) : 100;

    return { total, submitted, graded, pending, late, completionRate };
  }, [assignments]);

  // Export Analytics CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await authApi.exportAssignmentReportCSV({
        branch: branchFilter !== "ALL" ? branchFilter : undefined
      });
      showToast?.("Assignment monitoring registry exported to CSV.");
    } catch (err) {
      showToast?.(err.message || "Failed to export assignment CSV report.", true);
    } finally {
      setExporting(false);
    }
  };

  // Toggle Archive Status
  const handleToggleArchive = async (asn) => {
    try {
      const id = asn.id || asn._id;
      await authApi.archiveAssignment(id);
      showToast?.(
        asn.isArchived || asn.status === "archived"
          ? `"${asn.title}" restored to active catalog.`
          : `"${asn.title}" moved to archive.`
      );
      fetchAssignments(true);
    } catch (err) {
      showToast?.(err.message || "Failed to update assignment archive status.", true);
    }
  };

  const handleConfirmDelete = async (force = false) => {
    if (!deleteTargetAsgn) return;
    setDeleting(true);
    try {
      const id = deleteTargetAsgn.id || deleteTargetAsgn._id;
      await authApi.deleteAssignment(id, force);
      showToast?.("Assignment record removed successfully.");
      setDeleteTargetAsgn(null);
      fetchAssignments(true);
    } catch (err) {
      showToast?.(err.message || "Failed to delete assignment.", true);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered List
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      if (branchFilter !== "ALL" && a.branch !== branchFilter) return false;

      const isArchived = Boolean(a.isArchived || a.status === "archived");
      const isDraft = a.status === "draft";
      const isPastDue = a.dueDate && new Date(a.dueDate) < now;

      if (statusFilter === "ALL") {
        if (isArchived) return false;
      } else if (statusFilter === "ACTIVE") {
        if (isArchived || isDraft || isPastDue) return false;
      } else if (statusFilter === "PAST_DUE") {
        if (isArchived || isDraft || !isPastDue) return false;
      } else if (statusFilter === "DRAFT") {
        if (isArchived || !isDraft) return false;
      } else if (statusFilter === "ARCHIVED") {
        if (!isArchived) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pool = [
          a.title,
          a.subject,
          a.branch,
          a.semester,
          a.creatorName || (a.createdBy?.fullName || "")
        ].join(" ").toLowerCase();
        if (!pool.includes(q)) return false;
      }
      return true;
    });
  }, [assignments, branchFilter, statusFilter, searchQuery]);

  return (
    <div className="coord-asn-container">
      {/* Pane Header */}
      <div className="coord-pane-header">
        <div>
          <h2>
            <FileText size={24} color="#2563EB" />
            Continuous Assessment & Assignment Monitoring
          </h2>
          <p>
            Oversee departmental academic assignments, monitor student submission quotas across branches, and ensure faculty grading compliance.
          </p>
        </div>

        <div className="coord-header-actions">
          <button
            type="button"
            className="coord-btn-export"
            onClick={handleExportCSV}
            disabled={exporting}
            title="Export assignment monitoring data to CSV spreadsheet"
          >
            <FileSpreadsheet size={15} />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>

          <button
            type="button"
            className="coord-btn-refresh"
            onClick={() => fetchAssignments(true)}
            disabled={refreshing || loading}
            title="Refresh Assignments"
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="coord-kpi-grid">
        <div className="coord-kpi-card">
          <div className="coord-kpi-icon blue"><Layers size={20} /></div>
          <div>
            <span className="coord-kpi-label">Active Assignments</span>
            <strong className="coord-kpi-value">{metrics.total}</strong>
          </div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-icon indigo"><Send size={20} /></div>
          <div>
            <span className="coord-kpi-label">Total Submissions</span>
            <strong className="coord-kpi-value">{metrics.submitted}</strong>
          </div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-icon amber"><Clock size={20} /></div>
          <div>
            <span className="coord-kpi-label">Pending Evaluation</span>
            <strong className="coord-kpi-value">{metrics.pending}</strong>
          </div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-icon emerald"><Award size={20} /></div>
          <div>
            <span className="coord-kpi-label">Graded & Published</span>
            <strong className="coord-kpi-value">{metrics.graded}</strong>
          </div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-icon cyan"><CheckCircle2 size={20} /></div>
          <div>
            <span className="coord-kpi-label">Compliance Rate</span>
            <strong className="coord-kpi-value">{metrics.completionRate}%</strong>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="coord-status-chips">
        {STATUS_FILTERS.map((tab) => {
          const count = assignments.filter((a) => {
            const isArchived = Boolean(a.isArchived || a.status === "archived");
            const isDraft = a.status === "draft";
            const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();
            if (tab.id === "ALL") return !isArchived;
            if (tab.id === "ACTIVE") return !isArchived && !isDraft && !isPastDue;
            if (tab.id === "PAST_DUE") return !isArchived && !isDraft && isPastDue;
            if (tab.id === "DRAFT") return !isArchived && isDraft;
            if (tab.id === "ARCHIVED") return isArchived;
            return false;
          }).length;

          return (
            <button
              key={tab.id}
              type="button"
              className={`coord-status-chip ${statusFilter === tab.id ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Controls */}
      <div className="coord-filter-controls">
        <div className="coord-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by assignment title, subject, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="coord-search-clear" onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coord-select-group">
          <select
            className="coord-filter-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b === "ALL" ? "All Departments" : `${b} Department`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="coord-loading-state">
          <Loader2 size={32} className="spin" color="#2563EB" />
          <p>Synchronizing assignment records from academic repository...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="coord-empty-card">
          <FileText size={40} color="#94A3B8" />
          <h3>No Coursework Assignments Found</h3>
          <p>No assignments match the selected department, status, or search filter criteria.</p>
        </div>
      ) : (
        <div className="coord-asn-card">
          <div className="coord-table-responsive">
            <table className="coord-asn-table">
              <thead>
                <tr>
                  <th>Assignment & Topic</th>
                  <th>Branch & Sem</th>
                  <th>Faculty Incharge</th>
                  <th>Due Date & Marks</th>
                  <th>Submissions / Quota</th>
                  <th>Evaluation Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((asn) => {
                  const id = asn.id || asn._id;
                  const subs = asn.submissions || [];
                  const submittedCount = asn.submissionsCount || subs.length;
                  const evaluatedCount = subs.filter(
                    (s) => s.status === "evaluated" || (s.grade !== null && s.grade !== undefined)
                  ).length;
                  const isPastDue = asn.dueDate && new Date(asn.dueDate) < new Date();
                  const isDraft = asn.status === "draft";
                  const isArchived = Boolean(asn.isArchived || asn.status === "archived");
                  const totalTarget = 48; // Standard diploma batch quota
                  const quotaPct = Math.min(100, Math.round((submittedCount / totalTarget) * 100));
                  const hasHandouts = (asn.referenceAttachments && asn.referenceAttachments.length > 0) ||
                    (asn.externalResources && asn.externalResources.length > 0);

                  return (
                    <tr key={id} className={isArchived ? "coord-row-archived" : ""}>
                      <td>
                        <div className="coord-asn-title-cell">
                          <div className={`coord-asn-icon ${isDraft ? "draft" : isArchived ? "archived" : ""}`}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div className="coord-title-header">
                              <strong>{asn.title}</strong>
                              {isDraft && <span className="coord-tag-draft">Draft</span>}
                              {isArchived && <span className="coord-tag-archived">Archived</span>}
                            </div>
                            <span className="coord-asn-sub">
                              {asn.subject} {asn.unit ? `· ${asn.unit}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="coord-scope-cell">
                          <span className="coord-branch-pill">{asn.branch}</span>
                          <span className="coord-sem-text">{asn.semester}</span>
                        </div>
                      </td>
                      <td>
                        <div className="coord-fac-cell">
                          <User size={13} />
                          <span>{asn.creatorName || asn.createdBy?.fullName || "Faculty Lecturer"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="coord-due-cell">
                          <span className={`coord-due-text ${isPastDue ? "overdue" : ""}`}>
                            <Clock size={12} />
                            {asn.dueDate ? new Date(asn.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                          </span>
                          <small>{asn.totalPoints || asn.maxMarks || 100} Marks</small>
                        </div>
                      </td>
                      <td>
                        <div className="coord-prog-wrapper">
                          <div className="coord-prog-labels">
                            <span>{submittedCount} turned in</span>
                            <span>{quotaPct}%</span>
                          </div>
                          <div className="coord-prog-track">
                            <div
                              className="coord-prog-fill"
                              style={{ width: `${quotaPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`coord-asn-status ${evaluatedCount === submittedCount && submittedCount > 0 ? "completed" : isDraft ? "draft" : "active"}`}>
                          {isDraft ? "Draft" : `${evaluatedCount} / ${submittedCount} Graded`}
                        </span>
                      </td>
                      <td>
                        <div className="coord-action-group">
                          {/* Preview Problem Statement & Rubric */}
                          <button
                            type="button"
                            className="coord-btn-action preview"
                            onClick={() => {
                              setPreviewAssignment(asn);
                              setPreviewTab("overview");
                            }}
                            title="Preview Assignment Problem Statement & Rubric"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>

                          {/* Handout preview if available */}
                          {hasHandouts && (
                            <button
                              type="button"
                              className="coord-btn-action handout"
                              onClick={() => {
                                setPreviewAssignment(asn);
                                setPreviewTab("attachments");
                              }}
                              title="Inspect Handout Attachments & Resources"
                            >
                              <Paperclip size={13} />
                              <span>Handouts</span>
                            </button>
                          )}

                          {/* Inspect Submissions Roster */}
                          <button
                            type="button"
                            className="coord-btn-action inspect"
                            onClick={() => setSelectedAsgn(asn)}
                            title="Audit student submissions roster"
                          >
                            <Award size={13} />
                            <span>Roster</span>
                          </button>

                          {/* Archive / Restore Toggle */}
                          <button
                            type="button"
                            className={`coord-btn-action archive ${isArchived ? "restore" : ""}`}
                            onClick={() => handleToggleArchive(asn)}
                            title={isArchived ? "Restore assignment from archive" : "Move assignment to archive"}
                          >
                            {isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
                          </button>

                          {/* Delete Action */}
                          <button
                            type="button"
                            className="coord-btn-action delete"
                            onClick={() => setDeleteTargetAsgn(asn)}
                            title="Delete assignment deliverable"
                          >
                            <Trash2 size={13} />
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

      {/* Assignment Detail Oversight Modal */}
      {selectedAsgn && (
        <div className="coord-modal-backdrop" onClick={() => setSelectedAsgn(null)}>
          <div className="coord-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="coord-modal-header">
              <div>
                <span className="coord-modal-subtag">
                  {selectedAsgn.branch} · {selectedAsgn.semester} · {selectedAsgn.subject}
                </span>
                <h3>{selectedAsgn.title}</h3>
                <small>
                  Published by {selectedAsgn.creatorName || selectedAsgn.createdBy?.fullName || "Faculty"} ·{" "}
                  Due: {selectedAsgn.dueDate ? new Date(selectedAsgn.dueDate).toLocaleDateString("en-IN") : "—"}
                </small>
              </div>
              <button
                type="button"
                className="coord-modal-close"
                onClick={() => setSelectedAsgn(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="coord-modal-body">
              {/* Overview & Instructions */}
              <div className="coord-modal-section">
                <div className="coord-section-bar">
                  <h4>Assignment Description & Instructions</h4>
                  <button
                    type="button"
                    className="coord-btn-text"
                    onClick={() => {
                      setPreviewAssignment(selectedAsgn);
                      setPreviewTab("overview");
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Open Full Document Preview</span>
                  </button>
                </div>
                <div className="coord-modal-desc-box">
                  {selectedAsgn.description || "No detailed instructions provided."}
                </div>
              </div>

              {/* Submissions Roster */}
              <div className="coord-modal-section">
                <h4>
                  Student Submissions Roster ({(selectedAsgn.submissions || []).length})
                </h4>
                {(selectedAsgn.submissions || []).length === 0 ? (
                  <p className="coord-no-subs-text">No student submissions submitted yet for this assignment.</p>
                ) : (
                  <div className="coord-sub-list">
                    {(selectedAsgn.submissions || []).map((sub, idx) => {
                      const st = sub.studentId || {};
                      return (
                        <div key={sub._id || idx} className="coord-sub-item">
                          <div className="coord-sub-item-info">
                            <strong>{st.fullName || "Enrolled Student"}</strong>
                            <small>{st.rollNumber || st.email || "CSE-2026"} · Receipt: {sub.submissionReceipt || "SUB-OK"}</small>
                          </div>
                          <div className="coord-sub-item-meta">
                            <span className={`coord-sub-status-tag ${sub.status}`}>
                              {sub.status === "evaluated"
                                ? `Graded (${sub.grade}/${selectedAsgn.totalPoints || 100})`
                                : sub.status === "correction_required"
                                ? "Revision Requested"
                                : sub.status === "late"
                                ? "Late Submission"
                                : "Turned In"}
                            </span>
                            <small>
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-IN") : ""}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="coord-modal-footer">
              <button
                type="button"
                className="coord-btn-primary"
                onClick={() => setSelectedAsgn(null)}
              >
                Close Oversight Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Dialog */}
      {deleteTargetAsgn && (() => {
        const subsCount = deleteTargetAsgn.submissionsCount !== undefined && deleteTargetAsgn.submissionsCount !== null
          ? deleteTargetAsgn.submissionsCount
          : (deleteTargetAsgn.submissions || []).filter((s) => s.status !== "draft").length;
        const hasSubmissions = subsCount > 0;

        return (
          <div className="coord-modal-backdrop" onClick={() => setDeleteTargetAsgn(null)}>
            <div
              className="coord-modal-sheet"
              style={{ maxWidth: 480, margin: "auto", borderRadius: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="coord-modal-header" style={{ borderBottom: "1px solid var(--assignment-border, #e8eaf2)" }}>
                <div>
                  <span className="coord-modal-subtag" style={{ color: hasSubmissions ? "#f59e0b" : "#ef4444" }}>
                    {hasSubmissions ? "Academic Record Warning" : "Confirmation Required"}
                  </span>
                  <h3 style={{ margin: "4px 0 0 0" }}>
                    {hasSubmissions ? "Active Student Deliverables Detected" : "Delete Assignment?"}
                  </h3>
                </div>
                <button
                  type="button"
                  className="coord-modal-close"
                  onClick={() => setDeleteTargetAsgn(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                <p style={{ margin: "0 0 16px 0", color: "#475569", fontSize: "0.92rem", lineHeight: 1.5 }}>
                  {hasSubmissions ? (
                    <>
                      <strong>"{deleteTargetAsgn.title}"</strong> has <strong>{subsCount}</strong> active student submission(s).
                      Deleting will permanently destroy student submission records and grades. Moving to <strong>Archive</strong> is recommended.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete <strong>"{deleteTargetAsgn.title}"</strong>? This action cannot be undone.
                    </>
                  )}
                </p>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="coord-btn-action"
                    onClick={() => setDeleteTargetAsgn(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  {hasSubmissions ? (
                    <>
                      <button
                        type="button"
                        className="coord-btn-action"
                        style={{ background: "#f8fafc", borderColor: "#cbd5e1" }}
                        disabled={deleting}
                        onClick={() => {
                          handleToggleArchive(deleteTargetAsgn);
                          setDeleteTargetAsgn(null);
                        }}
                      >
                        <Archive size={14} /> Move to Archive
                      </button>
                      <button
                        type="button"
                        className="coord-btn-action"
                        style={{ background: "#ef4444", color: "#ffffff", borderColor: "#ef4444" }}
                        disabled={deleting}
                        onClick={() => handleConfirmDelete(true)}
                      >
                        {deleting ? "Deleting..." : "Force Delete"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="coord-btn-action"
                      style={{ background: "#ef4444", color: "#ffffff", borderColor: "#ef4444" }}
                      disabled={deleting}
                      onClick={() => handleConfirmDelete(false)}
                    >
                      {deleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Assignment Preview Modal */}
      {previewAssignment && (
        <AssignmentPreviewModal
          assignment={previewAssignment}
          initialTab={previewTab}
          onClose={() => setPreviewAssignment(null)}
        />
      )}
    </div>
  );
}
