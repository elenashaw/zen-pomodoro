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

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function hexToRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color.startsWith("#")) return null;
  const hex = color.slice(1);
  const full =
    hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}
function rgba(c: { r: number; g: number; b: number }, a: number) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}
function mix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

type Agent = {
  id: number;
  species: 0 | 1 | 2;
  p: Vec2;
  v: Vec2;
  last: Vec2;
  mass: number;

  hp: number;
  alive: boolean;

  targetId: number | null;
  phase: number;
  fade: number;

  // 每个体的“命运偏移”：决定衰亡期死得早晚
  doom: number;
};

type Aura = { p: Vec2; species: 0 | 1 | 2; life: number; r0: number };
type Spark = { p: Vec2; v: Vec2; life: number; species: 0 | 1 | 2 };

export default function TriDuelDisplay({
  seconds,
  totalSeconds,
  formatTime,
  isActive,
  textColor,
  seed = 20251230,
}: LifeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const pointer = useRef({ x: 0, y: 0, active: false, down: false, pulse: 0 });

  const agentsRef = useRef<Agent[]>([]);
  const aurasRef = useRef<Aura[]>([]);
  const sparksRef = useRef<Spark[]>([]);

  const nextIdRef = useRef(1);

  const base = useMemo(() => hexToRgb(textColor) ?? { r: 255, g: 255, b: 255 }, [textColor]);
  const col0 = useMemo(() => mix(base, { r: 80, g: 255, b: 210 }, 0.35), [base]);
  const col1 = useMemo(() => mix(base, { r: 255, g: 120, b: 220 }, 0.35), [base]);
  const col2 = useMemo(() => mix(base, { r: 160, g: 180, b: 255 }, 0.35), [base]);

  const sClamped = Math.max(0, seconds);
  const progress = Math.max(0, sClamped / (totalSeconds || 1)); // UI计时用
  const energy = 0.35 + 0.65 * (1 - smoothstep(0, 1, progress));

  // ✅ Afterlife：计时结束后，世界继续跑这么久（你可以改成 30 更“生物”）
  const afterlifeSeconds = 18;

  // ✅ 死亡窗：在倒计时的最后一段进入“衰亡前兆”，但不清场
  const deathWindowSeconds = Math.max(20, Math.floor((totalSeconds || 1) * 0.15));

  // 数量随计时变化：0秒后不再生成（世界只衰亡）
  const minN = 60;
  const maxN = 170;
  const spawnAllowed = seconds > 0;
  const targetTotal = spawnAllowed
    ? Math.round(minN + (maxN - minN) * smoothstep(0.02, 0.98, 1 - progress))
    : 0;

  const ratios = useMemo(() => {
    const t = (1 - progress) * Math.PI * 2;
    const a = 0.34 + 0.08 * Math.sin(t + 0.0);
    const b = 0.33 + 0.08 * Math.sin(t + 2.1);
    const c = 0.33 + 0.08 * Math.sin(t + 4.2);
    const s = a + b + c;
    return [a / s, b / s, c / s] as const;
  }, [progress]);

  const targetN0 = Math.round(targetTotal * ratios[0]);
  const targetN1 = Math.round(targetTotal * ratios[1]);
  const targetN2 = Math.max(0, targetTotal - targetN0 - targetN1);

  // pointer
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.current.x = e.clientX - rect.left;
      pointer.current.y = e.clientY - rect.top;
      pointer.current.active = true;
    };
    const onDown = () => {
      pointer.current.down = true;
      pointer.current.pulse = 1;
    };
    const onUp = () => (pointer.current.down = false);
    const onLeave = () => {
      pointer.current.active = false;
      pointer.current.down = false;
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // resize
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      el.width = Math.floor(rect.width * dpr);
      el.height = Math.floor(rect.height * dpr);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // spawn/trim（只有 seconds>0 才补充）
  useEffect(() => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    if (!spawnAllowed) return;

    const rnd = mulberry32(seed);
    const agents = agentsRef.current;

    const countAlive = (s: 0 | 1 | 2) => agents.reduce((acc, a) => acc + (a.alive && a.species === s ? 1 : 0), 0);

    const spawn = (species: 0 | 1 | 2, k: number) => {
      const cx = w * 0.5, cy = h * 0.5;
      for (let i = 0; i < k; i++) {
        const ang = rnd() * Math.PI * 2;
        const rad = Math.min(w, h) * (0.18 + 0.30 * rnd());
        const p = { x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad };
        const sp = 0.25 + rnd() * 0.70; // ✅ 更慢初速
        const v = { x: Math.cos(ang + 1.1) * sp, y: Math.sin(ang + 1.1) * sp };
        const id = nextIdRef.current++;
        agents.push({
          id,
          species,
          p,
          v,
          last: { ...p },
          mass: 0.9 + rnd() * 0.9,
          hp: 1,
          alive: true,
          targetId: null,
          phase: rnd() * 10,
          fade: 1,
          doom: rnd(),
        });
      }
    };

    const trim = (species: 0 | 1 | 2, k: number) => {
      const idx: number[] = [];
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        if (a.alive && a.species === species) idx.push(i);
      }
      for (let t = 0; t < k && idx.length > 0; t++) {
        const pick = Math.floor(rnd() * idx.length);
        const i = idx[pick];
        idx.splice(pick, 1);
        agents[i].hp = Math.min(agents[i].hp, 0.25);
      }
    };

    const n0 = countAlive(0), n1 = countAlive(1), n2 = countAlive(2);
    const d0 = targetN0 - n0;
    const d1 = targetN1 - n1;
    const d2 = targetN2 - n2;

    if (d0 > 0) spawn(0, Math.min(d0, 10));
    if (d1 > 0) spawn(1, Math.min(d1, 10));
    if (d2 > 0) spawn(2, Math.min(d2, 10));

    if (d0 < 0) trim(0, Math.min(-d0, 8));
    if (d1 < 0) trim(1, Math.min(-d1, 8));
    if (d2 < 0) trim(2, Math.min(-d2, 8));

    if (agents.length > 900) agents.splice(0, agents.length - 900);

    // 目标分配（单挑）
    const preyOf = (s: 0 | 1 | 2) => ((s + 1) % 3) as 0 | 1 | 2;
    const aliveBySpecies: Record<0 | 1 | 2, Agent[]> = { 0: [], 1: [], 2: [] };
    for (const a of agents) if (a.alive) aliveBySpecies[a.species].push(a);
    for (const a of agents) {
      if (!a.alive) continue;
      if (a.targetId !== null) continue;
      const prey = preyOf(a.species);
      const pool = aliveBySpecies[prey];
      if (pool.length > 0 && rnd() < 0.70) a.targetId = pool[Math.floor(rnd() * pool.length)].id;
    }
  }, [seed, spawnAllowed, targetN0, targetN1, targetN2]);

  function drawShape(ctx: CanvasRenderingContext2D, a: Agent, color: { r: number; g: number; b: number }, alpha: number, glow: number) {
    const ang = Math.atan2(a.v.y, a.v.x);
    const speed = Math.hypot(a.v.x, a.v.y);
    const base = 1.10 + 1.9 * glow;
    const s = base * (0.9 + 0.16 * Math.sin(a.phase));

    ctx.save();
    ctx.translate(a.p.x, a.p.y);
    ctx.rotate(ang);

    if (a.species === 0) {
      ctx.fillStyle = rgba(color, alpha * 1.55);
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rgba(color, alpha * 0.50);
      ctx.beginPath();
      ctx.arc(0, 0, s * (2.0 + 0.45 * Math.sin(a.phase * 1.2)), 0, Math.PI * 2);
      ctx.fill();
    } else if (a.species === 1) {
      const L = s * (1.8 + 0.8 * clamp(speed / 1.8, 0, 1));
      ctx.fillStyle = rgba(color, alpha * 1.45);
      ctx.beginPath();
      ctx.moveTo(L, 0);
      ctx.lineTo(-L * 0.55, L * 0.55);
      ctx.lineTo(-L * 0.30, 0);
      ctx.lineTo(-L * 0.55, -L * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rgba(color, alpha * 0.30);
      ctx.beginPath();
      ctx.ellipse(-L * 0.65, 0, s * 1.5, s * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = rgba(color, alpha * 1.10);
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.75, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = rgba(color, alpha * 1.15);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.80, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const rnd = mulberry32(seed ^ 0xC0FFEE);
    let lastT = performance.now();

    const preyOf = (s: 0 | 1 | 2) => ((s + 1) % 3) as 0 | 1 | 2;
    const colOf = (s: 0 | 1 | 2) => (s === 0 ? col0 : s === 1 ? col1 : col2);

    // ✅ 用真实时间累计 Afterlife（因为 seconds 不会变成负数给你用）
    let afterlifeClock = 0;

    const tick = (t: number) => {
      const dt = clamp((t - lastT) / 16.666, 0.5, 2.0);
      lastT = t;

      const { w, h, dpr } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const act = isActive ? 1 : 0.25;

      // 当 seconds==0 开始计 Afterlife
      if (seconds <= 0) afterlifeClock = Math.min(afterlifeSeconds, afterlifeClock + (dt * 16.666) / 1000);

      // deathEpoch：倒计时末段“前兆衰亡”（0..1）
      const deathEpoch = (() => {
        if (seconds <= 0) return 1; // 0秒后直接处于末世
        if (totalSeconds <= 0) return 0;
        if (seconds >= deathWindowSeconds) return 0;
        return 1 - clamp(seconds / deathWindowSeconds, 0, 1);
      })();

      // afterEpoch：0秒后“余生衰亡”（0..1），更像生物慢慢灭
      const afterEpoch = seconds <= 0 ? smoothstep(0, 1, afterlifeClock / afterlifeSeconds) : 0;

      // 背景尾迹
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0,0,0,${0.11 + 0.10 * (1 - act)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const agents = agentsRef.current;
      const auras = aurasRef.current;
      const sparks = sparksRef.current;

      const cx = w * 0.5, cy = h * 0.5;
      const p = pointer.current;
      const target: Vec2 = p.active ? { x: p.x, y: p.y } : { x: cx, y: cy };
      p.pulse = Math.max(0, p.pulse - 0.07 * dt);

      // ✅ 速度：随 afterEpoch 逐步衰减（不是一刀切）
      const baseMaxSpeed = (1.10 + 1.55 * energy) * (0.55 + 0.45 * act);
      const maxSpeed = baseMaxSpeed * (1 - 0.55 * afterEpoch);

      // 单体参数
      const sepR = 30 + 14 * energy;
      const seekR = 220 + 120 * energy;
      const biteR = 14 + 6 * energy;
      const coreR = 130;

      // 战斗：0秒后逐步失去战斗力（捕食欲望下降）
      const fightFactor = 1 - 0.85 * afterEpoch; // afterEpoch=1 时几乎不再打
      const bite = (0.026 + 0.050 * energy) * act * fightFactor;
      const heal = (0.010 + 0.018 * energy) * act * fightFactor;
      const knock = (0.09 + 0.12 * energy) * act * fightFactor;

      // ✅ 掉血：不是“最后一秒清场”，而是“末世+余生”两段叠加
      // - deathEpoch：末段开始微弱加速
      // - afterEpoch：0秒后逐步加速到最大
      const baseDrain = 0.002;                           // 平时几乎不掉血（更像“活着”）
      const deathBoost = (0.006 + 0.010 * energy) * deathEpoch; // 倒计时末段
      const afterBoostMax = (0.050 + 0.085 * energy);     // 余生期最终衰亡强度（保证最终灭绝）
      // 每个体按 doom 分布式进入 afterBoost（早死/晚死）
      // doom 越小越早进入衰亡
      const personalAfterGate = (a: Agent) => smoothstep(a.doom * 0.90, 1.0, afterEpoch);

      // 活体索引
      const aliveMap = new Map<number, Agent>();
      for (const a of agents) if (a.alive) aliveMap.set(a.id, a);

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        a.last.x = a.p.x;
        a.last.y = a.p.y;

        if (!a.alive) {
          a.fade = Math.max(0, a.fade - 0.020 * dt);
          const col = colOf(a.species);
          const alpha = 0.03 * a.fade;
          if (alpha > 0.001) {
            ctx.fillStyle = rgba(col, alpha);
            ctx.beginPath();
            ctx.arc(a.p.x, a.p.y, 6 + 18 * (1 - a.fade), 0, Math.PI * 2);
            ctx.fill();
          }
          continue;
        }

        // ✅ 分布式衰亡（像生物）
        const afterPersonal = personalAfterGate(a);
        const drain = baseDrain + deathBoost + afterBoostMax * afterPersonal;
        a.hp -= drain * dt;

        if (a.hp <= 0) {
          a.alive = false;
          a.fade = 1;

          // 自己颜色光晕
          auras.push({ p: { x: a.p.x, y: a.p.y }, species: a.species, life: 1, r0: 26 + 16 * energy });

          // 少量碎光
          const k = 5 + Math.floor(rnd() * 6);
          for (let s = 0; s < k; s++) {
            const ang = rnd() * Math.PI * 2;
            const sp = 0.6 + rnd() * (1.6 + 2.0 * energy);
            sparks.push({
              p: { x: a.p.x, y: a.p.y },
              v: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
              life: 1,
              species: a.species,
            });
          }
          continue;
        }

        // separation
        let sep = { x: 0, y: 0 };
        let nearCount = 0;
        for (let j = 0; j < agents.length; j++) {
          if (i === j) continue;
          const b = agents[j];
          if (!b.alive) continue;
          const dx = b.p.x - a.p.x;
          const dy = b.p.y - a.p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < sepR * sepR && d2 > 0.0001) {
            const inv = 1 / Math.sqrt(d2);
            const wSep = 1.0 + (sepR * sepR) / d2 * 0.50;
            sep.x -= dx * inv * wSep;
            sep.y -= dy * inv * wSep;
            nearCount++;
          }
        }

        // 单挑 target
        const prey = preyOf(a.species);
        const currentTarget = a.targetId !== null ? aliveMap.get(a.targetId) ?? null : null;
        let targetAgent: Agent | null = currentTarget;

        const tooFar =
          targetAgent
            ? (targetAgent.p.x - a.p.x) ** 2 + (targetAgent.p.y - a.p.y) ** 2 > seekR * seekR
            : true;

        if (!targetAgent || tooFar || targetAgent.species !== prey) {
          let best: Agent | null = null;
          let bestD2 = Infinity;
          for (const b of agents) {
            if (!b.alive) continue;
            if (b.species !== prey) continue;
            const dx = b.p.x - a.p.x;
            const dy = b.p.y - a.p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < seekR * seekR && d2 < bestD2) {
              bestD2 = d2;
              best = b;
            }
          }
          targetAgent = best;
          a.targetId = best ? best.id : null;
        }

        let seek = { x: 0, y: 0 };
        let distToTarget = 1e9;
        if (targetAgent) {
          const dx = targetAgent.p.x - a.p.x;
          const dy = targetAgent.p.y - a.p.y;
          distToTarget = Math.hypot(dx, dy) || 1;
          seek.x = dx / distToTarget;
          seek.y = dy / distToTarget;
        }

        // wander（余生期 wander 更“虚弱”）
        a.phase += 0.016 * dt * (0.6 + 0.7 * energy) * (1 - 0.35 * afterEpoch);
        const wander = {
          x: Math.cos(a.phase * 1.25 + a.id * 0.01),
          y: Math.sin(a.phase * 1.05 + a.id * 0.01),
        };

        // pointer 扰动（余生期弱化）
        const tx = target.x - a.p.x;
        const ty = target.y - a.p.y;
        const td = Math.hypot(tx, ty) || 1;
        const tdir = { x: tx / td, y: ty / td };
        const swirl = { x: -tdir.y, y: tdir.x };
        const swirlAmt = (p.down ? 0.10 : 0.04) * (0.25 + 0.75 * energy) * (1 - clamp(td / 420, 0, 1)) * (1 - 0.7 * afterEpoch);
        const attract = (p.down ? 0.06 : 0.02) * act * (1 - afterEpoch);

        let pulsePush = { x: 0, y: 0 };
        if (p.pulse > 0.001) {
          const inv = 1 / td;
          pulsePush.x = -tx * inv * (p.pulse * 2.2);
          pulsePush.y = -ty * inv * (p.pulse * 2.2);
        }

        const crowd = clamp(nearCount / 6, 0, 2.0);
        const sepW = 1.10 * (1 + 0.95 * crowd);
        const seekW = (0.40 + 0.45 * energy) * (1 - 0.40 * crowd) * fightFactor; // ✅ 余生期追击下降
        const wanW = (0.24 + 0.16 * (1 - energy)) * (1 - 0.25 * afterEpoch);

        const specSeek = a.species === 1 ? 1.20 : 1.0;
        const specWand = a.species === 0 ? 1.20 : 1.0;
        const specSep = a.species === 2 ? 1.20 : 1.0;

        const acc = {
          x:
            (sepW * specSep) * sep.x +
            (seekW * specSeek) * seek.x +
            (wanW * specWand) * wander.x +
            swirlAmt * swirl.x +
            attract * tdir.x +
            0.14 * pulsePush.x,
          y:
            (sepW * specSep) * sep.y +
            (seekW * specSeek) * seek.y +
            (wanW * specWand) * wander.y +
            swirlAmt * swirl.y +
            attract * tdir.y +
            0.14 * pulsePush.y,
        };

        const am = Math.hypot(acc.x, acc.y) || 1;
        const accCap = (0.80 + 0.22 * energy) * (1 - 0.45 * afterEpoch); // ✅ 余生期加速度更小
        if (am > accCap) {
          acc.x = (acc.x / am) * accCap;
          acc.y = (acc.y / am) * accCap;
        }

        a.v.x = (a.v.x + acc.x * dt) * 0.988;
        a.v.y = (a.v.y + acc.y * dt) * 0.988;

        // 中心留白
        const dxC = a.p.x - cx;
        const dyC = a.p.y - cy;
        const dC = Math.hypot(dxC, dyC) || 1;
        if (dC < coreR) {
          const k = (1 - dC / coreR);
          a.v.x += (dxC / dC) * (0.32 * k) * dt;
          a.v.y += (dyC / dC) * (0.32 * k) * dt;
        }

        // 限速
        const vm = Math.hypot(a.v.x, a.v.y) || 1;
        if (vm > maxSpeed) {
          a.v.x = (a.v.x / vm) * maxSpeed;
          a.v.y = (a.v.y / vm) * maxSpeed;
        }

        // 位移（余生期再降一点）
        const moveScale = 1.45 * (1 - 0.30 * afterEpoch);
        a.p.x += a.v.x * dt * moveScale;
        a.p.y += a.v.y * dt * moveScale;

        // wrap
        const margin = 24;
        if (a.p.x < -margin) a.p.x = w + margin;
        if (a.p.x > w + margin) a.p.x = -margin;
        if (a.p.y < -margin) a.p.y = h + margin;
        if (a.p.y > h + margin) a.p.y = -margin;

        // 攻击（余生期弱化，自然停止）
        if (targetAgent && distToTarget < biteR && fightFactor > 0.10) {
          targetAgent.hp -= bite * dt;
          a.hp = clamp(a.hp + heal * dt, 0, 1);

          const dx = targetAgent.p.x - a.p.x;
          const dy = targetAgent.p.y - a.p.y;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d, ny = dy / d;
          targetAgent.v.x += nx * knock * dt;
          targetAgent.v.y += ny * knock * dt;

          if (rnd() < 0.22) {
            sparks.push({
              p: { x: targetAgent.p.x, y: targetAgent.p.y },
              v: { x: (rnd() - 0.5) * 2.2, y: (rnd() - 0.5) * 2.2 },
              life: 0.55,
              species: a.species,
            });
          }
        }

        // draw
        const col = colOf(a.species);
        const glow = 0.20 + 0.80 * energy;
        const alpha = (0.055 + 0.16 * glow) * (0.35 + 0.65 * act);

        ctx.lineWidth = 1.0 + 0.8 * glow;
        ctx.strokeStyle = rgba(col, alpha);
        ctx.beginPath();
        ctx.moveTo(a.last.x, a.last.y);
        ctx.lineTo(a.p.x, a.p.y);
        ctx.stroke();

        drawShape(ctx, a, col, alpha, glow);
      }

      // auras（死亡光晕：自己颜色）
      for (let i = auras.length - 1; i >= 0; i--) {
        const A = auras[i];
        A.life -= 0.022 * dt;
        if (A.life <= 0) {
          auras.splice(i, 1);
          continue;
        }
        const col = colOf(A.species);
        const tLife = A.life;
        const inv = 1 - tLife;
        const radius = A.r0 + inv * (75 + 55 * energy);
        const alpha = 0.22 * tLife * tLife;

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = rgba(col, alpha);
        ctx.beginPath();
        ctx.arc(A.p.x, A.p.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = rgba(col, alpha * 0.33);
        ctx.beginPath();
        ctx.arc(A.p.x, A.p.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      // sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= 0.03 * dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.p.x += s.v.x * dt * 1.6;
        s.p.y += s.v.y * dt * 1.6;
        s.v.x *= 0.965;
        s.v.y *= 0.965;

        const col = colOf(s.species);
        ctx.fillStyle = rgba(col, 0.18 * s.life);
        ctx.beginPath();
        ctx.arc(s.p.x, s.p.y, 2.0 + 3.0 * (1 - s.life), 0, Math.PI * 2);
        ctx.fill();
      }

      // ✅ 停止条件：不是 0 秒，而是“Afterlife 跑完 + 场上全灭且没有余辉”
      if (seconds <= 0 && afterlifeClock >= afterlifeSeconds) {
        let anyAlive = false;
        for (const a of agentsRef.current) {
          if (a.alive) { anyAlive = true; break; }
          if (!a.alive && a.fade > 0.02) { anyAlive = true; break; }
        }
        if (!anyAlive && auras.length === 0 && sparks.length === 0) {
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [seed, energy, col0, col1, col2, isActive, totalSeconds, seconds]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "rgba(0,0,0,0)", touchAction: "none" }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <h1
            className="text-[130px] font-thin tracking-tighter opacity-70 select-none"
            style={{ color: textColor, textShadow: `0 0 50px ${textColor}44` }}
          >
            {formatTime(Math.max(0, seconds))}
          </h1>
        </div>
      </div>
    </div>
  );
}
