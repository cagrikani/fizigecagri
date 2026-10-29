"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

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
  equation: string;
  principle: string;
  quickFacts: [string, string, string];
};

const EXPERIMENTS: Experiment[] = [
  {
    id: "resultant",
    number: "01",
    law: "HAZIRLIK · KUVVETLERİN BİLEŞKESİ",
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
    equation: "ΣF = F₁ − F₂",
    principle: "Hareketi tek tek kuvvetler değil, kuvvetlerin bileşkesi belirler.",
    quickFacts: [
      "Zıt yönlü kuvvetler birbirinden çıkarılır.",
      "Bileşke sıfırsa cismin hızı değişmez.",
      "Hareket, büyük kuvvetin yönünde değişir.",
    ],
  },
  {
    id: "inertia",
    number: "02",
    law: "1. YASA · EYLEMSİZLİK",
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
    equation: "ΣF = 0  →  v = sabit",
    principle: "Net kuvvet sıfırsa cisim duruyorsa durur, hareket ediyorsa sabit hızla hareketini sürdürür.",
    quickFacts: [
      "Eylemsizlik, hareket durumunu koruma eğilimidir.",
      "Ani fren, yolcuyu öne doğru hareket ettirir.",
      "Emniyet kemeri bu hareketi güvenle sınırlar.",
    ],
  },
  {
    id: "friction",
    number: "03",
    law: "1. YASA · NET KUVVET VE SÜRTÜNME",
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
    equation: "Fₛ = μ · N",
    principle: "Sürtünme hareket yönüne zıt bir net kuvvet oluşturarak hızın değişmesine neden olur.",
    quickFacts: [
      "Sürtünme kuvveti hareket yönüne zıttır.",
      "Pürüzlü yüzey diski daha kısa sürede durdurur.",
      "Aynı hızda durma mesafesini yüzey belirler.",
    ],
  },
  {
    id: "force-mass",
    number: "04",
    law: "2. YASA · KUVVET–KÜTLE–İVME",
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
    equation: "ΣF = m · a",
    principle: "İvme net kuvvetle doğru, kütleyle ters orantılıdır.",
    quickFacts: [
      "Net kuvvet arttıkça ivme artar.",
      "Aynı kuvvette büyük kütle daha az ivmelenir.",
      "Kuvvet ve ivme aynı yönlüdür.",
    ],
  },
  {
    id: "reaction",
    number: "05",
    law: "3. YASA · ETKİ–TEPKİ",
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
    equation: "F_AB = −F_BA",
    principle: "Kuvvetler eşit büyüklükte, zıt yönlüdür ve farklı cisimlere etki eder.",
    quickFacts: [
      "Balon havayı geriye iter.",
      "Hava balonu eşit kuvvetle ileri iter.",
      "Etki ve tepki farklı cisimler üzerindedir.",
    ],
  },
  {
    id: "momentum",
    number: "06",
    law: "UYGULAMA · MOMENTUM VE İTME",
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
    equation: "Δp = F · Δt",
    principle: "Aynı momentum değişimi daha uzun sürede gerçekleşirse ortalama kuvvet küçülür.",
    quickFacts: [
      "Çarpışmada aracın momentumu değişir.",
      "Durma süresi uzadıkça ortalama kuvvet azalır.",
      "Hava yastığı ve ezilme bölgesi süreyi uzatır.",
    ],
  },
  {
    id: "cradle",
    number: "07",
    law: "UYGULAMA · MOMENTUMUN KORUNUMU",
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
    equation: "Σp_önce = Σp_sonra",
    principle: "Dış kuvvetin ihmal edildiği sistemde toplam momentum korunur.",
    quickFacts: [
      "Momentum bilyeler boyunca aktarılır.",
      "İdeal sistemde toplam momentum korunur.",
      "Bırakılan bilye sayısı kadar bilye yükselir.",
    ],
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
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 3, canvas.width - 72);
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

function roundedMesh(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, depth, 5, Math.min(radius, width / 2, height / 2, depth / 2)),
    material,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createWheel(radius = 0.25, width = 0.17) {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 32),
    new THREE.MeshStandardMaterial({ color: "#111418", roughness: 0.82, metalness: 0.05 }),
  );
  tire.rotation.x = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);
  [-1, 1].forEach((side) => {
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, 0.012, 24),
      new THREE.MeshStandardMaterial({ color: "#bac5cc", metalness: 0.92, roughness: 0.16 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.z = side * (width / 2 + 0.008);
    wheel.add(rim);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.14, radius * 0.14, 0.022, 20),
      new THREE.MeshStandardMaterial({ color: "#303c43", metalness: 0.78, roughness: 0.24 }),
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.z = side * (width / 2 + 0.017);
    wheel.add(hub);
  });
  return wheel;
}

function createPaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Texture();
  const gradient = context.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#f8f1df");
  gradient.addColorStop(0.5, "#eee3cb");
  gradient.addColorStop(1, "#e1d1b4");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);
  for (let line = 0; line < 46; line += 1) {
    const y = (line * 67) % 512;
    context.strokeStyle = line % 3 === 0 ? "rgba(112,85,55,.08)" : "rgba(255,255,255,.15)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(140, y + 7, 350, y - 5, 512, y + 2);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = candidate;
    }
  });
  if (line) context.fillText(line, x, cursorY);
  return cursorY;
}

