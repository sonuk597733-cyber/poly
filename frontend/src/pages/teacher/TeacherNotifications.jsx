import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, Clock, Inbox, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherNotifications.css";

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function TeacherNotifications({ showToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    authApi
      .getNotifications()
      .then((res) => {
        setNotifications(res?.notifications || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        setNotifications([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await authApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      showToast?.("Notification marked as read.");
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await authApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast?.("All notifications marked as read.");
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="teacher-role-view teacher-notif-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <Bell size={24} color="var(--tch-primary)" />
            Faculty Notifications & Institutional Alerts
          </h2>
          <p>Real-time updates regarding student submissions, examination cell notices, and departmental circulars.</p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="tch-btn-secondary"
            onClick={handleMarkAllRead}
          >
            <CheckCircle2 size={15} />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tch-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Retrieving faculty notification stream...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="tch-empty-box">
          <Inbox size={42} style={{ opacity: 0.6 }} />
          <h3>All Caught Up</h3>
          <p>No unread faculty notifications or administrative alerts at this time. New messages will appear automatically.</p>
        </div>
      ) : (
        <div className="teacher-notif-list">
          {notifications.map((n) => {
            const notifId = n._id || n.id;
            const isUnread = !n.isRead;
            const timeAgo = formatRelativeTime(n.createdAt || n.timestamp);

            return (
              <div
                key={notifId}
                className={`tch-card teacher-notif-card ${isUnread ? "unread" : ""}`}
              >
                <div className="teacher-notif-main">
                  <div className="teacher-notif-top">
                    <span className={`tch-pill ${isUnread ? "blue" : "cyan"}`}>
                      {n.type || "Faculty Alert"}
                    </span>
                    <span className="teacher-notif-time">
                      <Clock size={12} />
                      {timeAgo}
                    </span>
                  </div>

                  <h4 className="teacher-notif-title">{n.title}</h4>
                  <p className="teacher-notif-msg">{n.message || n.desc || n.content}</p>
                </div>

                {isUnread && (
                  <div className="teacher-notif-action">
                    <button
                      type="button"
                      className="tch-btn-secondary"
                      style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                      onClick={() => handleMarkRead(notifId)}
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Read</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
