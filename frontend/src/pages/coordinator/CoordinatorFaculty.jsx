import React, { useState, useEffect } from "react";
import { UserCog, Search, Mail, Building2, BookOpen, Clock, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorFaculty.css";

const INITIAL_FACULTY_MEMBERS = [
  { id: "FAC-01", name: "Dr. Rajesh Verma", dept: "CSE", designation: "Professor & HOD", subjects: ["Operating Systems", "Cloud Computing"], workload: "16 hrs/wk", room: "Faculty Room 102", email: "rajesh.verma@subharti.edu", status: "Active" },
  { id: "FAC-02", name: "Er. Amit Sharma", dept: "CSE", designation: "Assistant Professor", subjects: ["Data Structures Lab", "Algorithms"], workload: "18 hrs/wk", room: "Faculty Room 104", email: "amit.sharma@subharti.edu", status: "Active" },
  { id: "FAC-03", name: "Prof. Sunil Kumar", dept: "Mechanical", designation: "Associate Professor & HOD", subjects: ["Thermodynamics", "Fluid Mechanics"], workload: "16 hrs/wk", room: "ME Annex 201", email: "sunil.kumar@subharti.edu", status: "Active" },
  { id: "FAC-04", name: "Er. Vikas Tyagi", dept: "Mechanical", designation: "Lecturer & Workshop Sup.", subjects: ["CAD/CAM Lab", "Manufacturing Tech"], workload: "20 hrs/wk", room: "Workshop Block", email: "vikas.tyagi@subharti.edu", status: "Active" },
  { id: "FAC-05", name: "Dr. Meenakshi Sundaram", dept: "Electrical", designation: "Professor & HOD", subjects: ["Circuit Analysis", "Electrical Machines"], workload: "15 hrs/wk", room: "EE Block 101", email: "meenakshi.s@subharti.edu", status: "Active" },
  { id: "FAC-06", name: "Er. Rahul Singh", dept: "Electrical", designation: "Assistant Professor", subjects: ["Power Systems", "Control Systems Lab"], workload: "18 hrs/wk", room: "EE Block 103", email: "rahul.singh@subharti.edu", status: "Active" },
  { id: "FAC-07", name: "Er. Neha Agarwal", dept: "Civil", designation: "Associate Professor & HOD", subjects: ["Structural Analysis", "Surveying Lab"], workload: "16 hrs/wk", room: "CE Wing 301", email: "neha.agarwal@subharti.edu", status: "Active" },
  { id: "FAC-08", name: "Er. Deepak Sharma", dept: "Civil", designation: "Lecturer", subjects: ["Concrete Tech", "Hydraulics"], workload: "18 hrs/wk", room: "CE Wing 304", email: "deepak.sharma@subharti.edu", status: "Active" },
  { id: "FAC-09", name: "Dr. Rohit Gupta", dept: "ECE", designation: "Associate Professor & HOD", subjects: ["Digital Electronics", "Microprocessors"], workload: "17 hrs/wk", room: "ECE Lab Block", email: "rohit.gupta@subharti.edu", status: "Active" },
  { id: "FAC-10", name: "Er. Pooja Verma", dept: "Applied Sciences", designation: "Assistant Professor", subjects: ["Engineering Mathematics", "Physics"], workload: "19 hrs/wk", room: "Science Wing 105", email: "pooja.verma@subharti.edu", status: "Active" }
];

export default function CoordinatorFaculty({ currentUser }) {
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    authApi
      .getManagementUsers({ role: "teacher" })
      .then((res) => {
        if (!isMounted) return;
        const users = res?.users || [];
        if (users.length > 0) {
          const mapped = users.map((u, idx) => ({
            id: u.employeeId || u._id || `FAC-${idx + 1}`,
            name: u.fullName || `Faculty Member ${idx + 1}`,
            dept: u.branch || u.department || "CSE",
            designation: u.designation || "Lecturer",
            subjects: [u.subject || "Polytechnic Engineering Studies", "Lab Demonstrations"],
            workload: u.workload || "18 hrs/wk",
            room: u.roomNo || "Faculty Room 102",
            email: u.email || `${u.username || "teacher"}@subharti.edu`,
            status: u.status === "inactive" ? "Inactive" : "Active"
          }));
          setFacultyMembers(mapped);
        } else {
          setFacultyMembers(INITIAL_FACULTY_MEMBERS);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load faculty:", err);
        setFacultyMembers(INITIAL_FACULTY_MEMBERS);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = facultyMembers.filter((f) => {
    if (deptFilter !== "all" && f.dept !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchSubj = f.subjects.some((s) => s.toLowerCase().includes(q));
      return matchName || matchSubj;
    }
    return true;
  });

  return (
    <div className="coord-fac-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Polytechnic Faculty Directory & Workload</h2>
          <p>
            Central coordination of instructional faculty, lecture commitments, teaching hours, and cabin allocations.
          </p>
        </div>

        <div className="coord-filter-controls">
          <div className="coord-search-box">
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search faculty by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="coord-filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ME">Mechanical</option>
            <option value="EE">Electrical</option>
            <option value="CE">Civil</option>
            <option value="ECE">ECE</option>
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="coord-fac-stats-bar">
        <div className="coord-fac-stat-chip">
          <UserCog size={15} />
          <span>Total Faculty: <strong>{facultyMembers.length} Active</strong></span>
        </div>
        <div className="coord-fac-stat-chip">
          <Clock size={15} />
          <span>Average Workload: <strong>17.2 hrs/wk</strong></span>
        </div>
        <div className="coord-fac-stat-chip">
          <CheckCircle2 size={15} color="#059669" />
          <span>Schedule Compliance: <strong>98.6%</strong></span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        /* Faculty Cards Grid */
        <div className="coord-fac-grid">
          {filtered.map((faculty) => (
            <div key={faculty.id} className="coord-fac-card">
              <div className="coord-fac-card-header">
                <div className="coord-fac-avatar">
                  {faculty.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="coord-fac-name-block">
                  <h4>{faculty.name}</h4>
                  <span className="coord-fac-role">{faculty.designation}</span>
                </div>
              </div>

              <div className="coord-fac-details">
                <div className="coord-fac-meta-item">
                  <Building2 size={14} />
                  <span>{faculty.dept} Department</span>
                </div>
                <div className="coord-fac-meta-item">
                  <Clock size={14} />
                  <span>Workload: <strong>{faculty.workload}</strong></span>
                </div>
                <div className="coord-fac-meta-item">
                  <Mail size={14} />
                  <a href={`mailto:${faculty.email}`} style={{ color: "#2563EB", textDecoration: "none" }}>
                    {faculty.email}
                  </a>
                </div>
              </div>

              <div className="coord-fac-subjects">
                <span className="label">Assigned Teaching:</span>
                <div className="coord-fac-subj-tags">
                  {faculty.subjects.map((s, idx) => (
                    <span key={idx} className="coord-fac-subj-chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
