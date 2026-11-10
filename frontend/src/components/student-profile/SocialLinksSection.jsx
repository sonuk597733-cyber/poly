import React, { useState } from "react";
import {
  Link2,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Plus
} from "lucide-react";
import {
  IconLinkedIn,
  IconGitHub,
  IconYouTube,
  IconTwitter,
  IconInstagram,
  IconDiscord,
  IconLeetCode
} from "./BrandIcons";

export default function SocialLinksSection({ profile, onEdit }) {
  const [copiedId, setCopiedId] = useState(null);
  const links = profile?.socialLinks || {};

  const handleCopy = (id, url) => {
    if (!url || !navigator?.clipboard?.writeText) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const platforms = [
    {
      id: "github",
      label: "GitHub",
      url: links.github || profile?.github || "",
      icon: IconGitHub,
      color: "#24292e"
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      url: links.linkedin || profile?.linkedin || "",
      icon: IconLinkedIn,
      color: "#0a66c2"
    },
    {
      id: "portfolio",
      label: "Portfolio",
      url: links.portfolio || profile?.portfolio || profile?.website || "",
      icon: Globe,
      color: "#2563eb"
    },
    {
      id: "leetcode",
      label: "LeetCode",
      url: links.leetcode || "",
      icon: IconLeetCode,
      color: "#f89f1b"
    },
    {
      id: "twitter",
      label: "X (Twitter)",
      url: links.twitter || "",
      icon: IconTwitter,
      color: "#000000"
    },
    {
      id: "youtube",
      label: "YouTube",
      url: links.youtube || "",
      icon: IconYouTube,
      color: "#ff0000"
    },
    {
      id: "discord",
      label: "Discord",
      url: links.discord || "",
      icon: IconDiscord,
      color: "#5865f2"
    }
  ];

  const connectedPlatforms = platforms.filter((p) => Boolean(p.url));
  const unconfiguredPlatforms = platforms.filter((p) => !p.url).slice(0, 3);

  return (
    <div className="sp2-bento-card sp2-card-social" id="section-social">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap cyan">
            <Link2 size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Verified Handles & Networks</h2>
            <p className="sp2-card-subtitle">Developer profiles and professional social links</p>
          </div>
        </div>
        <button
          type="button"
          className="sp2-card-action-pill"
          onClick={() => onEdit?.("social")}
          aria-label="Manage Handles"
        >
          <Edit2 size={13} />
          <span>Edit Links</span>
        </button>
      </div>

      <div className="sp2-social-body">
        {connectedPlatforms.length > 0 ? (
          <div className="sp2-social-grid">
            {connectedPlatforms.map((plat) => {
              const Icon = plat.icon;
              const isCopied = copiedId === plat.id;
              // Extract clean handle from url
              const displayHandle = plat.url
                .replace(/^https?:\/\/(www\.)?/, "")
                .replace(/\/$/, "");

              return (
                <div key={plat.id} className="sp2-social-handle-card">
                  <div className="sp2-social-icon-box">
                    <Icon size={18} />
                  </div>
                  <div className="sp2-social-meta">
                    <span className="sp2-social-platform-name">{plat.label}</span>
                    <a
                      href={plat.url.startsWith("http") ? plat.url : `https://${plat.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp2-social-handle-link"
                      title={plat.url}
                    >
                      <span>{displayHandle}</span>
                    </a>
                  </div>
                  <div className="sp2-social-actions">
                    <button
                      type="button"
                      className="sp2-social-mini-btn"
                      onClick={() => handleCopy(plat.id, plat.url)}
                      title="Copy link"
                      aria-label={`Copy ${plat.label} link`}
                    >
                      {isCopied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                    </button>
                    <a
                      href={plat.url.startsWith("http") ? plat.url : `https://${plat.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp2-social-mini-btn"
                      title="Open external profile"
                      aria-label={`Visit ${plat.label}`}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="sp2-social-empty-state">
            <p>No professional social handles linked yet.</p>
            <button
              type="button"
              className="sp2-btn-inline-add"
              onClick={() => onEdit?.("social")}
            >
              <Plus size={14} />
              <span>Link GitHub & LinkedIn</span>
            </button>
          </div>
        )}

        {/* Quick Add Unlinked Badges */}
        {unconfiguredPlatforms.length > 0 && (
          <div className="sp2-unlinked-prompts-row">
            <span className="sp2-unlinked-lbl">Connect more:</span>
            <div className="sp2-unlinked-chips">
              {unconfiguredPlatforms.map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  className="sp2-unlinked-chip-btn"
                  onClick={() => onEdit?.("social")}
                >
                  <Plus size={11} />
                  <span>{plat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
