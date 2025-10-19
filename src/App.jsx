import { useRef, useState } from "react";
import "./App.css";
import leftHand from "./assets/left-hand.png";
import rightHand from "./assets/right-hand.png";

export default function App() {
  return (
    <div className="app">
      <Side side="left" label="6" img={leftHand} />
      <Side side="right" label="7" img={rightHand} />
      <AmbientNoise />
    </div>
  );
}

function Side({ side, label, img }) {
  const sideRef = useRef(null);
  const fxRef = useRef(null);

  // throttle hover speech so it doesn’t fire constantly
  const lastSpeakRef = useRef(0);

  const handleMouseMove = (e) => {
    const el = sideRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", (x - 0.5).toFixed(3));
    el.style.setProperty("--my", (y - 0.5).toFixed(3));
  };

  const handleMouseLeave = () => {
    const el = sideRef.current;
    if (!el) return;
    el.style.setProperty("--mx", 0);
    el.style.setProperty("--my", 0);
  };

  const handleMouseEnter = () => {
    // speak “6” or “7” on hover with a 700ms throttle
    const now = performance.now();
    if (now - lastSpeakRef.current > 700) {
      speakNumber(label);
      lastSpeakRef.current = now;
    }
  };

  const handleClick = (e) => {
    spawnConfetti(e, fxRef.current);
    // Easter egg: say “Nice.” if you click both sides within 2s
    const now = performance.now();
    const other = window.__lastSideClick || { side: null, t: 0 };
    window.__lastSideClick = { side, t: now };
    if (other.side && other.side !== side && now - other.t < 2000) {
      toast("Nice.");
      // also speak it once for fun (non-blocking)
      speakText("Nice");
    }
  };

  return (
    <section
      className={`side ${side}`}
      ref={sideRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      <div className="fx-layer" ref={fxRef} aria-hidden />
      <div className="inner">
        <div className="card" role="img" aria-label={`${side} side meme card`}>
          <div className="num" data-num={label}>
            {label}
          </div>
          <div className="hand-wrap">
            <img src={img} alt={`${side} hand`} className="hand" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------- Effects & helpers ------------------ */

/** Speak a raw string using the Web Speech API. */
function speakText(text, { rate = 1.0, pitch = 1.0, volume = 1.0 } = {}) {
  const synth = window.speechSynthesis;
  if (!synth) return; // graceful no-op if unsupported

  // Cancel any lingering utterances so we don't queue too many
  try {
    synth.cancel();
  } catch {}

  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = pitch;
  u.volume = volume;

  // Prefer an English voice if available (optional)
  const voices = synth.getVoices?.() || [];
  const en = voices.find((v) => /en(-|_)?/i.test(v.lang));
  if (en) u.voice = en;

  // Fire it!
  try {
    synth.speak(u);
  } catch {}
}

/** Say the number as words (“six”, “seven”) on hover. */
function speakNumber(n) {
  // If you prefer it to literally read the digit, pass `${n}` to speakText.
  const text = n === "6" ? "six" : n === "7" ? "seven" : `${n}`;
  speakText(text, { rate: 1.05, pitch: 1.0, volume: 1.0 });
}

// Confetti burst
function spawnConfetti(e, layer) {
  if (!layer) return;
  const rect = layer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pieces = 24 + Math.floor(Math.random() * 12);
  for (let i = 0; i < pieces; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--dx", (Math.random() * 2 - 1).toFixed(3));
    s.style.setProperty("--dy", (Math.random() * -1 - 0.5).toFixed(3));
    s.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(1));
    s.style.setProperty("--life", (0.7 + Math.random() * 0.7).toFixed(2));
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  }
}

// Tiny toast
function toast(text = "Nice.") {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => t.classList.remove("show"), 1600);
  setTimeout(() => t.remove(), 2000);
}

// Subtle paper/noise overlay (pure decoration)
function AmbientNoise() {
  return <div className="noise" aria-hidden />;
}
