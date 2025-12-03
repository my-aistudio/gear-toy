
export const ComponentType = {
  GEAR: 'GEAR',
  MOTOR: 'MOTOR'
} as const;

export type ComponentType = typeof ComponentType[keyof typeof ComponentType];

export const GearPattern = {
  NONE: 'NONE',
  SPOKES: 'SPOKES',
  RINGS: 'RINGS',
  STRIPES: 'STRIPES',
  BIOHAZARD: 'BIOHAZARD',
  SWIRL: 'SWIRL',
  DOTS: 'DOTS'
} as const;

export type GearPattern = typeof GearPattern[keyof typeof GearPattern];

export interface Coordinates {
  x: number;
  y: number;
}

export interface BaseComponent {
  id: string;
  type: ComponentType;
  x: number; // World coordinates
  y: number; // World coordinates
  teeth: number;
  color: string;
  pattern: GearPattern;
}

export interface Gear extends BaseComponent {
  type: typeof ComponentType.GEAR;
}

export interface Motor extends BaseComponent {
  type: typeof ComponentType.MOTOR;
  speed: number; // RPM
  direction: 1 | -1; // 1 for clockwise, -1 for counter-clockwise
}

export type MachineComponent = Gear | Motor;

export interface SimulationState {
  [id: string]: {
    velocity: number; // Angular velocity (relative multiplier)
    angle: number; // Current visual angle in radians
    isJammed: boolean; // If conflicting forces are applied
  };
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface SavedScene {
  id: string;
  name: string;
  timestamp: number;
  components: MachineComponent[];
  viewport: Viewport;
}
