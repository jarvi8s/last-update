import { Graphics } from "pixi.js";

export function createBulletTrail(bullet) {
  const trail = new Graphics();
  
  const trailColor = bullet.type === "light" ? 0xffff00 : 0xff6600;
  const trailLength = 20;
  
  trail.circle(0, 0, bullet.speed / 15);
  trail.fill(trailColor);
  trail.alpha = 0.5;
  
  trail.x = bullet.x - bullet.directionX * trailLength;
  trail.y = bullet.y - bullet.directionY * trailLength;
  trail.lifespan = 15;
  trail.maxLifespan = 15;
  
  return trail;
}

export function updateTrails(trails, world) {
  for (let i = trails.length - 1; i >= 0; i--) {
    const trail = trails[i];
    trail.lifespan--;
    trail.alpha = (trail.lifespan / trail.maxLifespan) * 0.5;
    
    if (trail.lifespan <= 0) {
      world.removeChild(trail);
      trails.splice(i, 1);
    }
  }
}
