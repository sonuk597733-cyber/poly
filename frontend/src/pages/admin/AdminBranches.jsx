import React from "react";
import { Layers, Building2, Users, CheckCircle2 } from "lucide-react";
import "./AdminDashboard.css";

const DEPARTMENTS = [
  { code: "CSE", name: "Computer Science & Engineering", seats: 120, semesters: "1 through 6", hod: "Dr. Rajesh Verma", status: "Active & Accredited" },
  { code: "IT", name: "Information Technology", seats: 60, semesters: "1 through 6", hod: "Dr. Rajesh Verma", status: "Active & Accredited" },
  { code: "ME", name: "Mechanical Engineering", seats: 120, semesters: "1 through 6", hod: "Prof. Sunil Kumar", status: "Active & Accredited" },
  { code: "EE", name: "Electrical Engineering", seats: 90, semesters: "1 through 6", hod: "Dr. Meenakshi Sundaram", status: "Active & Accredited" },
  { code: "CE", name: "Civil Engineering", seats: 90, semesters: "1 through 6", hod: "Er. Neha Agarwal", status: "Active & Accredited" },
  { code: "ECE", name: "Electronics & Communication", seats: 60, semesters: "1 through 6", hod: "Dr. Rohit Gupta", status: "Active & Accredited" }
];

export default function AdminBranches({ currentUser }) {
  return (
    <div className="admin-dash-container">
      <div className="pane-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
          Polytechnic Department & Branch Setup
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
          Approved polytechnic engineering disciplines, semester allocations, and approved student intake quotas.
        </p>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Branch Code</th>
              <th>Department Name</th>
              <th>Approved Seats</th>
              <th>Active Semesters</th>
              <th>Head of Department</th>
              <th>Accreditation Status</th>
            </tr>
          </thead>
          <tbody>
            {DEPARTMENTS.map((dept) => (
              <tr key={dept.code}>
                <td>
                  <span style={{ fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "#EFF6FF", color: "#1D4ED8" }}>
                    {dept.code}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: "#0F172A" }}>{dept.name}</td>
                <td>{dept.seats} Candidates</td>
                <td>{dept.semesters}</td>
                <td>{dept.hod}</td>
                <td>
                  <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, background: "#DCFCE7", color: "#15803D" }}>
                    {dept.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
