
import React, { useMemo } from 'react';
import { generateGearPath, getPitchRadius } from '../utils/geometry';
import { GearPattern } from '../types';
import { invertColor } from '../utils/colors';

interface GearRenderProps {
  teeth: number;
  color: string;
  pattern?: GearPattern;
  className?: string;
  style?: React.CSSProperties;
  isSelected?: boolean;
  rotatableId?: string;
}

export const GearRender: React.FC<GearRenderProps> = ({ 
  teeth, 
  color, 
  pattern = GearPattern.NONE,
  className, 
  style,
  isSelected,
  rotatableId
}) => {
  const pitchRadius = getPitchRadius(teeth);
  const path = useMemo(() => generateGearPath(teeth, pitchRadius, 6), [teeth, pitchRadius]);
  
  // Calculate contrasting color for the pattern
  const patternColor = useMemo(() => invertColor(color), [color]);

  const renderPattern = () => {
    const r = pitchRadius;
    
    switch (pattern) {
        case GearPattern.SPOKES:
            return (
                <g stroke={patternColor} strokeWidth={r * 0.1} strokeLinecap="round">
                    {[0, 60, 120, 180, 240, 300].map(deg => (
                        <line 
                            key={deg}
                            x1="0" y1="0" 
                            x2={Math.cos(deg * Math.PI / 180) * (r * 0.7)} 
                            y2={Math.sin(deg * Math.PI / 180) * (r * 0.7)} 
                        />
                    ))}
                    <circle r={r * 0.2} fill={patternColor} stroke="none" />
                </g>
            );
        case GearPattern.RINGS:
            return (
                <g fill="none" stroke={patternColor} strokeWidth={r * 0.1}>
                    <circle r={r * 0.3} />
                    <circle r={r * 0.6} />
                </g>
            );
        case GearPattern.STRIPES:
            return (
                <g fill={patternColor} opacity="0.5">
                    <rect x={-r} y={-r*0.2} width={r*2} height={r*0.4} />
                    <rect x={-r*0.2} y={-r} width={r*0.4} height={r*2} />
                </g>
            );
        case GearPattern.DOTS:
             const dots = [];
             const count = 6;
             for(let i=0; i<count; i++) {
                 const angle = (i / count) * Math.PI * 2;
                 dots.push(
                     <circle 
                        key={i}
                        cx={Math.cos(angle) * (r * 0.6)} 
                        cy={Math.sin(angle) * (r * 0.6)} 
                        r={r * 0.15}
                        fill={patternColor}
                     />
                 );
             }
             return <g>{dots}</g>;
        case GearPattern.BIOHAZARD:
             return (
                 <g fill="none" stroke={patternColor} strokeWidth={r * 0.15}>
                     {[0, 120, 240].map(deg => (
                         <path 
                            key={deg}
                            d={`M 0 0 L ${Math.cos(deg * Math.PI / 180) * (r * 0.8)} ${Math.sin(deg * Math.PI / 180) * (r * 0.8)}`}
                         />
                     ))}
                     <circle r={r * 0.5} strokeDasharray={`${r} ${r}`} strokeDashoffset={r * 0.5} />
                 </g>
             );
        case GearPattern.SWIRL:
             return (
                 <path 
                    d={`
                        M 0 0 
                        Q ${r*0.5} ${-r*0.5} ${r*0.8} 0
                        M 0 0 
                        Q ${-r*0.5} ${r*0.5} ${-r*0.8} 0
                        M 0 0 
                        Q ${-r*0.5} ${-r*0.5} 0 ${-r*0.8}
                        M 0 0 
                        Q ${r*0.5} ${r*0.5} 0 ${r*0.8}
                    `}
                    fill="none"
                    stroke={patternColor}
                    strokeWidth={r * 0.1}
                    strokeLinecap="round"
                 />
             );
        case GearPattern.NONE:
        default:
            return <circle r={pitchRadius * 0.2} fill="rgba(0,0,0,0.1)" />;
    }
  };

  return (
    <g className={className} style={style}>
      {/* Selection Halo - Static relative to the component center */}
      {isSelected && (
        <circle 
          r={pitchRadius + 10} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="3" 
          strokeDasharray="6 3" 
          className="opacity-70 animate-pulse"
        />
      )}
      
      {/* Rotatable Group */}
      <g id={rotatableId}>
        {/* Main Gear Body */}
        <path 
          d={path} 
          fill={color} 
          stroke="rgba(0,0,0,0.3)" 
          strokeWidth="2"
          fillRule="evenodd"
          className="drop-shadow-lg"
        />
        
        {/* Pattern Layer */}
        {renderPattern()}
      </g>
    </g>
  );
};
