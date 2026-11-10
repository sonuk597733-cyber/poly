import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import "./StatCard.css";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = "#EA580C",
  trend,
  trendType = "up", // 'up' | 'down' | 'neutral'
  onClick
}) {
  return (
    <div
      className={`stat-card ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div
            className="stat-icon-wrapper"
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}35`,
              color: accentColor
            }}
          >
            <Icon size={19} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <span className="stat-value">{value}</span>
      </div>

      <div className="stat-card-footer">
        {trend && (
          <span className={`stat-trend-tag trend-${trendType}`}>
            {trendType === "up" && <ArrowUpRight size={13} />}
            {trendType === "down" && <ArrowDownRight size={13} />}
            {trendType === "neutral" && <Minus size={13} />}
            <span>{trend}</span>
          </span>
        )}
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
