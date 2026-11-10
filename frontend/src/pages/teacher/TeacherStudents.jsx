import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Eye,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherStudents.css";

export default function TeacherStudents({ onSelectStudent, showToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDirectory = () => {
    setLoading(true);
    const params = {};
    if (branchFilter !== "all") params.branch = branchFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    authApi
      .getStudentsDirectory(params)
      .then((res) => {
        setStudents(res?.students || []);
        setLoading(false);
      })
      .catch((err) => {
        showToast?.(err.message || "Failed to load students directory.", true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDirectory();
  }, [branchFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDirectory();
  };

  return (
    <div className="teacher-role-view teacher-std-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <Users size={24} color="var(--tch-primary)" />
            Class Roster & Student Directory
          </h2>
          <p>Authorized access to candidates enrolled across Subharti Polytechnic departments and academic semesters.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="teacher-std-search-bar">
          <div className="teacher-search-input-wrap">
            <Search size={16} color="var(--tch-text-muted)" />
            <input
              type="text"
              placeholder="Search candidate name or enrollment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tch-input"
              style={{ paddingLeft: 36 }}
            />
          </div>

          <select
            className="tch-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ width: "auto", minWidth: 140 }}
          >
            <option value="all">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
            <option value="Civil">Civil</option>
            <option value="ECE">ECE</option>
          </select>

          <button type="submit" className="tch-btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tch-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading student directory records...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="tch-empty-box">
          <Users size={40} style={{ opacity: 0.6 }} />
          <h3>No Student Candidates Found</h3>
          <p>No enrolled scholars match your current search query or department filter.</p>
        </div>
      ) : (
        <div className="teacher-std-grid">
          {students.map((std) => {
            const sid = std.id || std._id;
            const initial = std.fullName ? std.fullName.trim().charAt(0).toUpperCase() : "S";

            return (
              <div key={sid} className="tch-card teacher-std-card">
                <div>
                  <div className="teacher-std-card-top">
                    <div className="teacher-std-avatar">
                      {std.avatar ? (
                        <img src={std.avatar} alt={std.fullName} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>

                    <div className="teacher-std-info">
                      <h4>{std.fullName}</h4>
                      <p className="teacher-mono-pill">
                        {std.enrollmentNo || std.rollNo || "Scholar"}
                      </p>
                    </div>
                  </div>

                  <div className="teacher-std-meta-list">
                    <div className="teacher-std-meta-row">
                      <Building2 size={13} color="var(--tch-primary)" />
                      <span>{std.branch} Engineering • {std.semester || "Current"}</span>
                    </div>

                    {std.email && (
                      <div className="teacher-std-meta-row">
                        <Mail size={13} color="var(--tch-text-muted)" />
                        <span className="truncate">{std.email}</span>
                      </div>
                    )}

                    {std.phone && (
                      <div className="teacher-std-meta-row">
                        <Phone size={13} color="var(--tch-text-muted)" />
                        <span>{std.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="teacher-std-card-footer">
                  <span className="tch-pill emerald">
                    <CheckCircle2 size={11} /> Enrolled
                  </span>

                  <button
                    type="button"
                    className="tch-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    onClick={() => onSelectStudent?.(sid)}
                  >
                    <Eye size={13} />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
