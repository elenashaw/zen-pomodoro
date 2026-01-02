import React, { useMemo } from "react";

interface CreativeProps {
  seconds: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  isActive: boolean;
  textColor: string;
}

export default function CreativeDisplay({
  seconds,
  totalSeconds,
  formatTime,
  isActive,
  textColor,
}: CreativeProps) {
  const progress = seconds / (totalSeconds || 1);
  
  // 随机生成的流星粒子，只在计时时触发
  const meteors = useMemo(() => {
    return [...Array(8)].map((_, i) => ({
      id: i,
      left: 30 + Math.random() * 40,
      delay: Math.random() * 4,
      duration: 1.5 + Math.random() * 2
    }));
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[500px] h-[500px] select-none">
      
      {/* 1. 背景光晕：深邃的潮汐感 */}
      <div className={`absolute w-full h-full rounded-full transition-all duration-[3000ms] blur-[120px] 
        ${isActive ? 'opacity-30 scale-110' : 'opacity-10 scale-90'}`}
        style={{ background: `radial-gradient(circle at center, ${textColor}44 0%, transparent 70%)` }} 
      />

      {/* 2. 核心视觉：月蚀进度 (Eclipse) */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* 底层：发光的满月 */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-1000"
          style={{ 
            background: textColor,
            opacity: isActive ? 0.08 : 0.03,
            boxShadow: isActive ? `0 0 60px ${textColor}22` : 'none'
          }}
        />
        
        {/* 遮罩层：形成月蚀效果 (随着时间推移，遮罩逐渐移开或覆盖) */}
        <div 
          className="absolute inset-0 rounded-full bg-[#111] transition-all duration-1000 ease-linear"
          style={{ 
            transform: `translateX(${progress * 100}%)`, // 遮罩位移
            backgroundColor: 'inherit', // 跟随父级背景色或设定为深色
            filter: 'blur(10px)'
          }}
        />

        {/* 3. 星尘流星：从中心向下掉落 */}
        {isActive && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            {meteors.map(m => (
              <div 
                key={m.id}
                className="absolute w-[1px] h-12 animate-meteor-fall"
                style={{
                  left: `${m.left}%`,
                  top: '-10%',
                  background: `linear-gradient(to bottom, transparent, ${textColor})`,
                  animationDelay: `${m.delay}s`,
                  animationDuration: `${m.duration}s`
                }}
              />
            ))}
          </div>
        )}

        {/* 4. 时间数字：极致纤细与深邃 */}
        <div className="relative z-20 flex flex-col items-center">
          <h1 
            className="text-[110px] font-thin tracking-[-0.08em] leading-none transition-all duration-1000"
            style={{ 
              color: textColor,
              opacity: isActive ? 1 : 0.6,
              filter: `drop-shadow(0 0 20px ${textColor}33)`
            }}
          >
            {formatTime(seconds)}
          </h1>
          
          {/* 副标题：极简状态感 */}
          <div className="mt-6 overflow-hidden h-4">
             <span className={`block text-[9px] tracking-[0.8em] uppercase transition-all duration-1000 ${isActive ? 'translate-y-0 opacity-40' : 'translate-y-4 opacity-0'}`}>
               The Sound of Silence
             </span>
          </div>
        </div>
      </div>

      {/* 5. 底部潮汐池：随进度涨落的流沙 */}
      <div 
        className="absolute bottom-10 w-40 h-1 transition-all duration-[2000ms] rounded-full"
        style={{ 
          background: `linear-gradient(to right, transparent, ${textColor}, transparent)`,
          opacity: 0.1 + (1 - progress) * 0.4,
          transform: `scaleX(${0.5 + (1 - progress) * 1.5}) translateY(${(1-progress) * -10}px)`,
          boxShadow: `0 0 20px ${textColor}`
        }}
      />

      <style>{`
        @keyframes meteor-fall {
          0% { transform: translateY(0) scaleY(0); opacity: 0; }
          20% { opacity: 0.6; transform: translateY(50px) scaleY(1); }
          100% { transform: translateY(300px) scaleY(2); opacity: 0; }
        }
        .animate-meteor-fall {
          animation: meteor-fall linear infinite;
        }

        /* 数字细微呼吸 */
        h1 {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
    </div>
  );
}