import React from "react";
import "./StatusBadge.css";

export default function StatusBadge({ status, label }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/[\s-]/g, "_");
  const displayLabel = label || status.replace(/_/g, " ").toUpperCase();

  return (
    <span className={`status-pill status-${normalized}`}>
      <span className="status-dot" />
      <span>{displayLabel}</span>
    </span>
  );
}
