import React, { useState, useEffect } from "react";
import { Bell, Plus, Calendar, Tag, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalDashboard.css";

export default function PrincipalNotices({ currentUser, showToast }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    category: "Administrative",
    priority: "urgent"
  });

  const loadNotices = () => {
    setLoading(true);
    authApi
      .getNotices()
      .then((res) => {
        setNotices(res?.notices || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notices:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) {
      showToast?.("Please provide title and content", true);
      return;
    }
    setSubmitting(true);
    try {
      await authApi.createNotice(newNotice);
      showToast?.("Executive Circular broadcasted successfully!");
      setShowModal(false);
      setNewNotice({ title: "", content: "", category: "Administrative", priority: "urgent" });
      loadNotices();
    } catch (err) {
      showToast?.(err.message || "Failed to broadcast circular", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prin-dash-container">
      <div className="pane-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0F172A", fontWeight: 700 }}>
            Executive Notices & Campus Circulars
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
            Broadcast mandatory circulars, examination advisories, and administrative directives.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: "#2563EB", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          <Plus size={16} /> Broadcast Circular
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {notices.map((n) => (
            <div
              key={n.id || n._id}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                padding: "20px 24px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Bell size={16} color="#2563EB" />
                  <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0F172A" }}>{n.title}</h4>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: n.priority === "urgent" ? "#FEE2E2" : "#EFF6FF",
                    color: n.priority === "urgent" ? "#B91C1C" : "#1D4ED8"
                  }}
                >
                  {n.category || "Notice"} • {n.priority || "normal"}
                </span>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#475569", lineHeight: 1.5 }}>
                {n.content}
              </p>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                Posted by {n.authorName || "Office of the Principal"} • {new Date(n.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: "90%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#0F172A" }}>Broadcast Executive Circular</h3>
            <form onSubmit={handleCreateNotice}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  placeholder="e.g. Schedule for Board Examination Enrolment"
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Priority Level
                </label>
                <select
                  value={newNotice.priority}
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                >
                  <option value="urgent">Urgent / Directive</option>
                  <option value="high">High Priority</option>
                  <option value="normal">Standard Notice</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Notice Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  placeholder="Official notification text..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 16px", borderRadius: 8, background: "#2563EB", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  {submitting ? "Publishing..." : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
