import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import StudentProfile from "./pages/student/StudentProfile";
import { authApi } from "./services/authApi";

/**
 * Hash-based router parser.
 * Supported routes:
 *   #/              → home
 *   #/login         → login
 *   #/register      → register
 *   #/forgot-password → forgot-password
 *   #/reset-password  → reset-password
 *   #/profile       → profile
 *   #/dashboard     → dashboard (with optional sub-tab)
 *   #/dashboard/:tab → dashboard sub-tab
 *   #/students      → All Students directory
 *   #/students/:id  → Student public profile
 */
function parseHashRoute() {
  const hash = window.location.hash.toLowerCase();

  if (hash.startsWith("#/dashboard")) {
    const sub = hash.replace("#/dashboard", "").replace(/^\//, "").split("?")[0];
    return { view: "dashboard", subTab: sub || "overview" };
  }
  if (hash.startsWith("#/register")) return { view: "register" };
  if (hash.startsWith("#/login")) return { view: "login" };
  if (hash.startsWith("#/forgot-password")) return { view: "forgot-password" };
  if (hash.startsWith("#/reset-password")) return { view: "reset-password" };
  if (hash.startsWith("#/profile")) return { view: "profile" };

  // Students routes — parse case-insensitively
  const rawHash = window.location.hash;
  if (/^#\/students\/([a-f0-9]{24})/i.test(rawHash)) {
    const match = rawHash.match(/^#\/students\/([a-f0-9]{24})/i);
    return { view: "student-profile", studentId: match[1] };
  }
  if (/^#\/students/i.test(rawHash)) {
    return { view: "students" };
  }
  if (/^#\/faculty/i.test(rawHash)) {
    return { view: "faculty" };
  }

  return { view: "home" };
}

function App() {
  const [route, setRoute] = useState(parseHashRoute);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (targetView, query = "") => {
    if (targetView === "login") {
      window.location.hash = "#/login";
    } else if (targetView === "register") {
      window.location.hash = "#/register";
    } else if (targetView === "forgot-password") {
      window.location.hash = "#/forgot-password";
    } else if (targetView === "reset-password") {
      window.location.hash = query ? `#/reset-password${query}` : "#/reset-password";
    } else if (targetView === "profile") {
      window.location.hash = "#/profile";
    } else if (targetView === "dashboard") {
      window.location.hash = query ? `#/dashboard/${query}` : "#/dashboard";
    } else if (targetView === "students") {
      window.location.hash = "#/students";
    } else if (targetView === "faculty") {
      window.location.hash = "#/faculty";
    } else if (targetView === "student-profile") {
      window.location.hash = `#/students/${query}`;
    } else {
      window.location.hash = "#/";
    }
    setRoute(parseHashRoute());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigatePage = (pageId) => {
    if (pageId === "profile") navigate("profile");
    else if (pageId === "students") navigate("students");
    else if (pageId === "faculty") navigate("faculty");
    else if (pageId === "home") navigate("home");
    else if (pageId === "dashboard") navigate("dashboard");
    else navigate(pageId);
  };

  return (
    <div className="app">
      {route.view === "register" && <Register onNavigate={navigate} />}
      {route.view === "login" && <Login onNavigate={navigate} />}
      {route.view === "forgot-password" && <ForgotPassword onNavigate={navigate} />}
      {route.view === "reset-password" && <ResetPassword onNavigate={navigate} />}
      {route.view === "profile" && (
        authApi.getCurrentUser()?.role === "student" ? (
          <Dashboard
            onNavigate={navigate}
            onNavigatePage={handleNavigatePage}
            initialTab="profile"
          />
        ) : (
          <Profile onNavigate={navigate} />
        )
      )}

      {route.view === "dashboard" && (
        <Dashboard
          onNavigate={navigate}
          onNavigatePage={handleNavigatePage}
          initialTab={route.subTab || "overview"}
        />
      )}

      {route.view === "students" && (
        <Dashboard
          onNavigate={navigate}
          onNavigatePage={handleNavigatePage}
          initialTab="students"
        />
      )}

      {route.view === "faculty" && (
        <Dashboard
          onNavigate={navigate}
          onNavigatePage={handleNavigatePage}
          initialTab="faculty"
        />
      )}

      {route.view === "student-profile" && (
        <Dashboard
          onNavigate={navigate}
          onNavigatePage={handleNavigatePage}
          initialTab="student-profile"
          initialStudentId={route.studentId}
        />
      )}

      {route.view === "home" && <Home onNavigate={navigate} />}
    </div>
  );
}

export default App;
