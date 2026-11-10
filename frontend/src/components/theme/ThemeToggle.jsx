import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Reusable Centralized Theme Toggle Component
 * Supports icon button, pill button, and custom variants.
 */
export default function ThemeToggle({
  className = "",
  variant = "icon", // "icon" | "pill" | "text"
  showLabel = false,
  size = 18,
  ariaLabel
}) {
  const { theme, toggleTheme, isDark } = useTheme();

  const defaultLabel = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
  const title = ariaLabel || defaultLabel;

  if (variant === "pill") {
    return (
      <button
        type="button"
        className={`cos-theme-toggle-pill ${className}`}
        onClick={toggleTheme}
        title={title}
        aria-label={title}
      >
        <span className="cos-theme-toggle-icon">
          {isDark ? <Sun size={size} /> : <Moon size={size} />}
        </span>
        <span className="cos-theme-toggle-label">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`cos-theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={title}
      aria-label={title}
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
      {showLabel && (
        <span className="cos-theme-toggle-label">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
