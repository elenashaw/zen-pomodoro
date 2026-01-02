import { X, Zap, Coffee, Repeat, Volume2, Play, Minus, Plus } from "lucide-react";

interface AccustomProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    focusMinutes: number;
    restMinutes: number;
    sessions: number;
  };
  setConfig: (config: any) => void;
  onApply: (config: any) => void; // 新增：执行回调
  textColor: string;
  baseBgColor: string;
}

export default function Accustom({ isOpen, onClose, config, setConfig, onApply, textColor, baseBgColor }: AccustomProps) {
  
  const updateConfig = (key: string, value: number) => {
    setConfig({ ...config, [key]: Math.max(1, value) });
  };

  return (
    <div 
      className={`absolute top-0 left-0 right-0 z-[250] transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
        ${isOpen ? 'h-[480px] opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}
      style={{ 
        backgroundColor: `${baseBgColor}FD`, 
        borderBottom: `1px solid ${textColor}20`,
        backdropFilter: 'blur(60px)'
      }}
    >
      <div className="p-10 h-full flex flex-col">
        
        {/* 顶部标题 */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-[12px] font-black tracking-[0.6em] uppercase" style={{ color: textColor }}>Preset Architect</h2>
            <p className="text-[8px] font-medium opacity-30 tracking-widest mt-1" style={{ color: textColor }}>CONSTRUCT YOUR WORKING RHYTHM</p>
          </div>
          <button onClick={onClose} className="p-2 opacity-40 hover:opacity-100 transition-all" style={{ color: textColor }}>
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-12">
          {/* 专注时长 */}
          <div className="flex flex-col gap-4 group">
            <div className="flex items-center gap-2 opacity-20">
              <Zap size={14} />
              <span className="text-[10px] font-black tracking-widest">FOCUS TIME</span>
            </div>
            <div className="flex items-baseline gap-3">
              <input 
                type="number" 
                value={config.focusMinutes}
                onChange={(e) => updateConfig('focusMinutes', parseInt(e.target.value) || 1)}
                className="bg-transparent text-6xl font-black outline-none w-28"
                style={{ color: textColor }}
              />
              <span className="text-xs font-bold opacity-20 uppercase">Min</span>
            </div>
          </div>

          {/* 休息时长 */}
          <div className="flex flex-col gap-4 group">
            <div className="flex items-center gap-2 opacity-20">
              <Coffee size={14} />
              <span className="text-[10px] font-black tracking-widest">REST TIME</span>
            </div>
            <div className="flex items-baseline gap-3">
              <input 
                type="number" 
                value={config.restMinutes}
                onChange={(e) => updateConfig('restMinutes', parseInt(e.target.value) || 1)}
                className="bg-transparent text-6xl font-black outline-none w-28"
                style={{ color: textColor }}
              />
              <span className="text-xs font-bold opacity-20 uppercase">Min</span>
            </div>
          </div>

          {/* 循环次数 */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 opacity-20 text-[10px] font-black tracking-widest">
              <Repeat size={14} /> <span>SESSIONS</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => updateConfig('sessions', config.sessions - 1)} className="w-10 h-10 rounded-xl border border-current/10 flex items-center justify-center hover:bg-current/5 transition-all"><Minus size={16} /></button>
              <span className="text-3xl font-black w-8 text-center">{config.sessions}</span>
              <button onClick={() => updateConfig('sessions', config.sessions + 1)} className="w-10 h-10 rounded-xl border border-current/10 flex items-center justify-center hover:bg-current/5 transition-all"><Plus size={16} /></button>
            </div>
          </div>

          {/* 自动化混音选择 */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 opacity-20 text-[10px] font-black tracking-widest">
              <Volume2 size={14} /> <span>AUTO-MIXER</span>
            </div>
            <div className="p-4 rounded-2xl bg-current/[0.03] border border-current/5 flex justify-between items-center opacity-50 cursor-pointer hover:opacity-100 transition-all">
              <span className="text-[10px] font-black tracking-tighter">DEEP FOCUS PRESET</span>
              <Play size={12} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* 核心按钮：一键应用并开始运行 */}
        <div className="mt-auto pt-6">
          <button 
            onClick={() => onApply(config)}
            className="w-full py-5 rounded-[24px] flex items-center justify-center gap-4 transition-all duration-500 active:scale-[0.97] group shadow-xl hover:shadow-current/10"
            style={{ backgroundColor: textColor, color: baseBgColor }}
          >
            <Play size={18} fill={baseBgColor} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-[11px] font-black tracking-[0.5em] uppercase">Initialize & Start Cycle</span>
          </button>
        </div>

      </div>
      
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}