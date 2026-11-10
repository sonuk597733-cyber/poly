import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Send,
  Building,
  BarChart3,
  Check,
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Image,
  UserCheck
} from "lucide-react";
import { authApi } from "../../services/authApi";
import OfficialCollegeTimetableGrid from "../../components/timetable/OfficialCollegeTimetableGrid";
import "./HODTheme.css";
import "./HODTimetable.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];

export default function HODTimetable({ currentUser }) {
  const deptBranch = currentUser?.department || "CSE";
  const [hodScope, setHodScope] = useState("department"); // "department" | "my_teaching"
  const [personalSchedule, setPersonalSchedule] = useState(null);
  const [semester, setSemester] = useState("Semester 5");
  const [section, setSection] = useState("A");
  const [academicSession, setAcademicSession] = useState("2025-2026");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "cards"
  const [zoom, setZoom] = useState(1.0);
  const [fullscreen, setFullscreen] = useState(false);

  // Data State
  const [timetable, setTimetable] = useState(null);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [conflicts, setConflicts] = useState({ isValid: true, blockingErrors: [], warnings: [] });
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [rejectModal, setRejectModal] = useState({ open: false, remarks: "" });

  useEffect(() => {
    if (hodScope === "department") {
      loadTimetableData();
    } else {
      loadPersonalTeachingSchedule();
    }
  }, [hodScope, deptBranch, semester, section, academicSession]);

  const loadPersonalTeachingSchedule = async () => {
    try {
      setLoading(true);
      const res = await authApi.getTeacherPersonalSchedule();
      if (res?.success) {
        setPersonalSchedule(res);
      }
    } catch (err) {
      console.error("Error loading HOD personal teaching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableData = async () => {
    try {
      setLoading(true);
      const params = { branch: deptBranch, semester, section, academicSession };

      const [manageRes, conflictRes, reportsRes] = await Promise.allSettled([
        authApi.getManageTimetable(params),
        authApi.checkTimetableConflicts(params),
        authApi.getTimetableReports(params)
      ]);

      if (manageRes.status === "fulfilled" && manageRes.value?.success) {
        const tt = manageRes.value.timetable;
        setTimetable(tt);
        setScheduleDays(tt?.scheduleDays || []);
      } else {
        setTimetable(null);
        setScheduleDays([]);
      }

      if (conflictRes.status === "fulfilled" && conflictRes.value) {
        setConflicts({
          isValid: conflictRes.value.isValid !== false,
          blockingErrors: conflictRes.value.blockingErrors || [],
          warnings: conflictRes.value.warnings || []
        });
      }

      if (reportsRes.status === "fulfilled" && reportsRes.value?.success) {
        setReports(reportsRes.value);
      }
    } catch (err) {
      console.error("Error loading HOD timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  // Workflow Approval Action
  const handleApprove = async () => {
    if (!window.confirm(`Approve timetable for ${deptBranch} ${semester}?`)) return;
    try {
      setActionLoading(true);
      const res = await authApi.handleTimetableWorkflow({
        academicSession,
        branch: deptBranch,
        semester,
        section,
        action: "approve",
        remarks: "Approved by Head of Department."
      });
      if (res.success) {
        alert("Timetable approved successfully!");
        loadTimetableData();
      }
    } catch (err) {
      alert(err.message || "Approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow Request Adjustments
  const handleRequestChanges = async () => {
    if (!rejectModal.remarks.trim()) {
      alert("Please provide specific feedback/reasons for requested adjustments.");
      return;
    }
    try {
      setActionLoading(true);
      const res = await authApi.handleTimetableWorkflow({
        academicSession,
        branch: deptBranch,
        semester,
        section,
        action: "changes_requested",
        remarks: rejectModal.remarks
      });
      if (res.success) {
        alert("Returned to Coordinator with feedback.");
        setRejectModal({ open: false, remarks: "" });
        loadTimetableData();
      }
    } catch (err) {
      alert(err.message || "Failed to submit change request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Official Publication
  const handlePublish = async () => {
    if (conflicts.blockingErrors?.length > 0) {
      alert("Cannot publish: Schedule contains blocking conflict errors.");
      return;
    }
    if (!window.confirm(`Publish official timetable for ${deptBranch} ${semester}? This will immediately update student and faculty portals.`)) return;

    try {
      setActionLoading(true);
      const res = await authApi.publishTimetable({
        academicSession,
        branch: deptBranch,
        semester,
        section,
        changeNotes: `Official publication authorized by HOD for ${deptBranch} ${semester}`
      });
      if (res.success) {
        alert("Timetable officially published!");
        loadTimetableData();
      }
    } catch (err) {
      alert(err.message || "Publication failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const currentDayDoc = scheduleDays.find(
    (d) => d.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase()
  );
  const slots = currentDayDoc?.slots || [];

  return (
    <div className="hod-role-view hod-tt-container">
      {/* 1. TOP HEADER & COHORT SELECTOR */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <Calendar size={24} color="var(--hod-primary, #FF6B0A)" />
            Department Master Timetable ({deptBranch} Engineering)
          </h2>
          <p>
            Curriculum schedule review, conflict inspection, faculty workload governance, and official publication workflow.
          </p>
        </div>

        <div className="hod-tt-controls">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="hod-select"
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="hod-select"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      {/* SCOPE TOGGLE: DEPARTMENT REVIEW VS MY TEACHING SCHEDULE */}
      <div className="hod-scope-bar">
        <button
          type="button"
          className={`hod-scope-btn ${hodScope === "department" ? "active" : ""}`}
          onClick={() => setHodScope("department")}
        >
          <Building size={15} />
          <span>Department Timetable Review ({deptBranch})</span>
        </button>
        <button
          type="button"
          className={`hod-scope-btn ${hodScope === "my_teaching" ? "active" : ""}`}
          onClick={() => setHodScope("my_teaching")}
        >
          <UserCheck size={15} />
          <span>My Teaching Schedule</span>
        </button>
      </div>

      {hodScope === "my_teaching" ? (
        /* HOD PERSONAL TEACHING SCHEDULE */
        <div className="hod-personal-sched-card">
          <div className="hod-personal-header">
            <div>
              <h3>My Teaching Commitments</h3>
              <p>Lectures and lab sessions officially assigned to you across all academic cohorts.</p>
            </div>
            <div className="hod-personal-stats">
              <span className="hod-stat-chip">
                <strong>{personalSchedule?.stats?.totalWeeklyClasses || 0}</strong> Weekly Classes
              </span>
              <span className="hod-stat-chip">
                <strong>{personalSchedule?.stats?.cohortsCount || 0}</strong> Cohorts Taught
              </span>
            </div>
          </div>

          <div className="hod-view-bar">
            <div className="hod-day-pills">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`hod-day-btn ${selectedDay === day ? "active" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="hod-personal-slots-grid">
            {personalSchedule?.scheduleDays
              ?.find((d) => d.dayOfWeek === selectedDay)
              ?.slots?.length > 0 ? (
              personalSchedule.scheduleDays
                .find((d) => d.dayOfWeek === selectedDay)
                .slots.map((s, idx) => (
                  <div key={idx} className="hod-class-card">
                    <div className="hod-class-top">
                      <span className="hod-time-pill"><Clock size={12} /> {s.startTime} - {s.endTime}</span>
                      <span className={`hod-type-tag ${s.type === "Practical" ? "practical" : "theory"}`}>{s.type}</span>
                    </div>
                    <h4>{s.subject}</h4>
                    <span className="hod-code-sub">{s.subjectCode}</span>
                    <div className="hod-class-meta">
                      <span><Building size={12} /> {s.branch} {s.semester} (Sec {s.section})</span>
                      <span><MapPin size={12} /> Room: <strong>{s.roomNo}</strong></span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="hod-empty-box">
                <p>No teaching classes assigned to you on {selectedDay}.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. WORKFLOW APPROVAL BANNER */}
          <div className="hod-approval-card">
        <div className="hod-approval-info">
          <div className="hod-status-row">
            <span className="hod-approval-label">Schedule Status:</span>
            <span className={`hod-status-pill ${timetable?.status || "draft"}`}>
              {timetable?.status === "published" && <CheckCircle2 size={13} />}
              {timetable?.status === "approved" && <Check size={13} />}
              {timetable?.status === "under_review" && <Eye size={13} />}
              {timetable?.status === "changes_requested" && <XCircle size={13} />}
              {(timetable?.status || "draft").replace("_", " ")}
            </span>
            <span className="hod-ver-tag">Version {timetable?.version || 1}.0</span>
          </div>

          <p className="hod-status-desc">
            {timetable?.status === "published"
              ? "This schedule is officially active and visible to all enrolled students and faculty."
              : timetable?.status === "approved"
              ? "Schedule is approved by HOD and ready for official campus-wide publication."
              : timetable?.status === "under_review"
              ? "Coordinator submitted this timetable for HOD verification and approval."
              : timetable?.status === "changes_requested"
              ? `Changes requested. Returned to Coordinator: "${timetable?.rejectionReason || "Adjustments needed"}"`
              : "Working draft in progress by Academic Coordinator."}
          </p>
        </div>

        {/* HOD ACTION BUTTONS */}
        <div className="hod-approval-actions">
          {timetable?.status === "under_review" && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="hod-btn hod-btn-approve"
              >
                <Check size={16} />
                <span>Approve Schedule</span>
              </button>

              <button
                onClick={() => setRejectModal({ open: true, remarks: "" })}
                disabled={actionLoading}
                className="hod-btn hod-btn-reject"
              >
                <XCircle size={16} />
                <span>Request Adjustments</span>
              </button>
            </>
          )}

          {timetable?.status !== "published" && (
            <button
              onClick={handlePublish}
              disabled={actionLoading}
              className="hod-btn hod-btn-publish"
            >
              <CheckCircle2 size={16} />
              <span>Publish Timetable</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="hod-btn hod-btn-outline"
          >
            <Printer size={16} />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 3. CONFLICT STATUS BANNER */}
      {conflicts.blockingErrors?.length > 0 ? (
        <div className="hod-conflict-alert error">
          <AlertTriangle size={18} />
          <div>
            <strong>{conflicts.blockingErrors.length} Hard Collisions Detected</strong>
            <p>{conflicts.blockingErrors[0].message}</p>
          </div>
        </div>
      ) : (
        <div className="hod-conflict-alert ok">
          <CheckCircle2 size={18} />
          <div>
            <strong>0 Institutional Collisions</strong>
            <p>No faculty double-bookings or room allocation clashes found.</p>
          </div>
        </div>
      )}

      {/* 4. VIEW TOGGLES & DAY SELECTOR */}
      <div className="hod-view-bar">
        <div className="hod-day-pills">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`hod-day-btn ${selectedDay === day ? "active" : ""}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="hod-mode-toggles">
          <button
            className={`hod-mode-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            Master Table
          </button>
          <button
            className={`hod-mode-btn ${viewMode === "cards" ? "active" : ""}`}
            onClick={() => setViewMode("cards")}
          >
            Daily Cards
          </button>
        </div>
      </div>

      {/* 5. SCHEDULE DISPLAY */}
      {loading ? (
        <div className="hod-loading-box">
          <Loader2 size={32} className="spin" />
          <p>Retrieving department timetable...</p>
        </div>
      ) : timetable?.timetableType === "image_based" && timetable?.imageUrl ? (
        /* OFFICIAL TIMETABLE PHOTOGRAPH REVIEW */
        <div className="hod-photo-review-card">
          <div className="hod-photo-header">
            <div>
              <span className="hod-photo-college">{timetable.collegeName || "Swami Vivekanand Subharti University"}</span>
              <h3 className="hod-photo-title">{timetable.title || "Official Department Timetable"}</h3>
              <div className="hod-photo-meta">
                <span>{deptBranch} Engineering • {semester} (Section {section})</span>
                {timetable.effectiveDate && (
                  <span>Effective: {new Date(timetable.effectiveDate).toLocaleDateString()}</span>
                )}
                <span className="hod-photo-badge">Direct Scanned Photograph</span>
              </div>
            </div>

            <div className="hod-photo-controls">
              <button
                type="button"
                className="hod-photo-btn"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="hod-photo-zoom-text">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="hod-photo-btn"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                className="hod-photo-btn"
                onClick={() => setZoom(1.0)}
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                className="hod-photo-btn"
                onClick={() => setFullscreen(true)}
                title="Fullscreen"
              >
                <Maximize2 size={15} />
              </button>
              <a
                href={timetable.imageUrl}
                download="official_timetable.jpg"
                target="_blank"
                rel="noreferrer"
                className="hod-photo-btn"
                title="Download"
              >
                <Download size={15} />
              </a>
            </div>
          </div>

          <div className="hod-photo-viewport">
            <div
              className="hod-photo-scroller"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              <img
                src={timetable.imageUrl}
                alt="Official Timetable Photograph"
                className="hod-photo-img"
              />
            </div>
          </div>

          {fullscreen && (
            <div className="std-photo-fs-backdrop" onClick={() => setFullscreen(false)}>
              <div className="std-photo-fs-content" onClick={(e) => e.stopPropagation()}>
                <div className="std-photo-fs-header">
                  <div>
                    <span className="std-photo-fs-college">{timetable.collegeName}</span>
                    <h4 className="std-photo-fs-title">{timetable.title}</h4>
                  </div>
                  <div className="hod-photo-controls">
                    <button type="button" className="hod-photo-btn" onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}>
                      <ZoomOut size={16} />
                    </button>
                    <span className="hod-photo-zoom-text">{Math.round(zoom * 100)}%</span>
                    <button type="button" className="hod-photo-btn" onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}>
                      <ZoomIn size={16} />
                    </button>
                    <button type="button" className="hod-photo-btn" onClick={() => setZoom(1.0)}>
                      <RotateCcw size={16} />
                    </button>
                    <button type="button" className="hod-photo-btn" onClick={() => setFullscreen(false)}>
                      <Minimize2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="std-photo-fs-viewport">
                  <img
                    src={timetable.imageUrl}
                    alt="Fullscreen Timetable Photograph"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                    className="std-photo-fs-img"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : scheduleDays.length === 0 ? (
        <div className="hod-empty-box">
          <Calendar size={40} style={{ opacity: 0.5 }} />
          <h3>No Timetable Configured for {semester}</h3>
          <p>The Academic Coordinator has not yet generated or saved a timetable for {deptBranch} {semester}.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* FULL WEEKLY TABLE VIEW */
        <div className="hod-master-table-card">
          <OfficialCollegeTimetableGrid
            scheduleDays={scheduleDays}
            branch={deptBranch}
            semester={semester}
            academicSession="2026-27"
            roomNo="ROOM NO.-302"
            editable={false}
          />
        </div>
      ) : (
        /* DAILY CARDS VIEW */
        slots.length === 0 ? (
          <div className="hod-empty-box">
            <Calendar size={36} style={{ opacity: 0.5 }} />
            <h3>No Classes on {selectedDay}</h3>
          </div>
        ) : (
          <div className="hod-tt-grid">
            {slots.map((s, idx) => (
              <div key={idx} className="hod-card hod-tt-card">
                <div>
                  <div className="hod-tt-time">
                    <Clock size={14} color="var(--hod-primary, #FF6B0A)" />
                    <span>{s.startTime} – {s.endTime}</span>
                  </div>
                  <h3 className="hod-tt-subject">{s.subject}</h3>
                  <span className={`hod-pill ${s.type === "Practical" ? "indigo" : "emerald"}`}>
                    {s.type || "Theory"}
                  </span>
                </div>

                <div className="hod-tt-meta">
                  <span className="hod-tt-meta-item">
                    <MapPin size={13} color="var(--hod-cyan, #06B6D4)" />
                    <span>{s.roomNo || "Room 101"}</span>
                  </span>
                  <span className="hod-tt-meta-item">
                    <Users size={13} color="var(--hod-text-muted, #64748B)" />
                    <span>{s.teacherName || "Faculty Lead"}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      </>
      )}

      {/* 6. MODAL: REQUEST ADJUSTMENTS */}
      {rejectModal.open && (
        <div className="hod-modal-backdrop" onClick={() => setRejectModal({ open: false, remarks: "" })}>
          <div className="hod-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hod-modal-header">
              <h3>Request Schedule Adjustments</h3>
              <button onClick={() => setRejectModal({ open: false, remarks: "" })} className="hod-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="hod-modal-body">
              <p>
                Specify what changes the Coordinator must make before this schedule can be approved (e.g. faculty load imbalance, laboratory timing conflicts).
              </p>
              <textarea
                value={rejectModal.remarks}
                onChange={(e) => setRejectModal({ ...rejectModal, remarks: e.target.value })}
                className="hod-textarea"
                placeholder="Enter detailed feedback for the Coordinator..."
                rows={4}
              />
            </div>
            <div className="hod-modal-footer">
              <button
                onClick={() => setRejectModal({ open: false, remarks: "" })}
                className="hod-btn hod-btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={actionLoading}
                className="hod-btn hod-btn-reject"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
