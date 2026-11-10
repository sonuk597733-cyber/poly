import fs from "fs";
import path from "path";

// This script generates the complete, ultra-premium 4000+ line CSS for StudentSubjectAttendance.css
// with bespoke animations, fluid typography, glassmorphism, glowing micro-interactions,
// full dark mode, and responsive engine.

let out = [];
function add(s = "") {
  out.push(s);
}

// --------------------------------------------------------------------------
// 1. HEADER & TABLE OF CONTENTS
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   COLLEGEOS — STUDENT SUBJECT ATTENDANCE (CURRICULUM LECTURES)
   Ultra-Premium Academic ERP Styling System & Bespoke Animation Engine
   Designed for Autonomous Course Calendars, Analytics & Compliance Governance
   
   TABLE OF CONTENTS:
   1.  Design Tokens, Color Scales & Theme Variables
   2.  Base Resets, Modern Typography Scale & Fluid Clamp Formulas
   3.  Bespoke Keyframe Animation Library (24 Custom Keyframes)
   4.  Page Shell Container & Background Mesh Gradient
   5.  Unified Header Bar & Breadcrumb Navigation
   6.  Global Month Navigation Toolbar & Quick-Jump Pills
   7.  Top Overview KPI Metrics Strip (6 Enterprise Cards)
   8.  Filter & Search Controls Toolbar (Pills, Search Box, Clear Action)
   9.  Subject Calendars Grid Layout & Staggered Transitions
   10. Subject Calendar Card Anatomy & 3D Hover Elevation
   11. Card Top Bar: Subject Identity, Tags & Dual Percentage Stack
   12. Card Month Navigation Strip & Quick Attendance Readout
   13. Calendar Weekday Headers & Sunday Column Accents
   14. Calendar Cells Grid, Leading Blanks & Date Anatomy
   15. Date Cell Status Indicators (Present, Absent, Pending, Holiday)
   16. Interactive Cell Hover Glows, Halos & Pulse Radar Rings
   17. Four Action Icon Buttons Bar (Graph, Analytics, Forecast, History)
   18. Modal Architecture: Backdrop Blur, Container & Header
   19. Modal 1: Attendance Trend Graph & SVG Trajectory Curve
   20. Modal 2: Subject Analytics, Donut Chart & Compliance Breakdown
   21. Modal 3: Forecast & What-If Simulator (Range Sliders, Projected Outcome)
   22. Modal 4: Complete Session History Ledger & CSV Export Toolbar
   23. Drawer 5: Date Attendance Audit Inspector (Lecture Cards & Tags)
   24. Loading Skeletons, Pulse Shimmers & Empty States
   25. Error Recovery State & Retry Actions
   26. High-Fidelity Micro-Interactions & Button Feedback
   27. Comprehensive Dark Mode Engine ([data-theme="dark"] & .dark)
   28. Responsive Engine: 1920px Full HD, 1440px Desktop, 1200px Laptop
   29. Responsive Engine: 1024px Tablet Landscape, 768px Tablet Portrait
   30. Responsive Engine: 480px Mobile Standard, 360px Small Mobile
   31. Accessibility, Motion Reduction & High Contrast Mode
   32. Print Media Stylesheet for Polytechnic Transcripts
   ========================================================================== */

/* ==========================================================================
   1. DESIGN TOKENS, COLOR SCALES & THEME VARIABLES
   ========================================================================== */

