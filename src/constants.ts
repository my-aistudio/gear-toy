// Grid System
export const GRID_SIZE = 20; // Pixels per grid unit
export const DOT_SIZE = 2; // Radius of pegboard holes
export const SNAP_THRESHOLD = 0.5; // Snap sensitivity

// Gear Physics
// We define radius based on teeth count to ensure meshing.
// Module (m) = Pitch Diameter / Number of Teeth.
// Pitch Radius = (Teeth * TOOTH_MODULE) / 2
export const TOOTH_MODULE = 2.5 * (GRID_SIZE / 10); 

// Colors
export const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
];

export const BOARD_COLOR = '#1e293b'; // Slate 800
export const DOT_COLOR = '#334155'; // Slate 700

export const DEFAULT_GEAR_TEETH = 12;
export const DEFAULT_MOTOR_TEETH = 8;
export const DEFAULT_MOTOR_SPEED = 60;
