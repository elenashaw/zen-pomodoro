import React, { useEffect, useMemo, useRef, useState } from "react";

interface Props {
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
    const parts = m[1].split(",").map(s => s.trim());
    const [r, g, b] = parts;
    if (r && g && b) return `rgba(${r},${g},${b},${a})`;
  }
  return `rgba(255,255,255,${a})`;
}

export default function LivingBioCountdown({
  seconds, totalSeconds, formatTime, isActive, textColor,
}: Props) {
  const p = clamp01(1 - seconds / (totalSeconds || 1));
  const stress = Math.pow(p, 2.2);

  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT(v => v + dt);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
  }, [isActive]);

  const jitter = useMemo(() => (Math.random() * 2 - 1) * 0.08, []);
  const HR = lerp(0.9, 2.2, stress) * (1 + jitter * 0.6);
  const BR = lerp(0.18, 0.55, stress) * (1 + jitter * 0.3);

  const breathe = 1 + Math.sin(t * Math.PI * 2 * BR) * lerp(0.02, 0.07, stress);
  const beat    = Math.max(0, Math.sin(t * Math.PI * 2 * HR)) ** 2;
  const tone    = lerp(0.25, 0.9, stress);

  const baseFreq1 = lerp(0.006, 0.014, tone);
  const baseFreq2 = lerp(0.020, 0.035, tone);
  const dispScale = lerp(10, 28, tone) + beat * lerp(6, 16, stress);

  const glow = alpha(textColor, lerp(0.10, 0.22, stress) + beat * 0.08);

  return (
    /* 核心修改：缩减最大尺寸到 380px，并确保不会超出父级容器的高度 */
    <div className="relative flex items-center justify-center w-full h-full max-w-[380px] max-h-[380px] mx-auto select-none">
      {/* 调整发光范围，使其更紧凑 */}
      <div
        className="absolute inset-0 rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(circle at 48% 45%,
            ${alpha(textColor, 0.22)} 0%,
            ${alpha(textColor, 0.06)} 45%,
            rgba(0,0,0,0) 70%)`,
          opacity: isActive ? 0.5 : 0.2,
          transition: "opacity 800ms ease",
        }}
      />

      {/* SVG 保持比例缩放 */}
      <svg viewBox="0 0 420 420" className="relative w-full h-full overflow-visible">
        <defs>
          <filter id="bioWarp" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${baseFreq1} ${baseFreq1}`}
              numOctaves="2"
              seed="2"
              result="noiseA"
            />
            <feTurbulence
              type="turbulence"
              baseFrequency={`${baseFreq2} ${baseFreq2}`}
              numOctaves="1"
              seed="9"
              result="noiseB"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComposite in="noiseA" in2="noiseB" operator="arithmetic" k1="0" k2="0.8" k3="0.6" k4="0" result="field" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="field"
              scale={dispScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <radialGradient id="bioBody" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor={alpha(textColor, 0.18 + beat * 0.10)} />
            <stop offset="35%" stopColor={alpha(textColor, 0.10)} />
            <stop offset="70%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
          </radialGradient>
        </defs>

        <g filter={isActive ? "url(#bioWarp)" : undefined} opacity={isActive ? 1 : 0.7}>
          <circle
            cx="210" cy="210" r={145 * breathe}
            fill="url(#bioBody)"
            style={{
              transformOrigin: "210px 210px",
              transform: `scale(${breathe})`,
              transition: "transform 80ms linear",
            }}
          />
          <circle
            cx="210" cy="210" r={148 * breathe}
            fill="none"
            stroke={glow}
            strokeWidth={2 + beat * 1.2}
            opacity={0.55 + beat * 0.25}
          />
        </g>

        <g>
          <text
            x="210" y="222"
            textAnchor="middle"
            style={{
              fill: textColor,
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
              fontSize: 84,
              fontWeight: 200,
              letterSpacing: "-0.08em",
              filter: `drop-shadow(0 0 ${18 + beat * 10}px ${alpha(textColor, 0.22)})`,
            }}
          >
            {formatTime(seconds)}
          </text>

          <text
            x="210" y="275"
            textAnchor="middle"
            style={{
              fill: alpha(textColor, 0.45),
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
              fontSize: 11,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              opacity: isActive ? 0.7 : 0,
              transition: "opacity 500ms ease",
            }}
          >
            organism state · {Math.round(lerp(12, 92, stress))}%
          </text>
        </g>
      </svg>

      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,0.45) 100%)",
          opacity: isActive ? 0.6 : 0.35,
          transition: "opacity 800ms ease",
        }}
      />
    </div>
  );
}