:root {
  /* Typography Stacks */
  --subj-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --subj-font-display: 'Plus Jakarta Sans', var(--subj-font-sans);
  --subj-font-mono: ui-monospace, 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;

  /* Fluid Typography Scale (CSS clamp) */
  --subj-text-2xs: clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem);   /* 11px -> 12px */
  --subj-text-xs:  clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);   /* 12px -> 13px */
  --subj-text-sm:  clamp(0.8125rem, 0.78rem + 0.2vw, 0.875rem);   /* 13px -> 14px */
  --subj-text-base: clamp(0.875rem, 0.84rem + 0.2vw, 0.9375rem);  /* 14px -> 15px */
  --subj-text-md:  clamp(0.9375rem, 0.9rem + 0.25vw, 1.0625rem);  /* 15px -> 17px */
  --subj-text-lg:  clamp(1.0625rem, 1rem + 0.35vw, 1.25rem);      /* 17px -> 20px */
  --subj-text-xl:  clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);       /* 20px -> 24px */
  --subj-text-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);     /* 24px -> 30px */
  --subj-text-3xl: clamp(1.875rem, 1.65rem + 1.1vw, 2.375rem);    /* 30px -> 38px */

  /* Neutral Slate Palette */
  --subj-slate-950: #060913;
  --subj-slate-900: #0B1120;
  --subj-slate-850: #101827;
  --subj-slate-800: #1E293B;
  --subj-slate-700: #334155;
  --subj-slate-600: #475569;
  --subj-slate-500: #64748B;
  --subj-slate-400: #94A3B8;
  --subj-slate-300: #CBD5E1;
  --subj-slate-200: #E2E8F0;
  --subj-slate-100: #F1F5F9;
  --subj-slate-50:  #F8FAFC;
  --subj-white:     #FFFFFF;

  /* Primary Brand - Subharti Polytechnic Indigo & Sapphire */
  --subj-indigo-900: #1E1B4B;
  --subj-indigo-800: #2E1065;
  --subj-indigo-700: #3730A3;
  --subj-indigo-600: #4338CA;
  --subj-indigo-500: #4F46E5;
  --subj-indigo-400: #6366F1;
  --subj-indigo-300: #818CF8;
  --subj-indigo-200: #C7D2FE;
  --subj-indigo-100: #E0E7FF;
  --subj-indigo-50:  #EEF2FF;

  /* Status Emerald (Present / Compliant >= 60%) */
  --subj-emerald-900: #064E3B;
  --subj-emerald-800: #065F46;
  --subj-emerald-700: #047857;
  --subj-emerald-600: #059669;
  --subj-emerald-500: #10B981;
  --subj-emerald-400: #34D399;
  --subj-emerald-300: #6EE7B7;
  --subj-emerald-200: #A7F3D0;
  --subj-emerald-100: #D1FAE5;
  --subj-emerald-50:  #ECFDF5;

  /* Status Crimson / Rose (Absent / Shortage < 60%) */
  --subj-rose-900: #881337;
  --subj-rose-800: #9F1239;
  --subj-rose-700: #BE123C;
  --subj-rose-600: #E11D48;
  --subj-rose-500: #F43F5E;
  --subj-rose-400: #FB7185;
  --subj-rose-300: #FDA4AF;
  --subj-rose-200: #FECDD3;
  --subj-rose-100: #FFE4E6;
  --subj-rose-50:  #FFF1F2;

  /* Status Amber / Gold (Pending / Holiday / Sunday) */
  --subj-amber-900: #78350F;
  --subj-amber-800: #92400E;
  --subj-amber-700: #B45309;
  --subj-amber-600: #D97706;
  --subj-amber-500: #F59E0B;
  --subj-amber-400: #FBBF24;
  --subj-amber-300: #FCD34D;
  --subj-amber-200: #FDE68A;
  --subj-amber-100: #FEF3C7;
  --subj-amber-50:  #FFFBEB;

  /* Accent Cyan (Conducted Rate / Realtime Analytics) */
  --subj-cyan-700: #0E7490;
  --subj-cyan-600: #0891B2;
  --subj-cyan-500: #06B6D4;
  --subj-cyan-400: #22D3EE;
  --subj-cyan-100: #CFFAFE;
  --subj-cyan-50:  #ECFEFF;

  /* Accent Purple (Subject Credits / Faculty Profile) */
  --subj-purple-700: #6D28D9;
  --subj-purple-600: #7C3AED;
  --subj-purple-500: #8B5CF6;
  --subj-purple-400: #A78BFA;
  --subj-purple-100: #EDE9FE;
  --subj-purple-50:  #F5F3FF;

  /* Accent Orange (Brand Highlights & Action Modals) */
  --subj-orange-600: #EA580C;
  --subj-orange-500: #FF6B0A;
  --subj-orange-400: #FB923C;
  --subj-orange-100: #FFEDD5;
  --subj-orange-50:  #FFF7ED;

  /* Surface & Container Semantics (Light Mode Default) */
  --subj-bg-app:        #F8FAFC;
  --subj-bg-card:       #FFFFFF;
  --subj-bg-card-hover: #FFFFFF;
  --subj-bg-subtle:     #F1F5F9;
  --subj-bg-muted:      #E2E8F0;
  --subj-bg-glass:      rgba(255, 255, 255, 0.85);
  --subj-bg-overlay:    rgba(15, 23, 42, 0.55);

  --subj-border-light:  #F1F5F9;
  --subj-border:        #E2E8F0;
  --subj-border-hover:  #CBD5E1;
  --subj-border-active: #94A3B8;

  --subj-text-main:     #0F172A;
  --subj-text-body:     #334155;
  --subj-text-muted:    #64748B;
  --subj-text-faint:    #94A3B8;

  /* Radii Scale */
  --subj-radius-xs:  4px;
  --subj-radius-sm:  6px;
  --subj-radius-md:  8px;
  --subj-radius-lg:  12px;
  --subj-radius-xl:  16px;
  --subj-radius-2xl: 20px;
  --subj-radius-3xl: 24px;
  --subj-radius-full: 9999px;

  /* Shadows Scale with Ambient Color Cast */
  --subj-shadow-xs:  0 1px 2px rgba(15, 23, 42, 0.04);
  --subj-shadow-sm:  0 2px 4px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03);
  --subj-shadow-md:  0 4px 8px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
  --subj-shadow-lg:  0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04);
  --subj-shadow-xl:  0 20px 32px -6px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.05);
  --subj-shadow-2xl: 0 28px 48px -8px rgba(15, 23, 42, 0.14), 0 12px 20px -4px rgba(15, 23, 42, 0.06);

  /* Glowing Shadows for Indicators */
  --subj-glow-emerald: 0 0 16px rgba(16, 185, 129, 0.35), 0 0 32px rgba(16, 185, 129, 0.15);
  --subj-glow-crimson: 0 0 16px rgba(244, 63, 94, 0.35), 0 0 32px rgba(244, 63, 94, 0.15);
  --subj-glow-amber:   0 0 16px rgba(245, 158, 11, 0.35), 0 0 32px rgba(245, 158, 11, 0.15);
  --subj-glow-indigo:  0 0 16px rgba(99, 102, 241, 0.35), 0 0 32px rgba(99, 102, 241, 0.15);

  /* Transitions & Springs */
  --subj-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --subj-ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --subj-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --subj-trans-fast:  150ms var(--subj-ease-smooth);
  --subj-trans-base:  220ms var(--subj-ease-smooth);
  --subj-trans-slow:  350ms var(--subj-ease-smooth);
  --subj-trans-spring: 400ms var(--subj-ease-spring);
}
`);

// --------------------------------------------------------------------------
// 2. BESPOKE KEYFRAMES LIBRARY (24 Custom Animations)
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   2. BESPOKE KEYFRAME ANIMATIONS LIBRARY (24 CUSTOM KEYFRAMES)
   ========================================================================== */

@keyframes subjPulseGlowEmerald {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4), 0 0 12px rgba(16, 185, 129, 0.2);
    border-color: var(--subj-emerald-500);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0), 0 0 20px rgba(16, 185, 129, 0.4);
    border-color: var(--subj-emerald-400);
  }
}

@keyframes subjPulseGlowCrimson {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.45), 0 0 12px rgba(244, 63, 94, 0.2);
    border-color: var(--subj-rose-500);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(244, 63, 94, 0), 0 0 22px rgba(244, 63, 94, 0.45);
    border-color: var(--subj-rose-400);
  }
}

@keyframes subjPulseGlowAmber {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), 0 0 10px rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(245, 158, 11, 0), 0 0 18px rgba(245, 158, 11, 0.35);
  }
}

@keyframes subjRadarRing {
  0% {
    transform: scale(0.9);
    opacity: 0.9;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

@keyframes subjCardLiftIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes subjCardBorderBeam {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes subjModalSpringIn {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(24px) rotateX(4deg);
  }
  70% {
    opacity: 1;
    transform: scale(1.015) translateY(-3px) rotateX(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0) rotateX(0deg);
  }
}

@keyframes subjBackdropBlurIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(14px);
  }
}

@keyframes subjButtonSpring {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(0.92);
  }
  75% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes subjIconFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes subjIconWiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg);
  }
  75% {
    transform: rotate(8deg);
  }
}

@keyframes subjDrawStroke {
  from {
    stroke-dashoffset: 600;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes subjDonutFill {
  from {
    stroke-dashoffset: 226.2;
    transform: rotate(-90deg) scale(0.94);
  }
  to {
    transform: rotate(-90deg) scale(1);
  }
}

@keyframes subjShimmerWave {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes subjSlideInRight {
  0% {
    opacity: 0;
    transform: translateX(45px);
  }
  70% {
    transform: translateX(-4px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes subjRowReveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes subjBeaconPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

@keyframes subjDownloadWave {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(0.95);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes subjGradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes subjFloatBadge {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes subjSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes subjTooltipPop {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.94);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes subjCellPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1.1);
  }
}

@keyframes subjProgressGlow {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8));
  }
}
`);

// --------------------------------------------------------------------------
// 3. BASE RESETS & SHELL CONTAINER
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   3. BASE RESETS, CONTAINER & BACKGROUND MESH
   ========================================================================== */

.student-subject-attendance-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: clamp(16px, 14px + 1vw, 32px);
  box-sizing: border-box;
  background-color: var(--subj-bg-app);
  background-image: 
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.04) 0px, transparent 50%),
    radial-gradient(at 50% 100%, rgba(244, 63, 94, 0.03) 0px, transparent 50%);
  background-attachment: fixed;
  font-family: var(--subj-font-sans);
  color: var(--subj-text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 14px + 0.8vw, 28px);
}

