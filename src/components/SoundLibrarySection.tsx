import { Check } from "lucide-react";

export default function SoundLibrarySection({ fullLibrary, favoriteSounds, setFavoriteSounds }: any) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pt-4">
      {fullLibrary.map((sound: any) => (
        <div key={sound.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 text-xs">
          <span className="font-bold truncate opacity-70">{sound.name}</span>
          <button onClick={() => setFavoriteSounds((prev: string[]) => prev.includes(sound.id) ? prev.filter(id => id !== sound.id) : [...prev, sound.id])} className={favoriteSounds.includes(sound.id) ? 'text-blue-400' : 'opacity-20'}><Check size={14}/></button>
        </div>
      ))}
    </div>
  );
}