import { TOOTH_MODULE } from '../constants';

export const getPitchRadius = (teeth: number) => {
  return (teeth * TOOTH_MODULE) / 2;
};

export const getOuterRadius = (teeth: number) => {
  return getPitchRadius(teeth) + TOOTH_MODULE;
};

// Generate SVG path for a gear
export const generateGearPath = (teeth: number, radius: number, holeRadius: number = 0) => {
  const outerRadius = radius + TOOTH_MODULE * 0.8;
  const rootRadius = radius - TOOTH_MODULE * 0.8;
  const numPoints = teeth * 4;
  const angleStep = (Math.PI * 2) / numPoints;
  
  let path = "";

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep;
    // Trapezoidal tooth profile
    // 0: Root, 1: Rise, 2: Tip, 3: Fall
    const stepType = i % 4;
    
    let r = rootRadius;
    if (stepType === 1 || stepType === 2) {
      r = outerRadius;
    } 
    // Add slight curve or bevel logic here if desired for realism, 
    // keeping it simple linear for performance.

    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }

  path += " Z";

  // Inner hole (drawn in reverse to create a hole in fill-rule: evenodd)
  if (holeRadius > 0) {
    path += ` M ${holeRadius} 0`;
    for (let i = 1; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        // Negative sin to go counter-clockwise for hole
        path += ` L ${Math.cos(angle) * holeRadius} ${-Math.sin(angle) * holeRadius}`; 
    }
    path += " Z";
  }

  return path;
};

export const checkCollision = (p1: {x: number, y: number, r: number}, p2: {x: number, y: number, r: number}) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  return dist < (p1.r + p2.r);
};

export const areMeshed = (c1: {x: number, y: number, teeth: number}, c2: {x: number, y: number, teeth: number}) => {
  const r1 = getPitchRadius(c1.teeth);
  const r2 = getPitchRadius(c2.teeth);
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // Tolerance for meshing (allow slight imperfection in placement for fun)
  const tolerance = TOOTH_MODULE * 0.8; 
  const optimalDist = r1 + r2;
  
  return Math.abs(dist - optimalDist) < tolerance;
};
