import { URL } from "node:url";

/**
 * Validates external resource URLs and protects against SSRF, private IPs,
 * and malicious URI schemes (javascript:, data:, file:, etc.).
 */
export function validateExternalUrl(urlString) {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, reason: "URL string is required." };
  }

  const trimmed = urlString.trim();

  // Basic length limit
  if (trimmed.length > 2048) {
    return { valid: false, reason: "URL exceeds maximum permitted length (2048 characters)." };
  }

  // Scheme validation: strictly http or https
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "Invalid URL syntax. Please provide a well-formed web address." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Only HTTP and HTTPS URLs are permitted." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Loopback and local domain names
  if (
    hostname === "localhost" ||
    hostname === "localhost.localdomain" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { valid: false, reason: "Localhost and internal domain URLs are not permitted." };
  }

  // IPv4 validation: check for loopback, private ranges, link-local, broadcast
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const octets = [
      Number(ipMatch[1]),
      Number(ipMatch[2]),
      Number(ipMatch[3]),
      Number(ipMatch[4])
    ];

    if (octets.some((o) => o < 0 || o > 255)) {
      return { valid: false, reason: "Malformed IP address in URL." };
    }

    // 0.0.0.0/8
    if (octets[0] === 0) return { valid: false, reason: "Unspecified IP address is not permitted." };
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return { valid: false, reason: "Loopback IP addresses are not permitted." };
    // 10.0.0.0/8 (Private)
    if (octets[0] === 10) return { valid: false, reason: "Private network IP addresses are not permitted." };
    // 172.16.0.0/12 (Private)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
      return { valid: false, reason: "Private network IP addresses are not permitted." };
    }
    // 192.168.0.0/16 (Private)
    if (octets[0] === 192 && octets[1] === 168) {
      return { valid: false, reason: "Private network IP addresses are not permitted." };
    }
    // 169.254.0.0/16 (Link-Local & Cloud Metadata)
    if (octets[0] === 169 && octets[1] === 254) {
      return { valid: false, reason: "Link-local cloud metadata addresses are strictly blocked." };
    }
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4
    if (octets[0] >= 224) {
      return { valid: false, reason: "Reserved IP addresses are not permitted." };
    }
  }

  // IPv6 check
  if (hostname.startsWith("[") || hostname.includes(":")) {
    if (hostname.includes("::1") || hostname.includes("fe80:") || hostname.includes("fc00:")) {
      return { valid: false, reason: "Private and loopback IPv6 addresses are not permitted." };
    }
  }

  // Detect provider & resource type
  const { provider, resourceType, embedUrl } = detectUrlProvider(parsed);

  return {
    valid: true,
    url: parsed.href,
    provider,
    resourceType,
    embedUrl
  };
}

/**
 * Detects the specific cloud storage, educational repository, or content platform.
 */
export function detectUrlProvider(parsedUrl) {
  const host = parsedUrl.hostname.toLowerCase();
  const path = parsedUrl.pathname.toLowerCase();

  // 1. Google Drive & Google Docs
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    let embedUrl = null;
    if (path.includes("/file/d/")) {
      const match = path.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return {
      provider: "google-drive",
      resourceType: embedUrl ? "embed" : "view",
      embedUrl
    };
  }

  // 2. OneDrive / SharePoint
  if (host.includes("1drv.ms") || host.includes("onedrive.live.com") || host.includes("sharepoint.com")) {
    return {
      provider: "onedrive",
      resourceType: "view",
      embedUrl: null
    };
  }

  // 3. Dropbox
  if (host.includes("dropbox.com")) {
    // If user provided a dl=0 link, dl=1 makes it direct download if public
    return {
      provider: "dropbox",
      resourceType: "view",
      embedUrl: null
    };
  }

  // 4. YouTube Video Lectures
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    let embedUrl = null;
    let videoId = null;
    if (host.includes("youtu.be")) {
      videoId = path.replace(/^\//, "").split("?")[0];
    } else {
      videoId = parsedUrl.searchParams.get("v");
    }
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    return {
      provider: "youtube",
      resourceType: "embed",
      embedUrl
    };
  }

  // 5. GitHub Code & Archives
  if (host.includes("github.com") || host.includes("raw.githubusercontent.com")) {
    return {
      provider: "github",
      resourceType: "reference",
      embedUrl: null
    };
  }

  // 6. Direct Download Document Files
  const docExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls", ".zip", ".rar", ".txt"];
  const isDirectDoc = docExtensions.some((ext) => path.endsWith(ext));
  if (isDirectDoc) {
    return {
      provider: "document",
      resourceType: "direct-download",
      embedUrl: null
    };
  }

  // 7. National Educational Repositories (NPTEL, SWAYAM, etc.)
  if (
    host.includes("nptel.ac.in") ||
    host.includes("swayam.gov.in") ||
    host.includes("ugc.ac.in") ||
    host.includes("aicte-india.org") ||
    host.includes("geeksforgeeks.org") ||
    host.includes("w3schools.com") ||
    host.includes("wikipedia.org") ||
    host.endsWith(".edu") ||
    host.endsWith(".ac.in")
  ) {
    return {
      provider: "educational",
      resourceType: "reference",
      embedUrl: null
    };
  }

  return {
    provider: "website",
    resourceType: "reference",
    embedUrl: null
  };
}
