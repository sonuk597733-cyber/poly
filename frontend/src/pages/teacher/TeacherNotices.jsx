import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Send,
  Calendar,
  Search,
  ShieldCheck,
  X,
  Loader2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherNotices.css";

export default function TeacherNotices({ showToast }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Academic");
  const [priority, setPriority] = useState("normal");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = () => {
    authApi
      .getNotices()
      .then((res) => {
        setNotices(res?.notices || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast?.("Title and content are required.", true);
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
      showToast?.(res.message || "Announcement published to college portal!");
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

  const filtered = notices.filter((n) => {
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="teacher-role-view teacher-notices-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <Bell size={24} color="var(--tch-primary)" />
            Notices & Campus Communications
          </h2>
          <p>Publish official classroom circulars, lab project deadlines, and department alerts to enrolled classes.</p>
        </div>

        <button
          type="button"
          className="tch-btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          <span>{showCreate ? "Close Publisher" : "Publish Announcement"}</span>
        </button>
      </div>

      {/* Notice Create Form Card */}
      {showCreate && (
        <div className="tch-card teacher-notices-form-card">
          <div className="tch-pane-header" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--tch-text-primary)" }}>
              Publish Official Class or Department Notice
            </h3>
          </div>

          <form onSubmit={handleCreateNotice}>
            <div className="teacher-notices-form-grid">
              <div style={{ gridColumn: "span 2" }}>
                <label className="tch-label">Notice Headline</label>
                <input
                  type="text"
                  className="tch-input"
                  placeholder="e.g. Lab 4 Viva & Submission Deadline Update"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="tch-label">Category</label>
                <select
                  className="tch-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Academic">Academic</option>
                  <option value="Examination">Examination</option>
                  <option value="Placement">Placement</option>
                  <option value="Administrative">Administrative</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="tch-label">Priority Level</label>
                <select
                  className="tch-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="tch-label">Detailed Notice Text</label>
              <textarea
                rows={4}
                className="tch-textarea"
                placeholder="Include room venues, specific deadlines, and required preparations..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="tch-btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tch-btn-primary"
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                <span>{submitting ? "Publishing..." : "Publish Circular"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div style={{ position: "relative", minWidth: 260 }}>
          <Search size={16} color="var(--tch-text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="tch-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search circulars by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="tch-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "auto", minWidth: 140 }}
          >
            <option value="all">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Examination">Examination</option>
            <option value="Placement">Placement</option>
            <option value="Administrative">Administrative</option>
          </select>
          <span className="tch-pill blue">{filtered.length} Circulars</span>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tch-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading circular notices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tch-empty-box">
          <Bell size={40} style={{ opacity: 0.6 }} />
          <h3>No Circular Notices Found</h3>
          <p>Click "Publish Announcement" above to broadcast classroom directives or lab schedules.</p>
        </div>
      ) : (
        <div className="teacher-notices-grid">
          {filtered.map((n) => {
            const dateStr = n.createdAt
              ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })
              : "Recent";

            return (
              <div key={n._id || n.id} className="tch-card teacher-notice-card">
                <div>
                  <div className="teacher-notice-card-top">
                    <span className={`tch-pill ${n.priority === "urgent" ? "rose" : n.priority === "important" ? "amber" : "blue"}`}>
                      {(n.priority || "Normal").toUpperCase()} Priority
                    </span>
                    <span className="tch-pill cyan">{n.category || "Academic"}</span>
                  </div>

                  <h3 className="teacher-notice-card-title">{n.title}</h3>
                  <p className="teacher-notice-card-content">{n.content}</p>
                </div>

                <div className="teacher-notice-card-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--tch-text-muted)" }}>
                    <Calendar size={13} />
                    <span>{dateStr}</span>
                  </div>

                  <span className="teacher-notice-author">
                    <ShieldCheck size={14} color="var(--tch-primary)" />
                    <span>{n.postedBy?.fullName || "Faculty Lead"}</span>
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
