const STORAGE_KEY = "fizik-lab-state-v1";

const toolCatalog = {
  optics: [
    { type: "laser", label: "Lazer", description: "Tek bir isik kaynagi ekler." },
    { type: "optical-object", label: "Cisim", description: "Goruntusu olusan ok seklinde cisim ekler." },
    { type: "round-object", label: "Yuvarlak Cisim", description: "Goz ve aynada kullanilabilen yuvarlak cisim ekler." },
    { type: "eye", label: "Goz", description: "Aynada ve ortamda gorulen noktayi izleyen goz ekler." },
    { type: "depth-tank", label: "Gorunur Derinlik", description: "Iki ortamdaki cismin gorunur derinligini gosterir." },
    { type: "fiber", label: "Fiber Optik", description: "Tam yansima ile isigi ileten fiber kablo ekler." },
    { type: "prism", label: "Prizma", description: "Kirilan ve ayrisan isigi gosterir." },
    { type: "plane-mirror", label: "Duz Ayna", description: "Standart dogrusal yansima yapar." },
    { type: "concave-mirror", label: "Cukur Ayna", description: "Isini odaga toplayan icbukey ayna." },
    { type: "convex-mirror", label: "Tumsek Ayna", description: "Isini dagitan disbukey ayna." },
    { type: "convex-lens", label: "Ince Kenarli Mercek", description: "Ortasi kalin, isigi odaga toplar." },
    { type: "concave-lens", label: "Kalin Kenarli Mercek", description: "Ortasi ince, isigi dagitir." }
  ],
  mechanics: [
    { type: "block", label: "Cisim", description: "Kuvvet uygulanabilen hareketli blok." },
    { type: "force", label: "Kuvvet Oku", description: "Bir cisme etki eden kuvvet vektoru." }
  ]
};

const defaultState = {
  scene: "optics",
  opticsVisible: true,
  running: false,
  notice: "",
  optics: { items: [] },
  mechanics: { items: [] }
};

const canvas = document.getElementById("lab-canvas");
const ctx = canvas.getContext("2d");
const viewport = { width: 960, height: 600 };

const LASER_COLORS = {
  red: { label: "Kirmizi", hex: "#ff5f56", bend: 0.94 },
  orange: { label: "Turuncu", hex: "#ff9f43", bend: 0.97 },
  yellow: { label: "Sari", hex: "#ffd93d", bend: 1 },
  green: { label: "Yesil", hex: "#40d67b", bend: 1.03 },
  blue: { label: "Mavi", hex: "#5da9ff", bend: 1.07 },
  violet: { label: "Mor", hex: "#b26bff", bend: 1.11 }
};

