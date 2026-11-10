import React, { useState, useEffect } from "react";
import { Users, Search, UserCheck, UserX, Shield, Mail, Key, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./AdminDashboard.css";

export default function AdminUsers({ currentUser, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    authApi
      .getManagementUsers()
      .then((res) => {
        setUsers(res?.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        showToast?.(err.message || "Failed to load user directory", true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "inactive" ? "active" : "inactive";
    setUpdatingId(user.id || user._id);
    try {
      await authApi.updateUserStatus(user.id || user._id, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          (u.id === user.id || u._id === user._id) ? { ...u, status: newStatus } : u
        )
      );
      showToast?.(`Account for ${user.fullName} marked as ${newStatus}.`);
    } catch (err) {
      showToast?.(err.message || "Failed to update user status", true);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.fullName || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchRole = (u.role || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchRole;
    }
    return true;
  });

  return (
    <div className="admin-dash-container">
      <div className="pane-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
            Enterprise User Directory & Access Control
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
            Provision institutional accounts, manage active states, and audit RBAC privileges across CollegeOS.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
          >
            <option value="all">All Institutional Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Faculty Instructors</option>
            <option value="hod">Heads of Department</option>
            <option value="coordinator">Coordinators</option>
            <option value="principal">Principal / Leadership</option>
            <option value="admin">System Administrators</option>
          </select>

          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.85rem", width: 240 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: 20 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role Assignment</th>
                <th>Email / Contact</th>
                <th>Branch / Department</th>
                <th>Account Status</th>
                <th>Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const isInactive = user.status === "inactive";
                const isUpdating = updatingId === (user.id || user._id);

                return (
                  <tr key={user.id || user._id}>
                    <td>
                      <strong>{user.fullName || "Subharti Scholar"}</strong>
                      <div className="mono-sub">ID: {user.id || user._id}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "#EFF6FF",
                          color: "#1D4ED8"
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#475569" }}>{user.email}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#0F172A" }}>
                        {user.branch || user.department || "Campus-Wide"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: isInactive ? "#FEE2E2" : "#DCFCE7",
                          color: isInactive ? "#B91C1C" : "#15803D"
                        }}
                      >
                        {isInactive ? "Suspended" : "Active & Verified"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={isUpdating || user.role === "admin"}
                        onClick={() => handleToggleStatus(user)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: user.role === "admin" ? "not-allowed" : "pointer",
                          background: isInactive ? "#DCFCE7" : "#FEE2E2",
                          color: isInactive ? "#15803D" : "#B91C1C",
                          border: "none"
                        }}
                      >
                        {isUpdating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isInactive ? (
                          <>
                            <UserCheck size={13} /> Re-activate Account
                          </>
                        ) : (
                          <>
                            <UserX size={13} /> Deactivate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
