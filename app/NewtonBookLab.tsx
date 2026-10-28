"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ExperimentId =
  | "resultant"
  | "inertia"
  | "friction"
  | "force-mass"
  | "reaction"
  | "momentum"
  | "cradle";

type Quality = "high" | "balanced";

type Experiment = {
  id: ExperimentId;
  number: string;
  law: string;
  title: string;
  shortTitle: string;
  prompt: string;
  description: string;
  primaryLabel: string;
  primaryUnit: string;
  primaryMin: number;
  primaryMax: number;
  primaryStep: number;
  primaryDefault: number;
  secondaryLabel: string;
  secondaryUnit: string;
  secondaryMin: number;
  secondaryMax: number;
  secondaryStep: number;
  secondaryDefault: number;
  predictions: string[];
  accent: string;
};

const EXPERIMENTS: Experiment[] = [
  {
    id: "resultant",
    number: "01",
    law: "KUVVETLERİN BİLEŞKESİ",
    title: "Halat hangi yöne gider?",
    shortTitle: "Bileşke kuvvet",
    prompt: "İki takım aynı büyüklükte kuvvet uygularsa ne olur?",
    description: "İki zıt kuvveti değiştir; ortadaki işaretçinin hareketini bileşke kuvvetle ilişkilendir.",
    primaryLabel: "Sol takım",
    primaryUnit: "N",
    primaryMin: 40,
    primaryMax: 140,
    primaryStep: 10,
    primaryDefault: 100,
    secondaryLabel: "Sağ takım",
    secondaryUnit: "N",
    secondaryMin: 40,
    secondaryMax: 140,
    secondaryStep: 10,
    secondaryDefault: 100,
    predictions: ["Sol takım", "Dengede kalır", "Sağ takım"],
    accent: "#67e8d0",
  },
  {
    id: "inertia",
    number: "02",
    law: "NEWTON’UN 1. YASASI",
    title: "Otobüs durur, yolcu neden ilerler?",
    shortTitle: "Eylemsizlik",
    prompt: "Fren süresi kısalınca yolcunun öne hareketi nasıl değişir?",
    description: "Otobüsün ilk hızını ve fren süresini belirle; yolcunun hareket durumunu koruma eğilimini gözle.",
    primaryLabel: "İlk hız",
    primaryUnit: "m/s",
    primaryMin: 2,
    primaryMax: 12,
    primaryStep: 1,
    primaryDefault: 8,
    secondaryLabel: "Fren süresi",
    secondaryUnit: "s",
    secondaryMin: 0.5,
    secondaryMax: 3,
    secondaryStep: 0.5,
    secondaryDefault: 1.5,
    predictions: ["Daha az ilerler", "Değişmez", "Daha çok ilerler"],
    accent: "#82c8ff",
  },
  {
    id: "friction",
    number: "03",
    law: "SÜRTÜNME KUVVETİ",
    title: "Aynı disk, iki farklı yüzey",
    shortTitle: "Sürtünme",
    prompt: "Yüzey pürüzlendikçe durma mesafesi nasıl değişir?",
    description: "Diski aynı hızla gönder; sürtünme katsayısını değiştirerek durma mesafesini karşılaştır.",
    primaryLabel: "İlk hız",
    primaryUnit: "m/s",
    primaryMin: 2,
    primaryMax: 10,
    primaryStep: 1,
    primaryDefault: 6,
    secondaryLabel: "Sürtünme katsayısı",
    secondaryUnit: "μ",
    secondaryMin: 0.1,
    secondaryMax: 0.8,
    secondaryStep: 0.1,
    secondaryDefault: 0.3,
    predictions: ["Artar", "Değişmez", "Azalır"],
    accent: "#ffc86a",
  },
  {
    id: "force-mass",
    number: "04",
    law: "NEWTON’UN 2. YASASI",
    title: "Kuvvet, kütle ve ivme",
    shortTitle: "F = m · a",
    prompt: "Aynı kuvvet daha büyük kütleye uygulanırsa ivme ne olur?",
    description: "Arabaya uygulanan kuvveti ve kütleyi değiştir; hız-zaman grafiğini deneyle birlikte izle.",
    primaryLabel: "Uygulanan kuvvet",
    primaryUnit: "N",
    primaryMin: 10,
    primaryMax: 100,
    primaryStep: 10,
    primaryDefault: 50,
    secondaryLabel: "Araba kütlesi",
    secondaryUnit: "kg",
    secondaryMin: 10,
    secondaryMax: 50,
    secondaryStep: 5,
    secondaryDefault: 25,
    predictions: ["İvme artar", "İvme değişmez", "İvme azalır"],
    accent: "#aa8cff",
  },
  {
    id: "reaction",
    number: "05",
    law: "NEWTON’UN 3. YASASI",
    title: "Balon roket nasıl ilerler?",
    shortTitle: "Etki · tepki",
    prompt: "Balondan çıkan hava arttıkça roketin ivmesi nasıl değişir?",
    description: "Hava çıkış kuvveti ile balonun kütlesini değiştir; zıt yönlü kuvvet çiftini üç boyutta gör.",
    primaryLabel: "Hava çıkış kuvveti",
    primaryUnit: "N",
    primaryMin: 2,
    primaryMax: 12,
    primaryStep: 1,
    primaryDefault: 7,
    secondaryLabel: "Balon kütlesi",
    secondaryUnit: "kg",
    secondaryMin: 0.2,
    secondaryMax: 1,
    secondaryStep: 0.1,
    secondaryDefault: 0.5,
    predictions: ["İvme artar", "İvme değişmez", "İvme azalır"],
    accent: "#ff8db5",
  },
  {
    id: "momentum",
    number: "06",
    law: "MOMENTUM · İTME",
    title: "Güvenli duruşun sırrı",
    shortTitle: "Çarpışma güvenliği",
    prompt: "Durma süresi uzadığında ortalama çarpışma kuvveti ne olur?",
    description: "Aracın hızını ve ezilme süresini ayarla; hava yastığı ile ezilme bölgesinin etkisini incele.",
    primaryLabel: "Araç hızı",
    primaryUnit: "m/s",
    primaryMin: 5,
    primaryMax: 25,
    primaryStep: 1,
    primaryDefault: 15,
    secondaryLabel: "Durma süresi",
    secondaryUnit: "s",
    secondaryMin: 0.1,
    secondaryMax: 1,
    secondaryStep: 0.1,
    secondaryDefault: 0.5,
    predictions: ["Kuvvet artar", "Kuvvet değişmez", "Kuvvet azalır"],
    accent: "#ff806f",
  },
  {
    id: "cradle",
    number: "07",
    law: "MOMENTUMUN KORUNUMU",
    title: "Newton beşiğinde aktarım",
    shortTitle: "Newton beşiği",
    prompt: "Bir yerine iki bilye bırakırsan karşı tarafta kaç bilye yükselir?",
    description: "Bırakılan bilye sayısını ve hızını değiştir; momentumun bilyeler boyunca aktarılmasını izle.",
    primaryLabel: "Bırakılan bilye",
    primaryUnit: "adet",
    primaryMin: 1,
    primaryMax: 3,
    primaryStep: 1,
    primaryDefault: 1,
    secondaryLabel: "Başlangıç hızı",
    secondaryUnit: "m/s",
    secondaryMin: 1,
    secondaryMax: 5,
    secondaryStep: 0.5,
    secondaryDefault: 3,
    predictions: ["Bir bilye", "Aynı sayıda bilye", "Tüm bilyeler"],
    accent: "#9ce4ff",
  },
];