function createBookInfoTexture(experiment: Experiment) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1280;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Texture();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "top";
  context.fillStyle = "#715d49";
  context.font = "900 27px Arial";
  context.letterSpacing = "4px";
  context.fillText(`SAYFA ${experiment.number} · KISA BİLGİ`, 80, 70);
  context.letterSpacing = "0px";
  context.fillStyle = "#27231f";
  context.font = "700 58px Georgia";
  drawWrappedText(context, experiment.shortTitle, 80, 125, 850, 66);
  context.fillStyle = experiment.accent;
  context.fillRect(80, 276, 150, 8);
  context.fillStyle = "#302b26";
  context.font = "800 62px Arial";
  context.fillText(experiment.equation, 80, 320);
  context.fillStyle = "#6c5c4d";
  context.font = "500 31px Arial";
  drawWrappedText(context, experiment.principle, 80, 430, 850, 43);
  context.strokeStyle = "rgba(93,76,58,.24)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(80, 590);
  context.lineTo(936, 590);
  context.stroke();
  context.fillStyle = "#715d49";
  context.font = "900 24px Arial";
  context.letterSpacing = "3px";
  context.fillText("AKLINDA KALSIN", 80, 625);
  context.letterSpacing = "0px";
  experiment.quickFacts.forEach((fact, index) => {
    const top = 706 + index * 155;
    context.fillStyle = experiment.accent;
    context.beginPath();
    context.arc(105, top + 23, 24, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#10212b";
    context.font = "900 25px Arial";
    context.textAlign = "center";
    context.fillText(String(index + 1), 105, top + 8);
    context.textAlign = "left";
    context.fillStyle = "#3e3730";
    context.font = "600 31px Arial";
    drawWrappedText(context, fact, 155, top, 750, 41);
  });
  context.fillStyle = "#8b7764";
  context.font = "700 22px Arial";
  context.textAlign = "right";
  context.fillText("Kenarına dokun · sonraki deneye geç", 936, 1200);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createBusModel() {
  const bus = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: "#2478a6",
    metalness: 0.42,
    roughness: 0.2,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  });
  const lowerPaint = new THREE.MeshStandardMaterial({ color: "#16394d", metalness: 0.5, roughness: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#78c5e7",
    metalness: 0.05,
    roughness: 0.06,
    transmission: 0.42,
    transparent: true,
    opacity: 0.78,
    clearcoat: 1,
  });
  const body = roundedMesh(3.45, 1.18, 1.34, 0.2, paint);
  body.position.y = 0.92;
  bus.add(body);
  const skirt = roundedMesh(3.2, 0.32, 1.38, 0.08, lowerPaint);
  skirt.position.y = 0.43;
  bus.add(skirt);
  [-1.08, 0, 1.08].forEach((x) => {
    [-1, 1].forEach((side) => {
      const windowMesh = roundedMesh(0.76, 0.48, 0.022, 0.05, glass);
      windowMesh.position.set(x, 1.11, side * 0.681);
      bus.add(windowMesh);
    });
  });
  const windshield = roundedMesh(0.035, 0.54, 1.03, 0.02, glass);
  windshield.position.set(1.735, 1.08, 0);
  bus.add(windshield);
  const rearGlass = windshield.clone();
  rearGlass.position.x = -1.735;
  bus.add(rearGlass);
  const wheels: THREE.Group[] = [];
  [-1.12, 1.12].forEach((x) => [-0.72, 0.72].forEach((z) => {
    const wheel = createWheel(0.3, 0.17);
    wheel.position.set(x, 0.28, z);
    bus.add(wheel);
    wheels.push(wheel);
  }));
  [-0.38, 0.38].forEach((z) => {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 12), glowMaterial("#fff1b8"));
    light.scale.x = 0.45;
    light.position.set(1.75, 0.67, z);
    bus.add(light);
  });
  const bumper = roundedMesh(0.12, 0.15, 1.18, 0.04, new THREE.MeshStandardMaterial({ color: "#d5dde1", metalness: 0.86, roughness: 0.2 }));
  bumper.position.set(1.78, 0.36, 0);
  bus.add(bumper);
  return { bus, wheels };
}

function createDynamicsCart(color: string) {
  const cart = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: "#aab7c0", metalness: 0.88, roughness: 0.2 });
  const paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.48, roughness: 0.2, clearcoat: 0.9 });
  const chassis = roundedMesh(1.35, 0.28, 1.12, 0.1, metal);
  chassis.position.y = 0.48;
  cart.add(chassis);
  const deck = roundedMesh(1.05, 0.3, 0.88, 0.08, paint);
  deck.position.y = 0.73;
  cart.add(deck);
  const wheels: THREE.Group[] = [];
  [-0.46, 0.46].forEach((x) => [-0.58, 0.58].forEach((z) => {
    const wheel = createWheel(0.18, 0.12);
    wheel.position.set(x, 0.28, z);
    cart.add(wheel);
    wheels.push(wheel);
  }));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 10, 24, Math.PI), metal);
  hook.rotation.y = Math.PI / 2;
  hook.position.set(0.76, 0.52, 0);
  cart.add(hook);
  const weights: THREE.Mesh[] = [];
  for (let index = 0; index < 5; index += 1) {
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.11, 30), metal);
    weight.position.set(0, 0.96 + index * 0.105, 0);
    weight.castShadow = true;
    cart.add(weight);
    weights.push(weight);
  }
  return { cart, wheels, weights };
}

