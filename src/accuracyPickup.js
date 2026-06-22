import { Graphics } from "pixi.js";

const PICKUP_COUNT = 8;
const WORLD_RANGE = 1200;

export function createAccuracyPickups(world) {
  const pickups = [];

  for (let i = 0; i < PICKUP_COUNT; i++) {
    const pickup = new Graphics();
    pickup.circle(0, 0, 6);
    pickup.fill(0xff2222);
    pickup.circle(0, 0, 9);
    pickup.stroke({ color: 0xff6666, width: 1.5, alpha: 0.6 });

    pickup.x = (Math.random() - 0.5) * WORLD_RANGE * 2;
    pickup.y = (Math.random() - 0.5) * WORLD_RANGE * 2;
    pickup.active = true;

    world.addChild(pickup);
    pickups.push(pickup);

    // Pulse animation state
    pickup._pulse = Math.random() * Math.PI * 2;
  }

  return pickups;
}

export function updatePickupPulse(pickups) {
  for (const p of pickups) {
    if (!p.active) continue;
    p._pulse += 0.08;
    p.alpha = 0.7 + Math.sin(p._pulse) * 0.3;
    p.scale.set(0.9 + Math.sin(p._pulse) * 0.12);
  }
}

export function checkPickupCollection(pickups, ship, world, onCollect) {
  for (let i = 0; i < pickups.length; i++) {
    const p = pickups[i];
    if (!p.active) continue;

    const dx = ship.x - p.x;
    const dy = ship.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      p.active = false;
      world.removeChild(p);
      pickups.splice(i, 1);
      onCollect();
      return true;
    }
  }
  return false;
}