let state = loadState();
let selectedId = null;
let dragState = null;
let animationFrame = null;
let lastTick = 0;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(raw);
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") {
    return structuredClone(defaultState);
  }

  const normalizeItems = (items) =>
    items.map((item) => {
      if (item.type === "mirror") {
        return { ...item, type: "plane-mirror" };
      }

      if (item.type === "lens") {
        return { ...item, type: "convex-lens" };
      }

      return item;
    });

  return {
    scene: "optics",
    opticsVisible: raw.opticsVisible !== false,
    running: false,
    notice: typeof raw.notice === "string" ? raw.notice : "",
    optics: { items: Array.isArray(raw.optics?.items) ? normalizeItems(raw.optics.items) : [] },
    mechanics: { items: [] }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentItems() {
  return state.optics.items;
}

function selectedItem() {
  return currentItems().find((item) => item.id === selectedId) || null;
}

function ensureSelection() {
  if (!selectedItem()) {
    selectedId = currentItems()[0]?.id || null;
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function laserColorData(mode, colorKey = "red") {
  if (mode !== "single") {
    return { label: "Beyaz", hex: "#ffffff", bend: 1 };
  }

  return LASER_COLORS[colorKey] || LASER_COLORS.red;
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function distanceToSegment(point, start, end) {
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const lengthSquared = vx * vx + vy * vy;

  if (!lengthSquared) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = clamp(((point.x - start.x) * vx + (point.y - start.y) * vy) / lengthSquared, 0, 1);
  const projection = { x: start.x + vx * t, y: start.y + vy * t };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function pointInsideBlock(point, block, padding = 0) {
  return (
    point.x >= block.x - block.width / 2 - padding &&
    point.x <= block.x + block.width / 2 + padding &&
    point.y >= block.y - block.height / 2 - padding &&
    point.y <= block.y + block.height / 2 + padding
  );
}

function mirrorEndpoints(item) {
  const angle = degToRad(item.angle);
  const half = item.length / 2;
  return {
    start: { x: item.x - Math.cos(angle) * half, y: item.y - Math.sin(angle) * half },
    end: { x: item.x + Math.cos(angle) * half, y: item.y + Math.sin(angle) * half }
  };
}

function rotateLocalPoint(point, angle) {
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle)
  };
}

function toLocal(point, item) {
  const angle = degToRad(item.angle || 0);
  return rotateLocalPoint({ x: point.x - item.x, y: point.y - item.y }, -angle);
}

function fromLocal(point, item) {
  const angle = degToRad(item.angle || 0);
  const rotated = rotateLocalPoint(point, angle);
  return { x: item.x + rotated.x, y: item.y + rotated.y };
}

function mirrorProfileX(item, y) {
  if (item.type === "plane-mirror") {
    return 0;
  }

  const radius = item.radius || 170;
  const limitedY = clamp(y, -item.length / 2 + 0.01, item.length / 2 - 0.01);
  const sagitta = radius - Math.sqrt(Math.max(radius * radius - limitedY * limitedY, 0));

  if (item.type === "concave-mirror") {
    return -sagitta;
  }

  return sagitta;
}

function mirrorPolyline(item, steps = 28) {
  if (item.type === "plane-mirror") {
    const endpoints = mirrorEndpoints(item);
    return [endpoints.start, endpoints.end];
  }

  const angle = degToRad(item.angle);
  const points = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const localY = -item.length / 2 + item.length * t;
    const localX = mirrorProfileX(item, localY);
    const rotated = rotateLocalPoint({ x: localX, y: localY }, angle);
    points.push({ x: item.x + rotated.x, y: item.y + rotated.y });
  }

  return points;
}

function lensHalfWidth(item, localY) {
  const progress = 1 - Math.abs(localY) / (item.height / 2);

  if (item.type === "convex-lens") {
    return item.edgeWidth / 2 + progress * item.bulge;
  }

  return item.edgeWidth / 2 + (1 - progress) * item.bulge;
}

function isMirror(item) {
  return item.type === "plane-mirror" || item.type === "concave-mirror" || item.type === "convex-mirror";
}

function isLens(item) {
  return item.type === "convex-lens" || item.type === "concave-lens";
}

function isDepthTank(item) {
  return item.type === "depth-tank";
}

function isEye(item) {
  return item.type === "eye";
}

function isRoundObject(item) {
  return item.type === "round-object";
}

function isFiber(item) {
  return item.type === "fiber";
}

function isPrism(item) {
  return item.type === "prism";
}

function prismVertices(item) {
  const half = item.size / 2;
  return [
    fromLocal({ x: -half, y: half * 0.86 }, item),
    fromLocal({ x: 0, y: -half }, item),
    fromLocal({ x: half, y: half * 0.86 }, item)
  ];
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index];
    const b = polygon[previous];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 0.0001) + a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function depthTankBounds(item) {
  return {
    left: item.x - item.width / 2,
    right: item.x + item.width / 2,
    top: item.y - item.height / 2,
    bottom: item.y + item.height / 2,
    interfaceY: item.y - item.height / 2 + item.interfaceLevel
  };
}

function fiberBounds(item) {
  return {
    left: item.x - item.length / 2,
    right: item.x + item.length / 2,
    top: item.y - item.height / 2,
    bottom: item.y + item.height / 2
  };
}

function forceEnd(item) {
  return { x: item.x + item.dx, y: item.y + item.dy };
}

function opticAxis(item) {
  const length = Math.max(viewport.width, viewport.height) * 1.2;
  return {
    start: fromLocal({ x: -length / 2, y: 0 }, item),
    end: fromLocal({ x: length / 2, y: 0 }, item)
  };
}

function principalPoint(item) {
  return { x: item.x, y: item.y };
}

function focusPoints(item) {
  if (isLens(item)) {
    return [
      { label: "F", point: fromLocal({ x: item.focalLength, y: 0 }, item) },
      { label: "F", point: fromLocal({ x: -item.focalLength, y: 0 }, item) }
    ];
  }

  if (!isMirror(item) || item.type === "plane-mirror") {
    return [];
  }

  const focalLength = -item.radius / 2;
  return [{ label: "F", point: fromLocal({ x: focalLength, y: 0 }, item) }];
}

function centerPoints(item) {
  if (isLens(item)) {
    return [{ label: "O", point: principalPoint(item) }];
  }

  if (!isMirror(item)) {
    return [];
  }

  if (item.type === "plane-mirror") {
    return [{ label: "V", point: principalPoint(item) }];
  }

  const radius = -item.radius;
  return [
    { label: "V", point: principalPoint(item) },
    { label: "C", point: fromLocal({ x: radius, y: 0 }, item) }
  ];
}

function imageForElement(item, objectItem) {
  if (!objectItem || (objectItem.type !== "optical-object" && objectItem.type !== "round-object")) {
    return null;
  }

  const local = toLocal({ x: objectItem.x, y: objectItem.y }, item);
  const doValue = -local.x;
  const size = objectItem.type === "round-object" ? objectItem.radius : objectItem.height;

  if (doValue <= 1) {
    return null;
  }

  if (isLens(item)) {
    const f = item.focalLength;
    const denominator = (1 / f) - (1 / doValue);
    if (Math.abs(denominator) < 0.00001) {
      return null;
    }

    const di = 1 / denominator;
    const magnification = -di / doValue;
    return {
      point: fromLocal({ x: di, y: local.y * magnification }, item),
      height: size * magnification,
      virtual: di < 0
    };
  }

  if (isMirror(item)) {
    if (item.type === "plane-mirror") {
      return {
        point: fromLocal({ x: local.x * -1, y: local.y }, item),
        height: size,
        virtual: true
      };
    }

    const f = item.type === "concave-mirror" ? item.radius / 2 : -item.radius / 2;
    const denominator = (1 / f) - (1 / doValue);
    if (Math.abs(denominator) < 0.00001) {
      return null;
    }

    const di = 1 / denominator;
    const magnification = -di / doValue;
    return {
      point: fromLocal({ x: -di, y: local.y * magnification }, item),
      height: size * magnification,
      virtual: di < 0
    };
  }

  return null;
}

function makeItem(type) {
  const offset = currentItems().length * 28;

  if (type === "laser") {
    return { id: uid("laser"), type, x: 120 + offset, y: 280, angle: 0, colorMode: "white", color: "red" };
  }

  if (type === "optical-object") {
    return { id: uid("object"), type, x: 250 + offset, y: 300, height: 120 };
  }

  if (type === "round-object") {
    return { id: uid("round"), type, x: 240 + offset, y: 300, radius: 20 };
  }

  if (type === "eye") {
    return { id: uid("eye"), type, x: 150 + offset, y: 220, angle: 0 };
  }

  if (type === "depth-tank") {
    return {
      id: uid("tank"),
      type,
      x: 320 + offset,
      y: 320,
      width: 220,
      height: 220,
      interfaceLevel: 90,
      topIndex: 1,
      bottomIndex: 1.33
    };
  }

  if (type === "fiber") {
    return {
      id: uid("fiber"),
      type,
      x: 540 + offset,
      y: 220,
      length: 240,
      height: 58,
      bounces: 5
    };
  }

  if (type === "prism") {
    return { id: uid("prism"), type, x: 700, y: 240, angle: 0, size: 130, dispersion: 18, index: 1.52 };
  }

  if (type === "plane-mirror") {
    return { id: uid("mirror"), type, x: 420 + offset, y: 250, angle: 90, length: 140, radius: 0 };
  }

  if (type === "concave-mirror" || type === "convex-mirror") {
    return { id: uid("mirror"), type, x: 440 + offset, y: 250, angle: 0, length: 150, radius: 180 };
  }

  if (type === "convex-lens") {
    return { id: uid("lens"), type, x: 700, y: 300, height: 190, focalLength: 140, edgeWidth: 16, bulge: 24 };
  }

  if (type === "concave-lens") {
    return { id: uid("lens"), type, x: 700, y: 300, height: 190, focalLength: -120, edgeWidth: 18, bulge: 26 };
  }

  if (type === "block") {
    return {
      id: uid("block"),
      type,
      x: 340 + offset,
      y: 320,
      width: 92,
      height: 52,
      mass: 4,
      vx: 0,
      vy: 0
    };
  }

  return {
    id: uid("force"),
    type,
    x: 260 + offset,
    y: 280,
    dx: 96,
    dy: -24
  };
}

function constrainItem(item) {
  const width = viewport.width;
  const height = viewport.height;

  if (item.type === "laser") {
    item.x = clamp(Number(item.x) || 0, 20, width - 20);
    item.y = clamp(Number(item.y) || 0, 20, height - 20);
    item.angle = clamp(Number(item.angle) || 0, -180, 180);
    item.colorMode = item.colorMode === "single" ? "single" : "white";
    item.color = LASER_COLORS[item.color] ? item.color : "red";
  }

  if (item.type === "optical-object") {
    item.x = clamp(Number(item.x) || 0, 40, width - 40);
    item.y = clamp(Number(item.y) || 0, 60, height - 40);
    item.height = clamp(Number(item.height) || 120, 50, 220);
  }

  if (isRoundObject(item)) {
    item.x = clamp(Number(item.x) || 0, 30, width - 30);
    item.y = clamp(Number(item.y) || 0, 30, height - 30);
    item.radius = clamp(Number(item.radius) || 20, 10, 40);
  }

  if (isEye(item)) {
    item.x = clamp(Number(item.x) || 0, 26, width - 26);
    item.y = clamp(Number(item.y) || 0, 26, height - 26);
    item.angle = clamp(Number(item.angle) || 0, -180, 180);
  }

  if (isDepthTank(item)) {
    item.x = clamp(Number(item.x) || 0, 80, width - 80);
    item.y = clamp(Number(item.y) || 0, 80, height - 80);
    item.width = clamp(Number(item.width) || 220, 140, 340);
    item.height = clamp(Number(item.height) || 220, 140, 320);
    item.interfaceLevel = clamp(Number(item.interfaceLevel) || 90, 40, item.height - 40);
    item.topIndex = clamp(Number(item.topIndex) || 1, 1, 2);
    item.bottomIndex = clamp(Number(item.bottomIndex) || 1.33, 1, 2.4);
  }

  if (isFiber(item)) {
    item.x = clamp(Number(item.x) || 0, 100, width - 100);
    item.y = clamp(Number(item.y) || 0, 40, height - 40);
    item.length = clamp(Number(item.length) || 240, 120, 360);
    item.height = clamp(Number(item.height) || 58, 26, 120);
    item.bounces = clamp(Math.round(Number(item.bounces) || 5), 2, 10);
  }

  if (isPrism(item)) {
    item.x = clamp(Number(item.x) || 0, 80, width - 80);
    item.y = clamp(Number(item.y) || 0, 80, height - 80);
    item.angle = clamp(Number(item.angle) || 0, -180, 180);
    item.size = clamp(Number(item.size) || 130, 70, 180);
    item.dispersion = clamp(Number(item.dispersion) || 18, 6, 36);
    item.index = clamp(Number(item.index) || 1.52, 1.1, 2.2);
  }

  if (isMirror(item)) {
    item.x = clamp(Number(item.x) || 0, 30, width - 30);
    item.y = clamp(Number(item.y) || 0, 30, height - 30);
    item.angle = clamp(Number(item.angle) || 0, -180, 180);
    item.length = clamp(Number(item.length) || 140, 60, 240);
    item.radius = item.type === "plane-mirror" ? 0 : clamp(Number(item.radius) || 180, 90, 320);
  }

  if (isLens(item)) {
    item.x = clamp(Number(item.x) || 0, 60, width - 60);
    item.height = clamp(Number(item.height) || 180, 80, 300);
    item.focalLength =
      item.type === "concave-lens"
        ? clamp(Number(item.focalLength) || -120, -260, -40)
        : clamp(Number(item.focalLength) || 120, 40, 260);
    item.edgeWidth = clamp(Number(item.edgeWidth) || 16, 10, 34);
    item.bulge = clamp(Number(item.bulge) || 24, 10, 44);
    item.y = clamp(Number(item.y) || 0, item.height / 2 + 16, height - item.height / 2 - 16);
  }

  if (item.type === "block") {
    item.width = clamp(Number(item.width) || 92, 60, 150);
    item.height = clamp(Number(item.height) || 52, 36, 110);
    item.mass = clamp(Number(item.mass) || 4, 1, 20);
    item.vx = clamp(Number(item.vx) || 0, -22, 22);
    item.vy = clamp(Number(item.vy) || 0, -22, 22);
    item.x = clamp(Number(item.x) || 0, item.width / 2, width - item.width / 2);
    item.y = clamp(Number(item.y) || 0, item.height / 2, height - item.height / 2 - 26);
  }

  if (item.type === "force") {
    item.x = clamp(Number(item.x) || 0, 20, width - 20);
    item.y = clamp(Number(item.y) || 0, 20, height - 20);
    item.dx = clamp(Number(item.dx) || 0, -220, 220);
    item.dy = clamp(Number(item.dy) || 0, -220, 220);
  }
}

function itemTitle(item) {
  if (item.type === "laser") return "Lazer kaynagi";
  if (item.type === "optical-object") return "Optik cisim";
  if (item.type === "round-object") return "Yuvarlak cisim";
  if (item.type === "eye") return "Goz";
  if (item.type === "depth-tank") return "Gorunur derinlik kabi";
  if (item.type === "fiber") return "Fiber optik kablo";
  if (item.type === "prism") return "Prizma";
  if (item.type === "plane-mirror") return "Duz ayna";
  if (item.type === "concave-mirror") return "Cukur ayna";
  if (item.type === "convex-mirror") return "Tumsek ayna";
  if (item.type === "convex-lens") return "Ince kenarli mercek";
  if (item.type === "concave-lens") return "Kalin kenarli mercek";
  if (item.type === "block") return "Cisim";
  return "Kuvvet oku";
}

function itemMeta(item) {
  if (item.type === "laser") {
    const color = laserColorData(item.colorMode, item.color);
    return `${Math.round(item.angle)} derece • ${color.label} isik`;
  }
  if (item.type === "optical-object") return `${Math.round(item.height)} px boy`;
  if (item.type === "round-object") return `${Math.round(item.radius)} px yaricap`;
  if (item.type === "eye") return `${Math.round(item.angle)} derece bakis`;
  if (item.type === "depth-tank") {
    return `n1 ${item.topIndex.toFixed(2)} • n2 ${item.bottomIndex.toFixed(2)} • ${Math.round(item.height)} px`;
  }
  if (item.type === "fiber") return `${Math.round(item.length)} px • ${item.bounces} ic yansima`;
  if (item.type === "prism") {
    return `${Math.round(item.size)} px • dagilim ${Math.round(item.dispersion)} derece • n ${item.index.toFixed(2)}`;
  }
  if (isMirror(item)) {
    const radiusText = item.type === "plane-mirror" ? "duz yuzey" : `R ${Math.round(item.radius)}`;
    return `${Math.round(item.angle)} derece • ${Math.round(item.length)} px • ${radiusText}`;
  }

  if (isLens(item)) {
    return `${Math.round(item.focalLength)} px odak • yukseklik ${Math.round(item.height)} px`;
  }

  if (item.type === "block") return `${item.mass} kg • hiz ${item.vx.toFixed(1)}, ${item.vy.toFixed(1)}`;
  return `${Math.round(Math.hypot(item.dx, item.dy))} N yaklasik kuvvet`;
}

function toolGlyph(type) {
  const glyphs = {
    laser: '<span class="tool-glyph laser"><span></span></span>',
    "optical-object": '<span class="tool-glyph optical-object"><span></span></span>',
    "round-object": '<span class="tool-glyph round-object"><span></span></span>',
    eye: '<span class="tool-glyph eye"><span></span></span>',
    "depth-tank": '<span class="tool-glyph depth-tank"><span></span></span>',
    fiber: '<span class="tool-glyph fiber"><span></span></span>',
    prism: '<span class="tool-glyph prism"><span></span></span>',
    "plane-mirror": '<span class="tool-glyph plane-mirror"><span></span></span>',
    "concave-mirror": '<span class="tool-glyph concave-mirror"><span></span></span>',
    "convex-mirror": '<span class="tool-glyph convex-mirror"><span></span></span>',
    "convex-lens": '<span class="tool-glyph convex-lens"><span></span></span>',
    "concave-lens": '<span class="tool-glyph concave-lens"><span></span></span>',
    block: '<span class="tool-glyph block"><span></span></span>',
    force: '<span class="tool-glyph force"><span></span></span>'
  };

  return glyphs[type] || '<span class="tool-glyph"><span></span></span>';
}

function renderToolGrid() {
  const grid = document.getElementById("tool-grid");
  grid.innerHTML = toolCatalog[state.scene]
    .map(
      (tool) => `
        <button class="tool-card" type="button" data-add="${tool.type}">
          ${toolGlyph(tool.type)}
          <strong>${tool.label}</strong>
          <small>${tool.description}</small>
        </button>
      `
    )
    .join("");
}

function renderLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = `
    <span class="legend-chip laser">Beyaz isik</span>
    <span class="legend-chip mirror">Duz ve egrisel aynalar</span>
    <span class="legend-chip lens">Gercek gorunumlu mercek</span>
    <span class="legend-chip block">Cisim, goz ve goruntu</span>
    <span class="legend-chip force">Prizma, fiber ve iki ortam</span>
  `;
}

