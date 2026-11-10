import React, { useState, useEffect } from "react";
import { Inbox, CheckCircle2, Clock, Bell, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODNotifications.css";

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

export default function HODNotifications({ showToast }) {
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
    <div className="hod-role-view hod-notif-container">
      {/* Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <Bell size={24} color="var(--hod-primary)" />
            Department Leadership Alerts & Inbound Notices
          </h2>
          <p>Administrative alerts, pending faculty leaves, exam score approvals, and academic council circulars.</p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="hod-btn-secondary"
            onClick={handleMarkAllRead}
          >
            <CheckCircle2 size={15} />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Main Stream */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--hod-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Retrieving department alert queue...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="hod-empty-box">
          <Inbox size={42} style={{ opacity: 0.5 }} />
          <h3>All Caught Up</h3>
          <p>No unread department leadership alerts at this time. New messages will appear automatically.</p>
        </div>
      ) : (
        <div className="hod-notif-list">
          {notifications.map((n) => {
            const notifId = n._id || n.id;
            const isUnread = !n.isRead;
            const timeAgo = formatRelativeTime(n.createdAt || n.timestamp);

            return (
              <div
                key={notifId}
                className={`hod-card hod-notif-card ${isUnread ? "unread" : ""}`}
              >
                <div className="hod-notif-main">
                  <div className="hod-notif-top">
                    <span className={`hod-pill ${isUnread ? "indigo" : "cyan"}`}>
                      {n.type || "Executive Alert"}
                    </span>
                    <span className="hod-notif-time">
                      <Clock size={12} />
                      {timeAgo}
                    </span>
                  </div>

                  <h4 className="hod-notif-title">{n.title}</h4>
                  <p className="hod-notif-msg">{n.message || n.desc || n.content}</p>
                </div>

                {isUnread && (
                  <div className="hod-notif-action">
                    <button
                      type="button"
                      className="hod-btn-secondary"
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
