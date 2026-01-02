import { Plus, X, Music2, Droplets, Bird, Wind, Flame, Waves, Coffee, TreePine, ChevronDown, Upload } from "lucide-react";
import { useState, useRef } from "react";

const ICON_MAP: any = {
  music: <Music2 size={16} />,
  droplets: <Droplets size={16} />,
  bird: <Bird size={16} />,
  wind: <Wind size={16} />,
  flame: <Flame size={16} />,
  waves: <Waves size={16} />,
  coffee: <Coffee size={16} />,
  tree: <TreePine size={16} />
};

function SoundItem({ s, isActive, activeVolume, toggleSound, deleteSound, textColor, baseBgColor, audioPool, setActiveSounds, activeSounds }: any) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <div 
      onClick={() => toggleSound(s)}
      onMouseLeave={() => setIsConfirming(false)}
      className={`group flex items-center gap-6 p-5 rounded-[28px] cursor-pointer transition-all duration-300 relative
        ${isActive ? 'bg-current/[0.06]' : 'hover:bg-current/[0.02] opacity-50 hover:opacity-100'}`}
      style={{ color: textColor }}>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (isConfirming) {
            deleteSound(e, s.id);
          } else {
            setIsConfirming(true);
          }
        }}
        className={`absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest transition-all duration-300 z-10
          ${isConfirming 
            ? 'bg-red-500 text-white opacity-100 scale-105 shadow-lg' 
            : 'opacity-0 group-hover:opacity-30 hover:!opacity-100 bg-current/10'}`}
      >
        {isConfirming ? "SURE?" : <X size={14} />}
      </button>

      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-inner shrink-0"
           style={{ backgroundColor: isActive ? textColor : `${textColor}08`, color: isActive ? baseBgColor : textColor }}>
        {ICON_MAP[s.icon] || <Music2 size={16} />}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <span className="text-[12px] font-black tracking-tight uppercase">{s.name}</span>
        {isActive && (
          <div onClick={(e) => e.stopPropagation()} className="pt-1 pr-12">
            <input type="range" min="0" max="1" step="0.01" value={activeVolume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setActiveSounds({ ...activeSounds, [s.id]: v });
                if(audioPool.current[s.id]) audioPool.current[s.id].volume = v;
              }}
              className="w-full h-[6px] appearance-none rounded-full cursor-pointer volume-slider"
              style={{ background: `linear-gradient(to right, ${textColor} ${activeVolume * 100}%, ${textColor}15 0%)` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ZenSoundCapsule({ textColor, baseBgColor }: any) {
  const [folders, setFolders] = useState([
    { id: 'f1', name: 'NATURE', sounds: [
      { id: 'p1', name: 'RAIN', icon: 'droplets', url: '/sounds/rain.wav' },
      { id: 'p2', name: 'FOREST', icon: 'tree', url: '/sounds/forest.wav' }
    ]},
    { id: 'f2', name: 'LOFI', sounds: [] }
  ]);

  const [activeFolderId, setActiveFolderId] = useState('f1');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [activeSounds, setActiveSounds] = useState<{ [key: string]: number }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
  const [tempSound, setTempSound] = useState({ name: "", icon: "music", url: "" });
  
  const audioPool = useRef<{ [key: string]: HTMLAudioElement }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSound = (sound: any) => {
    const id = sound.id;
    if (activeSounds[id] !== undefined) {
      audioPool.current[id]?.pause();
      const newActive = { ...activeSounds };
      delete newActive[id];
      setActiveSounds(newActive);
    } else {
      if (!audioPool.current[id]) {
        audioPool.current[id] = new Audio(sound.url);
        audioPool.current[id].loop = true;
      }
      audioPool.current[id].volume = 0.5;
      audioPool.current[id].play();
      setActiveSounds({ ...activeSounds, [id]: 0.5 });
    }
  };

  const deleteSound = (e: React.MouseEvent, soundId: string) => {
    e.stopPropagation();
    if (audioPool.current[soundId]) {
      audioPool.current[soundId].pause();
      delete audioPool.current[soundId];
    }
    const newActive = { ...activeSounds };
    delete newActive[soundId];
    setActiveSounds(newActive);
    setFolders(folders.map(f => ({ ...f, sounds: f.sounds.filter(s => s.id !== soundId) })));
  };

  const deleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    const targetFolder = folders.find(f => f.id === folderId);
    if (targetFolder) {
      const newActive = { ...activeSounds };
      targetFolder.sounds.forEach(s => {
        if (audioPool.current[s.id]) {
          audioPool.current[s.id].pause();
          delete audioPool.current[s.id];
        }
        delete newActive[s.id];
      });
      setActiveSounds(newActive);
    }
    const remaining = folders.filter(f => f.id !== folderId);
    if (activeFolderId === folderId && remaining.length > 0) setActiveFolderId(remaining[0].id);
    setFolders(remaining);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempSound({ ...tempSound, name: file.name.split('.')[0].toUpperCase(), url: url });
    }
  };

  const currentFolder = folders.find(f => f.id === activeFolderId) || folders[0];

  return (
    <>
      <div className={`fixed inset-0 z-[140] bg-black/[0.02] backdrop-blur-[2px] transition-opacity duration-700 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />

      <div className="fixed bottom-0 left-0 right-0 z-[150] flex justify-center pointer-events-none">
        <div 
          className={`pointer-events-auto transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden
            ${isOpen ? 'w-[calc(100%-32px)] h-[440px] rounded-[44px] px-8 pt-10 pb-4 mb-4' : 'w-40 hover:w-48 h-14 rounded-full mb-10 hover:-translate-y-1'}
          `}
          style={{ 
            backgroundColor: isOpen ? `${textColor}15` : `${textColor}08`, 
            backdropFilter: 'blur(30px)', 
            border: `1.5px solid ${textColor}${isOpen ? '10' : '15'}`,
          }}
        >
          {!isOpen ? (
            <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center gap-3">
              <Droplets size={16} className={`${Object.keys(activeSounds).length > 0 ? 'animate-pulse' : 'opacity-30'}`} style={{ color: textColor }} />
              <span className="text-[10px] font-black tracking-[0.5em] opacity-30 uppercase" style={{ color: textColor }}>Ambient</span>
            </button>
          ) : (
            <div className="w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar shrink-0">
                {folders.map(f => (
                  <div key={f.id} onClick={() => setActiveFolderId(f.id)} onDoubleClick={() => setEditingFolderId(f.id)}
                    className={`group/tab relative px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${activeFolderId === f.id ? 'bg-current/[0.08] opacity-100' : 'opacity-20 hover:opacity-50'}`}
                    style={{ color: textColor }}>
                    {folders.length > 1 && (
                      <button onClick={(e) => deleteFolder(e, f.id)} className="absolute -top-1 -right-1 opacity-0 group-hover/tab:opacity-100 transition-all bg-white/10 rounded-full p-0.5"><X size={10} /></button>
                    )}
                    {editingFolderId === f.id ? (
                      <input autoFocus className="bg-transparent outline-none w-16 text-[11px] font-black border-b border-current"
                        value={f.name} onChange={(e) => setFolders(folders.map(it => it.id === f.id ? {...it, name: e.target.value.toUpperCase()} : it))}
                        onBlur={() => setEditingFolderId(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingFolderId(null)} />
                    ) : (
                      <span className="text-[11px] font-black tracking-widest">{f.name}</span>
                    )}
                  </div>
                ))}
                <button onClick={() => {
                  const newId = `f-${Date.now()}`;
                  setFolders([...folders, { id: newId, name: 'NEW', sounds: [] }]);
                  setActiveFolderId(newId);
                  setEditingFolderId(newId);
                }} className="p-2 opacity-20 hover:opacity-100 transition-all" style={{ color: textColor }}><Plus size={16}/></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {viewMode === 'list' ? (
                  <div className="space-y-1">
                    {currentFolder?.sounds.map(s => (
                      <SoundItem 
                        key={s.id} s={s} 
                        isActive={activeSounds[s.id] !== undefined} 
                        activeVolume={activeSounds[s.id] || 0}
                        toggleSound={toggleSound} 
                        deleteSound={deleteSound}
                        textColor={textColor}
                        baseBgColor={baseBgColor}
                        audioPool={audioPool}
                        setActiveSounds={setActiveSounds}
                        activeSounds={activeSounds}
                      />
                    ))}
                    <button onClick={() => setViewMode('add')} className="w-full py-8 mt-4 rounded-[28px] border border-dashed border-current opacity-10 hover:opacity-30 transition-all text-[10px] font-black uppercase tracking-widest" style={{ color: textColor }}>
                      + Add New Sound
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 pt-2 animate-in slide-in-from-bottom-4 duration-500">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                    <div onClick={() => fileInputRef.current?.click()} className="w-full py-6 border border-dashed rounded-2xl flex items-center justify-center gap-3 cursor-pointer opacity-40 hover:opacity-100 transition-all" style={{ borderColor: textColor, color: textColor }}>
                      <Upload size={14} />
                      <span className="text-[10px] font-black tracking-widest">{tempSound.url ? "FILE ATTACHED" : "UPLOAD SOUND"}</span>
                    </div>
                    <input value={tempSound.name} onChange={e => setTempSound({...tempSound, name: e.target.value.toUpperCase()})} placeholder="NAME..." className="w-full bg-transparent text-lg font-black text-center outline-none py-4 border-b border-current/10" style={{ color: textColor }} />
                    <div className="flex flex-wrap justify-center gap-3">
                      {Object.keys(ICON_MAP).map(icon => (
                        <button key={icon} onClick={() => setTempSound({...tempSound, icon})} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tempSound.icon === icon ? 'bg-current shadow-lg scale-110' : 'opacity-20 hover:opacity-100'}`} style={{ color: tempSound.icon === icon ? baseBgColor : textColor }}>{ICON_MAP[icon]}</button>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button onClick={() => setViewMode('list')} className="flex-1 py-4 text-[9px] font-black opacity-30 tracking-widest" style={{ color: textColor }}>CANCEL</button>
                      <button disabled={!tempSound.url || !tempSound.name} onClick={() => {
                        const created = { id: `s-${Date.now()}`, name: tempSound.name, icon: tempSound.icon, url: tempSound.url };
                        setFolders(folders.map(f => f.id === activeFolderId ? { ...f, sounds: [...f.sounds, created] } : f));
                        setViewMode('list'); setTempSound({ name: "", icon: "music", url: "" });
                      }} className="flex-1 py-4 rounded-2xl font-black text-[9px] tracking-widest" style={{ backgroundColor: textColor, color: baseBgColor }}>CONFIRM</button>
                    </div>
                  </div>
                )}
              </div>
              
              <button onClick={() => setIsOpen(false)} className="mt-4 mb-2 opacity-10 hover:opacity-100 transition-all shrink-0 self-center">
                <ChevronDown size={20} style={{ color: textColor }} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${textColor}20; border-radius: 10px; }
        .volume-slider::-webkit-slider-thumb { appearance: none; width: 6px; height: 16px; background: ${textColor}; border-radius: 4px; cursor: ew-resize; }
      `}</style>
    </>
  );
}