function numberField(label, prop, value, min, max, step, full = false) {
  const digits = step < 1 ? 1 : 0;

  return `
    <div class="field ${full ? "full" : ""}">
      <label>${label}</label>
      <input
        data-prop="${prop}"
        type="number"
        value="${Number(value).toFixed(digits)}"
        min="${min}"
        max="${max}"
        step="${step}"
      />
    </div>
  `;
}

function selectField(label, prop, value, options, full = false) {
  return `
    <div class="field ${full ? "full" : ""}">
      <label>${label}</label>
      <select data-prop="${prop}">
        ${options
          .map((option) => `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`)
          .join("")}
      </select>
    </div>
  `;
}

function renderInspector() {
  const inspector = document.getElementById("inspector");
  const item = selectedItem();

  if (!item) {
    inspector.innerHTML = `
      <div class="inspector-note">
        Sahne uzerinden bir nesne secildiginde burada o nesnenin sayisal
        degerlerini degistirebilirsin.
      </div>
    `;
    return;
  }

  const fields = [
    numberField("Konum X", "x", item.x, 0, viewport.width, 1),
    numberField("Konum Y", "y", item.y, 0, viewport.height, 1)
  ];

  if (item.type === "laser") {
    fields.push(numberField("Aci", "angle", item.angle, -180, 180, 1, true));
    fields.push(
      selectField(
        "Isik Turu",
        "colorMode",
        item.colorMode,
        [
          { value: "white", label: "Beyaz" },
          { value: "single", label: "Tek renk" }
        ],
        true
      )
    );
    if (item.colorMode === "single") {
      fields.push(
        selectField(
          "Renk",
          "color",
          item.color,
          Object.entries(LASER_COLORS).map(([value, data]) => ({ value, label: data.label })),
          true
        )
      );
    }
  }

  if (item.type === "optical-object") {
    fields.push(numberField("Boy", "height", item.height, 50, 220, 1, true));
  }

  if (isRoundObject(item)) {
    fields.push(numberField("Yaricap", "radius", item.radius, 10, 40, 1, true));
  }

  if (isEye(item)) {
    fields.push(numberField("Bakis Acisi", "angle", item.angle, -180, 180, 1, true));
  }

  if (isDepthTank(item)) {
    fields.push(numberField("Genislik", "width", item.width, 140, 340, 1));
    fields.push(numberField("Yukseklik", "height", item.height, 140, 320, 1));
    fields.push(numberField("Ara Yuzey", "interfaceLevel", item.interfaceLevel, 40, item.height - 40, 1));
    fields.push(numberField("Ust Ortam n", "topIndex", item.topIndex, 1, 2, 0.01));
    fields.push(numberField("Alt Ortam n", "bottomIndex", item.bottomIndex, 1, 2.4, 0.01));
  }

  if (isFiber(item)) {
    fields.push(numberField("Uzunluk", "length", item.length, 120, 360, 1));
    fields.push(numberField("Cap", "height", item.height, 26, 120, 1));
    fields.push(numberField("Yansima", "bounces", item.bounces, 2, 10, 1));
  }

  if (isPrism(item)) {
    fields.push(numberField("Aci", "angle", item.angle, -180, 180, 1));
    fields.push(numberField("Boyut", "size", item.size, 70, 180, 1));
    fields.push(numberField("Dagilim", "dispersion", item.dispersion, 6, 36, 1));
    fields.push(numberField("Kiricilik", "index", item.index || 1.52, 1.1, 2.2, 0.01));
  }

  if (isMirror(item)) {
    fields.push(numberField("Aci", "angle", item.angle, -180, 180, 1));
    fields.push(numberField("Uzunluk", "length", item.length, 60, 240, 1));
    if (item.type !== "plane-mirror") {
      fields.push(numberField("Egrilik Yaricapi", "radius", item.radius, 90, 320, 1));
    }
  }

  if (isLens(item)) {
    fields.push(numberField("Yukseklik", "height", item.height, 80, 300, 1));
    fields.push(
      numberField(
        "Odak",
        "focalLength",
        item.focalLength,
        item.type === "concave-lens" ? -260 : 40,
        item.type === "concave-lens" ? -40 : 260,
        1
      )
    );
    fields.push(numberField("Kenar Kalinligi", "edgeWidth", item.edgeWidth, 10, 34, 1));
    fields.push(numberField("Govis Bombesi", "bulge", item.bulge, 10, 44, 1));
  }

  if (item.type === "block") {
    fields.push(numberField("Kutle", "mass", item.mass, 1, 20, 1));
    fields.push(numberField("Hiz X", "vx", item.vx, -22, 22, 0.1));
    fields.push(numberField("Hiz Y", "vy", item.vy, -22, 22, 0.1));
  }

  if (item.type === "force") {
    fields.push(numberField("Kuvvet X", "dx", item.dx, -220, 220, 1));
    fields.push(numberField("Kuvvet Y", "dy", item.dy, -220, 220, 1));
  }

  inspector.innerHTML = `
    <div>
      <strong>${itemTitle(item)}</strong>
      <div class="inspector-note">${itemMeta(item)}</div>
    </div>
    <div class="inspector-grid">${fields.join("")}</div>
    <div class="inline-actions" style="margin-top: 14px;">
      ${item.type === "block" ? '<button class="secondary-button compact" type="button" data-action="reset-velocity">Hizi sifirla</button>' : ""}
      <button class="secondary-button compact" type="button" data-action="delete">Secili nesneyi sil</button>
    </div>
  `;
}

