import { Palette, Zap, Heart, Library, ArrowLeft, Droplets, RotateCcw, Trash2, Folder, ChevronDown, ChevronRight, X, Plus, Pin, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Sidebar({ 
  isSidebarOpen, textColor, setTextColor, 
  baseBgColor, setBaseBgColor, bgOpacity, setBgOpacity,
  showBorder, setShowBorder
}: any) {
  const DEFAULT_SYSTEM_PRESETS = [
    { id: 1, name: 'ZEN SOFT', color: '#475569', bg: '#f5f5f4', opacity: 0.98, border: false, isPinned: true },
    { id: 2, name: 'LAVENDER', color: '#6d28d9', bg: '#f5f3ff', opacity: 0.96, border: false, isPinned: true },
    { id: 3, name: 'DEEP SEA', color: '#f8fafc', bg: '#1e293b', opacity: 0.95, isPinned: true },
    { id: 4, name: 'MATCHA', color: '#166534', bg: '#f0fdf4', opacity: 0.98, isPinned: true },
    { id: 5, name: 'AUTUMN', color: '#78350f', bg: '#fef3c7', opacity: 0.98, isPinned: true },
    { id: 6, name: 'LATTE', color: '#7c2d12', bg: '#fff7ed', opacity: 1, border: true, isPinned: true },
  ];

  const [folders, setFolders] = useState([
    { id: 'system', name: 'SYSTEM PRESETS', items: DEFAULT_SYSTEM_PRESETS, isExpanded: true, canDelete: true },
    { id: 'custom', name: 'MY STYLES', items: [], isExpanded: true, canDelete: true }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isToneExpanded, setIsToneExpanded] = useState(true);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<any>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const applyTheme = (theme: any) => {
    setTextColor(theme.color);
    setBaseBgColor(theme.bg);
    if (theme.opacity !== undefined) setBgOpacity(theme.opacity);
    if (theme.border !== undefined) setShowBorder(theme.border);
  };

  const featuredThemes = folders.flatMap(f => f.items).filter(t => t.isPinned);

  const toggleFolder = (folderId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f));
  };

  const togglePin = (e: React.MouseEvent, themeId: any) => {
    e.stopPropagation();
    setFolders(prev => prev.map(f => ({
      ...f,
      items: f.items.map(item => item.id === themeId ? { ...item, isPinned: !item.isPinned } : item)
    })));
  };

  const confirmSave = () => {
    if (!newName.trim()) return;
    const newFav = { id: Date.now(), name: newName.toUpperCase(), color: textColor, bg: baseBgColor, opacity: bgOpacity, border: showBorder, isPinned: false };
    setFolders(prev => prev.map(f => f.id === 'custom' ? { ...f, items: [newFav, ...f.items] } : f));
    setNewName("");
    setIsSaving(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders([...folders, { id: Date.now().toString(), name: newFolderName.toUpperCase(), items: [], isExpanded: true, canDelete: true }]);
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const handleOnlyRestoreSystem = () => {
    setFolders(prev => {
        const hasSystem = prev.some(f => f.id === 'system');
        if (hasSystem) {
            return prev.map(f => f.id === 'system' ? { ...f, items: DEFAULT_SYSTEM_PRESETS } : f);
        } else {
            return [{ id: 'system', name: 'SYSTEM PRESETS', items: DEFAULT_SYSTEM_PRESETS, isExpanded: true, canDelete: true }, ...prev];
        }
    });
    setShowResetDialog(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId));
  };

  const handleSafeDeleteTheme = (folderId: string, themeId: any) => {
    if (confirmingDeleteId === themeId) {
      setFolders(folders.map(f => f.id === folderId ? { ...f, items: f.items.filter(i => i.id !== themeId) } : f));
      setConfirmingDeleteId(null);
    } else {
      setConfirmingDeleteId(themeId);
    }
  };

  return (
    <div 
      className="fixed inset-y-0 left-0 w-[340px] z-[150] p-10 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style={{ 
        backgroundColor: baseBgColor, 
        color: textColor, 
        borderRadius: '44px', 
        border: showBorder ? `2px solid ${textColor}44` : 'none',
        borderLeft: 'none',
        boxShadow: isSidebarOpen 
          ? `20px 0 60px rgba(0,0,0,0.1)${showBorder ? `, inset -2px 0 10px ${textColor}11` : ''}` 
          : 'none',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-105%)',
        opacity: isSidebarOpen ? 1 : 0,
      }}>
      
      {showResetDialog && (
        <div className="absolute inset-0 z-[200] p-10 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/5 backdrop-blur-md rounded-[44px]" onClick={() => setShowResetDialog(false)} />
          <div className="relative p-8 rounded-[40px] shadow-2xl text-center space-y-6 border border-current/10" style={{ backgroundColor: baseBgColor }}>
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-current/[0.05]">
                <AlertCircle size={32} className="opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-[14px] font-black uppercase tracking-[0.2em]">Restore Presets</h3>
              <p className="text-[10px] opacity-40 leading-relaxed uppercase tracking-widest px-4">Reload system themes. Your custom styles will remain safe.</p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <button onClick={handleOnlyRestoreSystem} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: textColor, color: baseBgColor }}>Confirm Restore</button>
              <button onClick={() => setShowResetDialog(false)} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!isLibraryOpen ? (
        <>
          <div className="flex justify-between items-center mb-12 shrink-0">
            <div className="flex items-center gap-3 opacity-30">
              <Palette size={18} strokeWidth={2.5} />
              <h2 className="text-[10px] font-black tracking-[0.4em] uppercase">Aesthetics</h2>
            </div>
          </div>

          <div className="flex-grow space-y-12 overflow-y-auto pr-2 custom-scrollbar">
            <section>
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2 opacity-20">
                  <Zap size={12} fill="currentColor" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Quick Access</span>
                </div>
                <button onClick={() => setIsLibraryOpen(true)} className="p-2 hover:bg-current/5 rounded-full transition-all group">
                  <Library size={16} className="opacity-20 group-hover:opacity-100" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {featuredThemes.length > 0 ? featuredThemes.map((theme) => (
                  <button key={theme.id} onClick={() => applyTheme(theme)} className="flex items-center gap-3 p-3.5 rounded-[22px] bg-current/[0.04] hover:bg-current/[0.08] transition-all border border-current/[0.05] active:scale-[0.96] text-left">
                    <div className="w-3.5 h-3.5 rounded-full border border-current/10 shrink-0 flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.color }} />
                    </div>
                    <span className="text-[10px] font-bold opacity-60 truncate uppercase">{theme.name}</span>
                  </button>
                )) : (
                  <div className="col-span-2 py-8 text-center opacity-10 text-[8px] font-black uppercase tracking-widest border border-dashed border-current/20 rounded-[22px]">No Pinned Styles</div>
                )}
              </div>
            </section>

            <section className="p-7 rounded-[32px] transition-all duration-500" style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <button onClick={() => setIsToneExpanded(!isToneExpanded)} className="w-full flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity mb-2">
                <div className="flex items-center gap-2">
                  <Droplets size={14} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Tone Editor</span>
                </div>
                {isToneExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
              </button>
              
              {isToneExpanded && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500 mt-6">
                  <div className="grid grid-cols-2 gap-5">
                    {['Text', 'Backdrop'].map((label, i) => (
                      <div key={label} className="space-y-3 text-center">
                        <span className="text-[10px] uppercase font-black opacity-20 block tracking-[0.2em]">{label}</span>
                        <div className="relative h-14 rounded-2xl border border-current/10 overflow-hidden shadow-inner group">
                          <input type="color" value={i === 0 ? textColor : baseBgColor} onChange={(e) => i === 0 ? setTextColor(e.target.value) : setBaseBgColor(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer scale-[5] bg-transparent transition-transform group-hover:scale-[6]" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-black opacity-20 tracking-widest">Transparency</span>
                        <span className="text-[11px] font-bold opacity-30">{Math.round(bgOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0.1" max="1" step="any" value={bgOpacity} onChange={(e) => setBgOpacity(parseFloat(e.target.value))} className="w-full h-1.5 bg-current/10 rounded-full appearance-none cursor-pointer accent-current" />
                  </div>

                  <div className="flex items-center justify-between p-1">
                    <span className="text-[10px] uppercase font-black opacity-20 tracking-widest">Outline Mode</span>
                    <button 
                        onClick={() => setShowBorder(!showBorder)} 
                        className={`w-12 h-6 rounded-full transition-all relative ${showBorder ? 'bg-current/25' : 'bg-current/5'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${showBorder ? 'right-1 bg-current opacity-90' : 'left-1 bg-current opacity-20'}`} />
                    </button>
                  </div>

                  {!isSaving ? (
                    <button onClick={() => setIsSaving(true)} className="w-full py-5 rounded-2xl bg-current/[0.04] hover:bg-current/[0.1] flex items-center justify-center gap-3 transition-all border border-current/[0.05]">
                      <Heart size={16} className="opacity-30" />
                      <span className="text-[12px] font-black tracking-[0.2em] opacity-40 uppercase">Record Style</span>
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in fade-in zoom-in-95">
                      <input autoFocus type="text" value={newName} placeholder="NAME..." onChange={(e) => setNewName(e.target.value)} className="w-full bg-current/[0.05] rounded-xl p-4 text-[13px] font-black outline-none border border-current/10 uppercase tracking-widest placeholder:opacity-20" />
                      <div className="flex gap-2">
                        <button onClick={() => setIsSaving(false)} className="flex-1 py-4 rounded-xl bg-current/5 font-black text-[11px] opacity-30 uppercase">Cancel</button>
                        <button onClick={confirmSave} className="flex-1 py-4 rounded-xl font-black text-[11px] uppercase shadow-lg" style={{ backgroundColor: textColor, color: baseBgColor }}>Confirm</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500 relative">
          <div className="flex justify-between items-center mb-10 shrink-0 px-1">
            <button onClick={() => { setIsLibraryOpen(false); setIsAddingFolder(false); }} className="flex items-center gap-3 group opacity-40 hover:opacity-100 transition-all">
              <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-all" />
              <span className="text-[15px] font-black tracking-[0.2em] uppercase">Library</span>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowResetDialog(true)} className="p-2 opacity-20 hover:opacity-100 transition-all"><RotateCcw size={20} /></button>
              {/* 找回新增文件夹按钮 */}
              <button onClick={() => setIsAddingFolder(!isAddingFolder)} className={`p-2 rounded-full transition-all ${isAddingFolder ? 'rotate-45 opacity-100' : 'opacity-20 hover:opacity-100'}`}><Plus size={22} /></button>
            </div>
          </div>

          {/* 新增文件夹输入框 */}
          {isAddingFolder && (
            <div className="mb-8 p-1.5 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex gap-2 p-2 bg-current/[0.03] rounded-2xl border border-current/10">
                <input autoFocus type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="FOLDER NAME..." className="flex-1 bg-transparent px-3 text-[11px] font-black outline-none uppercase tracking-widest placeholder:opacity-20" />
                <button onClick={handleCreateFolder} className="p-3 rounded-xl shadow-lg transition-transform active:scale-90" style={{ backgroundColor: textColor, color: baseBgColor }}><Plus size={16} /></button>
              </div>
            </div>
          )}

          <div className="flex-grow overflow-y-auto space-y-10 pr-2 custom-scrollbar pb-10">
            {folders.map((folder) => (
              <div key={folder.id} className="space-y-5 group/f" onMouseLeave={() => setConfirmingDeleteId(null)}>
                <div className="w-full flex items-center justify-between px-2">
                  <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-all text-[10px] font-black uppercase tracking-[0.3em]">
                    <Folder size={13} fill={folder.isExpanded ? "currentColor" : "none"} />
                    {folder.name}
                  </button>
                  {/* 找回删除空文件夹按钮 */}
                  <button onClick={() => folder.items.length === 0 && handleDeleteFolder(folder.id)} className={`transition-all ${folder.items.length === 0 ? 'opacity-0 group-hover/f:opacity-20 hover:!opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {folder.isExpanded && (
                  <div className="grid grid-cols-1 gap-2 pl-1">
                    {folder.items.length === 0 && <div className="py-4 text-center border-2 border-dashed border-current/5 rounded-3xl opacity-10 text-[8px] font-black uppercase tracking-widest">Empty</div>}
                    {folder.items.map((theme) => (
                      <div key={theme.id} className="group relative flex items-center p-1 rounded-[24px] hover:bg-current/[0.04] transition-all" onMouseLeave={() => setConfirmingDeleteId(null)}>
                        <button onClick={() => applyTheme(theme)} className="flex-1 flex items-center gap-4 p-3 text-left">
                          <div className="w-6 h-6 rounded-full border border-current/10 flex items-center justify-center shrink-0" style={{ backgroundColor: theme.bg }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                          </div>
                          <span className="text-[11px] font-bold opacity-50 uppercase tracking-tight">{theme.name}</span>
                        </button>
                        <div className="flex items-center gap-2 pr-3">
                          <button onClick={(e) => togglePin(e, theme.id)} className={`p-2 rounded-xl transition-all ${theme.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-10 hover:!opacity-100'}`}>
                            <Pin size={15} fill={theme.isPinned ? "currentColor" : "none"} className={theme.isPinned ? "rotate-45" : ""} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleSafeDeleteTheme(folder.id, theme.id); }} className={`h-8 rounded-xl text-[8px] font-black transition-all flex items-center justify-center ${confirmingDeleteId === theme.id ? 'bg-red-500 text-white px-4' : 'opacity-0 group-hover:opacity-10 hover:!opacity-100 bg-current/10 min-w-[32px]'}`}>
                            {confirmingDeleteId === theme.id ? "SURE?" : <X size={15} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 0px; }`}</style>
    </div>
  );
}