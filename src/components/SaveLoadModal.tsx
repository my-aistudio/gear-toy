
import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Clock } from 'lucide-react';
import type { SavedScene } from '../types';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onLoad: (scene: SavedScene) => void;
}

const STORAGE_KEY = 'GEARBOX_SAVES_V1';

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ isOpen, onClose, onSave, onLoad }) => {
  const [saves, setSaves] = useState<SavedScene[]>([]);
  const [newName, setNewName] = useState('');

  // Load saves from local storage when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSaves(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load saves", e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName);
    setNewName('');
    onClose();
  };

  const handleDelete = (id: string) => {
    const updated = saves.filter(s => s.id !== id);
    setSaves(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleLoad = (scene: SavedScene) => {
    onLoad(scene);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Save size={20} className="text-blue-400" /> Save & Load
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-700 bg-slate-800/80">
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Create New Save</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter save name..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              disabled={!newName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Save
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           <label className="block text-xs font-medium text-slate-400 uppercase sticky top-0 bg-slate-800 pb-2">Saved Scenes</label>
           {saves.length === 0 ? (
             <div className="text-center py-8 text-slate-500 italic">No saved scenes yet.</div>
           ) : (
             saves.sort((a,b) => b.timestamp - a.timestamp).map(save => (
               <div key={save.id} className="group bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-3 flex items-center justify-between transition-all">
                 <div className="flex-1 min-w-0 mr-4">
                    <h3 className="font-semibold text-slate-200 truncate">{save.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Clock size={12} />
                      {new Date(save.timestamp).toLocaleString()} • {save.components.length} items
                    </div>
                 </div>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleLoad(save)}
                      className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"
                      title="Load"
                    >
                      <Upload size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(save.id)}
                      className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};
