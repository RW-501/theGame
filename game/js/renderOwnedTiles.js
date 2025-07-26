// Map state and data
import {
  TILE_SIZE, MAP_SIZE, zoneInfo, mapData, tileDataMap,
  loadMapFromFirebase, setDefaultMapData, loadTileDataAndRender,
  loadTileData, getTileDataAt, playerState, otherPlayerSprites, toIsometric
} from 'https://rw-501.github.io/theGame/game/js/renderMap.js';

// Owned properties UI
import {
  openOwnedModal, refreshOwnedTiles, highlightTile, centerCameraOnTile,
  openTileDetails, renderOwnedList
} from 'https://rw-501.github.io/theGame/game/js/renderOwnedProperty.js';

const tileSpriteMap = new Map(); // Track sprites by position key


export function renderAllOwnedTiles(scene) {
  // Clean up sprites for tiles no longer present in data
  for (const [spriteKey, sprite] of tileSpriteMap.entries()) {
    if (!tileDataMap.has(spriteKey)) {
      console.log(`❌ Removing old tile sprite: ${spriteKey}`);
      sprite.destroy();
      tileSpriteMap.delete(spriteKey);
    }
  }

  // Loop over all tiles in tileDataMap
  for (const [tileId, tile] of tileDataMap.entries()) {
    const { x, y, icon, level, ownerName, color, label, ownerID, forSale, type, subType } = tile;

    // Skip tiles without valid position, owner, or if type is 'home'
if (x == null || y == null || !ownerID || type === 'home') {
  console.warn("Skipping invalid tile:", tile);
  continue;
}

    const spriteKey = `${x}_${y}`;

    // If sprite exists, update its position to the current isometric coords and continue
    if (tileSpriteMap.has(spriteKey)) {
      const existing = tileSpriteMap.get(spriteKey);
      const isoPos = toIsometric(x, y);
      existing.setPosition(isoPos.x, isoPos.y);
      continue;
    }

    // Map tile types to image keys
    const typeToImageKey = {
      // Land types
      'billboard': "land_type-billboard",
      'cellTower': "land_type-cellTower",
      'crop': "land_type-crop",
      'dirt': "land_type-dirt",
      'grass': "land_type-grass",
      'parkingLot': "land_type-parkingLot",
      'trees': "land_type-trees",

      // Building levels
      1: "building_Lv_1",
      2: "building_Lv_2",
      3: "building_Lv_3",
      4: "building_Lv_4"
    };

    // Convert tile grid position to isometric position
    const isoPos = toIsometric(x, y);

    // Create container at isometric position
    const container = scene.add.container(isoPos.x, isoPos.y);

    // Add border circle for visual effect (color with alpha)
    const border = scene.add.circle(0, 0, TILE_SIZE * 0.4, color || 0x00ff00, 0.2)
      .setStrokeStyle(2, color || 0x00ff00)
      .setDepth(0);

    // Determine image key depending on type
    let imageKey;

    if (type === "land") {
      imageKey = typeToImageKey[subType] || "land_type-dirt";
    } else if (type === 'company') {
      imageKey = typeToImageKey[level] || "building_Lv_1";
    } else {
      imageKey = "land_type-dirt"; // fallback
    }

    // Add the main image, origin bottom center for isometric alignment
    const playerLandImage = scene.add.image(0, TILE_SIZE * -0.15, imageKey)
      .setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8)
      .setOrigin(0.5, 1);

    // Owner name text, slightly below the tile
    const nameText = scene.add.text(0, TILE_SIZE * 0.3, ownerName || "Owner", {
      fontSize: '10px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5);

    // Add objects to container
    container.add([border, playerLandImage, nameText]);

    // Show "for sale" icon if applicable, top right corner of tile
    if (forSale === true) {
      const forSaleText = scene.add.text(TILE_SIZE * 0.25, -TILE_SIZE * 0.25, "💲", {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffcc00'
      }).setOrigin(0.5);
      container.add(forSaleText);
    }

    // Store container for reuse
scene.tileLayer.add(container);
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
