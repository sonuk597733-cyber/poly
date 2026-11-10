import React, { useState, useEffect } from "react";
import { Bell, Send, Plus, Filter, Tag, Calendar, User, CheckCircle2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorNotices.css";

const STATIC_NOTICES = [
  { id: "NOT-01", title: "Mid-Semester Examination Schedule Notification", content: "The centralized schedule for 1st Mid-Semester Continuous Evaluation for all diploma branches has been released. Examinations commence 15 November 2026.", targetAudience: "All Polytechnic Candidates & Faculty", date: "26 Oct 2026", priority: "High" },
  { id: "NOT-02", title: "Phase 1 Continuous Evaluation Marks Submission Deadline", content: "All course instructors are instructed to finalize and upload continuous evaluation marks for Unit 1 by 30 October 2026 on the CollegeOS portal.", targetAudience: "Faculty Members", date: "24 Oct 2026", priority: "Normal" },
  { id: "NOT-03", title: "CAD/CAM Laboratory Maintenance and Tool Calibration Schedule", content: "CAD/CAM Lab will remain closed for bi-annual maintenance and workstation Linux upgrades on Saturday, 01 November 2026.", targetAudience: "Mechanical & Civil Departments", date: "22 Oct 2026", priority: "Low" }
];

export default function CoordinatorNotices({ showToast }) {
  const [notices, setNotices] = useState(STATIC_NOTICES);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetAudience: "All",
    priority: "Normal"
  });

  const fetchNotices = () => {
    setLoading(true);
    authApi
      .getNotices()
      .then((res) => {
        if (res?.notices && res.notices.length > 0) {
          setNotices([...res.notices, ...STATIC_NOTICES]);
        }
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
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast?.("Please complete the title and message content", true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.createNotice({
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetAudience: formData.targetAudience.toLowerCase(),
        priority: formData.priority.toLowerCase()
      });
      const created = res?.notice || {
        id: `NOT-${Date.now()}`,
        ...formData,
        date: "Today"
      };
      setNotices([created, ...notices]);
      setShowCreateModal(false);
      setFormData({ title: "", content: "", targetAudience: "All", priority: "Normal" });
      showToast?.("Academic circular broadcasted successfully!");
    } catch (err) {
      showToast?.(err.message || "Failed to broadcast notice", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="coord-notices-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Academic Coordination Notices & Circulars</h2>
          <p>
            Publish schedule notifications, exam announcements, classroom advisories, and syllabus circulars.
          </p>
        </div>

        <button
          type="button"
          className="coord-create-notice-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          <span>Broadcast Notice</span>
        </button>
      </div>

      {/* Notices Feed */}
      <div className="coord-notices-feed">
        {notices.map((n, idx) => (
          <div key={n.id || idx} className="coord-notice-card">
            <div className="coord-notice-card-header">
              <div className="coord-notice-tag-row">
                <span className={`coord-notice-pri-pill ${(n.priority || "normal").toLowerCase()}`}>
                  {n.priority || "Normal"} Priority
                </span>
                <span className="coord-notice-aud-pill">
                  Audience: {n.targetAudience || "All"}
                </span>
              </div>
              <span className="coord-notice-date">{n.date || "Active Notice"}</span>
            </div>

            <h3 className="coord-notice-card-title">{n.title}</h3>
            <p className="coord-notice-card-text">{n.content}</p>

            <div className="coord-notice-card-footer">
              <span className="coord-notice-author">
                <Bell size={13} color="#0284C7" />
                Published by Central Academic Coordination Cell
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Modal */}
      {showCreateModal && (
        <div className="coord-modal-backdrop">
          <div className="coord-modal-box">
            <div className="coord-modal-header">
              <h3>Broadcast Academic Circular</h3>
              <button
                type="button"
                className="coord-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="coord-modal-form">
              <div className="coord-form-group">
                <label>Circular Subject / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Second Mid-Term Continuous Assessments"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="coord-form-row">
                <div className="coord-form-group">
                  <label>Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  >
                    <option value="All">All Students & Faculty</option>
                    <option value="Students">Diploma Candidates Only</option>
                    <option value="Faculty">Faculty Members Only</option>
                    <option value="Staff">Department Staff</option>
                  </select>
                </div>

                <div className="coord-form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High (Urgent)</option>
                    <option value="Low">Low (Informational)</option>
                  </select>
                </div>
              </div>

              <div className="coord-form-group">
                <label>Circular Content & Detailed Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide circular text, dates, affected courses, or reporting times..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="coord-modal-actions">
                <button
                  type="button"
                  className="coord-btn secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="coord-btn primary" disabled={submitting}>
                  <Send size={14} />
                  <span>{submitting ? "Broadcasting..." : "Broadcast Notice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
