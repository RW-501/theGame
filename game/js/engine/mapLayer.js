// mapLayer.js

export async function buildMapLayer(scene, mapLayer, tileMapData = [], tileAssets = {}, config = {}, onTileClick) {
  const tileSize = 2;
  const halfTile = tileSize / 2;

  const defaultMat = new BABYLON.StandardMaterial("defaultMat", scene);
  defaultMat.diffuseColor = new BABYLON.Color3(1, 0, 1); // Pink = error

  // Helper: Check if (x, y) falls into any restricted zone
  const getZoneAt = (x, y) => {
    if (!config.restrictedZones) return null;
    return config.restrictedZones.find(zone =>
      x >= zone.x &&
      x < zone.x + zone.width &&
      y >= zone.y &&
      y < zone.y + zone.height
    );
  };

  for (let y = 0; y < tileMapData.length; y++) {
    for (let x = 0; x < tileMapData[y].length; x++) {
      const tileType = tileMapData[y][x] || "grass";
      const zone = getZoneAt(x, y);
      const isBuildable = !zone;

      const tile = BABYLON.MeshBuilder.CreateGround(`tile_${x}_${y}`, {
        width: tileSize,
        height: tileSize,
        subdivisions: 1,
      }, scene);

      tile.position.x = (x - y) * halfTile;
      tile.position.z = (x + y) * halfTile;
      tile.position.y = 0.01;

      tile.material = tileAssets[tileType] || defaultMat;
      tile.parent = mapLayer;

      /*

{
  "gridX": 2,
  "gridY": 4,
  "worldX": 4,
  "worldZ": 6,
  "tileType": "stone",
  "buildable": false,
  "zone": "admin_building"
}


*/
      // 🔍 Attach tile metadata
      tile.metadata = {
        gridX: x,
        gridY: y,
        worldX: tile.position.x,
        worldZ: tile.position.z,
        tileType,
        buildable: isBuildable,
        zone: zone ? zone.name : null
      };
    }
  }

  // 📌 Add click listener (ray picking)
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
      const picked = pointerInfo.pickInfo;
      if (picked?.hit && picked.pickedMesh?.name?.startsWith("tile_")) {
        const tile = picked.pickedMesh;
        const meta = tile.metadata;
        if (onTileClick) {
          onTileClick(tile, meta);
        } else {
          console.log("[Tile Clicked]", meta);
        }
      }
    }
  });

  console.log(`[MapLayer] Built ${tileMapData.length * tileMapData[0].length} tiles`);
}


