export const ZONES = {
  SAFE: "safe",
  PVE: "pve",
  PVP: "pvp"
};

const ZONE_RADII = {
  safe: 520,
  pve: 1800
};

export function getZoneAtPosition(x, y) {
  const distance = Math.hypot(x, y);
  if (distance <= ZONE_RADII.safe) return ZONES.SAFE;
  if (distance <= ZONE_RADII.pve) return ZONES.PVE;
  return ZONES.PVP;
}

export function isMiningZone(zone) {
  return zone === ZONES.PVE || zone === ZONES.PVP;
}

export function getZoneLabel(zone) {
  if (zone === ZONES.SAFE) return "SAFE";
  if (zone === ZONES.PVE) return "PVE";
  return "PVP";
}

export function getZoneColor(zone) {
  if (zone === ZONES.SAFE) return 0x6fd3ff;
  if (zone === ZONES.PVE) return 0x93ff6f;
  return 0xff7f7f;
}

export function getZoneRadii() {
  return { ...ZONE_RADII };
}