function renderObjectList() {
  const list = document.getElementById("object-list");
  const items = currentItems();

  if (!items.length) {
    list.innerHTML = `
      <div class="object-item">
        <strong>Henuz nesne yok</strong>
        <small>Arac kutusundan bir nesne secerek ilk duzenegi kurabilirsin.</small>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <button class="object-item ${item.id === selectedId ? "active" : ""}" type="button" data-select="${item.id}">
          <strong>${itemTitle(item)}</strong>
          <small>${itemMeta(item)}</small>
        </button>
      `
    )
    .join("");
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width || 960);
  const height = Math.round(rect.height || 600);
  const ratio = window.devicePixelRatio || 1;

  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }

  viewport.width = width;
  viewport.height = height;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawBackground() {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  for (let x = 0; x <= viewport.width; x += 40) {
    ctx.strokeStyle = x % 120 === 0 ? "rgba(159, 174, 203, 0.12)" : "rgba(159, 174, 203, 0.05)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewport.height);
    ctx.stroke();
  }

  for (let y = 0; y <= viewport.height; y += 40) {
    ctx.strokeStyle = y % 120 === 0 ? "rgba(159, 174, 203, 0.12)" : "rgba(159, 174, 203, 0.05)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewport.width, y);
    ctx.stroke();
  }
}

function raySegmentIntersection(origin, direction, start, end) {
  const segment = { x: end.x - start.x, y: end.y - start.y };
  const denominator = cross(direction, segment);

  if (Math.abs(denominator) < 0.0001) return null;

  const between = { x: start.x - origin.x, y: start.y - origin.y };
  const rayDistance = cross(between, segment) / denominator;
  const segmentDistance = cross(between, direction) / denominator;

  if (rayDistance <= 0.01 || segmentDistance < 0 || segmentDistance > 1) {
    return null;
  }

  return {
    t: rayDistance,
    point: {
      x: origin.x + direction.x * rayDistance,
      y: origin.y + direction.y * rayDistance
    }
  };
}

function extendRayToBounds(origin, direction) {
  const candidates = [];

  if (direction.x > 0) candidates.push((viewport.width - origin.x) / direction.x);
  if (direction.x < 0) candidates.push((0 - origin.x) / direction.x);
  if (direction.y > 0) candidates.push((viewport.height - origin.y) / direction.y);
  if (direction.y < 0) candidates.push((0 - origin.y) / direction.y);

  const distance = Math.min(...candidates.filter((value) => value > 0.01));

  return {
    x: origin.x + direction.x * distance,
    y: origin.y + direction.y * distance
  };
}

function reflect(direction, endpoints) {
  const surface = normalizeVector({
    x: endpoints.end.x - endpoints.start.x,
    y: endpoints.end.y - endpoints.start.y
  });

  let normal = { x: -surface.y, y: surface.x };
  if (dot(direction, normal) > 0) {
    normal = { x: -normal.x, y: -normal.y };
  }

  return normalizeVector({
    x: direction.x - 2 * dot(direction, normal) * normal.x,
    y: direction.y - 2 * dot(direction, normal) * normal.y
  });
}

function reflectFromTangent(direction, tangent) {
  const surface = normalizeVector(tangent);
  let normal = { x: -surface.y, y: surface.x };
  if (dot(direction, normal) > 0) {
    normal = { x: -normal.x, y: -normal.y };
  }

  return normalizeVector({
    x: direction.x - 2 * dot(direction, normal) * normal.x,
    y: direction.y - 2 * dot(direction, normal) * normal.y
  });
}

function apparentDepthForTank(tank, objectItem) {
  const bounds = depthTankBounds(tank);
  const insideX = objectItem.x >= bounds.left + 8 && objectItem.x <= bounds.right - 8;
  const inLowerMedium = objectItem.y >= bounds.interfaceY && objectItem.y <= bounds.bottom - 8;

  if (!insideX || !inLowerMedium) {
    return null;
  }

  const realDepth = objectItem.y - bounds.interfaceY;
  const apparentDepth = realDepth * (tank.topIndex / tank.bottomIndex);

  return {
    base: { x: objectItem.x, y: bounds.interfaceY + apparentDepth },
    realDepth,
    apparentDepth,
    interfaceY: bounds.interfaceY
  };
}

function apparentViewForEye(tank, eye, objectItem) {
  const bounds = depthTankBounds(tank);
  const eyeInside = eye.x >= bounds.left && eye.x <= bounds.right && eye.y <= bounds.interfaceY - 6;
  const objectInside = objectItem.x >= bounds.left && objectItem.x <= bounds.right && objectItem.y >= bounds.interfaceY + 6;

  if (!eyeInside || !objectInside) {
    return null;
  }

  const eyeDepth = bounds.interfaceY - eye.y;
  const realDepth = objectItem.y - bounds.interfaceY;
  const heightBias = clamp(1 - (eyeDepth / Math.max(eyeDepth + realDepth, 1)) * 0.35, 0.45, 1);
  const apparentDepth = realDepth * (tank.topIndex / tank.bottomIndex) * heightBias;
  const interfaceBias = eyeDepth / (eyeDepth + realDepth * (tank.topIndex / tank.bottomIndex) + 0.001);
  const interfaceX = eye.x + (objectItem.x - eye.x) * interfaceBias;
  const apparentX = eye.x + ((interfaceX - eye.x) * (eyeDepth + apparentDepth)) / Math.max(eyeDepth, 1);

  return {
    eye,
    interfacePoint: { x: interfaceX, y: bounds.interfaceY },
    apparentPoint: { x: apparentX, y: bounds.interfaceY + apparentDepth },
    realPoint: { x: objectItem.x, y: objectItem.y },
    apparentDepth,
    realDepth
  };
}

function planeMirrorViewForEye(mirror, eye, objectItem) {
  if (mirror.type !== "plane-mirror") {
    return null;
  }

  const eyeLocal = toLocal(eye, mirror);
  const objectLocal = toLocal(objectItem, mirror);

  if (eyeLocal.x >= -4 || objectLocal.x >= -4) {
    return null;
  }

  const imageLocal = { x: -objectLocal.x, y: objectLocal.y };
  const ratio = -eyeLocal.x / (imageLocal.x - eyeLocal.x);
  const hitY = eyeLocal.y + (imageLocal.y - eyeLocal.y) * ratio;

  if (ratio <= 0 || ratio >= 1 || Math.abs(hitY) > mirror.length / 2) {
    return null;
  }

  const imagePoint = fromLocal(imageLocal, mirror);
  const hitPoint = fromLocal({ x: 0, y: hitY }, mirror);
  const viewVector = { x: hitPoint.x - eye.x, y: hitPoint.y - eye.y };
  const viewDistance = Math.hypot(viewVector.x, viewVector.y);
  const forward = { x: Math.cos(degToRad(eye.angle || 0)), y: Math.sin(degToRad(eye.angle || 0)) };
  const facing = Math.acos(clamp(dot(normalizeVector(viewVector), forward), -1, 1)) * (180 / Math.PI);

  if (viewDistance > 340 || facing > 34) {
    return null;
  }

  return { imagePoint, hitPoint };
}

