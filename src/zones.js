export const ZONES = [
  {
    id: "safe",
    name: "SAFE ZONE",
    maxRadius: 520,
    rules: {
      canShoot: false,
      combatMode: "safe",
      allowNpc: false,
      allowAsteroids: false,
      allowResources: false,
    },
    theme: {
      overlayColor: 0x2e72c6,
      overlayAlpha: 0.18,
      bg1Color: 0x06152d,
      bg1Alpha: 1,
      bg2Color: 0x123667,
      bg2Alpha: 0.62,
      nebulaAlpha: 1,
      twinkleAlpha: 1,
      starfieldAlpha: 1,
      minimapBg: 0x132742,
      minimapBorder: 0x67b9ff,
      hudColor: 0x82ceff,
    },
  },
  {
    id: "pve",
    name: "PVE ZONE",
    maxRadius: 3000,
    rules: {
      canShoot: true,
      combatMode: "pve",
      allowNpc: true,
      allowAsteroids: true,
      allowResources: true,
    },
    theme: {
      overlayColor: 0x2f6e3e,
      overlayAlpha: 0.14,
      bg1Color: 0x091d1e,
      bg1Alpha: 0.92,
      bg2Color: 0x1c4f35,
      bg2Alpha: 0.52,
      nebulaAlpha: 0.82,
      twinkleAlpha: 0.9,
      starfieldAlpha: 0.92,
      minimapBg: 0x15271f,
      minimapBorder: 0x6cdc88,
      hudColor: 0x95f1a8,
    },
  },
  {
    id: "pvp",
    name: "PVP ZONE",
    maxRadius: Number.POSITIVE_INFINITY,
    rules: {
      canShoot: true,
      combatMode: "pvp",
      allowNpc: false,
      allowAsteroids: false,
      allowResources: false,
    },
    theme: {
      overlayColor: 0x030303,
      overlayAlpha: 0.5,
      bg1Color: 0x010106,
      bg1Alpha: 0.7,
      bg2Color: 0x08080f,
      bg2Alpha: 0.36,
      nebulaAlpha: 0.4,
      twinkleAlpha: 0.62,
      starfieldAlpha: 0.72,
      minimapBg: 0x101013,
      minimapBorder: 0x70707a,
      hudColor: 0xc3c3cf,
    },
  },
];

export function getZoneByDistance(distance) {
  for (const zone of ZONES) {
    if (distance <= zone.maxRadius) {
      return zone;
    }
  }
  return ZONES[ZONES.length - 1];
}
