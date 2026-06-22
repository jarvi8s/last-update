export function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function updateBullets(bullets, world) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += bullet.directionX * bullet.speed;
    bullet.y += bullet.directionY * bullet.speed;
    
    // Track distance traveled
    const dx = bullet.x - bullet.startX;
    const dy = bullet.y - bullet.startY;
    bullet.distanceTraveled = Math.sqrt(dx * dx + dy * dy);
    
    // Remove bullet if it traveled too far
    if (bullet.distanceTraveled > bullet.maxDistance) {
      world.removeChild(bullet);
      bullets.splice(i, 1);
    }
  }
}

export function checkBulletCollisions(bullets, enemy, world) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    if (enemy.visible && checkCollision(bullet, enemy)) {
      // Deal damage
      enemy.health -= bullet.damage;
      
      // Remove bullet
      world.removeChild(bullet);
      bullets.splice(i, 1);
      
      // Check if enemy is dead
      if (enemy.health <= 0) {
        enemy.visible = false;
        return true; // Enemy defeated
      }
    }
  }
  return false;
}

export function updateCamera(world, ship, screenWidth = 800, screenHeight = 600) {
  world.x = screenWidth / 2 - ship.x;
  world.y = screenHeight / 2 - ship.y;
}
