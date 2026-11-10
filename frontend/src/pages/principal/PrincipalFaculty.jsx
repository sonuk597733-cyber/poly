import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Building2, Briefcase, BookOpen, Clock, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalDashboard.css";

export default function PrincipalFaculty({ currentUser, showToast }) {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    authApi
      .getManagementUsers({ role: "teacher" })
      .then((res) => {
        if (!isMounted) return;
        setFaculty(res?.users || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load faculty directory:", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = faculty.filter((f) => {
    if (branchFilter !== "all" && f.branch !== branchFilter && f.department !== branchFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (f.fullName || "").toLowerCase().includes(q);
      const matchEmail = (f.email || "").toLowerCase().includes(q);
      const matchId = (f.employeeId || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchId;
    }
    return true;
  });

  return (
    <div className="prin-dash-container">
      <div className="pane-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
            Polytechnic Faculty Cadre & Staff Directory
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
            Oversee instructional faculty members across all 5 accredited engineering divisions.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
          >
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ME">Mechanical</option>
            <option value="EE">Electrical</option>
            <option value="CE">Civil</option>
            <option value="ECE">ECE</option>
          </select>

          <input
            type="text"
            placeholder="Search faculty by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.85rem", width: 220 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div className="student-ledger-card" style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", padding: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                <th style={{ padding: 12 }}>Faculty Name</th>
                <th style={{ padding: 12 }}>Employee ID</th>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Designation</th>
                <th style={{ padding: 12 }}>Contact Email</th>
                <th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: 12, fontWeight: 600, color: "#0F172A" }}>
                    {f.fullName}
                  </td>
                  <td style={{ padding: 12, color: "#475569" }}>
                    <code>{f.employeeId || `EMP-${idx + 1}`}</code>
                  </td>
                  <td style={{ padding: 12, color: "#2563EB", fontWeight: 600 }}>
                    {f.branch || f.department || "CSE"}
                  </td>
                  <td style={{ padding: 12, color: "#475569" }}>
                    {f.designation || "Lecturer"}
                  </td>
                  <td style={{ padding: 12, color: "#64748B" }}>
                    {f.email}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: f.status === "inactive" ? "#FEE2E2" : "#DCFCE7",
                      color: f.status === "inactive" ? "#B91C1C" : "#15803D"
                    }}>
                      {f.status === "inactive" ? "Inactive" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
