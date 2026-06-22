import { Graphics, Container } from "pixi.js";

export function createStarfield(screenWidth, screenHeight, count = 3) {
  const container = new Container();

  for (let i = 0; i < count; i++) {
    const star = new Graphics();
    const size = Math.random() * 1.5 + 0.5;
    star.circle(0, 0, size);
    star.fill(0xffffff);
    star.alpha = Math.random() * 0.8 + 0.2;
    star.x = Math.random() * screenWidth;
    star.y = Math.random() * screenHeight;
    container.addChild(star);
  }

  return container;
}

export function createTwinklingStars(screenWidth, screenHeight, count = 100) {
  const stars = [];
  const container = new Container();

  for (let i = 0; i < count; i++) {
    const star = new Graphics();
    const size = Math.random() * 1.2 + 0.3;
    star.circle(0, 0, size);
    star.parallaxFactor = Math.random() * 0.15 + 0.02;
    star.fill(0xddeeff);
    star.x = Math.random() * screenWidth;
    star.y = Math.random() * screenHeight;
    star.alpha = Math.random() * 0.9 + 0.1;
    star.targetAlpha = Math.random() * 0.9 + 0.1;
    star.twinkleSpeed = Math.random() * 0.02 + 0.005;
    container.addChild(star);
    stars.push(star);
  }

  return { container, stars };
}

// EKSİK OLAN FONKSİYON EKLENDİ
export function updateTwinklingStars(stars) {
  for (const star of stars) {
    star.alpha += star.twinkleSpeed;
    
    // Yıldız çok parlak veya çok sönük olursa yönünü değiştir
    if (star.alpha > star.targetAlpha || star.alpha < 0.1) {
      star.twinkleSpeed *= -1; 
    }
  }
}

// GÖNDERİLEN EKRAN BOYUTU PARAMETRELERİNİ ALACAK ŞEKİLDE DÜZELTİLDİ
export function updateStarParallax(stars, ship, screenWidth, screenHeight) {
  for (const star of stars) {
    star.x -= ship.vx * star.parallaxFactor;
    star.y -= ship.vy * star.parallaxFactor;

    if (star.x < 0) star.x = screenWidth;
    if (star.x > screenWidth) star.x = 0;

    if (star.y < 0) star.y = screenHeight;
    if (star.y > screenHeight) star.y = 0;
  }
}