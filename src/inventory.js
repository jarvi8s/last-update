import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { RESOURCE_TYPES, createResourceStore, addResource } from "./resources.js";

const ACTION_OPTIONS = ["Kullan", "Yakıta Dönüştür", "At", "Ticaret İçin İşaretle"];

export function createInventorySystem(screenWidth, screenHeight) {
  const container = new Container();
  container.visible = false;

  const state = {
    isOpen: false,
    selectedIndex: 0,
    actionMenuOpen: false,
    resources: createResourceStore()
  };

  const panel = new Graphics();
  panel.roundRect(0, 0, 340, 240, 12);
  panel.fill({ color: 0x050814, alpha: 0.92 });
  panel.stroke({ color: 0x66aaff, width: 2 });
  panel.x = (screenWidth - 340) / 2;
  panel.y = (screenHeight - 240) / 2;
  container.addChild(panel);

  const title = new Text({
    text: "Inventory (I)",
    style: new TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: "bold" })
  });
  title.x = panel.x + 16;
  title.y = panel.y + 14;
  container.addChild(title);

  const hint = new Text({
    text: "↑/↓ seçim  |  Space etkileşim",
    style: new TextStyle({ fill: 0xa8b2cc, fontSize: 12 })
  });
  hint.x = panel.x + 16;
  hint.y = panel.y + 42;
  container.addChild(hint);

  const rowTexts = [];
  const resourceList = Object.values(RESOURCE_TYPES);
  resourceList.forEach((resource, index) => {
    const row = new Text({
      text: "",
      style: new TextStyle({ fill: 0xffffff, fontSize: 18 })
    });
    row.x = panel.x + 20;
    row.y = panel.y + 72 + index * 34;
    rowTexts.push(row);
    container.addChild(row);
  });

  const menuText = new Text({
    text: "",
    style: new TextStyle({ fill: 0x8de7ff, fontSize: 13 })
  });
  menuText.x = panel.x + 20;
  menuText.y = panel.y + 72 + rowTexts.length * 34 + 8;
  container.addChild(menuText);

  function updateUI() {
    rowTexts.forEach((row, index) => {
      const resource = resourceList[index];
      const amount = state.resources[resource.id] ?? 0;
      const isSelected = state.selectedIndex === index;
      row.text = `${isSelected ? "▶ " : "  "}${resource.icon} ${resource.name}   x${amount}`;
      row.style.fill = isSelected ? 0x9de3ff : 0xffffff;
    });
    menuText.text = state.actionMenuOpen ? ACTION_OPTIONS.join("  |  ") : "";
  }

  function toggle() {
    state.isOpen = !state.isOpen;
    container.visible = state.isOpen;
    if (!state.isOpen) {
      state.actionMenuOpen = false;
    }
    updateUI();
  }

  function moveSelection(delta) {
    if (!state.isOpen || rowTexts.length === 0) return;
    state.selectedIndex = (state.selectedIndex + delta + rowTexts.length) % rowTexts.length;
    state.actionMenuOpen = false;
    updateUI();
  }

  function triggerActionMenu() {
    if (!state.isOpen) return;
    state.actionMenuOpen = !state.actionMenuOpen;
    updateUI();
  }

  function add(resourceId, amount = 1) {
    addResource(state.resources, resourceId, amount);
    updateUI();
  }

  updateUI();

  return {
    container,
    state,
    toggle,
    moveSelection,
    triggerActionMenu,
    add
  };
}
