import React, { useState, useEffect } from "react";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Home as HomeIcon,
  UserCheck,
  Sparkles,
  GraduationCap,
  BookOpen,
  User
} from "lucide-react";
import { authApi } from "../services/authApi";
import AuthLayout from "../components/AuthLayout";
import "./Login.css";

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [authSuccessUser, setAuthSuccessUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    authApi.fetchMe().then((user) => {
      if (mounted && user) {
        setAuthSuccessUser(user);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Quick fill demo credentials
  const fillDemo = (roleType) => {
    setErrorMsg("");
    if (roleType === "student") {
      setEmail("student.demo@subharti.org");
      setPassword("Student@123");
    } else {
      setEmail("faculty.demo@subharti.org");
      setPassword("Faculty@123");
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password
      });
      setAuthSuccessUser(res.user);
    } catch (err) {
      setErrorMsg(err.message || "Invalid email address or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout currentView="login" onNavigate={onNavigate}>
      <div className="login-card card-glass">
        {/* If already authenticated successfully */}
        {authSuccessUser ? (
          <div className="login-success-state">
            <div className="login-success-badge">
              <UserCheck size={52} className="success-icon" />
            </div>
            <h2>Welcome Back!</h2>
            <p className="success-user-name">{authSuccessUser.fullName}</p>
            <span className="success-role-pill">
              {authSuccessUser.role === "student" ? "Diploma Candidate" : "Faculty Member"} •{" "}
              {authSuccessUser.branch || authSuccessUser.department || "Subharti Polytechnic"}
            </span>

            <div className="success-notice-box">
              <ShieldCheck size={18} />
              <p>
                You are authenticated with CollegeOS. In production, this redirects to your personalized {authSuccessUser.role} portal.
              </p>
            </div>

            <div className="success-actions-row">
              <button
                type="button"
                className="primary-login-btn"
                onClick={() => onNavigate?.("profile")}
              >
                <User size={16} /> View Profile & Ledger
              </button>
              <button
                type="button"
                className="secondary-login-btn"
                onClick={() => onNavigate?.("home")}
              >
                <HomeIcon size={16} /> Campus Portal
              </button>
              <button
                type="button"
                className="secondary-login-btn"
                onClick={async () => {
                  await authApi.logout();
                  setAuthSuccessUser(null);
                  setPassword("");
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Card Header */}
            <div className="login-header">
              <div className="login-logo-badge">
                <img
                  src="/svsu-logo-whiten.webp"
                  alt="Swami Vivekanand Subharti University"
                  className="login-univ-img"
                />
              </div>
              <div className="login-badge-chip">
                <Sparkles size={13} /> SVSU Digital Gateway
              </div>
              <h1>Sign in to CollegeOS</h1>
              <p>
                Access your Subharti Polytechnic academic portal, attendance records, and departmental services.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="login-alert" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Fill Demo Bar */}
            <div className="demo-fill-card">
              <span className="demo-card-title">Quick-Fill Demo Credentials:</span>
              <div className="demo-btns-row">
                <button
                  type="button"
                  className="demo-btn student"
                  onClick={() => fillDemo("student")}
                >
                  <GraduationCap size={14} /> Student Demo
                </button>
                <button
                  type="button"
                  className="demo-btn faculty"
                  onClick={() => fillDemo("faculty")}
                >
                  <BookOpen size={14} /> Faculty Demo
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-field-group">
                <label htmlFor="login-email">
                  <Mail size={15} /> Registered Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="student.demo@subharti.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field-group">
                <div className="label-with-hint">
                  <label htmlFor="login-password">
                    <Lock size={15} /> Password
                  </label>
                  <button
                    type="button"
                    className="forgot-password-link-btn"
                    onClick={() => onNavigate?.("forgot-password")}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pwd-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="primary-login-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Card Footer: Switch to Register */}
            <div className="login-card-footer">
              <p>Don't have an institutional account yet?</p>
              <button
                type="button"
                className="register-flow-trigger-btn"
                onClick={() => onNavigate?.("register")}
              >
                Start Role-Based Registration & Onboarding <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