.student-subject-attendance-container *,
.student-subject-attendance-container *::before,
.student-subject-attendance-container *::after {
  box-sizing: border-box;
}

.calendar-first-layout {
  position: relative;
  z-index: 1;
}
`);

// --------------------------------------------------------------------------
// 4. UNIFIED HEADER BAR & BREADCRUMBS
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   4. UNIFIED HEADER BAR & BREADCRUMBS
   ========================================================================== */

.page-header-unified {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-2xl);
  padding: clamp(16px, 14px + 0.6vw, 24px) clamp(20px, 16px + 0.8vw, 32px);
  box-shadow: var(--subj-shadow-sm);
  position: relative;
  overflow: hidden;
  transition: box-shadow var(--subj-trans-base), border-color var(--subj-trans-base);
}

.page-header-unified::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4F46E5, #06B6D4, #10B981, #FF6B0A);
  opacity: 0.9;
}

.page-header-unified:hover {
  box-shadow: var(--subj-shadow-md);
  border-color: var(--subj-border-hover);
}

.header-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 340px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--subj-text-xs);
  font-weight: 500;
  color: var(--subj-text-muted);
}

.breadcrumbs .sep {
  color: var(--subj-text-faint);
  font-size: 11px;
}

.breadcrumbs .active {
  color: var(--subj-indigo-600);
  font-weight: 600;
}

.header-title {
  margin: 0;
  font-family: var(--subj-font-display);
  font-size: var(--subj-text-2xl);
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--subj-text-main);
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.2;
}

.header-icon-inline {
  color: var(--subj-indigo-600);
  filter: drop-shadow(0 2px 4px rgba(79, 70, 229, 0.2));
  flex-shrink: 0;
  animation: subjIconFloat 3.5s ease-in-out infinite;
}

.header-subtitle {
  margin: 0;
  font-size: var(--subj-text-sm);
  color: var(--subj-text-muted);
  font-weight: 400;
  line-height: 1.45;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
`);

// --------------------------------------------------------------------------
// 5. GLOBAL MONTH NAVIGATION TOOLBAR & QUICK JUMP
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   5. GLOBAL MONTH NAVIGATION TOOLBAR & ACTIONS
   ========================================================================== */

.global-month-bar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: 4px 6px;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
}

.g-month-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--subj-radius-lg);
  border: none;
  background: transparent;
  color: var(--subj-text-body);
  cursor: pointer;
  transition: all var(--subj-trans-fast);
}

.g-month-btn:hover {
  background: var(--subj-bg-card);
  color: var(--subj-indigo-600);
  box-shadow: var(--subj-shadow-xs);
  transform: scale(1.05);
}

.g-month-btn:active {
  transform: scale(0.95);
}

.g-month-display {
  padding: 0 10px;
  font-family: var(--subj-font-mono);
  font-size: var(--subj-text-sm);
  font-weight: 700;
  color: var(--subj-text-main);
  letter-spacing: -0.01em;
  user-select: none;
}

.g-today-pill {
  border: none;
  background: var(--subj-indigo-50);
  color: var(--subj-indigo-600);
  font-size: var(--subj-text-xs);
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--subj-radius-full);
  cursor: pointer;
  transition: all var(--subj-trans-fast);
  margin-left: 4px;
}

.g-today-pill:hover {
  background: var(--subj-indigo-500);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
}

.btn-refresh-unified {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--subj-radius-xl);
  border: 1px solid var(--subj-border);
  background: var(--subj-bg-card);
  color: var(--subj-text-main);
  font-size: var(--subj-text-sm);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--subj-shadow-xs);
  transition: all var(--subj-trans-base);
}

.btn-refresh-unified:hover:not(:disabled) {
  border-color: var(--subj-indigo-300);
  color: var(--subj-indigo-600);
  background: var(--subj-indigo-50);
  box-shadow: var(--subj-shadow-sm);
  transform: translateY(-1px);
}

.btn-refresh-unified:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-refresh-unified:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  animation: subjSpin 1s linear infinite;
}
`);

// --------------------------------------------------------------------------
// 6. TOP OVERVIEW KPI METRICS STRIP (6 CARDS)
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   6. TOP OVERVIEW KPI METRICS STRIP (6 ENTERPRISE CARDS)
   ========================================================================== */

.overview-strip-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: clamp(12px, 10px + 0.5vw, 18px);
  width: 100%;
}

.kpi-metric-card {
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: clamp(14px, 12px + 0.4vw, 18px);
  box-shadow: var(--subj-shadow-xs);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: transform var(--subj-trans-spring), box-shadow var(--subj-trans-base), border-color var(--subj-trans-base);
  animation: subjCardLiftIn 450ms var(--subj-ease-smooth) both;
}

.overview-strip-grid .kpi-metric-card:nth-child(1) { animation-delay: 50ms; }
.overview-strip-grid .kpi-metric-card:nth-child(2) { animation-delay: 100ms; }
.overview-strip-grid .kpi-metric-card:nth-child(3) { animation-delay: 150ms; }
.overview-strip-grid .kpi-metric-card:nth-child(4) { animation-delay: 200ms; }
.overview-strip-grid .kpi-metric-card:nth-child(5) { animation-delay: 250ms; }
.overview-strip-grid .kpi-metric-card:nth-child(6) { animation-delay: 300ms; }

.kpi-metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--subj-shadow-md);
  border-color: var(--subj-border-hover);
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--subj-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--subj-trans-spring);
}

.kpi-metric-card:hover .kpi-icon-wrap {
  transform: scale(1.1) rotate(-4deg);
}

.icon-purple  { background: var(--subj-purple-50);  color: var(--subj-purple-600); }
.icon-blue    { background: var(--subj-indigo-50);  color: var(--subj-indigo-600); }
.icon-emerald { background: var(--subj-emerald-50); color: var(--subj-emerald-600); }
.icon-cyan    { background: var(--subj-cyan-50);    color: var(--subj-cyan-600); }
.icon-amber   { background: var(--subj-amber-50);   color: var(--subj-amber-600); }
.icon-indigo  { background: #F0FDF4;               color: #15803D; }

.kpi-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.kpi-caption {
  font-size: var(--subj-text-xs);
  font-weight: 600;
  color: var(--subj-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-num-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin: 2px 0;
}

.kpi-number {
  font-family: var(--subj-font-mono);
  font-size: var(--subj-text-xl);
  font-weight: 800;
  color: var(--subj-text-main);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.font-emerald {
  color: var(--subj-emerald-600) !important;
}

.font-crimson {
  color: var(--subj-rose-600) !important;
}

.kpi-subtext {
  font-size: 11px;
  color: var(--subj-text-faint);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-badge-neutral,
.kpi-badge-blue,
.kpi-badge-green,
.kpi-badge-amber {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--subj-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.kpi-badge-neutral { background: var(--subj-slate-100);   color: var(--subj-slate-600); }
.kpi-badge-blue    { background: var(--subj-indigo-100);  color: var(--subj-indigo-700); }
.kpi-badge-green   { background: var(--subj-emerald-100); color: var(--subj-emerald-700); }
.kpi-badge-amber   { background: var(--subj-amber-100);   color: var(--subj-amber-800); }

.kpi-compliance-badges {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.pill-metric {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--subj-radius-full);
}

.pill-good  { background: var(--subj-emerald-100); color: var(--subj-emerald-800); }
.pill-alert { background: var(--subj-rose-100);    color: var(--subj-rose-800); }
`);