type Parameters = Record<ExperimentId, { primary: number; secondary: number }>;

const DEFAULT_PARAMETERS = EXPERIMENTS.reduce((values, experiment) => {
  values[experiment.id] = {
    primary: experiment.primaryDefault,
    secondary: experiment.secondaryDefault,
  };
  return values;
}, {} as Parameters);

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const easeInOut = (value: number) =>
  value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;

function createTextSprite(text: string, color = "#eafcff", width = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 170;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(4, 18, 31, 0.88)";
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 30);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.font = "800 50px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.set(4.9, 0.82, 1);
  return sprite;
}

function glowMaterial(color: string, opacity = 0.95) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.7,
    roughness: 0.32,
    metalness: 0.12,
    transparent: opacity < 1,
    opacity,
  });
}

function addCylinderBetween(
  group: THREE.Group,
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 18),
    material,
  );
  cylinder.position.copy(from).add(to).multiplyScalar(0.5);
  cylinder.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  cylinder.castShadow = true;
  group.add(cylinder);
  return cylinder;
}

function addArrow(
  group: THREE.Group,
  from: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  color: string,
) {
  const arrow = new THREE.ArrowHelper(direction.clone().normalize(), from, length, color, 0.32, 0.18);
  const lineMaterials = Array.isArray(arrow.line.material) ? arrow.line.material : [arrow.line.material];
  lineMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.95;
  });
  group.add(arrow);
  return arrow;
}

function addPerson(group: THREE.Group, x: number, z: number, color: string, facing = 1) {
  const person = new THREE.Group();
  const material = glowMaterial(color, 0.9);
  const dark = new THREE.MeshStandardMaterial({ color: "#122535", roughness: 0.62 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 6, 12), material);
  body.position.y = 0.68;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 16), material);
  head.position.y = 1.18;
  const hip = new THREE.Vector3(0, 0.45, 0);
  addCylinderBetween(person, hip, new THREE.Vector3(-0.2, 0.05, 0), 0.055, dark);
  addCylinderBetween(person, hip, new THREE.Vector3(0.2, 0.05, 0), 0.055, dark);
  addCylinderBetween(person, new THREE.Vector3(0, 0.82, 0), new THREE.Vector3(0.34 * facing, 0.68, 0), 0.045, material);
  person.add(body, head);
  person.position.set(x, 0, z);
  person.rotation.z = -0.12 * facing;
  person.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });
  group.add(person);
  return person;
}

function addRunButton(group: THREE.Group, color: string) {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.54, 0.17, 42),
    new THREE.MeshStandardMaterial({ color: "#172b3b", metalness: 0.72, roughness: 0.22 }),
  );
  base.position.set(-3.65, 0.08, 1.78);
  base.userData.action = "run";
  base.castShadow = true;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.41, 0.16, 42), glowMaterial(color));
  cap.position.y = 0.14;
  cap.userData.action = "run";
  base.add(cap);
  group.add(base);
  const label = createTextSprite("DENEYİ BAŞLAT", color, 820);
  label.position.set(-3.65, 0.8, 1.78);
  label.scale.set(2.5, 0.48, 1);
  group.add(label);
  return cap;
}

type SceneProps = {
  experiment: Experiment;
  parameters: { primary: number; secondary: number };
  progress: number;
  running: boolean;
  quality: Quality;
  onRun: () => void;
};

