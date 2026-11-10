import React from "react";
import {
  Activity,
  CheckCircle2,
  FileCheck,
  Award,
  BookOpen,
  Clock,
  Sparkles
} from "lucide-react";

export const DEFAULT_ACTIVITIES = [
  {
    id: "act-1",
    title: "Sessional Examination Recorded",
    subtitle: "Scored 22/25 in OOPS with Java (Sessional 3)",
    time: "Today",
    icon: Sparkles,
    colorClass: "blue"
  },
  {
    id: "act-2",
    title: "Completed Assignment Submission",
    subtitle: "Web Technologies Assignment 4 submitted on time",
    time: "2 days ago",
    icon: CheckCircle2,
    colorClass: "emerald"
  },
  {
    id: "act-3",
    title: "Verified Attendance Milestone",
    subtitle: "85% overall attendance verified by Academic Cell",
    time: "This week",
    icon: BookOpen,
    colorClass: "purple"
  },
  {
    id: "act-4",
    title: "Digital Handout Downloaded",
    subtitle: "Downloaded Operating Systems Lab Manual (CS-501)",
    time: "1 week ago",
    icon: FileCheck,
    colorClass: "amber"
  }
];

export default function ActivityTimeline({
  activities = [],
  onViewAll
}) {
  const displayActivities = Array.isArray(activities) && activities.length > 0
    ? activities
    : DEFAULT_ACTIVITIES;

  return (
    <div className="sp2-bento-card sp2-card-activity" id="section-activity">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap purple">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Recent Academic Activity</h2>
            <p className="sp2-card-subtitle">Chronological academic milestones and system log</p>
          </div>
        </div>
      </div>

      <div className="sp2-activity-body">
        <div className="sp2-activity-stream">
          {displayActivities.map((act) => {
            const Icon = act.icon || Activity;
            return (
              <div key={act.id} className="sp2-activity-item">
                <div className={`sp2-act-icon-box ${act.colorClass || "blue"}`}>
                  <Icon size={14} />
                </div>
                <div className="sp2-act-content">
                  <div className="sp2-act-top">
                    <h4 className="sp2-act-title">{act.title}</h4>
                    <span className="sp2-act-time">
                      <Clock size={11} />
                      <span>{act.time}</span>
                    </span>
                  </div>
                  <p className="sp2-act-sub">{act.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