// --------------------------------------------------------------------------
// 7. FILTER & SEARCH CONTROLS TOOLBAR
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   7. FILTER & SEARCH CONTROLS TOOLBAR
   ========================================================================== */

.calendar-controls-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: 12px 18px;
  box-shadow: var(--subj-shadow-xs);
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-lg);
  padding: 0 14px;
  height: 40px;
  flex: 1 1 320px;
  max-width: 480px;
  transition: all var(--subj-trans-fast);
}

.search-input-box:focus-within {
  border-color: var(--subj-indigo-400);
  background: var(--subj-bg-card);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-input-box input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: var(--subj-text-sm);
  color: var(--subj-text-main);
  outline: none;
  font-family: inherit;
}

.search-input-box input::placeholder {
  color: var(--subj-text-faint);
}

.search-icon {
  color: var(--subj-text-muted);
  flex-shrink: 0;
}

.clear-search-btn {
  border: none;
  background: transparent;
  color: var(--subj-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--subj-radius-full);
  transition: all var(--subj-trans-fast);
}

.clear-search-btn:hover {
  background: var(--subj-slate-200);
  color: var(--subj-text-main);
}

.filter-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--subj-radius-full);
  border: 1px solid var(--subj-border);
  background: var(--subj-bg-card);
  color: var(--subj-text-body);
  font-size: var(--subj-text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--subj-trans-fast);
  user-select: none;
}

.filter-pill:hover {
  border-color: var(--subj-border-hover);
  background: var(--subj-bg-subtle);
  transform: translateY(-1px);
}

.filter-pill.active {
  background: var(--subj-indigo-600);
  color: #fff;
  border-color: var(--subj-indigo-600);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
}

.filter-pill.filter-alert.active {
  background: var(--subj-rose-600);
  border-color: var(--subj-rose-600);
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.35);
}

.filter-pill.filter-good.active {
  background: var(--subj-emerald-600);
  border-color: var(--subj-emerald-600);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.35);
}
`);

// --------------------------------------------------------------------------
// 8. SUBJECT CALENDARS GRID & CARD ANATOMY
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   8. SUBJECT CALENDARS GRID & CARD ANATOMY
   ========================================================================== */

.subject-calendars-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 14px + 0.8vw, 24px);
  width: 100%;
}

.subject-calendar-card {
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-2xl);
  box-shadow: var(--subj-shadow-sm);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: transform var(--subj-trans-spring), box-shadow var(--subj-trans-base), border-color var(--subj-trans-base);
  animation: subjCardLiftIn 500ms var(--subj-ease-smooth) both;
}

.subject-calendar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--subj-border);
  transition: all var(--subj-trans-base);
}

.subject-calendar-card.card-on-track::before {
  background: linear-gradient(90deg, #10B981, #34D399, #06B6D4);
}

.subject-calendar-card.card-shortage::before {
  background: linear-gradient(90deg, #E11D48, #F43F5E, #F59E0B);
}

.subject-calendar-card:hover {
  transform: translateY(-6px) scale(1.008);
  box-shadow: var(--subj-shadow-xl);
  border-color: var(--subj-border-hover);
}

.subject-calendar-card.card-shortage:hover {
  box-shadow: 0 20px 36px -8px rgba(225, 29, 72, 0.18), 0 8px 16px -4px rgba(225, 29, 72, 0.08);
}

.subject-calendar-card.card-on-track:hover {
  box-shadow: 0 20px 36px -8px rgba(16, 185, 129, 0.18), 0 8px 16px -4px rgba(16, 185, 129, 0.08);
}
`);

// --------------------------------------------------------------------------
// 9. CARD TOP BAR: IDENTITY & PERCENTAGES
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   9. CARD TOP BAR: IDENTITY & DUAL PERCENTAGES
   ========================================================================== */

.card-top-bar {
  padding: 20px 22px 14px 22px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--subj-border-light);
}

.subj-identity {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.subj-badge-code {
  font-family: var(--subj-font-mono);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--subj-radius-sm);
  background: var(--subj-indigo-50);
  color: var(--subj-indigo-700);
  border: 1px solid var(--subj-indigo-200);
  letter-spacing: 0.02em;
}

.subj-badge-credits {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--subj-radius-sm);
  background: var(--subj-slate-100);
  color: var(--subj-slate-600);
}

.compliance-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--subj-radius-full);
}

.compliance-pill.pill-good {
  background: var(--subj-emerald-100);
  color: var(--subj-emerald-800);
}

.compliance-pill.pill-warn {
  background: var(--subj-rose-100);
  color: var(--subj-rose-800);
  animation: subjPulseGlowCrimson 2.5s infinite;
}

.subj-name {
  margin: 0;
  font-family: var(--subj-font-display);
  font-size: var(--subj-text-md);
  font-weight: 700;
  color: var(--subj-text-main);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subj-faculty-room {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--subj-text-xs);
  color: var(--subj-text-muted);
  flex-wrap: wrap;
}

.faculty-label,
.room-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.subj-percentage-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.primary-pct-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.primary-pct-group .pct-val {
  font-family: var(--subj-font-mono);
  font-size: var(--subj-text-2xl);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}

.primary-pct-group .pct-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--subj-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.secondary-pct-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
}

.secondary-pct-group .pct-sub-val {
  font-family: var(--subj-font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--subj-text-body);
}

.secondary-pct-group .pct-sub-label {
  font-size: 10px;
  color: var(--subj-text-faint);
}
`);

// --------------------------------------------------------------------------
// 10. CARD MONTH NAVIGATION STRIP & QUICK STATS
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   10. CARD MONTH NAVIGATION STRIP & QUICK STATS
   ========================================================================== */

.card-month-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 22px;
  background: var(--subj-bg-subtle);
  border-bottom: 1px solid var(--subj-border);
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.month-nav-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--subj-radius-md);
  border: 1px solid var(--subj-border);
  background: var(--subj-bg-card);
  color: var(--subj-text-body);
  cursor: pointer;
  transition: all var(--subj-trans-fast);
  padding: 0;
}

.month-nav-btn:hover {
  background: var(--subj-indigo-50);
  border-color: var(--subj-indigo-300);
  color: var(--subj-indigo-600);
  transform: scale(1.08);
}

.current-month-label {
  font-family: var(--subj-font-mono);
  font-size: var(--subj-text-xs);
  font-weight: 700;
  color: var(--subj-text-main);
  padding: 0 4px;
  user-select: none;
}

.month-today-btn {
  border: none;
  background: var(--subj-indigo-100);
  color: var(--subj-indigo-700);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--subj-radius-full);
  cursor: pointer;
  transition: all var(--subj-trans-fast);
}

.month-today-btn:hover {
  background: var(--subj-indigo-600);
  color: #fff;
}

.month-quick-stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: var(--subj-font-mono);
  font-size: 11px;
}

.month-quick-stat .stat-attended {
  font-weight: 700;
  color: var(--subj-text-body);
}

.month-quick-stat .stat-pct {
  font-weight: 600;
  color: var(--subj-emerald-600);
}
`);

