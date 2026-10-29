import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("sunucu paketi Fizik Atölyesi olarak taşınabilir yapıdadır", async () => {
  const html = await readFile(new URL("sunucu-paketi/index.html", projectRoot), "utf8");
  assert.match(html, /<html lang="tr">/i);
  assert.match(html, /<title>Fizik Atölyesi \| Merak Et, Kur, Keşfet<\/title>/i);
  assert.match(html, /\.\/assets\/index-[^"]+\.js/i);
  assert.match(html, /\.\/assets\/index-[^"]+\.css/i);
  await access(new URL("sunucu-paketi/assets", projectRoot));
  await access(new URL("sunucu-paketi/fizik-atolyesi-hero.png", projectRoot));
  const realisticCardImages = [
    "portal-mechanics.webp",
    "portal-electricity.webp",
    "portal-optics.webp",
    "portal-modern.webp",
    "free-force-motion.webp",
    "free-force-motion-newton-book-v2.webp",
    "free-energy.webp",
    "free-pressure.webp",
    "free-electric-magnetic.webp",
    "free-heat.webp",
    "free-waves.webp",
    "free-optics.webp",
    "free-modern.webp",
    "mechanics-motion.webp",
    "mechanics-freefall.webp",
    "mechanics-two-dimensional.webp",
    "mechanics-collisions.webp",
    "mechanics-ballistic.webp",
    "mechanics-harmonic-motion.webp",
    "harmonic-tab-spring-real-v2.png",
    "harmonic-tab-pendulum-real-v2.png",
    "shm-retort-stand-real-v2.png",
    "shm-metal-spring-real-v2.png",
    "shm-mass-hanger-real-v2.png",
    "shm-motion-sensor-real-v3.png",
    "shm-optical-motion-sensor-real-v4.png",
    "pendulum-bob-real-v2.png",
    "motion-lab-bench-v3.webp",
    "motion-equipment-air-track.webp",
    "motion-equipment-pump.webp",
    "motion-equipment-gate.webp",
    "motion-equipment-timer.webp",
    "motion-equipment-launcher.webp",
    "motion-equipment-pulley.webp",
    "motion-equipment-hanger.webp",
    "motion-equipment-mass.webp",
    "freefall-equipment-stand.webp",
    "freefall-equipment-release.webp",
    "freefall-equipment-sensor.webp",
    "freefall-equipment-timer.webp",
    "freefall-equipment-ruler.webp",
    "twod-launcher-frame-v2.webp",
    "twod-launcher-barrel-v2.webp",
    "twod-landing-table-v2.webp",
    "twod-speed-sensor-v2.webp",
    "electricity-ohm.webp",
    "electricity-resistors.webp",
    "optics-mirrors.webp",
    "optics-plane-mirror.webp",
    "optics-concave-mirror.webp",
    "optics-convex-mirror.webp",
  ];
  await Promise.all(
    realisticCardImages.map((image) =>
      access(new URL(`sunucu-paketi/${image}`, projectRoot)),
    ),
  );
});

test("mekanik alanı altı gerçek düzenek ve profesyonel 3B Newton kitabı sunar", async () => {
  const page = await readFile(new URL("app/MechanicsLabHub.tsx", projectRoot), "utf8");
  assert.match(page, /activeModule/);
  assert.match(page, /module-choice-grid/);
  assert.match(page, /setActiveModule\("motion"\)/);
  assert.match(page, /setActiveModule\("free-fall"\)/);
  assert.match(page, /setActiveModule\("two-dimensional"\)/);
  assert.match(page, /setActiveModule\("collisions"\)/);
  assert.match(page, /setActiveModule\("ballistic-pendulum"\)/);
  assert.match(page, /setActiveModule\("harmonic-motion"\)/);
  assert.match(page, /setActiveModule\("newton-book"\)/);
  assert.match(page, /activeModule === "motion"/);
  assert.match(page, /activeModule === "free-fall"/);
  assert.match(page, /activeModule === "two-dimensional"/);
  assert.match(page, /activeModule === "collisions"/);
  assert.match(page, /activeModule === "ballistic-pendulum"/);
  assert.match(page, /activeModule === "harmonic-motion"/);
  assert.match(page, /activeModule === "newton-book"/);
  assert.match(page, /FreeFallLab/);
  assert.match(page, /TwoDimensionalMotionLab/);
  assert.match(page, /CollisionLab/);
  assert.match(page, /BallisticPendulumLab/);
  assert.match(page, /HarmonicMotionLab/);
  assert.match(page, /NewtonBookLab/);
  assert.match(page, /Serbest düşme/);
  assert.match(page, /İki boyutta hareket/);
  assert.match(page, /Çarpışmalar/);
  assert.match(page, /Balistik sarkaç/);
  assert.match(page, /Basit harmonik hareket/);
  assert.match(page, /Newton’un hareket yasaları/);
  assert.match(page, /mechanics-motion\.webp/);
  assert.match(page, /mechanics-freefall\.webp/);
  assert.match(page, /mechanics-two-dimensional\.webp/);
  assert.match(page, /mechanics-collisions\.webp/);
  assert.match(page, /mechanics-ballistic\.webp/);
  assert.match(page, /mechanics-harmonic-motion\.webp/);
  assert.match(page, /free-force-motion-newton-book-v2\.webp/);
  assert.doesNotMatch(page, /vectors|VectorWorkspace|mechanics-vectors|Vektörler|TorqueLab|torque|Dönme dinamiği ve tork/i);
  assert.match(page, /MODÜL 01 · DENEY 1/);
  assert.match(page, /MODÜL 06 · DENEY 6/);
  assert.match(page, /MODÜL 07 · PROFESYONEL 3B KİTAP/);
});

test("ana portal iki çalışma yolu ve bütün gelecek alanları sunar", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");
  assert.match(page, /FİZİK ATÖLYESİ/);
  assert.match(page, /Fizik ezber değil/);
  assert.match(page, /Fizik Deney Setleri/);
  assert.match(page, /Serbest Deney ve Simülasyon/);
  assert.match(page, /EXPERIMENT_MODULES/);
  assert.match(page, /FREE_LAB_MODULES/);
  assert.match(page, /Mekanik/);
  assert.match(page, /Elektrik/);
  assert.match(page, /Dalgalar · Optik/);
  assert.match(page, /Modern Fizik/);
  assert.match(page, /Kuvvet ve Hareket/);
  assert.match(page, /Enerji/);
  assert.match(page, /Basınç ve Kaldırma Kuvveti/);
  assert.match(page, /Elektrik ve Manyetizma/);
  assert.match(page, /Isı ve Sıcaklık/);
  assert.match(page, /Dalgalar/);
  assert.match(page, /Optik/);
  assert.match(page, /portal-placeholder/);
  assert.match(page, /YAPIM AŞAMASINDA/);
  assert.match(page, /MechanicsLabHub/);
  assert.match(page, /ElectricityLabHub/);
  assert.match(page, /OpticsLabHub/);
  assert.match(page, /ModernPhysicsLabHub/);
  assert.match(page, /module\.key === "waves-optics"/);
  assert.match(page, /onNavigate\("waves-optics"\)/);
  assert.match(page, /module\.key === "modern-physics"/);
  assert.match(page, /onNavigate\("modern-physics"\)/);
  assert.match(page, /module\.key === "electricity"/);
  assert.match(page, /onNavigate\("electricity"\)/);
  assert.match(page, /2 deney açık/);
  assert.match(page, /3 deney açık/);
  assert.match(page, /<b>14<\/b>\s*çalışan deney/);
  assert.match(page, /7 çalışma açık/);
  assert.match(page, /fizik-atolyesi-hero\.png/);
  assert.match(page, /portal-guided-lab\.webp/);
  assert.match(page, /portal-free-simulation\.webp/);
  assert.match(page, /portal-mechanics\.webp/);
  assert.match(page, /portal-electricity\.webp/);
  assert.match(page, /portal-optics\.webp/);
  assert.match(page, /portal-modern\.webp/);
  assert.match(page, /free-force-motion-newton-book-v2\.webp/);
  assert.match(page, /free-modern\.webp/);
});

test("Fizik Atölyesi ana sayfası responsive portal görsellerini içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.portal-header\s*\{/);
  assert.match(css, /\.portal-hero\s*\{/);
  assert.match(css, /\.portal-image-frame\s*\{/);
  assert.match(css, /\.portal-path-grid\s*\{/);
  assert.match(css, /\.portal-path-visual img\s*\{/);
  assert.match(css, /\.portal-module-grid\s*\{/);
  assert.match(css, /\.portal-module-visual img\s*\{/);
  assert.match(css, /\.module-choice-visual img\s*\{/);
  assert.match(css, /\.electricity-choice-visual img\s*\{/);
  assert.match(css, /\.portal-visual-mechanics\s*\{/);
  assert.match(css, /\.portal-visual-electricity\s*\{/);
  assert.match(css, /\.portal-visual-waves\s*\{/);
  assert.match(css, /\.portal-visual-modern\s*,/);
  assert.match(css, /\.portal-empty-bench\s*\{/);
  assert.match(css, /\.portal-footer\s*\{/);
  assert.match(css, /@media \(max-width: 620px\)/);
});

test("Serbest Kuvvet ve Hareket alanı yedi deneyli 3B Newton kitabını açar", async () => {
  const portal = await readFile(new URL("app/page.tsx", projectRoot), "utf8");
  const page = await readFile(new URL("app/NewtonBookLab.tsx", projectRoot), "utf8");
  const packageJson = await readFile(new URL("package.json", projectRoot), "utf8");
  const builtAssets = await readdir(new URL("sunucu-paketi/assets", projectRoot));

  assert.match(portal, /lazy\(\(\) => import\("\.\/NewtonBookLab"\)\)/);
  assert.match(portal, /module\.key === "force-motion"/);
  assert.match(portal, /onNavigate\("force-motion"\)/);
  assert.match(portal, /3B Newton kitabı açık/);
  assert.match(portal, /newton-loading-screen/);
  assert.match(packageJson, /"three"/);
  assert.ok(builtAssets.some((asset) => /^NewtonBookLab-[^.]+\.js$/.test(asset)));

  assert.match(page, /NewtonHologramScene/);
  assert.match(page, /WebGLRenderer/);
  assert.match(page, /OrbitControls/);
  assert.match(page, /RoundedBoxGeometry/);
  assert.match(page, /RoomEnvironment/);
  assert.match(page, /createBusModel/);
  assert.match(page, /createDynamicsCart/);
  assert.match(page, /createCrashCarModel/);
  assert.match(page, /PBR MALZEME · FİZİKSEL IŞIK/);
  assert.match(page, /requestFullscreen/);
  assert.match(page, /"resultant"/);
  assert.match(page, /"inertia"/);
  assert.match(page, /"friction"/);
  assert.match(page, /"force-mass"/);
  assert.match(page, /"reaction"/);
  assert.match(page, /"momentum"/);
  assert.match(page, /"cradle"/);
  assert.match(page, /Bileşke kuvvet/);
  assert.match(page, /Eylemsizlik/);
  assert.match(page, /Sürtünme/);
  assert.match(page, /F = m · a/);
  assert.match(page, /Etki · tepki/);
  assert.match(page, /Çarpışma güvenliği/);
  assert.match(page, /Newton beşiği/);
  assert.match(page, /1\. YASA · EYLEMSİZLİK/);
  assert.match(page, /2\. YASA · KUVVET–KÜTLE–İVME/);
  assert.match(page, /3\. YASA · ETKİ–TEPKİ/);
  assert.match(page, /ΣF = m · a/);
  assert.match(page, /F_AB = −F_BA/);
  assert.match(page, /newton-law-card/);
  assert.match(page, /newton-intro-laws/);
  assert.match(page, /context === "mechanics"/);
  assert.match(page, /ÖNCE TAHMİN ET/);
  assert.match(page, /DENEYİ ÇALIŞTIR/);
  assert.match(page, /LiveGraph/);
  assert.match(page, /KANIT/);
});

test("3B Newton kitabı kaliteli sahne, kontrol paneli ve responsive düzen içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.newton-book-lab\s*\{/);
  assert.match(css, /\.newton-book-header\s*\{/);
  assert.match(css, /\.newton-chapter-strip\s*\{/);
  assert.match(css, /\.newton-book-workspace\s*\{/);
  assert.match(css, /\.newton-webgl-stage\s*\{/);
  assert.match(css, /\.newton-intro-overlay\s*\{/);
  assert.match(css, /\.newton-control-panel\s*\{/);
  assert.match(css, /\.newton-prediction\s*\{/);
  assert.match(css, /\.newton-live-graph\s*\{/);
  assert.match(css, /\.newton-book-footer\s*\{/);
  assert.match(css, /@media \(max-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 520px\)/);
});

test("Elektrik alanı TYMM uyumlu Ohm yasası deneyini sunar", async () => {
  const hub = await readFile(
    new URL("app/ElectricityLabHub.tsx", projectRoot),
    "utf8",
  );
  const page = await readFile(new URL("app/OhmLawLab.tsx", projectRoot), "utf8");
  assert.match(hub, /Elektrik deney setleri/);
  assert.match(hub, /Ohm yasası/);
  assert.match(hub, /OhmLawLab/);
  assert.match(hub, /electricity-ohm\.webp/);
  assert.match(hub, /electricity-resistors\.webp/);
  assert.match(page, /FİZ\.10\.3\.3/);
  assert.match(page, /application\/x-ohm-equipment/);
  assert.match(page, /0-20 V doğru akım güç kaynağı/);
  assert.match(page, /100 Ω ve 1000 Ω direnç panosu/);
  assert.match(page, /Doğru akım ampermetresi/);
  assert.match(page, /Doğru akım voltmetresi/);
  assert.match(page, /Yalıtımlı bağlantı kabloları/);
  assert.match(page, /ohm-lab-bench-real-v2\.webp/);
  assert.match(page, /ohm-power-supply-real-v2\.webp/);
  assert.match(page, /ohm-analog-meter-real-v2\.webp/);
  assert.match(page, /ohm-resistor-board-real-v2\.webp/);
  assert.match(page, /ohm-knife-switch-real-v2\.webp/);
  assert.match(page, /ohm-cable-kit-real-v2\.webp/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /REQUIRED_CONNECTIONS/);
  assert.match(page, /WIRING_STEPS/);
  assert.match(page, /source-positive/);
  assert.match(page, /"source-positive": \{ x: 11\.6, y: 55\.7/);
  assert.match(page, /"source-negative": \{ x: 9\.1, y: 55\.7/);
  assert.match(page, /Kaynak kırmızı giriş/);
  assert.match(page, /Kaynak siyah giriş/);
  assert.match(page, /context\.lineWidth = 4\.6/);
  assert.match(page, /ammeter-positive/);
  assert.match(page, /voltmeter-positive/);
  assert.match(page, /"resistor-left": \{ x: 36, y: 43/);
  assert.match(page, /"resistor-right": \{ x: 64, y: 43/);
  assert.match(page, /"switch-left": \{ x: 78, y: 49\.5/);
  assert.match(page, /"switch-right": \{ x: 94\.5, y: 49\.5/);
  assert.match(page, /Direnç kırmızı giriş/);
  assert.match(page, /Anahtar siyah giriş/);
  assert.match(page, /KABLO BAĞLANTI REHBERİ/);
  assert.match(page, /ÖNCE BU UÇ/);
  assert.match(page, /SONRA BU UÇ/);
  assert.match(page, /Gösterilen kabloyu bağla/);
  assert.match(page, /connectGuidedCable/);
  assert.match(page, /Güç kaynağını aç/);
  assert.match(page, /Devre anahtarını kapat/);
  assert.match(page, /ÖLÇÜME HAZIR/);
  assert.match(page, /WIRE_ROUTE_LEVELS/);
  assert.match(page, /Ampermetre neden seri, voltmetre neden direncin uçlarına paralel/);
  assert.match(page, /currentMilliamp: \(voltage \/ resistance\) \* 1000/);
  assert.match(page, /Gerilim-akım grafiği/);
  assert.match(page, /V = I · R/);
  assert.match(page, /TYMM · KISA DENEY RAPORU/);
  assert.match(page, /İDEAL ÖLÇÜM/);
  assert.doesNotMatch(page, /Kirchhoff|Math\.random|NOISE|hata|belirsiz/i);
});

test("Ohm düzeneği gerçekçi cihazlar, bağlantı uçları ve veri alanları içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.ohm-builder\s*\{/);
  assert.match(css, /\.ohm-equipment-panel,/);
  assert.match(css, /\.ohm-apparatus\s*\{/);
  assert.match(css, /\.ohm-real-bench-photo\s*\{/);
  assert.match(css, /\.ohm-real-power-photo,/);
  assert.match(css, /\.ohm-real-meter-photo/);
  assert.match(css, /\.ohm-real-resistor-photo/);
  assert.match(css, /\.ohm-real-switch-photo/);
  assert.match(css, /\.ohm-operation-guide\s*\{/);
  assert.match(css, /\.ohm-terminal\.connected::before/);
  assert.match(css, /\.ohm-power-supply\s*\{/);
  assert.match(css, /\.ohm-resistor-board\s*\{/);
  assert.match(css, /\.ohm-meter\s*\{/);
  assert.match(css, /\.ohm-circuit-switch\s*\{/);
  assert.match(css, /\.ohm-terminal\s*\{/);
  assert.match(css, /\.ohm-wiring-guide\s*\{/);
  assert.match(css, /\.ohm-guide-copy\s*\{/);
  assert.match(css, /\.ohm-terminal\.guide-start,/);
  assert.match(css, /@keyframes ohm-guide-pulse/);
  assert.match(css, /\.ohm-wire-canvas\s*\{/);
  assert.match(css, /\.ohm-control-grid\s*\{/);
  assert.match(css, /\.ohm-evidence-grid\s*\{/);
  assert.match(css, /\.ohm-graph-canvas\s*\{/);
  assert.match(css, /\.ohm-report\s*\{/);
});

test("Elektrik alanı dirençlerin seri ve paralel bağlanması deneyini sunar", async () => {
  const hub = await readFile(
    new URL("app/ElectricityLabHub.tsx", projectRoot),
    "utf8",
  );
  const page = await readFile(
    new URL("app/ResistorConnectionsLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(hub, /ResistorConnectionsLab/);
  assert.match(hub, /Dirençlerin bağlanması/);
  assert.match(hub, /FİZ\.10\.3\.4/);
  assert.match(page, /Elemanları yerleştir, seri ve paralel devreyi kendin kur/);
  assert.match(page, /Tut, sürükle ve tezgâha bırak/);
  assert.match(page, /application\/x-resistor-connections-equipment/);
  assert.match(page, /power-supply/);
  assert.match(page, /ammeter/);
  assert.match(page, /voltmeter/);
  assert.match(page, /resistor-a/);
  assert.match(page, /resistor-b/);
  assert.match(page, /switch/);
  assert.match(page, /cables/);
  assert.match(page, /ohm-lab-bench-real-v2\.webp/);
  assert.match(page, /ohm-power-supply-real-v2\.webp/);
  assert.match(page, /ohm-analog-meter-real-v2\.webp/);
  assert.match(page, /ohm-knife-switch-real-v2\.webp/);
  assert.match(page, /ohm-cable-kit-real-v2\.webp/);
  assert.match(page, /resistor-module-real-v1\.webp/);
  assert.match(page, /rcl-stage-mode-badge/);
  assert.match(page, /Güç kaynağını aç/);
  assert.match(page, /Devre anahtarını kapat/);
  assert.match(page, /context\.lineWidth = 4\.6/);
  assert.match(page, /SERIES_STEPS/);
  assert.match(page, /PARALLEL_STEPS/);
  assert.match(page, /A ile B'yi art arda bağla/);
  assert.match(page, /B kolunun girişini bağla/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /connectTerminal/);
  assert.match(page, /connectGuidedCable/);
  assert.match(page, /RESISTANCE_OPTIONS = \[100, 220, 330, 470\]/);
  assert.match(page, /resistorA \+ resistorB/);
  assert.match(page, /\(resistorA \* resistorB\) \/ \(resistorA \+ resistorB\)/);
  assert.match(page, /I A \/ I B/);
  assert.match(page, /V A \/ V B/);
  assert.match(page, /İdeal ölçüm tablosu/);
  assert.doesNotMatch(page, /SABİT DİRENÇ BAĞLANTI PANOSU|Array\.from\(\{ length: 11 \}|label="C"|label="D"/);
  assert.match(page, /TYMM · KISA DENEY RAPORU/);
  assert.doesNotMatch(page, /Kirchhoff|Math\.random|NOISE|hata|belirsiz/i);
});

test("direnç bağlantıları düzeneği sürüklenebilir gerçek devre elemanları ve ölçüm alanları içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.electricity-experiment-launcher\s*\{/);
  assert.match(css, /\.rcl-mode-selector\s*\{/);
  assert.match(css, /\.rcl-mode-buttons\s*\{/);
  assert.match(css, /\.rcl-builder\s*\{/);
  assert.match(css, /\.rcl-apparatus\s*\{/);
  assert.match(css, /\.rcl-resistor-unit\s*\{/);
  assert.match(css, /\.rcl-resistor-unit\.resistor-a\s*\{/);
  assert.match(css, /\.rcl-resistor-unit\.resistor-b\s*\{/);
  assert.match(css, /\.rcl-real-resistor\s*\{/);
  assert.match(css, /\.rcl-stage-mode-badge\s*\{/);
  assert.match(css, /\.rcl-control-grid\s*\{/);
  assert.match(css, /\.rcl-live-readings\s*\{/);
  assert.match(css, /\.rcl-data-card\s*\{/);
  assert.match(css, /\.ohm-equipment-panel,/);
  assert.match(css, /\.ohm-wiring-guide\s*\{/);
  assert.match(css, /\.ohm-terminal\s*\{/);
  assert.match(css, /\.ohm-power-supply\s*\{/);
  assert.match(css, /\.ohm-meter\s*\{/);
  assert.match(css, /\.ohm-circuit-switch\s*\{/);
});

test("Elektrik alanı TYMM uyumlu manyetik alan deneyini sunar", async () => {
  const hub = await readFile(
    new URL("app/ElectricityLabHub.tsx", projectRoot),
    "utf8",
  );
  const page = await readFile(
    new URL("app/MagneticFieldLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(hub, /MagneticFieldLab/);
  assert.match(hub, /Manyetik alan/);
  assert.match(hub, /electricity-magnetic-field\.webp/);
  assert.match(page, /application\/x-magnetic-field-equipment/);
  assert.match(page, /600 sarımlı ana bobin/);
  assert.match(page, /Yoklama kangalı/);
  assert.match(page, /Alternatif akım kaynağı/);
  assert.match(page, /AC multimetre/);
  assert.match(page, /CORE_SETUP/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /positionFromPointer/);
  assert.match(page, /Bobini ters çevir/);
  assert.match(page, /Güç devresi/);
  assert.match(page, /Ölçüm devresi/);
  assert.match(page, /B ALAN YÖNÜ/);
  assert.match(page, /YOKLAMA KANGALI ÖLÇÜMÜ/);
  assert.match(page, /magnetic-solenoid-real-v2\.webp/);
  assert.match(page, /magnetic-probe-coil-real-v1\.webp/);
  assert.match(page, /magnetic-ac-meter-real-v1\.webp/);
  assert.match(page, /ohm-lab-bench-real-v2\.webp/);
  assert.match(page, /mfl-cables-svg/);
  assert.match(page, /mfl-coil-pole/);
  assert.match(page, /mfl-cable drive red/);
  assert.match(page, /mfl-cable measure red/);
  assert.match(page, /mfl-cable bridge amber/);
  assert.match(page, /Kaynak → ana bobin → ikinci bobin → kaynak/);
  assert.match(page, /secondRedX/);
  assert.match(page, /secondBlackX/);
  assert.match(page, /Manyetik alan – konum/);
  assert.match(page, /Gösterge gerilimi – akım/);
  assert.match(page, /Ölçümü kaydet/);
  assert.match(page, /TYMM KISA DENEY RAPORU/);
  assert.match(page, /İDEAL ÖLÇÜM/);
  assert.match(page, /same/);
  assert.match(page, /opposite/);
  assert.doesNotMatch(page, /Math\.random|NOISE|belirsiz|hata/i);
});

test("manyetik alan düzeneği gerçekçi ray, bobin, yoklama kangalı ve grafikler içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.magnetic-field-lab\s*\{/);
  assert.match(css, /\.mfl-builder\s*\{/);
  assert.match(css, /\.mfl-equipment-panel,/);
  assert.match(css, /\.mfl-stage\s*\{/);
  assert.match(css, /\.mfl-rail\s*\{/);
  assert.match(css, /\.mfl-power-supply\s*\{/);
  assert.match(css, /\.mfl-solenoid\s*\{/);
  assert.match(css, /\.mfl-probe\s*\{/);
  assert.match(css, /\.mfl-multimeter\s*\{/);
  assert.match(css, /\.mfl-cables\s*\{/);
  assert.match(css, /\.mfl-cable\.drive\s*\{/);
  assert.match(css, /\.mfl-cable\.measure\s*\{/);
  assert.match(css, /\.mfl-connection-guide\s*\{/);
  assert.match(css, /\.mfl-coil-pole\s*\{/);
  assert.match(css, /\.mfl-axis-arrows\s*\{/);
  assert.match(css, /\.mfl-field-visual\s*\{/);
  assert.match(css, /\.mfl-bench-photo\s*\{/);
  assert.match(css, /\.mfl-equipment-icon\.has-photo/);
  assert.match(css, /\.mfl-control-grid\s*\{/);
  assert.match(css, /\.mfl-graph-grid\s*\{/);
  assert.match(css, /\.mfl-graph-canvas\s*\{/);
  assert.match(css, /\.mfl-report\s*\{/);
});

test("Dalgalar-Optik alanı aynaları ve mercekleri tek kurulabilir düzende birleştirir", async () => {
  const hub = await readFile(new URL("app/OpticsLabHub.tsx", projectRoot), "utf8");
  const page = await readFile(new URL("app/UnifiedOpticsLab.tsx", projectRoot), "utf8");
  assert.match(hub, /UnifiedOpticsLab/);
  assert.match(hub, /Aynalar ve mercekler/);
  assert.match(hub, /activeTopic === "optical-bench" && <UnifiedOpticsLab/);
  assert.match(hub, /optics-universal-holder-real-v2\.webp/);
  assert.doesNotMatch(hub, /PlaneMirrorLab|ConcaveMirrorLab|ConvexMirrorLab|LensLab|activeMirror/);
  assert.match(page, /application\/x-unified-optics-equipment/);
  assert.match(page, /Düzlem ayna/);
  assert.match(page, /Çukur ayna/);
  assert.match(page, /Tümsek ayna/);
  assert.match(page, /İnce kenarlı mercek/);
  assert.match(page, /Kalın kenarlı mercek/);
  assert.match(page, /Cetvelli optik ray/);
  assert.match(page, /Işık kaynağı/);
  assert.match(page, /Üniversal taşıyıcı/);
  assert.match(page, /Ayaklı düzlem ayna/);
  assert.match(page, /PLANE_EQUIPMENT/);
  assert.match(page, /selectedElement === "plane" \? PLANE_EQUIPMENT : CARRIER_EQUIPMENT/);
  assert.match(page, /Düzlem ayna kendi dik ayağıyla raya takılır/);
  assert.match(page, /DÜZ YÜZEY/);
  assert.match(page, /İÇE KAVİSLİ/);
  assert.match(page, /DIŞA TÜMSEK/);
  assert.match(page, /Beyaz görüntü ekranı/);
  assert.match(page, /onDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /moveFromPointer/);
  assert.match(page, /Kurulu parçaya yeniden basarsan onu çıkarırsın/);
  assert.match(page, /Tek ışının yolu/);
  assert.match(page, /Görüntü oluşumu/);
  assert.match(page, /GELEN IŞIN/);
  assert.match(page, /YANSIYAN IŞIN/);
  assert.match(page, /KIRILAN IŞIN/);
  assert.match(page, /ÇARPMA NOKTASI/);
  assert.match(page, /i = \$\{angle\}°/);
  assert.match(page, /r = \$\{angle\}°/);
  assert.match(page, /incoming\.x - 2 \* dot \* normal\.x/);
  assert.match(page, /1 \/ signedFocal - 1 \/ objectDistance/);
  assert.match(page, /Gerçek görüntü beyaz ekranda net olarak yakalandı/);
  assert.match(page, /Bu görüntü sanaldır; beyaz ekrana düşürülemez/);
  assert.match(page, /TYMM KISA DENEY RAPORU/);
  assert.match(page, /İDEAL SİSTEM/);
  assert.doesNotMatch(page, /Math\.random|NOISE|hata|belirsiz/i);
});

test("birleşik optik laboratuvarı doğru oturan teknik ayna çizimleri ve responsive sahne içerir", async () => {
  const page = await readFile(new URL("app/UnifiedOpticsLab.tsx", projectRoot), "utf8");
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  for (const asset of [
    "optics-unified-laser-real-v2.webp",
    "optics-universal-holder-real-v2.webp",
    "optics-plane-mirror-drawing-v3.svg",
    "optics-concave-mirror-drawing-v3.svg",
    "optics-convex-mirror-drawing-v3.svg",
    "optics-convex-lens-cell-real-v1.webp",
    "optics-concave-lens-cell-real-v1.webp",
    "optics-screen-real-v2.webp",
    "optics-rail-real-v1.webp",
  ]) {
    assert.match(page, new RegExp(asset.replace(".", "\\.")));
    await access(new URL(`public/${asset}`, projectRoot));
  }
  assert.match(css, /\.uol-lab\s*\{/);
  assert.match(css, /\.uol-element-grid\s*\{/);
  assert.match(css, /\.uol-workspace\s*\{/);
  assert.match(css, /\.uol-equipment-list\s*\{/);
  assert.match(css, /\.uol-stage\s*\{/);
  assert.match(css, /\.uol-ray-canvas\s*\{/);
  assert.match(css, /\.uol-source\s*\{/);
  assert.match(css, /\.uol-holder\s*\{/);
  assert.match(css, /\.uol-insert\s*\{/);
  assert.match(css, /\.uol-insert\.concave,/);
  assert.match(css, /\.uol-plane-stand\s*\{/);
  assert.match(css, /\.uol-plane-surface\s*\{/);
  assert.match(css, /\.uol-plane-base\s*\{/);
  assert.match(css, /\.uol-curvature-tag\s*\{/);
  assert.match(css, /\.uol-hit-target\s*\{/);
  assert.match(css, /\.uol-screen\s*\{/);
  assert.match(css, /\.uol-mode-switch\s*\{/);
  assert.match(css, /\.uol-control-grid\s*\{/);
  assert.match(css, /\.uol-report-grid\s*\{/);
  assert.match(css, /@media \(max-width: 620px\)/);
});

test("Dalgalar-Optik alanı kırılma ve prizma deneyini TYMM çıktılarıyla sunar", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  const hub = await readFile(
    new URL("app/OpticsLabHub.tsx", projectRoot),
    "utf8",
  );
  const page = await readFile(
    new URL("app/PrismLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(hub, /Dalgalar - Optik deney setleri/);
  assert.match(hub, /Kırılma ve prizma/);
  assert.match(hub, /PrismLab/);
  assert.doesNotMatch(hub, /RippleTankLab|Dalga leğeni|activeTopic === "waves"/);
  assert.match(page, /FİZ\.11\.4\.5/);
  assert.match(page, /FİZ\.11\.4\.8/);
  assert.match(page, /application\/x-optics-equipment/);
  assert.match(page, /SETUP_ORDER/);
  assert.match(page, /Cetvelli metal optik ray ve ayakları/);
  assert.match(page, /Yüksekliği ayarlanabilir tek renkli lazer/);
  assert.match(page, /Açı ölçekli döner optik tabla/);
  assert.match(page, /Milimetre ölçekli beyaz ışın ekranı/);
  assert.match(page, /1,50 cm kalınlıklı paralel yüzlü cam blok/);
  assert.match(page, /60 derece tepe açılı cam prizma/);
  assert.match(page, /İkizkenar dik üçgen cam prizma/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /isDragOver/);
  assert.match(page, /Kalan parçaları istediğin sırayla ekleyebilirsin/);
  assert.match(page, /OpticsRayCanvas/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /REFRACTION_ANGLES = \[0, 15, 30, 45, 60\]/);
  assert.match(page, /DEVIATION_ANGLES = \[30, 40, 50, 60\]/);
  assert.match(page, /INTERNAL_ANGLES = \[35, 40, 42, 45, 50\]/);
  assert.match(page, /LIGHT_COLORS/);
  assert.match(page, /Kırmızı/);
  assert.match(page, /Yeşil/);
  assert.match(page, /Mavi/);
  assert.match(page, /refractiveIndex: 1\.51432/);
  assert.match(page, /refractiveIndex: 1\.51872/);
  assert.match(page, /refractiveIndex: 1\.52238/);
  assert.match(page, /SLAB_THICKNESS_CM = 1\.5/);
  assert.match(page, /PRISM_APEX_ANGLE = 60/);
  assert.match(page, /Math\.asin/);
  assert.match(page, /Cam blokta kırılma/);
  assert.match(page, /Prizmada sapma/);
  assert.match(page, /Prizmada tam yansıma/);
  assert.match(page, /Hipotezim/);
  assert.match(page, /Işını göndermeden önce kısa bir hipotez yaz/);
  assert.match(page, /Lazeri aç/);
  assert.match(page, /Optik daireyi sıfırla/);
  assert.match(page, /IŞINI GÖNDER VE ÖLÇ/);
  assert.match(page, /Işık rengi/);
  assert.match(page, /Ekrandaki gözlem/);
  assert.match(page, /Gözlem özetini göster/);
  assert.match(page, /rayPolygonIntersection/);
  assert.match(page, /refractRay/);
  assert.match(page, /reflectRay/);
  assert.match(page, /requestedRightPrismRotation/);
  assert.match(page, /clamp\(requestedRightPrismRotation, -5\.5, 5\.5\)/);
  assert.match(page, /distance > 0\.2/);
  assert.match(page, /TY \$\{reflectedCount\}/);
  assert.match(page, /--optics-sample-angle/);
  assert.match(page, /GERİ DÖNÜŞ EKRANI/);
  assert.doesNotMatch(page, /İç açılar r₁ \/ r₂/);
  assert.doesNotMatch(page, /n pleksiglas/);
  assert.match(page, /KISA DENEY RAPORU/);
  assert.match(page, /LAZER GÜVENLİĞİ/);
  assert.match(css, /optics-laser-real-v1\.webp/);
  assert.match(css, /optics-rail-real-v1\.webp/);
  assert.match(css, /optics-rotary-table-real-v1\.webp/);
  assert.match(css, /optics-screen-real-v2\.webp/);
  assert.match(css, /optics-glass-slab-real-v1\.webp/);
  assert.match(css, /optics-equilateral-prism-real-v1\.webp/);
  assert.match(css, /optics-right-prism-real-v1\.webp/);
  assert.match(css, /Kırılma ve prizma · gerçek laboratuvar donanımı/);
  assert.match(css, /\.optics-apparatus\.mode-deviation \.optics-screen/);
  assert.match(css, /\.optics-apparatus\.mode-total-reflection \.optics-screen:not\(\.return-screen\)/);
});

test("optik düzeneği gerçekçi ray, lazer, açı tablası, ekran ve cam elemanları gösterir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.optics-workspace\s*\{/);
  assert.match(css, /\.optics-equipment-panel\s*,/);
  assert.match(css, /\.optics-stage\.drag-over\s*\{/);
  assert.match(css, /\.optics-apparatus\s*\{/);
  assert.match(css, /\.optics-bench\s*\{/);
  assert.match(css, /\.optics-rail\s*\{/);
  assert.match(css, /\.optics-laser\s*\{/);
  assert.match(css, /\.optics-rotary-table\s*\{/);
  assert.match(css, /\.optics-degree-ring\s*\{/);
  assert.match(css, /\.optics-screen\s*\{/);
  assert.match(css, /\.screen-face\s*\{/);
  assert.match(css, /transform:\s*rotate\(var\(--optics-table-angle\)\)/);
  assert.match(css, /\.optics-screen\.return-screen\s*\{/);
  assert.match(css, /\.optics-color-options\s*\{/);
  assert.match(css, /\.optics-slab,/);
  assert.match(css, /\.optics-equilateral-prism\s*\{/);
  assert.match(css, /\.optics-right-prism\s*\{/);
  assert.match(css, /\.optics-ray-canvas\s*\{/);
  assert.match(css, /\.optics-data-table\s*\{/);
  assert.match(css, /\.optics-analysis-grid\s*\{/);
  assert.match(css, /\.optics-report\s*\{/);
});

test("eski ayrı ayna ve mercek sayfaları optik menüsünden kaldırılmıştır", async () => {
  const hub = await readFile(new URL("app/OpticsLabHub.tsx", projectRoot), "utf8");
  assert.match(hub, /Aynalar ve mercekler/);
  assert.match(hub, /UnifiedOpticsLab/);
  assert.match(hub, /activeTopic === "optical-bench"/);
  assert.doesNotMatch(
    hub,
    /PlaneMirrorLab|ConcaveMirrorLab|ConvexMirrorLab|LensLab|activeMirror|mirror-type-launcher/,
  );
});

test("Modern Fizik alanı gerçek fotoelektrik düzeneği ve TYMM deney akışını sunar", async () => {
  const hub = await readFile(
    new URL("app/ModernPhysicsLabHub.tsx", projectRoot),
    "utf8",
  );
  const page = await readFile(
    new URL("app/PhotoelectricLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(hub, /Modern Fizik deney setleri/);
  assert.match(hub, /Fotoelektrik etki/);
  assert.match(hub, /PhotoelectricLab/);
  assert.match(page, /FİZ\.12\.4\.1/);
  assert.match(page, /FİZ\.12\.4\.2/);
  assert.match(page, /FİZ\.12\.4\.3/);
  assert.match(page, /application\/x-photoelectric-equipment/);
  assert.match(page, /Cıva ışık kaynağı/);
  assert.match(page, /Kırınım ağı/);
  assert.match(page, /h\/e aparatı/);
  assert.match(page, /Dijital multimetre/);
  assert.match(page, /Renk filtresi/);
  assert.match(page, /Geçirgenlik filtresi/);
  assert.match(page, /pe-detector-head/);
  assert.match(page, /h\/e KONTROL ÜNİTESİ/);
  assert.match(page, /YOĞUNLUK FİLTRESİ/);
  assert.match(page, /pe-cable-signal/);
  assert.match(page, /pe-source-beam/);
  assert.match(page, /pe-path-guide/);
  assert.match(page, /pe-wiring/);
  assert.match(page, /photoelectric-mercury-lamp-v2\.webp/);
  assert.match(page, /photoelectric-detector-v2\.webp/);
  assert.match(page, /photoelectric-he-unit-v2\.webp/);
  assert.match(page, /photoelectric-multimeter-v2\.webp/);
  assert.match(page, /pe-zone-measurement/);
  assert.match(page, /pe-detector-align-knob/);
  assert.match(page, /pe-apparatus-discharge-button/);
  assert.match(page, /--pe-detector-shift/);
  assert.match(page, /shift: 12/);
  assert.doesNotMatch(page, /shift: 37/);
  assert.match(page, /kind !== nextEquipment/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /requestAnimationFrame/);
  assert.doesNotMatch(page, /settling|Math\.sin\(progress \* Math\.PI \* 8\)/);
  assert.match(page, /BOŞALT düğmesine bas/);
  assert.match(page, /Çizgi spektrumu hazır/);
  assert.match(page, /PLANCK = 6\.62607015e-34/);
  assert.match(page, /WORK_FUNCTION_EV = 1\.412/);
  assert.match(page, /wavelength: 578/);
  assert.match(page, /wavelength: 546\.074/);
  assert.match(page, /wavelength: 435\.835/);
  assert.match(page, /wavelength: 404\.656/);
  assert.match(page, /wavelength: 365\.483/);
  assert.match(page, /stoppingVoltageFor/);
  assert.match(page, /photocurrentFor/);
  assert.match(page, /linearRegression/);
  assert.match(page, /Şiddet - durdurma gerilimi/);
  assert.match(page, /Frekans - durdurma gerilimi/);
  assert.match(page, /Planck sabiti ve yüzey/);
  assert.match(page, /Güneş paneli/);
  assert.match(page, /Fotoselli kapı/);
  assert.match(page, /Duman dedektörü/);
  assert.match(page, /TYMM · AÇIK UÇLU ÇIKIŞ KARTI/);
});

test("fotoelektrik tezgâhı gerçekçi cihaz, tayf, bağlantı ve ölçüm görsellerini içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.photoelectric-lab-section\s*\{/);
  assert.match(css, /\.pe-builder\s*\{/);
  assert.match(css, /\.pe-equipment-panel\s*\{/);
  assert.match(css, /\.pe-stage\.drag-over\s*\{/);
  assert.match(css, /\.pe-apparatus\s*\{/);
  assert.match(css, /\.pe-mercury-lamp\s*\{/);
  assert.match(css, /\.pe-grating\s*\{/);
  assert.match(css, /\.pe-spectrum\s*,/);
  assert.match(css, /\.pe-detector-head\s*\{/);
  assert.match(css, /\.pe-he-apparatus\s*\{/);
  assert.match(css, /\.pe-photodiode-window\s*\{/);
  assert.match(css, /\.pe-battery-test\s*\{/);
  assert.match(css, /\.pe-multimeter\s*\{/);
  assert.match(css, /\.pe-cable\s*\{/);
  assert.match(css, /\.pe-wiring\s*\{/);
  assert.match(css, /\.pe-source-beam\s*\{/);
  assert.match(css, /\.pe-filter-post\s*\{/);
  assert.match(css, /\.pe-zone-label\s*\{/);
  assert.match(css, /\.pe-mercury-lamp > img/);
  assert.match(css, /\.pe-detector-align-knob/);
  assert.match(css, /\.pe-apparatus-discharge-button/);
  assert.match(css, /translateY\(var\(--pe-detector-shift\)\)/);
  assert.match(css, /\.pe-electron-stream\s*\{/);
  assert.match(css, /@keyframes pe-electron-flight/);
  assert.match(css, /\.pe-graph-canvas\s*\{/);
  assert.match(css, /\.pe-data-table\s*\{/);
  assert.match(css, /\.pe-life-cards\s*\{/);
  assert.match(css, /\.pe-report\s*\{/);
});

test("Modern Fizik alanı sade CERN hızlandırıcı ve büyütülmüş ATLAS deneyini sunar", async () => {
  const hub = await readFile(
    new URL("app/ModernPhysicsLabHub.tsx", projectRoot),
    "utf8",
  );
  const page = await readFile(
    new URL("app/CernAcceleratorLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(hub, /CernAcceleratorLab/);
  assert.match(hub, /CERN parçacık hızlandırıcı/);
  assert.match(hub, /activeExperiment === "cern"/);
  assert.match(page, /H⁻ iyon kaynağı/);
  assert.match(page, /Linac4/);
  assert.match(page, /PS Booster/);
  assert.match(page, /Proton Synchrotron/);
  assert.match(page, /Super Proton Synchrotron/);
  assert.match(page, /LHC halkası ve mıknatıslar/);
  assert.match(page, /Süperiletken mıknatıslar/);
  assert.match(page, /ATLAS dedektörü/);
  assert.match(page, /160 MeV/);
  assert.match(page, /2 GeV/);
  assert.match(page, /26 GeV/);
  assert.match(page, /450 GeV/);
  assert.match(page, /6,8 TeV \/ demet/);
  assert.match(page, /application\/x-fizik-atolyesi-cern-part/);
  assert.match(page, /onDragStart/);
  assert.match(page, /onDrop/);
  assert.match(page, /accelerateBeams/);
  assert.match(page, /collideBeams/);
  assert.match(page, /CernAcceleratorCanvas/);
  assert.match(page, /CernAtlasCanvas/);
  assert.match(page, /CernAtlasZoom/);
  assert.match(page, /HALKADA DOLAŞAN/);
  assert.match(page, /Proton p⁺ = u \+ u \+ d/);
  assert.match(page, /u \+ u \+ d/);
  assert.match(page, /Enerji ne işe yarar\?/);
  assert.match(page, /yeni parçacıkların[\s\S]*kütlesine ve hareketine/);
  assert.match(page, /ENERJİYLE NE DEĞİŞTİ\?/);
  assert.match(page, /trackBend/);
  assert.match(page, /signalRadius/);
  assert.match(page, /flashRadius/);
  assert.match(page, /İzler en az kıvrılır/);
  assert.match(page, /ATLAS’IN İÇİNDE/);
  assert.match(page, /Büyütülmüş çarpışma görüntüsü/);
  assert.match(page, /Gerçek dedektör katmanları/);
  assert.match(page, /Bir katmana dokun/);
  assert.match(page, /highlightedLayer/);
  assert.match(page, /Hızlandırıcı çalışma durumu/);
  assert.match(page, /Yüksek vakum/);
  assert.match(page, /1,9 K/);
  assert.match(page, /İz sensörü/);
  assert.match(page, /Enerji sensörü/);
  assert.match(page, /Dış sensör/);
  assert.match(page, /Elektron ve pozitron/);
  assert.match(page, /Foton/);
  assert.match(page, /Müon ve antimüon/);
  assert.match(page, /Yüklü pion/);
  assert.match(page, /Nötron/);
  assert.match(page, /Tau ve antitau/);
  assert.match(page, /Nötrino/);
  assert.match(page, /W bozonu/);
  assert.match(page, /Z bozonu/);
  assert.match(page, /Higgs bozonu/);
  assert.match(page, /minimumEnergy: "low"/);
  assert.match(page, /minimumEnergy: "medium"/);
  assert.match(page, /minimumEnergy: "high"/);
  assert.match(page, /particlesAtEnergy/);
  assert.match(page, /BU ENERJİDE İNCELENEN TÜM PARÇACIKLAR/);
  assert.match(page, /Bir parçacığa dokun/);
  assert.match(page, /handleCanvasClick/);
  assert.match(page, /atlasParticleHitAreas/);
  assert.match(page, /STANDART MODEL · BASİT BİLGİ KARTI/);
  assert.match(page, /Temel parçacık mı\?/);
  assert.match(page, /Doğrudan sinyal/);
  assert.match(page, /Başka sinyallerden çıkarım/);
  assert.match(page, /TEMEL PARÇACIK NEDİR\?/);
  assert.match(page, /Daha küçük bir bileşeni bilinmeyen parçacık/);
  assert.match(page, /Temel değil/);
  assert.match(page, /Maddeyi oluşturan leptonlardan biridir/);
  assert.match(page, /Işığı ve elektromanyetik etkileşimi taşır/);
  assert.doesNotMatch(page, /jet|Üst kuark|İDEAL OLAY KAYITLARI/i);
  assert.doesNotMatch(page, /Math\.random|hata|belirsiz/i);
});

test("CERN laboratuvarı sade halka, büyüyen ATLAS ekranı ve responsive düzen içerir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.modern-experiment-switch\s*\{/);
  assert.match(css, /\.cern-lab\s*\{/);
  assert.match(css, /\.cern-builder\s*\{/);
  assert.match(css, /\.cern-builder\.atlas-mode\s*\{/);
  assert.match(css, /\.cern-parts-panel\s*\{/);
  assert.match(css, /\.cern-stage\.drag-over\s*\{/);
  assert.match(css, /\.cern-accelerator-canvas\s*,[\s\S]*\.cern-atlas-canvas/);
  assert.match(css, /\.cern-simple-console\s*\{/);
  assert.match(css, /\.cern-energy-choice\s*>\s*div\s*\{/);
  assert.match(css, /\.cern-energy-bars\s*\{/);
  assert.match(css, /\.cern-event-choice\s*>\s*div\s*\{/);
  assert.match(css, /\.cern-particle-primer\s*\{/);
  assert.match(css, /\.cern-atlas-zoom\s*\{/);
  assert.match(css, /\.cern-atlas-energy\s*\{/);
  assert.match(css, /\.cern-atlas-layout\s*\{/);
  assert.match(css, /\.cern-detector-guide\s*\{/);
  assert.match(css, /\.cern-collision-result\s*\{/);
  assert.match(css, /\.cern-energy-particle-preview\s*>\s*div\s*\{/);
  assert.match(css, /\.cern-particle-explorer\s*\{/);
  assert.match(css, /\.cern-detected-particles\s*,/);
  assert.match(css, /\.cern-standard-card\s*\{/);
  assert.match(css, /\.cern-detector-answer\s*\{/);
  assert.match(css, /cern-lhc-tunnel-real-v2\.webp/);
  assert.match(css, /cern-atlas-detector-real-v2\.webp/);
  assert.match(css, /\.cern-machine-readouts\s*\{/);
  assert.match(css, /\.cern-detector-guide button\s*\{/);
  assert.match(css, /\.cern-layer-instruction\s*\{/);
  assert.match(css, /@media \(max-width: 600px\)/);
});

test("balistik sarkaç modülü PDF düzeneğiyle kurulabilir ve iki yöntemle hız bulur", async () => {
  const page = await readFile(
    new URL("app/BallisticPendulumLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(page, /FİZ\.12\.1\.4/);
  assert.match(page, /FİZ\.12\.2\.5/);
  assert.match(page, /SETUP_ORDER/);
  assert.match(page, /Alüminyum taşıyıcı gövde ve taban/);
  assert.match(page, /Üç kademeli yatay bilye fırlatıcı/);
  assert.match(page, /Dijital ilk hız sensörü/);
  assert.match(page, /Bilye yakalayıcılı sarkaç mekanizması/);
  assert.match(page, /Yarım daire açıölçer/);
  assert.match(page, /Maksimum açıyı tutan gösterge çubuğu/);
  assert.match(page, /Üç bilyeli saklama tüpü/);
  assert.match(page, /Sarkaç boyu için metal cetvel/);
  assert.match(page, /application\/x-ballistic-equipment/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /Küçük çelik bilye/);
  assert.match(page, /Büyük çelik bilye/);
  assert.match(page, /Ahşap bilye/);
  assert.match(page, /Bilyeyi merkezle/);
  assert.match(page, /Göstergeyi 0° konumuna getir/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /Tam esnek olmayan çarpışma/);
  assert.match(page, /Sarkaç yükseliyor/);
  assert.match(page, /sensorSpeed/);
  assert.match(page, /calculatedSpeed/);
  assert.doesNotMatch(page, /difference|Yüzdesel fark/);
  assert.match(page, /Üç bilye × üç kademe/);
  assert.match(page, /Sade analizi göster/);
  assert.doesNotMatch(page, /launcherAngle|Namlu doğrultusu|Namlu açısı/);
  assert.match(page, /pendulumVisualLength/);
  assert.match(page, /compactLaunchAxis/);
  assert.match(page, /onLauncherPointerDown/);
  assert.match(page, /onLauncherPointerMove/);
  assert.match(page, /role=\{canAdjustHeight \? "slider"/);
  assert.match(page, /Namluyu sahnede yukarı–aşağı sürükle/);
  assert.match(page, /BallisticMotionOverlay/);
  assert.match(page, /bilyenin momentumu/);
  assert.match(page, /bilye yakalayıcıda kaldı/);
  assert.match(page, /Açı → yükselme/);
  assert.match(page, /Momentum → ilk hız/);
  assert.match(page, /Hız arttıkça açı nasıl değişiyor/);
  assert.match(page, /Sensör ve sarkaçtan bulunan hız/);
  assert.match(page, /İdeal sistemde sensör ve sarkaç modeli aynı ilk hız değerini verir/);
  assert.match(page, /KISA DENEY RAPORU/);
});

test("deney seçilince kart listesi kapanır ve yalnızca seçilen deney açılır", async () => {
  const [mechanics, electricity, optics, modern, css] = await Promise.all([
    readFile(new URL("app/MechanicsLabHub.tsx", projectRoot), "utf8"),
    readFile(new URL("app/ElectricityLabHub.tsx", projectRoot), "utf8"),
    readFile(new URL("app/OpticsLabHub.tsx", projectRoot), "utf8"),
    readFile(new URL("app/ModernPhysicsLabHub.tsx", projectRoot), "utf8"),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  assert.match(
    mechanics,
    /!activeModule && \(\s*<section className="module-launcher"/,
  );
  assert.match(mechanics, /activeModule \? \(\) => setActiveModule\(null\) : onBack/);
  assert.match(mechanics, /id="mekanik-deney"/);
  assert.match(mechanics, /window\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);

  assert.match(electricity, /!activeExperiment && <section className="electricity-experiment-launcher"/);
  assert.match(electricity, /activeExperiment \? \(\) => setActiveExperiment\(null\) : onBack/);
  assert.match(electricity, /id="elektrik-deney"/);
  assert.match(electricity, /window\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);

  assert.match(optics, /!activeTopic && <section className="optics-topic-launcher"/);
  assert.match(optics, /activeTopic === "optical-bench" && <UnifiedOpticsLab/);
  assert.match(optics, /const experimentIsOpen/);
  assert.match(optics, /const goBack/);
  assert.match(optics, /id="optik-deney"/);
  assert.match(optics, /window\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);

  assert.match(modern, /useState<"photoelectric" \| "cern" \| null>\(null\)/);
  assert.match(modern, /!activeExperiment && <div className="modern-experiment-switch"/);
  assert.match(modern, /activeExperiment === "photoelectric" && <PhotoelectricLab/);
  assert.match(modern, /activeExperiment === "cern" && <CernAcceleratorLab/);
  assert.match(modern, /id="modern-deney"/);
  assert.match(modern, /window\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);

  for (const hub of [mechanics, electricity, optics, modern]) {
    assert.match(hub, /Deneylere dön/);
    assert.match(hub, /focused-experiment-view/);
  }
  assert.match(css, /\.site-header\.experiment-focus-header\s*\{/);
  assert.match(css, /\.mechanics-back-button\.experiment-selection-back\s*\{/);
  assert.match(css, /\.focused-experiment-view\s*\{/);
});

test("balistik sarkaç düzeneği fırlatıcı, açıölçer ve yakalayıcıyı gerçekçi sahnede gösterir", async () => {
  const page = await readFile(new URL("app/BallisticPendulumLab.tsx", projectRoot), "utf8");
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(page, /ballistic-frame-protractor-v2\.webp/);
  assert.match(page, /twod-launcher-barrel-v2\.webp/);
  assert.match(page, /twod-speed-sensor-v2\.webp/);
  assert.match(page, /ballistic-pendulum-assembly-v2\.webp/);
  assert.match(page, /freefall-equipment-ruler\.webp/);
  await access(new URL("public/ballistic-frame-protractor-v2.webp", projectRoot));
  await access(new URL("public/ballistic-pendulum-assembly-v2.webp", projectRoot));
  assert.match(css, /\.ballistic-apparatus\s*\{/);
  assert.match(css, /\.ballistic-workbench\s*\{/);
  assert.match(css, /\.ballistic-frame\s*\{/);
  assert.match(css, /\.ballistic-launcher\s*\{/);
  assert.match(css, /\.ballistic-launcher-mount\s*\{/);
  assert.match(css, /\.ballistic-speed-sensor\s*\{/);
  assert.match(css, /\.ballistic-sensor-cable\s*\{/);
  assert.match(css, /\.ballistic-motion-overlay\s*\{/);
  assert.match(css, /--launch-axis/);
  assert.match(css, /\.ballistic-height-grip\s*\{/);
  assert.match(css, /\.ballistic-apparatus\.height-adjusting/);
  assert.match(css, /\.ballistic-protractor\s*\{/);
  assert.match(css, /\.ballistic-pendulum\s*\{/);
  assert.match(css, /\.pendulum-catcher\s*\{/);
  assert.match(css, /\.ballistic-indicator\s*\{/);
  assert.match(css, /\.ballistic-ball-rack\s*\{/);
  assert.match(css, /\.ballistic-ruler\s*\{/);
  assert.match(css, /\.ballistic-frame-photo\s*\{/);
  assert.match(css, /\.ballistic-launcher-photo\s*\{/);
  assert.match(css, /\.ballistic-sensor-console-photo\s*\{/);
  assert.match(css, /\.ballistic-pendulum-photo\s*\{/);
  assert.match(css, /\.ballistic-ruler-photo\s*\{/);
  assert.match(css, /\.ballistic-data-table\s*\{/);
  assert.match(css, /\.ballistic-analysis-grid\s*\{/);
  assert.match(css, /\.ballistic-graphs\s*\{/);
  assert.match(css, /\.ballistic-report\s*\{/);
});

test("basit harmonik hareket modülü iki gerçek deney ve ideal ölçüm sunar", async () => {
  const page = await readFile(
    new URL("app/HarmonicMotionLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(page, /TYMM · 12\. SINIF/);
  assert.match(page, /Basit Harmonik Hareket/);
  assert.match(page, /Yay–kütle sistemi/);
  assert.match(page, /Basit sarkaç/);
  assert.match(page, /SimplePendulumLab/);
  assert.match(page, /harmonic-tab-spring-real-v2\.png/);
  assert.match(page, /harmonic-tab-pendulum-real-v2\.png/);
  assert.match(page, /SpringCoil/);
  assert.match(page, /shm-retort-stand-real-v2\.png/);
  assert.match(page, /createLinearGradient/);
  assert.match(page, /shm-mass-hanger-real-v2\.png/);
  assert.match(page, /shm-optical-motion-sensor-real-v4\.png/);
  assert.match(page, /motion-lab-bench-v3\.webp/);
  assert.match(page, /motion-equipment-timer\.webp/);
  assert.match(page, /freefall-equipment-ruler\.webp/);
  assert.match(page, /const oscillatorOffsetPixels = displacement \* 2\.5/);
  assert.match(page, /<SpringCoil offset=\{oscillatorOffsetPixels\}/);
  assert.match(page, /translate3d\(0, \$\{oscillatorOffsetPixels\}px, 0\)/);
  assert.doesNotMatch(page, /--shm-mass-top/);
  assert.match(page, /application\/x-harmonic-motion-equipment/);
  assert.match(page, /Statif ve bağlantı kıskacı/);
  assert.match(page, /Sarmal yay/);
  assert.match(page, /Kütle askısı/);
  assert.match(page, /Düşey cetvel/);
  assert.match(page, /Hareket algılayıcısı/);
  assert.match(page, /Dijital zamanlayıcı/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /onMassPointerDown/);
  assert.match(page, /onMassPointerMove/);
  assert.match(page, /onMassPointerUp/);
  assert.match(page, /setPointerCapture/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /Math\.sqrt\(springConstant \/ massKg\)/);
  assert.match(page, /2 \* Math\.PI \* Math\.sqrt\(massKg \/ springConstant\)/);
  assert.match(page, /Konum x/);
  assert.match(page, /Hız v/);
  assert.match(page, /İvme a/);
  assert.match(page, /oscillationTarget/);
  assert.match(page, /Salınım sayısı/);
  assert.match(page, /type="number"/);
  assert.match(page, /maximumVelocity = amplitude \* omega/);
  assert.match(page, /maximumAcceleration = amplitude \* omega \*\* 2/);
  assert.match(page, /maximumRestoringForce = springConstant/);
  assert.match(page, /Hız v \(min \/ maks\)/);
  assert.match(page, /İvme a \(min \/ maks\)/);
  assert.match(page, /Kuvvet F \(min \/ maks\)/);
  assert.match(page, /Toplam enerji sabit kalır/);
  assert.match(page, /İdeal sistemde korunur/);
  assert.match(page, /DENEY GÜNLÜĞÜ/);
  assert.match(page, /KISA DENEY RAPORU/);
  assert.doesNotMatch(page, /Math\.random|hata kaynağı|ölçüm belirsizliği|Yüzdesel fark/i);

  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.shm-workspace\s*\{/);
  assert.match(css, /\.shm-tab-spring > img/);
  assert.match(css, /\.shm-tab-pendulum > img/);
  assert.match(css, /\.shm-apparatus\s*\{/);
  assert.match(css, /\.shm-stand\s*\{/);
  assert.match(css, /\.shm-spring\s*\{/);
  assert.match(css, /\.shm-mass\s*\{/);
  assert.match(css, /\.shm-real-stand-photo\s*[,\{]/);
  assert.match(css, /\.shm-real-mass-photo\s*\{/);
  assert.match(css, /\.shm-real-bench-photo\s*[,\{]/);
  assert.match(css, /\.shm-ruler\s*\{/);
  assert.match(css, /\.shm-motion-sensor\s*\{/);
  assert.match(css, /\.shm-data-logger\s*\{/);
  assert.match(css, /\.shm-motion-graph\s*\{/);
  assert.match(css, /\.shm-energy-bar\s*\{/);
});

test("basit sarkaç düzeneği seçilen salınım sayısından yer çekimi ivmesini hesaplar", async () => {
  const page = await readFile(
    new URL("app/SimplePendulumLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(page, /application\/x-simple-pendulum-equipment/);
  assert.match(page, /Statif ve sarkaç kıskacı/);
  assert.match(page, /İp ve metal bilye/);
  assert.match(page, /Metre cetveli/);
  assert.match(page, /Optik geçiş kapısı/);
  assert.match(page, /Dijital zamanlayıcı/);
  assert.match(page, /BOB_MASS_KG = 0\.05/);
  assert.match(page, /oscillationTarget/);
  assert.match(page, /Salınım sayısı/);
  assert.match(page, /type="number"/);
  assert.doesNotMatch(page, /OSCILLATION_COUNT/);
  assert.match(page, /ENVIRONMENTS/);
  assert.match(page, /gravity: 1\.62/);
  assert.match(page, /gravity: 3\.71/);
  assert.match(page, /gravity: 9\.81/);
  assert.match(page, /gravity: 24\.79/);
  assert.match(page, /selectedEnvironment\.gravity/);
  assert.match(page, /2 \* Math\.PI \* Math\.sqrt\(lengthMeters \/ selectedEnvironment\.gravity\)/);
  assert.match(page, /4 \* Math\.PI \*\* 2 \* lengthMeters/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /onBobPointerDown/);
  assert.match(page, /onBobPointerMove/);
  assert.match(page, /onBobPointerUp/);
  assert.match(page, /setPointerCapture/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /measurementTime = oscillationTarget \* period/);
  assert.match(page, /maximumVelocity = omega \* amplitudeMeters/);
  assert.match(page, /maximumAcceleration = omega \*\* 2 \* amplitudeMeters/);
  assert.match(page, /maximumRestoringForce = BOB_MASS_KG/);
  assert.match(page, /Hız v \(min \/ maks\)/);
  assert.match(page, /İvme a \(min \/ maks\)/);
  assert.match(page, /Kuvvet F \(min \/ maks\)/);
  assert.match(page, /Hesaplanan g/);
  assert.match(page, /Aynı sarkacı farklı gök cisimlerinde dene/);
  assert.match(page, /ORTAMLAR ARASI KARŞILAŞTIRMA/);
  assert.match(page, /environmentResults/);
  assert.match(page, /g = 4π²L \/ T²/);
  assert.match(page, /g’Yİ HESAPLA/);
  assert.match(page, /gravityCalculated/);
  assert.match(page, /calculateGravity/);
  assert.match(page, /shm-retort-stand-real-v2\.png/);
  assert.match(page, /pendulum-bob-real-v2\.png/);
  assert.match(page, /motion-lab-bench-v3\.webp/);
  assert.match(page, /motion-equipment-timer\.webp/);
  assert.match(page, /motion-equipment-gate\.webp/);
  assert.doesNotMatch(page, /kind:\s*"clamp"|installed\.includes\("clamp"\)/);
  assert.match(page, /KISA DENEY RAPORU/);
  assert.doesNotMatch(page, /Math\.random|hata kaynağı|ölçüm belirsizliği|Yüzdesel fark/i);

  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.pend-workspace\s*\{/);
  assert.match(css, /\.pend-apparatus\s*\{/);
  assert.match(css, /\.pend-stand\s*\{/);
  assert.match(css, /\.pend-real-stand-photo\s*[,\{]/);
  assert.match(css, /\.pend-real-bench-photo\s*[,\{]/);
  assert.match(css, /\.pend-bob > img\s*\{/);
  assert.match(css, /\.pend-calculate-gravity\s*\{/);
  assert.match(css, /\.pend-swing-arm\s*\{/);
  assert.match(css, /\.pend-string\s*\{/);
  assert.match(css, /\.pend-bob\s*\{/);
  assert.match(css, /\.pend-ruler\s*\{/);
  assert.match(css, /\.pend-photogate\s*\{/);
  assert.match(css, /top: calc\(80px \+ var\(--pend-length\)\);/);
  assert.match(css, /z-index: 9;\s*width: 140px;/);
  assert.match(css, /\.pend-timer\s*\{/);
  assert.match(css, /\.pend-environment-selector\s*\{/);
  assert.match(css, /\.pend-environment-window\s*\{/);
  assert.match(css, /\.environment-moon \.pend-environment-window/);
  assert.match(css, /\.environment-mars \.pend-environment-window/);
  assert.match(css, /\.environment-earth \.pend-environment-window/);
  assert.match(css, /\.environment-jupiter \.pend-environment-window/);
  assert.match(css, /\.pend-gravity-comparison\s*\{/);
});

test("çarpışmalar modülü PDF düzeneğiyle kurulabilir ve veri üretir", async () => {
  const page = await readFile(
    new URL("app/CollisionLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(page, /FİZ\.12\.1\.4/);
  assert.match(page, /REQUIRED_SETUP/);
  assert.match(page, /SETUP_ORDER/);
  assert.match(page, /Ayarlanabilir ayaklı hava masası/);
  assert.match(page, /Hava masası yüzeyinde nokta izlerini kaydeder/);
  assert.match(page, /Hava masası kompresörü/);
  assert.match(page, /Ark kronometresi ve ayak pedalı/);
  assert.match(page, /Birinci hava diski/);
  assert.match(page, /İkinci hava diski/);
  assert.match(page, /Esnek olmayan çarpışma bandı/);
  assert.match(page, /Cırt cırt bant \(esnek olmayan\)/);
  assert.match(page, /application\/x-collision-equipment/);
  assert.match(page, /onEquipmentDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /startTargetDrag/);
  assert.match(page, /moveTarget/);
  assert.match(page, /balanceTable/);
  assert.match(page, /toggleCompressor/);
  assert.match(page, /resetTimer/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /Esnek olmayan/);
  assert.match(page, /Pedala bas ve diski gönder/);
  assert.match(page, /momentumBeforeX/);
  assert.match(page, /momentumAfterY/);
  assert.match(page, /momentumOneBefore/);
  assert.match(page, /momentumTwoAfter/);
  assert.match(page, /momentumOneAfterX/);
  assert.match(page, /momentumTwoAfterY/);
  assert.match(page, /energyRetention/);
  assert.match(page, /PHYSICS_EPSILON/);
  assert.match(page, /exactZero/);
  assert.match(page, /CollisionSurfaceVectors/);
  assert.match(page, /plannedCollisionAngle/);
  assert.match(page, /roundedAngle/);
  assert.match(page, /collision-coordinate-system/);
  assert.match(page, /gelen doğrultu · 0°/);
  assert.match(page, /çarpışma doğrultusu/);
  assert.match(page, /2\. diski düşey sürükle/);
  assert.match(page, /Sade analizi göster/);
  assert.match(page, /CollisionVectorAnalysis/);
  assert.match(page, /VectorAnalysisCanvas/);
  assert.match(page, /Çarpışmayı sade oku/);
  assert.match(page, /Çarpışmadan önce/);
  assert.match(page, /Çarpışmadan sonra/);
  assert.match(page, /Kinetik enerji/);
  assert.match(page, /pₓ/);
  assert.match(page, /pᵧ/);
  assert.match(page, /İdeal sistemde momentum korundu/);
  assert.doesNotMatch(page, /MomentumVectorOverlay|collision-momentum-overlay/);
  assert.doesNotMatch(page, /MEASUREMENT_NOISE|const noise/);
  assert.match(page, /setMode\("inelastic"\)/);
  assert.match(page, /1\. cismin ilk momentumu/);
  assert.match(page, /2\. cismin son momentumu/);
  assert.match(page, /İlk kinetik enerji/);
  assert.match(page, /Son kinetik enerji/);
  assert.doesNotMatch(page, /<th>θ \/ φ<\/th>/);
  assert.match(page, /Momentum bileşenleri/);
  assert.match(page, /Denemelerde kinetik enerji/);
  assert.match(page, /KISA DENEY RAPORU/);
  assert.match(page, /AIR_TABLE_SURFACE/);
  assert.match(page, /collision-air-table-v2\.webp/);
  assert.match(page, /collision-compressor-v2\.webp/);
  assert.match(page, /collision-spark-timer-v2\.webp/);
  assert.match(page, /collision-foot-pedal-v2\.webp/);
  assert.match(page, /collision-puck-one-v2\.webp/);
  assert.match(page, /collision-puck-two-v2\.webp/);
  assert.match(page, /puckReachedTableEdge/);
  assert.match(page, /keepPuckOnTable/);
  assert.doesNotMatch(page, /motion-lab-bench-v3\.webp/);
});

test("çarpışma düzeneği hava masası, diskler ve nokta izlerini gerçekçi sahnede gösterir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.collision-air-table\s*\{/);
  assert.match(css, /\.collision-trace-paper\s*\{/);
  assert.match(css, /\.collision-puck\s*\{/);
  assert.match(css, /\.collision-puck-two\s*\{/);
  assert.match(css, /\.collision-trace-mark\s*\{/);
  assert.match(css, /\.collision-coordinate-system\s*\{/);
  assert.match(css, /\.collision-coordinate-line\.coordinate-x\s*\{/);
  assert.match(css, /\.collision-coordinate-line\.coordinate-y\s*\{/);
  assert.match(css, /\.collision-scattering-overlay\s*\{/);
  assert.match(css, /\.collision-analysis-prompt\s*\{/);
  assert.match(css, /\.collision-vector-analysis\s*\{/);
  assert.match(css, /\.collision-analysis-canvas canvas\s*\{/);
  assert.match(css, /\.collision-analysis-summary\s*\{/);
  assert.match(css, /\.collision-analysis-legend\s*\{/);
  assert.match(css, /\.collision-analysis-conclusion\s*\{/);
  assert.doesNotMatch(css, /\.collision-momentum-overlay\s*\{/);
  assert.match(css, /\.collision-compressor\s*\{/);
  assert.match(css, /\.collision-air-table-photo\s*\{/);
  assert.match(css, /\.collision-compressor-photo\s*\{/);
  assert.match(css, /\.collision-spark-timer-photo\s*\{/);
  assert.match(css, /\.collision-puck > img\s*\{/);
  assert.match(css, /\.collision-table-air-inlet\s*\{/);
  assert.match(css, /\.compressor-handle\s*\{/);
  assert.match(css, /\.compressor-fan\s*\{/);
  assert.match(css, /\.compressor-gauge\s*\{/);
  assert.match(css, /\.compressor-outlet\s*\{/);
  assert.match(css, /\.collision-air-hose\s*,/);
  assert.match(css, /\.collision-pedal-cable\s*\{/);
  assert.match(css, /\.collision-spark-timer\s*\{/);
  assert.match(css, /\.collision-pedal\s*\{/);
  assert.match(css, /\.collision-data-table\s*,/);
  assert.match(css, /\.collision-graphs\s*\{/);
  assert.match(css, /\.collision-report\s*\{/);
});

test("iki boyutta hareket modülü PDF düzeneğiyle kurulabilir ve ölçüm yapar", async () => {
  const page = await readFile(
    new URL("app/TwoDimensionalMotionLab.tsx", projectRoot),
    "utf8",
  );
  assert.match(page, /FİZ\.10\.1\.6/);
  assert.match(page, /SETUP_ORDER/);
  assert.match(page, /Fırlatıcı ünitesi ve taban/);
  assert.match(page, /Açı göstergesi/);
  assert.match(page, /İlk hız sensörü/);
  assert.match(page, /Aynı seviyedeki iniş masası/);
  assert.match(page, /Karbonlu iz kâğıdı/);
  assert.match(page, /Bir metre cetvel/);
  assert.match(page, /19 mm çelik bilye/);
  assert.match(page, /application\/x-twod-equipment/);
  assert.match(page, /onDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /ANGLES = \[15, 30, 45, 60, 75\]/);
  assert.match(page, /SPEEDS/);
  assert.match(page, /startAngleDrag/);
  assert.match(page, /moveAngleDrag/);
  assert.match(page, /Hız sensörünü sıfırla/);
  assert.match(page, /Pimi çek ve fırlat/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /ResizeObserver/);
  assert.match(page, /launcherMuzzleForAngle/);
  assert.match(page, /twod-launcher-frame-v2\.webp/);
  assert.match(page, /twod-launcher-barrel-v2\.webp/);
  assert.match(page, /twod-landing-table-v2\.webp/);
  assert.match(page, /twod-speed-sensor-v2\.webp/);
  assert.match(page, /motion-lab-bench-v3\.webp/);
  assert.match(page, /Yatay hız vₓ/);
  assert.match(page, /Düşey hız vᵧ/);
  assert.match(page, /measuredRange/);
  assert.doesNotMatch(page, /calculatedRange|errorPercent|SPEED_NOISE|RANGE_NOISE/);
  assert.match(page, /Doğrultu – menzil/);
  assert.match(page, /Doğrultu – maksimum yükseklik/);
  assert.match(page, /15 deney tamamlandı/);
  assert.match(page, /KISA DENEY RAPORU/);
});

test("iki boyutta hareket düzeneği fırlatıcı, masa ve iz kâğıdını gerçekçi sahnede gösterir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.twod-apparatus\s*\{/);
  assert.match(css, /\.twod-launcher-arm\s*\{/);
  assert.match(css, /\.twod-protractor\s*\{/);
  assert.match(css, /\.twod-speed-sensor\s*\{/);
  assert.match(css, /\.twod-landing-table\s*\{/);
  assert.match(css, /\.twod-trace-paper\s*\{/);
  assert.match(css, /\.twod-meter-ruler\s*\{/);
  assert.match(css, /\.twod-projectile\s*\{/);
  assert.match(css, /\.twod-velocity-arrows\s*\{/);
  assert.match(css, /\.twod-equipment-icon\.has-photo\s*\{/);
  assert.match(css, /\.twod-floor img\s*\{/);
  assert.match(css, /\.twod-launcher\s*>\s*img\s*\{/);
  assert.match(css, /\.twod-launcher-arm\s*>\s*img\s*\{/);
  assert.match(css, /\.twod-speed-sensor\s*>\s*img\s*\{/);
  assert.match(css, /\.twod-landing-table\s*>\s*img\s*\{/);
  assert.match(css, /top:\s*calc\(var\(--landing-top\) \+ 1\.4%\)/);
});

test("serbest düşme modülü PDF düzeneğiyle kurulabilir ve ölçüm yapar", async () => {
  const page = await readFile(new URL("app/FreeFallLab.tsx", projectRoot), "utf8");
  assert.match(page, /FİZ\.10\.1\.4/);
  assert.match(page, /FİZ\.10\.1\.5/);
  assert.match(page, /SETUP_ORDER/);
  assert.match(page, /Statif ve düşey çubuk/);
  assert.match(page, /Bilye bırakma mekanizması/);
  assert.match(page, /Algılayıcı tabla/);
  assert.match(page, /Dijital kronometre/);
  assert.match(page, /Yükseklik cetveli/);
  assert.match(page, /Çelik bilye 1/);
  assert.match(page, /Çelik bilye 2/);
  assert.match(page, /application\/x-freefall-equipment/);
  assert.match(page, /application\/x-freefall-ball/);
  assert.match(page, /onDragStart/);
  assert.match(page, /onStageDrop/);
  assert.match(page, /startReleaseDrag/);
  assert.match(page, /moveRelease/);
  assert.match(page, /HEIGHTS = \[25, 50, 75, 100, 125, 150\]/);
  assert.match(page, /Bilyeyi serbest bırak/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /elapsedSeconds/);
  assert.match(page, /t₁/);
  assert.match(page, /t₅/);
  assert.match(page, /height-time/);
  assert.match(page, /height-time-squared/);
  assert.match(page, /experimentalG/);
  assert.match(page, /gravity/);
  assert.match(page, /changeGravity/);
  assert.match(page, /min="1\.5"/);
  assert.match(page, /max="15"/);
  assert.match(page, /Ay/);
  assert.match(page, /Mars/);
  assert.match(page, /Dünya/);
  assert.match(page, /trialLog/);
  assert.match(page, /Ayarlanan g/);
  assert.match(page, /Hesaplanan g/);
  assert.doesNotMatch(page, /DROP_NOISE|const noise|<th>Fark<\/th>/);
  assert.match(page, /Hava sürtünmesi ihmal edilmiştir/);
  assert.match(page, /freefall-equipment-stand\.webp/);
  assert.match(page, /freefall-equipment-release\.webp/);
  assert.match(page, /freefall-equipment-sensor\.webp/);
  assert.match(page, /freefall-equipment-timer\.webp/);
  assert.match(page, /freefall-equipment-ruler\.webp/);
  assert.match(page, /motion-lab-bench-v3\.webp/);
  assert.match(page, /KISA DENEY RAPORU/);
});

test("serbest düşme düzeneği statif, bırakma mekanizması ve algılayıcıyı gerçekçi sahnede gösterir", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.freefall-apparatus\s*\{/);
  assert.match(css, /\.freefall-stand-rod\s*\{/);
  assert.match(css, /\.freefall-release-carriage\s*\{/);
  assert.match(css, /\.freefall-sensor\s*\{/);
  assert.match(css, /\.freefall-timer-station\s*\{/);
  assert.match(css, /\.freefall-timer\s*\{/);
  assert.match(css, /\.freefall-timer-screen\s*\{/);
  assert.match(css, /\.freefall-timer-channels\s*\{/);
  assert.match(css, /\.cable-release\s*\{/);
  assert.match(css, /\.cable-sensor\s*\{/);
  assert.match(css, /\.freefall-model-assumption\s*\{/);
  assert.match(css, /\.freefall-gravity-control\s*\{/);
  assert.match(css, /\.freefall-gravity-log\s*\{/);
  assert.match(css, /\.freefall-dropping-ball\.falling/);
  assert.match(css, /\.freefall-ruler\s*\{/);
  assert.match(css, /\.freefall-bench\s*\{/);
  assert.match(css, /\.freefall-equipment-icon\.has-photo\s*\{/);
  assert.match(css, /\.freefall-release-photo\s*\{/);
  assert.match(css, /\.freefall-release-carriage::before\s*\{/);
  assert.match(css, /\.freefall-release-carriage::after\s*\{/);
  assert.match(css, /\.freefall-timer-photo\s*\{/);
  assert.match(css, /\.freefall-ruler\s*>\s*img\s*\{/);
  assert.match(css, /\.cable-sensor::before\s*\{/);
  assert.match(css, /transform:\s*scaleX\(1\.235\)/);
  assert.match(css, /\.freefall-stand\s*\{[^}]*left:\s*42\.6%;[^}]*width:\s*22%;[^}]*height:\s*77%;/s);
  assert.match(css, /\.freefall-dropping-ball\s*\{[^}]*top:\s*calc\(var\(--release-top\) \+ 2\.2%\);[^}]*left:\s*39\.4%;[^}]*width:\s*21px;[^}]*height:\s*21px;/s);
});

test("hava rayı deneyi sade hedeflere sürüklenerek kurulabilir", async () => {
  const page = await readFile(new URL("app/MotionLab.tsx", projectRoot), "utf8");
  assert.match(page, /SETUP_SLOTS/);
  assert.match(page, /tezgâhtaki uzun hedefe sürükle/);
  assert.match(page, /Yanlış konum/);
  assert.match(page, /doğru yuvasına kilitlendi/);
  assert.match(page, /1\. DENEYİN MALZEMELERİ/);
  assert.match(page, /SİSTEMİN TANIDIĞI DÜZENEK/);
  assert.match(page, /acceleratedReady/);
  assert.doesNotMatch(page, /motion-mode-tabs/);
  assert.match(page, /EquipmentVisual/);
  assert.doesNotMatch(page, /air-track-real\.jpg|air-track-pdf-diagram\.png/);
  assert.match(page, /application\/x-spektrum-equipment/);
  assert.match(page, /onDragStart/);
  assert.match(page, /onDrop/);
  assert.match(page, /startSceneDrag/);
  assert.match(page, /Hava rayı/);
  assert.match(page, /Hava pompası/);
  assert.match(page, /Kızak/);
  assert.match(page, /Optik kapı/);
  assert.match(page, /Kronometre/);
  assert.match(page, /Makara/);
  assert.match(page, /Kefe/);
  assert.match(page, /gate-2/);
  assert.match(page, /SECOND_GATE_MIN_X/);
  assert.match(page, /SECOND_GATE_MAX_X/);
  assert.match(page, /Optik kapılar arası mesafe/);
  assert.match(page, /ikinci kapıyı ray üzerinde sürükle/);
  assert.match(page, /GATE_CM_PER_STAGE_PERCENT/);
  assert.match(page, /runEndX/);
  assert.match(page, /reading-gate/);
  assert.match(page, /stage-string-path/);
  assert.match(page, /İp kızaktan makaraya uzanır/);
  assert.match(page, /item\.kind !== "string"/);
  assert.match(page, /stopwatchMs/);
  assert.match(page, /timerValue/);
  assert.match(page, /Ölçülen: turuncu bayrak/);
  assert.doesNotMatch(page, /className="air-track-bench"/);
  assert.match(page, /motion-lab-bench-v3\.webp/);
  assert.match(page, /EQUIPMENT_PHOTOS/);
  assert.match(page, /id: "timer",[\s\S]*?x: 83\.5,[\s\S]*?y: 55,/);
  assert.match(page, /TIMER_CABLE_X = 79\.3/);
  assert.match(page, /EQUIPMENT_GROUPS/);
  assert.match(page, /motion-equipment-pump\.webp/);
  assert.match(page, /motion-equipment-timer\.webp/);
  assert.match(page, /motion-equipment-launcher\.webp/);
  assert.doesNotMatch(page, /motion-equipment-air-track\.webp/);
  assert.doesNotMatch(page, /motion-equipment-gate\.webp/);
  assert.match(page, /rail-top-ridge/);
  assert.match(page, /gate-clamp/);
  assert.match(page, /stage-sensor-wire/);
  assert.match(page, /pulley-extension-panel/);
  assert.match(page, /1 · MAKARASIZ DENEY/);
  assert.match(page, /2 · AYRI DENEY/);
  assert.match(page, /Bu parçalar sabit hızlı hareket için gerekli değildir/);
  assert.match(page, /bağlantılar\s+rayın sağ ucunda otomatik olarak hizalanır/);
  assert.doesNotMatch(page, /gate-end-/);
  assert.doesNotMatch(page, /setDistance/);
});

test("hava rayı oranı bozulmadan çizilir ve tüm bağlantılar raya oturur", async () => {
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  assert.match(css, /\.equipment-rail\s*\{[^}]*display:\s*block;[^}]*width:\s*80%;/s);
  assert.match(css, /\.equipment-rail \.equipment-visual\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0 0 12px;/s);
  assert.match(css, /\.equipment-rail\.selected\s*\{[^}]*outline:\s*0;/s);
  assert.match(css, /\.gate-base::after\s*\{/);
  assert.match(css, /\.gate-clamp\s*\{/);
  assert.match(css, /\.pulley-clamp\s*\{/);
  assert.match(css, /\.equipment-pulley\s*\{[^}]*min-width:\s*112px;/s);
  assert.match(css, /\.pulley-wheel\s*\{[^}]*width:\s*78px;[^}]*repeating-conic-gradient/s);
  assert.match(css, /\.stage-hose::before/);
  assert.match(css, /\.stage-sensor-wire\s*\{/);
  assert.match(css, /\.equipment-gate\.selected\s*\{/);
  assert.match(css, /\.air-track-bench\s*\{/);
  assert.match(css, /\.motion-stage-photo\s*\{/);
  assert.match(css, /\.equipment-groups\s*\{/);
  assert.match(css, /\.equipment-photo\s*\{/);
  assert.match(css, /\.photo-timer-reading\s*\{/);
  assert.match(css, /\.run-load\s*\{/);
  assert.match(css, /@keyframes air-track-pulley-turn/);
  assert.match(css, /@keyframes air-pump-fan/);
  assert.match(css, /@keyframes launcher-release/);
});

test("hareket ölçümleri iki eşzamanlı grafik, sade tablo, kronometre ve rapor sunar", async () => {
  const page = await readFile(new URL("app/MotionLab.tsx", projectRoot), "utf8");
  assert.match(page, /Düzgün Doğrusal Hareket/);
  assert.match(page, /Sabit İvmeli Hareket/);
  assert.match(page, /Kütle-İvme İlişkisi/);
  assert.match(page, /Kızağın bayrağının geçiş süreleri/);
  assert.match(page, /Ölçüm sayısı/);
  assert.doesNotMatch(page, /t²ort|tort/);
  assert.match(page, /dual-motion-graphs/);
  assert.match(page, /Konum – zaman/);
  assert.match(page, /Kütle – ivme/);
  assert.match(page, /kind="position"/);
  assert.match(page, /kind="mass"/);
  assert.match(page, /graph-pulley-lock/);
  assert.match(page, /calculateAcceleration/);
  assert.doesNotMatch(page, /distance === 50/);
  assert.match(page, /acceleratedReady \? "force" : "uniform"/);
  assert.match(page, /accelerated: appendTrial\(current\.accelerated, distance\)/);
  assert.match(page, /force: appendTrial\(current\.force, hangingMass\)/);
  assert.match(page, /runProgress/);
  assert.match(page, /animatedMassPoint/);
  assert.match(page, /y: calculateAcceleration\(row\.key\)/);
  assert.doesNotMatch(page, /const variation|hata kaynağı/);
  assert.match(page, /stage-run-button/);
  assert.match(page, /Kızağı fırlat ve ölç/);
  assert.match(page, /Kızağı başlangıca getir/);
  assert.doesNotMatch(page, /className="run-motion-button"/);
  assert.match(page, /runCompleted/);
  assert.match(page, /visualRunDurationMs/);
  assert.match(page, /firstGateTimeProgress/);
  assert.match(page, /run-load/);
  assert.match(page, /student-report/);
  assert.match(page, /textarea/);
  assert.doesNotMatch(page, /motion-theory-grid/);
});

test("tüm deney modülleri ideal ölçüm politikası uygular", async () => {
  const labFiles = [
    "app/MotionLab.tsx",
    "app/FreeFallLab.tsx",
    "app/TwoDimensionalMotionLab.tsx",
    "app/CollisionLab.tsx",
    "app/BallisticPendulumLab.tsx",
    "app/HarmonicMotionLab.tsx",
    "app/SimplePendulumLab.tsx",
    "app/PrismLab.tsx",
    "app/PhotoelectricLab.tsx",
    "app/CernAcceleratorLab.tsx",
    "app/OhmLawLab.tsx",
    "app/ResistorConnectionsLab.tsx",
    "app/UnifiedOpticsLab.tsx",
  ];
  const pages = await Promise.all(
    labFiles.map((file) => readFile(new URL(file, projectRoot), "utf8")),
  );
  const source = pages.join("\n");

  assert.doesNotMatch(
    source,
    /Math\.random|\bNOISE\b|DROP_NOISE|SPEED_NOISE|RANGE_NOISE|const noise|const variation|errorPercent|currentError|momentumDifference|difference: number|Yüzdesel fark|ölçüm belirsizliği|hata kaynağı|ölçüm farkları|fark %/i,
  );
});
