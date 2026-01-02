import { X, Trash2 } from "lucide-react";

export default function HistoryPanel({ isHistoryOpen, setIsHistoryOpen, textColor }: any) {
  if (!isHistoryOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#1e293b] z-[100] p-6 shadow-2xl border-l border-white/10 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm font-black tracking-widest opacity-50">HISTORY</h2>
        <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-center h-64 opacity-20">
        <Trash2 size={40} className="mb-4" />
        <p className="text-xs">No focus sessions yet.</p>
      </div>
    </div>
  );
}