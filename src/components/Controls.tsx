
import React from 'react';
import { Play, Pause, Settings, Save } from 'lucide-react';
import { ComponentType } from '../types';

interface ControlsProps {
  onSelectTool: (type: ComponentType) => void;
  activeTool: ComponentType | null;
  onTogglePlay: () => void;
  isPlaying: boolean;
  onOpenSaveModal: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onSelectTool, activeTool, onTogglePlay, isPlaying, onOpenSaveModal }) => {
  // Prevent events from bubbling up to the canvas drag handler
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 p-3 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl z-50"
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
      onWheel={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      
      <div className="flex gap-2 border-r border-slate-600 pr-4 mr-2">
        <button
          onClick={() => onSelectTool(ComponentType.GEAR)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all active:scale-95 group border-2 ${
            activeTool === ComponentType.GEAR 
              ? 'bg-slate-600 border-blue-500 shadow-lg shadow-blue-500/20' 
              : 'bg-slate-700 border-transparent hover:bg-slate-600'
          }`}
          title="Add Gear"
        >
          <div className={`${activeTool === ComponentType.GEAR ? 'text-blue-400' : 'text-orange-400'} group-hover:rotate-90 transition-transform duration-500`}>
             <Settings size={24} />
          </div>
          <span className={`text-xs mt-1 font-medium ${activeTool === ComponentType.GEAR ? 'text-white' : 'text-slate-300'}`}>Gear</span>
        </button>

        <button
          onClick={() => onSelectTool(ComponentType.MOTOR)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all active:scale-95 group border-2 ${
            activeTool === ComponentType.MOTOR
              ? 'bg-slate-600 border-blue-500 shadow-lg shadow-blue-500/20' 
              : 'bg-slate-700 border-transparent hover:bg-slate-600'
          }`}
          title="Add Motor"
        >
          <div className={`${activeTool === ComponentType.MOTOR ? 'text-blue-400 scale-110' : 'text-blue-400'} group-hover:scale-110 transition-transform`}>
             <div className={`w-6 h-6 border-4 border-blue-400 rounded flex items-center justify-center`}>
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
             </div>
          </div>
          <span className={`text-xs mt-1 font-medium ${activeTool === ComponentType.MOTOR ? 'text-white' : 'text-slate-300'}`}>Motor</span>
        </button>
      </div>

      <button
        onClick={onTogglePlay}
        className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg active:scale-95 ${
          isPlaying 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
      >
        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
      </button>

      <button
        onClick={onOpenSaveModal}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all active:scale-95 ml-2 border-l border-slate-600 pl-2"
        title="Save / Load"
      >
        <Save size={24} />
        <span className="text-xs mt-1 font-medium">Saves</span>
      </button>

      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-slate-400 text-xs bg-slate-900/80 px-3 py-1 rounded-full pointer-events-none whitespace-nowrap border border-slate-700">
        Select tool & click on board to place • Drag to move • Scroll to zoom
      </div>
    </div>
  );
};
