import React, { useState, useEffect } from "react";
import { Layers, Users, BookOpen, Clock, CalendarCheck2, FileText, Loader2, MapPin } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherClasses.css";

export default function TeacherClasses({ setActiveTab }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      authApi.getRooms(),
      authApi.getTimetable(),
      authApi.getStudentsDirectory({ limit: 100 })
    ]).then(([roomsRes, timetableRes, studentsRes]) => {
      if (!isMounted) return;

      const rooms = roomsRes.status === "fulfilled" ? roomsRes.value?.rooms || [] : [];
      const timetable = timetableRes.status === "fulfilled" ? timetableRes.value?.timetable || [] : [];
      const students = studentsRes.status === "fulfilled" ? studentsRes.value?.students || [] : [];

      // Extract unique sections from timetable slots
      const sectionsMap = new Map();

      timetable.forEach((dayDoc) => {
        (dayDoc.slots || []).forEach((slot) => {
          const key = `${slot.subject} - ${slot.roomNo || "Room"}`;
          if (!sectionsMap.has(key)) {
            // Find students matching this branch/sem
            const candidateCount = students.filter(
              (s) => !slot.branch || s.branch === slot.branch
            ).length;

            sectionsMap.set(key, {
              name: `${slot.subject} (${slot.section || "Polytechnic Section"})`,
              branch: slot.branch || dayDoc.branch || "CSE",
              sem: slot.semester || dayDoc.semester || "Semester 5",
              students: candidateCount || students.length,
              sub: slot.subject,
              room: slot.roomNo ? `Room ${slot.roomNo}` : "Lecture Hall",
              time: `${dayDoc.dayOfWeek} ${slot.startTime} – ${slot.endTime}`,
              type: slot.type || "Theory Lecture"
            });
          }
        });
      });

      // If timetable had slots, use them
      if (sectionsMap.size > 0) {
        setClasses(Array.from(sectionsMap.values()));
      } else if (rooms.length > 0) {
        // Fallback to room allocations if available
        const mapped = rooms.map((r) => ({
          name: `${r.department || "Engineering"} (${r.roomNumber})`,
          branch: r.department || "CSE",
          sem: "Current Semester",
          students: students.length,
          sub: r.allocatedTo || "Assigned Lecture / Lab",
          room: `${r.roomNumber} (${r.type || "Hall"})`,
          time: r.currentStatus === "occupied" ? "In Session" : "Scheduled",
          type: r.type || "Classroom"
        }));
        setClasses(mapped);
      } else {
        setClasses([]);
      }

      setLoading(false);
    }).catch(() => {
      if (!isMounted) return;
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="teacher-role-view teacher-cls-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <Layers size={24} color="var(--tch-primary)" />
            Assigned Teaching Sections & Batches
          </h2>
          <p>Lecture batches, student capacity, timetable schedules, and laboratory room allocations.</p>
        </div>

        <div className="tch-pill blue" style={{ padding: "8px 16px", fontSize: "0.86rem" }}>
          <Layers size={15} />
          <span>{classes.length} Active Teaching Sections</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tch-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading assigned teaching batches...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="tch-empty-box">
          <Layers size={40} style={{ opacity: 0.6 }} />
          <h3>No Class Batches Allocated</h3>
          <p>Assigned course sections and laboratory batches will automatically appear once published in the master timetable.</p>
        </div>
      ) : (
        <div className="teacher-cls-grid">
          {classes.map((cls, idx) => (
            <div key={idx} className="tch-card teacher-cls-card">
              <div>
                <div className="teacher-cls-card-top">
                  <h3 className="teacher-cls-title">{cls.name}</h3>
                  <span className="tch-pill emerald">{cls.students} Candidates</span>
                </div>

                <div className="teacher-cls-meta-list">
                  <div className="teacher-cls-meta-row">
                    <BookOpen size={13} color="var(--tch-primary)" />
                    <span><strong>Subject:</strong> {cls.sub}</span>
                  </div>

                  <div className="teacher-cls-meta-row">
                    <MapPin size={13} color="var(--tch-cyan)" />
                    <span><strong>Location:</strong> {cls.room}</span>
                  </div>

                  <div className="teacher-cls-meta-row">
                    <Clock size={13} color="var(--tch-text-muted)" />
                    <span><strong>Schedule:</strong> {cls.time}</span>
                  </div>
                </div>
              </div>

              <div className="teacher-cls-card-footer">
                <button
                  type="button"
                  className="tch-btn-primary"
                  style={{ fontSize: "0.82rem", padding: "8px 16px" }}
                  onClick={() => setActiveTab?.("attendance")}
                >
                  <CalendarCheck2 size={13} />
                  <span>Take Attendance</span>
                </button>

                <button
                  type="button"
                  className="tch-btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "8px 16px" }}
                  onClick={() => setActiveTab?.("assignments")}
                >
                  <FileText size={13} />
                  <span>Coursework</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
