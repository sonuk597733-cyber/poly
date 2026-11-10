import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Sparkles,
  Award,
  Building2,
  GraduationCap
} from "lucide-react";

export default function DigitalStudentCard({
  student,
  isOpen,
  onClose,
  onPrint
}) {
  const [flipped, setFlipped] = useState(false);

  if (!isOpen || !student) return null;

  const fullName = student.fullName || student.name || "Student Candidate";
  const branch = student.branch || "CSE";
  const enrollmentNo = student.enrollmentNo || student.rollNo || "N/A";
  const semester = student.semester || "Semester 5";
  const session = student.academicYear ? `${student.academicYear} • 2024–2027` : "2024–2027";
  const photo = student.avatarUrl;
  const bloodGroup = student.bloodGroup || "O+";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "ST";

  const handlePrintCard = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div
      className="std-modal-backdrop id-card-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="id-card-modal-container" role="dialog" aria-modal="true" aria-label="Digital Student ID Card">
        {/* Top Control Bar */}
        <div className="id-card-modal-top-bar">
          <div className="id-card-modal-title">
            <span className="live-chip">
              <span className="live-dot" />
              <span>OFFICIAL DIGITAL SMART CARD</span>
            </span>
          </div>
          <div className="id-card-top-actions">
            <button
              type="button"
              className="id-flip-pill-btn"
              onClick={() => setFlipped(!flipped)}
            >
              <RefreshCw size={13} />
              <span>{flipped ? "View Front" : "View Back"}</span>
            </button>
            <button
              type="button"
              className="std-icon-btn close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D Flip Card Container */}
        <div className="id-card-3d-perspective-stage">
          <div className={`id-card-flipper ${flipped ? "is-flipped" : ""}`}>
            {/* FRONT OF CARD */}
            <div className="id-card-face id-card-front">
              <div className="id-card-holographic-sheen" />
              <div className="id-card-corner-decor tl" />
              <div className="id-card-corner-decor tr" />

              {/* University Header */}
              <div className="id-card-header-block">
                <div className="id-card-crest-seal">
                  <Building2 size={24} className="text-amber-400" />
                </div>
                <div className="id-card-univ-names">
                  <span className="id-univ-sup">SWAMI VIVEKANAND SUBHARTI UNIVERSITY</span>
                  <h4 className="id-college-main">SUBHARTI POLYTECHNIC COLLEGE</h4>
                  <span className="id-campus-loc">Subhartipuram, NH-58, Delhi-Haridwar Bypass, Meerut</span>
                </div>
                <div className="id-student-type-pill">STUDENT</div>
              </div>

              {/* Main Body */}
              <div className="id-card-main-grid">
                <div className="id-card-photo-column">
                  <div className="id-photo-frame">
                    {photo ? (
                      <img
                        src={photo}
                        alt={fullName}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.parentElement?.querySelector(".id-initials-fallback");
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="id-initials-fallback"
                      style={{ display: photo ? "none" : "flex" }}
                    >
                      {initials}
                    </div>
                    <div className="id-photo-badge">
                      <ShieldCheck size={13} className="text-cyan-400" />
                    </div>
                  </div>
                  <div className="id-blood-badge">
                    <span>BLOOD GROUP</span>
                    <strong>{bloodGroup}</strong>
                  </div>
                </div>

                <div className="id-card-meta-column">
                  <div className="id-student-name-block">
                    <h3 className="id-student-full-name">{fullName}</h3>
                    <span className="id-degree-pill">Diploma in Engineering • {branch}</span>
                  </div>

                  <div className="id-fields-matrix">
                    <div className="id-kv-pair">
                      <span className="k">Enrollment No:</span>
                      <strong className="v font-mono">{enrollmentNo}</strong>
                    </div>
                    <div className="id-kv-pair">
                      <span className="k">Current Term:</span>
                      <strong className="v">{semester}</strong>
                    </div>
                    <div className="id-kv-pair">
                      <span className="k">Session:</span>
                      <strong className="v">{session}</strong>
                    </div>
                    <div className="id-kv-pair">
                      <span className="k">Status:</span>
                      <strong className="v text-emerald">Verified Active</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Barcode */}
              <div className="id-card-footer-strip">
                <div className="id-barcode-graphic">
                  <div className="barcode-bars" />
                  <span className="barcode-number">{enrollmentNo}</span>
                </div>
                <div className="id-footer-auth">
                  <div className="auth-stamp">
                    <ShieldCheck size={14} className="text-emerald" />
                    <span>DIGITALLY SIGNED &amp; SEALED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK OF CARD */}
            <div className="id-card-face id-card-back">
              <div className="id-back-header">
                <span className="id-back-title">TERMS &amp; REGULATIONS</span>
                <span className="id-back-inst">Subharti Polytechnic College</span>
              </div>

              <div className="id-back-rules">
                <ol>
                  <li>This card is non-transferable and must be presented upon campus entry and examination halls.</li>
                  <li>Loss of card must be reported immediately to the Examination Control Cell.</li>
                  <li>Unauthorized tampering with this card or barcode is strictly prohibited.</li>
                  <li>Valid for library access, internal sessional exams, and laboratory entry.</li>
                </ol>
              </div>

              <div className="id-back-emergency-grid">
                <div className="em-box">
                  <span className="em-lbl">Campus Helpline</span>
                  <strong className="em-val font-mono">+91 121 2439043</strong>
                </div>
                <div className="em-box">
                  <span className="em-lbl">Examination Cell</span>
                  <strong className="em-val font-mono">examcell@subharti.org</strong>
                </div>
              </div>

              <div className="id-back-signature-row">
                <div className="sig-block">
                  <div className="sig-line" />
                  <span>Student Signature</span>
                </div>
                <div className="sig-block">
                  <div className="sig-seal-stamp">OFFICIAL SEAL</div>
                  <div className="sig-line" />
                  <span>Principal / Registrar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="id-card-modal-footer">
          <button
            type="button"
            className="id-action-btn print"
            onClick={handlePrintCard}
          >
            <Printer size={15} />
            <span>Print ID Card</span>
          </button>

          <button
            type="button"
            className="id-action-btn flip"
            onClick={() => setFlipped(!flipped)}
          >
            <RefreshCw size={15} />
            <span>Flip to {flipped ? "Front" : "Back"}</span>
          </button>

          <button
            type="button"
            className="id-action-btn close"
            onClick={onClose}
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