function createCrashCarModel() {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: "#d83b43",
    metalness: 0.58,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#7bbbd2",
    metalness: 0.08,
    transmission: 0.48,
    transparent: true,
    opacity: 0.76,
    roughness: 0.05,
  });
  const body = roundedMesh(1.7, 0.54, 1.16, 0.18, paint);
  body.position.y = 0.62;
  car.add(body);
  const hood = roundedMesh(0.68, 0.24, 1.06, 0.1, paint);
  hood.position.set(0.72, 0.84, 0);
  car.add(hood);
  const cabin = roundedMesh(0.78, 0.5, 0.97, 0.15, glass);
  cabin.position.set(-0.22, 1.09, 0);
  car.add(cabin);
  const wheels: THREE.Group[] = [];
  [-0.57, 0.57].forEach((x) => [-0.61, 0.61].forEach((z) => {
    const wheel = createWheel(0.24, 0.15);
    wheel.position.set(x, 0.28, z);
    car.add(wheel);
    wheels.push(wheel);
  }));
  const bumper = roundedMesh(0.12, 0.15, 1.04, 0.04, new THREE.MeshStandardMaterial({ color: "#c4cbd0", metalness: 0.86, roughness: 0.22 }));
  bumper.position.set(0.92, 0.42, 0);
  car.add(bumper);
  [-0.34, 0.34].forEach((z) => {
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), glowMaterial("#fff5bd"));
    headlight.scale.x = 0.45;
    headlight.position.set(0.89, 0.67, z);
    car.add(headlight);
  });
  const airbag = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 28, 20),
    new THREE.MeshPhysicalMaterial({ color: "#f5f0df", roughness: 0.74, transparent: true, opacity: 0.9 }),
  );
  airbag.position.set(0.3, 1.12, 0);
  airbag.scale.setScalar(0.01);
  car.add(airbag);
  return { car, hood, wheels, airbag };
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
  const fabric = new THREE.MeshPhysicalMaterial({ color, roughness: 0.58, metalness: 0.02, clearcoat: 0.08 });
  const skin = new THREE.MeshStandardMaterial({ color: "#d9a078", roughness: 0.78 });
  const trousers = new THREE.MeshStandardMaterial({ color: "#172536", roughness: 0.72 });
  const shoes = new THREE.MeshStandardMaterial({ color: "#17191d", roughness: 0.8 });
  const hair = new THREE.MeshStandardMaterial({ color: "#2f241f", roughness: 0.9 });
  const torso = roundedMesh(0.34, 0.5, 0.23, 0.08, fabric);
  torso.position.y = 0.76;
  const collar = roundedMesh(0.22, 0.06, 0.24, 0.025, fabric);
  collar.position.y = 1.03;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 18), skin);
  head.scale.set(0.88, 1.08, 0.9);
  head.position.y = 1.22;
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.184, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), hair);
  hairCap.scale.set(0.9, 1.06, 0.92);
  hairCap.position.y = 1.25;
  const hip = new THREE.Vector3(0, 0.48, 0);
  const leftFoot = new THREE.Vector3(-0.2, 0.06, 0.02);
  const rightFoot = new THREE.Vector3(0.2, 0.06, -0.02);
  addCylinderBetween(person, hip, leftFoot, 0.065, trousers);
  addCylinderBetween(person, hip, rightFoot, 0.065, trousers);
  [leftFoot, rightFoot].forEach((foot) => {
    const shoe = roundedMesh(0.19, 0.09, 0.15, 0.035, shoes);
    shoe.position.copy(foot);
    shoe.position.x += 0.035 * facing;
    person.add(shoe);
  });
  const shoulder = new THREE.Vector3(0, 0.93, 0);
  const elbow = new THREE.Vector3(0.22 * facing, 0.8, 0);
  const handPoint = new THREE.Vector3(0.4 * facing, 0.72, 0);
  addCylinderBetween(person, shoulder, elbow, 0.055, fabric);
  addCylinderBetween(person, elbow, handPoint, 0.045, skin);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), skin);
  hand.position.copy(handPoint);
  person.add(torso, collar, head, hairCap, hand);
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
  onTurn: (direction: -1 | 1) => void;
  canTurnPrevious: boolean;
  canTurnNext: boolean;
  presentationMode?: boolean;
};

