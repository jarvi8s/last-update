import { Graphics, Text } from "pixi.js";

// Bullet types
const bulletTypes = {
  light: {
    name: "Light",
    color: 0xffff00,
    speed: 12,
    damage: 1,
    maxDistance: 400,
    size: 3
  },
  heavy: {
    name: "Heavy",
    color: 0xff6600,
    speed: 6,
    damage: 2,
    maxDistance: 700,
    size: 5
  }
};

// Gemi karakterleri tanımla
const shipCharacters = {
  fast: {
    name: "Hızlı",
    color: 0xff6b6b,
    rotationSpeed: 0.2,
    moveSpeed: 7,
    bulletSpeed: 15
  },
  balanced: {
    name: "Dengeli",
    color: 0xffffff,
    rotationSpeed: 0.1,
    moveSpeed: 5,
    bulletSpeed: 10
  },
  heavy: {
    name: "Ağır",
    color: 0x4ecdc4,
    rotationSpeed: 0.05,
    moveSpeed: 3,
    bulletSpeed: 8
  }
};

export function createShip(character = "balanced") {
  const charStats = shipCharacters[character] || shipCharacters.balanced;
  
  const ship = new Graphics();
  
  // Detaylı uzay gemisi tasarımı - merkeze yerleş
  // Gemi gövdesi - daha gerçekçi şekil
  ship.poly([
    { x: 0, y: -25 },     // Ön (sharp nose) - merkeze kaydırıldı
    { x: 10, y: -10 },    // Sağ yan
    { x: 5, y: 10 },      // Sağ kanat
    { x: 3, y: 25 },      // Sağ arka
    { x: 0, y: 23 },      // Arka merkez
    { x: -3, y: 25 },     // Sol arka
    { x: -5, y: 10 },     // Sol kanat
    { x: -10, y: -10 }    // Sol yan
  ]);
  ship.fill(charStats.color);
  ship.stroke({ color: 0x444444, width: 1.5 });
  
  // Kokpit (gemi başında daire)
  const cockpit = new Graphics();
  cockpit.circle(0, -13, 5);
  cockpit.fill(0x00ff00);
  cockpit.alpha = 0.8;
  ship.addChild(cockpit);
  
  // Sol motor ışığı
  const engineLeft = new Graphics();
  engineLeft.circle(-10, 18, 3);
  engineLeft.fill(0xff6b00);
  engineLeft.alpha = 0.9;
  ship.addChild(engineLeft);
  
  // Sağ motor ışığı
  const engineRight = new Graphics();
  engineRight.circle(10, 18, 3);
  engineRight.fill(0xff6b00);
  engineRight.alpha = 0.9;
  ship.addChild(engineRight);
  
  ship.x = 0;
  ship.y = 0;
  ship.width = 50;
  ship.height = 50;
  ship.rotation = 0;
  ship.targetRotation = 0;
  ship.pivot.x = 0;
  ship.pivot.y = 0;
  
  // Karakter özellikleri
  ship.character = character;
  ship.stats = charStats;
  ship.rotationSpeed = charStats.rotationSpeed;
  ship.moveSpeed = charStats.moveSpeed;
  ship.bulletSpeed = charStats.bulletSpeed;
  ship.lastX = 0;
  ship.lastY = 0;
  ship.bulletType = "light"; // Default bullet type
  
  return ship;
}

export function createEnemy(character = "balanced") {
  const charStats = shipCharacters[character] || shipCharacters.balanced;
  
  const enemy = new Graphics();
  
  // Üçgen düşman (farklı yöne bakıyor)
  enemy.poly([
    { x: 30, y: 50 },    // Ön (aşağı)
    { x: 0, y: 0 },      // Sol arka
    { x: 60, y: 0 }      // Sağ arka
  ]);
  enemy.fill(charStats.color);
  
  enemy.x = 370;
  enemy.y = 100;
  enemy.width = 60;
  enemy.height = 60;
  
  // Karakter özellikleri
  enemy.character = character;
  enemy.stats = charStats;
  enemy.rotationSpeed = charStats.rotationSpeed;
  enemy.moveSpeed = charStats.moveSpeed;
  enemy.bulletSpeed = charStats.bulletSpeed;
  enemy.health = 10;
  enemy.maxHealth = 10;
  
  return enemy;
}

export function createBullet(shipX, shipY, directionX = 0, directionY = -1, bulletType = "light", shipRotation = 0) {
  const type = bulletTypes[bulletType] || bulletTypes.light;
  
  const bullet = new Graphics();
  bullet.circle(0, 0, type.size);
  bullet.fill(type.color);
  
  // Geminin en uc noktasından 25 pixel uzakta çıksın
  const offsetDistance = 25;
  bullet.x = shipX + directionX * offsetDistance;
  bullet.y = shipY + directionY * offsetDistance;
  bullet.width = type.size * 2;
  bullet.height = type.size * 2;
  
  // Normalize direction
  const length = Math.sqrt(directionX * directionX + directionY * directionY);
  bullet.directionX = length > 0 ? directionX / length : 0;
  bullet.directionY = length > 0 ? directionY / length : -1;
  
  // Bullet properties
  bullet.type = bulletType;
  bullet.speed = type.speed;
  bullet.damage = type.damage;
  bullet.maxDistance = type.maxDistance;
  bullet.distanceTraveled = 0;
  bullet.startX = bullet.x;
  bullet.startY = bullet.y;
  
  return bullet;
}

export function createAimLine(ship) {
  const aimLine = new Graphics();
  aimLine.line({ x: 0, y: 0 }, { x: 0, y: -80 });
  aimLine.stroke({ color: "yellow", width: 1 });
  aimLine.rotation = ship.rotation;
  aimLine.x = ship.x + 25;
  aimLine.y = ship.y;
  return aimLine;
}