function NewtonHologramScene({
  experiment,
  parameters,
  progress,
  running,
  quality,
  onRun,
}: SceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const parameterRef = useRef(parameters);
  const progressRef = useRef(progress);
  const runningRef = useRef(running);
  const runRef = useRef(onRun);

  useEffect(() => { parameterRef.current = parameters; }, [parameters]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { runRef.current = onRun; }, [onRun]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#06121d");
    scene.fog = new THREE.FogExp2("#06121d", 0.035);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(0, 6.8, 10.8);

    const renderer = new THREE.WebGLRenderer({ antialias: quality === "high", alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "high" ? 1.8 : 1.15));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("aria-label", `${experiment.title} üç boyutlu deney sahnesi`);
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.35, 0.2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 7.8;
    controls.maxDistance = 14;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 1.25;
    controls.minAzimuthAngle = -0.55;
    controls.maxAzimuthAngle = 0.55;

    scene.add(new THREE.HemisphereLight("#bfeaff", "#261c35", 1.45));
    const keyLight = new THREE.SpotLight("#fff2dc", 52, 35, 0.65, 0.4, 1.4);
    keyLight.position.set(-3, 9, 7);
    keyLight.target.position.set(0, 0, 0);
    keyLight.castShadow = quality === "high";
    keyLight.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
    scene.add(keyLight, keyLight.target);
    const rimLight = new THREE.PointLight(experiment.accent, 22, 18, 1.7);
    rimLight.position.set(4.2, 3.8, -2.4);
    scene.add(rimLight);

    const tableMaterial = new THREE.MeshStandardMaterial({ color: "#2b1b17", roughness: 0.72, metalness: 0.06 });
    const table = new THREE.Mesh(new THREE.CylinderGeometry(7.8, 8.2, 0.75, 64), tableMaterial);
    table.position.y = -1.12;
    table.receiveShadow = true;
    scene.add(table);
    const tableRing = new THREE.Mesh(
      new THREE.TorusGeometry(7.65, 0.035, 8, 120),
      new THREE.MeshBasicMaterial({ color: experiment.accent, transparent: true, opacity: 0.24 }),
    );
    tableRing.rotation.x = Math.PI / 2;
    tableRing.position.y = -0.72;
    scene.add(tableRing);

    const book = new THREE.Group();
    book.rotation.x = -0.04;
    scene.add(book);
    const coverMaterial = new THREE.MeshStandardMaterial({ color: "#251828", roughness: 0.58, metalness: 0.18 });
    const pageMaterial = new THREE.MeshStandardMaterial({ color: "#f0e7d2", roughness: 0.82, metalness: 0 });
    const pageEdge = new THREE.MeshStandardMaterial({ color: "#b9a98e", roughness: 0.9 });
    [-2.24, 2.24].forEach((x, index) => {
      const cover = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.18, 5.35), coverMaterial);
      cover.position.set(x, -0.42, 0);
      cover.rotation.z = index === 0 ? -0.025 : 0.025;
      cover.castShadow = true;
      cover.receiveShadow = true;
      book.add(cover);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.22, 5.12), pageMaterial);
      pages.position.set(x, -0.24, 0);
      pages.rotation.z = index === 0 ? -0.025 : 0.025;
      pages.castShadow = true;
      pages.receiveShadow = true;
      book.add(pages);
      for (let line = -2.2; line <= 2.2; line += 0.22) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(4.18, 0.006, 0.01), pageEdge);
        edge.position.set(x, -0.105, line);
        book.add(edge);
      }
    });
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 5.3, 24),
      new THREE.MeshStandardMaterial({ color: "#684960", roughness: 0.46, metalness: 0.18 }),
    );
    spine.rotation.x = Math.PI / 2;
    spine.position.set(0, -0.28, 0);
    book.add(spine);

    const stage = new THREE.Group();
    stage.position.y = 0.02;
    book.add(stage);
    const hologramBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.15, 3.45, 0.12, 72),
      new THREE.MeshStandardMaterial({
        color: "#0e2838",
        emissive: experiment.accent,
        emissiveIntensity: 0.18,
        metalness: 0.55,
        roughness: 0.24,
        transparent: true,
        opacity: 0.92,
      }),
    );
    hologramBase.scale.z = 0.56;
    hologramBase.position.set(1.55, 0.05, 0);
    hologramBase.receiveShadow = true;
    stage.add(hologramBase);
    const grid = new THREE.GridHelper(6.2, 20, experiment.accent, "#173246");
    grid.position.set(1.55, 0.13, 0);
    grid.scale.z = 0.58;
    if (Array.isArray(grid.material)) {
      grid.material.forEach((material) => { material.transparent = true; material.opacity = 0.3; });
    } else {
      grid.material.transparent = true;
      grid.material.opacity = 0.3;
    }
    stage.add(grid);

    const title = createTextSprite(`${experiment.number} · ${experiment.shortTitle}`, experiment.accent);
    title.position.set(1.55, 3.15, -1.55);
    stage.add(title);
    const runButton = addRunButton(stage, experiment.accent);

    const animated: ((value: number, time: number) => void)[] = [];
    const cyan = glowMaterial("#66e7d0", 0.92);
    const pink = glowMaterial("#ff88b1", 0.92);
    const steel = new THREE.MeshStandardMaterial({ color: "#8fa5b3", metalness: 0.74, roughness: 0.24 });
    const dark = new THREE.MeshStandardMaterial({ color: "#102333", roughness: 0.62, metalness: 0.22 });

    if (experiment.id === "resultant") {
      const rope = addCylinderBetween(stage, new THREE.Vector3(-1.5, 0.85, 0), new THREE.Vector3(4.7, 0.85, 0), 0.055, new THREE.MeshStandardMaterial({ color: "#c6aa77", roughness: 0.9 }));
      rope.castShadow = true;
      const marker = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 12, 32), glowMaterial("#ffffff"));
      marker.rotation.y = Math.PI / 2;
      marker.position.set(1.55, 0.85, 0);
      stage.add(marker);
      [-1.15, -0.55, 0.05].forEach((offset) => addPerson(stage, offset - 1.5, 0.04, "#66e7d0", -1));
      [3.05, 3.65, 4.25].forEach((x) => addPerson(stage, x, 0.04, "#ff88b1", 1));
      addArrow(stage, new THREE.Vector3(1.25, 1.55, 0), new THREE.Vector3(-1, 0, 0), 1.45, "#66e7d0");
      addArrow(stage, new THREE.Vector3(1.85, 1.55, 0), new THREE.Vector3(1, 0, 0), 1.45, "#ff88b1");
      animated.push((value) => {
        const net = parameterRef.current.primary - parameterRef.current.secondary;
        marker.position.x = 1.55 + clamp(net / 48, -2.1, 2.1) * easeInOut(value);
      });
    }

    if (experiment.id === "inertia") {
      const bus = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.25, 1.35), new THREE.MeshStandardMaterial({ color: "#2f77a1", metalness: 0.35, roughness: 0.28 }));
      body.position.y = 0.93;
      body.castShadow = true;
      bus.add(body);
      [-1.1, 1.1].forEach((x) => [-0.72, 0.72].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 24), dark);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.25, z);
        bus.add(wheel);
      }));
      [-1.1, 0, 1.1].forEach((x) => {
        const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.45), new THREE.MeshPhysicalMaterial({ color: "#9cdfff", transmission: 0.55, transparent: true, opacity: 0.7, roughness: 0.1 }));
        windowMesh.position.set(x, 1.08, 0.681);
        bus.add(windowMesh);
      });
      bus.position.set(-0.4, 0.1, 0);
      stage.add(bus);
      const passenger = addPerson(stage, 0, 0.03, "#ffc96f", 1);
      passenger.scale.setScalar(0.75);
      passenger.position.y = 0.55;
      const track = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.08, 1.8), dark);
      track.position.set(1.55, 0.16, 0);
      stage.add(track);
      animated.push((value) => {
        const amount = easeInOut(value);
        bus.position.x = -0.5 + 1.8 * amount;
        const inertia = parameterRef.current.primary / Math.max(parameterRef.current.secondary, 0.5);
        passenger.position.x = bus.position.x + 0.15 + clamp(inertia / 10, 0.2, 1.1) * Math.pow(amount, 2);
      });
    }

    if (experiment.id === "friction") {
      const surface = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.12, 2.2), new THREE.MeshStandardMaterial({ color: "#466571", roughness: 0.68 }));
      surface.position.set(1.55, 0.17, 0);
      surface.receiveShadow = true;
      stage.add(surface);
      for (let index = 0; index < 24; index += 1) {
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 1.95), new THREE.MeshBasicMaterial({ color: index % 2 ? "#66838d" : "#263f49" }));
        ridge.position.set(-1.35 + index * 0.25, 0.25, 0);
        stage.add(ridge);
      }
      const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 42), glowMaterial("#ffc86a"));
      puck.position.set(-1.25, 0.42, 0);
      puck.castShadow = true;
      stage.add(puck);
      addArrow(stage, new THREE.Vector3(-1.2, 1.15, 0), new THREE.Vector3(1, 0, 0), 1.4, "#ffc86a");
      animated.push((value) => {
        const speed = parameterRef.current.primary;
        const friction = parameterRef.current.secondary;
        const distance = clamp((speed * speed) / (2 * friction * 9.81) / 5.2, 0.4, 5.3);
        puck.position.x = -1.25 + distance * easeInOut(value);
        puck.rotation.y = value * 18;
      });
    }

    if (experiment.id === "force-mass") {
      const rails = [-0.52, 0.52].map((z) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 0.08), steel);
        rail.position.set(1.55, 0.25, z);
        stage.add(rail);
        return rail;
      });
      void rails;
      const cart = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 1.25), glowMaterial("#aa8cff", 0.94));
      body.position.y = 0.63;
      body.castShadow = true;
      cart.add(body);
      [-0.45, 0.45].forEach((x) => [-0.56, 0.56].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.13, 20), dark);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.25, z);
        cart.add(wheel);
      }));
      cart.position.set(-1.35, 0, 0);
      stage.add(cart);
      const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.34, 28), steel);
      weight.position.set(0, 1.18, 0);
      cart.add(weight);
      addArrow(cart, new THREE.Vector3(-0.65, 1.55, 0), new THREE.Vector3(1, 0, 0), 1.55, "#aa8cff");
      animated.push((value) => {
        const acceleration = parameterRef.current.primary / parameterRef.current.secondary;
        cart.position.x = -1.35 + clamp(acceleration * 1.25, 0.5, 5.2) * value * value;
        cart.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry && child !== weight) child.rotation.z = -value * 13;
        });
      });
    }

    if (experiment.id === "reaction") {
      addCylinderBetween(stage, new THREE.Vector3(-1.4, 2.25, 0), new THREE.Vector3(4.6, 2.25, 0), 0.025, steel);
      const balloon = new THREE.Group();
      const skin = new THREE.Mesh(new THREE.SphereGeometry(0.62, 36, 28), glowMaterial("#ff8db5", 0.88));
      skin.scale.set(1.25, 0.82, 0.82);
      skin.castShadow = true;
      balloon.add(skin);
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 20), pink);
      nozzle.rotation.z = -Math.PI / 2;
      nozzle.position.x = -0.92;
      balloon.add(nozzle);
      balloon.position.set(-1.15, 1.9, 0);
      stage.add(balloon);
      const particles: THREE.Mesh[] = [];
      for (let index = 0; index < 15; index += 1) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), cyan);
        particle.position.set(-1.75 - (index % 5) * 0.16, 1.9 + (index % 3 - 1) * 0.12, 0);
        stage.add(particle);
        particles.push(particle);
      }
      addArrow(stage, new THREE.Vector3(-1.65, 1.15, 0), new THREE.Vector3(-1, 0, 0), 1.15, "#66e7d0");
      addArrow(stage, new THREE.Vector3(-0.75, 1.15, 0), new THREE.Vector3(1, 0, 0), 1.15, "#ff8db5");
      animated.push((value, time) => {
        const acceleration = parameterRef.current.primary / parameterRef.current.secondary;
        balloon.position.x = -1.15 + clamp(acceleration / 4, 0.8, 5.1) * value * value;
        particles.forEach((particle, index) => {
          const cycle = (time * 1.7 + index * 0.13) % 1;
          particle.position.x = balloon.position.x - 0.9 - cycle * 1.4;
          particle.material = cyan;
        });
      });
    }

    if (experiment.id === "momentum") {
      const road = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 2), new THREE.MeshStandardMaterial({ color: "#2c3941", roughness: 0.88 }));
      road.position.set(1.55, 0.17, 0);
      stage.add(road);
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, 2.2), new THREE.MeshStandardMaterial({ color: "#d7d8d1", roughness: 0.8 }));
      barrier.position.set(4.25, 1.35, 0);
      barrier.castShadow = true;
      stage.add(barrier);
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.58, 1.2), new THREE.MeshStandardMaterial({ color: "#d84b4b", metalness: 0.56, roughness: 0.22 }));
      body.position.y = 0.66;
      body.castShadow = true;
      car.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 1.02), new THREE.MeshPhysicalMaterial({ color: "#91c8df", transmission: 0.4, transparent: true, opacity: 0.74, roughness: 0.08 }));
      cabin.position.set(-0.2, 1.15, 0);
      car.add(cabin);
      [-0.55, 0.55].forEach((x) => [-0.58, 0.58].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.16, 22), dark);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.28, z);
        car.add(wheel);
      }));
      const airbag = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 18), new THREE.MeshPhysicalMaterial({ color: "#f7f0d9", roughness: 0.74, transparent: true, opacity: 0.88 }));
      airbag.position.set(0.35, 1.15, 0);
      airbag.scale.setScalar(0.01);
      car.add(airbag);
      car.position.set(-1.25, 0, 0);
      stage.add(car);
      animated.push((value) => {
        const impact = clamp(value / 0.78, 0, 1);
        car.position.x = -1.25 + 4.55 * easeInOut(impact);
        const crash = clamp((value - 0.78) / 0.22, 0, 1);
        body.scale.x = 1 - crash * clamp(0.55 - parameterRef.current.secondary * 0.28, 0.14, 0.5);
        body.position.x = crash * 0.2;
        airbag.scale.setScalar(0.01 + crash * 1.25);
      });
    }

    if (experiment.id === "cradle") {
      const frameMaterial = new THREE.MeshStandardMaterial({ color: "#9aa8b2", metalness: 0.86, roughness: 0.2 });
      addCylinderBetween(stage, new THREE.Vector3(-0.65, 0.2, -1.05), new THREE.Vector3(-0.65, 2.85, -1.05), 0.08, frameMaterial);
      addCylinderBetween(stage, new THREE.Vector3(3.75, 0.2, -1.05), new THREE.Vector3(3.75, 2.85, -1.05), 0.08, frameMaterial);
      addCylinderBetween(stage, new THREE.Vector3(-0.65, 2.85, -1.05), new THREE.Vector3(3.75, 2.85, -1.05), 0.08, frameMaterial);
      addCylinderBetween(stage, new THREE.Vector3(-0.65, 0.2, 1.05), new THREE.Vector3(-0.65, 2.85, 1.05), 0.08, frameMaterial);
      addCylinderBetween(stage, new THREE.Vector3(3.75, 0.2, 1.05), new THREE.Vector3(3.75, 2.85, 1.05), 0.08, frameMaterial);
      addCylinderBetween(stage, new THREE.Vector3(-0.65, 2.85, 1.05), new THREE.Vector3(3.75, 2.85, 1.05), 0.08, frameMaterial);
      const pendulums: THREE.Group[] = [];
      for (let index = 0; index < 5; index += 1) {
        const pendulum = new THREE.Group();
        pendulum.position.set(0.65 + index * 0.45, 2.75, 0);
        const stringMaterial = new THREE.LineBasicMaterial({ color: "#dcebf1", transparent: true, opacity: 0.7 });
        [-0.28, 0.28].forEach((z) => {
          const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, z), new THREE.Vector3(0, -1.55, 0)]);
          pendulum.add(new THREE.Line(geometry, stringMaterial));
        });
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), new THREE.MeshStandardMaterial({ color: "#dbe7ee", metalness: 0.96, roughness: 0.08 }));
        ball.position.y = -1.55;
        ball.castShadow = true;
        pendulum.add(ball);
        stage.add(pendulum);
        pendulums.push(pendulum);
      }
      animated.push((value, time) => {
        const count = Math.round(parameterRef.current.primary);
        const amplitude = 0.58 + parameterRef.current.secondary * 0.035;
        const phase = value < 1 ? value * Math.PI : time * 2.1;
        pendulums.forEach((pendulum, index) => {
          const incoming = index < count;
          const outgoing = index >= 5 - count;
          if (incoming) pendulum.rotation.z = -Math.max(0, Math.cos(phase)) * amplitude;
          else if (outgoing) pendulum.rotation.z = Math.max(0, -Math.cos(phase)) * amplitude;
          else pendulum.rotation.z = 0;
        });
      });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(scene.children, true).find((intersection) => {
        let object: THREE.Object3D | null = intersection.object;
        while (object) {
          if (object.userData.action === "run") return true;
          object = object.parent;
        }
        return false;
      });
      if (hit) runRef.current();
    };
    renderer.domElement.addEventListener("pointerdown", handlePointer);

    const clock = new THREE.Clock();
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const time = clock.getElapsedTime();
      const value = progressRef.current;
      animated.forEach((animate) => animate(value, time));
      hologramBase.material.emissiveIntensity = 0.14 + Math.sin(time * 1.8) * 0.04;
      runButton.scale.setScalar(runningRef.current ? 0.84 + Math.sin(time * 9) * 0.05 : 1 + Math.sin(time * 2.1) * 0.035);
      title.material.opacity = 0.9 + Math.sin(time * 1.2) * 0.08;
      controls.update();
      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 420);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    draw();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("pointerdown", handlePointer);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          const geometry = (object as THREE.Mesh).geometry;
          if (geometry) geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material && "map" in material && material.map instanceof THREE.Texture) material.map.dispose();
            material?.dispose();
          });
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [experiment, quality]);

  return <div className="newton-webgl-stage" ref={mountRef} />;
}

