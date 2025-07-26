

// If you're using shared game state or constants from other modules:
import { TILE_SIZE, MAP_SIZE, mapData, zoneInfo, toIsometric } from 'https://rw-501.github.io/theGame/game/js/map.js';




function drawMap(scene) {
  const graphics = scene.add.graphics();
  graphics.clear();

  const storedData = JSON.parse(localStorage.getItem("theGame_currentPlayerData"));
  const playerX = storedData?.location?.[0];
  const playerY = storedData?.location?.[1];

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const zoneType = mapData[y][x] || "empty";
      const info = zoneInfo[zoneType] || zoneInfo.empty;

      const { x: isoX, y: isoY } = toIsometric(x, y);

      // Draw base tile background
      graphics.fillStyle(info.color, 1);
      graphics.fillRect(isoX, isoY, TILE_SIZE, TILE_SIZE / 2);

      // Draw base image tile
      const tileImage = (zoneType !== "empty") ? "concrete" : "dirt";
      scene.add.image(isoX, isoY, tileImage)
        .setDisplaySize(TILE_SIZE, TILE_SIZE)
        .setOrigin(0.5);

      // Skip rendering special overlays for player and "home"
      if (x === playerX && y === playerY) continue;
      if (info.x === "home") continue;

      // Zone-specific overlays (commercial/industrial)
      if (["zone2", "zone4", "zone6"].includes(zoneType)) {
        scene.add.image(isoX, isoY, "commercial")
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setOrigin(0.5);
      }

      if (["zone3", "zone5"].includes(zoneType)) {
        scene.add.image(isoX, isoY, "industrial")
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setOrigin(0.5);
      }

      // Generic image for type
      if (info.imageKey) {
        scene.add.image(isoX, isoY, info.imageKey)
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setOrigin(0.5);
      }

      // Icon overlay (if it has one)
      if (info.icon) {
        scene.add.text(isoX, isoY, info.icon, {
          font: `${TILE_SIZE * 0.3}px Arial`,
          align: 'center',
          color: "#000"
        }).setOrigin(0.5);
      }
    }
  }
}


export { drawMap };