function NewtonHologramScene({
  experiment,
  parameters,
  progress,
  running,
  quality,
  onRun,
  onTurn,
  canTurnPrevious,
  canTurnNext,
  presentationMode = false,
}: SceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const parameterRef = useRef(parameters);
  const progressRef = useRef(progress);
  const runningRef = useRef(running);
  const runRef = useRef(onRun);
  const turnRef = useRef(onTurn);

  useEffect(() => { parameterRef.current = parameters; }, [parameters]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { runRef.current = onRun; }, [onRun]);
  useEffect(() => { turnRef.current = onTurn; }, [onTurn]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#06121d");
    scene.fog = new THREE.FogExp2("#06121d", 0.035);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(
      presentationMode ? 1.3 : 0,
      presentationMode ? 5.3 : 6.8,
      presentationMode ? 8.5 : 10.8,
    );

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

    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const environment = environmentGenerator.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = environment;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(presentationMode ? 1.15 : 0, presentationMode ? 0.65 : 0.35, 0.2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 7.8;
    controls.maxDistance = 14;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 1.25;
    controls.minAzimuthAngle = -0.55;
    controls.maxAzimuthAngle = 0.55;

    scene.add(new THREE.HemisphereLight("#bfeaff", "#261c35", 1.15));
    const keyLight = new THREE.SpotLight("#fff2dc", 52, 35, 0.65, 0.4, 1.4);
    keyLight.position.set(-3, 9, 7);
    keyLight.target.position.set(0, 0, 0);
    keyLight.castShadow = quality === "high";
    keyLight.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
    scene.add(keyLight, keyLight.target);
    const rimLight = new THREE.PointLight(experiment.accent, 22, 18, 1.7);
    rimLight.position.set(4.2, 3.8, -2.4);
    scene.add(rimLight);

    const labWall = roundedMesh(
      15,
      7,
      0.24,
      0.08,
      new THREE.MeshStandardMaterial({ color: "#0c1b26", metalness: 0.42, roughness: 0.38 }),
    );
    labWall.position.set(0, 2.3, -4.4);
    scene.add(labWall);
    [-5.4, -2.7, 0, 2.7, 5.4].forEach((x) => {
      const strip = roundedMesh(0.035, 4.8, 0.035, 0.012, glowMaterial(x === 0 ? experiment.accent : "#6aa6c2", 0.48));
      strip.position.set(x, 2.3, -4.22);
      scene.add(strip);
    });

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
    const coverMaterial = new THREE.MeshPhysicalMaterial({ color: "#251828", roughness: 0.42, metalness: 0.12, clearcoat: 0.24, clearcoatRoughness: 0.45 });
    const pageMaterial = new THREE.MeshStandardMaterial({ color: "#f0e7d2", map: createPaperTexture(), roughness: 0.88, metalness: 0 });
    const pageEdge = new THREE.MeshStandardMaterial({ color: "#b9a98e", roughness: 0.9 });
    [-2.24, 2.24].forEach((x, index) => {
      const cover = roundedMesh(4.45, 0.18, 5.35, 0.08, coverMaterial);
      cover.position.set(x, -0.42, 0);
      cover.rotation.z = index === 0 ? -0.025 : 0.025;
      cover.castShadow = true;
      cover.receiveShadow = true;
      book.add(cover);
      const pages = roundedMesh(4.25, 0.22, 5.12, 0.06, pageMaterial);
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

    const infoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.82, 4.78),
      new THREE.MeshBasicMaterial({
        map: createBookInfoTexture(experiment),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    infoPanel.rotation.x = -Math.PI / 2;
    infoPanel.position.set(-2.24, -0.102, 0);
    book.add(infoPanel);

    const pageTurn = new THREE.Group();
    pageTurn.position.set(0, -0.075, 0);
    pageTurn.visible = false;
    const turningSheet = roundedMesh(
      4.18,
      0.035,
      5.03,
      0.035,
      new THREE.MeshPhysicalMaterial({
        color: "#f2e7d0",
        map: createPaperTexture(),
        roughness: 0.86,
        side: THREE.DoubleSide,
      }),
    );
    turningSheet.position.x = 2.09;
    pageTurn.add(turningSheet);
    book.add(pageTurn);

    const addPageEdge = (direction: -1 | 1) => {
      const x = direction === 1 ? 4.36 : -4.36;
      const action = direction === 1 ? "next-page" : "previous-page";
      const hitArea = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.42, 5.15),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, depthWrite: false }),
      );
      hitArea.position.set(x, -0.02, 0);
      hitArea.userData.action = action;
      book.add(hitArea);
      const edge = roundedMesh(
        0.16,
        0.16,
        4.7,
        0.045,
        new THREE.MeshPhysicalMaterial({
          color: experiment.accent,
          emissive: experiment.accent,
          emissiveIntensity: 0.8,
          metalness: 0.35,
          roughness: 0.28,
          transparent: true,
          opacity: 0.82,
        }),
      );
      edge.position.set(x, -0.02, 0);
      edge.userData.action = action;
      book.add(edge);
      const label = createTextSprite(direction === 1 ? "SAYFAYI ÇEVİR  →" : "←  ÖNCEKİ SAYFA", experiment.accent, 760);
      label.position.set(x + direction * 0.05, 0.55, 1.78);
      label.scale.set(2.15, 0.4, 1);
      label.userData.action = action;
      book.add(label);
    };
    if (canTurnPrevious) addPageEdge(-1);
    if (canTurnNext) addPageEdge(1);

    const stage = new THREE.Group();
    stage.position.y = 0.02;
    book.add(stage);
    const hologramBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.15, 3.45, 0.12, 72),
      new THREE.MeshPhysicalMaterial({
        color: "#0e2838",
        emissive: experiment.accent,
        emissiveIntensity: 0.18,
        metalness: 0.68,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transmission: 0.08,
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

    if (experiment.id === "resultant") {
      const rope = addCylinderBetween(stage, new THREE.Vector3(-1.5, 0.85, 0), new THREE.Vector3(4.7, 0.85, 0), 0.055, new THREE.MeshStandardMaterial({ color: "#c6aa77", roughness: 0.9 }));
      rope.castShadow = true;
      const marker = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 12, 32), glowMaterial("#ffffff"));
      marker.rotation.y = Math.PI / 2;
      marker.position.set(1.55, 0.85, 0);
      stage.add(marker);
      [-1.15, -0.55, 0.05].forEach((offset) => addPerson(stage, offset - 1.5, 0.04, "#66e7d0", -1));
      [3.05, 3.65, 4.25].forEach((x) => addPerson(stage, x, 0.04, "#ff88b1", 1));
      const leftArrow = addArrow(stage, new THREE.Vector3(1.55, 1.42, 0), new THREE.Vector3(-1, 0, 0), 1.45, "#66e7d0");
      const rightArrow = addArrow(stage, new THREE.Vector3(1.55, 1.42, 0), new THREE.Vector3(1, 0, 0), 1.45, "#ff88b1");
      animated.push((value) => {
        const { primary, secondary } = parameterRef.current;
        const net = primary - secondary;
        const markerX = 1.55 - clamp(net / 48, -2.1, 2.1) * easeInOut(value);
        marker.position.x = markerX;
        leftArrow.position.set(markerX, 1.42, 0);
        rightArrow.position.set(markerX, 1.42, 0);
        leftArrow.setLength(0.72 + (primary / 140) * 1.45, 0.3, 0.17);
        rightArrow.setLength(0.72 + (secondary / 140) * 1.45, 0.3, 0.17);
      });
    }

    if (experiment.id === "inertia") {
      const { bus, wheels } = createBusModel();
      bus.position.set(-0.4, 0.1, 0);
      stage.add(bus);
      const passenger = addPerson(bus, 0.08, 0.01, "#e8a44b", 1);
      passenger.scale.setScalar(0.64);
      passenger.position.y = 0.32;
      const track = roundedMesh(6.3, 0.1, 1.95, 0.04, new THREE.MeshStandardMaterial({ color: "#303d44", roughness: 0.88 }));
      track.position.set(1.55, 0.15, 0);
      stage.add(track);
      [-0.58, 0.58].forEach((z) => {
        const lane = roundedMesh(5.9, 0.015, 0.045, 0.01, new THREE.MeshStandardMaterial({ color: "#e9d57a", roughness: 0.65 }));
        lane.position.set(1.55, 0.21, z);
        stage.add(lane);
      });
      animated.push((value) => {
        const amount = easeInOut(value);
        bus.position.x = -0.5 + 1.8 * amount;
        const inertia = parameterRef.current.primary / Math.max(parameterRef.current.secondary, 0.5);
        passenger.position.x = 0.08 + clamp(inertia / 22, 0.08, 0.42) * Math.pow(amount, 2);
        passenger.rotation.z = -0.12 + clamp(inertia / 18, 0.04, 0.38) * amount;
        wheels.forEach((wheel) => { wheel.rotation.z = -amount * 10; });
      });
    }

    if (experiment.id === "friction") {
      const surface = roundedMesh(6.3, 0.14, 2.2, 0.07, new THREE.MeshStandardMaterial({ color: "#667b82", metalness: 0.42, roughness: 0.42 }));
      surface.position.set(1.55, 0.17, 0);
      surface.receiveShadow = true;
      stage.add(surface);
      for (let index = 0; index < 18; index += 1) {
        const ridge = roundedMesh(0.022, 0.024, 1.88, 0.006, new THREE.MeshStandardMaterial({ color: index % 2 ? "#8ca0a5" : "#4b5c61", metalness: 0.28, roughness: 0.62 }));
        ridge.position.set(-1.25 + index * 0.34, 0.255, 0);
        stage.add(ridge);
      }
      const puck = new THREE.Group();
      const puckBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 48), new THREE.MeshPhysicalMaterial({ color: "#d5dde0", metalness: 0.84, roughness: 0.16, clearcoat: 0.8 }));
      const rubberRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.055, 12, 48), new THREE.MeshStandardMaterial({ color: "#20262a", roughness: 0.84 }));
      rubberRing.rotation.x = Math.PI / 2;
      const puckCap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.195, 42), glowMaterial("#ffc86a", 0.82));
      puck.add(puckBody, rubberRing, puckCap);
      puck.position.set(-1.25, 0.42, 0);
      puck.traverse((object) => { if (object instanceof THREE.Mesh) object.castShadow = true; });
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
      for (let index = 0; index < 13; index += 1) {
        const sleeper = roundedMesh(0.12, 0.07, 1.38, 0.025, new THREE.MeshStandardMaterial({ color: "#26343b", metalness: 0.54, roughness: 0.36 }));
        sleeper.position.set(-1.42 + index * 0.5, 0.18, 0);
        stage.add(sleeper);
      }
      const { cart, wheels, weights } = createDynamicsCart("#7754c8");
      cart.position.set(-1.35, 0, 0);
      stage.add(cart);
      addArrow(cart, new THREE.Vector3(-0.65, 1.55, 0), new THREE.Vector3(1, 0, 0), 1.55, "#aa8cff");
      animated.push((value) => {
        const acceleration = parameterRef.current.primary / parameterRef.current.secondary;
        cart.position.x = -1.35 + clamp(acceleration * 1.25, 0.5, 5.2) * value * value;
        const visibleWeights = clamp(Math.round(parameterRef.current.secondary / 10), 1, weights.length);
        weights.forEach((weight, index) => { weight.visible = index < visibleWeights; });
        wheels.forEach((wheel) => { wheel.rotation.z = -value * 13; });
      });
    }

    if (experiment.id === "reaction") {
      addCylinderBetween(stage, new THREE.Vector3(-1.4, 2.25, 0), new THREE.Vector3(4.6, 2.25, 0), 0.025, steel);
      [-1.35, 4.55].forEach((x) => {
        const stand = roundedMesh(0.12, 2.25, 0.12, 0.035, new THREE.MeshStandardMaterial({ color: "#aab5bc", metalness: 0.86, roughness: 0.2 }));
        stand.position.set(x, 1.17, 0);
        stage.add(stand);
        const foot = roundedMesh(0.65, 0.1, 0.52, 0.04, new THREE.MeshStandardMaterial({ color: "#52616a", metalness: 0.65, roughness: 0.32 }));
        foot.position.set(x, 0.14, 0);
        stage.add(foot);
      });
      const balloon = new THREE.Group();
      const skin = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 48, 32),
        new THREE.MeshPhysicalMaterial({ color: "#e94c84", roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.08, transparent: true, opacity: 0.92 }),
      );
      skin.scale.set(1.25, 0.82, 0.82);
      skin.castShadow = true;
      balloon.add(skin);
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 20), pink);
      nozzle.rotation.z = -Math.PI / 2;
      nozzle.position.x = -0.92;
      balloon.add(nozzle);
      const straw = roundedMesh(0.62, 0.14, 0.14, 0.06, new THREE.MeshPhysicalMaterial({ color: "#eaf9ff", transmission: 0.6, transparent: true, opacity: 0.8, roughness: 0.08 }));
      straw.position.y = 0.36;
      balloon.add(straw);
      const tape = roundedMesh(0.26, 0.08, 0.72, 0.025, new THREE.MeshPhysicalMaterial({ color: "#f7e6a3", roughness: 0.38, transparent: true, opacity: 0.75 }));
      tape.position.y = 0.23;
      balloon.add(tape);
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
      const road = roundedMesh(6.4, 0.12, 2, 0.05, new THREE.MeshStandardMaterial({ color: "#2c343a", roughness: 0.9 }));
      road.position.set(1.55, 0.17, 0);
      stage.add(road);
      for (let index = 0; index < 6; index += 1) {
        const laneDash = roundedMesh(0.42, 0.015, 0.055, 0.012, new THREE.MeshStandardMaterial({ color: "#f0e5b2", roughness: 0.7 }));
        laneDash.position.set(-0.8 + index * 0.85, 0.24, 0);
        stage.add(laneDash);
      }
      const barrier = roundedMesh(0.35, 2.4, 2.2, 0.06, new THREE.MeshStandardMaterial({ color: "#d7d8d1", roughness: 0.7, metalness: 0.08 }));
      barrier.position.set(4.25, 1.35, 0);
      barrier.castShadow = true;
      stage.add(barrier);
      for (let stripe = -0.82; stripe <= 0.82; stripe += 0.41) {
        const marking = roundedMesh(0.025, 0.28, 0.3, 0.01, new THREE.MeshStandardMaterial({ color: stripe % 0.82 === 0 ? "#f1b52e" : "#23282b", roughness: 0.7 }));
        marking.rotation.z = -0.6;
        marking.position.set(4.055, 1.15 + stripe, 0);
        stage.add(marking);
      }
      const { car, hood, wheels, airbag } = createCrashCarModel();
      car.position.set(-1.25, 0, 0);
      stage.add(car);
      animated.push((value) => {
        const impact = clamp(value / 0.78, 0, 1);
        car.position.x = -1.25 + 4.55 * easeInOut(impact);
        const crash = clamp((value - 0.78) / 0.22, 0, 1);
        hood.scale.x = 1 - crash * clamp(0.72 - parameterRef.current.secondary * 0.3, 0.2, 0.58);
        hood.position.x = 0.72 - crash * 0.14;
        airbag.scale.setScalar(0.01 + crash * 1.25);
        wheels.forEach((wheel) => { wheel.rotation.z = -impact * 16; });
      });
    }

    if (experiment.id === "cradle") {
      const frameMaterial = new THREE.MeshStandardMaterial({ color: "#9aa8b2", metalness: 0.86, roughness: 0.2 });
      const cradleBase = roundedMesh(5.05, 0.16, 2.5, 0.09, new THREE.MeshPhysicalMaterial({ color: "#243641", metalness: 0.68, roughness: 0.2, clearcoat: 0.75 }));
      cradleBase.position.set(1.55, 0.16, 0);
      stage.add(cradleBase);
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
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 48, 32), new THREE.MeshPhysicalMaterial({ color: "#e7f0f4", metalness: 1, roughness: 0.06, clearcoat: 1 }));
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

    const clock = new THREE.Clock();
    let pageTurnDirection: -1 | 0 | 1 = 0;
    let pageTurnStartedAt = 0;
    const startPageTurn = (direction: -1 | 1) => {
      if (pageTurnDirection !== 0 || runningRef.current) return;
      if ((direction === 1 && !canTurnNext) || (direction === -1 && !canTurnPrevious)) return;
      pageTurnDirection = direction;
      pageTurnStartedAt = clock.getElapsedTime();
      pageTurn.visible = true;
      pageTurn.position.y = -0.075;
      pageTurn.rotation.z = direction === 1 ? 0 : Math.PI;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(scene.children, true);
      const hit = intersections.find((intersection) => {
        let object: THREE.Object3D | null = intersection.object;
        while (object) {
          if (typeof object.userData.action === "string") return true;
          object = object.parent;
        }
        return false;
      });
      if (!hit) return;
      let object: THREE.Object3D | null = hit.object;
      while (object && typeof object.userData.action !== "string") object = object.parent;
      if (object?.userData.action === "run") runRef.current();
      if (object?.userData.action === "next-page") startPageTurn(1);
      if (object?.userData.action === "previous-page") startPageTurn(-1);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointer);

    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const time = clock.getElapsedTime();
      const value = progressRef.current;
      if (pageTurnDirection !== 0) {
        const turnProgress = clamp((time - pageTurnStartedAt) / 0.82, 0, 1);
        const easedTurn = easeInOut(turnProgress);
        pageTurn.rotation.z = pageTurnDirection === 1
          ? easedTurn * Math.PI
          : Math.PI - easedTurn * Math.PI;
        pageTurn.position.y = -0.075 + Math.sin(turnProgress * Math.PI) * 0.22;
        turningSheet.scale.x = 1 - Math.sin(turnProgress * Math.PI) * 0.07;
        if (turnProgress >= 1) {
          const finishedDirection = pageTurnDirection;
          pageTurnDirection = 0;
          pageTurn.visible = false;
          turnRef.current(finishedDirection);
        }
      }
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
      environment.dispose();
      environmentGenerator.dispose();
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
  }, [canTurnNext, canTurnPrevious, experiment, presentationMode, quality]);

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

