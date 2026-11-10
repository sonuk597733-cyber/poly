import React from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles
} from "lucide-react";

export const DEFAULT_CERTIFICATIONS = [
  {
    id: "cert-1",
    title: "Full-Stack Web Development Specialization",
    issuer: "Meta & Coursera",
    issueDate: "Nov 2024",
    credentialId: "META-FS-849204",
    credentialUrl: "https://coursera.org",
    skills: ["React", "JavaScript", "REST APIs", "Node.js", "CSS3"]
  },
  {
    id: "cert-2",
    title: "Database Design & MongoDB Practitioner",
    issuer: "MongoDB University",
    issueDate: "Oct 2024",
    credentialId: "MDB-CERT-204918",
    credentialUrl: "https://university.mongodb.com",
    skills: ["MongoDB Atlas", "Aggregation Pipeline", "Mongoose", "Indexing"]
  },
  {
    id: "cert-3",
    title: "Python for Data Structures & Engineering",
    issuer: "University Technical Guild",
    issueDate: "Aug 2024",
    credentialId: "SVSU-PY-102934",
    credentialUrl: "https://subharti.org",
    skills: ["Python", "Algorithms", "Object-Oriented Programming", "File I/O"]
  }
];

export default function CertificationsSection({ certifications = [] }) {
  const displayCerts = Array.isArray(certifications) && certifications.length > 0
    ? certifications
    : DEFAULT_CERTIFICATIONS;

  return (
    <div className="sp2-bento-card sp2-card-certifications" id="section-certifications">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap gold">
            <Award size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Certifications & Accreditations</h2>
            <p className="sp2-card-subtitle">
              Industry credentials and verified qualifications ({displayCerts.length})
            </p>
          </div>
        </div>
      </div>

      <div className="sp2-certs-body">
        <div className="sp2-certs-grid">
          {displayCerts.map((cert, idx) => {
            const skillsList = Array.isArray(cert.skills)
              ? cert.skills
              : typeof cert.skills === "string"
              ? cert.skills.split(",").map((s) => s.trim())
              : [];

            return (
              <div key={cert.id || idx} className="sp2-cert-card">
                <div className="sp2-cert-top">
                  <div className="sp2-cert-badge-icon">
                    <ShieldCheck size={18} className="text-blue" />
                  </div>
                  <div className="sp2-cert-meta-info">
                    <h3 className="sp2-cert-title">{cert.title}</h3>
                    <div className="sp2-cert-issuer-row">
                      <span className="issuer">{cert.issuer}</span>
                      <span className="bullet">•</span>
                      <span className="date">{cert.issueDate || cert.year || "2024"}</span>
                    </div>
                  </div>
                </div>

                {cert.credentialId && (
                  <div className="sp2-cert-id-strip">
                    <span className="lbl">ID:</span>
                    <strong className="code font-mono">{cert.credentialId}</strong>
                  </div>
                )}

                {skillsList.length > 0 && (
                  <div className="sp2-cert-skills-strip">
                    {skillsList.map((sk, sIdx) => (
                      <span key={sIdx} className="cert-tag">{sk}</span>
                    ))}
                  </div>
                )}

                {cert.credentialUrl && (
                  <div className="sp2-cert-action-foot">
                    <a
                      href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp2-cert-verify-link"
                    >
                      <span>Verify Credential</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
