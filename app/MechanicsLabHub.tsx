"use client";

/* eslint-disable @next/next/no-img-element */

import { lazy, Suspense, useEffect, useState } from "react";
import BallisticPendulumLab from "./BallisticPendulumLab";
import CollisionLab from "./CollisionLab";
import FreeFallLab from "./FreeFallLab";
import HarmonicMotionLab from "./HarmonicMotionLab";
import MotionLab from "./MotionLab";
import TwoDimensionalMotionLab from "./TwoDimensionalMotionLab";

const NewtonBookLab = lazy(() => import("./NewtonBookLab"));

type ActiveModule =
  | "motion"
  | "free-fall"
  | "two-dimensional"
  | "collisions"
  | "ballistic-pendulum"
  | "harmonic-motion"
  | "newton-book"
  | null;

export default function MechanicsLabHub({
  onBack,
}: {
  onBack: () => void;
}) {
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);

  useEffect(() => {
    if (activeModule !== null) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [activeModule]);

  if (activeModule === "newton-book") {
    return (
      <Suspense
        fallback={
          <main className="newton-loading-screen" role="status">
            <i />
            <span>MEKANİK · 3B NEWTON KİTABI</span>
            <h1>Deney sayfaları hazırlanıyor…</h1>
          </main>
        }
      >
        <NewtonBookLab
          context="mechanics"
          onBack={() => setActiveModule(null)}
        />
      </Suspense>
    );
  }

  return (
    <main className="page-shell mechanics-inner-shell">
      <header
        className={`site-header ${activeModule ? "experiment-focus-header" : ""}`}
      >
        <button
          className={`mechanics-back-button ${activeModule ? "experiment-selection-back" : ""}`}
          type="button"
          onClick={activeModule ? () => setActiveModule(null) : onBack}
          aria-label={
            activeModule ? "Mekanik deneylerine dön" : "Fizik deney setlerine dön"
          }
        >
          <span aria-hidden="true">←</span>
          {activeModule && <b>Deneylere dön</b>}
        </button>
        <a
          className="brand"
          href={activeModule ? "#mekanik-deney" : "#ust"}
          aria-label="Fizik Atölyesi mekanik deneyleri"
        >
          <span className="brand-mark">FA</span>
          <span>
            <b>FİZİK ATÖLYESİ</b>
            <small>Mekanik deney setleri</small>
          </span>
        </a>
        {!activeModule && (
          <nav>
            <button type="button" onClick={() => setActiveModule("motion")}>
              Hareket deneyi
            </button>
            <button type="button" onClick={() => setActiveModule("free-fall")}>
              Serbest düşme
            </button>
            <button
              type="button"
              onClick={() => setActiveModule("two-dimensional")}
            >
              İki boyutta hareket
            </button>
            <button type="button" onClick={() => setActiveModule("collisions")}>
              Çarpışmalar
            </button>
            <button
              type="button"
              onClick={() => setActiveModule("ballistic-pendulum")}
            >
              Balistik sarkaç
            </button>
            <button
              type="button"
              onClick={() => setActiveModule("harmonic-motion")}
            >
              Basit harmonik hareket
            </button>
            <button type="button" onClick={() => setActiveModule("newton-book")}>
              Newton 3B
            </button>
          </nav>
        )}
        <span className="curriculum-chip">
          TYMM ·{" "}
          {activeModule === "collisions" ||
          activeModule === "ballistic-pendulum" ||
          activeModule === "harmonic-motion"
            ? "12."
            : activeModule === "free-fall" ||
                activeModule === "two-dimensional"
              ? "10."
              : "9."}{" "}
          Sınıf
        </span>
      </header>

      {!activeModule && (
        <section className="module-launcher" id="ust">
          <div className="module-launcher-copy">
            <span>MEKANİK · ETKİLEŞİMLİ DENEYLER</span>
            <h1>Gerçek düzeneklerden üç boyutlu fiziğe.</h1>
            <p>Bir laboratuvar deneyini kur veya Newton’un yasalarını sayfaların içinden yükselen 3B deneylerle keşfet.</p>
          </div>
          <div className="module-choice-grid">
            <button
              type="button"
              aria-pressed={activeModule === "motion"}
              onClick={() => setActiveModule("motion")}
            >
              <span
                className="module-choice-visual motion-choice-visual"
                aria-hidden="true"
              >
                <img src="./mechanics-motion.webp" alt="" draggable="false" />
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 01 · DENEY 1</small>
                <b>Hareket</b>
                <em>Hava rayı deney düzeneği</em>
              </span>
              <strong>Deneyi aç →</strong>
            </button>
            <button
              className="freefall-module-choice"
              type="button"
              aria-pressed={activeModule === "free-fall"}
              onClick={() => setActiveModule("free-fall")}
            >
              <span
                className="module-choice-visual freefall-choice-visual"
                aria-hidden="true"
              >
                <img src="./mechanics-freefall.webp" alt="" draggable="false" />
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 02 · DENEY 2</small>
                <b>Serbest düşme</b>
                <em>Düzeneği kur, yüksekliği ayarla ve ölç</em>
              </span>
              <strong>Deneyi aç →</strong>
            </button>
            <button
              type="button"
              aria-pressed={activeModule === "two-dimensional"}
              onClick={() => setActiveModule("two-dimensional")}
            >
              <span
                className="module-choice-visual twod-choice-visual"
                aria-hidden="true"
              >
                <img
                  src="./mechanics-two-dimensional.webp"
                  alt=""
                  draggable="false"
                />
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 03 · DENEY 3</small>
                <b>İki boyutta hareket</b>
                <em>Doğrultuyu ve hız kademesini değiştir</em>
              </span>
              <strong>Deneyi aç →</strong>
            </button>
            <button
              className="collision-module-choice"
              type="button"
              aria-pressed={activeModule === "collisions"}
              onClick={() => setActiveModule("collisions")}
            >
              <span
                className="module-choice-visual collision-choice-visual"
                aria-hidden="true"
              >
                <img
                  src="./mechanics-collisions.webp"
                  alt=""
                  draggable="false"
                />
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 04 · DENEY 4</small>
                <b>Çarpışmalar</b>
                <em>İki boyutta momentumu ve enerjiyi karşılaştır</em>
              </span>
              <strong>Deneyi aç →</strong>
            </button>
            <button
              type="button"
              aria-pressed={activeModule === "ballistic-pendulum"}
              onClick={() => setActiveModule("ballistic-pendulum")}
            >
              <span
                className="module-choice-visual ballistic-choice-visual"
                aria-hidden="true"
              >
                <img src="./mechanics-ballistic.webp" alt="" draggable="false" />
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 05 · DENEY 5</small>
                <b>Balistik sarkaç</b>
                <em>Kur, fırlat ve ilk hızı iki yöntemle karşılaştır</em>
              </span>
              <strong>Deneyi aç →</strong>
            </button>
            <button
              className="harmonic-module-choice"
              type="button"
              aria-pressed={activeModule === "harmonic-motion"}
              onClick={() => setActiveModule("harmonic-motion")}
            >
              <span
                className="module-choice-visual harmonic-choice-visual"
                aria-hidden="true"
              >
                <img
                  src="./mechanics-harmonic-motion.webp"
                  alt=""
                  draggable="false"
                />
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 06 · DENEY 6</small>
                <b>Basit harmonik hareket</b>
                <em>Yay–kütle ve basit sarkaç deneyleri</em>
              </span>
              <strong>Deneyi aç →</strong>
            </button>
            <button
              className="newton-mechanics-choice"
              type="button"
              aria-pressed={activeModule === "newton-book"}
              onClick={() => setActiveModule("newton-book")}
            >
              <span
                className="module-choice-visual newton-mechanics-choice-visual"
                aria-hidden="true"
              >
                <img
                  src="./free-force-motion-newton-book-v2.webp"
                  alt=""
                  draggable="false"
                />
                <i className="newton-choice-quality">ETKİLEŞİMLİ 3B</i>
              </span>
              <span className="module-choice-copy">
                <small>MODÜL 07 · PROFESYONEL 3B KİTAP</small>
                <b>Newton’un hareket yasaları</b>
                <em>1., 2. ve 3. yasayı yedi canlı deney, ölçüm ve grafikle keşfet</em>
                <span className="newton-choice-laws">
                  <i>1 · Eylemsizlik</i>
                  <i>2 · F = m·a</i>
                  <i>3 · Etki–tepki</i>
                </span>
              </span>
              <strong>3B kitabı aç →</strong>
            </button>
          </div>
        </section>
      )}

      <div
        id="mekanik-deney"
        className={activeModule ? "focused-experiment-view" : ""}
      >
        {activeModule === "motion" && <MotionLab />}
        {activeModule === "free-fall" && <FreeFallLab />}
        {activeModule === "two-dimensional" && <TwoDimensionalMotionLab />}
        {activeModule === "collisions" && <CollisionLab />}
        {activeModule === "ballistic-pendulum" && <BallisticPendulumLab />}
        {activeModule === "harmonic-motion" && <HarmonicMotionLab />}
      </div>

      {!activeModule && (
        <footer>
          <div className="brand footer-brand">
            <span className="brand-mark">FA</span>
            <span>
              <b>FİZİK ATÖLYESİ</b>
              <small>Mekanik deney setleri</small>
            </span>
          </div>
          <p>TYMM lise fizik programının mekanik öğrenme çıktılarıyla uyumludur.</p>
          <a href="#ust">Başa dön ↑</a>
        </footer>
      )}
    </main>
  );
}
