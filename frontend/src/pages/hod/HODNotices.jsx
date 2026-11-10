import React, { useState, useEffect } from "react";
import { Bell, Plus, Send, Calendar, Loader2, Sparkles, AlertCircle, X, ShieldCheck } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODNotices.css";

export default function HODNotices({ showToast }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Academic");
  const [priority, setPriority] = useState("important");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = () => {
    setLoading(true);
    authApi
      .getNotices()
      .then((res) => {
        setNotices(res?.notices || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notices:", err);
        setNotices([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast?.("Circular title and body content are required.", true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.createNotice({
        title: title.trim(),
        category,
        priority,
        content: content.trim()
      });
      showToast?.(res.message || "Department circular dispatched successfully!");
      setTitle("");
      setContent("");
      setShowCreate(false);
      fetchNotices();
    } catch (err) {
      showToast?.(err.message || "Failed to publish notice.", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hod-role-view hod-notices-container">
      {/* Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <Bell size={24} color="var(--hod-primary)" />
            Department Circulars & Official Announcements
          </h2>
          <p>Dispatched by Head of Department to faculty staff, laboratory demonstrators, and enrolled candidates.</p>
        </div>

        <button
          type="button"
          className="hod-btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          <span>{showCreate ? "Cancel Broadcast" : "Publish Department Circular"}</span>
        </button>
      </div>

      {/* Creation Modal / Drawer */}
      {showCreate && (
        <div className="hod-card hod-notice-form-card">
          <div className="hod-notice-form-header">
            <h3>Issue Department Circular</h3>
            <p>Broadcast formal academic directives or administrative advisories</p>
          </div>

          <form onSubmit={handleCreateNotice} className="hod-notice-form">
            <div className="hod-notice-form-grid">
              <div className="hod-notice-field full">
                <label className="hod-label">Circular Title / Headline</label>
                <input
                  type="text"
                  className="hod-input"
                  placeholder="e.g. Schedule for 5th Semester Mini-Project Evaluations & Viva"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="hod-notice-field">
                <label className="hod-label">Category</label>
                <select
                  className="hod-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Academic">Academic Schedule</option>
                  <option value="Examination">Examination & Viva</option>
                  <option value="Faculty Meeting">Faculty Council</option>
                  <option value="Administrative">Administrative Memo</option>
                  <option value="Holiday">Institutional Holiday</option>
                </select>
              </div>

              <div className="hod-notice-field">
                <label className="hod-label">Priority Level</label>
                <select
                  className="hod-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="important">Important Advisory</option>
                  <option value="urgent">Urgent Notification</option>
                  <option value="normal">General Information</option>
                </select>
              </div>
            </div>

            <div className="hod-notice-field full">
              <label className="hod-label">Circular Content & Instructions</label>
              <textarea
                rows={4}
                className="hod-textarea"
                placeholder="Provide complete circular details, deadlines, and room instructions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="hod-notice-form-actions">
              <button
                type="button"
                className="hod-btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="hod-btn-primary"
                disabled={submitting}
              >
                <Send size={15} />
                <span>{submitting ? "Dispatching..." : "Dispatch Circular"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices Stream */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--hod-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Retrieving department circular stream...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="hod-empty-box">
          <Bell size={42} style={{ opacity: 0.5 }} />
          <h3>No Department Circulars Active</h3>
          <p>Official notices published by the department will appear in this stream.</p>
        </div>
      ) : (
        <div className="hod-notices-feed">
          {notices.map((n) => {
            const isUrgent = n.priority === "urgent";
            const isImportant = n.priority === "important";

            return (
              <div key={n._id || n.id} className="hod-card hod-notice-full-card">
                <div className="hod-notice-card-header">
                  <div className="hod-notice-badges">
                    <span
                      className={`hod-pill ${
                        isUrgent ? "rose" : isImportant ? "amber" : "indigo"
                      }`}
                    >
                      {n.priority ? n.priority.toUpperCase() : "GENERAL"}
                    </span>
                    <span className="hod-pill violet">{n.category || "Academic"}</span>
                  </div>

                  <span className="hod-notice-date-meta">
                    <Calendar size={13} />
                    <span>
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "Recent"}
                    </span>
                  </span>
                </div>

                <h3 className="hod-notice-card-title">{n.title}</h3>
                <p className="hod-notice-card-body">{n.content}</p>

                <div className="hod-notice-card-footer">
                  <span>Authorized By: <strong>{n.postedBy?.fullName || "Office of the HOD"}</strong></span>
                  <span className="hod-pill emerald">
                    <ShieldCheck size={12} />
                    Verified Department Circular
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
