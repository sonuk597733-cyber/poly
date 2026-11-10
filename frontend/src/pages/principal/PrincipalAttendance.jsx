import React, { useState } from "react";
import MasterAttendanceStudio from "../../components/attendance/MasterAttendanceStudio";
import TeachingAttendanceCalendar from "../../components/attendance/TeachingAttendanceCalendar";
import "./PrincipalAttendance.css";

export default function PrincipalAttendance({ currentUser, showToast }) {
  const [activeMode, setActiveMode] = useState("calendar");

  return (
    <div className="staff-attendance-page-container">
      {activeMode === "calendar" ? (
        <TeachingAttendanceCalendar
          staffRole="principal"
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
              ← Back to Institutional Attendance Intelligence
            </button>
          </div>
          <MasterAttendanceStudio currentUser={currentUser} staffRole="principal" />
        </div>
      )}
    </div>
  );
}
