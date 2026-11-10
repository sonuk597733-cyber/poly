import React, { useState } from "react";
import MasterAttendanceStudio from "../../components/attendance/MasterAttendanceStudio";
import TeachingAttendanceCalendar from "../../components/attendance/TeachingAttendanceCalendar";
import "./TeacherAttendance.css";

export default function TeacherAttendance({ currentUser, stats, showToast }) {
  // Mode: 'calendar' (default calendar-first) or 'studio' (roll-call marking studio)
  const [activeMode, setActiveMode] = useState("calendar");

  return (
    <div className="staff-attendance-page-container">
      {activeMode === "calendar" ? (
        <TeachingAttendanceCalendar
          staffRole="teacher"
          currentUser={currentUser}
          onOpenStudio={() => setActiveMode("studio")}
        />
      ) : (
        <div className="studio-wrapper">
          <div className="studio-top-nav-bar">
            <button
              type="button"
              className="btn-back-to-calendar"
              onClick={() => setActiveMode("calendar")}
            >
              ← Back to Daily Teaching Calendar
            </button>
          </div>
          <MasterAttendanceStudio currentUser={currentUser} staffRole="teacher" />
        </div>
      )}
    </div>
  );
}
