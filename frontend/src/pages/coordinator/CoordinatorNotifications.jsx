import React, { useState, useEffect } from "react";
import { Inbox, CheckCheck, CheckCircle2, Clock, Bell, AlertCircle, Info } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorNotifications.css";

const STATIC_COORD_NOTIFS = [
  { id: "NT-01", title: "Compensatory Lab Request Submitted by Er. Amit Sharma", message: "Special 2-hour session requested for Data Structures Lab in Lab-1 on Saturday.", time: "15 mins ago", isRead: false, type: "approval" },
  { id: "NT-02", title: "Classroom Allocation Conflict Resolved: LT-101", message: "Operating Systems timetable confirmed with zero clashes with Applied Sciences.", time: "2 hours ago", isRead: false, type: "timetable" },
  { id: "NT-03", title: "Low Attendance Warning Threshold Reached", message: "5 candidates have dropped below 75% statutory requirement in 3rd Semester.", time: "5 hours ago", isRead: true, type: "attendance" },
  { id: "NT-04", title: "Duty Leave Endorsement Required: Prof. Sunil Kumar", message: "Leave application submitted with alternative arrangement allocated to Er. Vikas Tyagi.", time: "1 day ago", isRead: true, type: "leave" }
];

export default function CoordinatorNotifications({ showToast }) {
  const [notifications, setNotifications] = useState(STATIC_COORD_NOTIFS);
  const [loading, setLoading] = useState(false);
  const [filterRead, setFilterRead] = useState("all");

  const fetchNotifs = () => {
    setLoading(true);
    authApi
      .getNotifications()
      .then((res) => {
        if (res?.notifications && res.notifications.length > 0) {
          setNotifications([...res.notifications, ...STATIC_COORD_NOTIFS]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await authApi.markNotificationRead(id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      showToast?.("Notification marked as read");
    } catch {
      // optimistic update
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await authApi.markAllNotificationsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast?.("All academic coordination notifications marked as read");
    } catch {
      // optimistic update
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterRead === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="coord-notifs-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Academic Coordination Notifications & Alerts</h2>
          <p>
            Real-time administrative feed for timetable swaps, classroom bookings, and student threshold warnings.
          </p>
        </div>

        <div className="coord-filter-controls">
          <div className="coord-read-tabs">
            <button
              type="button"
              className={`coord-read-tab ${filterRead === "all" ? "active" : ""}`}
              onClick={() => setFilterRead("all")}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              type="button"
              className={`coord-read-tab ${filterRead === "unread" ? "active" : ""}`}
              onClick={() => setFilterRead("unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="coord-mark-all-btn"
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="coord-notifs-list">
        {filtered.length === 0 ? (
          <div className="coord-notifs-empty">
            <Inbox size={36} color="#94A3B8" />
            <h3>No notifications to display</h3>
            <p>You are all caught up with your academic coordination alerts.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`coord-notif-card ${!n.isRead ? "unread" : ""}`}
            >
              <div className="coord-notif-icon-col">
                <div className={`coord-notif-icon-wrap ${n.type || "info"}`}>
                  <Bell size={18} />
                </div>
              </div>

              <div className="coord-notif-content-col">
                <div className="coord-notif-title-row">
                  <h4>{n.title}</h4>
                  <span className="coord-notif-time">{n.time || "Recently"}</span>
                </div>
                <p>{n.message || n.content}</p>
              </div>

              {!n.isRead && (
                <div className="coord-notif-action-col">
                  <button
                    type="button"
                    className="coord-mark-read-btn"
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark Read"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
