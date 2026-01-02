import { Save, Plus, Layers, Type, Droplets, Square, Check, ChevronDown } from "lucide-react";

export default function ThemeSection({ openSubSection, setOpenSubSection, saveCurrentTheme, savedThemes, applyTheme, bgPalette, baseBgColor, setBaseBgColor, isPickingBg, setIsPickingBg, handleBgInput, confirmBgColor, tempBgColor, setBgPalette, textPalette, textColor, setTextColor, isPickingText, setIsPickingText, handleTextInput, confirmTextColor, tempTextColor, setTextPalette, bgOpacity, setBgOpacity, showBorder, setShowBorder }: any) {
  return (
    <div className="space-y-1">
      <div className="rounded-2xl overflow-hidden border border-white/5">
        <button onClick={() => setOpenSubSection(openSubSection === 'fav' ? null : 'fav')} className="w-full px-5 py-4 flex items-center justify-between text-[11px] font-bold tracking-wider hover:bg-white/5">
          <div className="flex items-center gap-3"><Save size={14} className="opacity-50" />Favorites</div>
          <ChevronDown size={14} className={`transition-transform ${openSubSection === 'fav' ? 'rotate-180' : ''}`} />
        </button>
        <div className={`transition-all ${openSubSection === 'fav' ? 'p-5 pt-0 max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <button onClick={saveCurrentTheme} className="w-full py-2 mb-4 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center justify-center gap-2 transition-all"><Plus size={12} /> Save Current</button>
          <div className="flex gap-2">
            {savedThemes.map((t: any, i: number) => (
              <button key={i} onClick={() => applyTheme(t)} className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden" style={{ background: t.bg }}><div className="w-full h-1/2" style={{ background: t.text }} /></button>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden border border-white/5">
        <button onClick={() => setOpenSubSection(openSubSection === 'bg' ? null : 'bg')} className="w-full px-5 py-4 flex items-center justify-between text-[11px] font-bold tracking-wider hover:bg-white/5">
          <div className="flex items-center gap-3"><Layers size={14} className="opacity-50" />Background</div>
          <ChevronDown size={14} className={`transition-transform ${openSubSection === 'bg' ? 'rotate-180' : ''}`} />
        </button>
        <div className={`transition-all ${openSubSection === 'bg' ? 'p-5 pt-0 max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="flex flex-wrap gap-3">
            {bgPalette.map((c: string) => (<button key={c} onClick={() => {setBaseBgColor(c); setIsPickingBg(false);}} className={`w-7 h-7 rounded-full border-2 ${baseBgColor === c && !isPickingBg ? 'border-white scale-110' : 'border-white/10 opacity-60'}`} style={{ background: c }} />))}
            <div className="relative w-7 h-7">
              <div onClick={() => isPickingBg && confirmBgColor()} className={`w-full h-full rounded-full border-2 flex items-center justify-center ${isPickingBg ? 'border-white animate-pulse' : 'border-white/20 border-dashed bg-white/5'}`} style={isPickingBg ? { backgroundColor: tempBgColor } : {}}>{isPickingBg ? <Check size={12} /> : <Plus size={12} className="opacity-40" />}</div>
              <input type="color" onInput={handleBgInput} className={`absolute inset-0 opacity-0 cursor-pointer ${isPickingBg ? 'pointer-events-none' : ''}`} />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden border border-white/5">
        <button onClick={() => setOpenSubSection(openSubSection === 'text' ? null : 'text')} className="w-full px-5 py-4 flex items-center justify-between text-[11px] font-bold tracking-wider hover:bg-white/5">
          <div className="flex items-center gap-3"><Type size={14} className="opacity-50" />Typography</div>
          <ChevronDown size={14} className={`transition-transform ${openSubSection === 'text' ? 'rotate-180' : ''}`} />
        </button>
        <div className={`transition-all ${openSubSection === 'text' ? 'p-5 pt-0 max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="flex flex-wrap gap-3">
            {textPalette.map((c: string) => (<button key={c} onClick={() => {setTextColor(c); setIsPickingText(false);}} className={`w-7 h-7 rounded-full border-2 ${textColor === c && !isPickingText ? 'border-white scale-110' : 'border-white/10 opacity-60'}`} style={{ background: c }} />))}
            <div className="relative w-7 h-7">
              <div onClick={() => isPickingText && confirmTextColor()} className={`w-full h-full rounded-full border-2 flex items-center justify-center ${isPickingText ? 'border-white animate-pulse' : 'border-white/20 border-dashed bg-white/5'}`} style={isPickingText ? { backgroundColor: tempTextColor } : {}}>{isPickingText ? <Check size={12} /> : <Plus size={12} className="opacity-40" />}</div>
              <input type="color" onInput={handleTextInput} className={`absolute inset-0 opacity-0 cursor-pointer ${isPickingText ? 'pointer-events-none' : ''}`} />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden border border-white/5">
        <button onClick={() => setOpenSubSection(openSubSection === 'opacity' ? null : 'opacity')} className="w-full px-5 py-4 flex items-center justify-between text-[11px] font-bold tracking-wider hover:bg-white/5">
          <div className="flex items-center gap-3"><Droplets size={14} className="opacity-50" />Opacity</div>
          <ChevronDown size={14} className={`transition-transform ${openSubSection === 'opacity' ? 'rotate-180' : ''}`} />
        </button>
        <div className={`transition-all ${openSubSection === 'opacity' ? 'p-5 pt-2 max-h-24 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="flex items-center gap-4 pt-2">
            <input type="range" min="0.1" max="1.0" step="0.01" value={bgOpacity} onChange={(e) => setBgOpacity(parseFloat(e.target.value))} className="flex-grow h-1 bg-white/10 rounded-full appearance-none accent-white cursor-pointer" />
            <button onClick={() => setShowBorder(!showBorder)} className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${showBorder ? 'bg-white text-black border-white' : 'bg-white/5 text-white/30 border-white/10'}`}><Square size={14} strokeWidth={showBorder ? 3 : 2} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}