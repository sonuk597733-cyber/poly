import React, { useState } from "react";
import MasterAttendanceStudio from "../../components/attendance/MasterAttendanceStudio";
import TeachingAttendanceCalendar from "../../components/attendance/TeachingAttendanceCalendar";
import "./HODAttendance.css";

export default function HODAttendance({ currentUser, stats }) {
  const [activeMode, setActiveMode] = useState("calendar");

  return (
    <div className="staff-attendance-page-container">
      {activeMode === "calendar" ? (
        <TeachingAttendanceCalendar
          staffRole="hod"
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
              ← Back to Department Attendance Calendar
            </button>
          </div>
          <MasterAttendanceStudio currentUser={currentUser} staffRole="hod" />
        </div>
      )}
    </div>
  );
}
