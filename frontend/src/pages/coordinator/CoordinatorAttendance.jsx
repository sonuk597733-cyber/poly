import React, { useState } from "react";
import MasterAttendanceStudio from "../../components/attendance/MasterAttendanceStudio";
import TeachingAttendanceCalendar from "../../components/attendance/TeachingAttendanceCalendar";
import "./CoordinatorAttendance.css";

export default function CoordinatorAttendance({ currentUser, showToast }) {
  const [activeMode, setActiveMode] = useState("calendar");

  return (
    <div className="staff-attendance-page-container">
      {activeMode === "calendar" ? (
        <TeachingAttendanceCalendar
          staffRole="coordinator"
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
              ← Back to Academic Coordinator Attendance Calendar
            </button>
          </div>
          <MasterAttendanceStudio currentUser={currentUser} staffRole="coordinator" />
        </div>
      )}
    </div>
  );
}
