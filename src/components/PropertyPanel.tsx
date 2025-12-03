
import React from 'react';
import { X, Trash2, RotateCcw, RotateCw, ArrowUp, ArrowDown } from 'lucide-react';
import { ComponentType, GearPattern } from '../types';
import type { MachineComponent, Motor } from '../types';
import { COLORS } from '../constants';

interface PropertyPanelProps {
  component: MachineComponent | null;
  onUpdate: (id: string, updates: Partial<MachineComponent>) => void;
  onDelete: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ component, onUpdate, onDelete, onMoveLayer, onClose }) => {
  if (!component) return null;

  // Prevent events from bubbling up to the canvas
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="absolute top-4 right-4 w-72 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4 text-slate-100 transition-all duration-300 max-h-[90vh] overflow-y-auto"
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
      onWheel={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {component.type === ComponentType.MOTOR ? 'Motor Config' : 'Gear Config'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded-full">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Layer Controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase">Layer Order</label>
          <div className="flex gap-2">
            <button 
                onClick={() => onMoveLayer(component.id, 'up')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1 px-2 rounded-md flex items-center justify-center text-xs"
                title="Bring Forward"
            >
                <ArrowUp size={14} className="mr-1" /> Bring Up
            </button>
            <button 
                onClick={() => onMoveLayer(component.id, 'down')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1 px-2 rounded-md flex items-center justify-center text-xs"
                title="Send Backward"
            >
                <ArrowDown size={14} className="mr-1" /> Send Down
            </button>
          </div>
        </div>

        {/* Common: Teeth Count */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase">Size (Teeth: {component.teeth})</label>
          <input
            type="range"
            min="6"
            max="36"
            step="1"
            value={component.teeth}
            onChange={(e) => onUpdate(component.id, { teeth: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Common: Color */}
        <div className="space-y-2">
           <label className="text-xs font-semibold text-slate-400 uppercase">Color</label>
           <div className="flex flex-wrap gap-2">
             {COLORS.map(c => (
               <button
                 key={c}
                 onClick={() => onUpdate(component.id, { color: c })}
                 className={`w-6 h-6 rounded-full border-2 ${component.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                 style={{ backgroundColor: c }}
               />
             ))}
           </div>
        </div>

        {/* Common: Pattern */}
        <div className="space-y-2">
           <label className="text-xs font-semibold text-slate-400 uppercase">Pattern</label>
           <div className="grid grid-cols-4 gap-2">
             {Object.values(GearPattern).map(p => (
               <button
                 key={p}
                 onClick={() => onUpdate(component.id, { pattern: p })}
                 className={`aspect-square rounded-md border text-[10px] flex items-center justify-center overflow-hidden break-all leading-none ${component.pattern === p ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-transparent text-slate-400 hover:bg-slate-600'}`}
                 title={p}
               >
                 {p === GearPattern.NONE ? 'None' : 
                   <div className="w-4 h-4 rounded-full border border-current opacity-70">
                     {/* Mini visual representation could go here, for now using text/shape */}
                     {p === GearPattern.SPOKES && <div className="w-full h-px bg-current rotate-45 transform translate-y-2" />}
                     {p === GearPattern.DOTS && <div className="w-1 h-1 bg-current rounded-full mx-auto my-1.5" />}
                     {p === GearPattern.STRIPES && <div className="w-full h-2 border-t border-current mt-1" />}
                   </div>
                 }
               </button>
             ))}
           </div>
        </div>

        {/* Motor Specifics */}
        {component.type === ComponentType.MOTOR && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Speed (RPM: {(component as Motor).speed})</label>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={(component as Motor).speed}
                onChange={(e) => onUpdate(component.id, { speed: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Direction</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdate(component.id, { direction: 1 })}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg border ${
                    (component as Motor).direction === 1 
                    ? 'bg-blue-600/30 border-blue-500 text-blue-100' 
                    : 'bg-slate-700 border-transparent text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <RotateCw size={18} className="mr-2" /> CW
                </button>
                <button 
                  onClick={() => onUpdate(component.id, { direction: -1 })}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg border ${
                    (component as Motor).direction === -1 
                    ? 'bg-blue-600/30 border-blue-500 text-blue-100' 
                    : 'bg-slate-700 border-transparent text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <RotateCcw size={18} className="mr-2" /> CCW
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="pt-4 mt-2 border-t border-slate-700">
        <button
          onClick={() => onDelete(component.id)}
          className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-500/20 py-2 rounded-lg transition-colors"
        >
          <Trash2 size={16} /> Delete Component
        </button>
      </div>
    </div>
  );
};
