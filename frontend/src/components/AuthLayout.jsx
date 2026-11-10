import React, { useState, useEffect } from "react";
import { Home as HomeIcon, ShieldCheck, CheckCircle2 } from "lucide-react";
import Campus3DCanvas from "./Campus3DCanvas";
import { CAMPUS_CHAPTERS } from "../data/campusChapters";
import "./AuthLayout.css";

/**
 * CollegeOS auth split layout
 * LEFT: cinematic 3D campus film (Aarav's journey). RIGHT: login / register (children).
 * Overlays over the 3D scene: top brand + home (always), then EITHER the opening headline
 * (first 4.2s) OR one small chapter caption that fades out by itself.
 */
export default function AuthLayout({ children, currentView = "login", onNavigate }) {
  const [sceneInfo, setSceneInfo] = useState({
    chapter: 1,
    totalChapters: CAMPUS_CHAPTERS.length,
    time: CAMPUS_CHAPTERS[0].time,
    title: CAMPUS_CHAPTERS[0].title,
    desc: CAMPUS_CHAPTERS[0].desc
  });
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShowIntro(false), 4200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="auth-shell">
      <aside className="auth-visual-side" aria-label="CollegeOS 3D Campus Experience">
        <Campus3DCanvas
          className="auth-3d-scene"
          onSceneUpdate={(info) => setSceneInfo((s) => ({ ...s, ...info }))}
        />
        <div className="visual-vignette" aria-hidden="true" />

        <div className="visual-content-overlay">
          <div className="visual-top-bar">
            <button
              type="button"
              className="visual-brand-compact"
              onClick={() => onNavigate?.("home")}
              aria-label="Return to Subharti Polytechnic Home"
            >
              <div className="visual-brand-mini-badge">
                <img
                  src="/svsu-logo-whiten.webp"
                  alt="Swami Vivekanand Subharti University"
                  className="visual-brand-mini-logo"
                />
              </div>
              <div className="visual-brand-compact-text">
                <span className="brand-compact-poly">SUBHARTI POLYTECHNIC</span>
                <span className="brand-compact-sep">·</span>
                <span className="brand-compact-univ">Swami Vivekanand Subharti University</span>
              </div>
            </button>

            <button
              type="button"
              className="visual-home-link"
              onClick={() => onNavigate?.("home")}
              title="Return to Public Campus Website"
              aria-label="Campus Home"
            >
              <HomeIcon size={14} className="home-link-icon" />
              <span className="home-label-desktop">Campus Home</span>
              <span className="home-label-mobile">Campus</span>
            </button>
          </div>

          {showIntro ? (
            <div className="visual-hero-intro" aria-live="polite">
              <h1 className="hero-intro-title">Build Your Future.</h1>
              <span className="hero-intro-institution">One Skill at a Time.</span>
              <div className="hero-intro-line" />
            </div>
          ) : (
            <div
              key={sceneInfo.chapter}
              className="visual-scene-caption"
              role="status"
              aria-live="polite"
            >
              <div className="scene-caption-header">
                <span className="scene-chapter-badge">
                  {sceneInfo.time ? `${sceneInfo.time} · ` : ""}Scene {String(sceneInfo.chapter).padStart(2, "0")} /{" "}
                  {String(sceneInfo.totalChapters).padStart(2, "0")}
                </span>
                <span className="scene-chapter-sep">·</span>
                <strong className="scene-chapter-title">{sceneInfo.title}</strong>
              </div>
              <p className="scene-caption-desc">{sceneInfo.desc}</p>
            </div>
          )}
        </div>
      </aside>

      <main className="auth-form-side">
        <header className="auth-top-nav-bar">
          <div className="auth-nav-identity">
            <div className="auth-nav-icon-badge">
              <ShieldCheck size={16} />
            </div>
            <div className="auth-nav-text">
              <strong>CollegeOS Portal</strong>
              <span>Subharti Polytechnic</span>
            </div>
          </div>

          <div className="auth-nav-switcher" role="tablist" aria-label="Authentication Mode">
            <button
              type="button"
              role="tab"
              aria-selected={currentView === "login"}
              className={`switcher-tab ${currentView === "login" ? "active" : ""}`}
              onClick={() => onNavigate?.("login")}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentView === "register"}
              className={`switcher-tab ${currentView === "register" ? "active" : ""}`}
              onClick={() => onNavigate?.("register")}
            >
              Create Account
            </button>
          </div>
        </header>

        <div className="auth-panel-viewport">
          <div className="auth-panel-content-column">{children}</div>
        </div>

        <footer className="auth-bottom-footer">
          <div className="footer-security-tag">
            <CheckCircle2 size={13} />
            <span>Encrypted Single Sign-On Gateway</span>
          </div>
          <span className="footer-copy-text">© Swami Vivekanand Subharti University</span>
        </footer>
      </main>
    </div>
  );
}