function buildFiberGuide(item, hitPoint, direction, beamColor) {
  const bounds = fiberBounds(item);
  const travelingRight = direction.x >= 0;
  const exitX = travelingRight ? bounds.right : bounds.left;
  const startX = hitPoint.x;
  const usableHeight = item.height / 2 - 6;
  const segments = [];
  let current = { x: startX, y: clamp(hitPoint.y, bounds.top + 6, bounds.bottom - 6) };
  let targetY = item.y - usableHeight;
  const stepX = (exitX - startX) / (item.bounces + 1);

  for (let bounce = 0; bounce < item.bounces; bounce += 1) {
    const next = { x: startX + stepX * (bounce + 1), y: targetY };
    segments.push({ from: { ...current }, to: next, kind: "fiber", color: beamColor || "#6ee7ff" });
    current = next;
    targetY = targetY < item.y ? item.y + usableHeight : item.y - usableHeight;
  }

  const exitPoint = { x: exitX, y: item.y };
  segments.push({ from: { ...current }, to: exitPoint, kind: "fiber", color: beamColor || "#6ee7ff" });
  return { segments, exitPoint, nextDirection: normalizeVector({ x: travelingRight ? 1 : -1, y: 0 }) };
}

function buildPrismDispersion(item, entryPoint, direction, laser) {
  const vertices = prismVertices(item);
  const edges = [
    [vertices[0], vertices[1]],
    [vertices[1], vertices[2]],
    [vertices[2], vertices[0]]
  ];

  let exitHit = null;
  edges.forEach(([start, end]) => {
    const hit = raySegmentIntersection(
      { x: entryPoint.x + direction.x * 1.2, y: entryPoint.y + direction.y * 1.2 },
      direction,
      start,
      end
    );

    if (hit && (!exitHit || hit.t < exitHit.t)) {
      exitHit = hit;
    }
  });

  const criticalAngle = Math.asin(1 / Math.max(item.index || 1.52, 1.0001));
  const localDirection = rotateLocalPoint(direction, -degToRad(item.angle));
  const incidenceAngle = Math.abs(Math.atan2(localDirection.y, localDirection.x));
  const totalInternalReflection = incidenceAngle > criticalAngle * 0.92;
  const reflectionPoint = fromLocal({ x: item.size * 0.05, y: -item.size * 0.08 }, item);
  const exitPoint = totalInternalReflection
    ? fromLocal({ x: item.size * 0.18, y: item.size * 0.34 }, item)
    : exitHit?.point || fromLocal({ x: item.size / 2, y: item.size * 0.12 }, item);
  const centerDirection = totalInternalReflection
    ? normalizeVector(rotateLocalPoint({ x: 0.9, y: 0.55 }, degToRad(item.angle)))
    : normalizeVector(rotateLocalPoint({ x: 1, y: 0.22 }, degToRad(item.angle)));
  const spread = item.dispersion / 180 * Math.PI;
  const monochrome = laser?.colorMode === "single";
  const monoColor = laserColorData(laser?.colorMode, laser?.color);
  const colors = monochrome
    ? [monoColor.hex]
    : ["#ff3b30", "#ff7a00", "#ffd60a", "#34c759", "#32ade6", "#5856d6", "#bf5af2"];
  const outgoing = colors.map((color, index) => {
    const bendFactor = monochrome ? monoColor.bend : 1;
    const delta = (index - (colors.length - 1) / 2) * (spread / 3) * bendFactor;
    const rayDir = normalizeVector(rotateLocalPoint(centerDirection, delta));
    return {
      from: exitPoint,
      to: {
        x: exitPoint.x + rayDir.x * 170,
        y: exitPoint.y + rayDir.y * 170
      },
      kind: "prism",
      color
    };
  });

  return {
    insideSegments: totalInternalReflection
      ? [
          { from: entryPoint, to: reflectionPoint, kind: "prism", color: monochrome ? monoColor.hex : "#ffffff" },
          { from: reflectionPoint, to: exitPoint, kind: "prism", color: monochrome ? monoColor.hex : "#f3f0ff" }
        ]
      : [{ from: entryPoint, to: exitPoint, kind: "prism", color: monochrome ? monoColor.hex : "#ffffff" }],
    outgoing,
    totalInternalReflection,
    criticalAngle
  };
}

function closestOpticsHit(origin, direction, laser) {
  let closest = null;

  currentItems().forEach((item) => {
    if (isFiber(item) && Math.abs(direction.x) > 0.0001) {
      const bounds = fiberBounds(item);
      const faceX = direction.x >= 0 ? bounds.left : bounds.right;
      const t = (faceX - origin.x) / direction.x;

      if (t > 0.01) {
        const hitY = origin.y + direction.y * t;
        if (hitY >= bounds.top && hitY <= bounds.bottom && (!closest || t < closest.t)) {
          const guide = buildFiberGuide(item, { x: faceX, y: hitY }, direction, laserColorData(laser?.colorMode, laser?.color).hex);
          closest = {
            t,
            item,
            point: { x: faceX, y: hitY },
            nextDirection: guide.nextDirection,
            exitPoint: guide.exitPoint,
            extraSegments: guide.segments
          };
        }
      }
    }

    if (isPrism(item)) {
      const vertices = prismVertices(item);
      for (let index = 0; index < vertices.length; index += 1) {
        const start = vertices[index];
        const end = vertices[(index + 1) % vertices.length];
        const hit = raySegmentIntersection(origin, direction, start, end);

        if (hit && (!closest || hit.t < closest.t)) {
          const insideDirection = normalizeVector(rotateLocalPoint({ x: 1, y: 0.02 }, degToRad(item.angle)));
          const prismRays = buildPrismDispersion(item, hit.point, insideDirection, laser);
          closest = {
            t: hit.t,
            item,
            point: hit.point,
            nextDirection: insideDirection,
            stop: true,
            extraSegments: [...prismRays.insideSegments, ...prismRays.outgoing]
          };
        }
      }
    }

    if (isMirror(item)) {
      const points = mirrorPolyline(item);

      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        const hit = raySegmentIntersection(origin, direction, start, end);

        if (hit && (!closest || hit.t < closest.t)) {
          closest = {
            t: hit.t,
            item,
            point: hit.point,
            nextDirection: reflectFromTangent(direction, { x: end.x - start.x, y: end.y - start.y })
          };
        }
      }
    }

    if (isLens(item) && Math.abs(direction.x) > 0.0001) {
      const t = (item.x - origin.x) / direction.x;
      if (t <= 0.01) return;

      const hitY = origin.y + direction.y * t;
      const top = item.y - item.height / 2;
      const bottom = item.y + item.height / 2;

      if (hitY >= top && hitY <= bottom && (!closest || t < closest.t)) {
        const beam = laserColorData(laser?.colorMode, laser?.color);
        const adjustedFocus = item.focalLength * (laser?.colorMode === "single" ? beam.bend : 1);
        const focus = {
          x: item.x + (direction.x >= 0 ? adjustedFocus : -adjustedFocus),
          y: item.y
        };

        const nextDirection =
          item.type === "concave-lens"
            ? normalizeVector({ x: item.x - focus.x, y: hitY - item.y })
            : Math.abs(hitY - item.y) < 8
              ? direction
              : normalizeVector({ x: focus.x - item.x, y: focus.y - hitY });

        closest = {
          t,
          item,
          point: { x: item.x, y: hitY },
          nextDirection,
          beamColor: beam.hex
        };
      }
    }
  });

  return closest;
}

function buildOpticsTrace() {
  const lasers = currentItems().filter((item) => item.type === "laser");
  const segments = [];
  let interactions = 0;

  if (!state.opticsVisible || !lasers.length) {
    return { segments, interactions };
  }

  lasers.forEach((laser) => {
    const beam = laserColorData(laser.colorMode, laser.color);
    let origin = { x: laser.x, y: laser.y };
    let direction = normalizeVector({
      x: Math.cos(degToRad(laser.angle)),
      y: Math.sin(degToRad(laser.angle))
    });

    for (let step = 0; step < 12; step += 1) {
      const hit = closestOpticsHit(origin, direction, laser);

      if (!hit) {
        segments.push({ from: { ...origin }, to: extendRayToBounds(origin, direction), kind: "free", color: beam.hex });
        break;
      }

      segments.push({ from: { ...origin }, to: { ...hit.point }, kind: hit.item.type, color: hit.beamColor || beam.hex });
      if (Array.isArray(hit.extraSegments)) {
        segments.push(...hit.extraSegments);
      }
      interactions += 1;
      if (hit.stop) {
        break;
      }
      origin = {
        x: (hit.exitPoint?.x ?? hit.point.x) + hit.nextDirection.x * 0.8,
        y: (hit.exitPoint?.y ?? hit.point.y) + hit.nextDirection.y * 0.8
      };
      direction = hit.nextDirection;
    }
  });

  return { segments, interactions };
}

function drawArrow(start, end, color, width = 3) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const head = 12;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - head * Math.cos(angle - Math.PI / 6), end.y - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - head * Math.cos(angle + Math.PI / 6), end.y - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawVerticalObject(base, height, color, dashed = false) {
  const top = { x: base.x, y: base.y - height };
  ctx.save();
  if (dashed) {
    ctx.setLineDash([8, 6]);
  }
  drawArrow(base, top, color, dashed ? 2.5 : 3.5);
  ctx.restore();
}

