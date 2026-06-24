export const ZONES = {
  SAFE: "safe",
  PVE: "pve",
  PVP: "pvp"
};

const ZONE_DEFINITIONS = [
  {
    id: ZONES.SAFE,
    label: "SAFE",
    color: 0x6fd3ff,
    maxDistance: 520,
    visuals: {
      bgTint: 0x7ec8ff,
      bg1Alpha: 1,
      bg2Alpha: 0.55,
      nebulaAlpha: 1,
      overlayColor: 0x6fd3ff,
      overlayAlpha: 0.08
    }
  },
  {
    id: ZONES.PVE,
    label: "PVE",
    color: 0x93ff6f,
    maxDistance: 1800,
    visuals: {
      bgTint: 0x6ea4ff,
      bg1Alpha: 0.88,
      bg2Alpha: 0.42,
      nebulaAlpha: 0.86,
      overlayColor: 0x7effb9,
      overlayAlpha: 0.06
    }
  },
  {
    id: ZONES.PVP,
    label: "PVP",
    color: 0xff7f7f,
    maxDistance: Number.POSITIVE_INFINITY,
    visuals: {
      bgTint: 0x38102f,
      bg1Alpha: 0.78,
      bg2Alpha: 0.28,
      nebulaAlpha: 0.64,
      overlayColor: 0x6d1020,
      overlayAlpha: 0.14
    }
  }
];

const ZONE_RADII = {
  safe: ZONE_DEFINITIONS[0].maxDistance,
  pve: ZONE_DEFINITIONS[1].maxDistance
};

const DEFAULT_TRANSITION_WIDTH = 260;

function getDistance(x, y) {
  return Math.hypot(x, y);
}

function getZoneDefinition(zone) {
  return ZONE_DEFINITIONS.find((entry) => entry.id === zone) ?? ZONE_DEFINITIONS[ZONE_DEFINITIONS.length - 1];
}

function getZoneByDistance(distance) {
  return ZONE_DEFINITIONS.find((zone) => distance <= zone.maxDistance) ?? ZONE_DEFINITIONS[ZONE_DEFINITIONS.length - 1];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothStep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function blendHexColor(colorA, colorB, t) {
  const r1 = (colorA >> 16) & 0xff;
  const g1 = (colorA >> 8) & 0xff;
  const b1 = colorA & 0xff;
  const r2 = (colorB >> 16) & 0xff;
  const g2 = (colorB >> 8) & 0xff;
  const b2 = colorB & 0xff;

  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));

  return (r << 16) | (g << 8) | b;
}

function getTransitionBlend(distance, transitionWidth = DEFAULT_TRANSITION_WIDTH) {
  if (transitionWidth <= 0) return null;

  for (let i = 0; i < ZONE_DEFINITIONS.length - 1; i++) {
    const current = ZONE_DEFINITIONS[i];
    const next = ZONE_DEFINITIONS[i + 1];
    if (!Number.isFinite(current.maxDistance)) continue;

    const start = current.maxDistance - transitionWidth / 2;
    const end = current.maxDistance + transitionWidth / 2;
    if (distance >= start && distance <= end) {
      const blend = smoothStep((distance - start) / transitionWidth);
      return { from: current, to: next, amount: blend };
    }
  }

  return null;
}

export function getZoneAtPosition(x, y) {
  return getZoneByDistance(getDistance(x, y)).id;
}

export function isMiningZone(zone) {
  return zone === ZONES.PVE || zone === ZONES.PVP;
}

export function getZoneLabel(zone) {
  return getZoneDefinition(zone).label;
}

export function getZoneColor(zone) {
  return getZoneDefinition(zone).color;
}

export function getZoneRadii() {
  return { ...ZONE_RADII };
}

export function getZoneVisualState(x, y, transitionWidth = DEFAULT_TRANSITION_WIDTH) {
  const distance = getDistance(x, y);
  const zone = getZoneByDistance(distance);
  const blend = getTransitionBlend(distance, transitionWidth);

  if (!blend) {
    return {
      zone: zone.id,
      ...zone.visuals
    };
  }

  const t = blend.amount;
  return {
    zone: t < 0.5 ? blend.from.id : blend.to.id,
    bgTint: blendHexColor(blend.from.visuals.bgTint, blend.to.visuals.bgTint, t),
    bg1Alpha: lerp(blend.from.visuals.bg1Alpha, blend.to.visuals.bg1Alpha, t),
    bg2Alpha: lerp(blend.from.visuals.bg2Alpha, blend.to.visuals.bg2Alpha, t),
    nebulaAlpha: lerp(blend.from.visuals.nebulaAlpha, blend.to.visuals.nebulaAlpha, t),
    overlayColor: blendHexColor(blend.from.visuals.overlayColor, blend.to.visuals.overlayColor, t),
    overlayAlpha: lerp(blend.from.visuals.overlayAlpha, blend.to.visuals.overlayAlpha, t)
  };
}