const RESULTANT_NARRATION_DURATION = 36.52;
const RESULTANT_NARRATION_SEGMENTS = [
  { end: 3.72, kicker: "BİRDEN FAZLA KUVVET", caption: "Bir cisme aynı anda birden fazla kuvvet etki edebilir." },
  { end: 9.14, kicker: "TOPLAM ETKİ", caption: "Cismin hareketini kuvvetlerin toplam etkisi belirler." },
  { end: 13.08, kicker: "ZIT YÖNLER", caption: "İki takım halata zıt yönlerde kuvvet uyguluyor." },
  { end: 17.24, kicker: "DENGE", caption: "Kuvvetler eşitse bileşke sıfır olur." },
  { end: 22.54, kicker: "BÜYÜK KUVVETİN YÖNÜ", caption: "Sol takımın kuvveti büyüdüğünde halat sola hareket eder." },
  { end: 25.82, kicker: "DEĞİŞKENLER", caption: "Sol ve sağ takımın kuvvetlerini ayrı ayrı değiştirebilirsin." },
  { end: 31.46, kicker: "ÖNCE TAHMİN ET", caption: "Ortadaki işaretçinin yönünü tahmin et, ardından deneyi çalıştır." },
  { end: RESULTANT_NARRATION_DURATION, kicker: "UNUTMA", caption: "Hareketi tek tek kuvvetler değil, bileşke kuvvet belirler." },
] as const;

