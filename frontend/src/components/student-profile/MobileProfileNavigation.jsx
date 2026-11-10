import React from "react";
import {
  Home,
  BookOpen,
  LayoutGrid,
  GraduationCap,
  Bell,
  MessageSquare,
  User,
  Wifi,
  Battery,
  Signal,
  Sparkles
} from "lucide-react";

export function MobileTopStatusBar({
  onNotificationClick,
  unreadNotifications = 3
}) {
  return (
    <header className="mobile-app-header-container">
      {/* iOS / Modern Status Bar */}
      <div className="mobile-phone-status-bar">
        <span className="mobile-status-time">9:41</span>
        <div className="mobile-status-notch-indicator" />
        <div className="mobile-status-icons">
          <Signal size={13} />
          <Wifi size={13} />
          <Battery size={15} />
        </div>
      </div>

      {/* CollegeOS Polytechnic Top Bar */}
      <div className="mobile-brand-action-bar">
        <div className="mobile-brand-identity">
          <div className="mobile-brand-logo-badge">
            <GraduationCap size={22} className="mobile-logo-icon" />
            <div className="mobile-logo-glow" />
          </div>
          <div className="mobile-brand-title-wrap">
            <h1 className="mobile-app-name">CollegeOS</h1>
            <span className="mobile-app-sub">Subharti Polytechnic</span>
          </div>
        </div>

        <div className="mobile-brand-motto-wrap">
          <span className="mobile-motto-text">Dream &bull; Learn &bull; Grow</span>
          <button
            type="button"
            className="mobile-bell-btn"
            onClick={onNotificationClick}
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="mobile-bell-badge">{unreadNotifications}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNavigation({
  activeTab = "profile",
  onTabChange,
  unreadNotifications = 3,
  unreadMessages = 2,
  onCenterAction
}) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "academics", label: "Academics", icon: BookOpen },
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "center-action", label: "Academics Hub", isCenter: true },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifications },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <nav className="mobile-bottom-dock-nav" aria-label="Mobile Bottom Navigation">
      <div className="dock-glass-capsule">
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <button
                key="center"
                type="button"
                className="dock-center-action-btn"
                onClick={onCenterAction}
                aria-label="Launch Academic Portal"
              >
                <div className="center-btn-inner">
                  <GraduationCap size={22} />
                  <div className="center-pulse-glow" />
                </div>
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`dock-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onTabChange?.(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="dock-icon-wrapper">
                <Icon size={19} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="dock-counter-pill">{item.badge}</span>
                )}
              </div>
              <span className="dock-nav-label">{item.label}</span>
              {isActive && <span className="dock-active-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
