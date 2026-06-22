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

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

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

  // Create world
  const world = new Container();
  app.stage.addChild(world);

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

    // Update asteroids
    updateAsteroids(asteroids);

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
    checkBulletCollisions(bullets, enemy, world);

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
    checkPickupCollection(pickups, ship, world, () => {
      ship.accuracyBoost = 1;
      ship.accuracyBoostTimer = BOOST_DURATION;
    });

    // Pulse pickups
    updatePickupPulse(pickups);

    // Update minimap
    updateMinimap(minimap, ship, enemy, bullets, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Calculate current speed
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);

    // Update info display
    infoText.text = `Speed: ${speed.toFixed(1)} | Enemy HP: ${Math.max(0, enemy.health)} | Bullet: ${ship.bulletType === "light" ? "1-Light" : "2-Heavy"}`;

    // Update accuracy HUD
    const level = ship.accuracyLevel;
    const levelLabel = { good: "GOOD", normal: "NORMAL", bad: "BAD" };
    const levelColor = { good: 0x00ff88, normal: 0xffffff, bad: 0xff4444 };
    accuracyText.text = `Accuracy: ${levelLabel[level]}`;
    accuracyText.style.fill = levelColor[level];

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
