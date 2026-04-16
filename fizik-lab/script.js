const STORAGE_KEY = "fizik-lab-state-v1";

const toolCatalog = {
  optics: [
    { type: "laser", label: "Lazer", description: "Tek bir isik kaynagi ekler." },
    { type: "mirror", label: "Ayna", description: "Duze yansima yapan optik yuzey." },
    { type: "lens", label: "Mercek", description: "Isini odaga dogru yeniden yonlendirir." }
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

  return {
    scene: raw.scene === "mechanics" ? "mechanics" : "optics",
    opticsVisible: raw.opticsVisible !== false,
    running: false,
    notice: typeof raw.notice === "string" ? raw.notice : "",
    optics: { items: Array.isArray(raw.optics?.items) ? raw.optics.items : [] },
    mechanics: { items: Array.isArray(raw.mechanics?.items) ? raw.mechanics.items : [] }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentItems() {
  return state[state.scene].items;
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

function forceEnd(item) {
  return { x: item.x + item.dx, y: item.y + item.dy };
}

function makeItem(type) {
  const offset = currentItems().length * 28;

  if (type === "laser") {
    return { id: uid("laser"), type, x: 120 + offset, y: 280, angle: -8 };
  }

  if (type === "mirror") {
    return { id: uid("mirror"), type, x: 420 + offset, y: 250, angle: -35, length: 140 };
  }

  if (type === "lens") {
    return { id: uid("lens"), type, x: 700, y: 300, height: 190, focalLength: 140 };
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
  }

  if (item.type === "mirror") {
    item.x = clamp(Number(item.x) || 0, 30, width - 30);
    item.y = clamp(Number(item.y) || 0, 30, height - 30);
    item.angle = clamp(Number(item.angle) || 0, -180, 180);
    item.length = clamp(Number(item.length) || 140, 60, 240);
  }

  if (item.type === "lens") {
    item.x = clamp(Number(item.x) || 0, 60, width - 60);
    item.height = clamp(Number(item.height) || 180, 80, 300);
    item.focalLength = clamp(Number(item.focalLength) || 120, 40, 260);
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
  if (item.type === "mirror") return "Ayna";
  if (item.type === "lens") return "Mercek";
  if (item.type === "block") return "Cisim";
  return "Kuvvet oku";
}

function itemMeta(item) {
  if (item.type === "laser") return `${Math.round(item.angle)} derece aci`;
  if (item.type === "mirror") return `${Math.round(item.angle)} derece • ${Math.round(item.length)} px`;
  if (item.type === "lens") return `${Math.round(item.focalLength)} px odak uzakligi`;
  if (item.type === "block") return `${item.mass} kg • hiz ${item.vx.toFixed(1)}, ${item.vy.toFixed(1)}`;
  return `${Math.round(Math.hypot(item.dx, item.dy))} N yaklasik kuvvet`;
}

function renderToolGrid() {
  const grid = document.getElementById("tool-grid");
  grid.innerHTML = toolCatalog[state.scene]
    .map(
      (tool) => `
        <button class="tool-card" type="button" data-add="${tool.type}">
          <strong>${tool.label}</strong>
          <small>${tool.description}</small>
        </button>
      `
    )
    .join("");
}

function renderLegend() {
  const legend = document.getElementById("legend");

  if (state.scene === "optics") {
    legend.innerHTML = `
      <span class="legend-chip laser">Lazer izi</span>
      <span class="legend-chip mirror">Ayna yuzeyi</span>
      <span class="legend-chip lens">Mercek odagi</span>
    `;
    return;
  }

  legend.innerHTML = `
    <span class="legend-chip block">Hareketli cisim</span>
    <span class="legend-chip force">Kuvvet vektoru</span>
    <span class="legend-chip">Secili nesne</span>
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
  }

  if (item.type === "mirror") {
    fields.push(numberField("Aci", "angle", item.angle, -180, 180, 1));
    fields.push(numberField("Uzunluk", "length", item.length, 60, 240, 1));
  }

  if (item.type === "lens") {
    fields.push(numberField("Yukseklik", "height", item.height, 80, 300, 1));
    fields.push(numberField("Odak", "focalLength", item.focalLength, 40, 260, 1));
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

function closestOpticsHit(origin, direction) {
  let closest = null;

  currentItems().forEach((item) => {
    if (item.type === "mirror") {
      const endpoints = mirrorEndpoints(item);
      const hit = raySegmentIntersection(origin, direction, endpoints.start, endpoints.end);

      if (hit && (!closest || hit.t < closest.t)) {
        closest = {
          t: hit.t,
          item,
          point: hit.point,
          nextDirection: reflect(direction, endpoints)
        };
      }
    }

    if (item.type === "lens" && Math.abs(direction.x) > 0.0001) {
      const t = (item.x - origin.x) / direction.x;
      if (t <= 0.01) return;

      const hitY = origin.y + direction.y * t;
      const top = item.y - item.height / 2;
      const bottom = item.y + item.height / 2;

      if (hitY >= top && hitY <= bottom && (!closest || t < closest.t)) {
        const focus = {
          x: item.x + (direction.x >= 0 ? item.focalLength : -item.focalLength),
          y: item.y
        };

        closest = {
          t,
          item,
          point: { x: item.x, y: hitY },
          nextDirection:
            Math.abs(hitY - item.y) < 8
              ? direction
              : normalizeVector({ x: focus.x - item.x, y: focus.y - hitY })
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
    let origin = { x: laser.x, y: laser.y };
    let direction = normalizeVector({
      x: Math.cos(degToRad(laser.angle)),
      y: Math.sin(degToRad(laser.angle))
    });

    for (let step = 0; step < 12; step += 1) {
      const hit = closestOpticsHit(origin, direction);

      if (!hit) {
        segments.push({ from: { ...origin }, to: extendRayToBounds(origin, direction), kind: "free" });
        break;
      }

      segments.push({ from: { ...origin }, to: { ...hit.point }, kind: hit.item.type });
      interactions += 1;
      origin = {
        x: hit.point.x + hit.nextDirection.x * 0.8,
        y: hit.point.y + hit.nextDirection.y * 0.8
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

function drawOptics(trace) {
  currentItems().forEach((item) => {
    const isSelected = item.id === selectedId;

    if (item.type === "laser") {
      const beamEnd = {
        x: item.x + Math.cos(degToRad(item.angle)) * 28,
        y: item.y + Math.sin(degToRad(item.angle)) * 28
      };

      ctx.fillStyle = isSelected ? "#ff7d7d" : "#ff6b6b";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
      ctx.fill();
      drawArrow({ x: item.x, y: item.y }, beamEnd, "#ffe8e8", 2);
    }

    if (item.type === "mirror") {
      const endpoints = mirrorEndpoints(item);
      ctx.strokeStyle = isSelected ? "#ffe08a" : "#ffb454";
      ctx.lineWidth = isSelected ? 8 : 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(endpoints.start.x, endpoints.start.y);
      ctx.lineTo(endpoints.end.x, endpoints.end.y);
      ctx.stroke();
    }

    if (item.type === "lens") {
      ctx.strokeStyle = isSelected ? "#8fc3ff" : "#6ea8fe";
      ctx.lineWidth = isSelected ? 8 : 6;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - item.height / 2);
      ctx.lineTo(item.x, item.y + item.height / 2);
      ctx.stroke();

      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "rgba(110, 168, 254, 0.42)";
      ctx.beginPath();
      ctx.moveTo(item.x - item.focalLength, item.y - 24);
      ctx.lineTo(item.x - item.focalLength, item.y + 24);
      ctx.moveTo(item.x + item.focalLength, item.y - 24);
      ctx.lineTo(item.x + item.focalLength, item.y + 24);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  ctx.save();
  ctx.shadowColor = "rgba(255, 107, 107, 0.6)";
  ctx.shadowBlur = 14;
  trace.segments.forEach((segment) => {
    ctx.strokeStyle = segment.kind === "lens" ? "#ffb454" : "#ff6b6b";
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

  if (state.scene === "optics") {
    primary.textContent = `${items.length} nesne`;
    secondary.textContent = state.opticsVisible ? `${trace.interactions} etkilesim` : "Isin gizli";
    tertiary.textContent = items.some((item) => item.type === "laser")
      ? `${trace.segments.length} isik parcasi izlendi`
      : "Lazer kaynagi bekleniyor";
    sceneState.textContent = state.opticsVisible ? "Isin gosteriliyor" : "Hazir";
    return;
  }

  const blocks = items.filter((item) => item.type === "block");
  const forces = items.filter((item) => item.type === "force");
  const block = selectedItem()?.type === "block" ? selectedItem() : blocks[0];
  const mechanics = block ? mechanicsForces(block) : null;

  primary.textContent = `${blocks.length} cisim, ${forces.length} kuvvet`;
  secondary.textContent = state.running ? "Hareket ediyor" : "Beklemede";
  tertiary.textContent = mechanics ? `${Math.round(mechanics.magnitude)} N net kuvvet` : "Cisim sec";
  sceneState.textContent = state.running ? "Simulasyon acik" : "Hazir";
}

function renderScene() {
  resizeCanvas();
  currentItems().forEach((item) => constrainItem(item));
  drawBackground();

  if (state.scene === "optics") {
    const trace = buildOpticsTrace();
    drawOptics(trace);
    renderSummaries(trace);
  } else {
    drawMechanics();
    renderSummaries();
  }
}

function renderUI() {
  ensureSelection();
  renderToolGrid();
  renderLegend();
  renderInspector();
  renderObjectList();
  renderScene();

  document.querySelectorAll("[data-scene-button]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sceneButton === state.scene);
  });

  document.getElementById("scene-label").textContent = `Aktif modul: ${state.scene === "optics" ? "Optik" : "Mekanik"}`;
  document.getElementById("empty-note").style.display = currentItems().length ? "none" : "block";
  document.getElementById("status-text").textContent =
    state.notice ||
    (state.scene === "optics"
      ? "Lazer, ayna ve mercek ekleyip isigin yolunu incele."
      : "Cisim ve kuvvet oku ekleyip net kuvvetin harekete etkisini izle.");

  document.getElementById("run-scene-button").textContent =
    state.scene === "optics" ? "Isin yolunu hesapla" : "Simulasyonu calistir";
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
  state[state.scene].items = [];
  selectedId = null;
  state.notice = "Sahne temizlendi. Yeni duzenek kurabilirsin.";
  saveState();
  renderUI();
}

function loadSample() {
  state.running = false;
  lastTick = 0;

  if (state.scene === "optics") {
    state.optics.items = [
      { id: uid("laser"), type: "laser", x: 120, y: 350, angle: -12 },
      { id: uid("mirror"), type: "mirror", x: 440, y: 260, angle: -42, length: 160 },
      { id: uid("lens"), type: "lens", x: 720, y: 250, height: 200, focalLength: 150 }
    ];
    selectedId = state.optics.items[0].id;
    state.opticsVisible = true;
    state.notice = "Ornek optik duzenek yuklendi.";
  } else {
    state.mechanics.items = [
      { id: uid("block"), type: "block", x: 360, y: 330, width: 96, height: 54, mass: 4, vx: 0, vy: 0 },
      { id: uid("force"), type: "force", x: 346, y: 320, dx: 120, dy: -16 },
      { id: uid("force"), type: "force", x: 340, y: 340, dx: 0, dy: 86 }
    ];
    selectedId = state.mechanics.items[0].id;
    state.notice = "Ornek mekanik duzenek yuklendi.";
  }

  saveState();
  renderUI();
}

function setScene(scene) {
  if (scene === state.scene) return;

  state.scene = scene;
  state.running = false;
  lastTick = 0;
  state.notice = scene === "optics" ? "Optik sahne aktif." : "Mekanik sahne aktif.";
  ensureSelection();
  saveState();
  renderUI();
}

function runScene() {
  if (state.scene === "optics") {
    state.opticsVisible = true;
    state.notice = "Isin yolu hesaplandi ve cizildi.";
    saveState();
    renderUI();
    return;
  }

  if (!currentItems().some((item) => item.type === "block")) {
    state.notice = "Mekanik simulasyon icin once bir cisim ekle.";
    renderUI();
    return;
  }

  state.running = true;
  lastTick = 0;
  state.notice = "Mekanik simulasyon basladi.";
  saveState();
  renderUI();

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(runMechanicsLoop);
  }
}

function pauseScene() {
  if (state.scene === "optics") {
    state.opticsVisible = false;
    state.notice = "Isin izi gizlendi.";
  } else {
    state.running = false;
    lastTick = 0;
    state.notice = "Mekanik simulasyon duraklatildi.";
  }

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

    if (item.type === "mirror") {
      const endpoints = mirrorEndpoints(item);
      return distanceToSegment(point, endpoints.start, endpoints.end) <= 12;
    }

    if (item.type === "lens") {
      return (
        Math.abs(point.x - item.x) <= 12 &&
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

    if (hit && !(state.scene === "mechanics" && state.running)) {
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

  document.querySelectorAll("[data-scene-button]").forEach((button) => {
    button.addEventListener("click", () => setScene(button.dataset.sceneButton));
  });

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

    item[input.dataset.prop] = Number(input.value);
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
