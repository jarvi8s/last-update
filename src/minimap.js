import { Graphics } from "pixi.js";

const MINIMAP_WIDTH = 150;
const MINIMAP_HEIGHT = 150;
const MINIMAP_SCALE = 0.15; // How much to scale down the world

export function createMinimap() {
  const minimap = new Graphics();
  return minimap;
}

export function updateMinimap(minimap, ship, enemy, bullets, ores = [], screenWidth, screenHeight) {
  minimap.clear();
  
  // Background
  minimap.rect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
  minimap.fill(0x1a1a2e);
  minimap.stroke({ color: 0x00ff00, width: 2 });
  
  // Center point (ship is always centered on camera)
  const centerX = MINIMAP_WIDTH / 2;
  const centerY = MINIMAP_HEIGHT / 2;
  
  // Draw visible area indicator (white border showing camera view)
  const viewWidth = (screenWidth / 2) * MINIMAP_SCALE;
  const viewHeight = (screenHeight / 2) * MINIMAP_SCALE;
  minimap.rect(centerX - viewWidth, centerY - viewHeight, viewWidth * 2, viewHeight * 2);
  minimap.stroke({ color: 0xffff00, width: 1 });
  
  // Draw ship (white triangle at center)
  minimap.circle(centerX, centerY, 4);
  minimap.fill(0xffffff);
  
  // Draw enemy
  const enemyX = centerX + (enemy.x - ship.x) * MINIMAP_SCALE;
  const enemyY = centerY + (enemy.y - ship.y) * MINIMAP_SCALE;
  
  // Only draw if within bounds
  if (Math.abs(enemyX - centerX) < MINIMAP_WIDTH && Math.abs(enemyY - centerY) < MINIMAP_HEIGHT) {
    minimap.circle(enemyX, enemyY, 3);
    minimap.fill(0xff6b6b);
  }
  
  // Draw bullets
  for (const bullet of bullets) {
    const bulletX = centerX + (bullet.x - ship.x) * MINIMAP_SCALE;
    const bulletY = centerY + (bullet.y - ship.y) * MINIMAP_SCALE;
    
    // Only draw if within bounds
    if (Math.abs(bulletX - centerX) < MINIMAP_WIDTH && Math.abs(bulletY - centerY) < MINIMAP_HEIGHT) {
      const color = bullet.type === "light" ? 0xffff00 : 0xff6600;
      minimap.circle(bulletX, bulletY, 1.5);
      minimap.fill(color);
    }
  }

  // Draw ores
  for (const ore of ores) {
    const oreX = centerX + (ore.x - ship.x) * MINIMAP_SCALE;
    const oreY = centerY + (ore.y - ship.y) * MINIMAP_SCALE;
    if (Math.abs(oreX - centerX) < MINIMAP_WIDTH && Math.abs(oreY - centerY) < MINIMAP_HEIGHT) {
      minimap.circle(oreX, oreY, 2);
      minimap.fill(ore.baseColor ?? 0xffffff);
    }
  }
  
  // Position at top-right corner
  minimap.x = screenWidth - MINIMAP_WIDTH - 10;
  minimap.y = 10;
}
