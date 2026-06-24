import { Application, Container, Text, TextStyle, Graphics } from "pixi.js";
import { createShip, createEnemy, createBullet } from "./entities.js";
import { setupInputListener, handleMovement, updateShipRotation } from "./input.js";
import { checkBulletCollisions, updateBullets, updateCamera } from "./physics.js";
import { createMinimap, updateMinimap } from "./minimap.js";
import { 
  createStarfield, 
  createTwinklingStars, 
  updateTwinklingStars,
  updateStarParallax
} from "./stars.js";
import { createAsteroids, updateAsteroids } from "./asteroids.js";
import { createBulletTrail, updateTrails } from "./bulletTrail.js";
import { createParallaxLayers, updateParallaxBackground, createNebulaClouds } from "./background.js";
import { createAccuracyPickups, updatePickupPulse, checkPickupCollection } from "./accuracyPickup.js";
import { getZoneByDistance } from "./zones.js";

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const THEME_BLEND_SPEED = 0.08;

const COLOR_THEME_KEYS = ["overlayColor", "bg1Color", "bg2Color", "minimapBg", "minimapBorder", "hudColor"];
const NUMBER_THEME_KEYS = ["overlayAlpha", "bg1Alpha", "bg2Alpha", "nebulaAlpha", "twinkleAlpha", "starfieldAlpha"];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(fromColor, toColor, t) {
  const fr = (fromColor >> 16) & 0xff;
  const fg = (fromColor >> 8) & 0xff;
  const fb = fromColor & 0xff;

  const tr = (toColor >> 16) & 0xff;
  const tg = (toColor >> 8) & 0xff;
  const tb = toColor & 0xff;

  const r = Math.round(lerp(fr, tr, t));
  const g = Math.round(lerp(fg, tg, t));
  const b = Math.round(lerp(fb, tb, t));

  return (r << 16) | (g << 8) | b;
}

function blendThemeInPlace(themeState, targetTheme, t) {
  for (const key of COLOR_THEME_KEYS) {
    themeState[key] = lerpColor(themeState[key], targetTheme[key], t);
  }

  for (const key of NUMBER_THEME_KEYS) {
    themeState[key] = lerp(themeState[key], targetTheme[key], t);
  }
}

function drawBackgroundLayer(layer, color) {
  layer.clear();
  layer.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  layer.fill(color);
}

function applyZoneTheme(themeState, parallaxLayers, nebula, starfield, twinklingStarsContainer, layerOverlay) {
  drawBackgroundLayer(parallaxLayers[0], themeState.bg1Color);
  parallaxLayers[0].alpha = themeState.bg1Alpha;

  drawBackgroundLayer(parallaxLayers[1], themeState.bg2Color);
  parallaxLayers[1].alpha = themeState.bg2Alpha;

  nebula.alpha = themeState.nebulaAlpha;
  starfield.alpha = themeState.starfieldAlpha;
  twinklingStarsContainer.alpha = themeState.twinkleAlpha;

  layerOverlay.clear();
  layerOverlay.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  layerOverlay.fill(themeState.overlayColor);
  layerOverlay.alpha = themeState.overlayAlpha;
}