function getResultantNarrationPhase(time: number) {
  const index = RESULTANT_NARRATION_SEGMENTS.findIndex((segment) => time < segment.end);
  return index === -1 ? RESULTANT_NARRATION_SEGMENTS.length - 1 : index;
}

function ResultantNarratedLesson({
  onComplete,
  onTimeChange,
}: {
  onComplete: () => void;
  onTimeChange: (time: number, duration: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(RESULTANT_NARRATION_DURATION);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const update = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        onTimeChange(audioRef.current.currentTime, audioRef.current.duration || RESULTANT_NARRATION_DURATION);
      }
      animationRef.current = requestAnimationFrame(update);
    };
    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [onTimeChange, playing]);

  const phase = getResultantNarrationPhase(currentTime);
  const segment = RESULTANT_NARRATION_SEGMENTS[phase] ?? RESULTANT_NARRATION_SEGMENTS.at(-1)!;
  const progress = clamp(currentTime / Math.max(duration, 0.1), 0, 1);
  const unbalanced = phase >= 4;
  const leftForce = unbalanced ? 140 : 100;
  const rightForce = unbalanced ? 80 : 100;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    if (audio.ended || currentTime >= duration - 0.05) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setFinished(false);
    }
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const restart = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setFinished(false);
    await audio.play();
  };

  return (
    <section className="newton-narrated-lesson" aria-label="Bileşke kuvvet sesli anlatımı">
      <audio
        ref={audioRef}
        preload="metadata"
        src="./audio/01-bileske-kuvvet.wav"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || RESULTANT_NARRATION_DURATION)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setFinished(true);
          setCurrentTime(duration);
        }}
        onError={() => setAudioError(true)}
      />

      <header className="newton-narrated-header">
        <span><i className={playing ? "live" : ""} /> SESLİ KEŞİF · 01</span>
        <strong>Bileşke kuvveti önce izle</strong>
        <small>{finished ? "Anlatım tamamlandı" : "Deneye başlamadan önce anlatımı tamamla"}</small>
      </header>

      <div className={`newton-narrated-visual phase-${phase}`}>
        <div className="newton-narrated-hud">
          <span>SESLE EŞZAMANLI SAHNE · {String(phase + 1).padStart(2, "0")}/08</span>
          <b>{segment.kicker}</b>
        </div>

        <div className={`newton-narrated-vector-card ${phase >= 1 ? "shown" : ""}`}>
          <div className="newton-narrated-vector-labels">
            <span><i /> SOL TAKIM <b>{leftForce} N</b></span>
            <small>KUVVET VEKTÖRLERİ</small>
            <span>SAĞ TAKIM <b>{rightForce} N</b><i /></span>
          </div>
          <div className="newton-narrated-vector-axis" aria-label={`Sol takım ${leftForce} newton, sağ takım ${rightForce} newton`}>
            <span className="left-vector" style={{ width: `${(leftForce / 140) * 100}%` }}><i /></span>
            <strong><i /> HALAT</strong>
            <span className="right-vector" style={{ width: `${(rightForce / 140) * 100}%` }}><i /></span>
          </div>
          <div className={`newton-narrated-net ${phase >= 3 ? "shown" : ""} ${unbalanced ? "moving" : "balanced"}`}>
            <small>BİLEŞKE</small>
            <b>{unbalanced ? "60 N" : "0 N"}</b>
            <span>{unbalanced ? "← SOLA HAREKET" : "● DENGE"}</span>
          </div>
        </div>

        <div className="newton-narrated-step-rail" aria-hidden="true">
          {RESULTANT_NARRATION_SEGMENTS.map((item, index) => (
            <i key={item.end} className={index < phase ? "complete" : index === phase ? "active" : ""} />
          ))}
        </div>

        <div className="newton-narrated-caption" aria-live="polite">
          <span>0{phase + 1}</span>
          <p><small>{segment.kicker}</small>{segment.caption}</p>
        </div>
      </div>

      <div className="newton-narrated-controls">
        <button type="button" className="newton-narrated-play" onClick={togglePlayback} disabled={audioError}>
          <i>{playing ? "Ⅱ" : currentTime > 0 && !finished ? "▶" : "▶"}</i>
          <span><small>{playing ? "ANLATIM OYNUYOR" : finished ? "TEKRAR DİNLE" : currentTime > 0 ? "DEVAM ET" : "ANLATIMI BAŞLAT"}</small><b>{playing ? "Dinlerken sahneyi izle" : "Sesli keşfi çalıştır"}</b></span>
        </button>
        <div className="newton-narrated-progress" aria-label={`Sesli anlatım yüzde ${Math.round(progress * 100)} tamamlandı`}>
          <div><i style={{ width: `${progress * 100}%` }} /></div>
          <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}</span>
          <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
        </div>
        {currentTime > 0 && !finished && <button type="button" className="newton-narrated-restart" onClick={restart}>↺ Baştan</button>}
      </div>

      {audioError && <p className="newton-narrated-error">Ses dosyası yüklenemedi. İnternet bağlantısını kontrol edip yeniden deneyin.</p>}
      {finished && (
        <div className="newton-narrated-finish">
          <span>✓ ANLATIM TAMAMLANDI</span>
          <strong>Şimdi kuvvetleri sen değiştir.</strong>
          <p>Önce tahminini seç, ardından deneyi çalıştır ve bileşkeyi gözlemle.</p>
          <button type="button" onClick={onComplete}>Deneye geç <i>→</i></button>
        </div>
      )}
    </section>
  );
}

