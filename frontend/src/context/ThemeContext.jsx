import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export const ThemeContext = createContext(null);

const STORAGE_KEYS = ["collegeos_theme", "collegeos-theme"];

function getSavedTheme() {
  if (typeof window === "undefined") return "light";
  try {
    for (const key of STORAGE_KEYS) {
      const val = localStorage.getItem(key);
      if (val === "light" || val === "dark") return val;
    }
  } catch {
    // Ignore storage errors
  }
  return "light"; // Default to world-class university editorial light mode
}

function applyThemeToDOM(themeName) {
  if (typeof document === "undefined") return;
  const isLight = themeName === "light";
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute("data-theme", themeName);
  if (body) body.setAttribute("data-theme", themeName);

  if (isLight) {
    root.classList.add("theme-light");
    root.classList.remove("theme-dark");
    if (body) {
      body.classList.add("theme-light");
      body.classList.remove("theme-dark");
    }
  } else {
    root.classList.add("theme-dark");
    root.classList.remove("theme-light");
    if (body) {
      body.classList.add("theme-dark");
      body.classList.remove("theme-light");
    }
  }

  // Persist across both historical keys
  try {
    for (const key of STORAGE_KEYS) {
      localStorage.setItem(key, themeName);
    }
  } catch {}

  // Broadcast event for external non-React listeners (charts, canvases)
  window.dispatchEvent(new CustomEvent("collegeos:themechange", { detail: themeName }));
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getSavedTheme);
  const [rawTheme, setRawTheme] = useState(() => {
    try {
      return localStorage.getItem("collegeos_raw_theme") || "system";
    } catch {
      return "system";
    }
  });
  const [mounted, setMounted] = useState(false);

  // Apply theme immediately on mount and on changes
  useEffect(() => {
    setMounted(true);
    applyThemeToDOM(theme);
  }, [theme]);

  // Handle system preference changes when in system mode
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (rawTheme === "system") {
        const next = e.matches ? "dark" : "light";
        setThemeState(next);
        applyThemeToDOM(next);
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [rawTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      applyThemeToDOM(next);
      setRawTheme(next);
      try {
        localStorage.setItem("collegeos_raw_theme", next);
      } catch {}
      return next;
    });
  }, []);

  const setLightTheme = useCallback(() => {
    setThemeState("light");
    setRawTheme("light");
    applyThemeToDOM("light");
    try {
      localStorage.setItem("collegeos_raw_theme", "light");
    } catch {}
  }, []);

  const setDarkTheme = useCallback(() => {
    setThemeState("dark");
    setRawTheme("dark");
    applyThemeToDOM("dark");
    try {
      localStorage.setItem("collegeos_raw_theme", "dark");
    } catch {}
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === "system") {
      setRawTheme("system");
      try {
        localStorage.setItem("collegeos_raw_theme", "system");
      } catch {}
      const sysTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      setThemeState(sysTheme);
      applyThemeToDOM(sysTheme);
    } else if (newTheme === "light") {
      setLightTheme();
    } else {
      setDarkTheme();
    }
  }, [setLightTheme, setDarkTheme]);

  const value = {
    theme,
    rawTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setTheme,
    mounted
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
