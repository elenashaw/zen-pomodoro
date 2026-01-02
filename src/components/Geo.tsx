import React, { useEffect, useMemo, useRef } from "react";

interface LifeDisplayProps {
  seconds: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  isActive: boolean;
  textColor: string;
  seed?: number;
}

type Vec2 = { x: number; y: number };
type Agent = {
  id: number;
  species: number;
  p: Vec2;
  v: Vec2;
  phase: number;
  doom: number;
  size: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) | 0;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(color: string) {
  const hex = color.startsWith("#") ? color.slice(1) : color;
  const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
  const r = parseInt(full.slice(0, 2), 16) || 255;
  const g = parseInt(full.slice(2, 4), 16) || 255;
  const b = parseInt(full.slice(4, 6), 16) || 255;
  return { r, g, b };
}

export default function Geo({
  seconds,
  totalSeconds,
  formatTime,
  isActive,
  textColor,
  seed = 888,
}: LifeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const agentsRef = useRef<Agent[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  
  const stateRef = useRef({ seconds, totalSeconds, isActive, textColor });
  useEffect(() => {
    stateRef.current = { seconds, totalSeconds, isActive, textColor };
  }, [seconds, totalSeconds, isActive, textColor]);

  const baseCol = useMemo(() => hexToRgb(textColor), [textColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- 核心：使用 ResizeObserver 监听容器真实尺寸，解决拉伸问题 ---
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        sizeRef.current = { w, h, dpr };
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        
        // 第一次或尺寸变化剧烈时初始化粒子
        if (agentsRef.current.length === 0) {
          const rnd = mulberry32(seed);
          const n = clamp(Math.floor((w * h) / 10000), 80, 140);
          const arr: Agent[] = [];
          for (let i = 0; i < n; i++) {
            arr.push({
              id: i, species: (rnd() * 2) | 0,
              p: { x: rnd() * w, y: rnd() * h },
              v: { x: (rnd() - 0.5) * 0.4, y: (rnd() - 0.5) * 0.4 },
              phase: rnd() * Math.PI * 2,
              doom: rnd(),
              size: 2.5 + rnd() * 4,
            });
          }
          agentsRef.current = arr;
        }
      }
    });

    ro.observe(container);

    const MAX_DIST = 120; 
    const CELL = MAX_DIST;

    const render = () => {
      const { w, h, dpr } = sizeRef.current;
      if (w <= 0 || h <= 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      
      const st = stateRef.current;
      const progress = clamp(st.seconds / (st.totalSeconds || 1), 0, 1);
      const deathWindow = st.seconds < 15 ? 1 - st.seconds / 15 : 0;
      const speedFactor = st.isActive ? 1.0 : 0.15;

      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;
      const grid: number[][] = Array.from({ length: cols * rows }, () => []);

      // 1. 物理更新
      agentsRef.current.forEach((a, i) => {
        const pFade = smoothstep(a.doom * 0.65, 1.0, deathWindow);
        const life = st.seconds <= 0 ? 0 : (1 - pFade);

        a.phase += 0.012 * speedFactor;
        a.p.x += (a.v.x + Math.cos(a.phase) * 0.15) * speedFactor;
        a.p.y += (a.v.y + Math.sin(a.phase) * 0.15) * speedFactor;

        // 环绕逻辑：基于容器宽高 w 和 h
        if (a.p.x < -50) a.p.x = w + 50;
        if (a.p.x > w + 50) a.p.x = -50;
        if (a.p.y < -50) a.p.y = h + 50;
        if (a.p.y > h + 50) a.p.y = -50;

        const gx = clamp(Math.floor((a.p.x + 50) / CELL), 0, cols - 1);
        const gy = clamp(Math.floor((a.p.y + 50) / CELL), 0, rows - 1);
        grid[gy * cols + gx].push(i);

        const alpha = (0.2 + 0.3 * progress) * life;
        if (alpha > 0) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${baseCol.r}, ${baseCol.g}, ${baseCol.b}, ${alpha})`;
          ctx.arc(a.p.x, a.p.y, a.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 2. 连线
      ctx.globalCompositeOperation = "lighter";
      agentsRef.current.forEach((a, i) => {
        const pFade = smoothstep(a.doom * 0.65, 1.0, deathWindow);
        const life = st.seconds <= 0 ? 0 : (1 - pFade);
        const baseL = (0.3 + 0.3 * progress) * life;
        
        const gx = Math.floor((a.p.x + 50) / CELL);
        const gy = Math.floor((a.p.y + 50) / CELL);

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const nx = gx + ox, ny = gy + oy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              grid[ny * cols + nx].forEach(j => {
                if (j <= i) return;
                const b = agentsRef.current[j];
                if (a.species !== b.species) return;
                const dx = a.p.x - b.p.x, dy = a.p.y - b.p.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < MAX_DIST * MAX_DIST) {
                  const d = Math.sqrt(d2);
                  const strength = Math.pow(1 - d / MAX_DIST, 2);
                  ctx.beginPath();
                  ctx.strokeStyle = `rgba(${baseCol.r}, ${baseCol.g}, ${baseCol.b}, ${strength * 0.5 * baseL})`;
                  ctx.lineWidth = 1.0;
                  ctx.moveTo(a.p.x, a.p.y);
                  ctx.lineTo(b.p.x, b.p.y);
                  ctx.stroke();
                }
              });
            }
          }
        }
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [seed, baseCol]);

  return (
    // 使用 absolute inset-0 确保填满父级那个带圆角的浮层
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <canvas ref={canvasRef} className="block w-full h-full opacity-80" />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <h1
            className="text-[120px] font-thin tracking-tighter tabular-nums"
            style={{ 
              color: textColor,
              textShadow: `0 0 50px ${textColor}33`,
              opacity: seconds <= 0 ? 0 : (isActive ? 1 : 0.5)
            }}
          >
            {formatTime(seconds)}
          </h1>
          <div className={`mt-4 text-[9px] tracking-[0.5em] uppercase transition-opacity duration-1000 ${isActive ? 'opacity-30' : 'opacity-0'}`} style={{ color: textColor }}>
            Neural Network
          </div>
        </div>
      </div>
    </div>
  );
}