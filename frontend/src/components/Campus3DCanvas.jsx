import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * CollegeOS — Cinematic Polytechnic Campus (ek student ka poora din)
 * Subharti Polytechnic · Swami Vivekanand Subharti University
 *
 * Story (loop):
 *   1. Pehle poora college (bird's-eye) dikhta hai
 *   2. Aarav naya student gate se aata hai
 *   3. Admission Cell — documents, stamp, ID card
 *   4. Classroom — padhai
 *   5. Computer Lab — coding
 *   6. Canteen — lunch
 *   7. Library — kitaab padhta hai
 *   8. Park — bench par aaram, doston ko hello
 *   9. Playground — ball game
 *  10. Hostel — raat, light dim, Aarav so jaata hai
 *  11. Wide night shot, phir loop
 *
 * Props / class names pehle jaise hi hain (AuthLayout me kuch badalna nahi).
 */

const capBox = {
  position: "absolute",
  top: "5.4rem",
  right: "2.75rem",
  width: 262,
  zIndex: 3,
  padding: "0.8rem 0.95rem 0.7rem",
  borderRadius: 14,
  background: "rgba(6, 15, 28, 0.66)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  color: "#fff",
  pointerEvents: "none",
  opacity: 0,
  transition: "opacity 0.28s ease",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};
const capBoxSmall = {
  ...capBox,
  top: "auto",
  bottom: 10,
  right: 10,
  left: 10,
  width: "auto",
  padding: "0.55rem 0.75rem 0.5rem"
};
const capStep = { fontSize: 11.5, fontWeight: 600, color: "#fb923c", marginBottom: 3 };
const capTitle = { fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginBottom: 3 };
const capText = { fontSize: 12, color: "#cbd5e1", lineHeight: 1.45 };
const capTrack = { height: 3, borderRadius: 2, background: "rgba(255,255,255,0.14)", marginTop: 9, overflow: "hidden" };
const capFill = { height: "100%", width: "0%", background: "#f97316", borderRadius: 2 };

export default function Campus3DCanvas({ className = "", onSceneUpdate }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const capRef = useRef(null);
  const capStepRef = useRef(null);
  const capTitleRef = useRef(null);
  const capTextRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    /* ───────── WebGL guard ───────── */
    const hasWebGL = () => {
      try {
        const t = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (t.getContext("webgl") || t.getContext("experimental-webgl")));
      } catch {
        return false;
      }
    };
    if (!hasWebGL()) {
      container.classList.add("webgl-fallback");
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 1024;

    /* ───────── helpers ───────── */
    const textures = [];
    const track = (tex) => {
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      return tex;
    };
    const makeCanvas = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return [c, c.getContext("2d")];
    };
    const clamp01 = (k) => Math.min(1, Math.max(0, k));
    const ease = (k) => 1 - Math.pow(1 - clamp01(k), 3);
    const easeBack = (k) => {
      const x = clamp01(k);
      const c1 = 1.4;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };
    const lerp = (a, b, k) => a + (b - a) * k;
    const angDiff = (a, b) => {
      let d = (a - b) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    };
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const CYL = (rt, rb, h, s = 16) => new THREE.CylinderGeometry(rt, rb, h, s);
    const SPH = (r, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b);
    const PLANE = (w, h, sw = 1, sh = 1) => new THREE.PlaneGeometry(w, h, sw, sh);

    /* ───────── scene + background ───────── */
    const scene = new THREE.Scene();
    {
      const [c, ctx] = makeCanvas(8, 512);
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#050c18");
      g.addColorStop(0.55, "#0a1a31");
      g.addColorStop(1, "#1a2f52");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 512);
      scene.background = track(new THREE.CanvasTexture(c));
    }

    const width = container.clientWidth || window.innerWidth * 0.58;
    const height = container.clientHeight || window.innerHeight;
    let aspect = width / height;

    const FOV = 35;
    const TH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 300);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSmall;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* ───────── lights ───────── */
    const hemi = new THREE.HemisphereLight(0x8fb4ff, 0x1a2540, 1.3);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffc896, 2.8);
    keyLight.position.set(12, 14, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x6ea8ff, 0.9);
    fillLight.position.set(-11, 5, 7);
    scene.add(fillLight);

    const warm = new THREE.PointLight(0xffa13d, 8, 16, 1.5);
    warm.position.set(0, 3, 3.2);
    scene.add(warm);

    /* ───────── textures ───────── */
    const createClockTexture = () => {
      const [c, ctx] = makeCanvas(256, 256);
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(128, 128, 124, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(128, 128, 116, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#0b192c";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const long = i % 3 === 0;
        ctx.lineWidth = long ? 7 : 4;
        ctx.beginPath();
        ctx.moveTo(128 + Math.sin(a) * (long ? 84 : 94), 128 - Math.cos(a) * (long ? 84 : 94));
        ctx.lineTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104);
        ctx.stroke();
      }
      return track(new THREE.CanvasTexture(c));
    };

    const createGlowTexture = (rgb) => {
      const [c, ctx] = makeCanvas(128, 128);
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, `rgba(${rgb},1)`);
      g.addColorStop(0.35, `rgba(${rgb},0.4)`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      return track(new THREE.CanvasTexture(c));
    };

    const createCodeTexture = (seed0) => {
      const [c, ctx] = makeCanvas(256, 512);
      ctx.fillStyle = "#08182c";
      ctx.fillRect(0, 0, 256, 512);
      let seed = seed0;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      let y = 10;
      while (y < 500) {
        let x = 14 + Math.floor(rnd() * 3) * 22;
        const segs = 1 + Math.floor(rnd() * 3);
        for (let i = 0; i < segs; i++) {
          const w = 20 + rnd() * 70;
          const r = rnd();
          ctx.fillStyle = r > 0.75 ? "#fb923c" : r > 0.4 ? "#38bdf8" : "#e2e8f0";
          ctx.fillRect(x, y, w, 7);
          x += w + 8;
          if (x > 220) break;
        }
        y += 18;
      }
      const t = track(new THREE.CanvasTexture(c));
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      return t;
    };

    const createSignTexture = (text, bg, fg, border, w = 512, h = 128) => {
      const [c, ctx] = makeCanvas(w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = border;
      ctx.lineWidth = 6;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.fillStyle = fg;
      let size = 48;
      ctx.font = `800 ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
      while (ctx.measureText(text).width > w - 50 && size > 18) {
        size -= 2;
        ctx.font = `800 ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2 + 3);
      return track(new THREE.CanvasTexture(c));
    };

    const createBoardTexture = () => {
      const [c, ctx] = makeCanvas(512, 200);
      ctx.fillStyle = "#1f4d3a";
      ctx.fillRect(0, 0, 512, 200);
      ctx.strokeStyle = "#c9a57a";
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, 512, 200);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "700 30px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Digital Electronics", 24, 54);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(380, 96);
      ctx.lineTo(420, 96);
      ctx.arc(420, 126, 30, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(380, 156);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(340, 110);
      ctx.lineTo(380, 110);
      ctx.moveTo(340, 142);
      ctx.lineTo(380, 142);
      ctx.moveTo(480, 126);
      ctx.lineTo(500, 126);
      ctx.stroke();
      return track(new THREE.CanvasTexture(c));
    };

    const createShelfTexture = () => {
      const [c, ctx] = makeCanvas(512, 256);
      ctx.fillStyle = "#4a3322";
      ctx.fillRect(0, 0, 512, 256);
      const cols = ["#f97316", "#eef2f7", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#ef4444", "#94a3b8"];
      let seed = 11;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      for (let row = 0; row < 5; row++) {
        const y0 = row * 51;
        let x = 6;
        while (x < 500) {
          const w = 9 + rnd() * 14;
          const h = 30 + rnd() * 14;
          ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
          ctx.fillRect(x, y0 + 47 - h, w, h);
          x += w + 1.5;
        }
        ctx.fillStyle = "#2a1b10";
        ctx.fillRect(0, y0 + 47, 512, 5);
      }
      return track(new THREE.CanvasTexture(c));
    };

    const createMenuTexture = () => {
      const [c, ctx] = makeCanvas(384, 160);
      ctx.fillStyle = "#1f2a37";
      ctx.fillRect(0, 0, 384, 160);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 378, 154);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "700 26px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Today's Lunch", 22, 40);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "500 19px system-ui, sans-serif";
      ["Veg Thali", "Paratha + Curd", "Samosa & Chai", "Fresh Fruit"].forEach((s, i) => ctx.fillText(s, 22, 74 + i * 26));
      return track(new THREE.CanvasTexture(c));
    };

    const createNoticeTexture = () => {
      const [c, ctx] = makeCanvas(256, 192);
      ctx.fillStyle = "#b88a5a";
      ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = "#7a5632";
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, 256, 192);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(18, 18, 220, 156);
      ctx.fillStyle = "#0b192c";
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Admission steps", 30, 46);
      ctx.fillStyle = "#334155";
      ctx.font = "500 15px system-ui, sans-serif";
      ["1  Fill the form", "2  Submit documents", "3  Pay the fee", "4  Collect ID card"].forEach((s, i) => {
        ctx.fillText(s, 30, 78 + i * 24);
      });
      ctx.fillStyle = "#f97316";
      ctx.fillRect(30, 58, 60, 3);
      return track(new THREE.CanvasTexture(c));
    };

    const makeLabelSprite = (text, accent) => {
      const [c, ctx] = makeCanvas(512, 128);
      const rr = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };
      rr(8, 22, 496, 84, 42);
      ctx.fillStyle = "rgba(6,15,28,0.88)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(60, 64, 14, 0, Math.PI * 2);
      ctx.fill();
      let size = 44;
      ctx.font = `700 ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
      while (ctx.measureText(text).width > 370 && size > 20) {
        size -= 2;
        ctx.font = `700 ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
      }
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 90, 66);
      const mat = new THREE.SpriteMaterial({
        map: track(new THREE.CanvasTexture(c)),
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
      const s = new THREE.Sprite(mat);
      s.renderOrder = 20;
      return s;
    };

    const glowOrange = createGlowTexture("255,140,50");
    const glowWhite = createGlowTexture("255,255,255");
    const glowBlue = createGlowTexture("90,190,255");
    const clockTex = createClockTexture();
    const codeTex = createCodeTexture(7);
    const codeTex2 = createCodeTexture(23);
    const bannerTex = createSignTexture("ADMISSIONS OPEN", "#0b192c", "#ffffff", "#f97316", 512, 96);
    const deskSignTex = createSignTexture("Admission Desk", "#0b192c", "#fb923c", "#f97316");
    const labSignTex = createSignTexture("Computer Lab", "#0b192c", "#7dd3fc", "#38bdf8");
    const libSignTex = createSignTexture("Silence please", "#4a3322", "#fde68a", "#fbbf24");
    const canSignTex = createSignTexture("Canteen · Lunch", "#0b192c", "#fde68a", "#fbbf24");
    const hosSignTex = createSignTexture("Student Hostel", "#1e3a5f", "#c4b5fd", "#a78bfa");
    const lightsOutTex = createSignTexture("Lights out · 10 PM", "#1e3a5f", "#c4b5fd", "#a78bfa");
    const boardTex = createBoardTexture();
    const shelfTex = createShelfTexture();
    const menuTex = createMenuTexture();
    const noticeTex = createNoticeTexture();

    /* ───────── materials ───────── */
    const std = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, flatShading: true, ...extra });
    const flat = (m) => new THREE.MeshBasicMaterial({ map: m });

    const whiteMat = std(0xeef2f7);
    const stoneMat = std(0xdbe3ec);
    const steelMat = std(0xc5d0dd, { metalness: 0.25, roughness: 0.5 });
    const navyMat = std(0x1e3a5f, { roughness: 0.5, metalness: 0.15 });
    const darkMat = std(0x0b192c, { roughness: 0.6 });
    const underMat = std(0x12264a, { roughness: 0.8 });
    const lawnMat = std(0x2f7d5b, { roughness: 0.95, flatShading: false });
    const parkMat = std(0x4aa97a, { roughness: 0.95, flatShading: false });
    const courtMat = std(0x2a6a52, { roughness: 0.95, flatShading: false });
    const trunkMat = std(0x3b2a20);
    const leafMatA = std(0x2f7d5b);
    const leafMatB = std(0x3c9a6e);
    const orangeMat = std(0xf97316, { emissive: 0xea580c, emissiveIntensity: 0.35, roughness: 0.4 });
    const glassMat = std(0x0b1c33, { roughness: 0.2, metalness: 0.6 });
    const winLitMat = std(0xffb454, { emissive: 0xffa038, emissiveIntensity: 1.3, roughness: 0.3 });
    const lampMat = std(0xffd7a0, { emissive: 0xffa038, emissiveIntensity: 1.8, roughness: 0.3 });
    const waterMat = std(0x38bdf8, { emissive: 0x1d8fd6, emissiveIntensity: 0.7, roughness: 0.2, flatShading: false });
    const flagMat = std(0xf97316, { emissive: 0xea580c, emissiveIntensity: 0.25, side: THREE.DoubleSide });
    const dishMat = std(0xeef2f7, { side: THREE.DoubleSide, metalness: 0.2 });
    const woodMat = std(0xc79a6b, { roughness: 0.7, flatShading: false });
    const floorWood = std(0xe3d3b8, { roughness: 0.85, flatShading: false });
    const floorTile = std(0xd6e0ea, { roughness: 0.8, flatShading: false });
    const paperMat = std(0xffffff, { flatShading: false, roughness: 0.9 });
    const redMat = std(0xdc2626, { flatShading: false });
    const bannerMat = flat(bannerTex);
    const codeMat = flat(codeTex);
    const codeMat2 = flat(codeTex2);
    const clockMat = flat(clockTex);
    const handMat = new THREE.MeshBasicMaterial({ color: 0x0b192c });
    const holoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.85 });
    const holoCoreMat = std(0x7dd3fc, { emissive: 0x38bdf8, emissiveIntensity: 1.4, roughness: 0.3 });

    const additive = (color, opacity) =>
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });

    const glowSprite = (map, color, opacity, scale) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      s.scale.set(scale, scale, 1);
      return s;
    };

    /* ───────── world ───────── */
    const island = new THREE.Group();
    scene.add(island);
    const world = new THREE.Group();
    island.add(world);

    const GY = 0.38; // ground level on the island
    const FY = 0.14; // plinth height of every building
    const FLOOR = 0.16; // interior floor level (relative to building origin)

    const risers = [];
    const labels = [];
    const anims = [];
    const actors = [];
    const rooms = {};

    const mesh = (parent, geo, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    const makeGroup = (x, z, delay, rotY = 0) => {
      const g = new THREE.Group();
      g.position.set(x, GY, z);
      g.rotation.y = rotY;
      world.add(g);
      risers.push({ g, delay });
      return g;
    };

    const addLabel = (text, accent, x, y, z, delay, w = 2.5, room = null) => {
      const s = makeLabelSprite(text, accent);
      s.position.set(x, GY + y, z);
      s.scale.set(0.0001, 0.0001, 1);
      world.add(s);
      labels.push({ s, w, h: w * 0.25, delay, baseY: GY + y, ph: x * 0.7 + z, room });
    };

    const road = (x1, z1, x2, z2, w = 0.7) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const m = mesh(world, B(w, 0.04, len), stoneMat, (x1 + x2) / 2, GY + 0.02, (z1 + z2) / 2);
      m.rotation.y = Math.atan2(dx, dz);
      return m;
    };

    const makeGear = (r, teeth, th, mat) => {
      const g = new THREE.Group();
      const body = mesh(g, CYL(r, r, th, 20), mat);
      body.rotation.x = Math.PI / 2;
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        const tooth = mesh(g, B(r * 0.34, r * 0.3, th), mat, Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1, 0);
        tooth.rotation.z = a;
      }
      const hub = mesh(g, CYL(r * 0.3, r * 0.3, th * 1.4, 12), darkMat);
      hub.rotation.x = Math.PI / 2;
      return g;
    };

    /* ═════════ ROOM DEFINITIONS (waypoint math ke liye) ═════════ */
    const RD = {
      adm: { x: 0, z: -3.3, w: 5.0, d: 2.4, h: 2.1 },
      cls: { x: -6.2, z: 1.4, w: 3.2, d: 3.0, h: 1.9 },
      lib: { x: -5.7, z: -2.7, w: 3.2, d: 2.4, h: 2.1 },
      lab: { x: 5.7, z: -2.7, w: 3.4, d: 2.5, h: 2.1 },
      can: { x: 6.0, z: 1.5, w: 3.2, d: 2.5, h: 1.9 },
      hos: { x: 0, z: -6.6, w: 3.6, d: 2.2, h: 2.1 }
    };
    const P = (id, lx, lz) => [RD[id].x + lx, RD[id].z + lz];
    const COURT = { x: -2.4, z: 3.7 };
    const PARK = { x: 2.9, z: 3.9 };
    const BED_TOP = FLOOR + 0.28; // hostel mattress top

    /* ═════════ HERO STORY SCRIPT (timeline) ═════════ */
    const NORTH = Math.PI; // -z
    const SOUTH = 0; // +z (camera ki taraf)
    const keys = [];
    const marks = {};
    let tc = 6.5; // pehle ~6.5s poora college dikhta hai
    let cx = -1.58;
    let cz = 7.43;
    const K = (st, face) => keys.push({ t: tc, x: cx, z: cz, st, face });
    const mk = (n) => {
      marks[n] = tc;
    };
    const go = (x, z, spd = 1.4) => {
      tc += Math.hypot(x - cx, z - cz) / spd;
      cx = x;
      cz = z;
      K("walk");
    };
    const wait = (d, st = "stand", face = NORTH) => {
      tc += d;
      K(st, face);
    };

    K("stand", NORTH);
    mk("arrive");
    // 2. gate se aana → 3. admission
    go(-0.1, 3.7);
    go(-1.05, 2.5);
    go(-1.05, 0.6);
    go(0, -0.6);
    mk("admNear");
    go(0, -2.35);
    go(...P("adm", 0, 0.15), 1.0);
    mk("admIn");
    wait(1.6, "wave");
    mk("docs");
    wait(2.6);
    mk("stampA");
    wait(2.2);
    mk("cardGive");
    wait(1.6, "hold");
    mk("cardHeld");
    wait(2.2, "hold");
    mk("admDone");
    go(0, -2.35);
    go(0, -1.2);
    mk("admOut");

    // 4. classroom
    go(-1.2, 0.2, 1.9);
    go(-2.5, 2.25, 1.9);
    mk("clsNear");
    go(-5.0, 3.4, 1.9);
    go(-6.2, 3.4, 1.9);
    go(...P("cls", 0, 1.25), 1.4);
    go(...P("cls", 0, 0.65));
    go(...P("cls", 0.6, 0.65));
    wait(0.8, "sit");
    mk("clsSit");
    wait(5.2, "sit");
    mk("clsHand");
    wait(3, "hand");
    wait(3.2, "sit");
    mk("clsEnd");
    go(...P("cls", 0, 0.65));
    go(...P("cls", 0, 1.25));
    go(-6.2, 3.4);
    mk("clsOut");

    // 5. computer lab
    go(-4.2, 2.3, 1.9);
    go(-1.3, 2.65, 1.9);
    go(1.2, 2.7, 1.9);
    go(3.4, 1.6, 1.9);
    go(3.6, -0.6, 1.9);
    go(5.2, -0.7, 1.9);
    mk("labNear");
    go(5.7, -1.8, 1.9);
    go(...P("lab", 0, 0.55));
    wait(0.5, "sit");
    mk("labType");
    wait(8, "type");
    mk("labEnd");
    go(5.7, -1.0);
    mk("labOut");

    // 6. canteen — lunch
    go(4.05, -0.4, 1.9);
    go(4.05, 3.0, 1.9);
    go(6.0, 3.3, 1.9);
    mk("canNear");
    go(6.0, 2.2, 1.9);
    mk("canIn");
    go(...P("can", 0, 0.6), 1.4);
    go(...P("can", 0, -0.3), 1.2);
    wait(1.0);
    mk("canGive");
    wait(1.4, "hold");
    mk("canHeld");
    go(...P("can", 0, 0.75), 1.2);
    go(...P("can", 0.9, 0.75), 1.2);
    go(...P("can", 0.9, 0.55), 0.8);
    wait(0.5, "sit");
    mk("canSit");
    wait(7.5, "eat");
    mk("canEnd");
    go(...P("can", 0.9, 0.75));
    go(...P("can", 0, 0.75));
    go(6.0, 2.2);
    go(6.0, 3.15);
    mk("canOut");

    // 7. library
    go(4.05, 2.5, 1.9);
    go(2.0, 2.7, 1.9);
    go(-1.3, 2.7, 1.9);
    go(-2.8, 1.4, 1.9);
    go(-3.9, 0.3, 1.9);
    go(-4.4, -0.6, 1.9);
    go(-5.2, -1.0, 1.9);
    mk("libNear");
    go(-5.7, -1.8, 1.9);
    go(...P("lib", -0.2, -0.8));
    mk("libShelf");
    wait(1.8, "reach");
    mk("libTake");
    wait(0.6, "stand");
    go(...P("lib", 0, 0.55));
    go(...P("lib", 0.85, 0.55));
    wait(0.5, "sit");
    mk("libRead");
    wait(6.5, "read");
    mk("libEnd");
    go(...P("lib", 0, 0.55));
    go(-5.7, -1.2);
    mk("libOut");

    // 8. park
    go(-4.4, -0.7, 1.9);
    go(-2.0, 1.0, 1.9);
    go(-1.0, 2.5, 1.9);
    go(1.2, 2.7, 1.9);
    mk("parkNear");
    go(2.7, 3.1, 1.5);
    go(2.7, 3.5, 0.8);
    wait(0.5, "sit", SOUTH);
    mk("parkSit");
    wait(3, "sit", SOUTH);
    wait(1.8, "hand", SOUTH);
    wait(3.2, "sit", SOUTH);
    mk("parkEnd");
    go(2.7, 3.1);
    mk("parkOut");

    // 9. playground
    go(2.2, 2.8, 1.9);
    go(-0.5, 2.8, 1.9);
    go(-1.6, 2.9, 1.9);
    mk("courtNear");
    go(COURT.x, COURT.z);
    mk("play");
    wait(9, "play");
    mk("cheer");
    wait(3.5, "cheer", SOUTH);
    mk("playOut");

    // 10. hostel — raat, neend
    go(-3.3, 2.4, 1.9);
    go(-3.3, -0.3, 1.9);
    mk("hosWalk");
    go(-3.3, -5.0, 1.9);
    go(0, -5.0, 1.9);
    mk("hosNear");
    go(...P("hos", 0, 0.8), 1.2);
    mk("hosIn");
    go(...P("hos", 0, 0.35), 1.0);
    go(...P("hos", 0, 0.1), 0.8);
    wait(0.8, "stand", SOUTH);
    mk("sleep");
    wait(5.5, "sleep", SOUTH);
    mk("fin");
    wait(3.8, "sleep", SOUTH);
    const LOOP = tc + 2.6;

    /* ═════════ ISLAND BODY ═════════ */
    mesh(world, CYL(9, 9, 0.5, 72), stoneMat, 0, 0.1, 0);
    mesh(world, CYL(8.55, 8.55, 0.06, 72), lawnMat, 0, GY - 0.03, 0);
    const under = mesh(world, new THREE.ConeGeometry(9, 5.2, 10), underMat, 0, -2.75, 0);
    under.rotation.x = Math.PI;
    const glowRing = mesh(world, new THREE.TorusGeometry(9.02, 0.06, 8, 128), additive(0xf97316, 0.9), 0, -0.14, 0);
    glowRing.rotation.x = Math.PI / 2;

    const crystals = [];
    [[0, -5.7, 0, 0.42, 1.3], [-1.5, -4.9, 0.8, 0.26, 0.9], [1.4, -4.8, -0.9, 0.3, 1.0]].forEach(([x, y, z, r, h], i) => {
      const c = mesh(world, new THREE.ConeGeometry(r, h, 5), orangeMat, x, y, z);
      c.rotation.x = Math.PI;
      crystals.push({ c, ph: i * 1.3 });
    });

    /* ═════════ PLAZA + FOUNTAIN ═════════ */
    {
      const g = makeGroup(0, 1.5, 0.1);
      mesh(g, CYL(2.0, 2.0, 0.07, 48), stoneMat, 0, 0.035, 0);
      const ring = mesh(g, new THREE.TorusGeometry(1.62, 0.03, 6, 64), orangeMat, 0, 0.08, 0);
      ring.rotation.x = Math.PI / 2;
      mesh(g, CYL(0.6, 0.66, 0.28, 24), navyMat, 0, 0.21, 0);
      mesh(g, CYL(0.52, 0.52, 0.04, 24), waterMat, 0, 0.34, 0);
      mesh(g, CYL(0.07, 0.09, 0.55, 8), whiteMat, 0, 0.5, 0);
      mesh(g, CYL(0.2, 0.1, 0.08, 12), whiteMat, 0, 0.8, 0);

      const jetMat = new THREE.MeshBasicMaterial({ color: 0x9fd4ff });
      const jetGeo = SPH(0.03, 8, 6);
      const jets = [];
      for (let i = 0; i < 16; i++) jets.push(mesh(g, jetGeo, jetMat));
      const ripples = [0, 1].map(() => {
        const r = mesh(g, new THREE.TorusGeometry(0.5, 0.012, 6, 40), additive(0x9fd4ff, 0.6), 0, 0.37, 0);
        r.rotation.x = Math.PI / 2;
        return r;
      });

      anims.push((t) => {
        jets.forEach((j, i) => {
          const u = (t * 0.7 + i / jets.length) % 1;
          const a = i * 2.4;
          const rr = u * 0.52;
          j.position.set(Math.cos(a) * rr, 0.8 + 1.2 * u - 1.66 * u * u, Math.sin(a) * rr);
        });
        ripples.forEach((r, i) => {
          const u = (t * 0.5 + i * 0.5) % 1;
          r.scale.setScalar(0.4 + u * 0.7);
          r.material.opacity = (1 - u) * 0.6;
        });
        waterMat.emissiveIntensity = 0.7 + Math.sin(t * 2) * 0.15;
      });
    }

    /* roads + avenue */
    road(0, 1.5, 0, -1.9, 0.8);
    road(0, 1.5, -4.6, -0.9, 0.7);
    road(0, 1.5, 4.6, -0.9, 0.7);
    road(0, 1.5, 6.0, 3.3, 0.7);
    road(0, 1.5, -6.2, 3.3, 0.7);
    [-1, 1].forEach((s) => road(0, 1.5, s * 7.6 * Math.sin(0.21), 7.6 * Math.cos(0.21), 0.6));

    const avenueArc = 1.3;
    const avenue = mesh(
      world,
      new THREE.RingGeometry(7.55, 8.25, 72, 1, -avenueArc - Math.PI / 2, avenueArc * 2),
      stoneMat,
      0,
      GY + 0.025,
      0
    );
    avenue.rotation.x = -Math.PI / 2;
    const avenueLine = mesh(
      world,
      new THREE.RingGeometry(7.88, 7.93, 72, 1, -avenueArc - Math.PI / 2, avenueArc * 2),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 }),
      0,
      GY + 0.03,
      0
    );
    avenueLine.rotation.x = -Math.PI / 2;

    /* lamps */
    const lamps = [];
    const addLamp = (x, z) => {
      mesh(world, CYL(0.03, 0.04, 0.8, 8), navyMat, x, GY + 0.4, z);
      lamps.push(mesh(world, SPH(0.09, 12, 10), lampMat, x, GY + 0.85, z));
    };
    for (let k = 0; k < 6; k++) {
      const a = (30 + k * 60) * (Math.PI / 180);
      addLamp(Math.sin(a) * 2.3, 1.5 + Math.cos(a) * 2.3);
    }
    [-0.9, -0.45, 0, 0.45, 0.9].forEach((a) => addLamp(Math.sin(a) * 8.35, Math.cos(a) * 8.35));

    /* flag pole */
    {
      const g = makeGroup(2.7, -1.0, 0.7);
      mesh(g, CYL(0.03, 0.04, 3.2, 8), steelMat, 0, 1.6, 0);
      mesh(g, SPH(0.06, 10, 8), lampMat, 0, 3.25, 0);
      const flagGeo = PLANE(0.9, 0.55, 14, 6);
      mesh(g, flagGeo, flagMat, 0.47, 2.85, 0);
      const pos = flagGeo.attributes.position;
      const ox = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) ox[i] = pos.getX(i);
      anims.push((t) => {
        for (let i = 0; i < pos.count; i++) {
          const w = (ox[i] + 0.45) / 0.9;
          pos.setZ(i, Math.sin(ox[i] * 7 - t * 4) * 0.09 * w);
        }
        pos.needsUpdate = true;
      });
    }

    /* ═════════ ROOM BUILDER (cutaway dollhouse) ═════════ */
    const makeRoom = (id, opts) => {
      const { x, z, w, d, h } = RD[id];
      const { wallMat, roofMat, floorMat, delay = 0.4, doorW = 1.0, doorH = 1.25, lightI = 10 } = opts;
      const g = new THREE.Group();
      g.position.set(x, GY, z);
      world.add(g);
      risers.push({ g, delay });

      mesh(g, B(w + 0.4, FY, d + 0.4), stoneMat, 0, FY / 2, 0);
      mesh(g, B(w - 0.1, 0.02, d - 0.1), floorMat, 0, FY + 0.01, 0);
      mesh(g, B(w, h, 0.1), wallMat, 0, FY + h / 2, -d / 2 + 0.05);
      mesh(g, B(0.1, h, d), wallMat, -w / 2 + 0.05, FY + h / 2, 0);
      mesh(g, B(0.1, h, d), wallMat, w / 2 - 0.05, FY + h / 2, 0);

      // saamne ki deewar — focus par zameen me dhans jaati hai
      const front = new THREE.Group();
      front.position.set(0, FY, d / 2 - 0.05);
      g.add(front);
      const sideW = (w - doorW) / 2;
      mesh(front, B(sideW, h, 0.1), wallMat, -(doorW / 2 + sideW / 2), h / 2, 0);
      mesh(front, B(sideW, h, 0.1), wallMat, doorW / 2 + sideW / 2, h / 2, 0);
      mesh(front, B(doorW, h - doorH, 0.1), wallMat, 0, doorH + (h - doorH) / 2, 0);
      mesh(front, B(doorW + 0.24, 0.1, 0.14), orangeMat, 0, doorH + 0.05, 0);
      mesh(front, B(0.08, doorH, 0.14), orangeMat, -(doorW / 2 + 0.04), doorH / 2, 0);
      mesh(front, B(0.08, doorH, 0.14), orangeMat, doorW / 2 + 0.04, doorH / 2, 0);
      mesh(front, B(doorW - 0.12, doorH - 0.08, 0.05), glassMat, 0, doorH / 2, 0.05);

      // chhat — focus par upar uth jaati hai
      const roof = new THREE.Group();
      roof.position.set(0, FY + h, 0);
      g.add(roof);
      mesh(roof, B(w + 0.3, 0.14, d + 0.3), roofMat, 0, 0.07, 0);

      const light = new THREE.PointLight(0xffe2b8, 0, Math.max(w, d) * 1.7, 1.4);
      light.position.set(0, FY + h * 0.8, 0.2);
      g.add(light);

      const room = { id, g, front, roof, light, x, z, w, d, h, o: 1, doorW, doorH, lightI };
      rooms[id] = room;
      return room;
    };

    const frontWindows = (room, xs, wy) => {
      xs.forEach((wx, i) => {
        mesh(room.front, B(0.4, 0.5, 0.05), i % 3 === 1 ? glassMat : winLitMat, wx, wy, 0.07);
      });
    };

    /* ═════════ FURNITURE ═════════ */
    const seatGeo = B(0.34, 0.04, 0.34);
    const backGeo = B(0.34, 0.28, 0.03);
    const postGeo = CYL(0.025, 0.025, 0.26, 6);
    const addChair = (room, x, z, rotY = 0, mat = navyMat) => {
      const g = new THREE.Group();
      g.position.set(x, FLOOR, z);
      g.rotation.y = rotY;
      room.g.add(g);
      mesh(g, seatGeo, mat, 0, 0.28, 0);
      mesh(g, backGeo, mat, 0, 0.44, -0.16);
      mesh(g, postGeo, darkMat, 0, 0.13, 0);
      return g;
    };
    const addBench = (room, x, z, w = 1.0) => {
      mesh(room.g, B(w, 0.05, 0.38), woodMat, x, FLOOR + 0.5, z);
      mesh(room.g, B(0.04, 0.5, 0.34), woodMat, x - (w / 2 - 0.04), FLOOR + 0.25, z);
      mesh(room.g, B(0.04, 0.5, 0.34), woodMat, x + (w / 2 - 0.04), FLOOR + 0.25, z);
    };
    const addMonitor = (room, x, z, screenMat) => {
      mesh(room.g, B(0.06, 0.1, 0.06), darkMat, x, FLOOR + 0.57, z);
      mesh(room.g, B(0.42, 0.3, 0.03), darkMat, x, FLOOR + 0.78, z);
      mesh(room.g, PLANE(0.36, 0.24), screenMat, x, FLOOR + 0.78, z + 0.017);
    };

    /* ═════════ CHARACTERS (rigs + poses) ═════════ */
    const skinCols = [0xf2c9a0, 0xd9a577, 0x9c6b45, 0xf6d5b5];
    const hairCols = [0x1b1b1f, 0x3b2a20, 0x5a3a24, 0x0f0f12];
    const shirtCols = [0xeef2f7, 0x60a5fa, 0x34d399, 0xfbbf24, 0xf472b6, 0xa78bfa, 0x94a3b8, 0xef4444];
    const matCache = new Map();
    const cm = (hex) => {
      if (!matCache.has(hex)) matCache.set(hex, std(hex, { flatShading: false, roughness: 0.7 }));
      return matCache.get(hex);
    };
    const legGeo = B(0.055, 0.17, 0.055);
    legGeo.translate(0, -0.085, 0);
    const armGeo = B(0.04, 0.16, 0.04);
    armGeo.translate(0, -0.075, 0);
    const bodyGeo = CYL(0.065, 0.08, 0.21, 8);
    const headGeo = SPH(0.065, 12, 10);
    const hairGeo = new THREE.SphereGeometry(0.069, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const bagGeo = B(0.1, 0.13, 0.045);

    const rigOpts = (i) => ({
      shirt: shirtCols[i % shirtCols.length],
      pants: i % 2 ? 0x1e3a5f : 0x334155,
      skin: skinCols[i % skinCols.length],
      hair: hairCols[(i * 3) % hairCols.length],
      bag: i % 3 === 0
    });

    const makeRig = (o = {}) => {
      const { shirt = 0xeef2f7, pants = 0x1e3a5f, skin = 0xf2c9a0, hair = 0x1b1b1f, scale = 1.9, bag = false } = o;
      const g = new THREE.Group();
      const legL = mesh(g, legGeo, cm(pants), -0.04, 0.17, 0);
      const legR = mesh(g, legGeo, cm(pants), 0.04, 0.17, 0);
      mesh(g, bodyGeo, cm(shirt), 0, 0.275, 0);
      const armL = mesh(g, armGeo, cm(shirt), -0.1, 0.35, 0);
      const armR = mesh(g, armGeo, cm(shirt), 0.1, 0.35, 0);
      mesh(g, headGeo, cm(skin), 0, 0.44, 0);
      mesh(g, hairGeo, cm(hair), 0, 0.445, 0);
      if (bag) mesh(g, bagGeo, cm(0xeef2f7), 0, 0.29, -0.075);
      g.scale.setScalar(0.0001);
      return { g, legL, legR, armL, armR, scale, a: [0, 0, 0, 0] };
    };

    const poseTargets = (pose, t, ph, gait) => {
      switch (pose) {
        case "walk": {
          const s = Math.sin(t * gait + ph) * 0.7;
          return [s, -s, -s * 0.8, s * 0.8];
        }
        case "sit": return [-1.45, -1.45, -0.5, -0.5];
        case "type": return [-1.45, -1.45, -1.15 + Math.sin(t * 9 + ph) * 0.08, -1.15 + Math.sin(t * 9 + ph + 2) * 0.08];
        case "read": return [-1.45, -1.45, -1.0, -1.0];
        case "eat": return [-1.45, -1.45, -0.9, -1.9 + Math.sin(t * 3.5 + ph) * 0.45];
        case "hand": return [-1.45, -1.45, -0.5, -2.8 + Math.sin(t * 5 + ph) * 0.15];
        case "write": return [0, 0, 0, -1.7 + Math.sin(t * 4 + ph) * 0.25];
        case "point": return [0, 0, 0, -1.5];
        case "reach": return [0, 0, -0.3, -2.9];
        case "hold": return [0, 0, 0, -1.35];
        case "work": return [0, 0, -1.2 + Math.sin(t * 3 + ph) * 0.05, -1.2 + Math.sin(t * 3 + ph + 1) * 0.05];
        case "catch": return [0, 0, -1.5, -1.5];
        case "throw": return [0, 0, -0.3, -1.2];
        case "cheer": return [0, 0, -2.7 + Math.sin(t * 8 + ph) * 0.3, -2.7 + Math.sin(t * 8 + ph + 1) * 0.3];
        case "wave": return [0, 0, 0, -2.6 + Math.sin(t * 8) * 0.4];
        case "sleep": return [0, 0, 0.12, -0.12];
        default: {
          const s = Math.sin(t * 1.5 + ph) * 0.04;
          return [0, 0, s, -s];
        }
      }
    };
    const applyPose = (r, pose, t, ph, dt, gait = 7.4) => {
      const p = poseTargets(pose, t, ph, gait);
      const s = Math.min(1, dt * 14);
      for (let i = 0; i < 4; i++) r.a[i] += (p[i] - r.a[i]) * s;
      r.legL.rotation.x = r.a[0];
      r.legR.rotation.x = r.a[1];
      r.armL.rotation.x = r.a[2];
      r.armR.rotation.x = r.a[3];
    };

    const addActor = (rig, fn) => {
      if (!rig.g.parent) world.add(rig.g);
      actors.push({ rig, fn, delay: 2.3 + actors.length * 0.035 });
    };
    const placeRig = (room, rig, lx, lz, rotY) => {
      rig.g.position.set(room.x + lx, GY + FLOOR, room.z + lz);
      rig.g.rotation.y = rotY;
      world.add(rig.g);
    };
    const sitter = (room, lx, lz, rotY, pose, i, extra = {}) => {
      const rig = makeRig({ ...rigOpts(i), ...extra });
      placeRig(room, rig, lx, lz, rotY);
      const ph = i * 1.3;
      addActor(rig, (t, tl, dt) => applyPose(rig, typeof pose === "function" ? pose(t, tl) : pose, t, ph, dt));
      return rig;
    };

    // do points ke beech aana-jaana (pause ke saath)
    const patrol = (ax, az, bx, bz, speed, pause, faceP, ph = 0) => {
      const L = Math.hypot(bx - ax, bz - az);
      const mv = L / speed;
      const cyc = 2 * (mv + pause);
      const hf = Math.atan2(bx - ax, bz - az);
      return (t, o) => {
        const u = (t + ph) % cyc;
        o.pose = "walk";
        o.h = hf;
        if (u < pause) {
          o.x = ax; o.z = az; o.h = faceP; o.pose = "point";
        } else if (u < pause + mv) {
          const p = (u - pause) / mv;
          o.x = ax + (bx - ax) * p; o.z = az + (bz - az) * p;
        } else if (u < 2 * pause + mv) {
          o.x = bx; o.z = bz; o.h = faceP; o.pose = "point";
        } else {
          const p = (u - 2 * pause - mv) / mv;
          o.x = bx + (ax - bx) * p; o.z = bz + (az - bz) * p; o.h = hf + Math.PI;
        }
      };
    };
    const roomPatrol = (room, rig, pat, pausePoseName = "point", i = 0) => {
      const o = { x: 0, z: 0, h: 0, pose: "walk" };
      addActor(rig, (t, tl, dt) => {
        pat(t, o);
        rig.g.position.set(room.x + o.x, GY + FLOOR, room.z + o.z);
        rig.g.rotation.y = o.h;
        applyPose(rig, o.pose === "point" ? pausePoseName : "walk", t, i, dt, 4.2);
      });
    };

    /* ═════════ 1. ADMISSION CELL ═════════ */
    {
      const r = makeRoom("adm", { wallMat: whiteMat, roofMat: orangeMat, floorMat: floorWood, delay: 0.3 });
      const g = r.g;
      frontWindows(r, [-1.85, -1.15, 1.15, 1.85], 1.05);
      mesh(r.front, PLANE(2.2, 0.42), bannerMat, 0, 1.75, 0.07);

      // roof: clock tower
      mesh(r.roof, B(1.3, 1.9, 1.3), whiteMat, 0, 0.14 + 0.95, 0);
      mesh(r.roof, B(1.44, 0.12, 1.44), orangeMat, 0, 0.14 + 1.96, 0);
      const cap = mesh(r.roof, new THREE.ConeGeometry(0.98, 0.95, 4), orangeMat, 0, 0.14 + 2.5, 0);
      cap.rotation.y = Math.PI / 4;
      mesh(r.roof, SPH(0.1), lampMat, 0, 0.14 + 3.05, 0);
      mesh(r.roof, new THREE.CircleGeometry(0.45, 40), clockMat, 0, 0.14 + 1.1, 0.66);
      const hands = new THREE.Group();
      hands.position.set(0, 0.14 + 1.1, 0.69);
      const mGeo = B(0.03, 0.32, 0.01);
      mGeo.translate(0, 0.16, 0);
      const hGeo = B(0.045, 0.22, 0.01);
      hGeo.translate(0, 0.11, 0);
      const minuteHand = new THREE.Mesh(mGeo, handMat);
      const hourHand = new THREE.Mesh(hGeo, handMat);
      hands.add(hourHand, minuteHand);
      r.roof.add(hands);

      // interior
      mesh(g, B(2.8, 0.5, 0.36), woodMat, 0, FLOOR + 0.25, -0.4);
      mesh(g, B(2.9, 0.05, 0.42), stoneMat, 0, FLOOR + 0.525, -0.4);
      mesh(g, B(0.32, 0.012, 0.22), paperMat, -0.15, FLOOR + 0.56, -0.42);
      const ink = mesh(g, B(0.1, 0.014, 0.06), redMat, -0.15, FLOOR + 0.568, -0.42);
      const stamp = new THREE.Group();
      stamp.position.set(0.3, FLOOR + 0.62, -0.42);
      g.add(stamp);
      mesh(stamp, CYL(0.04, 0.05, 0.06, 10), darkMat, 0, 0.05, 0);
      mesh(stamp, B(0.07, 0.04, 0.07), orangeMat, 0, 0, 0);
      const stampFlash = glowSprite(glowOrange, 0xffffff, 0, 0.5);
      stampFlash.position.set(0.3, FLOOR + 0.58, -0.42);
      g.add(stampFlash);
      mesh(g, SPH(0.05, 10, 8), steelMat, 0.9, FLOOR + 0.58, -0.38); // bell
      mesh(g, PLANE(1.9, 0.34), flat(deskSignTex), 0, 1.55, -1.07);
      mesh(g, PLANE(1.0, 0.75), flat(noticeTex), -1.7, 1.15, -1.07);
      mesh(g, B(0.5, 0.9, 0.4), steelMat, 1.95, FLOOR + 0.45, -0.85);
      [0.3, 0, -0.3].forEach((dy) => mesh(g, B(0.2, 0.03, 0.02), darkMat, 1.95, FLOOR + 0.45 + dy, -0.64));
      mesh(g, CYL(0.12, 0.09, 0.2, 8), orangeMat, 1.95, FLOOR + 0.1, 0.5);
      mesh(g, new THREE.IcosahedronGeometry(0.2, 0), leafMatB, 1.95, FLOOR + 0.35, 0.5);
      mesh(g, B(1.0, 0.05, 0.32), woodMat, -1.9, FLOOR + 0.28, 0.35);
      mesh(g, B(0.05, 0.28, 0.28), woodMat, -2.35, FLOOR + 0.14, 0.35);
      mesh(g, B(0.05, 0.28, 0.28), woodMat, -1.45, FLOOR + 0.14, 0.35);

      sitter(r, -2.15, 0.35, SOUTH, "sit", 1);
      sitter(r, -1.65, 0.35, SOUTH, (t) => (Math.sin(t * 0.7) > 0.6 ? "read" : "sit"), 4);

      const clerk = makeRig({ shirt: 0x1e3a5f, pants: 0x0b192c, skin: skinCols[1], hair: 0x1b1b1f, scale: 2.0 });
      placeRig(r, clerk, 0, -0.85, SOUTH);
      addActor(clerk, (t, tl, dt) => {
        let pose = "type";
        if (tl >= marks.docs && tl < marks.stampA) pose = "write";
        else if (tl >= marks.stampA && tl < marks.stampA + 2.2) pose = "work";
        else if (tl >= marks.cardGive && tl < marks.cardGive + 1.3) pose = "hold";
        applyPose(clerk, pose, t, 0, dt);
      });

      anims.push((t, dt, tl) => {
        const mins = t * 0.3;
        minuteHand.rotation.z = -mins * Math.PI * 2;
        hourHand.rotation.z = (-mins * Math.PI * 2) / 12 - 0.9;
        const p = 0.88 + Math.sin(t * 2.2) * 0.12;
        bannerMat.color.setRGB(p, p, p);
        const pulse = (ts) => Math.max(0, 1 - Math.abs(tl - ts) / 0.16);
        const hit = Math.min(1, pulse(marks.stampA + 0.5) + pulse(marks.stampA + 1.5));
        stamp.position.y = FLOOR + 0.62 - 0.08 * hit;
        stampFlash.material.opacity = hit * 0.85;
        ink.visible = tl > marks.stampA + 0.55 && tl < marks.cardGive;
      });
      addLabel("ADMISSION CELL", "#f97316", 0, 6.2, -3.3, 0.9, 2.7, r);
    }

    /* ═════════ 2. CLASSROOM ═════════ */
    {
      const r = makeRoom("cls", { wallMat: whiteMat, roofMat: orangeMat, floorMat: floorTile, delay: 0.6 });
      const g = r.g;
      frontWindows(r, [-1.05, 1.05], 1.0);
      mesh(r.front, PLANE(1.5, 0.3), flat(createSignTexture("Classroom 101", "#0b192c", "#ffffff", "#f97316")), 0, 1.6, 0.07);

      // roof: water tank + antenna
      mesh(r.roof, CYL(0.35, 0.35, 0.5, 12), steelMat, 1.0, 0.14 + 0.25, -0.5);
      mesh(r.roof, CYL(0.36, 0.36, 0.06, 12), orangeMat, 1.0, 0.14 + 0.3, -0.5);
      mesh(r.roof, CYL(0.02, 0.02, 1.0, 6), steelMat, -1.0, 0.14 + 0.5, -0.5);

      // board + teacher
      mesh(g, B(2.5, 0.98, 0.04), woodMat, 0, FLOOR + 1.2, -1.41);
      mesh(g, PLANE(2.4, 0.9), flat(boardTex), 0, FLOOR + 1.2, -1.385);
      const lineGeo = PLANE(0.9, 0.035);
      lineGeo.translate(0.45, 0, 0);
      const writeLines = [0, 1, 2].map((i) => {
        const m = mesh(g, lineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), -1.0, FLOOR + 1.22 - i * 0.14, -1.375);
        m.scale.x = 0.0001;
        return m;
      });
      mesh(g, B(0.9, 0.55, 0.4), woodMat, 1.0, FLOOR + 0.28, -1.0);

      const rows = [-0.2, 0.35, 0.9];
      rows.forEach((rz) => {
        addBench(r, -0.85, rz);
        addBench(r, 0.85, rz);
      });
      const seats = [
        [-1.1, 0, 5], [-0.6, 0, 6], [0.6, 0, 7], [1.1, 0, 8],
        [-1.1, 1, 9], [-0.6, 1, 10], [1.1, 1, 11],
        [-0.6, 2, 12], [0.6, 2, 13]
      ];
      seats.forEach(([sx, row, i]) => {
        const sz = rows[row] + 0.3;
        addChair(r, sx, sz, NORTH, i % 2 ? navyMat : orangeMat);
        sitter(r, sx, sz, NORTH, (t) => ((t * 0.28 + i * 0.37) % 1 < 0.12 ? "hand" : "type"), i);
      });
      addChair(r, 0.6, rows[1] + 0.3, NORTH, orangeMat); // Aarav ki seat

      const teacher = makeRig({ shirt: 0x2f7d5b, pants: 0x1b1b1f, skin: skinCols[2], hair: 0x6b7280, scale: 2.1 });
      world.add(teacher.g);
      addActor(teacher, (t, tl, dt) => {
        const pointing = tl > marks.clsHand + 0.6 && tl < marks.clsHand + 3;
        const lx = pointing ? 0.2 : -0.5 + Math.sin(t * 0.35) * 0.25;
        teacher.g.position.set(r.x + lx, GY + FLOOR, r.z - 1.0);
        const heroDir = Math.atan2(H.x - (r.x + lx), H.z - (r.z - 1.0));
        teacher.g.rotation.y += angDiff(pointing ? heroDir : NORTH, teacher.g.rotation.y) * Math.min(1, dt * 6);
        applyPose(teacher, pointing ? "point" : "write", t, 0, dt);
      });

      anims.push((t) => {
        writeLines.forEach((m, i) => {
          const u = (t % 10) - i * 3;
          m.scale.x = Math.max(0.0001, Math.min(1, u / 2.4));
        });
      });
      addLabel("CLASSROOM", "#34d399", -6.2, 3.6, 1.4, 1.2, 2.2, r);
    }

    /* ═════════ 3. LIBRARY ═════════ */
    {
      const r = makeRoom("lib", { wallMat: whiteMat, roofMat: orangeMat, floorMat: floorWood, delay: 0.55 });
      const g = r.g;
      frontWindows(r, [-1.05, 1.05], 1.05);
      mesh(r.front, PLANE(1.5, 0.3), flat(libSignTex), 0, 1.65, 0.07);

      // roof: dome + orbiting books
      mesh(r.roof, CYL(0.95, 1.0, 0.5, 24), whiteMat, 0, 0.14 + 0.25, 0);
      const dome = mesh(r.roof, new THREE.SphereGeometry(0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), orangeMat, 0, 0.14 + 0.5, 0);
      dome.scale.y = 0.95;
      mesh(r.roof, SPH(0.08), lampMat, 0, 0.14 + 1.55, 0);
      const bookRing = new THREE.Group();
      bookRing.position.set(0, 0.14 + 1.5, 0);
      r.roof.add(bookRing);
      const bookList = [];
      for (let i = 0; i < 5; i++) {
        const b = new THREE.Group();
        mesh(b, B(0.3, 0.07, 0.22), i % 2 ? orangeMat : navyMat);
        mesh(b, B(0.27, 0.05, 0.2), whiteMat, 0.015, 0, 0);
        bookRing.add(b);
        bookList.push(b);
      }

      // interior
      mesh(g, PLANE(2.9, 1.5), flat(shelfTex), 0, FLOOR + 1.0, -1.08);
      [-1.47, 1.47].forEach((x) => mesh(g, B(0.06, 1.5, 0.14), woodMat, x, FLOOR + 1.0, -1.04));
      mesh(g, B(2.9, 0.06, 0.14), woodMat, 0, FLOOR + 1.77, -1.04);
      [-0.85, 0.85].forEach((tx) => {
        mesh(g, B(1.0, 0.05, 0.6), woodMat, tx, FLOOR + 0.5, 0.05);
        mesh(g, B(0.05, 0.5, 0.55), woodMat, tx - 0.45, FLOOR + 0.25, 0.05);
        mesh(g, B(0.05, 0.5, 0.55), woodMat, tx + 0.45, FLOOR + 0.25, 0.05);
        mesh(g, B(0.24, 0.02, 0.17), paperMat, tx - 0.15, FLOOR + 0.535, 0.05);
      });
      addChair(r, -0.85, 0.55, NORTH, orangeMat);
      addChair(r, -0.85, -0.45, SOUTH, orangeMat);
      addChair(r, 0.85, 0.55, NORTH, orangeMat); // Aarav
      addChair(r, 0.85, -0.45, SOUTH, orangeMat);
      sitter(r, -0.85, 0.55, NORTH, "read", 14);
      sitter(r, -0.85, -0.45, SOUTH, "read", 15);
      sitter(r, 0.85, -0.45, SOUTH, "read", 16);

      const reader = makeRig({ ...rigOpts(17), bag: true });
      roomPatrol(r, reader, patrol(-1.2, -0.85, 1.2, -0.85, 0.5, 2.2, NORTH), "reach", 3);

      anims.push((t) => {
        bookList.forEach((b, i) => {
          const a = t * 0.5 + (i / bookList.length) * Math.PI * 2;
          b.position.set(Math.cos(a) * 1.75, Math.sin(t * 1.5 + i * 1.3) * 0.12, Math.sin(a) * 1.75);
          b.rotation.y = -a;
          b.rotation.z = Math.sin(t + i) * 0.3;
        });
      });
      addLabel("CENTRAL LIBRARY", "#fbbf24", -5.7, 4.9, -2.7, 1.15, 2.7, r);
    }

    /* ═════════ 4. COMPUTER LAB ═════════ */
    {
      const r = makeRoom("lab", { wallMat: navyMat, roofMat: orangeMat, floorMat: floorTile, delay: 0.8 });
      const g = r.g;
      frontWindows(r, [-1.1, 1.1], 1.05);
      mesh(r.front, PLANE(1.7, 0.3), flat(labSignTex), 0, 1.7, 0.07);

      // roof: dish + hologram
      mesh(r.roof, CYL(0.08, 0.1, 0.3, 8), steelMat, -0.9, 0.14 + 0.15, 0);
      const dishG = new THREE.Group();
      dishG.position.set(-0.9, 0.14 + 0.45, 0);
      r.roof.add(dishG);
      const dishTilt = new THREE.Group();
      dishTilt.rotation.x = -0.55;
      dishG.add(dishTilt);
      const dish = mesh(dishTilt, new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), dishMat);
      dish.rotation.x = Math.PI;
      mesh(dishTilt, CYL(0.015, 0.015, 0.4, 6), steelMat, 0, 0.18, 0);
      mesh(dishTilt, SPH(0.04, 8, 6), lampMat, 0, 0.4, 0);
      mesh(r.roof, CYL(0.3, 0.34, 0.08, 20), darkMat, 0.7, 0.14 + 0.04, 0);
      const beam = mesh(r.roof, new THREE.ConeGeometry(0.34, 0.9, 20, 1, true), additive(0x38bdf8, 0.14), 0.7, 0.14 + 0.5, 0);
      beam.rotation.x = Math.PI;
      const holo = new THREE.Group();
      holo.position.set(0.7, 0.14 + 1.1, 0);
      r.roof.add(holo);
      const octa = mesh(holo, new THREE.OctahedronGeometry(0.55, 0), holoMat);
      mesh(holo, new THREE.IcosahedronGeometry(0.2, 0), holoCoreMat);
      const holoRing = mesh(holo, new THREE.TorusGeometry(0.85, 0.02, 6, 48), additive(0x38bdf8, 0.7));
      holoRing.rotation.x = Math.PI / 2;
      const holoGlow = glowSprite(glowBlue, 0xffffff, 0.6, 1.8);
      holo.add(holoGlow);

      // interior: do rows
      mesh(g, B(2.7, 0.05, 0.5), woodMat, 0, FLOOR + 0.5, -0.8);
      mesh(g, B(2.7, 0.05, 0.5), woodMat, 0, FLOOR + 0.5, 0.15);
      [-1.3, 1.3].forEach((x) => {
        mesh(g, B(0.05, 0.5, 0.46), woodMat, x, FLOOR + 0.25, -0.8);
        mesh(g, B(0.05, 0.5, 0.46), woodMat, x, FLOOR + 0.25, 0.15);
      });
      [-1, 0, 1].forEach((x) => addMonitor(r, x, -0.74, codeMat));
      [-1, 0, 1].forEach((x) => addMonitor(r, x, 0.21, codeMat2));
      mesh(g, PLANE(1.7, 0.3), flat(labSignTex), 0, 1.5, -1.12);
      [-1, 0, 1].forEach((x, i) => {
        addChair(r, x, -0.4, NORTH, navyMat);
        sitter(r, x, -0.4, NORTH, "type", 18 + i);
      });
      [-1, 0, 1].forEach((x, i) => {
        addChair(r, x, 0.55, NORTH, navyMat);
        if (x !== 0) sitter(r, x, 0.55, NORTH, "type", 21 + i);
      });
      mesh(g, B(0.4, 1.2, 0.5), darkMat, 1.5, FLOOR + 0.6, -0.95);
      const leds = [];
      for (let i = 0; i < 6; i++) {
        const m = std(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 1.5 });
        mesh(g, B(0.06, 0.04, 0.02), m, 1.5 + (i % 2 ? 0.1 : -0.1), FLOOR + 0.3 + Math.floor(i / 2) * 0.28, -0.69);
        leds.push(m);
      }
      const assistant = makeRig({ shirt: 0x7dd3fc, pants: 0x0b192c, skin: skinCols[0], hair: 0x3b2a20, scale: 2.0 });
      roomPatrol(r, assistant, patrol(-1.3, 0.97, 1.3, 0.97, 0.5, 2.6, NORTH), "point", 5);

      anims.push((t) => {
        codeTex.offset.y = -(t * 0.12) % 1;
        codeTex2.offset.y = -(t * 0.09 + 0.4) % 1;
        dishG.rotation.y = Math.sin(t * 0.5) * 1.2;
        octa.rotation.y = t * 0.9;
        octa.rotation.x = t * 0.5;
        holoRing.rotation.z = t * 0.7;
        holo.position.y = 0.14 + 1.1 + Math.sin(t * 1.4) * 0.1;
        holoGlow.material.opacity = 0.5 + Math.sin(t * 2.4) * 0.15;
        leds.forEach((m, i) => {
          m.emissiveIntensity = Math.sin(t * 6 + i * 1.7) > 0 ? 2.0 : 0.15;
        });
      });
      addLabel("COMPUTER LAB", "#38bdf8", 5.7, 5.1, -2.7, 1.4, 2.5, r);
    }

    /* ═════════ 5. CANTEEN (lunch) ═════════ */
    {
      const r = makeRoom("can", { wallMat: whiteMat, roofMat: navyMat, floorMat: floorTile, delay: 1.05 });
      const g = r.g;
      frontWindows(r, [-1.0, 1.0], 1.0);
      mesh(r.front, PLANE(1.5, 0.3), flat(canSignTex), 0, 1.55, 0.07);

      // roof: chimney + steam
      mesh(r.roof, CYL(0.14, 0.17, 1.1, 10), darkMat, 1.0, 0.14 + 0.55, -0.5);
      mesh(r.roof, CYL(0.17, 0.17, 0.08, 10), orangeMat, 1.0, 0.14 + 1.1, -0.5);
      mesh(r.roof, B(1.2, 0.08, 0.5), orangeMat, -0.5, 0.14 + 0.5, 0.2);
      mesh(r.roof, B(0.05, 0.5, 0.05), steelMat, -1.05, 0.14 + 0.25, 0.4);
      mesh(r.roof, B(0.05, 0.5, 0.05), steelMat, 0.05, 0.14 + 0.25, 0.4);
      const puffs = [];
      for (let i = 0; i < 7; i++) {
        const s = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: glowWhite, color: 0xe5edf8, transparent: true, opacity: 0.3, depthWrite: false })
        );
        r.roof.add(s);
        puffs.push(s);
      }

      // interior: counter + pots + menu
      mesh(g, B(2.4, 0.5, 0.36), woodMat, 0, FLOOR + 0.25, -0.7);
      mesh(g, B(2.5, 0.05, 0.42), stoneMat, 0, FLOOR + 0.525, -0.7);
      const potA = mesh(g, CYL(0.12, 0.11, 0.12, 12), steelMat, -0.8, FLOOR + 0.61, -0.7);
      mesh(g, CYL(0.12, 0.11, 0.12, 12), orangeMat, -0.45, FLOOR + 0.61, -0.7);
      mesh(g, CYL(0.1, 0.1, 0.1, 12), steelMat, 0.85, FLOOR + 0.6, -0.7);
      mesh(g, PLANE(1.5, 0.62), flat(menuTex), 0, FLOOR + 1.3, -1.0);
      const steam = [];
      for (let i = 0; i < 4; i++) {
        const s = glowSprite(glowWhite, 0xe5edf8, 0.3, 0.2);
        g.add(s);
        steam.push(s);
      }

      // tables + plates
      [-0.9, 0.9].forEach((tx) => {
        addBench(r, tx, 0.15, 1.0);
        [-0.2, 0.2].forEach((dx) => {
          mesh(g, CYL(0.075, 0.075, 0.015, 12), paperMat, tx + dx, FLOOR + 0.535, 0.15);
          mesh(g, SPH(0.04, 8, 6), orangeMat, tx + dx, FLOOR + 0.565, 0.15);
        });
      });
      addChair(r, -0.9, 0.55, NORTH, orangeMat);
      addChair(r, -0.9, -0.25, SOUTH, orangeMat);
      addChair(r, 0.9, 0.55, NORTH, orangeMat); // Aarav
      addChair(r, 0.9, -0.25, SOUTH, orangeMat);
      sitter(r, -0.9, 0.55, NORTH, "eat", 40);
      sitter(r, -0.9, -0.25, SOUTH, "eat", 41);
      sitter(r, 0.9, -0.25, SOUTH, "eat", 42);

      const server = makeRig({ shirt: 0xfbbf24, pants: 0x1e3a5f, skin: skinCols[1], hair: 0x1b1b1f, scale: 2.0 });
      placeRig(r, server, 0, -1.0, SOUTH);
      addActor(server, (t, tl, dt) => {
        const serving = tl >= marks.canGive - 0.6 && tl < marks.canGive + 1.4;
        applyPose(server, serving ? "hold" : "work", t, 0, dt);
      });

      anims.push((t) => {
        puffs.forEach((p, i) => {
          const u = (t * 0.3 + i / puffs.length) % 1;
          p.position.set(1.0 + u * 0.8 + Math.sin(t + i) * 0.05, 0.14 + 1.2 + u * 1.5, -0.5);
          p.scale.setScalar(0.3 + u * 0.9);
          p.material.opacity = (1 - u) * 0.3;
        });
        steam.forEach((s, i) => {
          const u = (t * 0.5 + i / steam.length) % 1;
          s.position.set(-0.8 + Math.sin(t * 2 + i) * 0.03, FLOOR + 0.7 + u * 0.45, -0.7);
          s.scale.setScalar(0.12 + u * 0.22);
          s.material.opacity = (1 - u) * 0.4;
        });
        potA.rotation.y = t;
      });
      addLabel("CANTEEN", "#fbbf24", 6.0, 3.6, 1.5, 1.7, 2.0, r);
    }

    /* ═════════ 6. HOSTEL (raat, neend) ═════════ */
    let hosMoon = null;
    {
      const r = makeRoom("hos", { wallMat: whiteMat, roofMat: navyMat, floorMat: floorWood, delay: 1.2, lightI: 6 });
      const g = r.g;
      frontWindows(r, [-1.55, -1.1, 1.1, 1.55], 1.05);
      mesh(r.front, PLANE(1.5, 0.3), flat(hosSignTex), 0, 1.65, 0.07);

      // roof: water tank + solar panels
      mesh(r.roof, CYL(0.3, 0.3, 0.45, 12), steelMat, -1.0, 0.14 + 0.22, -0.4);
      mesh(r.roof, CYL(0.31, 0.31, 0.05, 12), orangeMat, -1.0, 0.14 + 0.46, -0.4);
      [0.2, 0.9].forEach((px) => {
        const pnl = mesh(r.roof, B(0.6, 0.04, 0.8), navyMat, px, 0.14 + 0.22, -0.2);
        pnl.rotation.x = -0.4;
        mesh(r.roof, B(0.04, 0.2, 0.04), steelMat, px, 0.14 + 0.1, -0.2);
      });

      // back wall: window with moon + notice
      mesh(g, B(0.8, 0.55, 0.03), std(0x13204a, { emissive: 0x1d3a8a, emissiveIntensity: 0.6 }), 0.9, FLOOR + 1.3, -0.985);
      mesh(g, new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: 0xfff7d6 }), 1.05, FLOOR + 1.38, -0.965);
      mesh(g, PLANE(1.2, 0.3), flat(lightsOutTex), -0.8, FLOOR + 1.55, -0.985);

      // beds (head back wall ki taraf)
      const bedFrame = std(0x7a5632, { flatShading: false });
      const blanketMat = [std(0x60a5fa, { flatShading: false }), orangeMat, std(0x34d399, { flatShading: false })];
      [-1.2, 0, 1.2].forEach((bx, i) => {
        mesh(g, B(0.62, 0.18, 1.15), bedFrame, bx, FLOOR + 0.09, -0.375);
        mesh(g, B(0.56, 0.1, 1.1), whiteMat, bx, FLOOR + 0.23, -0.375);
        mesh(g, B(0.4, 0.07, 0.22), paperMat, bx, FLOOR + 0.31, -0.78);
        mesh(g, B(0.5, 0.05, 0.28), blanketMat[i], bx, FLOOR + 0.31, 0.02);
      });
      // bedside lamp + locker
      mesh(g, B(0.28, 0.3, 0.28), woodMat, -0.6, FLOOR + 0.15, -0.8);
      const bedLamp = mesh(g, SPH(0.06, 10, 8), lampMat, -0.6, FLOOR + 0.36, -0.8);
      lamps.push(bedLamp);
      mesh(g, B(0.3, 1.2, 0.4), steelMat, -1.5, FLOOR + 0.6, 0.7);
      mesh(g, B(0.04, 0.5, 0.02), darkMat, -1.5, FLOOR + 0.65, 0.91);

      hosMoon = new THREE.PointLight(0x7aa2ff, 0, 4, 1.4);
      hosMoon.position.set(0.5, FY + 1.3, -0.4);
      g.add(hosMoon);

      // dusre students soye hue (static, saans lete hue)
      [[-1.2, 43], [1.2, 44]].forEach(([bx, i]) => {
        const rig = makeRig({ ...rigOpts(i), scale: 1.9 });
        placeRig(r, rig, bx, 0.1, 0);
        rig.g.rotation.set(-Math.PI / 2, 0, 0);
        const baseY = GY + BED_TOP + 0.15;
        addActor(rig, (t, tl, dt) => {
          rig.g.position.y = baseY + Math.sin(t * 1.6 + i) * 0.006;
          applyPose(rig, "sleep", t, i, dt);
        });
      });

      addLabel("STUDENT HOSTEL", "#a78bfa", 0, 4.4, -6.6, 1.9, 2.7, r);
    }

    /* ═════════ 5 BRANCH PAVILIONS (front arc) ═════════ */
    const pavilion = (angleDeg, name, accent, accentHex, delay, signature) => {
      const R = 6.6;
      const a = (angleDeg * Math.PI) / 180;
      const x = Math.sin(a) * R;
      const z = Math.cos(a) * R;
      const g = makeGroup(x, z, delay);
      const aMat = std(accentHex, { emissive: accentHex, emissiveIntensity: 0.35, roughness: 0.4 });
      mesh(g, B(1.7, 0.12, 1.4), stoneMat, 0, 0.06, 0);
      mesh(g, B(1.55, 1.0, 1.25), whiteMat, 0, 0.62, 0);
      mesh(g, B(1.8, 0.1, 1.5), aMat, 0, 1.17, 0);
      mesh(g, B(0.46, 0.68, 0.03), aMat, 0, 0.46, 0.63);
      mesh(g, B(0.38, 0.62, 0.04), glassMat, 0, 0.45, 0.645);
      [-0.5, 0.5].forEach((wx) => mesh(g, B(0.28, 0.3, 0.04), winLitMat, wx, 0.72, 0.64));
      signature(g, aMat);
      addLabel(name, accent, x, 3.1, z, delay + 0.5, 2.1);
    };

    pavilion(-48, "CIVIL", "#f59e0b", 0xf59e0b, 1.5, (g, aMat) => {
      mesh(g, B(0.1, 2.2, 0.1), aMat, 0.95, 1.1, -0.35);
      mesh(g, new THREE.ConeGeometry(0.1, 0.25, 4), aMat, 0.95, 2.3, -0.35);
      const jib = new THREE.Group();
      jib.position.set(0.95, 2.2, -0.35);
      g.add(jib);
      mesh(jib, B(1.5, 0.07, 0.07), aMat, 0.35, 0, 0);
      mesh(jib, B(0.3, 0.14, 0.14), navyMat, -0.5, 0, 0);
      const hang = new THREE.Group();
      hang.position.set(0.95, 0, 0);
      jib.add(hang);
      mesh(hang, B(0.015, 0.6, 0.015), darkMat, 0, -0.3, 0);
      mesh(hang, B(0.14, 0.12, 0.14), orangeMat, 0, -0.66, 0);
      anims.push((t) => {
        jib.rotation.y = Math.sin(t * 0.5) * 1.1 - 0.3;
        hang.position.y = Math.sin(t * 1.2) * 0.12;
      });
    });

    pavilion(-24, "MECHANICAL", "#fb923c", 0xfb923c, 1.65, (g) => {
      mesh(g, B(1.0, 0.55, 0.04), navyMat, 0.05, 1.55, 0.0);
      const gA = makeGear(0.34, 10, 0.1, orangeMat);
      gA.position.set(-0.2, 1.67, 0.07);
      g.add(gA);
      const gB = makeGear(0.22, 7, 0.1, steelMat);
      gB.position.set(0.38, 1.55, 0.07);
      g.add(gB);
      anims.push((t) => {
        gA.rotation.z = t * 0.8;
        gB.rotation.z = -t * 0.8 * (0.34 / 0.22) + 0.3;
      });
    });

    pavilion(0, "ELECTRICAL", "#facc15", 0xfacc15, 1.8, (g) => {
      const pyl = mesh(g, new THREE.ConeGeometry(0.28, 1.9, 4), navyMat, 0, 2.17, 0);
      pyl.rotation.y = Math.PI / 4;
      mesh(g, B(0.8, 0.05, 0.05), navyMat, 0, 2.7, 0);
      mesh(g, B(0.55, 0.05, 0.05), navyMat, 0, 2.35, 0);
      const orbMats = [];
      [[-0.4, 2.7], [0.4, 2.7], [-0.27, 2.35], [0.27, 2.35]].forEach(([ox, oy]) => {
        const m = std(0xfde047, { emissive: 0xfacc15, emissiveIntensity: 1.6 });
        mesh(g, SPH(0.06, 8, 6), m, ox, oy, 0);
        orbMats.push(m);
      });
      const top = glowSprite(glowOrange, 0xfde047, 0.9, 0.9);
      top.position.set(0, 3.15, 0);
      g.add(top);
      const pulse = mesh(g, new THREE.TorusGeometry(0.4, 0.015, 6, 36), additive(0xfde047, 0.7), 0, 2.7, 0);
      pulse.rotation.x = Math.PI / 2;
      anims.push((t) => {
        orbMats.forEach((m, i) => {
          m.emissiveIntensity = 1.2 + Math.abs(Math.sin(t * 3 + i * 0.9)) * 1.2;
        });
        top.material.opacity = 0.6 + Math.abs(Math.sin(t * 4)) * 0.4;
        const u = (t * 0.8) % 1;
        pulse.scale.setScalar(0.4 + u * 1.2);
        pulse.material.opacity = (1 - u) * 0.7;
      });
    });

    pavilion(24, "ELECTRONICS", "#22d3ee", 0x22d3ee, 1.95, (g, aMat) => {
      mesh(g, CYL(0.04, 0.06, 1.1, 8), steelMat, 0, 1.75, 0);
      mesh(g, SPH(0.08, 10, 8), aMat, 0, 2.35, 0);
      const dish = mesh(g, new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), dishMat, 0, 1.95, 0.12);
      dish.rotation.x = Math.PI / 2 + 0.2;
      const rings = [0, 1, 2].map(() => {
        const r = mesh(g, new THREE.TorusGeometry(0.5, 0.014, 6, 40), additive(0x22d3ee, 0.8), 0, 2.35, 0);
        r.rotation.x = Math.PI / 2;
        return r;
      });
      anims.push((t) => {
        rings.forEach((r, i) => {
          const u = (t * 0.5 + i / 3) % 1;
          r.scale.setScalar(0.3 + u * 1.7);
          r.material.opacity = (1 - u) * 0.8;
        });
      });
    });

    pavilion(48, "COMPUTER SCI.", "#a78bfa", 0xa78bfa, 2.1, (g, aMat) => {
      mesh(g, CYL(0.28, 0.32, 0.07, 20), darkMat, 0, 1.26, 0);
      const holo = new THREE.Group();
      holo.position.set(0, 2.0, 0);
      g.add(holo);
      const cube = mesh(holo, B(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true }));
      const core = mesh(holo, new THREE.IcosahedronGeometry(0.17, 0), aMat);
      const ring = mesh(holo, new THREE.TorusGeometry(0.6, 0.018, 6, 40), additive(0xa78bfa, 0.7));
      ring.rotation.x = Math.PI / 2.4;
      const glow = glowSprite(glowWhite, 0xa78bfa, 0.7, 1.6);
      holo.add(glow);
      anims.push((t) => {
        cube.rotation.y = t * 0.9;
        cube.rotation.x = t * 0.6;
        core.rotation.y = -t * 1.2;
        ring.rotation.z = t * 0.8;
        holo.position.y = 2.0 + Math.sin(t * 1.4 + 1) * 0.1;
        glow.material.opacity = 0.5 + Math.sin(t * 2.2) * 0.15;
      });
    });

    /* ═════════ TREES ═════════ */
    [
      [-2.4, -1.2, 0.8, 1],
      [-3.7, -6.4, 1.0, 0], [3.7, -6.4, 1.0, 1],
      [-5.5, -6, 1.0, 1], [5.5, -6, 1.0, 0], [-6.9, -5.0, 0.9, 0], [6.9, -5.0, 0.9, 1],
      [-7.9, -0.8, 0.85, 0], [8.1, -0.6, 0.85, 1]
    ].forEach(([x, z, s, v], i) => {
      const g = makeGroup(x, z, 1.2 + i * 0.07);
      mesh(g, CYL(0.06 * s, 0.09 * s, 0.5 * s, 7), trunkMat, 0, 0.25 * s, 0);
      const leaf = mesh(g, new THREE.IcosahedronGeometry(0.5 * s, 1), v ? leafMatB : leafMatA, 0, 0.8 * s, 0);
      leaf.scale.y = 1.15;
      mesh(g, new THREE.IcosahedronGeometry(0.34 * s, 1), v ? leafMatA : leafMatB, 0.05 * s, 1.18 * s, 0);
      anims.push((t) => {
        g.rotation.z = Math.sin(t * 1.4 + i * 0.9) * 0.035;
        g.rotation.x = Math.cos(t * 1.1 + i * 0.9) * 0.025;
      });
    });

    /* ═════════ CAMPUS PARK ═════════ */
    {
      const g = makeGroup(PARK.x, PARK.z, 1.4);
      mesh(g, B(2.1, 0.05, 1.9), parkMat, 0, 0.025, 0);
      mesh(g, B(0.5, 0.02, 0.7), stoneMat, 0, 0.06, -0.62);
      mesh(g, CYL(0.42, 0.42, 0.03, 24), waterMat, 0, 0.07, 0.25);
      const rim = mesh(g, new THREE.TorusGeometry(0.44, 0.03, 6, 28), stoneMat, 0, 0.08, 0.25);
      rim.rotation.x = Math.PI / 2;
      const ripple = mesh(g, new THREE.TorusGeometry(0.2, 0.01, 6, 28), additive(0x9fd4ff, 0.6), 0, 0.09, 0.25);
      ripple.rotation.x = Math.PI / 2;

      // bench (seat ka top ~ hero ke hips par)
      mesh(g, B(1.2, 0.04, 0.3), woodMat, 0, 0.32, -0.4);
      mesh(g, B(1.2, 0.3, 0.03), woodMat, 0, 0.5, -0.55);
      [-0.5, 0.5].forEach((bx) => mesh(g, B(0.05, 0.3, 0.26), navyMat, bx, 0.17, -0.4));

      // flowers
      [[-0.8, 0.6], [0.7, 0.65], [0.8, -0.1], [-0.85, 0.1], [-0.3, 0.78], [0.35, 0.78]].forEach(([fx, fz], i) => {
        mesh(g, SPH(0.045, 8, 6), cm([0xf472b6, 0xfbbf24, 0xffffff][i % 3]), fx, 0.1, fz);
      });
      // chhote ped
      [[-0.8, -0.6, 0.5], [0.85, -0.65, 0.55], [0.85, 0.55, 0.45]].forEach(([tx, tz, s]) => {
        mesh(g, CYL(0.06 * s, 0.09 * s, 0.5 * s, 7), trunkMat, tx, 0.25 * s + 0.05, tz);
        mesh(g, new THREE.IcosahedronGeometry(0.5 * s, 1), leafMatB, tx, 0.8 * s + 0.05, tz);
      });
      // lamp
      mesh(g, CYL(0.02, 0.03, 0.6, 8), navyMat, -0.95, 0.3, -0.2);
      lamps.push(mesh(g, SPH(0.07, 10, 8), lampMat, -0.95, 0.63, -0.2));

      anims.push((t) => {
        const u = (t * 0.45) % 1;
        ripple.scale.setScalar(0.5 + u * 1.5);
        ripple.material.opacity = (1 - u) * 0.6;
      });
      addLabel("CAMPUS PARK", "#34d399", PARK.x, 2.0, PARK.z, 1.9, 2.2);
    }
    {
      // bench par dost (Aarav ke saath baithta hai)
      const rig = makeRig(rigOpts(44));
      rig.g.position.set(3.15, GY + 0.04, 3.5);
      rig.g.rotation.y = SOUTH;
      world.add(rig.g);
      addActor(rig, (t, tl, dt) => applyPose(rig, Math.sin(t * 0.9) > 0.7 ? "hand" : "sit", t, 2, dt));
    }

    /* ═════════ PLAYGROUND + BALL GAME ═════════ */
    {
      const g = makeGroup(COURT.x, COURT.z, 1.3);
      mesh(g, B(2.4, 0.05, 1.7), courtMat, 0, 0.025, 0);
      [-0.8, 0.8].forEach((z) => mesh(g, B(2.3, 0.012, 0.03), whiteMat, 0, 0.056, z));
      [-1.13, 1.13].forEach((x) => mesh(g, B(0.03, 0.012, 1.6), whiteMat, x, 0.056, 0));
      mesh(g, B(0.03, 0.012, 1.6), whiteMat, 0, 0.056, 0);
      const circ = mesh(g, new THREE.TorusGeometry(0.34, 0.015, 6, 36), whiteMat, 0, 0.058, 0);
      circ.rotation.x = Math.PI / 2;
      mesh(g, CYL(0.03, 0.03, 1.0, 8), steelMat, -1.2, 0.5, 0);
      mesh(g, B(0.04, 0.35, 0.5), whiteMat, -1.1, 1.0, 0);
      const hoop = mesh(g, new THREE.TorusGeometry(0.1, 0.012, 6, 20), orangeMat, -0.98, 0.86, 0);
      hoop.rotation.x = Math.PI / 2;
      addLabel("PLAYGROUND", "#34d399", COURT.x, 2.1, COURT.z, 1.9, 2.3);
    }

    const slots = [
      [COURT.x - 0.75, COURT.z - 0.45],
      [COURT.x + 0.75, COURT.z - 0.45],
      [COURT.x + 0.75, COURT.z + 0.45],
      [COURT.x - 0.75, COURT.z + 0.45]
    ];
    const ball = mesh(world, SPH(0.09, 12, 10), orangeMat, COURT.x, GY + 0.6, COURT.z);
    const pass = { idx: -1, order: [0, 1, 2, 3], u: 0 };
    const H = { x: -1.58, z: 7.43, h: Math.PI, y: GY + 0.04, st: "stand", gait: 7.4 };
    const slotXZ = (i) => (i === 4 ? [H.x, H.z] : slots[i]);
    const ballPoseOf = (i) => {
      const n = pass.order.length;
      const f = pass.order[Math.max(0, pass.idx) % n];
      const to = pass.order[(Math.max(0, pass.idx) + 1) % n];
      if (to === i && pass.u > 0.55) return "catch";
      if (f === i && pass.u < 0.35) return "throw";
      return "stand";
    };
    const updateBall = (time) => {
      const PASS = 1.15;
      const idx = Math.floor(time / PASS);
      if (idx !== pass.idx) {
        pass.idx = idx;
        pass.order = H.st === "play" ? [0, 1, 4, 2, 3] : [0, 1, 2, 3];
      }
      pass.u = (time % PASS) / PASS;
      const n = pass.order.length;
      const a = slotXZ(pass.order[idx % n]);
      const b = slotXZ(pass.order[(idx + 1) % n]);
      ball.position.set(lerp(a[0], b[0], pass.u), GY + 0.6 + Math.sin(Math.PI * pass.u) * 0.5, lerp(a[1], b[1], pass.u));
    };
    slots.forEach((p, i) => {
      const rig = makeRig({ ...rigOpts(i + 24) });
      rig.g.position.set(p[0], GY + 0.04, p[1]);
      world.add(rig.g);
      addActor(rig, (t, tl, dt) => {
        const pose = ballPoseOf(i);
        const want = Math.atan2(ball.position.x - p[0], ball.position.z - p[1]);
        rig.g.rotation.y += angDiff(want, rig.g.rotation.y) * Math.min(1, dt * 10);
        rig.g.position.y = GY + 0.04 + (pose !== "stand" ? Math.abs(Math.sin(t * 10)) * 0.03 : 0);
        applyPose(rig, pose, t, i, dt);
      });
    });

    /* ═════════ AMBIENT STUDENTS (bahar chalte hue) ═════════ */
    const orbit = (cx0, cz0, A, Bz, speed, phase, dir) => {
      const w = speed / ((A + Bz) / 2);
      return (t, o) => {
        const a = dir * t * w + phase;
        o.x = cx0 + Math.sin(a) * A;
        o.z = cz0 + Math.cos(a) * Bz;
        o.h = Math.atan2(dir * Math.cos(a) * A, -dir * Math.sin(a) * Bz);
      };
    };
    const arc = (R, a1, a2, speed, phase) => {
      const L = R * Math.abs(a2 - a1);
      const sgn = Math.sign(a2 - a1);
      return (t, o) => {
        const u = ((t * speed) / L + phase) % 2;
        const p = u < 1 ? u : 2 - u;
        const a = a1 + (a2 - a1) * p;
        const s = (u < 1 ? 1 : -1) * sgn;
        o.x = Math.sin(a) * R;
        o.z = Math.cos(a) * R;
        o.h = Math.atan2(s * Math.cos(a), -s * Math.sin(a));
      };
    };
    const addWalker = (i, upd, speed) => {
      const rig = makeRig(rigOpts(i));
      const o = { x: 0, z: 0, h: 0 };
      addActor(rig, (t, tl, dt) => {
        upd(t, o);
        rig.g.position.set(o.x, GY + 0.04, o.z);
        rig.g.rotation.y = o.h;
        applyPose(rig, "walk", t, i * 1.7, dt, speed * 5.3);
      });
    };
    [0, 2.1, 4.2].forEach((ph, k) => addWalker(30 + k, orbit(0, 1.5, 1.8, 1.8, 0.6, ph, k % 2 ? -1 : 1), 0.6));
    [0, 0.8, 1.5].forEach((ph, k) => addWalker(34 + k, arc(7.9, k % 2 ? 1.15 : -1.15, k % 2 ? -1.15 : 1.15, 0.8, ph), 0.8));
    addWalker(45, orbit(PARK.x, PARK.z + 0.25, 0.8, 0.62, 0.45, 0, 1), 0.5); // park me jogger

    /* ═════════ HERO: AARAV ═════════ */
    const hero = makeRig({ shirt: 0xf97316, pants: 0x1e3a5f, skin: 0xf2c9a0, hair: 0x1b1b1f, bag: true, scale: 2.05 });
    world.add(hero.g);
    const heroTag = makeLabelSprite("AARAV · New student", "#f97316");
    heroTag.scale.set(0.0001, 0.0001, 1);
    world.add(heroTag);
    const heroRing = mesh(world, new THREE.TorusGeometry(0.34, 0.025, 8, 36), additive(0xf97316, 0.85), 0, GY + 0.06, 0);
    heroRing.rotation.x = Math.PI / 2;
    const popup = makeLabelSprite("Admission confirmed", "#34d399");
    popup.scale.set(0.0001, 0.0001, 1);
    world.add(popup);
    const zzz = makeLabelSprite("Zzz · Good night", "#a78bfa");
    zzz.scale.set(0.0001, 0.0001, 1);
    world.add(zzz);
    const finPopup = makeLabelSprite("Day complete · Good night", "#a78bfa");
    finPopup.scale.set(0.0001, 0.0001, 1);
    world.add(finPopup);

    const cardMesh = new THREE.Group();
    mesh(cardMesh, B(0.2, 0.012, 0.13), orangeMat);
    mesh(cardMesh, B(0.2, 0.014, 0.03), whiteMat, 0, 0, 0.04);
    mesh(cardMesh, B(0.05, 0.016, 0.05), navyMat, -0.05, 0, -0.02);
    world.add(cardMesh);
    const bookMesh = new THREE.Group();
    mesh(bookMesh, B(0.2, 0.04, 0.15), navyMat);
    mesh(bookMesh, B(0.18, 0.03, 0.14), whiteMat, 0.01, 0, 0);
    world.add(bookMesh);
    bookMesh.visible = false;

    const trayMesh = new THREE.Group();
    mesh(trayMesh, B(0.26, 0.02, 0.18), steelMat);
    mesh(trayMesh, CYL(0.06, 0.06, 0.015, 12), paperMat, -0.05, 0.02, 0);
    mesh(trayMesh, SPH(0.035, 8, 6), orangeMat, -0.05, 0.04, 0);
    mesh(trayMesh, CYL(0.025, 0.02, 0.05, 8), navyMat, 0.07, 0.04, 0.03);
    world.add(trayMesh);

    const floorAt = (x, z) => {
      for (const id in RD) {
        const r = RD[id];
        if (Math.abs(x - r.x) < r.w / 2 + 0.1 && Math.abs(z - r.z) < r.d / 2 + 0.1) return GY + FLOOR;
      }
      return GY + 0.04;
    };

    let sleepAmt = 0;
    let night = 0;

    const updateHero = (tl, time, dt) => {
      const k0 = keys[0];
      let st = "stand";
      let face = H.h;
      if (tl >= k0.t) {
        let i = 1;
        while (i < keys.length && keys[i].t <= tl) i++;
        if (i >= keys.length) {
          const l = keys[keys.length - 1];
          H.x = l.x;
          H.z = l.z;
          st = l.st;
          face = l.face !== undefined ? l.face : H.h;
        } else {
          const a = keys[i - 1];
          const b = keys[i];
          const u = (tl - a.t) / Math.max(1e-4, b.t - a.t);
          H.x = a.x + (b.x - a.x) * u;
          H.z = a.z + (b.z - a.z) * u;
          st = b.st;
          if (st === "walk") {
            face = Math.atan2(b.x - a.x, b.z - a.z);
            H.gait = (Math.hypot(b.x - a.x, b.z - a.z) / Math.max(1e-4, b.t - a.t)) * 5.3;
          } else if (b.face !== undefined) face = b.face;
        }
      } else {
        H.x = k0.x;
        H.z = k0.z;
      }
      H.st = st;
      if (st === "play") face = Math.atan2(ball.position.x - H.x, ball.position.z - H.z);
      H.h += angDiff(face, H.h) * Math.min(1, dt * 10);
      const ty = st === "sleep" ? GY + BED_TOP + 0.16 : floorAt(H.x, H.z);
      H.y += (ty - H.y) * Math.min(1, dt * 14);

      sleepAmt += ((st === "sleep" ? 1 : 0) - sleepAmt) * Math.min(1, dt * 5);

      const pose = st === "play" ? ballPoseOf(4) : st;
      hero.g.position.set(H.x, H.y, H.z);
      hero.g.rotation.set(-Math.PI / 2 * sleepAmt, H.h, 0);
      applyPose(hero, pose, time, 0, dt, H.gait);

      const pop = ease((tl - k0.t) / 0.5);
      const out = 1 - ease((tl - (LOOP - 1.6)) / 0.7);
      const vis = Math.max(pop * out, 0.0001);
      hero.g.scale.setScalar(vis * hero.scale);

      heroTag.position.set(H.x, H.y + 1.4 + sleepAmt * 0.3, H.z);
      heroTag.scale.set(1.9 * vis * (1 - sleepAmt * 0.9), 0.475 * vis * (1 - sleepAmt * 0.9), 1);
      heroRing.position.set(H.x, H.y + 0.03, H.z);
      heroRing.scale.setScalar(vis * (1 + Math.sin(time * 4) * 0.08));
      heroRing.visible = sleepAmt < 0.4;

      // ID card
      const counter = [RD.adm.x + 0.25, GY + FLOOR + 0.56, RD.adm.z - 0.42];
      const hand = [H.x + Math.sin(H.h) * 0.36, H.y + 0.7 + Math.sin(time * 3) * 0.01, H.z + Math.cos(H.h) * 0.36];
      let cs = 1;
      if (tl < marks.cardGive) {
        cardMesh.position.set(...counter);
      } else if (tl < marks.cardGive + 1.3) {
        const u = ease((tl - marks.cardGive) / 1.3);
        cardMesh.position.set(lerp(counter[0], hand[0], u), lerp(counter[1], hand[1], u) + Math.sin(Math.PI * u) * 0.25, lerp(counter[2], hand[2], u));
      } else if (tl < marks.cardHeld + 2.0) {
        cardMesh.position.set(...hand);
      } else {
        cardMesh.position.set(...hand);
        cs = 1 - ease((tl - (marks.cardHeld + 2.0)) / 0.4);
      }
      cardMesh.scale.setScalar(Math.max(cs, 0.0001));
      cardMesh.rotation.y = H.h;

      // lunch tray
      const trayCounter = [RD.can.x, GY + FLOOR + 0.57, RD.can.z - 0.7];
      const trayTable = [RD.can.x + 0.9, GY + FLOOR + 0.55, RD.can.z + 0.15];
      const trayHand = [H.x + Math.sin(H.h) * 0.34, H.y + 0.68, H.z + Math.cos(H.h) * 0.34];
      let ts = 1;
      let tp = trayCounter;
      if (tl < marks.canGive) {
        tp = trayCounter;
      } else if (tl < marks.canGive + 1.4) {
        const u = ease((tl - marks.canGive) / 1.4);
        tp = [lerp(trayCounter[0], trayHand[0], u), lerp(trayCounter[1], trayHand[1], u) + Math.sin(Math.PI * u) * 0.2, lerp(trayCounter[2], trayHand[2], u)];
      } else if (tl < marks.canSit) {
        tp = trayHand;
      } else if (tl < marks.canEnd + 0.4) {
        tp = trayTable;
      } else {
        tp = trayTable;
        ts = 1 - ease((tl - (marks.canEnd + 0.4)) / 0.4);
      }
      trayMesh.position.set(tp[0], tp[1], tp[2]);
      trayMesh.rotation.y = tl >= marks.canGive && tl < marks.canSit ? H.h : 0;
      trayMesh.scale.setScalar(Math.max(ts, 0.0001));

      // popup "Admission confirmed"
      const pu = tl - marks.cardHeld;
      const pv = pu > 0 && pu < 2.6 ? Math.min(ease(pu / 0.35), 1 - ease((pu - 2.2) / 0.4)) : 0;
      popup.position.set(H.x, H.y + 1.95, H.z);
      popup.scale.set(Math.max(pv, 0.0001) * 2.3, Math.max(pv, 0.0001) * 0.575, 1);

      // sleeping: Zzz + day complete
      const zv = Math.max(clamp01((sleepAmt - 0.6) / 0.4) * out, 0.0001);
      zzz.position.set(H.x, GY + FLOOR + 1.15 + Math.sin(time * 1.5) * 0.06, H.z - 0.5);
      zzz.scale.set(1.7 * zv, 0.425 * zv, 1);
      const fu = tl - marks.fin;
      const fv = Math.max(fu > 0 ? ease(fu / 0.6) * out : 0, 0.0001);
      finPopup.position.set(RD.hos.x, GY + 3.1, RD.hos.z);
      finPopup.scale.set(2.8 * fv, 0.7 * fv, 1);

      // library book
      const bookOn = tl > marks.libTake && tl < marks.libEnd + 0.5;
      bookMesh.visible = bookOn;
      if (bookOn) {
        if (st === "read" || st === "sit") {
          bookMesh.position.set(RD.lib.x + 0.85, GY + FLOOR + 0.57, RD.lib.z + 0.1);
          bookMesh.rotation.y = 0;
        } else {
          bookMesh.position.set(H.x + Math.sin(H.h) * 0.3, H.y + 0.62, H.z + Math.cos(H.h) * 0.3);
          bookMesh.rotation.y = H.h;
        }
      }
    };

    /* ═════════ CONFETTI ═════════ */
    const confetti = [];
    for (let i = 0; i < 44; i++) {
      const col = [0xf97316, 0xffffff, 0x60a5fa, 0x34d399, 0xfbbf24][i % 5];
      const s = glowSprite(glowWhite, col, 0, 0.16);
      world.add(s);
      confetti.push({ s, vx: Math.sin(i * 12.9) * 1.6, vz: Math.cos(i * 7.7) * 1.3, vy: 2.2 + (i % 5) * 0.4 });
    }

    /* ═════════ CAMERA DIRECTOR (shots) ═════════ */
    // cap = [step, title, description, time-of-day]
    const CAPS = {
      overview: ["Step 01 of 11", "Subharti Polytechnic Campus", "A bird's-eye view of the whole campus before the day begins.", "7:30 AM"],
      arrive: ["Step 02 of 11", "Campus arrival", "Aarav enters the gate for his first day at Subharti Polytechnic.", "8:30 AM"],
      adm: ["Step 03 of 11", "Admission office", "His documents are verified, the form is stamped and his student ID is issued.", "9:00 AM"],
      cls: ["Step 04 of 11", "First classroom", "Aarav sits through his first Digital Electronics lecture.", "10:30 AM"],
      lab: ["Step 05 of 11", "Computer laboratory", "He practises programming on a campus workstation.", "12:00 PM"],
      can: ["Step 06 of 11", "Lunch at the canteen", "He collects a tray and has lunch with his classmates.", "1:15 PM"],
      lib: ["Step 07 of 11", "Central library", "He picks an engineering reference book and studies quietly.", "2:30 PM"],
      park: ["Step 08 of 11", "Campus park", "A short break on the bench by the pond, waving to friends.", "4:00 PM"],
      play: ["Step 09 of 11", "Playground", "Aarav joins his classmates for an evening game.", "5:15 PM"],
      hos: ["Step 10 of 11", "Student hostel", "After a full day, Aarav heads to the hostel and goes to sleep.", "9:30 PM"],
      fin: ["Step 11 of 11", "One day, a great start", "Learn, build, collaborate and grow with CollegeOS.", "Day complete"]
    };
    const shots = [];
    const WIDE = { target: [0, GY + 0.5, 0], w: 21, h: 16.5, az: 0.42, el: 0.4, follow: false, focus: null };
    const FOLLOW = { target: [0, GY + 0.8, 0], w: 8, h: 5.5, az: 0.5, el: 0.38, follow: true, focus: null };
    const shot = (t0, o) => shots.push({ t0, ...o });
    const roomShot = (id, cap, el = 0.62) => {
      const r = RD[id];
      return { target: [r.x, GY + 0.95, r.z + 0.1], w: r.w + 0.8, h: 3.8, az: 0.16, el, follow: false, focus: id, cap };
    };
    shot(0, { ...WIDE, cap: CAPS.overview });
    shot(3.4, { ...WIDE, az: -0.12, el: 0.46 });
    shot(marks.arrive, { ...FOLLOW, cap: CAPS.arrive });
    shot(marks.admNear, roomShot("adm", CAPS.adm));
    shot(marks.admOut, { ...FOLLOW });
    shot(marks.clsNear, roomShot("cls", CAPS.cls));
    shot(marks.clsOut, { ...FOLLOW });
    shot(marks.labNear, roomShot("lab", CAPS.lab));
    shot(marks.labOut, { ...FOLLOW });
    shot(marks.canNear, roomShot("can", CAPS.can));
    shot(marks.canOut, { ...FOLLOW });
    shot(marks.libNear, roomShot("lib", CAPS.lib));
    shot(marks.libOut, { ...FOLLOW });
    shot(marks.parkNear, { target: [PARK.x, GY + 0.5, PARK.z], w: 5.0, h: 3.6, az: 0.2, el: 0.5, follow: false, focus: null, cap: CAPS.park });
    shot(marks.parkOut, { ...FOLLOW });
    shot(marks.courtNear, { target: [COURT.x, GY + 0.6, COURT.z], w: 6.2, h: 4, az: 0.35, el: 0.5, follow: false, focus: null, cap: CAPS.play });
    shot(marks.play, { target: [COURT.x, GY + 0.65, COURT.z], w: 5.4, h: 3.7, az: 0.72, el: 0.46, follow: false, focus: null });
    shot(marks.playOut, { ...FOLLOW });
    shot(marks.hosWalk, { ...FOLLOW, el: 0.85, w: 9 });
    shot(marks.hosNear, roomShot("hos", CAPS.hos, 0.85));
    shot(marks.fin, { ...WIDE, az: 0.3, el: 0.45, cap: CAPS.fin });

    const cam = { tx: 0, ty: GY + 0.5, tz: 0, w: 21, h: 16.5, az: 0.42, el: 0.4, init: false };
    const tmpV = new THREE.Vector3();

    let capTimer = 0;
    const setCaption = (cap) => {
      if (!cap || !capRef.current) return;
      capRef.current.style.opacity = "0";
      clearTimeout(capTimer);
      capTimer = setTimeout(() => {
        if (!capRef.current) return;
        if (capStepRef.current) capStepRef.current.textContent = `${cap[0]} · ${cap[3]}`;
        if (capTitleRef.current) capTitleRef.current.textContent = cap[1];
        if (capTextRef.current) capTextRef.current.textContent = cap[2];
        capRef.current.style.opacity = "1";
      }, 300);
    };

    /* ═════════ shadows for everything solid ═════════ */
    world.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m && (m.transparent || m.isMeshBasicMaterial)) return;
      o.castShadow = true;
      o.receiveShadow = true;
    });

    /* ═════════ floating rocks under the island ═════════ */
    const rocks = [
      { m: mesh(island, new THREE.IcosahedronGeometry(0.45, 0), underMat, -3.2, -4.4, 1.6), ph: 0 },
      { m: mesh(island, new THREE.IcosahedronGeometry(0.3, 0), underMat, 3.0, -5.0, -1.2), ph: 2 },
      { m: mesh(island, new THREE.IcosahedronGeometry(0.22, 0), underMat, 0.8, -6.6, 2.0), ph: 4 },
      { m: mesh(island, new THREE.IcosahedronGeometry(0.26, 0), underMat, -1.2, -6.9, -1.6), ph: 1 }
    ];

    /* ═════════ orbit ring + orbs ═════════ */
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = 1.2;
    ringGroup.rotation.z = 0.25;
    island.add(ringGroup);
    const RING_R = 11.8;
    ringGroup.add(new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.02, 8, 200), additive(0xf97316, 0.5)));
    const orbs = [0, 1, 2, 3, 4].map((i) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: i % 2 ? glowWhite : glowOrange,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      s.scale.set(1.1, 1.1, 1);
      ringGroup.add(s);
      return { s, off: (i / 5) * Math.PI * 2 };
    });

    /* ═════════ backdrop ═════════ */
    const backGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowOrange, transparent: true, opacity: 0.33, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    backGlow.scale.set(34, 34, 1);
    backGlow.position.set(0, -1.5, -10);
    scene.add(backGlow);

    const moon = glowSprite(glowWhite, 0xdbe9ff, 0, 3.4);
    moon.position.set(-9, 8, -13);
    scene.add(moon);

    const starCount = 140;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 1] = -12 + Math.random() * 40;
      starPos[i * 3 + 2] = -30 - Math.random() * 8;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xdbe9ff, size: 3, sizeAttenuation: false, map: glowWhite, transparent: true, opacity: 0.8,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(starGeo, starMat));

    const clouds = [
      { x: -18, y: 8.5, s: 15, v: 0.18, o: 0.1 },
      { x: 12, y: 12, s: 18, v: 0.12, o: 0.08 },
      { x: 2, y: -9, s: 17, v: 0.15, o: 0.09 }
    ].map((c) => {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowWhite, color: 0x9bb8e8, transparent: true, opacity: c.o, depthWrite: false })
      );
      sp.scale.set(c.s, c.s * 0.35, 1);
      sp.position.set(c.x, c.y, -14);
      scene.add(sp);
      return { sp, v: c.v };
    });

    const moteCount = isSmall ? 40 : 80;
    const motePos = new Float32Array(moteCount * 3);
    const moteSeed = [];
    for (let i = 0; i < moteCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 9;
      motePos[i * 3] = Math.cos(a) * r;
      motePos[i * 3 + 1] = -7 + Math.random() * 16;
      motePos[i * 3 + 2] = Math.sin(a) * r;
      moteSeed.push(0.12 + Math.random() * 0.18);
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    scene.add(
      new THREE.Points(
        moteGeo,
        new THREE.PointsMaterial({
          color: 0xffc896, size: 3, sizeAttenuation: false, map: glowOrange, transparent: true, opacity: 0.55,
          depthWrite: false, blending: THREE.AdditiveBlending
        })
      )
    );

    /* ───────── mouse parallax ───────── */
    let tMX = 0, tMY = 0, cMX = 0, cMY = 0;
    const onMove = (e) => {
      if (reduced) return;
      const r = container.getBoundingClientRect();
      tMX = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      tMY = Math.max(-1, Math.min(1, -(((e.clientY - r.top) / r.height) * 2 - 1)));
    };
    const onLeave = () => { tMX = 0; tMY = 0; };
    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave, { passive: true });

    /* ───────── resize ───────── */
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth * 0.58;
      const h = container.clientHeight || window.innerHeight;
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(handleResize);
      ro.observe(container);
    } else {
      window.addEventListener("resize", handleResize);
    }

    /* ───────── animation / director loop ───────── */
    let animId = 0;
    let time = 0;
    let last = performance.now();
    let lastShot = -1;
    const k = reduced ? 0.25 : 1;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05) * k;
      last = now;
      if (document.hidden) return;
      time += dt;
      const t = time;
      const tl = t % LOOP;

      /* island intro + float */
      const e = ease(t / 1.8);
      island.scale.setScalar(0.85 + 0.15 * e);
      island.position.y = Math.sin(t * 0.8) * 0.1;
      world.rotation.y = -0.1 + Math.sin(t * 0.25) * 0.05;

      /* imaarate zameen se ugti hain */
      risers.forEach((r) => {
        const kk = easeBack((t - r.delay) / 0.85);
        r.g.scale.set(1, Math.max(kk, 0.0001), 1);
      });

      /* director: current shot */
      let si = 0;
      for (let i = 0; i < shots.length; i++) if (tl >= shots[i].t0) si = i;
      const sh = shots[si];
      if (si !== lastShot) {
        lastShot = si;
        if (sh.cap) {
          setCaption(sh.cap);
          if (typeof onSceneUpdate === "function") {
            const chapterMatch = String(sh.cap[0]).match(/Step\s+(\d+)\s+of\s+(\d+)/i);
            onSceneUpdate({
              chapter: chapterMatch ? Number(chapterMatch[1]) : 11,
              totalChapters: chapterMatch ? Number(chapterMatch[2]) : 11,
              time: sh.cap[3],
              title: sh.cap[1],
              desc: sh.cap[2]
            });
          }
        }
      }
      const focusId = sh.focus;

      /* rooms: deewar neeche, chhat upar */
      for (const id in rooms) {
        const r = rooms[id];
        const target = focusId === id ? 0 : 1;
        r.o += (target - r.o) * Math.min(1, dt * 3.2);
        if (Math.abs(r.o - target) < 0.004) r.o = target;
        r.front.scale.y = Math.max(r.o, 0.0001);
        r.front.visible = r.o > 0.01;
        r.roof.position.y = FY + r.h + (1 - r.o) * 9;
        r.roof.visible = r.o > 0.01;
        r.light.intensity = (1 - r.o) * r.lightI;
      }
      // hostel: Aarav ke sote hi room ki light dim, chaand ki roshni
      rooms.hos.light.intensity *= 1 - 0.85 * sleepAmt;
      hosMoon.intensity = (1 - rooms.hos.o) * sleepAmt * 4;

      /* day → night */
      const nTarget = tl > marks.hosWalk && tl < LOOP - 0.6 ? 1 : 0;
      night += (nTarget - night) * Math.min(1, dt * 0.9);
      hemi.intensity = lerp(1.3, 0.45, night);
      keyLight.intensity = lerp(2.8, 0.8, night);
      fillLight.intensity = lerp(0.9, 0.45, night);
      renderer.toneMappingExposure = lerp(1.08, 0.95, night);
      moon.material.opacity = night * 0.85;

      /* labels */
      labels.forEach((l) => {
        const kk = ease((t - l.delay) / 0.6);
        const sc = Math.max(kk, 0.0001);
        l.s.scale.set(l.w * sc, l.h * sc, 1);
        l.s.position.y = l.baseY + Math.sin(t * 1.3 + l.ph) * 0.06;
        const op = l.room ? l.room.o : 1;
        l.s.material.opacity = op;
        l.s.visible = op > 0.02;
      });

      /* ball, hero, actors */
      updateBall(t);
      updateHero(tl, t, dt);
      anims.forEach((fn) => fn(t, dt, tl));
      actors.forEach((a) => {
        a.fn(t, tl, dt);
        const sc = ease((t - a.delay) / 0.5) * a.rig.scale;
        a.rig.g.scale.setScalar(Math.max(sc, 0.0001));
      });

      /* confetti */
      const cu = (tl - marks.cheer) / 4.5;
      confetti.forEach((c) => {
        if (cu < 0 || cu > 1) {
          c.s.material.opacity = 0;
          return;
        }
        c.s.position.set(COURT.x + c.vx * cu, GY + 0.9 + c.vy * cu - 2.8 * cu * cu, COURT.z + c.vz * cu);
        c.s.material.opacity = Math.min(1, (1 - cu) * 1.6);
      });

      /* crystals + rocks */
      crystals.forEach((c) => {
        c.c.rotation.y = t * 0.5 + c.ph;
      });
      rocks.forEach((r) => {
        r.m.position.y += Math.sin(t * 0.9 + r.ph) * 0.0025;
        r.m.rotation.y = t * 0.3 + r.ph;
        r.m.rotation.x = t * 0.2;
      });

      /* ring + orbs */
      ringGroup.rotation.y = t * 0.12;
      orbs.forEach((o) => {
        const a = t * 0.45 + o.off;
        o.s.position.set(Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0);
        o.s.material.opacity = 0.8 + Math.sin(t * 3 + o.off) * 0.2;
      });

      /* glows */
      winLitMat.emissiveIntensity = (1.3 + Math.sin(t * 1.2) * 0.2) * (1 + night * 0.5);
      lampMat.emissiveIntensity = (1.8 + Math.sin(t * 2) * 0.25) * (1 + night * 0.5);
      warm.intensity = lerp(8, 4, night) + Math.sin(t * 1.4);
      backGlow.material.opacity = 0.3 + Math.sin(t * 0.7) * 0.04 - night * 0.12;
      glowRing.material.opacity = 0.75 + Math.sin(t * 1.6) * 0.15;
      lamps.forEach((l, i) => {
        l.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08);
      });

      /* sky */
      starMat.opacity = 0.65 + Math.sin(t * 1.5) * 0.2 + night * 0.15;
      clouds.forEach((c) => {
        c.sp.position.x += c.v * dt;
        if (c.sp.position.x > 34) c.sp.position.x = -34;
      });
      const mp = moteGeo.attributes.position;
      for (let i = 0; i < moteCount; i++) {
        let y = mp.getY(i) + moteSeed[i] * dt;
        if (y > 9) y = -7;
        mp.setY(i, y);
      }
      mp.needsUpdate = true;

      /* camera director */
      if (!reduced) {
        const s = 1 - Math.exp(-dt * 3.2);
        cMX += (tMX - cMX) * s;
        cMY += (tMY - cMY) * s;
      }
      let ttx = sh.target[0];
      let tty = sh.target[1];
      let ttz = sh.target[2];
      if (sh.follow) {
        ttx = H.x;
        tty = GY + 0.8;
        ttz = H.z;
      }
      if (!cam.init) {
        cam.tx = ttx; cam.ty = tty; cam.tz = ttz;
        cam.w = sh.w; cam.h = sh.h; cam.az = sh.az; cam.el = sh.el;
        cam.init = true;
      }
      const cs = 1 - Math.exp(-dt * (sh.follow ? 2.6 : 2.0));
      cam.tx += (ttx - cam.tx) * cs;
      cam.ty += (tty - cam.ty) * cs;
      cam.tz += (ttz - cam.tz) * cs;
      cam.w += (sh.w - cam.w) * cs;
      cam.h += (sh.h - cam.h) * cs;
      cam.az += (sh.az - cam.az) * cs;
      cam.el += (sh.el - cam.el) * cs;

      const intro = 1 + (1 - e) * 0.3 + Math.sin(t * 0.2) * 0.012;
      const dist = Math.max(cam.w / (2 * TH * aspect), cam.h / (2 * TH)) * intro;
      const az = cam.az + cMX * 0.1;
      const el = cam.el + cMY * 0.05;
      island.updateMatrixWorld(true);
      tmpV.set(cam.tx, cam.ty, cam.tz);
      world.localToWorld(tmpV);
      camera.position.set(
        tmpV.x + dist * Math.sin(az) * Math.cos(el),
        tmpV.y + dist * Math.sin(el),
        tmpV.z + dist * Math.cos(az) * Math.cos(el)
      );
      camera.lookAt(tmpV);

      if (barRef.current) barRef.current.style.width = `${(tl / LOOP) * 100}%`;

      renderer.render(scene, camera);
    };
    animate();

    /* ───────── cleanup ───────── */
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(capTimer);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", handleResize);

      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);

  const small = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <div className={`campus-3d-viewport ${className}`} ref={containerRef} aria-hidden="true">
      <canvas ref={canvasRef} className="campus-3d-canvas" />
      <div className="campus-3d-vignette" />
      <div className="campus-3d-glow" />
      <div ref={capRef} style={small ? capBoxSmall : capBox}>
        <div ref={capStepRef} style={capStep} />
        <div ref={capTitleRef} style={capTitle} />
        <div ref={capTextRef} style={capText} />
        <div style={capTrack}>
          <div ref={barRef} style={capFill} />
        </div>
      </div>
    </div>
  );
}