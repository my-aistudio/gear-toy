
import React from 'react';
import { GearRender } from './GearRender';
import { getPitchRadius } from '../utils/geometry';
import { GearPattern } from '../types';

interface MotorRenderProps {
  teeth: number;
  color: string;
  pattern?: GearPattern;
  className?: string;
  style?: React.CSSProperties;
  isSelected?: boolean;
  rotatableId?: string;
}

export const MotorRender: React.FC<MotorRenderProps> = ({ 
  teeth, 
  color, 
  pattern = GearPattern.NONE,
  className, 
  style,
  isSelected,
  rotatableId
}) => {
  const pitchRadius = getPitchRadius(teeth);
  const motorBodySize = Math.max(pitchRadius * 1.5, 25);

  return (
    <g className={className} style={style}>
       {/* Selection Halo */}
       {isSelected && (
        <rect 
            x={-motorBodySize - 5}
            y={-motorBodySize - 5}
            width={(motorBodySize * 2) + 10}
            height={(motorBodySize * 2) + 10}
            rx="8"
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeDasharray="6 3" 
            className="opacity-70 animate-pulse"
        />
      )}

      {/* Motor Housing (Fixed background) - STATIC */}
      <rect 
        x={-motorBodySize} 
        y={-motorBodySize} 
        width={motorBodySize * 2} 
        height={motorBodySize * 2} 
        rx="6" 
        fill="#334155" 
        stroke="#475569"
        strokeWidth="2"
        className="drop-shadow-xl"
      />
      
      {/* Motor Details - STATIC */}
      <circle r="4" cx={-motorBodySize + 8} cy={-motorBodySize + 8} fill="#94a3b8" />
      <circle r="4" cx={motorBodySize - 8} cy={-motorBodySize + 8} fill="#94a3b8" />
      <circle r="4" cx={-motorBodySize + 8} cy={motorBodySize - 8} fill="#94a3b8" />
      <circle r="4" cx={motorBodySize - 8} cy={motorBodySize - 8} fill="#94a3b8" />
      
      {/* Rotatable Group: The Gear and the Shaft */}
      <g id={rotatableId}>
        <GearRender teeth={teeth} color={color} pattern={pattern} />
        
        {/* Shaft Center */}
        <circle r="4" fill="#1e293b" />
        <circle r="2" fill="#64748b" />
      </g>
    </g>
  );
};
