export const RESOURCE_TYPES = {
  red_ore: {
    id: "red_ore",
    name: "Red Ore",
    icon: "🔴",
    color: 0xff4d4d
  },
  yellow_ore: {
    id: "yellow_ore",
    name: "Yellow Ore",
    icon: "🟡",
    color: 0xffd84d
  }
};

export function createResourceStore() {
  return Object.keys(RESOURCE_TYPES).reduce((store, key) => {
    store[key] = 0;
    return store;
  }, {});
}

export function addResource(store, resourceId, amount = 1) {
  if (!(resourceId in store)) {
    store[resourceId] = 0;
  }
  store[resourceId] += amount;
  return store[resourceId];
}
