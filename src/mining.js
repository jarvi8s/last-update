import { Container, Graphics } from "pixi.js";
import { ZONES, getZoneRadii } from "./zones.js";

const ORE_TYPES = [
  { id: "red_ore", color: 0xff4d4d },
  { id: "yellow_ore", color: 0xffd84d }
];

const MAX_BEAM_DISTANCE = 300;
const MINING_RATE = 2;
const ORE_DAMAGE_PER_CYCLE = 12;
const ORE_HIT_TOLERANCE = 0.78;
const COLLISION_SPEED_THRESHOLD = 2;
const COLLISION_DAMAGE_MULTIPLIER = 1.8;
const MIN_COLLISION_DAMAGE = 1;
const MAX_COLLISION_DAMAGE = 20;
const STARTING_ORE_COUNTS = {
  pve: 12,
  pvp: 12
};

export function createMiningSystem(world) {
  const oreContainer = new Container();
  const fxContainer = new Container();
  const beam = new Graphics();
  world.addChild(oreContainer);
  world.addChild(fxContainer);
  world.addChild(beam);

  const ores = [];
  const particles = [];
  const radii = getZoneRadii();

  function createOre(zone) {
    const oreType = ORE_TYPES[Math.floor(Math.random() * ORE_TYPES.length)];
    const health = 100 + Math.floor(Math.random() * 101);
    const size = 16 + ((health - 100) / 100) * 20;
    const ore = new Graphics();

    const points = [];
    const pointCount = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pointCount; i++) {
      const angle = (Math.PI * 2 * i) / pointCount;
      const noise = 0.72 + Math.random() * 0.45;
      points.push({ x: Math.cos(angle) * size * noise, y: Math.sin(angle) * size * noise });
    }
    ore.poly(points);
    ore.fill(oreType.color);
    ore.stroke({ color: 0xffffff, width: 1, alpha: 0.35 });

    const minRadius = zone === ZONES.PVE ? radii.safe + 70 : radii.pve + 70;
    const maxRadius = zone === ZONES.PVE ? radii.pve - 90 : radii.pve + 1800;
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    ore.x = Math.cos(angle) * radius;
    ore.y = Math.sin(angle) * radius;
    ore.baseColor = oreType.color;
    ore.resourceId = oreType.id;
    ore.health = health;
    ore.maxHealth = health;
    ore.size = size;
    ore.hitFlash = 0;
    ore.hitShake = 0;
    ore.zone = zone;
    ore.width = size * 2;
    ore.height = size * 2;
    ores.push(ore);
    oreContainer.addChild(ore);
  }

  function ensureOres() {
    const pveCount = ores.filter((ore) => ore.zone === ZONES.PVE).length;
    const pvpCount = ores.filter((ore) => ore.zone === ZONES.PVP).length;
    for (let i = pveCount; i < STARTING_ORE_COUNTS.pve; i++) createOre(ZONES.PVE);
    for (let i = pvpCount; i < STARTING_ORE_COUNTS.pvp; i++) createOre(ZONES.PVP);
  }

  ensureOres();

  function removeOre(ore) {
    const index = ores.indexOf(ore);
    if (index >= 0) ores.splice(index, 1);
    oreContainer.removeChild(ore);
  }

  function addHitParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const p = new Graphics();
      p.circle(0, 0, 1.2 + Math.random() * 2.4);
      p.fill(color);
      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 2.6;
      p.vy = (Math.random() - 0.5) * 2.6;
      p.life = 18 + Math.floor(Math.random() * 8);
      particles.push(p);
      fxContainer.addChild(p);
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = p.life / 26;
      p.life--;
      if (p.life <= 0) {
        fxContainer.removeChild(p);
        particles.splice(i, 1);
      }
    }
  }

  function getRayOreHit(ship, directionX, directionY) {
    let closest = null;
    let closestDistance = MAX_BEAM_DISTANCE;
    for (const ore of ores) {
      const relX = ore.x - ship.x;
      const relY = ore.y - ship.y;
      const projection = relX * directionX + relY * directionY;
      if (projection < 0 || projection > MAX_BEAM_DISTANCE) continue;
      const perpendicular = Math.abs(relX * directionY - relY * directionX);
      if (perpendicular <= ore.size * ORE_HIT_TOLERANCE && projection < closestDistance) {
        closest = ore;
        closestDistance = projection;
      }
    }
    return closest ? { ore: closest, distance: closestDistance } : null;
  }

  function damageShipFromCollision(ship, ore) {
    const dx = ship.x - ore.x;
    const dy = ship.y - ore.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const combinedRadius = ore.size + 20;
    if (dist > combinedRadius) return;
    if (ship.collisionCooldown > 0) return;

    const speed = Math.hypot(ship.vx || 0, ship.vy || 0);
    if (speed < COLLISION_SPEED_THRESHOLD) return;

    const damage = Math.min(
      MAX_COLLISION_DAMAGE,
      Math.max(MIN_COLLISION_DAMAGE, (speed - COLLISION_SPEED_THRESHOLD) * COLLISION_DAMAGE_MULTIPLIER)
    );
    ship.hull = Math.max(0, ship.hull - damage);
    ship.collisionCooldown = 12;
    ship.collisionFlash = 1;

    const nx = dx / dist;
    const ny = dy / dist;
    ship.x = ore.x + nx * (combinedRadius + 1);
    ship.y = ore.y + ny * (combinedRadius + 1);
    ship.vx = (ship.vx || 0) + nx * 1.8;
    ship.vy = (ship.vy || 0) + ny * 1.8;
    ore.hitFlash = 0.9;
    ore.hitShake = 3;
    addHitParticles(ore.x + nx * ore.size * 0.6, ore.y + ny * ore.size * 0.6, 0xfff2b3);
  }

  function update({ ship, isMiningActive, isInventoryOpen, inventorySystem, delta = 1 }) {
    beam.clear();
    updateParticles();

    if (ship.collisionCooldown > 0) ship.collisionCooldown -= delta;
    if (ship.collisionFlash > 0) ship.collisionFlash = Math.max(0, ship.collisionFlash - 0.08 * delta);

    for (const ore of ores) {
      if (ore.hitFlash > 0) {
        ore.hitFlash = Math.max(0, ore.hitFlash - 0.06 * delta);
      }
      if (ore.hitShake > 0) {
        ore.hitShake = Math.max(0, ore.hitShake - 0.3 * delta);
      }
      const hpRatio = ore.health / ore.maxHealth;
      ore.alpha = 0.65 + hpRatio * 0.35 + ore.hitFlash * 0.1;
      ore.tint = hpRatio < 0.35 ? 0xffa5a5 : 0xffffff;
      ore.rotation += 0.003;
      if (ore.hitShake > 0) {
        const jitter = 1 + ore.hitShake * 0.02;
        ore.scale.set(jitter, jitter);
      } else {
        ore.scale.set(1, 1);
      }
      damageShipFromCollision(ship, ore);
    }

    if (!isMiningActive || isInventoryOpen) {
      ship.miningProgress -= 100;
      ship.miningTarget = null;
      return { active: false, progress: 0, target: null, ores };
    }

    const angle = ship.rotation - Math.PI / 2;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const muzzleX = ship.x + directionX * 24;
    const muzzleY = ship.y + directionY * 24;
    const hit = getRayOreHit(ship, directionX, directionY);
    const beamDistance = hit ? hit.distance : MAX_BEAM_DISTANCE;
    const endX = muzzleX + directionX * beamDistance;
    const endY = muzzleY + directionY * beamDistance;

    beam.moveTo(muzzleX, muzzleY);
    beam.lineTo(endX, endY);
    beam.stroke({ color: 0x66f2ff, width: 4, alpha: 0.35 });
    beam.moveTo(muzzleX, muzzleY);
    beam.lineTo(endX, endY);
    beam.stroke({ color: 0xc9fcff, width: 1.6, alpha: 0.95 });

    if (!hit) {
      ship.miningProgress = 0;
      ship.miningTarget = null;
      return { active: true, progress: 0, target: null, ores };
    }

    const ore = hit.ore;
    ship.miningTarget = ore;
    ship.miningProgress = Math.min(100, (ship.miningProgress || 0) + MINING_RATE * delta);
    addHitParticles(endX, endY, ore.baseColor);

    if (ship.miningProgress >= 100) {
      ship.miningProgress = 0;
      ore.health -= ORE_DAMAGE_PER_CYCLE;
      ore.hitFlash = 1;
      ore.hitShake = 2.4;
      inventorySystem.add(ore.resourceId, 1);
      if (ore.health <= 0) {
        removeOre(ore);
      }
    }

    return {
      active: true,
      progress: ship.miningProgress,
      target: ore,
      ores
    };
  }

  function getOres() {
    return ores;
  }

  return {
    update,
    getOres
  };
}