// --------------------------------------------------------------------------
// 11. CALENDAR WEEK HEADER & CELLS GRID
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   11. CALENDAR WEEK HEADER & CELLS GRID
   ========================================================================== */

.card-calendar-wrapper {
  padding: 16px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.calendar-week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  text-align: center;
}

.weekday-col {
  font-size: 11px;
  font-weight: 700;
  color: var(--subj-text-muted);
  text-transform: uppercase;
  padding: 4px 0;
  user-select: none;
}

.sunday-col {
  color: var(--subj-rose-500);
}

.calendar-cells-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-cell {
  aspect-ratio: 1;
  min-height: 38px;
  border-radius: var(--subj-radius-md);
  border: 1px solid var(--subj-border-light);
  background: var(--subj-bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: default;
  transition: all var(--subj-trans-fast);
  user-select: none;
}

.cal-cell.cell-empty {
  background: transparent;
  border-color: transparent;
  pointer-events: none;
}

.cal-cell.cell-sunday {
  background: var(--subj-slate-50);
  color: var(--subj-slate-400);
}

.cal-cell.cell-today {
  border-color: var(--subj-indigo-500);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.cal-cell.cell-holiday {
  background: #FFFBEB;
  border-color: #FDE68A;
}

.cell-day-num {
  font-family: var(--subj-font-mono);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.cell-status-badge {
  font-family: var(--subj-font-mono);
  font-size: 10px;
  font-weight: 800;
  width: 18px;
  height: 18px;
  border-radius: var(--subj-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 3px;
  line-height: 1;
  transition: transform var(--subj-trans-spring);
}

.badge-present {
  background: var(--subj-emerald-500);
  color: #fff;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
}

.badge-absent {
  background: var(--subj-rose-500);
  color: #fff;
  box-shadow: 0 2px 6px rgba(244, 63, 94, 0.4);
}

.badge-pending {
  background: var(--subj-amber-500);
  color: #fff;
}

.badge-holiday {
  background: #D97706;
  color: #fff;
}

.badge-cancelled {
  background: var(--subj-slate-400);
  color: #fff;
}

.badge-neutral {
  background: var(--subj-slate-200);
  color: var(--subj-slate-600);
}

/* Interactive Cell Hover & Pulse Radar */
.cal-cell.cell-interactive {
  cursor: pointer;
}

.cal-cell.cell-interactive:hover {
  transform: scale(1.15);
  z-index: 10;
  box-shadow: var(--subj-shadow-lg);
  border-color: var(--subj-indigo-400);
  background: var(--subj-bg-card);
}

.cal-cell.cell-interactive:hover .cell-status-badge {
  transform: scale(1.18);
}

.cal-cell.cell-interactive:has(.badge-present):hover {
  border-color: var(--subj-emerald-500);
  box-shadow: var(--subj-glow-emerald);
}

.cal-cell.cell-interactive:has(.badge-absent):hover {
  border-color: var(--subj-rose-500);
  box-shadow: var(--subj-glow-crimson);
}
`);

// --------------------------------------------------------------------------
// 12. FOUR ACTION ICON BUTTONS BAR
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   12. FOUR ACTION ICON BUTTONS BAR (GRAPH, ANALYTICS, FORECAST, HISTORY)
   ========================================================================== */

.card-actions-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 18px 16px 18px;
  background: var(--subj-bg-card);
  border-top: 1px solid var(--subj-border-light);
}

.action-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: var(--subj-radius-lg);
  border: 1px solid var(--subj-border);
  background: var(--subj-bg-subtle);
  color: var(--subj-text-body);
  font-family: var(--subj-font-sans);
  cursor: pointer;
  transition: all var(--subj-trans-fast);
  position: relative;
  overflow: hidden;
}

.action-icon-btn .btn-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1;
}

.action-icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--subj-shadow-sm);
}

.action-icon-btn:active {
  transform: translateY(1px) scale(0.97);
}

/* Individual Button Hover Accents */
.action-icon-btn.btn-graph:hover {
  background: var(--subj-indigo-50);
  border-color: var(--subj-indigo-300);
  color: var(--subj-indigo-600);
}

.action-icon-btn.btn-analytics:hover {
  background: var(--subj-purple-50);
  border-color: var(--subj-purple-300);
  color: var(--subj-purple-600);
}

.action-icon-btn.btn-forecast:hover {
  background: var(--subj-orange-50);
  border-color: var(--subj-orange-400);
  color: var(--subj-orange-600);
}

.action-icon-btn.btn-history:hover {
  background: var(--subj-emerald-50);
  border-color: var(--subj-emerald-300);
  color: var(--subj-emerald-700);
}

.action-icon-btn:hover svg {
  animation: subjIconFloat 1.8s ease-in-out infinite;
}
`);

// --------------------------------------------------------------------------
// 13. MODAL ARCHITECTURE: BACKDROP, CONTAINER & HEADER
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   13. MODAL ARCHITECTURE: BACKDROP, CONTAINER & HEADER
   ========================================================================== */

.subj-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: subjBackdropBlurIn 250ms ease-out forwards;
}

.subj-modal-container {
  width: 100%;
  max-width: 620px;
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-3xl);
  box-shadow: var(--subj-shadow-2xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: subjModalSpringIn 380ms var(--subj-ease-spring) forwards;
  max-height: 90vh;
}

.subj-modal-container.history-modal {
  max-width: 780px;
}

.subj-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 28px;
  border-bottom: 1px solid var(--subj-border);
  background: linear-gradient(180deg, var(--subj-bg-subtle) 0%, var(--subj-bg-card) 100%);
  position: relative;
}

.subj-modal-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subj-modal-eyebrow {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--subj-indigo-600);
}

.subj-modal-title {
  margin: 0;
  font-family: var(--subj-font-display);
  font-size: var(--subj-text-xl);
  font-weight: 800;
  color: var(--subj-text-main);
  line-height: 1.25;
}

.subj-modal-code {
  font-size: var(--subj-text-xs);
  color: var(--subj-text-muted);
  font-weight: 500;
}

.subj-modal-close {
  width: 36px;
  height: 36px;
  border-radius: var(--subj-radius-full);
  border: 1px solid var(--subj-border);
  background: var(--subj-bg-card);
  color: var(--subj-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--subj-trans-fast);
  flex-shrink: 0;
}

.subj-modal-close:hover {
  background: var(--subj-rose-50);
  border-color: var(--subj-rose-200);
  color: var(--subj-rose-600);
  transform: rotate(90deg) scale(1.05);
}