function getMetrics(experiment: Experiment, primary: number, secondary: number) {
  if (experiment.id === "resultant") {
    const net = primary - secondary;
    return {
      first: { label: "Bileşke kuvvet", value: `${Math.abs(net).toFixed(0)} N` },
      second: { label: "Hareket yönü", value: net === 0 ? "Denge" : net > 0 ? "Sola" : "Sağa" },
      result: net === 0 ? "Zıt kuvvetler eşit: sistem dengede kalır." : `Büyük kuvvetin yönünde ${Math.abs(net).toFixed(0)} N bileşke oluşur.`,
      graphLabel: "Konum",
    };
  }
  if (experiment.id === "inertia") {
    const acceleration = primary / secondary;
    return {
      first: { label: "Yavaşlama büyüklüğü", value: `${acceleration.toFixed(1)} m/s²` },
      second: { label: "Öne hareket göstergesi", value: `${(primary / secondary * 0.18).toFixed(2)} m` },
      result: "Otobüs yavaşlarken yolcunun vücudu önceki hareketini sürdürme eğilimindedir.",
      graphLabel: "Hız",
    };
  }
  if (experiment.id === "friction") {
    const distance = primary * primary / (2 * secondary * 9.81);
    return {
      first: { label: "Sürtünme ivmesi", value: `${(secondary * 9.81).toFixed(1)} m/s²` },
      second: { label: "Durma mesafesi", value: `${distance.toFixed(2)} m` },
      result: "Sürtünme katsayısı arttıkça disk daha kısa mesafede durur.",
      graphLabel: "Hız",
    };
  }
  if (experiment.id === "force-mass") {
    const acceleration = primary / secondary;
    return {
      first: { label: "İvme", value: `${acceleration.toFixed(2)} m/s²` },
      second: { label: "4 s sonundaki hız", value: `${(acceleration * 4).toFixed(1)} m/s` },
      result: "Kuvvet arttığında ivme artar; aynı kuvvette kütle arttığında ivme azalır.",
      graphLabel: "Hız",
    };
  }
  if (experiment.id === "reaction") {
    const acceleration = primary / secondary;
    return {
      first: { label: "Balon ivmesi", value: `${acceleration.toFixed(1)} m/s²` },
      second: { label: "Kuvvet çifti", value: `${primary.toFixed(0)} N ↔ ${primary.toFixed(0)} N` },
      result: "Balon havayı geriye iterken hava balonu eşit büyüklükte kuvvetle ileri iter.",
      graphLabel: "Hız",
    };
  }
  if (experiment.id === "momentum") {
    const mass = 1000;
    const momentum = mass * primary;
    const force = momentum / secondary;
    return {
      first: { label: "İlk momentum", value: `${Math.round(momentum).toLocaleString("tr-TR")} kg·m/s` },
      second: { label: "Ortalama kuvvet", value: `${Math.round(force / 1000).toLocaleString("tr-TR")} kN` },
      result: "Aynı momentum değişimi daha uzun sürede gerçekleşirse ortalama çarpışma kuvveti azalır.",
      graphLabel: "Kuvvet",
    };
  }
  const momentum = primary * secondary;
  return {
    first: { label: "Giren momentum", value: `${momentum.toFixed(1)} birim` },
    second: { label: "Çıkan bilye", value: `${Math.round(primary)} adet` },
    result: "İdeal Newton beşiğinde aynı sayıda bilye, karşı uçta yaklaşık aynı hızla yükselir.",
    graphLabel: "Momentum",
  };
}

