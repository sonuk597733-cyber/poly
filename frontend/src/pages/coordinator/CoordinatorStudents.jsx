import React, { useState, useEffect } from "react";
import { Users, Search, GraduationCap, Eye, Filter, Mail, CheckCircle2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorStudents.css";

export default function CoordinatorStudents({ currentUser, onSelectStudent, showToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = () => {
    setLoading(true);
    authApi
      .getStudentsDirectory({ limit: 120 })
      .then((res) => {
        setStudents(res?.students || []);
        setLoading(false);
      })
      .catch((err) => {
        showToast?.(err.message || "Failed to load student directory.", true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
    <div className="coord-std-container">
      {/* Header Row */}
      <div className="coord-pane-header">
        <div>
          <h2>Polytechnic Student Directory (All Branches)</h2>
          <p>
            Central student registry for academic scheduling, enrollment verification, and profile inspection.
          </p>
        </div>

        <div className="coord-filter-controls">
          <div className="coord-search-box">
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="coord-filter-select"
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
            className="coord-filter-select"
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
      <div className="coord-std-metrics-row">
        <div className="coord-metric-pill">
          <GraduationCap size={15} />
          <span>Total Records: <strong>{filtered.length}</strong></span>
        </div>
        <div className="coord-metric-pill success">
          <CheckCircle2 size={15} />
          <span>Active Enrollment: <strong>100%</strong></span>
        </div>
        <div className="coord-metric-pill info">
          <Filter size={15} />
          <span>Filtered by: <strong>{branchFilter === "all" ? "All Engineering" : branchFilter}</strong></span>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="coord-std-loading">
          <div className="coord-spinner" />
          <p>Loading central polytechnic roster...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="coord-std-empty">
          <Users size={36} color="#94A3B8" />
          <h3>No students found</h3>
          <p>Try adjusting your search query or branch filter.</p>
        </div>
      ) : (
        <div className="coord-std-grid">
          {filtered.map((student) => (
            <div key={student._id} className="coord-std-card">
              <div className="coord-std-card-top">
                <div className="coord-std-avatar">
                  {student.profilePicture ? (
                    <img src={student.profilePicture} alt={student.fullName} />
                  ) : (
                    <span>{(student.fullName || "S").charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="coord-std-basic">
                  <h4>{student.fullName || "Candidate"}</h4>
                  <span className="coord-std-roll mono">
                    {student.rollNo || student.enrollmentNo || "N/A"}
                  </span>
                </div>
              </div>

              <div className="coord-std-tags">
                <span className="coord-tag branch">{student.branch || "CSE"}</span>
                <span className="coord-tag sem">{student.semester || "Semester 1"}</span>
                <span className="coord-tag year">{student.academicYear || "1st Year"}</span>
              </div>

              <div className="coord-std-details">
                <div className="coord-std-row">
                  <Mail size={13} />
                  <span>{student.email || "student@subharti.edu"}</span>
                </div>
              </div>

              <div className="coord-std-card-actions">
                <button
                  type="button"
                  className="coord-view-profile-btn"
                  onClick={() => onSelectStudent?.(student._id)}
                >
                  <Eye size={14} />
                  <span>View Student Profile</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