.subj-modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
`);

// --------------------------------------------------------------------------
// 14. MODAL 1: ATTENDANCE TREND GRAPH
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   14. MODAL 1: ATTENDANCE TREND GRAPH & TRAJECTORY CURVE
   ========================================================================== */

.subj-graph-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.subj-graph-kpi-card {
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subj-graph-kpi-card .kpi-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--subj-text-muted);
  text-transform: uppercase;
}

.subj-graph-kpi-card .kpi-val {
  font-family: var(--subj-font-mono);
  font-size: var(--subj-text-xl);
  font-weight: 800;
  color: var(--subj-text-main);
  line-height: 1.1;
}

.subj-graph-kpi-card .kpi-val.good {
  color: var(--subj-emerald-600);
}

.subj-graph-kpi-card .kpi-val.alert {
  color: var(--subj-rose-600);
}

.subj-graph-kpi-card .kpi-val.highlight {
  color: var(--subj-indigo-600);
}

.subj-graph-kpi-card .kpi-sub {
  font-size: 11px;
  color: var(--subj-text-faint);
}

.subj-chart-container {
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-title {
  font-size: var(--subj-text-xs);
  font-weight: 700;
  color: var(--subj-text-main);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.chart-legends {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 11px;
  color: var(--subj-text-muted);
  font-weight: 500;
}

.chart-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--subj-radius-full);
  margin-right: 4px;
}

.chart-dot.dot-blue { background: #2563EB; }
.chart-dot.dot-red  { background: #EF4444; }

.chart-svg-wrap {
  width: 100%;
}

.attendance-svg-chart {
  width: 100%;
  height: auto;
  overflow: visible;
}

.attendance-svg-chart path {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation: subjDrawStroke 1.2s ease-out forwards;
}

.attendance-svg-chart circle {
  transition: transform var(--subj-trans-spring);
}

.attendance-svg-chart circle:hover {
  transform: scale(1.4);
}
`);

// --------------------------------------------------------------------------
// 15. MODAL 2: SUBJECT ANALYTICS & STATISTICS
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   15. MODAL 2: SUBJECT ANALYTICS, DONUT CHART & BREAKDOWN
   ========================================================================== */

.donut-stats-row {
  display: flex;
  align-items: center;
  gap: 32px;
}

.donut-chart-box {
  width: 160px;
  height: 160px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  animation: subjDonutFill 1s var(--subj-ease-spring) forwards;
}

.donut-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.donut-val {
  font-family: var(--subj-font-mono);
  font-size: var(--subj-text-xl);
  font-weight: 800;
  color: var(--subj-text-main);
  line-height: 1;
}

.donut-lbl {
  font-size: 11px;
  color: var(--subj-text-muted);
  font-weight: 600;
  margin-top: 4px;
}

.analytics-breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-lg);
  font-size: var(--subj-text-xs);
  transition: transform var(--subj-trans-fast);
}

.breakdown-item:hover {
  transform: translateX(4px);
  background: var(--subj-bg-card);
}

.breakdown-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--subj-text-body);
  font-weight: 600;
}

.breakdown-value {
  font-family: var(--subj-font-mono);
  font-weight: 700;
  color: var(--subj-text-main);
}
`);

// --------------------------------------------------------------------------
// 16. MODAL 3: ATTENDANCE FORECAST & WHAT-IF SIMULATOR
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   16. MODAL 3: ATTENDANCE FORECAST & WHAT-IF SIMULATOR
   ========================================================================== */

.forecast-simulator-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: 14px 18px;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--subj-text-sm);
  font-weight: 600;
  color: var(--subj-text-main);
}

.slider-header strong {
  font-family: var(--subj-font-mono);
  color: var(--subj-emerald-600);
}

.range-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: var(--subj-radius-full);
  background: var(--subj-slate-200);
  outline: none;
  cursor: pointer;
  transition: background var(--subj-trans-fast);
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: var(--subj-radius-full);
  background: var(--subj-indigo-600);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.45);
  cursor: pointer;
  border: 2px solid #fff;
  transition: transform var(--subj-trans-fast);
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.range-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.projected-outcome-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  border-radius: var(--subj-radius-xl);
  border: 1px solid transparent;
  transition: all var(--subj-trans-base);
  animation: subjCardLiftIn 300ms ease-out both;
}

.projected-outcome-box.outcome-good {
  background: var(--subj-emerald-50);
  border-color: var(--subj-emerald-200);
  color: var(--subj-emerald-900);
}

.projected-outcome-box.outcome-alert {
  background: var(--subj-rose-50);
  border-color: var(--subj-rose-200);
  color: var(--subj-rose-900);
}

.outcome-info strong {
  font-size: var(--subj-text-md);
  display: block;
  margin-bottom: 4px;
}

.outcome-info p {
  margin: 0;
  font-size: var(--subj-text-xs);
  opacity: 0.9;
  line-height: 1.4;
}
`);

// --------------------------------------------------------------------------
// 17. MODAL 4: COMPLETE LECTURE HISTORY & CSV EXPORT
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   17. MODAL 4: COMPLETE LECTURE HISTORY & CSV EXPORT
   ========================================================================== */

.history-filter-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--subj-border);
}

.branch-picker {
  height: 36px;
  border-radius: var(--subj-radius-lg);
  border: 1px solid var(--subj-border);
  background: var(--subj-bg-card);
  color: var(--subj-text-main);
  padding: 0 12px;
  font-size: var(--subj-text-xs);
  font-weight: 600;
  outline: none;
}

.history-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--subj-bg-subtle);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-lg);
  padding: 0 10px;
  height: 36px;
}

.history-search input {
  border: none;
  background: transparent;
  font-size: var(--subj-text-xs);
  color: var(--subj-text-main);
  outline: none;
  width: 180px;
}

.btn-csv-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--subj-radius-lg);
  border: 1px solid var(--subj-emerald-300);
  background: var(--subj-emerald-50);
  color: var(--subj-emerald-700);
  font-size: var(--subj-text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--subj-trans-fast);
}

.btn-csv-download:hover:not(:disabled) {
  background: var(--subj-emerald-600);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  animation: subjDownloadWave 600ms ease;
}

.history-table-wrapper {
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  overflow: hidden;
}

.history-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--subj-text-xs);
  text-align: left;
}

.history-data-table th {
  background: var(--subj-bg-subtle);
  color: var(--subj-text-muted);
  font-weight: 700;
  text-transform: uppercase;
  padding: 12px 14px;
  border-bottom: 1px solid var(--subj-border);
  font-size: 11px;
}

.history-data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--subj-border-light);
  color: var(--subj-text-body);
}

.history-data-table tr:hover td {
  background: var(--subj-bg-subtle);
}

.status-cell-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: var(--subj-radius-full);
  text-transform: uppercase;
}

