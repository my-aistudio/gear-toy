
import { ComponentType } from '../types';
import type { MachineComponent } from '../types';
import { areMeshed } from '../utils/geometry';

export interface PhysicsResult {
  velocities: { [id: string]: number }; // Normalized velocity (1.0 = baseline)
  jammed: string[]; // IDs of jammed components
}

type ConnectionType = 'MESH' | 'STACK';

interface Connection {
  targetId: string;
  type: ConnectionType;
}

export const solvePhysics = (components: MachineComponent[]): PhysicsResult => {
  const velocities: { [id: string]: number } = {};
  const jammed: Set<string> = new Set();
  
  // Adjacency list: id -> list of connections
  const graph: { [id: string]: Connection[] } = {};
  components.forEach(c => graph[c.id] = []);

  // 1. Build Interaction Graph
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const c1 = components[i];
      const c2 = components[j];
      
      const dx = c1.x - c2.x;
      const dy = c1.y - c2.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Check for Stacking (Axle Lock)
      // If centers are extremely close (e.g. < 5 pixels), we consider them stacked on the same shaft
      if (dist < 5) {
        graph[c1.id].push({ targetId: c2.id, type: 'STACK' });
        graph[c2.id].push({ targetId: c1.id, type: 'STACK' });
      } 
      // Check for Meshing (Teeth interaction)
      else if (areMeshed(c1, c2)) {
        graph[c1.id].push({ targetId: c2.id, type: 'MESH' });
        graph[c2.id].push({ targetId: c1.id, type: 'MESH' });
      }
    }
  }

  // 2. Identify Sources (Motors)
  const motors = components.filter(c => c.type === ComponentType.MOTOR);
  const queue: { id: string, speed: number }[] = [];
  const visited = new Set<string>();

  // Initialize motors
  motors.forEach(m => {
    const motor = m as any; 
    const baseSpeed = (motor.speed / 60) * motor.direction; // RPM to RPS roughly
    
    // Check if motor itself is jammed (conflict with another motor on same graph)
    // For simplicity, we just take the first definition, handled in propagation conflicts
    if (!visited.has(m.id)) {
        velocities[m.id] = baseSpeed;
        visited.add(m.id);
        queue.push({ id: m.id, speed: baseSpeed });
    } else {
        // If already visited, check consistency
        if (Math.abs(velocities[m.id] - baseSpeed) > 0.01) {
            jammed.add(m.id);
        }
    }
  });

  // 3. Propagate (BFS)
  let head = 0;
  while(head < queue.length) {
    const { id, speed } = queue[head++];
    const currentComp = components.find(c => c.id === id);
    if (!currentComp) continue;

    const connections = graph[id];

    for (const conn of connections) {
      const nId = conn.targetId;
      const neighborComp = components.find(c => c.id === nId);
      if (!neighborComp) continue;

      let newSpeed = 0;

      if (conn.type === 'STACK') {
        // Stacked gears share the same shaft -> Same speed, Same direction
        newSpeed = speed;
      } else {
        // Meshed gears -> Ratio speed, Reverse direction
        // v2 = -v1 * (t1 / t2)
        const ratio = currentComp.teeth / neighborComp.teeth;
        newSpeed = -speed * ratio;
      }

      if (visited.has(nId)) {
        // Conflict check
        const existingSpeed = velocities[nId];
        // Allow tiny floating point error
        if (Math.abs(existingSpeed - newSpeed) > 0.01) {
            jammed.add(nId);
            jammed.add(id);
        }
      } else {
        velocities[nId] = newSpeed;
        visited.add(nId);
        queue.push({ id: nId, speed: newSpeed });
      }
    }
  }

  return { velocities, jammed: Array.from(jammed) };
};
