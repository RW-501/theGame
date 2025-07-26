

// Map state and data
import {
  TILE_SIZE, MAP_SIZE, zoneInfo, mapData,
  loadMapFromFirebase, setDefaultMapData, loadTileDataAndRender,
  loadTileData, getTileDataAt, playerState, otherPlayerSprites
} from 'https://rw-501.github.io/theGame/game/js/renderMap.js';

// Owned properties UI
import {
  openOwnedModal, refreshOwnedTiles, highlightTile, centerCameraOnTile,
  openTileDetails, renderOwnedList
} from 'https://rw-501.github.io/theGame/game/js/renderOwnedProperty.js';

const tileSpriteMap = new Map(); // Similar to otherPlayerSprites


export function renderAllOwnedTiles(scene) {
  for (const [tileId, sprite] of tileSpriteMap.entries()) {
    if (!tileDataMap.has(tileId)) {
      console.log(`❌ Removing old tile sprite: ${tileId}`);
      sprite.destroy();
      tileSpriteMap.delete(tileId);
    }
  }

  for (const [tileId, tile] of tileDataMap.entries()) {
    const { x, y, icon, level, ownerName, color, label, ownerID, forSale, type } = tile;

    if (x == null || y == null || !ownerID || type == 'home') continue;

    const spriteKey = `${x}_${y}`;

    if (tileSpriteMap.has(spriteKey)) {
      const existing = tileSpriteMap.get(spriteKey);
      existing.setPosition(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
      continue;
    }

    const container = scene.add.container(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2
    );

    const border = scene.add.circle(0, 0, TILE_SIZE * 0.4, color || 0x00ff00, 0.2)
      .setStrokeStyle(2, color || 0x00ff00)
      .setDepth(0);

    const iconText = scene.add.text(0, -5, icon || "🏠", {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const nameText = scene.add.text(0, TILE_SIZE * 0.25, ownerName || "Owner", {
      fontSize: '10px',
      color: '#cccccc'
    }).setOrigin(0.5);

    container.add([border, iconText, nameText]);

    // 🟨 For Sale sign
    if (forSale === true) {
      const forSaleText = scene.add.text(TILE_SIZE * 0.25, -TILE_SIZE * 0.25, "💲", {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffcc00'
      }).setOrigin(0.5);
      container.add(forSaleText);
    }

    tileSpriteMap.set(spriteKey, container);
  }

  console.log("✅ Tile Render Complete. Tiles drawn:", tileSpriteMap.size);
}


export function getOwnedTiles(ownerId) {
  const owned = [];

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = mapData[y][x];
      if (tile?.ownerId === ownerId) {
        owned.push({ x, y, ...tile });
      }
    }
  }

  return owned;
}
