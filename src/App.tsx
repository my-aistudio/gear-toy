
import React, { useState, useRef, useEffect } from 'react';
import { ComponentType, GearPattern } from './types';
import type { MachineComponent, Viewport, SavedScene } from './types';
import { GRID_SIZE, DEFAULT_GEAR_TEETH, DEFAULT_MOTOR_TEETH, COLORS, BOARD_COLOR, DOT_COLOR, DOT_SIZE, DEFAULT_MOTOR_SPEED } from './constants';
import { GearRender } from './components/GearRender';
import { MotorRender } from './components/MotorRender';
import { Controls } from './components/Controls';
import { PropertyPanel } from './components/PropertyPanel';
import { SaveLoadModal } from './components/SaveLoadModal';
import { solvePhysics } from './services/physics';
import { getPitchRadius } from './utils/geometry';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// Distance threshold for magnetic snapping (in pixels)
const SNAP_EDGE_DISTANCE = 20;
const SNAP_CENTER_DISTANCE = 25; // Priority snapping to center for stacking
const STORAGE_KEY = 'GEARBOX_SAVES_V1';

function App() {
  // State
  const [components, setComponents] = useState<MachineComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [placementMode, setPlacementMode] = useState<ComponentType | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  // Refs for Dragging Logic
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvas = useRef(false);
  const isDraggingComponent = useRef<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Physics Animation State
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const rotationsRef = useRef<{ [id: string]: number }>({}); 
  const physicsStateRef = useRef<{ velocities: {[id:string]: number}, jammed: string[] }>({ velocities: {}, jammed: [] });

  // --- Initial Physics Solve ---
  useEffect(() => {
    physicsStateRef.current = solvePhysics(components);
  }, [components]);

  // --- Animation Loop ---
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const deltaTime = (time - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = time;

      if (isPlaying) {
        // Update rotations based on velocity
        components.forEach(comp => {
          const velocity = physicsStateRef.current.velocities[comp.id] || 0;
          const isJammed = physicsStateRef.current.jammed.includes(comp.id);
          
          if (!rotationsRef.current[comp.id]) rotationsRef.current[comp.id] = 0;

          if (!isJammed) {
            // Speed factor: 60 RPM = 1 rotation per second = 360 deg per second.
            // velocity stored is in RPS approx.
            const rotDelta = velocity * 360 * deltaTime; 
            rotationsRef.current[comp.id] += rotDelta;
          }
          
          // Apply to DOM
          const el = document.getElementById(`comp-${comp.id}`);
          const rotEl = document.getElementById(`rot-${comp.id}`);
          const labelEl = document.getElementById(`label-${comp.id}`);
          
          // 1. Position the container (Translation only)
          if (el) {
             let transform = `translate(${comp.x}px, ${comp.y}px)`;
             
             // Visual Shake if jammed (affects whole component including base)
             if (isJammed) {
                 const shake = Math.sin(time / 20) * 2;
                 transform = `translate(${comp.x + shake}px, ${comp.y}px)`;
                 el.style.opacity = '0.5'; // dim jammed items
             } else {
                 el.style.opacity = '1';
             }
             el.style.transform = transform;
          }

          // 2. Rotate the inner parts (Rotation only)
          if (rotEl) {
              rotEl.style.transform = `rotate(${rotationsRef.current[comp.id]}deg)`;
          }

          // Update Label (RPM)
          if (labelEl) {
             const rpm = Math.round((physicsStateRef.current.velocities[comp.id] || 0) * 60);
             labelEl.innerText = `${Math.abs(rpm)} RPM`;
             // Move label slightly above center so it doesn't overlap perfectly with hole
             labelEl.style.transform = `translate(${comp.x}px, ${comp.y - 8}px)`;
             
             if (isJammed) {
                 labelEl.innerText = "JAMMED";
                 labelEl.style.color = "#ef4444";
             } else {
                 labelEl.style.color = "rgba(255,255,255,0.7)";
             }
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [components, isPlaying]);


  // --- Event Handlers ---

  const handleToolSelect = (type: ComponentType) => {
    // Toggle if clicking the same one, or select new
    if (placementMode === type) {
      setPlacementMode(null);
    } else {
      setPlacementMode(type);
      setSelectedId(null); // Clear selection when picking a tool
    }
  };

  const createComponent = (type: ComponentType, worldX: number, worldY: number) => {
    let newComponent: MachineComponent;
    
    // Randomize defaults for variety
    const patterns = Object.values(GearPattern).filter(p => p !== GearPattern.NONE);
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];

    const commonProps = {
      id: generateId(),
      x: worldX,
      y: worldY,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pattern: randomPattern
    };

    if (type === ComponentType.MOTOR) {
      newComponent = {
        ...commonProps,
        type: ComponentType.MOTOR,
        teeth: DEFAULT_MOTOR_TEETH,
        speed: DEFAULT_MOTOR_SPEED,
        direction: 1
      };
    } else {
      newComponent = {
        ...commonProps,
        type: ComponentType.GEAR,
        teeth: DEFAULT_GEAR_TEETH,
      };
    }

    setComponents(prev => [...prev, newComponent]);
    setSelectedId(newComponent.id);
  };

  const handleUpdateComponent = (id: string, updates: Partial<MachineComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c) as MachineComponent[]);
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setSelectedId(null);
  };

  // --- Layer Management ---
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setComponents(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;
        
        const newArr = [...prev];
        if (direction === 'up' && index < newArr.length - 1) {
            [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
        } else if (direction === 'down' && index > 0) {
            [newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]];
        }
        return newArr;
    });
  };

  // --- Save / Load Handlers ---
  const handleSaveScene = (name: string) => {
    const newSave: SavedScene = {
        id: generateId(),
        name,
        timestamp: Date.now(),
        components,
        viewport
    };

    try {
        const existingRaw = localStorage.getItem(STORAGE_KEY);
        const existing: SavedScene[] = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [...existing, newSave];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save to localStorage", e);
        alert("Failed to save locally. Storage might be full.");
    }
  };

  const handleLoadScene = (scene: SavedScene) => {
      setComponents(scene.components);
      setViewport(scene.viewport);
      // Reset rotations logic
      rotationsRef.current = {};
      setSelectedId(null);
  };

  // --- Canvas Interaction ---

  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX, y: clientY };
  };

  const getWorldCoordinates = (clientX: number, clientY: number) => {
      const container = canvasRef.current?.parentElement;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // Apply viewport transform (pan and zoom)
      const worldX = (relativeX - viewport.x) / viewport.zoom;
      const worldY = (relativeY - viewport.y) / viewport.zoom;
      
      return { x: worldX, y: worldY };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getEventCoords(e);
    const worldCoords = getWorldCoordinates(coords.x, coords.y);
    
    // --- 1. Placement Mode Logic ---
    if (placementMode) {
      createComponent(placementMode, worldCoords.x, worldCoords.y);
      setPlacementMode(null); // Exit placement mode after placing
      return;
    }

    // --- 2. Normal Selection / Drag Logic ---
    const target = e.target as HTMLElement;
    const componentEl = target.closest('[data-component-id]');
    
    dragStartPos.current = coords;

    if (componentEl) {
      const id = componentEl.getAttribute('data-component-id');
      if (id) {
        isDraggingComponent.current = id;
        setSelectedId(id);
      }
    } else {
      isDraggingCanvas.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getEventCoords(e);
    const deltaX = coords.x - dragStartPos.current.x;
    const deltaY = coords.y - dragStartPos.current.y;
    
    if (!isDraggingCanvas.current && !isDraggingComponent.current) return;

    if (isDraggingCanvas.current) {
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      dragStartPos.current = coords;
    } else if (isDraggingComponent.current) {
      const id = isDraggingComponent.current;
      const worldCoords = getWorldCoordinates(coords.x, coords.y);
      
      let finalX = worldCoords.x;
      let finalY = worldCoords.y;

      // --- SNAP LOGIC (STACKING & MESHING) ---
      const activeComp = components.find(c => c.id === id);
      if (activeComp) {
        let snappedToCenter = false;
        
        // 1. Check for Center Snapping (Stacking) - Higher Priority
        for (const other of components) {
          if (other.id === id) continue;
          
          const dx = finalX - other.x;
          const dy = finalY - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < SNAP_CENTER_DISTANCE) {
            finalX = other.x;
            finalY = other.y;
            snappedToCenter = true;
            break; // Found a stack target, stop looking
          }
        }

        // 2. Check for Edge Snapping (Meshing) - Only if not stacked
        if (!snappedToCenter) {
            let bestDist = Infinity;
            let snapPos = null;
            const myRadius = getPitchRadius(activeComp.teeth);

            for (const other of components) {
              if (other.id === id) continue;

              const dx = finalX - other.x;
              const dy = finalY - other.y;
              const currentDist = Math.sqrt(dx * dx + dy * dy);
              
              const otherRadius = getPitchRadius(other.teeth);
              const optimalDist = myRadius + otherRadius;
              const diff = Math.abs(currentDist - optimalDist);

              if (diff < SNAP_EDGE_DISTANCE && diff < bestDist) {
                bestDist = diff;
                const angle = Math.atan2(dy, dx);
                snapPos = {
                  x: other.x + Math.cos(angle) * optimalDist,
                  y: other.y + Math.sin(angle) * optimalDist
                };
              }
            }

            if (snapPos) {
              finalX = snapPos.x;
              finalY = snapPos.y;
            }
        }
      }

      // Update Component
      setComponents(prev => prev.map(c => {
        if (c.id === id) {
           return { ...c, x: finalX, y: finalY };
        }
        return c;
      }));
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvas.current = false;
    isDraggingComponent.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = 0.05;
    const newZoom = e.deltaY > 0 ? viewport.zoom * (1 - scaleFactor) : viewport.zoom * (1 + scaleFactor);
    const clampedZoom = Math.max(0.2, Math.min(3, newZoom));
    
    setViewport(prev => ({
      ...prev,
      zoom: clampedZoom
    }));
  };

  const bgSize = GRID_SIZE * viewport.zoom;
  const bgPosition = `${viewport.x}px ${viewport.y}px`;
  
  const selectedComponent = components.find(c => c.id === selectedId) || null;

  return (
    <div 
      className={`w-full h-full overflow-hidden select-none relative ${placementMode ? 'cursor-crosshair' : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={(e) => {
        // Double click background to add gear at center
        const worldCoords = getWorldCoordinates(e.clientX, e.clientY);
        createComponent(ComponentType.GEAR, worldCoords.x, worldCoords.y);
      }}
      style={{
        backgroundColor: BOARD_COLOR,
        backgroundImage: `radial-gradient(${DOT_COLOR} ${DOT_SIZE * viewport.zoom}px, transparent ${DOT_SIZE * viewport.zoom}px)`,
        backgroundSize: `${bgSize}px ${bgSize}px`,
        backgroundPosition: bgPosition
      }}
    >
      <div 
        ref={canvasRef}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        {components.map((comp, index) => (
          <div
            key={comp.id}
            id={`comp-${comp.id}`}
            data-component-id={comp.id}
            className="absolute transition-transform duration-75 cursor-move flex items-center justify-center group"
            onDoubleClick={(e) => e.stopPropagation()} 
            style={{
              // Use Z-index corresponding to array order, plus base to be above background
              zIndex: 10 + index, 
              transform: `translate(${comp.x}px, ${comp.y}px)`,
              pointerEvents: 'auto',
              width: 0,
              height: 0,
            }}
          >
            <svg style={{ overflow: 'visible', width: '1px', height: '1px' }}>
                {comp.type === ComponentType.GEAR ? (
                  <GearRender 
                    teeth={comp.teeth} 
                    color={comp.color} 
                    pattern={comp.pattern}
                    isSelected={selectedId === comp.id}
                    rotatableId={`rot-${comp.id}`}
                  />
                ) : (
                  <MotorRender 
                    teeth={comp.teeth} 
                    color={comp.color} 
                    pattern={comp.pattern}
                    isSelected={selectedId === comp.id}
                    rotatableId={`rot-${comp.id}`}
                  />
                )}
            </svg>
            
            {/* Hover/Selection helper area (invisible but catch clicks) */}
            <div className="absolute w-12 h-12 -z-10 rounded-full" />
          </div>
        ))}

        {/* RPM Labels Layer - Always on very top */}
        {components.map(comp => (
            <div 
                key={`label-${comp.id}`}
                id={`label-${comp.id}`}
                className="absolute text-[10px] font-mono font-bold pointer-events-none select-none flex justify-center items-center text-center"
                style={{
                    zIndex: 1000 + components.indexOf(comp), // Match component z-order but in higher band
                    transform: `translate(${comp.x}px, ${comp.y}px)`,
                    width: '1px',
                    height: '1px',
                    overflow: 'visible',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                }}
            >
                0 RPM
            </div>
        ))}
      </div>

      <Controls 
        onSelectTool={handleToolSelect}
        activeTool={placementMode}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        isPlaying={isPlaying}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      <PropertyPanel 
        component={selectedComponent}
        onUpdate={handleUpdateComponent}
        onDelete={handleDeleteComponent}
        onMoveLayer={handleMoveLayer}
        onClose={() => setSelectedId(null)}
      />

      <SaveLoadModal 
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveScene}
        onLoad={handleLoadScene}
      />
      
      <div className="absolute top-4 left-4 text-white/30 text-xs font-mono pointer-events-none">
        Zoom: {viewport.zoom.toFixed(2)}x | Items: {components.length}
      </div>
    </div>
  );
}

export default App;
