import React, { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Download,
  RefreshCw,
  Clock,
  Sparkles,
  BarChart3,
  FileText,
  AlertCircle
} from "lucide-react";
import { authApi } from "../../services/authApi";
import OfficialCollegeTimetableGrid from "../../components/timetable/OfficialCollegeTimetableGrid";
import "./PrincipalTimetable.css";

const DEPARTMENTS = [
  { code: "CSE", name: "Computer Science & Engineering", icon: "💻", status: "published" },
  { code: "ME", name: "Mechanical Engineering", icon: "⚙️", status: "published" },
  { code: "EE", name: "Electrical Engineering", icon: "⚡", status: "under_review" },
  { code: "CE", name: "Civil Engineering", icon: "🏗️", status: "draft" },
  { code: "ECE", name: "Electronics & Communication", icon: "📡", status: "draft" }
];

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];

export default function PrincipalTimetable({ currentUser, showToast }) {
  const [selectedBranch, setSelectedBranch] = useState("CSE");
  const [selectedSemester, setSelectedSemester] = useState("Semester 5");
  const [selectedSection, setSelectedSection] = useState("A");
  const [loading, setLoading] = useState(true);
  const [timetableData, setTimetableData] = useState(null);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [activeTab, setActiveTab] = useState("matrix"); // "matrix" | "departments" | "workload"

  useEffect(() => {
    loadInstitutionalTimetable();
  }, [selectedBranch, selectedSemester, selectedSection]);

  const loadInstitutionalTimetable = async () => {
    try {
      setLoading(true);
      const res = await authApi.getPublishedTimetable({
        branch: selectedBranch,
        semester: selectedSemester,
        section: selectedSection
      });

      if (res?.success && res?.timetable) {
        setTimetableData(res.timetable);
        setScheduleDays(res.timetable.scheduleDays || []);
      } else {
        // Fallback to general academic timetable endpoint
        const fallbackRes = await authApi.getTimetable({
          branch: selectedBranch,
          semester: selectedSemester
        });
        if (fallbackRes?.timetable) {
          setTimetableData(fallbackRes.timetable);
          setScheduleDays(fallbackRes.timetable.scheduleDays || []);
        } else {
          setScheduleDays([]);
        }
      }
    } catch (err) {
      console.error("Error loading institutional timetable for Principal:", err);
      setScheduleDays([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!scheduleDays || scheduleDays.length === 0) return;
    const rows = [["Day", "Period", "Time", "Subject", "Subject Code", "Teacher", "Room", "Type"]];
    scheduleDays.forEach((day) => {
      (day.slots || []).forEach((slot) => {
        if (!slot.isBreak) {
          rows.push([
            day.dayOfWeek,
            slot.periodNumber || "—",
            `${slot.startTime || ""} - ${slot.endTime || ""}`,
            slot.subject || "—",
            slot.subjectCode || "—",
            slot.teacherName || slot.faculty || "—",
            slot.roomNo || "—",
            slot.type || "Theory"
          ]);
        }
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Institutional_Timetable_${selectedBranch}_${selectedSemester}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="principal-tt-studio">
      {/* 1. EXECUTIVE HEADER */}
      <div className="pr-header-card">
        <div className="pr-header-info">
          <div className="pr-tag-row">
            <span className="pr-badge-executive">
              <ShieldCheck size={14} /> Institutional Governance
            </span>
            <span className="pr-badge-session">Academic Session 2026-27</span>
          </div>
          <h1 className="pr-header-title">Institutional Timetable & Academic Delivery Overview</h1>
          <p className="pr-header-sub">
            Campus-wide academic schedule governance, inter-departmental timetable synchronization, 
            faculty workload balance, and official published matrix inspection for Subharti Polytechnic College.
          </p>
        </div>

        <div className="pr-header-actions no-print">
          <button
            type="button"
            onClick={loadInstitutionalTimetable}
            className="pr-btn pr-btn-secondary"
            title="Refresh Timetable Data"
          >
            <RefreshCw size={15} className={loading ? "pr-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="pr-btn pr-btn-secondary"
            title="Export Timetable CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="pr-btn pr-btn-primary"
            title="Print Official Timetable Sheet"
          >
            <Printer size={15} />
            <span>Print Official Sheet</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE METRICS STRIP */}
      <div className="pr-metrics-grid">
        <div className="pr-metric-card">
          <div className="pr-metric-top">
            <span className="pr-metric-lbl">Active Schedule Status</span>
            <span className="pr-badge-status published">
              <CheckCircle2 size={13} /> Published
            </span>
          </div>
          <span className="pr-metric-val">Version 22.0</span>
          <span className="pr-metric-note">Approved by HOD & Academic Coordinator</span>
        </div>

        <div className="pr-metric-card">
          <div className="pr-metric-top">
            <span className="pr-metric-lbl">Academic Delivery Volume</span>
            <span className="pr-badge-status blue">
              <Clock size={13} /> 6 Days
            </span>
          </div>
          <span className="pr-metric-val">36 Periods / Wk</span>
          <span className="pr-metric-note">Mon–Sat (08:00 AM – 04:00 PM)</span>
        </div>

        <div className="pr-metric-card">
          <div className="pr-metric-top">
            <span className="pr-metric-lbl">Faculty Teaching Allocation</span>
            <span className="pr-badge-status green">
              <Users size={13} /> 100% Staffed
            </span>
          </div>
          <span className="pr-metric-val">13 Active Faculty</span>
          <span className="pr-metric-note">0 Teaching Collisions Detected</span>
        </div>

        <div className="pr-metric-card">
          <div className="pr-metric-top">
            <span className="pr-metric-lbl">Classroom & Lab Utilization</span>
            <span className="pr-badge-status amber">
              <Building2 size={13} /> Room 302
            </span>
          </div>
          <span className="pr-metric-val">7 Practical Labs</span>
          <span className="pr-metric-note">Comp. Lab, Net Lab, Yoga Hall</span>
        </div>
      </div>

      {/* 3. DEPARTMENT COMPARISON BAR */}
      <div className="pr-dept-bar-card no-print">
        <span className="pr-dept-bar-label">SELECT DEPARTMENT:</span>
        <div className="pr-dept-chips">
          {DEPARTMENTS.map((dept) => {
            const isSelected = selectedBranch === dept.code;
            return (
              <button
                key={dept.code}
                type="button"
                className={`pr-dept-chip ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedBranch(dept.code)}
              >
                <span className="pr-dept-icon">{dept.icon}</span>
                <span className="pr-dept-name">{dept.name}</span>
                <span className={`pr-dept-status-dot ${dept.status}`} />
              </button>
            );
          })}
        </div>

        {/* COHORT SELECTORS */}
        <div className="pr-cohort-selectors">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="pr-select"
          >
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="pr-select"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      {/* 4. MASTER COLLEGE TIMETABLE GRID */}
      <div className="pr-timetable-wrapper">
        <OfficialCollegeTimetableGrid
          scheduleDays={scheduleDays}
          branch={selectedBranch}
          semester={selectedSemester}
          academicSession="2026-27"
          roomNo="ROOM NO.-302"
          editable={false}
          status={timetableData?.status || "published"}
        />
      </div>
    </div>
  );
}