export async function startGame() {
  // Initialize app
  const app = new Application();
  await app.init({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    background: "#000000",
  });

  document.body.innerHTML = "";
  document.body.appendChild(app.canvas);

  // Create background layers (parallax)
  const parallaxLayers = createParallaxLayers();
  parallaxLayers.forEach(layer => app.stage.addChild(layer));

  // Create nebula clouds
  const nebula = createNebulaClouds();
  app.stage.addChild(nebula);

  // Create starfield (static)
  const starfield = createStarfield(SCREEN_WIDTH, SCREEN_HEIGHT, 13);
  app.stage.addChild(starfield);

  // Create twinkling stars
  const { container: twinklingStarsContainer, stars: twinklingStars } = createTwinklingStars(SCREEN_WIDTH, SCREEN_HEIGHT, 150);
  app.stage.addChild(twinklingStarsContainer);

  // Zone tint overlay is only for background mood; gameplay remains in world.
  const layerOverlay = new Graphics();
  app.stage.addChild(layerOverlay);

  // Create world
  const world = new Container();
  app.stage.addChild(world);

  // Small center marker so origin is easy to spot.
  const centerCross = new Graphics();
  centerCross.moveTo(-10, 0);
  centerCross.lineTo(10, 0);
  centerCross.moveTo(0, -10);
  centerCross.lineTo(0, 10);
  centerCross.stroke({ color: 0xe9f4ff, width: 2, alpha: 0.9 });
  centerCross.circle(0, 0, 2);
  centerCross.fill(0x9dd6ff);
  world.addChild(centerCross);

  // Create asteroids
  const { container: asteroidsContainer, asteroids } = createAsteroids(20);
  world.addChild(asteroidsContainer);

  // Create minimap (stays on screen, not in world)
  const minimap = createMinimap();
  app.stage.addChild(minimap);

  // Create entities
  const ship = createShip("balanced");
  const enemy = createEnemy("fast");
  const bullets = [];
  const trails = [];
  ship.canShoot = true;

  // Accuracy system
  // Levels: "bad" < "normal" < "good"
  // Base depends on bullet type; pickup boosts +1 level for 10s
  ship.accuracyBoost = 0;
  ship.accuracyBoostTimer = 0;
  const BOOST_DURATION = 600; // 60fps * 10s

  function getAccuracyLevel() {
    const base = ship.bulletType === "light" ? "normal" : "bad";
    if (ship.accuracyBoost > 0) {
      if (base === "bad") return "normal";
      if (base === "normal") return "good";
    }
    return base;
  }

  world.addChild(ship);
  world.addChild(enemy);

  // Accuracy pickups (red dots on the map)
  const pickups = createAccuracyPickups(world);

  // Setup input and bullet type switching
  const shootFunction = (shipX, shipY, dirX, dirY) => {
    const bullet = createBullet(shipX, shipY, dirX, dirY, ship.bulletType);
    bullets.push(bullet);
    world.addChild(bullet);
  };
  
  setupInputListener(shootFunction, app.canvas, ship, world, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Bullet type switching with keys
  window.addEventListener("keydown", (e) => {
    if (e.key === "1") ship.bulletType = "light";
    if (e.key === "2") ship.bulletType = "heavy";
  });

  // Accuracy HUD
  const accuracyText = new Text({
    text: "Accuracy: NORMAL",
    style: new TextStyle({ fontSize: 15, fill: 0xffffff, fontWeight: "bold" })
  });
  accuracyText.x = 10;
  accuracyText.y = 32;
  app.stage.addChild(accuracyText);

  const zoneText = new Text({
    text: "Zone: PVE ZONE",
    style: new TextStyle({ fontSize: 15, fill: 0x95f1a8, fontWeight: "bold" })
  });
  zoneText.x = 10;
  zoneText.y = 72;
  app.stage.addChild(zoneText);

  // Boost timer bar (hidden by default)
  const boostBar = new Graphics();
  boostBar.x = 10;
  boostBar.y = 52;
  app.stage.addChild(boostBar);

  // Health and speed display
  const infoText = new Text({
    text: `Enemy HP: ${enemy.health}`,
    style: new TextStyle({
      fontSize: 16,
      fill: 0xffffff
    })
  });
  infoText.x = 10;
  infoText.y = 10;
  app.stage.addChild(infoText);

  // Title
  const titleText = new Text({
    text: "          SPACE",
    style: new TextStyle({
      fontSize: 24,
      fill: 0x00ff00,
      fontWeight: "bold"
    })
  });
  titleText.x = SCREEN_WIDTH / 2 - 100;
  titleText.y = 5;
  app.stage.addChild(titleText);

  let activeZone = getZoneByDistance(0);
  const themeState = { ...activeZone.theme };
  applyZoneTheme(themeState, parallaxLayers, nebula, starfield, twinklingStarsContainer, layerOverlay);

  // Game loop
  app.ticker.add(() => {
    // Update parallax background
    updateParallaxBackground(parallaxLayers, ship, world);

    // Update camera
    updateCamera(world, ship, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Update ship rotation
    updateShipRotation(ship);

    // Handle player movement
    handleMovement(ship);

    // Resolve zone from distance to world center and apply rules.
    const shipDistance = Math.sqrt(ship.x * ship.x + ship.y * ship.y);
    activeZone = getZoneByDistance(shipDistance);
    ship.canShoot = activeZone.rules.canShoot;
    enemy.visible = activeZone.rules.allowNpc;
    asteroidsContainer.visible = activeZone.rules.allowAsteroids;

    // Smoothly blend visual style between zones.
    blendThemeInPlace(themeState, activeZone.theme, THEME_BLEND_SPEED);
    applyZoneTheme(themeState, parallaxLayers, nebula, starfield, twinklingStarsContainer, layerOverlay);

    // Update asteroids
    if (activeZone.rules.allowAsteroids) {
      updateAsteroids(asteroids);
    }

    // Update twinkling stars
    updateTwinklingStars(twinklingStars);
    updateStarParallax(
  twinklingStars,
  ship,
  SCREEN_WIDTH,
  SCREEN_HEIGHT
);
    updateBullets(bullets, world);

    // Create bullet trails
    for (const bullet of bullets) {
      if (Math.random() < 0.6) {
        const trail = createBulletTrail(bullet);
        trails.push(trail);
        world.addChild(trail);
      }
    }

    // Update trails
    updateTrails(trails, world);

    // Check collisions
    if (activeZone.rules.allowNpc) {
      checkBulletCollisions(bullets, enemy, world);
    }

    // Accuracy boost timer
    if (ship.accuracyBoostTimer > 0) {
      ship.accuracyBoostTimer--;
      if (ship.accuracyBoostTimer <= 0) {
        ship.accuracyBoost = 0;
      }
    }

    // Update ship accuracy level for input.js to read
    ship.accuracyLevel = getAccuracyLevel();

    // Check pickup collection
    if (activeZone.rules.allowResources) {
      checkPickupCollection(pickups, ship, world, () => {
        ship.accuracyBoost = 1;
        ship.accuracyBoostTimer = BOOST_DURATION;
      });
    }

    // Pulse pickups
    if (activeZone.rules.allowResources) {
      updatePickupPulse(pickups);
    }

    for (const pickup of pickups) {
      pickup.visible = activeZone.rules.allowResources;
    }

    // Update minimap
    updateMinimap(minimap, ship, enemy, bullets, SCREEN_WIDTH, SCREEN_HEIGHT, themeState);

    // Calculate current speed
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);

    // Update info display
    const enemyHp = enemy.visible ? Math.max(0, enemy.health) : "-";
    infoText.text = `Speed: ${speed.toFixed(1)} | Enemy HP: ${enemyHp} | Bullet: ${ship.bulletType === "light" ? "1-Light" : "2-Heavy"}`;

    // Update accuracy HUD
    const level = ship.accuracyLevel;
    const levelLabel = { good: "GOOD", normal: "NORMAL", bad: "BAD" };
    const levelColor = { good: 0x00ff88, normal: 0xffffff, bad: 0xff4444 };
    accuracyText.text = `Accuracy: ${levelLabel[level]}`;
    accuracyText.style.fill = levelColor[level];

    zoneText.text = `Zone: ${activeZone.name} | Mode: ${activeZone.rules.combatMode.toUpperCase()}`;
    zoneText.style.fill = themeState.hudColor;

    // Draw boost timer bar
    boostBar.clear();
    if (ship.accuracyBoostTimer > 0) {
      const frac = ship.accuracyBoostTimer / BOOST_DURATION;
      boostBar.roundRect(0, 0, 120 * frac, 5, 2);
      boostBar.fill(0x00ff88);
    }
  });

  return app;
}

// Start the game
startGame();
