import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Award, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, Cpu, GraduationCap, Layers3, MapPin, Users, UserRound, UsersRound
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODDepartment.css";

function MetricCard({ icon: Icon, label, value, detail, tone, index }) {
  return (
    <article className={`hod-department-metric hod-department-tone-${tone}`} style={{ "--card-order": index }}>
      <div className="hod-department-metric-top">
        <span className="hod-department-icon"><Icon size={19} aria-hidden="true" /></span>
        <span className="hod-department-metric-label">{label}</span>
      </div>
      <strong className="hod-department-metric-value">{value}</strong>
      <span className="hod-department-metric-detail">{detail}</span>
    </article>
  );
}

function TrendChart({ data, valueKey, labelKey, color, seriesLabel, suffix = "%" }) {
  const [activePoint, setActivePoint] = useState(null);
  const values = data.map((item) => Number(item[valueKey]) || 0);
  const points = values.map((value, index) => ({
    x: data.length < 2 ? 50 : 7 + (index / (data.length - 1)) * 86,
    y: 88 - (Math.min(100, Math.max(0, value)) / 100) * 68,
    value
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `7,90 ${line} 93,90` : "";
  const selected = activePoint == null ? points.length - 1 : activePoint;
  const selectedData = data[selected];
  const selectedPoint = points[selected];
  const labelIndexes = data.length <= 5
    ? data.map((_, index) => index)
    : Array.from({ length: 5 }, (_, index) => Math.round(index * (data.length - 1) / 4));
  return (
    <div className="hod-department-chart" onMouseLeave={() => setActivePoint(null)}>
      {data.length ? <>
        <div className="hod-department-chart-summary"><strong>{points.at(-1)?.value}{suffix}</strong><span>latest recorded</span></div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="group" aria-label={`${seriesLabel} by semester`}>
          <defs><linearGradient id={`hod-dept-fill-${valueKey}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".24"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
          {[20, 37, 54, 71, 88].map((y) => <line key={y} x1="3" x2="97" y1={y} y2={y} className="hod-department-gridline" />)}
          <polygon points={area} fill={`url(#hod-dept-fill-${valueKey})`} />
          <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => <g key={`${point.x}-${index}`} className="hod-department-chart-point" tabIndex="0" role="button" aria-label={`${data[index][labelKey]} ${seriesLabel}: ${point.value}${suffix}`} onMouseEnter={() => setActivePoint(index)} onFocus={() => setActivePoint(index)} onBlur={() => setActivePoint(null)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActivePoint(index); } }}>
            <circle cx={point.x} cy={point.y} r="4.2" className="hod-department-chart-hit"/>
            <circle cx={point.x} cy={point.y} r={selected === index ? "2.5" : "1.8"} fill={color} className="hod-department-chart-dot" vectorEffect="non-scaling-stroke"/>
          </g>)}
        </svg>
        <div className="hod-department-chart-labels">{labelIndexes.map((index) => <span key={`${data[index][labelKey]}-${index}`} title={data[index][labelKey]}>{data[index][labelKey]}</span>)}</div>
        <div className="hod-department-chart-footer"><span className="hod-department-chart-legend"><i style={{ backgroundColor: color }}/>{seriesLabel}</span><span className="hod-department-chart-tooltip" aria-live="polite">{selectedData?.[labelKey]} <b>{selectedPoint?.value}{suffix}</b></span></div>
      </> : <div className="hod-department-chart-empty"><Activity size={22}/><span>Trend data will appear as records are added.</span></div>}
    </div>
  );
}

export default function HODDepartment({ currentUser, stats, charts, setActiveTab }) {
  const summary = stats?.summary || {};
  const deptName = summary.department || currentUser?.department || "Department";
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(false);
  const students = summary.deptStudentCount ?? 0;
  const faculty = summary.deptTeacherCount ?? 0;
  const attendance = summary.deptAttendanceAvg;
  const subjects = summary.activeSubjectsCount ?? 0;
  const batches = summary.activeBatchesCount ?? 0;
  const facultyList = stats?.facultyOverview || stats?.facultyRoster || [];
  const notices = stats?.departmentNotices || stats?.notices || [];
  const attendanceTrend = charts?.semesterAttendance || [];
  const performanceTrend = charts?.semesterPerformanceTrend || [];
  const roomCount = labs.length;
  const currentYear = summary.academicYear || "Academic session not set";

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setRoomsError(false);
    authApi.getRooms()
      .then((res) => {
        if (!isMounted) return;
        const rooms = res?.rooms || [];
        setLabs(rooms.map((room, index) => ({
          id: room._id || room.id || `${room.roomNumber}-${index}`,
          name: `${room.roomNumber || "Room"} · ${room.name || "Academic facility"}`,
          type: room.type || "Classroom / Lab",
          capacity: room.capacity ?? null,
          equipment: Array.isArray(room.equipment) ? room.equipment : [],
          incharge: room.allocatedTo || "Not assigned",
          occupied: room.currentStatus === "occupied"
        })));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to load department rooms:", error);
        setLabs([]);
        setRoomsError(true);
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [deptName]);

  const facultyInitial = (name) => (name || "F").trim().charAt(0).toUpperCase();
  const latestNotice = useMemo(() => [...notices].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3), [notices]);
  const nav = (tab) => setActiveTab?.(tab);

  return (
    <main className="hod-role-view hod-dept-container">
      <div className="hod-department-breadcrumb"><span>Workspace</span><ChevronRight size={13}/><span>Academic administration</span><ChevronRight size={13}/><strong>Department</strong></div>

      <header className="hod-department-hero">
        <div className="hod-department-hero-copy">
          <div className="hod-department-eyebrow"><Building2 size={14}/> Department overview</div>
          <h1>{deptName}</h1>
          <p>Academic operations, people and facilities in one place.</p>
          <div className="hod-department-meta">
            <span><CalendarDays size={14}/>{currentYear}</span>
            {currentUser?.fullName && <span><UserRound size={14}/> HOD · {currentUser.fullName}</span>}
          </div>
        </div>
        <div className="hod-department-hero-mark" aria-hidden="true"><Building2 size={42}/><span>COLLEGEOS</span></div>
        <div className="hod-department-hero-actions">
          <button className="hod-btn-secondary" type="button" onClick={() => nav("reports")}><ClipboardList size={16}/> Department reports</button>
          <button className="hod-btn-primary" type="button" onClick={() => nav("faculty-management")}><Users size={16}/> Faculty directory</button>
        </div>
      </header>

      <section className="hod-department-metrics" aria-label="Department metrics">
        <MetricCard icon={GraduationCap} label="Students" value={students.toLocaleString("en-IN")} detail="Currently enrolled" tone="indigo" index={0}/>
        <MetricCard icon={UsersRound} label="Faculty" value={faculty.toLocaleString("en-IN")} detail={students && faculty ? `1 faculty to ${Math.round(students / faculty)} students` : "Department teaching staff"} tone="violet" index={1}/>
        <MetricCard icon={BookOpen} label="Active subjects" value={subjects.toLocaleString("en-IN")} detail="From department timetable" tone="blue" index={2}/>
        <MetricCard icon={Layers3} label="Active semesters" value={batches.toLocaleString("en-IN")} detail="Currently scheduled batches" tone="amber" index={3}/>
        <MetricCard icon={Building2} label="Facilities" value={loading ? "—" : roomCount.toLocaleString("en-IN")} detail={loading ? "Loading room registry" : "Rooms and laboratories"} tone="green" index={4}/>
        <MetricCard icon={Activity} label="Attendance" value={attendance == null ? "—" : `${attendance}%`} detail={attendance == null ? "No attendance summary available" : "Department average"} tone="cyan" index={5}/>
      </section>

      <section className="hod-department-analytics" aria-label="Academic analytics">
        <article className="hod-card hod-department-panel hod-department-trend-panel">
          <div className="hod-department-section-heading"><div><span className="hod-department-kicker">ACADEMIC PULSE</span><h2>Attendance by semester</h2></div><span className="hod-department-soft-icon"><Activity size={17}/></span></div>
          <TrendChart data={attendanceTrend} valueKey="attendance" labelKey="semester" color="#4F46E5" seriesLabel="Attendance"/>
        </article>
        <article className="hod-card hod-department-panel hod-department-trend-panel">
          <div className="hod-department-section-heading"><div><span className="hod-department-kicker">LEARNING OUTCOMES</span><h2>Performance by semester</h2></div><span className="hod-department-soft-icon violet"><Award size={17}/></span></div>
          <TrendChart data={performanceTrend} valueKey="avgPercentage" labelKey="semester" color="#7C3AED" seriesLabel="Average result"/>
        </article>
        <article className="hod-card hod-department-panel hod-department-faculty-panel">
          <div className="hod-department-section-heading"><div><span className="hod-department-kicker">PEOPLE</span><h2>Faculty overview</h2></div><button className="hod-department-text-link" type="button" onClick={() => nav("faculty-management")}>View directory <ChevronRight size={14}/></button></div>
          {facultyList.length ? <div className="hod-department-faculty-list">{facultyList.slice(0, 5).map((person, index) => {
            const name = person.fullName || person.name || person.teacherName || "Faculty member";
            const status = person.status || "On roster";
            return <div className="hod-department-faculty-row" key={person._id || person.id || `${name}-${index}`}><span className="hod-department-avatar">{facultyInitial(name)}</span><span className="hod-department-person"><strong>{name}</strong><small>{person.designation || person.role || "Faculty"}</small></span><span className={`hod-department-person-status ${String(status).toLowerCase()}`}><i/> {status}</span></div>;
          })}</div> : <div className="hod-department-inline-empty"><Users size={20}/><span>Faculty records will appear here when available.</span></div>}
        </article>
      </section>

      <section className="hod-department-lower-grid">
        <article className="hod-card hod-department-panel hod-department-facilities">
          <div className="hod-department-section-heading"><div><span className="hod-department-kicker">CAMPUS INFRASTRUCTURE</span><h2>Facilities & rooms</h2></div><span className="hod-pill indigo">{loading ? "Loading" : `${roomCount} spaces`}</span></div>
          {loading ? <div className="hod-department-loading" role="status">Loading department facilities…</div> : roomsError ? <div className="hod-department-inline-empty"><Cpu size={21}/><span>Could not load the room registry. Please revisit this section later.</span></div> : labs.length ? <div className="hod-department-room-list">{labs.slice(0, 6).map((room) => <div className="hod-department-room-row" key={room.id}><span className="hod-department-room-icon"><MapPin size={17}/></span><div className="hod-department-room-main"><strong>{room.name}</strong><span>{room.type}{room.capacity != null ? ` · ${room.capacity} seats` : ""}</span><small>{room.equipment.length ? room.equipment.join(" · ") : `In charge: ${room.incharge}`}</small></div><span className={`hod-department-room-status ${room.occupied ? "occupied" : "available"}`}><i/>{room.occupied ? "In use" : "Available"}</span></div>)}</div> : <div className="hod-department-inline-empty"><Cpu size={21}/><span>No rooms or laboratories have been assigned to this department yet.</span></div>}
        </article>
        <article className="hod-card hod-department-panel hod-department-activity">
          <div className="hod-department-section-heading"><div><span className="hod-department-kicker">DEPARTMENT UPDATES</span><h2>Recent notices</h2></div><button className="hod-department-text-link" type="button" onClick={() => nav("notices")}>All notices <ChevronRight size={14}/></button></div>
          {latestNotice.length ? <div className="hod-department-notice-list">{latestNotice.map((notice, index) => <div className="hod-department-notice" key={notice._id || notice.id || index}><span className="hod-department-notice-dot"/><div><strong>{notice.title || "Department notice"}</strong><p>{notice.content ? `${notice.content.slice(0, 118)}${notice.content.length > 118 ? "…" : ""}` : "Open the notices page to view the full announcement."}</p><small>{notice.createdAt ? new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently posted"}</small></div></div>)}</div> : <div className="hod-department-inline-empty"><Activity size={21}/><span>New academic notices and announcements will appear here.</span></div>}
          <div className="hod-department-activity-footer"><CheckCircle2 size={15}/> Updates are sourced from department notices.</div>
        </article>
      </section>

      <section className="hod-department-actions-wrap">
        <div className="hod-department-section-heading"><div><span className="hod-department-kicker">GET THINGS DONE</span><h2>Department workspace</h2></div></div>
        <div className="hod-department-actions">
          {[
            [Users, "Manage faculty", "Review teaching staff", "faculty-management", "violet"],
            [GraduationCap, "Manage students", "View department records", "students", "indigo"],
            [BookOpen, "Subject allocation", "Review learning resources", "subjects", "blue"],
            [CalendarDays, "Timetable", "Classes and room schedules", "timetable", "amber"],
            [Activity, "Attendance", "Department attendance", "attendance", "green"],
            [ClipboardList, "Department reports", "Academic summaries", "reports", "cyan"]
          ].map(([Icon, title, detail, tab, tone]) => <button className="hod-department-action" type="button" key={tab} onClick={() => nav(tab)}><span className={`hod-department-action-icon ${tone}`}><Icon size={18}/></span><span><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={16} className="hod-department-action-chevron"/></button>)}
        </div>
      </section>
    </main>
  );
}