export default function NewtonBookLab({
  onBack,
  context = "free",
}: {
  onBack: () => void;
  context?: "free" | "mechanics";
}) {
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
  const [resultantNarrationDone, setResultantNarrationDone] = useState(false);
  const [resultantNarrationTime, setResultantNarrationTime] = useState(0);
  const labRef = useRef<HTMLElement>(null);
  const experiment = EXPERIMENTS[chapter];
  const values = parameters[experiment.id];
  const lessonLocked = experiment.id === "resultant" && !resultantNarrationDone;
  const narrationPhase = getResultantNarrationPhase(resultantNarrationTime);
  const sceneValues = lessonLocked
    ? { primary: narrationPhase >= 4 ? 140 : 100, secondary: narrationPhase >= 4 ? 80 : 100 }
    : values;
  const sceneProgress = lessonLocked
    ? clamp((resultantNarrationTime - 17.24) / (22.54 - 17.24), 0, 1)
    : progress;
  const handleNarrationTime = useCallback((time: number) => {
    setResultantNarrationTime(time);
  }, []);
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
        <button type="button" onClick={onBack}>
          ← {context === "mechanics" ? "Mekanik deneylerine dön" : "Serbest alanlara dön"}
        </button>
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
        <div className="newton-stage-card" key={`stage-${experiment.id}`}>
          <div className="newton-stage-toolbar">
            <span><small>GERÇEK ZAMANLI 3B DENEY</small><b>{experiment.title}</b></span>
            <em className="newton-render-badge">PBR MALZEME · FİZİKSEL IŞIK</em>
            <span><i className={running ? "live" : ""} />{running ? "Deney çalışıyor" : completed.has(experiment.id) ? "Deney tamamlandı" : "Deney hazır"}</span>
          </div>
          <NewtonHologramScene
            experiment={experiment}
            parameters={sceneValues}
            progress={sceneProgress}
            running={running}
            quality={quality}
            onRun={runExperiment}
            onTurn={moveChapter}
            canTurnPrevious={chapter > 0}
            canTurnNext={chapter < EXPERIMENTS.length - 1}
            presentationMode={lessonLocked && !introOpen}
          />
          <div className="newton-scene-help">
            <span><i>↠</i> Işıklı kenara dokun ve sayfayı çevir</span>
            <span><i>↻</i> Sahneyi sürükleyerek döndür</span>
            <span><i>＋</i> Yakınlaşmak için kaydır</span>
          </div>
          {lessonLocked && !introOpen && (
            <ResultantNarratedLesson
              onComplete={() => setResultantNarrationDone(true)}
              onTimeChange={handleNarrationTime}
            />
          )}
          {introOpen && (
            <div className="newton-intro-overlay">
              <div className="newton-intro-orbit" aria-hidden="true"><i /><i /><i /></div>
              <span>FİZİK ATÖLYESİ SUNAR</span>
              <h2>Newton’un<br />Hareket Yasaları</h2>
              <p>Masadaki kitabı aç; her sayfada bir fizik yasasını kendi deneyinle çalıştır.</p>
              <div className="newton-intro-laws" aria-label="Kitaptaki Newton yasaları">
                <span><i>1</i><b>Eylemsizlik</b></span>
                <span><i>2</i><b>ΣF = m · a</b></span>
                <span><i>3</i><b>Etki · tepki</b></span>
              </div>
              <button type="button" onClick={() => setIntroOpen(false)}>3B kitabı aç <i>→</i></button>
              <small>Fare, dokunmatik ekran ve klavye ile uyumludur.</small>
            </div>
          )}
        </div>

        <aside className={`newton-control-panel ${lessonLocked ? "is-lesson-locked" : ""}`} key={`panel-${experiment.id}`}>
          {lessonLocked && (
            <div className="newton-control-lock">
              <i>♫</i>
              <span><small>ÖNCE İZLE VE DİNLE</small><b>Sesli anlatım tamamlanınca deney açılır.</b></span>
            </div>
          )}
          <div className="newton-page-heading">
            <span>{experiment.number} · {experiment.law}</span>
            <h2>{experiment.title}</h2>
            <p>{experiment.description}</p>
          </div>

          <section className="newton-law-card">
            <div><small>BU SAYFANIN YASASI</small><strong>{experiment.equation}</strong></div>
            <p>{experiment.principle}</p>
          </section>

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
                  disabled={lessonLocked}
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
                disabled={lessonLocked}
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
                disabled={lessonLocked}
                onChange={(event) => updateParameter("secondary", Number(event.target.value))}
              />
            </label>
          </div>

          <button type="button" className="newton-run-button" onClick={runExperiment} disabled={running || lessonLocked}>
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
