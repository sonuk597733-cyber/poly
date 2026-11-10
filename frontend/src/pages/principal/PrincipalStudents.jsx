import React, { useState, useEffect } from "react";
import { Users, Search, GraduationCap, Eye, Filter, Mail, Phone, ShieldAlert, CheckCircle2, UserX, UserCheck } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalStudents.css";

export default function PrincipalStudents({ currentUser, onSelectStudent, showToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Deactivation / Reactivation Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionType, setActionType] = useState(null); // "deactivate" | "reactivate"
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = () => {
    setLoading(true);
    authApi
      .getStudentsDirectory({ limit: 120 })
      .then((res) => {
        setStudents(res?.students || []);
        setLoading(false);
      })
      .catch((err) => {
        showToast?.(err.message || "Failed to load polytechnic student directory.", true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeactivate = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!reason.trim()) {
      showToast?.("Please provide a reason for account deactivation.", true);
      return;
    }

    setActionLoading(true);
    try {
      await authApi.deactivateStudent(selectedStudent._id, reason.trim());
      showToast?.(`Student account for ${selectedStudent.fullName} deactivated.`);
      setSelectedStudent(null);
      setActionType(null);
      setReason("");
      fetchStudents();
    } catch (err) {
      showToast?.(err.message || "Failed to deactivate student account.", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (student) => {
    setActionLoading(true);
    try {
      await authApi.reactivateStudent(student._id);
      showToast?.(`Student account for ${student.fullName} has been reactivated.`);
      fetchStudents();
    } catch (err) {
      showToast?.(err.message || "Failed to reactivate student account.", true);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    if (branchFilter !== "all" && s.branch !== branchFilter) return false;
    if (semesterFilter !== "all" && s.semester !== semesterFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (s.fullName || "").toLowerCase().includes(q);
      const matchRoll = (s.rollNo || s.enrollmentNo || "").toLowerCase().includes(q);
      return matchName || matchRoll;
    }
    return true;
  });

  return (
    <div className="prin-std-container">
      {/* Header Row */}
      <div className="prin-pane-header">
        <div>
          <h2>Subharti Polytechnic All Students Directory & Registry</h2>
          <p>
            Central registry with executive oversight, enrollment audit, and statutory account suspension controls.
          </p>
        </div>

        <div className="prin-filter-controls">
          <div className="prin-search-box">
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="prin-filter-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ME">Mechanical (ME)</option>
            <option value="EE">Electrical (EE)</option>
            <option value="CE">Civil (CE)</option>
            <option value="ECE">ECE</option>
          </select>

          <select
            className="prin-filter-select"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={`Semester ${s}`}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Metrics Banner */}
      <div className="prin-std-metrics-row">
        <div className="prin-metric-pill">
          <GraduationCap size={15} />
          <span>Active Registry: <strong>{filtered.length} Candidates</strong></span>
        </div>
        <div className="prin-metric-pill authority">
          <ShieldAlert size={15} />
          <span>Executive Authority: <strong>Account Sanction / Suspension Permitted</strong></span>
        </div>
        <div className="prin-metric-pill info">
          <Filter size={15} />
          <span>Scope: <strong>{branchFilter === "all" ? "Campus-wide" : branchFilter}</strong></span>
        </div>
      </div>

      {/* Candidates Cards Grid */}
      {loading ? (
        <div className="prin-std-loading">
          <div className="prin-spinner" />
          <p>Loading central polytechnic candidate records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="prin-std-empty">
          <Users size={36} color="#94A3B8" />
          <h3>No students found</h3>
          <p>Try adjusting your search query or department filter.</p>
        </div>
      ) : (
        <div className="prin-std-grid">
          {filtered.map((student) => {
            const isInactive = student.status === "inactive" || student.isActive === false;

            return (
              <div key={student._id} className={`prin-std-card ${isInactive ? "inactive" : ""}`}>
                <div className="prin-std-card-top">
                  <div className="prin-std-avatar">
                    {student.profilePicture ? (
                      <img src={student.profilePicture} alt={student.fullName} />
                    ) : (
                      <span>{(student.fullName || "S").charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="prin-std-basic">
                    <h4>{student.fullName || "Candidate"}</h4>
                    <span className="prin-std-roll mono">
                      {student.rollNo || student.enrollmentNo || "N/A"}
                    </span>
                  </div>

                  <span className={`prin-std-acc-status ${isInactive ? "suspended" : "active"}`}>
                    {isInactive ? "Suspended" : "Active"}
                  </span>
                </div>

                <div className="prin-std-tags">
                  <span className="prin-tag branch">{student.branch || "CSE"}</span>
                  <span className="prin-tag sem">{student.semester || "Semester 1"}</span>
                  <span className="prin-tag year">{student.academicYear || "1st Year"}</span>
                </div>

                <div className="prin-std-details">
                  <div className="prin-std-row">
                    <Mail size={13} />
                    <span>{student.email || "student@subharti.edu"}</span>
                  </div>
                  {student.phone && (
                    <div className="prin-std-row">
                      <Phone size={13} />
                      <span>{student.phone}</span>
                    </div>
                  )}
                </div>

                <div className="prin-std-card-actions">
                  <button
                    type="button"
                    className="prin-view-profile-btn"
                    onClick={() => onSelectStudent?.(student._id)}
                  >
                    <Eye size={14} />
                    <span>View Profile</span>
                  </button>

                  {isInactive ? (
                    <button
                      type="button"
                      className="prin-status-btn reactivate"
                      onClick={() => handleReactivate(student)}
                      disabled={actionLoading}
                      title="Reactivate Account"
                    >
                      <UserCheck size={14} />
                      <span>Reactivate</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="prin-status-btn deactivate"
                      onClick={() => {
                        setSelectedStudent(student);
                        setActionType("deactivate");
                        setReason("");
                      }}
                      title="Deactivate Account"
                    >
                      <UserX size={14} />
                      <span>Suspend</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deactivation Modal */}
      {selectedStudent && actionType === "deactivate" && (
        <div className="prin-modal-backdrop">
          <div className="prin-modal-box">
            <div className="prin-modal-header">
              <h3>Confirm Student Account Suspension</h3>
              <button
                type="button"
                className="prin-modal-close"
                onClick={() => {
                  setSelectedStudent(null);
                  setActionType(null);
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDeactivate} className="prin-modal-form">
              <div className="prin-suspend-warning-box">
                <ShieldAlert size={20} color="#DC2626" />
                <p>
                  You are about to suspend <strong>{selectedStudent.fullName}</strong> (Roll:{" "}
                  {selectedStudent.rollNo || selectedStudent.enrollmentNo}). The student will be barred from login and portal services until reactivated.
                </p>
              </div>

              <div className="prin-form-group">
                <label>Statutory Reason for Account Suspension</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Disciplinary suspension / Fee default / Attendance violation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="prin-modal-actions">
                <button
                  type="button"
                  className="prin-btn secondary"
                  onClick={() => {
                    setSelectedStudent(null);
                    setActionType(null);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="prin-btn danger"
                  disabled={actionLoading || !reason.trim()}
                >
                  {actionLoading ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
