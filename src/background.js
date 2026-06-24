import { Graphics, Container } from "pixi.js";

export function createParallaxLayers() {
  const layers = [];

  // Deep background - largest, slowest
  const bg1 = new Graphics();
  bg1.rect(0, 0, 800, 600);
  bg1.fill(0x000022);
  bg1.baseAlpha = 1;
  bg1.alpha = bg1.baseAlpha;
  bg1.parallaxFactor = 0.1;
  bg1.zIndex = -10;
  layers.push(bg1);

  // Mid background
  const bg2 = new Graphics();
  bg2.rect(0, 0, 800, 600);
  bg2.fill(0x000033);
  bg2.baseAlpha = 0.5;
  bg2.alpha = bg2.baseAlpha;
  bg2.parallaxFactor = 0.2;
  bg2.zIndex = -9;
  layers.push(bg2);

  return layers;
}

export function createZoneOverlay(width, height) {
  const overlay = new Graphics();
  overlay.zoneWidth = width;
  overlay.zoneHeight = height;
  overlay.rect(0, 0, width, height);
  overlay.fill({ color: 0x6fd3ff, alpha: 0 });
  overlay.alpha = 1;
  return overlay;
}

export function updateZoneOverlay(overlay, zoneVisual) {
  overlay.clear();
  overlay.rect(0, 0, overlay.zoneWidth || 800, overlay.zoneHeight || 600);
  overlay.fill({
    color: zoneVisual.overlayColor,
    alpha: zoneVisual.overlayAlpha
  });
}

export function updateParallaxBackground(layers, ship, world, zoneVisual = null, nebula = null) {
  for (const layer of layers) {
    layer.x = -ship.x * layer.parallaxFactor;
    layer.y = -ship.y * layer.parallaxFactor;
  }

  if (!zoneVisual) return;

  if (layers[0]) {
    layers[0].alpha = zoneVisual.bg1Alpha ?? layers[0].baseAlpha ?? layers[0].alpha;
    layers[0].tint = zoneVisual.bgTint;
  }
  if (layers[1]) {
    layers[1].alpha = zoneVisual.bg2Alpha ?? layers[1].baseAlpha ?? layers[1].alpha;
    layers[1].tint = zoneVisual.bgTint;
  }
  if (nebula) {
    nebula.alpha = zoneVisual.nebulaAlpha;
    nebula.tint = zoneVisual.bgTint;
  }
}

export function createNebulaClouds() {
  const container = new Container();

  const colors = [0x3a86ff, 0x0066cc, 0x004499, 0x002266];

  for (let i = 0; i < 8; i++) {
    const cloud = new Graphics();
    const color = colors[Math.floor(Math.random() * colors.length)];
    cloud.circle(0, 0, Math.random() * 300 + 120);
    cloud.fill(color);
    cloud.alpha = 0.08 + Math.random() * 0.07;
    cloud.x = (Math.random() - 0.5) * 3000;
    cloud.y = (Math.random() - 0.5) * 3000;
    container.addChild(cloud);
  }

  return container;
}
