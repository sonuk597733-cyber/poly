import React, { useState } from "react";
import "./Charts.css";

/**
 * 1. Area Trend Chart (Curved Spline with Gradient Fill & Tooltips)
 */
export function AreaTrendChart({
  data = [],
  title = "Attendance Trend",
  unit = "%",
  height = 240,
  accentColor = "#EA580C"
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-placeholder" style={{ height }}>
        <p>No trend records available for selected period.</p>
      </div>
    );
  }

  const svgWidth = 540;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = padLeft + (i / Math.max(1, data.length - 1)) * chartW;
    const yVal = Number(d.percentage ?? d.value ?? 0);
    const y = padTop + chartH - (yVal / 100) * chartH;
    return { x, y, val: yVal, label: d.label };
  });

  // Construct SVG cubic path
  let pathD = "";
  if (points.length === 1) {
    pathD = `M ${padLeft} ${points[0].y} L ${padLeft + chartW} ${points[0].y}`;
  } else {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  return (
    <div className="chart-wrapper">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="svg-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="responsive-chart-svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((level) => {
            const y = padTop + chartH - (level / 100) * chartH;
            return (
              <g key={level} className="chart-grid-group">
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" className="grid-label">
                  {level}
                  {unit}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={fillD} fill="url(#area-grad)" />

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & X labels */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="chart-data-point"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 6 : 4}
                fill="#FFFFFF"
                stroke={accentColor}
                strokeWidth={hoveredIndex === idx ? 3 : 2}
                className="point-circle"
              />
              <text x={pt.x} y={svgHeight - 10} textAnchor="middle" className="axis-label">
                {pt.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="chart-floating-tooltip"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / svgHeight) * 100}%`
            }}
          >
            <span className="tooltip-label">{points[hoveredIndex].label}</span>
            <strong className="tooltip-val">
              {points[hoveredIndex].val}
              {unit}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. Bar Metric Chart
 */
export function BarMetricChart({
  data = [],
  title = "Performance Distribution",
  unit = "pts",
  height = 240,
  barColor = "#3B82F6"
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-placeholder" style={{ height }}>
        <p>No comparative bar metrics recorded.</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Number(d.val ?? d.marks ?? d.rate ?? d.count ?? 100)),
    100
  );

  return (
    <div className="chart-wrapper">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="bar-chart-container" style={{ minHeight: height - 60 }}>
        {data.map((item, i) => {
          const val = Number(item.val ?? item.marks ?? item.rate ?? item.count ?? 0);
          const pct = Math.min(100, Math.round((val / maxVal) * 100));
          const isHovered = hoveredBar === i;

          return (
            <div
              key={i}
              className="bar-col"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="bar-track">
                {isHovered && (
                  <div className="bar-tooltip">
                    <strong>
                      {val} {unit}
                    </strong>
                  </div>
                )}
                <div
                  className="bar-fill"
                  style={{
                    height: `${pct}%`,
                    background: item.color || barColor
                  }}
                />
              </div>
              <span className="bar-label" title={item.label || item.subject || item.grade || item.branch}>
                {item.label || item.subject || item.grade || item.branch}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 3. Donut Progress Gauge
 */
export function DonutProgressChart({
  percentage = 85,
  size = 130,
  strokeWidth = 12,
  label = "Overall Attendance",
  accentColor = "#EA580C"
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const offset = circumference - (validPct / 100) * circumference;

  return (
    <div className="donut-wrapper">
      <div className="donut-circle-box" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="donut-svg">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {/* Progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="donut-progress-stroke"
          />
        </svg>
        <div className="donut-inner-content">
          <strong className="donut-pct">{validPct}%</strong>
        </div>
      </div>
      {label && <span className="donut-label">{label}</span>}
    </div>
  );
}
