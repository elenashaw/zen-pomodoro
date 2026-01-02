import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
// 1. 引入 Settings2 图标
import { X, Calendar, ChevronLeft, Minimize2, Maximize2, Zap, Settings2 } from "lucide-react";

import Sidebar from "./components/Sidebar";
import HistoryPanel from "./components/HistoryPanel";
import TimerDisplay from "./components/TimerDisplay";
import SoundCapsule from "./components/SoundCapsule";
// 2. 引入 Accustom 模块
import Accustom from "./components/Accustom";

const appWindow = getCurrentWindow();

const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function App() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  // --- Accustom 模块所需的状态 ---
  const [isAccustomOpen, setIsAccustomOpen] = useState(false);
  const [cycleConfig, setCycleConfig] = useState({
    focusMinutes: 25,
    restMinutes: 5,
    sessions: 4
  });

  const [activeSoundIds, setActiveSoundIds] = useState<string[]>([]);
  const [soundVolumes, setSoundVolumes] = useState<{ [key: string]: number }>({});
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false);

  const [textColor, setTextColor] = useState("#ffffff");
  const [baseBgColor, setBaseBgColor] = useState('#1e293b');
  const [bgOpacity, setBgOpacity] = useState(0.8);
  const [showBorder, setShowBorder] = useState(true);

  // 1. 滚轮调节逻辑
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isActive) {
      const step = e.shiftKey ? 300 : 60;
      let newSec = e.deltaY < 0 ? Math.min(seconds + step, 5940) : Math.max(seconds - step, 60);
      setSeconds(newSec);
      setInitialSeconds(newSec);
    }
  }, [isActive, seconds]);

  // 2. 计时引擎
  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(prev => prev - 1), 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  // 3. 窗口管理
  useEffect(() => {
    const syncWindow = async () => {
      try {
        if (isMiniMode) {
          await appWindow.setResizable(true);
          await appWindow.setSize(new LogicalSize(220, 64));
          await appWindow.setAlwaysOnTop(true);
          await appWindow.setResizable(false);
        } else {
          await appWindow.setResizable(true);
          await appWindow.setSize(new LogicalSize(850, 650));
          await appWindow.setAlwaysOnTop(false);
        }
      } catch (e) { console.error(e); }
    };
    syncWindow();
  }, [isMiniMode]);

  // --- 重新封装传递给 SoundCapsule 的 Props ---
  const commonProps = {
    textColor, setTextColor, baseBgColor, setBaseBgColor, bgOpacity, setBgOpacity,
    showBorder, setShowBorder, 
    isCapsuleOpen, setIsCapsuleOpen, 
    isMusicPlaying, setIsMusicPlaying,
    activeSoundIds, setActiveSoundIds,
    soundVolumes, setSoundVolumes
  };

  return (
    <div 
      onWheel={handleWheel}
      className={`flex flex-col items-center overflow-hidden select-none relative transition-all duration-1000
        ${isMiniMode ? 'w-full h-full p-0' : 'h-screen w-screen'}`}
      style={{ 
        backgroundColor: hexToRgba(baseBgColor, bgOpacity), 
        borderRadius: isMiniMode ? '20px' : '44px', 
        border: showBorder ? (isMiniMode ? `1px solid ${textColor}15` : `1.5px solid ${textColor}33`) : 'none', 
        color: textColor,
      }}
    >
      {/* 3. 放置 Accustom 面板模块（并加入一键应用逻辑） */}
      <Accustom 
        isOpen={isAccustomOpen} 
        onClose={() => setIsAccustomOpen(false)} 
        config={cycleConfig} 
        setConfig={setCycleConfig} 
        textColor={textColor} 
        baseBgColor={baseBgColor} 
        onApply={(newConfig: any) => {
          const targetSeconds = newConfig.focusMinutes * 60;
          setInitialSeconds(targetSeconds); // 重置进度条基准
          setSeconds(targetSeconds);        // 立即更新当前时间
          setIsActive(false);               // 切换安排时先停止计时
          setIsAccustomOpen(false);         // 自动收起面板
        }}
      />

      {isMiniMode ? (
        <div data-tauri-drag-region className="w-full h-full flex items-center justify-between px-4 cursor-grab group">
          <div className="scale-[0.75] origin-left">
            <TimerDisplay 
              seconds={seconds} totalSeconds={initialSeconds}
              formatTime={(s:number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`} 
              isActive={isActive} setIsActive={setIsActive} setSeconds={setSeconds} textColor={textColor} 
            />
          </div>
          <button onClick={() => setIsMiniMode(false)} className="p-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all rounded-full">
            <Maximize2 size={14} />
          </button>
        </div>
      ) : (
        <>
          {isSidebarOpen && <div className="absolute inset-0 z-[100] bg-black/10 backdrop-blur-[2px]" onClick={() => setIsSidebarOpen(false)} />}
          
          {/* 拉手 */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`fixed top-1/2 flex items-center justify-center z-[200] transition-all duration-700 group rounded-r-[24px] h-24 
              ${isSidebarOpen ? 'w-5' : 'w-2 hover:w-6 handle-breathing'}`}
            style={{ 
              left: 0, transform: `translate(${isSidebarOpen ? '340px' : '0'}, -50%)`, 
              backgroundColor: isSidebarOpen ? baseBgColor : `${textColor}22`,
              color: textColor
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <div className="w-1 h-8 rounded-full bg-current opacity-20" />}
          </button>

          <div className="w-full flex flex-col shrink-0 z-10 p-4 pt-6">
            <div data-tauri-drag-region className="w-full flex items-center justify-between px-4 cursor-grab">
              <button onClick={() => setIsHistoryOpen(true)} className="p-2 opacity-30 hover:opacity-100 transition-all"><Calendar size={20}/></button>
              
              {/* 4. 顶部 Accustom 触发按钮 */}
              <button 
                onClick={() => setIsAccustomOpen(true)} 
                className="p-2 opacity-30 hover:opacity-100 transition-all flex items-center gap-2"
              >
                <Settings2 size={20}/>
                <span className="text-[10px] font-black tracking-widest hidden sm:block">ACCUSTOM</span>
              </button>

              <div className="flex items-center gap-1">
                <button onClick={() => setIsMiniMode(true)} className="p-2 opacity-30 hover:opacity-100 transition-all"><Minimize2 size={20}/></button>
                <button onClick={() => appWindow.close()} className="p-2 opacity-30 hover:text-red-400 transition-all"><X size={20}/></button>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center w-full relative z-10">
            <TimerDisplay 
              seconds={seconds} totalSeconds={initialSeconds}
              formatTime={(s:number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`} 
              isActive={isActive} setIsActive={setIsActive} setSeconds={setSeconds} textColor={textColor} 
            />
          </div>

          {/* 环境音胶囊 */}
          <div className="mb-14 relative z-[85]">
            <SoundCapsule {...commonProps} />
          </div>

          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} {...commonProps} />
          <HistoryPanel isHistoryOpen={isHistoryOpen} setIsHistoryOpen={setIsHistoryOpen} textColor={textColor} />
        </>
      )}

      <style>{`
        @keyframes handle-pulse { 0%, 100% { opacity: 0.6; transform: translate(0px, -50%); } 50% { opacity: 1; transform: translate(6px, -50%); } }
        .handle-breathing { animation: handle-pulse 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}