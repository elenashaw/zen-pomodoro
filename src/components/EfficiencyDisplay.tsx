import React, { useEffect, useMemo, useRef, useState } from "react";

interface EfficiencyProps {
  seconds: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  isActive: boolean;
  textColor: string;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function alpha(c: string, a: number) {
  const m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim());
    const [r, g, b] = parts;
    if (r && g && b) return `rgba(${r},${g},${b},${a})`;
  }
  return `rgba(255,255,255,${a})`;
}

/** stable pseudo-random generator */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toHex4(n: number) {
  return n.toString(16).toUpperCase().padStart(4, "0");
}

export default function EfficiencyDisplay({
  seconds,
  totalSeconds,
  formatTime,
  isActive,
  textColor,
}: EfficiencyProps) {
  const remain = clamp01(seconds / (totalSeconds || 1));
  const done = clamp01(1 - remain);

  const isWarning = seconds < 300; // < 5 min
  const warnColor = "#ff4d4d";

  // Focus features
  const [focusLock, setFocusLock] = useState(true); // 默认开：更少噪音
  const [breathPace, setBreathPace] = useState(true);
  const [microGoals, setMicroGoals] = useState(true);

  // stable seed per mount
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const rngRef = useRef<() => number>(() => Math.random());
  useEffect(() => {
    rngRef.current = mulberry32(seed);
  }, [seed]);

  // pseudo “hex stream” (less fake than pure random)
  const [hexCode, setHexCode] = useState("0x4A2F");
  const [hexLine, setHexLine] = useState("SYS OK · PIPE STABLE");

  useEffect(() => {
    if (!isActive) return;

    // controlled cadence: slower when focusLock enabled
    const interval = focusLock ? 220 : 150;
    const timer = setInterval(() => {
      const r = rngRef.current();
      const v = Math.floor(r * 65535);
      setHexCode(`0x${toHex4(v)}`);

      const tags = ["CACHE", "PIPE", "SCHED", "IO", "ALLOC", "BRANCH", "TLB", "GPU"];
      const states = ["OK", "SYNC", "LOCK", "IDLE", "LIVE", "HOT", "CALM"];
      const tag = tags[Math.floor(rngRef.current()() * tags.length)];
      const st = states[Math.floor(rngRef.current()() * states.length)];

      // micro status that correlates with progress (feels real)
      const load = Math.round(lerp(18, 96, done));
      setHexLine(`${tag} ${st} · LOAD ${load}%`);
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, focusLock, done]);

  const ticks = useMemo(() => [...Array(60)], []);

  // micro-goals thresholds (done-based)
  const milestones = useMemo(() => [0.4, 0.7, 0.9], []);
  const hitCount = milestones.filter((m) => done >= m).length;

  // breathe pulse phase (CSS variable)
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!isActive || !breathPace) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      // 0.12~0.22 Hz breathing, slightly faster near end
      const br = lerp(0.12, 0.22, 1 - remain);
      const v = (Math.sin(t * Math.PI * 2 * br) + 1) * 0.5; // 0..1
      setPulse(v);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isActive, breathPace, remain]);

  // Distraction Shield: dampen animations when paused
  const animOpacity = isActive ? 1 : 0.35;
  const scanOpacity = focusLock ? 0.05 : 0.10;

  // color logic
  const mainColor = isWarning && isActive ? warnColor : textColor;

  return (
    <div
      className="relative flex items-center justify-center w-full h-full min-h-[400px] overflow-hidden select-none"
      style={
        {
          // breathe pulse for subtle glow
          ["--pulse" as any]: pulse,
        } as React.CSSProperties
      }
    >
      {/* Background grid (dimmer & cleaner) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: focusLock ? 0.018 : 0.03,
          backgroundImage: `
            radial-gradient(${alpha(textColor, 0.65)} 1px, transparent 1px),
            linear-gradient(to right, ${alpha(textColor, 0.50)} 1px, transparent 1px),
            linear-gradient(to bottom, ${alpha(textColor, 0.50)} 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px, 44px 44px, 44px 44px",
          maskImage: "radial-gradient(circle at center, black 38%, transparent 86%)",
        }}
      />

      {/* Focus helper overlay: reduces “visual entropy” */}
      {focusLock && isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 62%, rgba(0,0,0,0.52) 100%)`,
            opacity: 0.65,
          }}
        />
      )}

      {/* Core */}
      <div className="relative w-80 h-80 flex items-center justify-center" style={{ opacity: animOpacity }}>
        {/* Static ring */}
        <div className="absolute inset-0 rounded-full border border-current opacity-[0.06]" style={{ color: textColor }} />

        {/* Radar scan (slower + smoother, less “toy”) */}
        {isActive && (
          <div
            className="absolute inset-[-22px] rounded-full"
            style={{
              opacity: scanOpacity,
              background: `conic-gradient(from 0deg, ${alpha(mainColor, 0.95)}, transparent 45%)`,
              animation: `radar-spin ${focusLock ? 4.2 : 3.0}s linear infinite`,
              filter: `blur(${focusLock ? 0.6 : 0.2}px)`,
            }}
          />
        )}

        {/* Subtle breathing glow */}
        {isActive && breathPace && (
          <div
            className="absolute inset-[-30px] rounded-full pointer-events-none"
            style={{
              opacity: lerp(0.10, 0.22, pulse),
              background: `radial-gradient(circle at 50% 50%, ${alpha(mainColor, 0.22)} 0%, ${alpha(
                mainColor,
                0.07
              )} 45%, rgba(0,0,0,0) 75%)`,
              transition: "opacity 120ms linear",
            }}
          />
        )}

        <svg className="absolute inset-[-40px] w-[calc(100%+80px)] h-[calc(100%+80px)] -rotate-90 overflow-visible">
          {/* Ticks */}
          {ticks.map((_, i) => {
            const angle = (i * 6) * (Math.PI / 180);
            const x1 = 200 + Math.cos(angle) * 140;
            const y1 = 200 + Math.sin(angle) * 140;
            const x2 = 200 + Math.cos(angle) * (i % 5 === 0 ? 160 : 152);
            const y2 = 200 + Math.sin(angle) * (i % 5 === 0 ? 160 : 152);

            // Active tick should represent done, not remain
            const isTickActive = i / 60 < done;

            const tickOpacity = isTickActive
              ? focusLock
                ? 0.65
                : isActive
                ? 0.85
                : 0.45
              : focusLock
              ? 0.015
              : 0.03;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth={i % 5 === 0 ? 2 : 1}
                className="transition-all duration-700"
                style={{
                  opacity: tickOpacity,
                  color: isWarning && isTickActive ? warnColor : textColor,
                }}
              />
            );
          })}

          {/* Progress arc (done) */}
          <circle
            cx="200"
            cy="200"
            r="130"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray={`${done * 816} 816`}
            className="transition-all duration-700 ease-out"
            style={{ color: mainColor, opacity: focusLock ? 0.22 : 0.30 }}
          />

          {/* Micro-goal rings */}
          {microGoals &&
            milestones.map((m, idx) => {
              const active = done >= m;
              const rr = 118 - idx * 10;
              return (
                <circle
                  key={m}
                  cx="200"
                  cy="200"
                  r={rr}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 1.2 : 0.8}
                  strokeDasharray="4 10"
                  style={{
                    color: mainColor,
                    opacity: active ? 0.22 : focusLock ? 0.06 : 0.09,
                    filter: active ? `drop-shadow(0 0 10px ${alpha(mainColor, 0.18)})` : "none",
                    transition: "opacity 500ms ease, filter 500ms ease",
                  }}
                />
              );
            })}
        </svg>

        {/* Center */}
        <div className="relative z-20 flex flex-col items-center">
          {/* Header status */}
          {!focusLock && (
            <div className="absolute -top-12 flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full bg-current"
                style={{
                  color: isWarning ? warnColor : textColor,
                  boxShadow: `0 0 ${10 + pulse * 14}px ${alpha(isWarning ? warnColor : textColor, 0.35)}`,
                  opacity: isActive ? 1 : 0.4,
                }}
              />
              <span
                className="text-[10px] font-mono tracking-[0.28em] opacity-45 uppercase"
                style={{ color: textColor }}
              >
                {hexLine} · {hexCode}
              </span>
            </div>
          )}

          <h1
            className={`text-[84px] font-thin tracking-tighter tabular-nums leading-none transition-all duration-500 ${
              isActive ? "scale-100" : "scale-95 opacity-40"
            }`}
            style={{
              color: mainColor,
              textShadow: isWarning && isActive
                ? `0 0 40px rgba(255, 77, 77, 0.25)`
                : `0 0 ${32 + pulse * 26}px ${alpha(textColor, 0.18)}`,
              transform: `translateZ(0)`,
            }}
          >
            {formatTime(seconds)}
          </h1>

          {/* Focus capsule: minimal & actionable */}
          <div
            className={`mt-6 px-4 py-2 rounded-full border transition-all duration-400 ${
              isActive ? "bg-current/5 border-current/20" : "bg-transparent border-current/5"
            }`}
            style={{ color: textColor }}
          >
            <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.2em]">
              <span className="opacity-55">{focusLock ? "FOCUS LOCK" : "EFFICIENCY"}</span>
              <span className="w-[1px] h-2 bg-current opacity-20" />
              <span className="font-bold">{Math.round(done * 100)}%</span>

              {microGoals && (
                <>
                  <span className="w-[1px] h-2 bg-current opacity-20" />
                  <span className="opacity-55">GOALS</span>
                  <span className="font-bold">{hitCount}/3</span>
                </>
              )}
            </div>
          </div>

          {/* Controls (tiny, non-intrusive) */}
          <div className="mt-3 flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-full border text-[10px] font-mono tracking-[0.18em] opacity-70 hover:opacity-100 transition"
              style={{ color: textColor, borderColor: alpha(textColor, 0.18), background: "rgba(0,0,0,0.12)" }}
              onClick={() => setFocusLock(v => !v)}
              type="button"
            >
              {focusLock ? "LOCK:ON" : "LOCK:OFF"}
            </button>

            <button
              className="px-3 py-1 rounded-full border text-[10px] font-mono tracking-[0.18em] opacity-70 hover:opacity-100 transition"
              style={{ color: textColor, borderColor: alpha(textColor, 0.18), background: "rgba(0,0,0,0.12)" }}
              onClick={() => setBreathPace(v => !v)}
              type="button"
            >
              BREATH:{breathPace ? "ON" : "OFF"}
            </button>

            <button
              className="px-3 py-1 rounded-full border text-[10px] font-mono tracking-[0.18em] opacity-70 hover:opacity-100 transition"
              style={{ color: textColor, borderColor: alpha(textColor, 0.18), background: "rgba(0,0,0,0.12)" }}
              onClick={() => setMicroGoals(v => !v)}
              type="button"
            >
              GOALS:{microGoals ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Bottom data: keep but make it “quiet” and meaningful */}
        {!focusLock && (
          <div
            className="absolute -bottom-16 w-full flex justify-between px-4 font-mono text-[8px]"
            style={{ color: textColor, opacity: 0.18 }}
          >
            <span>FLOW: {Math.round(lerp(42, 96, done))}%</span>
            <span>BUF: {(done * 1024).toFixed(0)}MB</span>
            <span>STABLE: {isActive ? "99.9%" : "—"}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* warning: do NOT glitch jitter, use controlled pulse (less fake, less distracting) */
        ${isWarning && isActive ? `
          h1 {
            animation: warning-pulse 1.2s ease-in-out infinite;
          }
          @keyframes warning-pulse {
            0%, 100% { filter: drop-shadow(0 0 0 rgba(255,77,77,0)); transform: scale(1); }
            50%      { filter: drop-shadow(0 0 24px rgba(255,77,77,0.25)); transform: scale(1.01); }
          }
        ` : ""}
      `}</style>
    </div>
  );
}