function graphValue(id: ExperimentId, x: number, primary: number, secondary: number) {
  if (id === "resultant") return (primary - secondary) * x * x / 120;
  if (id === "inertia") return Math.max(0, primary * (1 - x));
  if (id === "friction") return Math.max(0, primary - secondary * 9.81 * x * 1.2);
  if (id === "force-mass") return primary / secondary * x * 4;
  if (id === "reaction") return primary / secondary * x * 2;
  if (id === "momentum") return x > 0.72 && x < 0.96 ? primary * 1000 / secondary : 0;
  return primary * secondary * (0.7 + Math.sin(x * Math.PI * 4) * 0.3);
}

function LiveGraph({
  experiment,
  primary,
  secondary,
  progress,
  label,
}: {
  experiment: Experiment;
  primary: number;
  secondary: number;
  progress: number;
  label: string;
}) {
  const values = Array.from({ length: 31 }, (_, index) => graphValue(experiment.id, index / 30, primary, secondary));
  const minimum = Math.min(...values, 0);
  const maximum = Math.max(...values, 1);
  const range = maximum - minimum || 1;
  const path = values.map((value, index) => {
    const x = 18 + (index / (values.length - 1)) * 264;
    const y = 105 - ((value - minimum) / range) * 76;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg className="newton-live-graph" viewBox="0 0 300 130" role="img" aria-label={`${label} grafiği`}>
      <defs>
        <linearGradient id={`newton-graph-${experiment.id}`} x1="0" x2="1">
          <stop offset="0" stopColor={experiment.accent} stopOpacity="0.25" />
          <stop offset="1" stopColor={experiment.accent} />
        </linearGradient>
      </defs>
      {[30, 55, 80, 105].map((y) => <line key={y} x1="18" x2="282" y1={y} y2={y} />)}
      <path d={path} style={{ stroke: `url(#newton-graph-${experiment.id})` }} />
      <line className="newton-graph-cursor" x1={18 + progress * 264} x2={18 + progress * 264} y1="22" y2="108" style={{ stroke: experiment.accent }} />
      <circle cx={18 + progress * 264} cy={105 - ((graphValue(experiment.id, progress, primary, secondary) - minimum) / range) * 76} r="4" style={{ fill: experiment.accent }} />
      <text x="20" y="17">{label.toUpperCase()}</text>
      <text x="268" y="123">ZAMAN</text>
    </svg>
  );
}

export default function NewtonBookLab({ onBack }: { onBack: () => void }) {
  const [chapter, setChapter] = useState(0);
  const [parameters, setParameters] = useState<Parameters>(DEFAULT_PARAMETERS);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<Set<ExperimentId>>(new Set());
  const [prediction, setPrediction] = useState<Record<ExperimentId, number | null>>({
    resultant: null,
    inertia: null,
    friction: null,
    "force-mass": null,
    reaction: null,
    momentum: null,
    cradle: null,
  });
  const [quality, setQuality] = useState<Quality>("high");
  const [introOpen, setIntroOpen] = useState(true);
  const labRef = useRef<HTMLElement>(null);
  const experiment = EXPERIMENTS[chapter];
  const values = parameters[experiment.id];
  const metrics = useMemo(
    () => getMetrics(experiment, values.primary, values.secondary),
    [experiment, values.primary, values.secondary],
  );

  useEffect(() => {
    if (!running) return;
    const duration = experiment.id === "cradle" ? 4200 : 3200;
    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const next = clamp((now - startedAt) / duration, 0, 1);
      setProgress(next);
      if (next < 1) {
        frame = requestAnimationFrame(update);
      } else {
        setRunning(false);
        setCompleted((current) => new Set([...current, experiment.id]));
      }
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [experiment.id, running]);

  const runExperiment = () => {
    setProgress(0);
    setRunning(false);
    requestAnimationFrame(() => setRunning(true));
  };

  const updateParameter = (key: "primary" | "secondary", value: number) => {
    setParameters((current) => ({
      ...current,
      [experiment.id]: { ...current[experiment.id], [key]: value },
    }));
    setRunning(false);
    setProgress(0);
  };

  const selectChapter = (index: number) => {
    setRunning(false);
    setProgress(0);
    setChapter(clamp(index, 0, EXPERIMENTS.length - 1));
  };

  const moveChapter = (direction: -1 | 1) => {
    selectChapter(chapter + direction);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await labRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  };

  return (
    <main className="newton-book-lab" ref={labRef} style={{ "--newton-accent": experiment.accent } as React.CSSProperties}>
      <header className="newton-book-header">
        <button type="button" onClick={onBack}>← Serbest alanlara dön</button>
        <div>
          <span>FA</span>
          <b>FİZİK ATÖLYESİ</b>
          <small>ETKİLEŞİMLİ 3B KİTAP</small>
        </div>
        <aside>
          <button type="button" onClick={() => setQuality((current) => current === "high" ? "balanced" : "high")}>
            {quality === "high" ? "Yüksek kalite" : "Dengeli kalite"}
          </button>
          <button type="button" onClick={toggleFullscreen}>Tam ekran ↗</button>
        </aside>
      </header>

      <section className="newton-book-hero">
        <div>
          <span>TYMM · KUVVET VE HAREKET</span>
          <h1>Newton’un yasalarını <em>kitabın içinden çıkar.</em></h1>
          <p>Yedi sayfa, yedi canlı deney. Tahmin et, değişkenleri ayarla, üç boyutlu sahneyi çalıştır ve kanıtını grafikten oku.</p>
        </div>
        <aside>
          <strong>{completed.size}<small>/ 7</small></strong>
          <span>Tamamlanan deney</span>
        </aside>
      </section>

      <nav className="newton-chapter-strip" aria-label="Newton kitabı bölümleri">
        {EXPERIMENTS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`${index === chapter ? "active" : ""} ${completed.has(item.id) ? "complete" : ""}`}
            onClick={() => selectChapter(index)}
            aria-pressed={index === chapter}
          >
            <i>{completed.has(item.id) ? "✓" : item.number}</i>
            <span><small>{item.law}</small><b>{item.shortTitle}</b></span>
          </button>
        ))}
      </nav>

      <section className="newton-book-workspace">
        <div className="newton-stage-card">
          <div className="newton-stage-toolbar">
            <span><small>3B HOLOGRAFİK DENEY</small><b>{experiment.title}</b></span>
            <span><i className={running ? "live" : ""} />{running ? "Deney çalışıyor" : completed.has(experiment.id) ? "Deney tamamlandı" : "Deney hazır"}</span>
          </div>
          <NewtonHologramScene
            experiment={experiment}
            parameters={values}
            progress={progress}
            running={running}
            quality={quality}
            onRun={runExperiment}
          />
          <div className="newton-scene-help">
            <span><i>↻</i> Sahneyi sürükleyerek döndür</span>
            <span><i>＋</i> Yakınlaşmak için kaydır</span>
            <span><i>●</i> Kitaptaki ışıklı düğmeye dokun</span>
          </div>
          {introOpen && (
            <div className="newton-intro-overlay">
              <div className="newton-intro-orbit" aria-hidden="true"><i /><i /><i /></div>
              <span>FİZİK ATÖLYESİ SUNAR</span>
              <h2>Newton’un<br />Hareket Yasaları</h2>
              <p>Masadaki kitabı aç; her sayfada bir fizik yasasını kendi deneyinle çalıştır.</p>
              <button type="button" onClick={() => setIntroOpen(false)}>3B kitabı aç <i>→</i></button>
              <small>Fare, dokunmatik ekran ve klavye ile uyumludur.</small>
            </div>
          )}
        </div>

        <aside className="newton-control-panel">
          <div className="newton-page-heading">
            <span>{experiment.number} · {experiment.law}</span>
            <h2>{experiment.title}</h2>
            <p>{experiment.description}</p>
          </div>

          <section className="newton-prediction">
            <small>ÖNCE TAHMİN ET</small>
            <b>{experiment.prompt}</b>
            <div>
              {experiment.predictions.map((option, index) => (
                <button
                  type="button"
                  key={option}
                  className={prediction[experiment.id] === index ? "selected" : ""}
                  onClick={() => setPrediction((current) => ({ ...current, [experiment.id]: index }))}
                >{option}</button>
              ))}
            </div>
          </section>

          <div className="newton-sliders">
            <label>
              <span><b>{experiment.primaryLabel}</b><output>{values.primary.toLocaleString("tr-TR")} {experiment.primaryUnit}</output></span>
              <input
                type="range"
                min={experiment.primaryMin}
                max={experiment.primaryMax}
                step={experiment.primaryStep}
                value={values.primary}
                onChange={(event) => updateParameter("primary", Number(event.target.value))}
              />
            </label>
            <label>
              <span><b>{experiment.secondaryLabel}</b><output>{values.secondary.toLocaleString("tr-TR")} {experiment.secondaryUnit}</output></span>
              <input
                type="range"
                min={experiment.secondaryMin}
                max={experiment.secondaryMax}
                step={experiment.secondaryStep}
                value={values.secondary}
                onChange={(event) => updateParameter("secondary", Number(event.target.value))}
              />
            </label>
          </div>

          <button type="button" className="newton-run-button" onClick={runExperiment} disabled={running}>
            <i>{running ? "•••" : "▶"}</i>
            <span><small>{running ? "ÖLÇÜM SÜRÜYOR" : "DENEYİ ÇALIŞTIR"}</small><b>{running ? `%${Math.round(progress * 100)}` : "Tahminimi sınayalım"}</b></span>
          </button>

          <section className="newton-live-data">
            <div>
              <article><small>{metrics.first.label}</small><b>{metrics.first.value}</b></article>
              <article><small>{metrics.second.label}</small><b>{metrics.second.value}</b></article>
            </div>
            <LiveGraph
              experiment={experiment}
              primary={values.primary}
              secondary={values.secondary}
              progress={progress}
              label={metrics.graphLabel}
            />
          </section>

          <div className={`newton-conclusion ${completed.has(experiment.id) ? "revealed" : ""}`}>
            <span>{completed.has(experiment.id) ? "KANIT" : "DENEYDEN SONRA AÇILIR"}</span>
            <p>{completed.has(experiment.id) ? metrics.result : "Deneyi çalıştır; gözlemin ve grafiğin birlikte açıklansın."}</p>
          </div>
        </aside>
      </section>

      <footer className="newton-book-footer">
        <button type="button" onClick={() => moveChapter(-1)} disabled={chapter === 0}>← Önceki deney</button>
        <div>
          {EXPERIMENTS.map((item, index) => <i key={item.id} className={`${index === chapter ? "active" : ""} ${completed.has(item.id) ? "complete" : ""}`} />)}
        </div>
        <button type="button" onClick={() => moveChapter(1)} disabled={chapter === EXPERIMENTS.length - 1}>Sonraki deney →</button>
      </footer>
    </main>
  );
}
