import React from "react";
import { GraduationCap, ArrowRight, Award, Calendar, Layers, CheckCircle2, ChevronRight, BookOpen, Building2 } from "lucide-react";

export default function AcademicSection({ profile, onViewAll }) {
  const branch = profile?.branch || "CSE";
  const year = profile?.academicYear || "3rd Year";
  const semester = profile?.semester || "Semester 5";
  const sgpa = profile?.sgpa !== undefined ? Number(profile.sgpa).toFixed(1) : "8.9";
  const attendance = profile?.attendancePercentage !== undefined ? profile.attendancePercentage : 85;
  const enrollmentNo = profile?.enrollmentNo || profile?.rollNo || "N/A";
  const degree = profile?.degree || "Diploma in Engineering";

  const educationList = Array.isArray(profile?.education) && profile.education.length > 0
    ? profile.education
    : [
        {
          title: `Diploma in Engineering (${branch})`,
          issuer: "Subharti Polytechnic College, Meerut",
          year: "2024 - 2027",
          description: `Focus on ${branch} Engineering curriculum, Data Structures, Algorithms, Core Labs and Internal Sessional Evaluations.`
        },
        {
          title: "Secondary School Examination (Class X)",
          issuer: "State Examination Board",
          year: "2022 - 2024",
          description: "Graduated with Distinction in Mathematics and Science."
        }
      ];

  return (
    <div className="sp2-bento-card sp2-card-academics" id="section-academics">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap emerald">
            <GraduationCap size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Academic & Institutional Details</h2>
            <p className="sp2-card-subtitle">Curriculum, enrollment standing, and term evaluations</p>
          </div>
        </div>
        <button
          type="button"
          className="sp2-card-action-pill"
          onClick={onViewAll}
          aria-label="View Academic Results"
        >
          <span>Results & Marks</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="sp2-acad-body">
        {/* Institutional Degree Banner */}
        <div className="sp2-acad-hero-banner">
          <div className="sp2-acad-seal-box">
            <Building2 size={28} className="text-blue" />
          </div>
          <div className="sp2-acad-hero-info">
            <div className="sp2-acad-degree-row">
              <h3 className="sp2-acad-degree-title">{degree}</h3>
              <span className="sp2-status-pill verified">
                <CheckCircle2 size={12} />
                <span>{year}</span>
              </span>
            </div>
            <p className="sp2-acad-sub-dept">
              Swami Vivekanand Subharti University • {branch} Department • {semester}
            </p>
          </div>
        </div>

        {/* 3 Metric High-Impact Tiles */}
        <div className="sp2-acad-metrics-row">
          <div className="sp2-acad-tile">
            <span className="tile-label">SGPA Score</span>
            <div className="tile-value-wrap">
              <strong className="tile-num text-purple">{sgpa}</strong>
              <small className="tile-max">/ 10</small>
            </div>
            <span className="tile-sub text-purple">Distinction Standing</span>
          </div>

          <div className="sp2-acad-tile">
            <span className="tile-label">Overall Attendance</span>
            <div className="tile-value-wrap">
              <strong className="tile-num text-emerald">{attendance}%</strong>
            </div>
            <span className="tile-sub text-emerald">Exam Compliant</span>
          </div>

          <div className="sp2-acad-tile">
            <span className="tile-label">Academic Cycle</span>
            <div className="tile-value-wrap">
              <strong className="tile-num text-blue">2024–27</strong>
            </div>
            <span className="tile-sub text-blue">Active Enrolled</span>
          </div>
        </div>

        {/* Chronological Education Path */}
        <div className="sp2-education-timeline">
          <span className="sp2-timeline-heading">Education History</span>
          <div className="sp2-timeline-entries">
            {educationList.map((edu, idx) => (
              <div key={idx} className="sp2-timeline-node">
                <div className="sp2-timeline-pin" />
                <div className="sp2-timeline-node-content">
                  <div className="sp2-timeline-node-top">
                    <h4 className="sp2-timeline-degree">{edu.title}</h4>
                    <span className="sp2-timeline-badge">{edu.year}</span>
                  </div>
                  <span className="sp2-timeline-inst">{edu.issuer}</span>
                  {edu.description && (
                    <p className="sp2-timeline-desc">{edu.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
