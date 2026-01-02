import React, { useMemo } from "react";

interface CreativeProps {
  seconds: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  isActive: boolean;
  textColor: string;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export default function CreativeDisplay({
  seconds,
  totalSeconds,
  formatTime,
  isActive,
  textColor,
}: CreativeProps) {
  // 进度：p = 已消耗(0->1). 倒计时 seconds 越小，p 越大
  const p = clamp01(1 - seconds / (totalSeconds || 1));

  // 流星粒子：只生成一次（OK），但给一点“随机分布更像自然”的 bias
  const meteors = useMemo(() => {
    return [...Array(10)].map((_, i) => {
      // 让流星更集中在中间区域但仍有随机性
      const u = Math.random();
      const biased = 0.5 + (u - 0.5) * 0.75;
      return {
        id: i,
        left: 20 + biased * 60,
        delay: Math.random() * 3.5,
        duration: 1.3 + Math.random() * 2.2,
        height: 36 + Math.random() * 42,
        width: Math.random() < 0.25 ? 2 : 1,
      };
    });
  }, []);

  // 月蚀：用“影子圆”覆盖“亮月圆”
  // 影子圆的中心从右侧滑到左侧（或反过来），产生更像真实月蚀的遮挡
  const shadowShift = (1 - p) * 120 - 60; // [-60, 60] 范围内滑动（你可以微调幅度）

  return (
    <div className="relative flex items-center justify-center w-[500px] h-[500px] select-none">
      {/* 背景光晕：更“深海潮汐”，加一层冷暗噪声感 */}
      <div
        className={`absolute w-full h-full rounded-full transition-all duration-[2500ms] blur-[130px] will-change-transform
        ${isActive ? "opacity-35 scale-110" : "opacity-12 scale-95"}`}
        style={{
          background: `radial-gradient(circle at 50% 45%, ${textColor}3d 0%, ${textColor}12 35%, transparent 70%)`,
        }}
      />

      {/* 轻微暗角，压住廉价的“纯发光球”感 */}
      <div
        className="absolute w-full h-full rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
          opacity: isActive ? 0.6 : 0.35,
        }}
      />

      {/* 核心：月面 */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* 亮月底层（含柔光与细微纹理感） */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-1000 will-change-transform"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${textColor} 0%, ${textColor}cc 35%, ${textColor}55 70%, ${textColor}22 100%)`,
            opacity: isActive ? 0.12 : 0.05,
            boxShadow: isActive ? `0 0 70px ${textColor}22` : `0 0 35px ${textColor}12`,
          }}
        />

        {/* 月蚀层：影子圆（关键修正） */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* 影子圆：比月面略大，边缘 blur 形成“蚀边” */}
          <div
            className="absolute rounded-full transition-transform duration-700 ease-out will-change-transform"
            style={{
              width: "120%",
              height: "120%",
              left: "-10%",
              top: "-10%",
              transform: `translateX(${shadowShift}%)`,
              background:
                "radial-gradient(circle at 45% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.0) 82%)",
              filter: "blur(10px)",
              opacity: 0.92,
              mixBlendMode: "multiply",
            }}
          />
        </div>

        {/* 星尘流星 */}
        {isActive && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            {meteors.map((m) => (
              <div
                key={m.id}
                className="absolute animate-meteor-fall"
                style={{
                  left: `${m.left}%`,
                  top: "-12%",
                  width: `${m.width}px`,
                  height: `${m.height}px`,
                  background: `linear-gradient(to bottom, transparent, ${textColor}cc)`,
                  animationDelay: `${m.delay}s`,
                  animationDuration: `${m.duration}s`,
                  filter: `drop-shadow(0 0 10px ${textColor}55)`,
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        )}

        {/* 时间数字 */}
        <div className="relative z-20 flex flex-col items-center">
          <h1
            className="text-[110px] font-thin tracking-[-0.08em] leading-none transition-all duration-700 will-change-transform"
            style={{
              color: textColor,
              opacity: isActive ? 1 : 0.65,
              filter: `drop-shadow(0 0 22px ${textColor}33)`,
              transform: isActive ? "translateY(0)" : "translateY(1px)",
            }}
          >
            {formatTime(seconds)}
          </h1>

          <div className="mt-6 overflow-hidden h-4">
            <span
              className={`block text-[9px] tracking-[0.8em] uppercase transition-all duration-700
              ${isActive ? "translate-y-0 opacity-40" : "translate-y-4 opacity-0"}`}
              style={{ color: textColor }}
            >
              The Sound of Silence
            </span>
          </div>
        </div>
      </div>

      {/* 底部潮汐池：更稳定（避免 progress 反向导致“结束时更亮”的怪感） */}
      <div
        className="absolute bottom-10 w-44 h-[2px] transition-all duration-[1800ms] rounded-full"
        style={{
          background: `linear-gradient(to right, transparent, ${textColor}, transparent)`,
          opacity: isActive ? 0.12 + p * 0.35 : 0.08,
          transform: `scaleX(${0.6 + p * 1.4}) translateY(${(1 - p) * 6}px)`,
          boxShadow: `0 0 20px ${textColor}55`,
        }}
      />

      <style>{`
        @keyframes meteor-fall {
          0%   { transform: translateY(0) scaleY(0.4); opacity: 0; }
          12%  { opacity: 0.65; }
          55%  { opacity: 0.45; }
          100% { transform: translateY(320px) scaleY(2.2); opacity: 0; }
        }
        .animate-meteor-fall {
          animation: meteor-fall linear infinite;
        }
        h1 {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        /* 可选：尊重系统减少动画 */
        @media (prefers-reduced-motion: reduce) {
          .animate-meteor-fall { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