function drawAxisAndMarkers(item) {
  const axis = opticAxis(item);

  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgba(198, 208, 228, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(axis.start.x, axis.start.y);
  ctx.lineTo(axis.end.x, axis.end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  [...focusPoints(item), ...centerPoints(item)].forEach((marker) => {
    ctx.fillStyle = marker.label === "F" ? "#ffd166" : "#b7dcff";
    ctx.beginPath();
    ctx.arc(marker.point.x, marker.point.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(239, 244, 255, 0.92)";
    ctx.font = "600 12px Space Grotesk";
    ctx.textAlign = "center";
    ctx.fillText(marker.label, marker.point.x, marker.point.y - 10);
  });

  ctx.restore();
}

function drawOptics(trace) {
  const drawEye = (item, isSelected) => {
    const spread = degToRad(18);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(degToRad(item.angle));
    ctx.fillStyle = isSelected ? "#fff1a6" : "#f7f1cf";
    ctx.strokeStyle = isSelected ? "#ffe082" : "#d9d4b4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(4, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 226, 130, 0.75)";
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(58, 0);
    ctx.moveTo(8, 0);
    ctx.lineTo(54 * Math.cos(-spread), 54 * Math.sin(-spread));
    ctx.moveTo(8, 0);
    ctx.lineTo(54 * Math.cos(spread), 54 * Math.sin(spread));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const drawRoundObject = (item, color, alpha = 1, dashed = false) => {
    ctx.save();
    if (dashed) {
      ctx.setLineDash([7, 5]);
    }
    ctx.fillStyle = color.replace("rgb", "rgba").includes("rgba") ? color : color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(239, 244, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawDepthTank = (item, isSelected) => {
    const bounds = depthTankBounds(item);
    const radius = 22;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bounds.left + radius, bounds.top);
    ctx.lineTo(bounds.right - radius, bounds.top);
    ctx.quadraticCurveTo(bounds.right, bounds.top, bounds.right, bounds.top + radius);
    ctx.lineTo(bounds.right, bounds.bottom - radius);
    ctx.quadraticCurveTo(bounds.right, bounds.bottom, bounds.right - radius, bounds.bottom);
    ctx.lineTo(bounds.left + radius, bounds.bottom);
    ctx.quadraticCurveTo(bounds.left, bounds.bottom, bounds.left, bounds.bottom - radius);
    ctx.lineTo(bounds.left, bounds.top + radius);
    ctx.quadraticCurveTo(bounds.left, bounds.top, bounds.left + radius, bounds.top);
    ctx.closePath();

    ctx.fillStyle = "rgba(209, 240, 255, 0.08)";
    ctx.strokeStyle = isSelected ? "#c8f0ff" : "rgba(200, 240, 255, 0.48)";
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(214, 233, 255, 0.1)";
    ctx.fillRect(bounds.left + 2, bounds.top + 2, item.width - 4, item.interfaceY - bounds.top - 2);
    ctx.fillStyle = "rgba(89, 179, 255, 0.18)";
    ctx.fillRect(bounds.left + 2, bounds.interfaceY, item.width - 4, bounds.bottom - bounds.interfaceY - 2);

    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = "rgba(229, 236, 255, 0.65)";
    ctx.beginPath();
    ctx.moveTo(bounds.left + 8, bounds.interfaceY);
    ctx.lineTo(bounds.right - 8, bounds.interfaceY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(239, 244, 255, 0.9)";
    ctx.font = "600 12px Space Grotesk";
    ctx.textAlign = "left";
    ctx.fillText(`n=${item.topIndex.toFixed(2)}`, bounds.left + 12, bounds.top + 22);
    ctx.fillText(`n=${item.bottomIndex.toFixed(2)}`, bounds.left + 12, bounds.interfaceY + 22);
    ctx.restore();
  };

  const drawFiber = (item, isSelected) => {
    const bounds = fiberBounds(item);
    const radius = item.height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bounds.left + radius, bounds.top);
    ctx.lineTo(bounds.right - radius, bounds.top);
    ctx.arc(bounds.right - radius, item.y, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(bounds.left + radius, bounds.bottom);
    ctx.arc(bounds.left + radius, item.y, radius, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(126, 231, 255, 0.18)";
    ctx.strokeStyle = isSelected ? "#c4fbff" : "#78ebff";
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(bounds.left + 8, item.y);
    ctx.lineTo(bounds.right - 8, item.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawPrism = (item, isSelected) => {
    const vertices = prismVertices(item);
    ctx.save();
    ctx.beginPath();
    vertices.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    const gradient = ctx.createLinearGradient(vertices[0].x, vertices[0].y, vertices[2].x, vertices[2].y);
    gradient.addColorStop(0, "rgba(179, 169, 255, 0.14)");
    gradient.addColorStop(0.5, "rgba(220, 235, 255, 0.2)");
    gradient.addColorStop(1, "rgba(132, 225, 255, 0.14)");
    ctx.fillStyle = gradient;
    ctx.strokeStyle = isSelected ? "#f4ecff" : "rgba(212, 224, 255, 0.88)";
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.fill();
    ctx.stroke();

    const criticalAngle = Math.asin(1 / Math.max(item.index || 1.52, 1.0001)) * (180 / Math.PI);
    ctx.fillStyle = "rgba(239, 244, 255, 0.92)";
    ctx.font = "600 12px Space Grotesk";
    ctx.textAlign = "center";
    ctx.fillText(`sinir ${criticalAngle.toFixed(1)} derece`, item.x, item.y + item.size * 0.72);
    ctx.restore();
  };

  const drawLensBody = (item, isSelected) => {
    const top = item.y - item.height / 2;
    const bottom = item.y + item.height / 2;
    const mid = item.y;
    const leftTop = { x: item.x - item.edgeWidth / 2, y: top };
    const leftBottom = { x: item.x - item.edgeWidth / 2, y: bottom };
    const rightTop = { x: item.x + item.edgeWidth / 2, y: top };
    const rightBottom = { x: item.x + item.edgeWidth / 2, y: bottom };
    const bulge = item.bulge;

    ctx.beginPath();
    ctx.moveTo(leftTop.x, leftTop.y);

    if (item.type === "convex-lens") {
      ctx.bezierCurveTo(item.x - bulge, top + item.height * 0.22, item.x - bulge, bottom - item.height * 0.22, leftBottom.x, leftBottom.y);
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.bezierCurveTo(item.x + bulge, bottom - item.height * 0.22, item.x + bulge, top + item.height * 0.22, rightTop.x, rightTop.y);
    } else {
      ctx.bezierCurveTo(item.x + bulge * 0.4, top + item.height * 0.22, item.x + bulge * 0.4, bottom - item.height * 0.22, leftBottom.x, leftBottom.y);
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.bezierCurveTo(item.x - bulge * 0.4, bottom - item.height * 0.22, item.x - bulge * 0.4, top + item.height * 0.22, rightTop.x, rightTop.y);
    }

    ctx.closePath();
    ctx.fillStyle = isSelected ? "rgba(162, 218, 255, 0.34)" : "rgba(110, 168, 254, 0.22)";
    ctx.strokeStyle = isSelected ? "#b7dcff" : "#7eb7ff";
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(126, 183, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(item.x + item.focalLength, mid - 24);
    ctx.lineTo(item.x + item.focalLength, mid + 24);
    ctx.moveTo(item.x - item.focalLength, mid - 24);
    ctx.lineTo(item.x - item.focalLength, mid + 24);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawMirrorBody = (item, isSelected) => {
    const points = mirrorPolyline(item);

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = isSelected ? "#8b6440" : "#6f4d2f";
    ctx.lineWidth = item.type === "plane-mirror" ? 10 : 12;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });

    ctx.strokeStyle = isSelected ? "#c7efff" : "#a9e8ff";
    ctx.lineWidth = item.type === "plane-mirror" ? (isSelected ? 6 : 5) : (isSelected ? 7 : 6);
    ctx.lineCap = "round";
    ctx.stroke();

    if (item.type !== "plane-mirror") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1.75;
      ctx.stroke();
    }
  };

  const opticalObjects = currentItems().filter((item) => item.type === "optical-object");
  const roundObjects = currentItems().filter((item) => isRoundObject(item));
  const eyes = currentItems().filter((item) => isEye(item));

  currentItems().forEach((item) => {
    const isSelected = item.id === selectedId;

    if (item.type === "laser") {
      const beamColor = laserColorData(item.colorMode, item.color).hex;
      const beamEnd = {
        x: item.x + Math.cos(degToRad(item.angle)) * 28,
        y: item.y + Math.sin(degToRad(item.angle)) * 28
      };
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(degToRad(item.angle));
      ctx.fillStyle = isSelected ? "rgba(231, 239, 255, 0.96)" : "rgba(203, 214, 232, 0.92)";
      ctx.beginPath();
      ctx.roundRect(-18, -11, 28, 22, 8);
      ctx.fill();
      ctx.fillStyle = beamColor;
      ctx.beginPath();
      ctx.arc(10, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawArrow({ x: item.x + Math.cos(degToRad(item.angle)) * 6, y: item.y + Math.sin(degToRad(item.angle)) * 6 }, beamEnd, beamColor, 2);
    }

    if (item.type === "optical-object") {
      drawVerticalObject({ x: item.x, y: item.y }, item.height, isSelected ? "#8ef6d7" : "#7bd389");
      ctx.fillStyle = "rgba(123, 211, 137, 0.18)";
      ctx.fillRect(item.x - 12, item.y - 8, 24, 8);
    }

    if (isRoundObject(item)) {
      drawRoundObject(item, isSelected ? "rgba(142, 246, 215, 0.92)" : "rgba(123, 211, 137, 0.82)");
    }

    if (isEye(item)) {
      drawEye(item, isSelected);
    }

    if (isDepthTank(item)) {
      drawDepthTank(item, isSelected);
    }

    if (isFiber(item)) {
      drawFiber(item, isSelected);
    }

    if (isPrism(item)) {
      drawPrism(item, isSelected);
    }

    if (isMirror(item)) {
      drawAxisAndMarkers(item);
      drawMirrorBody(item, isSelected);
    }

    if (isLens(item)) {
      drawAxisAndMarkers(item);
      drawLensBody(item, isSelected);
    }
  });

  currentItems().forEach((item) => {
    if (!(isMirror(item) || isLens(item))) {
      return;
    }

    opticalObjects.forEach((objectItem) => {
      const image = imageForElement(item, objectItem);
      if (!image || !Number.isFinite(image.height)) {
        return;
      }

      drawVerticalObject(
        { x: image.point.x, y: image.point.y },
        image.height,
        image.virtual ? "rgba(255, 209, 102, 0.8)" : "rgba(255, 107, 107, 0.92)",
        image.virtual
      );
    });

    roundObjects.forEach((roundObject) => {
      const image = imageForElement(item, roundObject);
      if (!image || !Number.isFinite(image.height)) {
        return;
      }

      drawRoundObject(
        { x: image.point.x, y: image.point.y, radius: Math.max(Math.abs(image.height), 6) },
        image.virtual ? "rgba(255, 209, 102, 0.78)" : "rgba(255, 107, 107, 0.88)",
        0.9,
        image.virtual
      );
    });
  });

  currentItems().forEach((item) => {
    if (item.type !== "plane-mirror") {
      return;
    }

    eyes.forEach((eye) => {
      roundObjects.forEach((roundObject) => {
        const view = planeMirrorViewForEye(item, eye, roundObject);
        if (!view) {
          return;
        }

        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = "rgba(255, 241, 166, 0.75)";
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(view.hitPoint.x, view.hitPoint.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(view.hitPoint.x, view.hitPoint.y);
        ctx.lineTo(view.imagePoint.x, view.imagePoint.y);
        ctx.stroke();
        ctx.restore();

        drawRoundObject(
          { x: view.imagePoint.x, y: view.imagePoint.y, radius: roundObject.radius },
          "rgba(255, 209, 102, 0.78)",
          0.9,
          true
        );
      });
    });
  });

  currentItems().forEach((item) => {
    if (!isDepthTank(item)) {
      return;
    }

    opticalObjects.forEach((objectItem) => {
      const apparent = apparentDepthForTank(item, objectItem);
      if (!apparent) {
        return;
      }

      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.beginPath();
      ctx.moveTo(objectItem.x + 18, apparent.interfaceY);
      ctx.lineTo(objectItem.x + 18, objectItem.y);
      ctx.moveTo(objectItem.x - 18, apparent.interfaceY);
      ctx.lineTo(objectItem.x - 18, apparent.base.y);
      ctx.stroke();
      ctx.setLineDash([]);
      drawVerticalObject(apparent.base, objectItem.height, "rgba(255, 209, 102, 0.85)", true);
      ctx.fillStyle = "rgba(239, 244, 255, 0.88)";
      ctx.font = "600 12px Space Grotesk";
      ctx.textAlign = "left";
      ctx.fillText(`gercek ${Math.round(apparent.realDepth)} px`, objectItem.x + 24, objectItem.y - 10);
      ctx.fillText(`gorunur ${Math.round(apparent.apparentDepth)} px`, objectItem.x + 24, apparent.base.y - 10);
      ctx.restore();
    });
  });

  currentItems().forEach((item) => {
    if (!isDepthTank(item)) {
      return;
    }

    eyes.forEach((eye) => {
      roundObjects.forEach((roundObject) => {
        const view = apparentViewForEye(item, eye, roundObject);
        if (!view) {
          return;
        }

        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = "rgba(255, 241, 166, 0.82)";
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(view.interfacePoint.x, view.interfacePoint.y);
        ctx.lineTo(view.apparentPoint.x, view.apparentPoint.y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(255, 209, 102, 0.95)";
        ctx.beginPath();
        ctx.arc(view.apparentPoint.x, view.apparentPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(239, 244, 255, 0.88)";
        ctx.font = "600 12px Space Grotesk";
        ctx.textAlign = "left";
        ctx.fillText("gozun gordugu nokta", view.apparentPoint.x + 10, view.apparentPoint.y - 10);
      });
    });
  });

  ctx.save();
  ctx.shadowColor = "rgba(255, 107, 107, 0.6)";
  ctx.shadowBlur = 14;
  trace.segments.forEach((segment) => {
    ctx.strokeStyle =
      segment.color ||
      (segment.kind === "free" ? "#ffffff" : isLens(segment.kind ? { type: segment.kind } : {}) ? "#ffb454" : "#ff6b6b");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(segment.from.x, segment.from.y);
    ctx.lineTo(segment.to.x, segment.to.y);
    ctx.stroke();
  });
  ctx.restore();
}

function mechanicsForces(block) {
  const linked = currentItems().filter(
    (item) => item.type === "force" && pointInsideBlock({ x: item.x, y: item.y }, block, 14)
  );

  const total = linked.reduce(
    (sum, force) => ({ x: sum.x + force.dx, y: sum.y + force.dy }),
    { x: 0, y: 0 }
  );

  return { linked, total, magnitude: Math.hypot(total.x, total.y) };
}

function drawMechanics() {
  ctx.strokeStyle = "rgba(159, 174, 203, 0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, viewport.height - 26);
  ctx.lineTo(viewport.width, viewport.height - 26);
  ctx.stroke();

  currentItems().forEach((item) => {
    const isSelected = item.id === selectedId;

    if (item.type === "force") {
      drawArrow({ x: item.x, y: item.y }, forceEnd(item), isSelected ? "#ffd166" : "#ffb454", isSelected ? 4 : 3);
      ctx.fillStyle = "#ffb454";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (item.type === "block") {
      ctx.fillStyle = isSelected ? "#96f2d7" : "#7bd389";
      ctx.fillRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
      ctx.strokeStyle = isSelected ? "#4fd1c5" : "rgba(123, 211, 137, 0.6)";
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);

      ctx.fillStyle = "#082226";
      ctx.font = "bold 14px Space Grotesk";
      ctx.textAlign = "center";
      ctx.fillText(`${item.mass} kg`, item.x, item.y + 5);

      if (isSelected) {
        const mechanics = mechanicsForces(item);
        if (mechanics.magnitude > 1) {
          drawArrow(
            { x: item.x, y: item.y },
            { x: item.x + mechanics.total.x * 0.5, y: item.y + mechanics.total.y * 0.5 },
            "#ff6b6b",
            3
          );
        }
      }
    }
  });
}

function renderSummaries(trace = { segments: [], interactions: 0 }) {
  const items = currentItems();
  const primary = document.getElementById("summary-primary");
  const secondary = document.getElementById("summary-secondary");
  const tertiary = document.getElementById("summary-tertiary");
  const sceneState = document.getElementById("scene-state-chip");

  if (!items.length) {
    primary.textContent = "0 nesne";
    secondary.textContent = "Hazir";
    tertiary.textContent = "Bos calisma alani";
    sceneState.textContent = "Hazir";
    return;
  }

  primary.textContent = `${items.length} nesne`;
  secondary.textContent = state.opticsVisible ? `${trace.interactions} etkilesim` : "Isin gizli";
  tertiary.textContent = items.some((item) => item.type === "laser")
    ? `${trace.segments.length} isik parcasi izlendi`
    : "Lazer kaynagi bekleniyor";
  sceneState.textContent = state.opticsVisible ? "Isin gosteriliyor" : "Hazir";
}

function renderScene() {
  resizeCanvas();
  currentItems().forEach((item) => constrainItem(item));
  drawBackground();
  const trace = buildOpticsTrace();
  drawOptics(trace);
  renderSummaries(trace);
}

function renderUI() {
  ensureSelection();
  renderToolGrid();
  renderLegend();
  renderInspector();
  renderObjectList();
  renderScene();

  document.getElementById("scene-label").textContent = "Aktif modul: Optik";
  document.getElementById("empty-note").style.display = currentItems().length ? "none" : "block";
  document.getElementById("status-text").textContent =
    state.notice ||
    "Ayna, mercek, prizma, fiber ve iki ortam duzeneklerinde isigi ve goruntuyu incele.";
  document.getElementById("run-scene-button").textContent = "Isin yolunu hesapla";
}

function addItem(type) {
  const item = makeItem(type);
  currentItems().push(item);
  selectedId = item.id;
  state.notice = `${itemTitle(item)} sahneye eklendi.`;
  saveState();
  renderUI();
}

function clearScene() {
  state.running = false;
  lastTick = 0;
  state.optics.items = [];
  selectedId = null;
  state.notice = "Sahne temizlendi. Yeni duzenek kurabilirsin.";
  saveState();
  renderUI();
}

function loadSample() {
  state.running = false;
  lastTick = 0;
  state.optics.items = [
      { id: uid("laser"), type: "laser", x: 120, y: 350, angle: 0, colorMode: "white", color: "red" },
    { id: uid("object"), type: "optical-object", x: 260, y: 320, height: 110 },
    { id: uid("round"), type: "round-object", x: 220, y: 360, radius: 18 },
    { id: uid("eye"), type: "eye", x: 120, y: 210, angle: 0 },
    { id: uid("tank"), type: "depth-tank", x: 280, y: 320, width: 220, height: 220, interfaceLevel: 92, topIndex: 1, bottomIndex: 1.33 },
    { id: uid("fiber"), type: "fiber", x: 560, y: 185, length: 220, height: 54, bounces: 5 },
    { id: uid("prism"), type: "prism", x: 740, y: 230, angle: 0, size: 120, dispersion: 16, index: 1.52 },
    { id: uid("mirror"), type: "concave-mirror", x: 420, y: 260, angle: 0, length: 170, radius: 180 },
      { id: uid("mirror"), type: "plane-mirror", x: 610, y: 230, angle: 90, length: 150, radius: 0 },
    { id: uid("lens"), type: "convex-lens", x: 760, y: 260, height: 200, focalLength: 150, edgeWidth: 16, bulge: 24 }
  ];
  selectedId = state.optics.items[0].id;
  state.opticsVisible = true;
  state.notice = "Ornek optik duzenek yuklendi.";

  saveState();
  renderUI();
}

function setScene(scene) {
  state.scene = "optics";
}

function runScene() {
  state.opticsVisible = true;
  state.notice = "Isin yolu hesaplandi ve cizildi.";
  saveState();
  renderUI();
}

function pauseScene() {
  state.opticsVisible = false;
  state.notice = "Isin izi gizlendi.";
  saveState();
  renderUI();
}

function stepMechanics(timestamp) {
  if (!lastTick) {
    lastTick = timestamp;
  }

  const delta = Math.min((timestamp - lastTick) / 16.666, 2);
  lastTick = timestamp;

  currentItems().forEach((item) => {
    if (item.type !== "block") return;

    const mechanics = mechanicsForces(item);
    item.vx = (item.vx + (mechanics.total.x / (item.mass * 140)) * delta) * 0.995;
    item.vy = (item.vy + (mechanics.total.y / (item.mass * 140)) * delta) * 0.995;
    item.x += item.vx * delta * 4;
    item.y += item.vy * delta * 4;

    const halfWidth = item.width / 2;
    const halfHeight = item.height / 2;

    if (item.x < halfWidth) {
      item.x = halfWidth;
      item.vx *= -0.25;
    }

    if (item.x > viewport.width - halfWidth) {
      item.x = viewport.width - halfWidth;
      item.vx *= -0.25;
    }

    if (item.y < halfHeight) {
      item.y = halfHeight;
      item.vy *= -0.25;
    }

    if (item.y > viewport.height - halfHeight - 26) {
      item.y = viewport.height - halfHeight - 26;
      item.vy *= -0.3;
      item.vx *= 0.98;
    }
  });
}

function runMechanicsLoop(timestamp) {
  if (!(state.scene === "mechanics" && state.running)) {
    animationFrame = null;
    renderUI();
    return;
  }

  stepMechanics(timestamp);
  renderUI();
  animationFrame = requestAnimationFrame(runMechanicsLoop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * viewport.width,
    y: ((event.clientY - rect.top) / rect.height) * viewport.height
  };
}

function hitItem(point) {
  const items = [...currentItems()].reverse();

  return items.find((item) => {
    if (item.type === "laser") {
      return Math.hypot(point.x - item.x, point.y - item.y) <= 20;
    }

    if (item.type === "optical-object") {
      return Math.abs(point.x - item.x) <= 16 && point.y >= item.y - item.height - 12 && point.y <= item.y + 10;
    }

    if (isRoundObject(item)) {
      return Math.hypot(point.x - item.x, point.y - item.y) <= item.radius + 4;
    }

    if (isEye(item)) {
      return Math.hypot(point.x - item.x, point.y - item.y) <= 22;
    }

    if (isDepthTank(item)) {
      const bounds = depthTankBounds(item);
      return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
    }

    if (isFiber(item)) {
      const bounds = fiberBounds(item);
      return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
    }

    if (isPrism(item)) {
      return pointInPolygon(point, prismVertices(item));
    }

    if (isMirror(item)) {
      const points = mirrorPolyline(item);
      for (let index = 0; index < points.length - 1; index += 1) {
        if (distanceToSegment(point, points[index], points[index + 1]) <= 12) {
          return true;
        }
      }

      return false;
    }

    if (isLens(item)) {
      const localY = point.y - item.y;
      const halfWidth = lensHalfWidth(item, localY);
      return (
        Math.abs(point.x - item.x) <= halfWidth + 6 &&
        point.y >= item.y - item.height / 2 &&
        point.y <= item.y + item.height / 2
      );
    }

    if (item.type === "block") {
      return pointInsideBlock(point, item);
    }

    return (
      distanceToSegment(point, { x: item.x, y: item.y }, forceEnd(item)) <= 12 ||
      Math.hypot(point.x - item.x, point.y - item.y) <= 10
    );
  }) || null;
}

function initCanvasInteractions() {
  canvas.addEventListener("pointerdown", (event) => {
    const point = canvasPoint(event);
    const hit = hitItem(point);
    selectedId = hit?.id || null;

    if (hit) {
      dragState = {
        id: hit.id,
        offsetX: point.x - hit.x,
        offsetY: point.y - hit.y
      };
      canvas.setPointerCapture(event.pointerId);
    }

    state.notice = hit ? `${itemTitle(hit)} secildi.` : "Secim kaldirildi.";
    renderUI();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragState) return;

    const item = currentItems().find((entry) => entry.id === dragState.id);
    if (!item) return;

    const point = canvasPoint(event);
    item.x = point.x - dragState.offsetX;
    item.y = point.y - dragState.offsetY;
    constrainItem(item);
    renderUI();
  });

  const release = () => {
    if (!dragState) return;
    dragState = null;
    saveState();
  };

  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);
}

function initEvents() {
  window.addEventListener("resize", renderUI);
  initCanvasInteractions();

  document.getElementById("tool-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addItem(button.dataset.add);
  });

  document.getElementById("object-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-select]");
    if (!button) return;
    selectedId = button.dataset.select;
    state.notice = `${itemTitle(selectedItem())} secildi.`;
    renderUI();
  });

  document.getElementById("inspector").addEventListener("input", (event) => {
    const input = event.target.closest("[data-prop]");
    if (!input) return;

    const item = selectedItem();
    if (!item) return;

    item[input.dataset.prop] = input.tagName === "SELECT" ? input.value : Number(input.value);
    constrainItem(item);
    state.notice = `${itemTitle(item)} guncellendi.`;
    saveState();
    renderUI();
  });

  document.getElementById("inspector").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = selectedItem();
    if (!item) return;

    if (button.dataset.action === "delete") {
      state[state.scene].items = currentItems().filter((entry) => entry.id !== item.id);
      selectedId = null;
      state.notice = `${itemTitle(item)} silindi.`;
    }

    if (button.dataset.action === "reset-velocity") {
      item.vx = 0;
      item.vy = 0;
      state.notice = "Cismin hizi sifirlandi.";
    }

    saveState();
    renderUI();
  });

  document.getElementById("run-scene-button").addEventListener("click", runScene);
  document.getElementById("load-sample-button").addEventListener("click", loadSample);
  document.getElementById("clear-scene-button").addEventListener("click", clearScene);
  document.getElementById("pause-scene-button").addEventListener("click", pauseScene);
}

initEvents();
renderUI();