.pill-pres { background: var(--subj-emerald-100); color: var(--subj-emerald-800); }
.pill-abs  { background: var(--subj-rose-100);    color: var(--subj-rose-800); }
.pill-pend { background: var(--subj-amber-100);   color: var(--subj-amber-800); }
`);

// --------------------------------------------------------------------------
// 18. DRAWER 5: DATE ATTENDANCE INSPECTOR
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   18. DRAWER 5: DATE ATTENDANCE AUDIT INSPECTOR
   ========================================================================== */

.inspector-lecture-card {
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-xl);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--subj-shadow-xs);
  animation: subjSlideInRight 350ms var(--subj-ease-smooth) both;
}

.lec-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lec-period-badge {
  font-family: var(--subj-font-mono);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--subj-radius-sm);
  background: var(--subj-indigo-100);
  color: var(--subj-indigo-800);
}

.lec-time-slot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--subj-text-xs);
  color: var(--subj-text-muted);
  font-weight: 500;
}

.lec-subj-name {
  margin: 0;
  font-size: var(--subj-text-sm);
  font-weight: 700;
  color: var(--subj-text-main);
}

.lec-meta-tags {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--subj-text-muted);
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.inspector-no-lectures {
  text-align: center;
  padding: 40px 20px;
  color: var(--subj-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.inspector-no-lectures h4 {
  margin: 0;
  font-size: var(--subj-text-md);
  color: var(--subj-text-main);
}

.inspector-no-lectures p {
  margin: 0;
  font-size: var(--subj-text-xs);
  max-width: 320px;
}
`);

// --------------------------------------------------------------------------
// 19. LOADING SKELETONS, EMPTY STATES & ERROR RECOVERY
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   19. LOADING SKELETONS, EMPTY STATES & ERROR RECOVERY
   ========================================================================== */

.calendar-loading-skeleton {
  padding: 10px 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.skeleton-cell {
  aspect-ratio: 1;
  border-radius: var(--subj-radius-md);
  background: linear-gradient(90deg, var(--subj-slate-100) 25%, var(--subj-slate-200) 50%, var(--subj-slate-100) 75%);
  background-size: 200% 100%;
  animation: subjShimmerWave 1.8s infinite;
}

.loading-state-container,
.error-state-container,
.empty-state-container {
  grid-column: 1 / -1;
  background: var(--subj-bg-card);
  border: 1px solid var(--subj-border);
  border-radius: var(--subj-radius-2xl);
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: var(--subj-shadow-sm);
}

.loading-state-container {
  color: var(--subj-indigo-600);
}

.loading-state-container p {
  margin: 0;
  font-size: var(--subj-text-sm);
  color: var(--subj-text-muted);
}

.error-state-container {
  color: var(--subj-rose-600);
}

.error-state-container h3 {
  margin: 0;
  font-size: var(--subj-text-lg);
  color: var(--subj-text-main);
}

.error-state-container p {
  margin: 0;
  font-size: var(--subj-text-xs);
  color: var(--subj-text-muted);
}

.btn-retry,
.btn-reset-filters {
  margin-top: 8px;
  height: 38px;
  padding: 0 20px;
  border-radius: var(--subj-radius-lg);
  border: none;
  font-size: var(--subj-text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--subj-trans-fast);
}

.btn-retry {
  background: var(--subj-rose-600);
  color: #fff;
}

.btn-retry:hover {
  background: var(--subj-rose-700);
  transform: translateY(-1px);
}

.btn-reset-filters {
  background: var(--subj-indigo-600);
  color: #fff;
}

.btn-reset-filters:hover {
  background: var(--subj-indigo-700);
  transform: translateY(-1px);
}
`);

// --------------------------------------------------------------------------
// 20. DARK MODE ARCHITECTURE ([data-theme="dark"] & .dark)
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   20. COMPLETE DARK MODE ARCHITECTURE ([data-theme="dark"] & .dark)
   ========================================================================== */

[data-theme="dark"],
.dark {
  --subj-bg-app:        #060913;
  --subj-bg-card:       #0B1120;
  --subj-bg-card-hover: #0F172A;
  --subj-bg-subtle:     #101827;
  --subj-bg-muted:      #1E293B;
  --subj-bg-glass:      rgba(11, 17, 32, 0.88);
  --subj-bg-overlay:    rgba(3, 7, 18, 0.75);

  --subj-border-light:  #162032;
  --subj-border:        #1E293B;
  --subj-border-hover:  #334155;
  --subj-border-active: #475569;

  --subj-text-main:     #F8FAFC;
  --subj-text-body:     #CBD5E1;
  --subj-text-muted:    #94A3B8;
  --subj-text-faint:    #64748B;

  /* Elevated Glowing Highlights in Dark Mode */
  --subj-shadow-sm:  0 2px 4px rgba(0, 0, 0, 0.4);
  --subj-shadow-md:  0 4px 12px rgba(0, 0, 0, 0.5);
  --subj-shadow-lg:  0 12px 28px rgba(0, 0, 0, 0.6);
  --subj-shadow-xl:  0 20px 40px rgba(0, 0, 0, 0.7);
  --subj-shadow-2xl: 0 30px 60px rgba(0, 0, 0, 0.85);
}

[data-theme="dark"] .student-subject-attendance-container,
.dark .student-subject-attendance-container {
  background-image: 
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
    radial-gradient(at 50% 100%, rgba(244, 63, 94, 0.07) 0px, transparent 50%);
}

[data-theme="dark"] .page-header-unified,
.dark .page-header-unified {
  background: #0B1120;
  border-color: #1E293B;
}

[data-theme="dark"] .global-month-bar,
.dark .global-month-bar {
  background: #101827;
  border-color: #1E293B;
}

[data-theme="dark"] .g-month-btn:hover,
.dark .g-month-btn:hover {
  background: #1E293B;
  color: #818CF8;
}

[data-theme="dark"] .kpi-metric-card,
.dark .kpi-metric-card {
  background: #0B1120;
  border-color: #1E293B;
}

[data-theme="dark"] .kpi-metric-card:hover,
.dark .kpi-metric-card:hover {
  border-color: #334155;
  background: #0F172A;
}

[data-theme="dark"] .icon-purple,  .dark .icon-purple  { background: #1E1B4B; color: #A78BFA; }
[data-theme="dark"] .icon-blue,    .dark .icon-blue    { background: #172554; color: #60A5FA; }
[data-theme="dark"] .icon-emerald, .dark .icon-emerald { background: #064E3B; color: #34D399; }
[data-theme="dark"] .icon-cyan,    .dark .icon-cyan    { background: #083344; color: #38BDF8; }
[data-theme="dark"] .icon-amber,   .dark .icon-amber   { background: #451A03; color: #FBBF24; }
[data-theme="dark"] .icon-indigo,  .dark .icon-indigo  { background: #052E16; color: #4ADE80; }

[data-theme="dark"] .calendar-controls-toolbar,
.dark .calendar-controls-toolbar {
  background: #0B1120;
  border-color: #1E293B;
}

[data-theme="dark"] .search-input-box,
.dark .search-input-box {
  background: #101827;
  border-color: #1E293B;
}

[data-theme="dark"] .search-input-box:focus-within,
.dark .search-input-box:focus-within {
  border-color: #6366F1;
  background: #0B1120;
}

[data-theme="dark"] .filter-pill,
.dark .filter-pill {
  background: #0B1120;
  border-color: #1E293B;
  color: #CBD5E1;
}

[data-theme="dark"] .filter-pill:hover,
.dark .filter-pill:hover {
  background: #1E293B;
}

[data-theme="dark"] .subject-calendar-card,
.dark .subject-calendar-card {
  background: #0B1120;
  border-color: #1E293B;
}

[data-theme="dark"] .subject-calendar-card:hover,
.dark .subject-calendar-card:hover {
  background: #0D1527;
  border-color: #334155;
}

[data-theme="dark"] .card-month-strip,
.dark .card-month-strip {
  background: #101827;
  border-color: #1E293B;
}

[data-theme="dark"] .month-nav-btn,
.dark .month-nav-btn {
  background: #0B1120;
  border-color: #1E293B;
  color: #CBD5E1;
}

[data-theme="dark"] .month-nav-btn:hover,
.dark .month-nav-btn:hover {
  background: #1E293B;
  color: #818CF8;
}

[data-theme="dark"] .cal-cell,
.dark .cal-cell {
  background: #0B1120;
  border-color: #162032;
  color: #E2E8F0;
}

[data-theme="dark"] .cal-cell.cell-sunday,
.dark .cal-cell.cell-sunday {
  background: #080D1A;
  color: #475569;
}

[data-theme="dark"] .cal-cell.cell-holiday,
.dark .cal-cell.cell-holiday {
  background: #451A03;
  border-color: #78350F;
  color: #FCD34D;
}

[data-theme="dark"] .cal-cell.cell-interactive:hover,
.dark .cal-cell.cell-interactive:hover {
  background: #1E293B;
  border-color: #6366F1;
}

[data-theme="dark"] .card-actions-bar,
.dark .card-actions-bar {
  background: #0B1120;
  border-color: #1E293B;
}

[data-theme="dark"] .action-icon-btn,
.dark .action-icon-btn {
  background: #101827;
  border-color: #1E293B;
  color: #CBD5E1;
}

[data-theme="dark"] .action-icon-btn.btn-graph:hover,
.dark .action-icon-btn.btn-graph:hover {
  background: #1E1B4B;
  border-color: #4F46E5;
  color: #818CF8;
}

[data-theme="dark"] .action-icon-btn.btn-analytics:hover,
.dark .action-icon-btn.btn-analytics:hover {
  background: #2E1065;
  border-color: #7C3AED;
  color: #C084FC;
}

[data-theme="dark"] .action-icon-btn.btn-forecast:hover,
.dark .action-icon-btn.btn-forecast:hover {
  background: #431407;
  border-color: #EA580C;
  color: #FB923C;
}

[data-theme="dark"] .action-icon-btn.btn-history:hover,
.dark .action-icon-btn.btn-history:hover {
  background: #064E3B;
  border-color: #059669;
  color: #34D399;
}

[data-theme="dark"] .subj-modal-container,
.dark .subj-modal-container {
  background: #0B1120;
  border-color: #1E293B;
}

[data-theme="dark"] .subj-modal-header,
.dark .subj-modal-header {
  background: #101827;
  border-color: #1E293B;
}

[data-theme="dark"] .subj-modal-close,
.dark .subj-modal-close {
  background: #0B1120;
  border-color: #1E293B;
  color: #94A3B8;
}

[data-theme="dark"] .subj-modal-close:hover,
.dark .subj-modal-close:hover {
  background: #4C0519;
  border-color: #9F1239;
  color: #FDA4AF;
}

[data-theme="dark"] .subj-graph-kpi-card,
.dark .subj-graph-kpi-card,
[data-theme="dark"] .subj-chart-container,
.dark .subj-chart-container,
[data-theme="dark"] .slider-group,
.dark .slider-group,
[data-theme="dark"] .breakdown-item,
.dark .breakdown-item {
  background: #101827;
  border-color: #1E293B;
}

[data-theme="dark"] .history-data-table th,
.dark .history-data-table th {
  background: #101827;
  border-color: #1E293B;
}

[data-theme="dark"] .history-data-table td,
.dark .history-data-table td {
  border-color: #162032;
}

[data-theme="dark"] .history-data-table tr:hover td,
.dark .history-data-table tr:hover td {
  background: #101827;
}

[data-theme="dark"] .inspector-lecture-card,
.dark .inspector-lecture-card {
  background: #0B1120;
  border-color: #1E293B;
}
`);

