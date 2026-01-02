import { useState, useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";
// 引入子模式组件
import CreativeDisplay from "./CreativeDisplay";
import EfficiencyDisplay from "./EfficiencyDisplay";
import ButterflyDisplay from "./ButterflyDisplay";
import Geo from "./Geo";
import Lunareclipse from "./Lunareclipse";
import Organism from "./Organism";

interface TimerDisplayProps {
  seconds: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  setSeconds: (s: number | ((prev: number) => number)) => void;
  textColor: string;
}

type DisplayMode = 'Focus' | 'Flow' | 'Efficient' | 'Nature' | 'Geo' | 'Moon' | 'Bio';

export default function TimerDisplay(props: TimerDisplayProps) {
  const [mode, setMode] = useState<DisplayMode>('Focus');
  const [isHovered, setIsHovered] = useState(false);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const modes: DisplayMode[] = ['Focus', 'Flow', 'Efficient', 'Nature', 'Geo', 'Moon', 'Bio'];

  useEffect(() => {
    const el = capsuleRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const onScroll = () => {
    if (!capsuleRef.current) return;
    const { scrollLeft, offsetWidth } = capsuleRef.current;
    if (offsetWidth === 0) return;
    const index = Math.round(scrollLeft / offsetWidth);
    if (modes[index] && modes[index] !== mode) setMode(modes[index]);
  };

  return (
    /* 修改点：确保容器是占满全部且溢出隐藏 */
    <div className="flex flex-col items-center w-full h-full relative overflow-hidden"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
      
      {/* 核心显示区优化：使用 flex-grow 并配合 relative 撑开空间 */}
      <div 
        onClick={() => props.setIsActive(!props.isActive)}
        className="relative flex-grow w-full flex items-center justify-center transition-all duration-700 cursor-pointer"
      >
        {/* 使用 absolute inset-0 确保组件在父级范围内缩放，不会撑大父级 */}
        <div key={mode} className="absolute inset-0 flex items-center justify-center animate-mode-in pointer-events-none">
          {/* 内部组件需要响应式，外层 pointer-events-none 防止遮挡点击，内部开启 */}
          <div className="pointer-events-auto w-full h-full flex items-center justify-center">
            {mode === 'Focus' && (
              <div className="flex flex-col items-center">
                <h1 className="text-[120px] font-thin tabular-nums leading-none" style={{ color: props.textColor }}>
                  {props.formatTime(props.seconds)}
                </h1>
                <div className={`mt-10 h-[1.5px] w-12 transition-all duration-1000 ${props.isActive ? 'bg-current opacity-40 animate-pulse' : 'bg-current opacity-5'}`} style={{ color: props.textColor }} />
              </div>
            )}
            
            {mode === 'Flow' && <CreativeDisplay {...props} />}
            {mode === 'Efficient' && <EfficiencyDisplay {...props} />}
            {mode === 'Nature' && <ButterflyDisplay {...props} />}
            {mode === 'Geo' && <Geo {...props} />}
            {mode === 'Moon' && <Lunareclipse {...props} />}
            {mode === 'Bio' && <Organism {...props} />}
          </div>
        </div>
      </div>

      {/* 控制仓：位置固定在底部，不受上方组件大小波动影响 */}
      <div className={`shrink-0 mb-12 flex items-center gap-4 z-[100] transition-all duration-700
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        
        <div className="relative w-[140px] h-9 bg-black/20 backdrop-blur-2xl border border-white/5 rounded-full overflow-hidden"
             style={{ borderColor: `${props.textColor}15` }}>
          <div ref={capsuleRef} onScroll={onScroll} className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
            {modes.map((m) => (
              <div key={m} className="flex-none w-full h-full flex items-center justify-center snap-center">
                <span className={`text-[9px] tracking-[0.4em] uppercase transition-all duration-500 ${mode === m ? 'font-bold' : 'opacity-20'}`} style={{ color: props.textColor }}>
                  {m}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); props.setIsActive(false); props.setSeconds(props.totalSeconds); }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-2xl border border-white/5 hover:bg-white/10 transition-all active:scale-90"
          style={{ color: props.textColor, borderColor: `${props.textColor}15` }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        @keyframes mode-in {
          0% { opacity: 0; transform: scale(0.96); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        .animate-mode-in {
          animation: mode-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}