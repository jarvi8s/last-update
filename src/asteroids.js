import { Graphics, Container } from "pixi.js";

export function createAsteroids(count = 15) {
  const container = new Container();
  const asteroids = [];
  
  for (let i = 0; i < count; i++) {
    const asteroid = new Graphics();
    const size = Math.random() * 30 + 15;
    
    // Irregular asteroid shape
    const points = [];
    const sides = Math.floor(Math.random() * 3) + 6;
    for (let j = 0; j < sides; j++) {
      const angle = (Math.PI * 2 * j) / sides;
      const radius = size * (Math.random() * 0.3 + 0.7);
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    
    asteroid.poly(points);
    asteroid.fill(0x888888);
    asteroid.stroke({ color: 0x555555, width: 1 });
    
    asteroid.x = Math.random() * 2000 - 1000;
    asteroid.y = Math.random() * 2000 - 1000;
    asteroid.rotation = Math.random() * Math.PI * 2;
    asteroid.rotationSpeed = (Math.random() - 0.5) * 0.01;
    
    container.addChild(asteroid);
    asteroids.push(asteroid);
  }
  
  return { container, asteroids };
}

export function updateAsteroids(asteroids) {
  for (const asteroid of asteroids) {
    asteroid.rotation += asteroid.rotationSpeed;
  }
}