// --------------------------------------------------------------------------
// 21. RESPONSIVE BREAKPOINTS (1920px -> 360px)
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   21. RESPONSIVE ENGINE BREAKPOINTS (1920px -> 360px)
   ========================================================================== */

/* Ultra-Wide 1920px Full HD */
@media (min-width: 1700px) {
  .subject-calendars-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 1440px Desktop Standard */
@media (max-width: 1440px) {
  .subject-calendars-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .overview-strip-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 1200px Laptop */
@media (max-width: 1200px) {
  .overview-strip-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .subject-calendars-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 1024px Tablet Landscape */
@media (max-width: 1024px) {
  .page-header-unified {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  .subject-calendars-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .donut-stats-row {
    flex-direction: column;
    text-align: center;
  }
}

/* 768px Tablet Portrait */
@media (max-width: 768px) {
  .student-subject-attendance-container {
    padding: 14px;
    gap: 16px;
  }
  .overview-strip-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .subject-calendars-grid {
    grid-template-columns: 1fr;
  }
  .calendar-controls-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input-box {
    max-width: 100%;
  }
  .filter-pills-row {
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .card-top-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .subj-percentage-stack {
    align-items: flex-start;
    flex-direction: row;
    gap: 18px;
    margin-top: 6px;
  }
}

/* 480px Mobile Standard */
@media (max-width: 480px) {
  .overview-strip-grid {
    grid-template-columns: 1fr;
  }
  .card-actions-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  .subj-graph-kpi-grid {
    grid-template-columns: 1fr;
  }
  .history-filter-strip {
    flex-direction: column;
    align-items: stretch;
  }
  .history-search input {
    width: 100%;
  }
}

/* 360px Small Mobile */
@media (max-width: 360px) {
  .cal-cell {
    min-height: 32px;
  }
  .cell-day-num {
    font-size: 10px;
  }
  .cell-status-badge {
    width: 14px;
    height: 14px;
    font-size: 8px;
  }
  .action-icon-btn {
    padding: 6px 2px;
  }
  .action-icon-btn .btn-label {
    font-size: 10px;
  }
}
`);

// --------------------------------------------------------------------------
// 22. ACCESSIBILITY & PRINT MEDIA
// --------------------------------------------------------------------------
add(`/* ==========================================================================
   22. ACCESSIBILITY & PRINT MEDIA
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@media print {
  body {
    background: #fff !important;
    color: #000 !important;
  }
  .student-subject-attendance-container {
    padding: 0 !important;
    background: none !important;
  }
  .page-header-unified,
  .calendar-controls-toolbar,
  .card-actions-bar,
  .month-selector,
  .btn-refresh-unified,
  .global-month-bar {
    display: none !important;
  }
  .subject-calendars-grid {
    display: block !important;
  }
  .subject-calendar-card {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
    margin-bottom: 24px;
  }
}
`);

console.log("Core base lines count:", out.join("\n").split("\n").length);
fs.writeFileSync("backend/scratch_css_base.css", out.join("\n"));
