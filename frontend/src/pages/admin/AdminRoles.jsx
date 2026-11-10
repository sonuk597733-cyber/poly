import React from "react";
import { ShieldCheck, CheckCircle2, XCircle, Lock, Users, Info } from "lucide-react";
import "./AdminDashboard.css";

const ROLE_PERMISSIONS = [
  {
    module: "Student Academic Overview",
    student: true,
    teacher: true,
    hod: true,
    coordinator: true,
    principal: true,
    admin: true
  },
  {
    module: "Mark Daily Attendance",
    student: false,
    teacher: true,
    hod: true,
    coordinator: true,
    principal: false,
    admin: true
  },
  {
    module: "Continuous Assessment & Exam Grading",
    student: false,
    teacher: true,
    hod: true,
    coordinator: false,
    principal: false,
    admin: true
  },
  {
    module: "Department Master Timetable Edit",
    student: false,
    teacher: false,
    hod: true,
    coordinator: true,
    principal: true,
    admin: true
  },
  {
    module: "Leave Application Sanction & Approval",
    student: false,
    teacher: false,
    hod: true,
    coordinator: true,
    principal: true,
    admin: true
  },
  {
    module: "Broadcast Campus Notices & Circulars",
    student: false,
    teacher: true,
    hod: true,
    coordinator: true,
    principal: true,
    admin: true
  },
  {
    module: "User Provisioning & Account Suspension",
    student: false,
    teacher: false,
    hod: false,
    coordinator: false,
    principal: false,
    admin: true
  },
  {
    module: "System Key-Value Configuration & Maintenance",
    student: false,
    teacher: false,
    hod: false,
    coordinator: false,
    principal: false,
    admin: true
  }
];

export default function AdminRoles({ currentUser }) {
  return (
    <div className="admin-dash-container">
      <div className="pane-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
          Role-Based Access Control (RBAC) Matrix
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
          Granular permission matrix enforced server-side via Express authorization middleware across all endpoints.
        </p>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, background: "#EFF6FF", color: "#1D4ED8", marginBottom: 20 }}>
          <Info size={16} />
          <span style={{ fontSize: "0.85rem" }}>
            All API routes enforce strict server-side token decoding and verify role authorizations against MongoDB before handling requests.
          </span>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Functional Capability</th>
              <th style={{ textAlign: "center" }}>Student</th>
              <th style={{ textAlign: "center" }}>Teacher</th>
              <th style={{ textAlign: "center" }}>HOD</th>
              <th style={{ textAlign: "center" }}>Coordinator</th>
              <th style={{ textAlign: "center" }}>Principal</th>
              <th style={{ textAlign: "center" }}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {ROLE_PERMISSIONS.map((p, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600, color: "#0F172A" }}>{p.module}</td>
                <td style={{ textAlign: "center" }}>
                  {p.student ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#CBD5E1" />}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.teacher ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#CBD5E1" />}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.hod ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#CBD5E1" />}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.coordinator ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#CBD5E1" />}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.principal ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#CBD5E1" />}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.admin ? <CheckCircle2 size={16} color="#16A34A" /> : <XCircle size={16} color="#CBD5E1" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
