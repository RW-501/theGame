// playerLayer.js




// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';

   import {
  initPlayerRealtimeSync, initializeMap,  
   setupMapInteraction, setupMapMovement, allUsersMap
} from 'https://rw-501.github.io/theGame/game/js/interactions.js';

// Map state and data
   import {      TILE_SIZE,
  MAP_SIZE,
  zoneInfo,
  mapData,
  loadMapFromFirebase,
  setDefaultMapData,
  loadTileDataAndRender,
  loadTileData,
  playerState,
  otherPlayerSprites,
  getTileDataAt, fromIsometric, toIsometric  } from 'https://rw-501.github.io/theGame/game/js/map.js';


const levelToMesh = {
  1: "apartment_Lv_1",
  2: "apartment_Lv_2",
  3: "apartment_Lv_3",
  4: "apartment_Lv_4",
  5: "house_Lv_1",
  6: "house_Lv_2",
  7: "house_Lv_3",
  8: "house_Lv_4",
  9: "townhouse_Lv_1",
  10: "townhouse_Lv_2",
  11: "townhouse_Lv_3",
  12: "townhouse_Lv_4",
  13: "bigHouse_Lv_1",
  14: "bigHouse_Lv_2",
  15: "bigHouse_Lv_3",
  16: "bigHouse_Lv_4",
};

export function buildPlayerLayer(scene)  {



    
  const playerLayer = new BABYLON.TransformNode("playerLayer", scene);

  for (const [playerId, pos] of playerState.entries()) {
    if (!pos || pos.x === undefined || pos.y === undefined) continue;

    const isoX = pos.x * TILE_SIZE;
    const isoY = 0; // flat terrain for now
    const isoZ = pos.y * TILE_SIZE;

    const otherPlayerData = allUsersMap.get(playerId);
    const level = otherPlayerData?.level || 1;
    const name = otherPlayerData?.playerName || "Player";

    const meshId = levelToMesh[level] || "apartment_Lv_1";

    // Placeholder: Use Babylon Box or Plane now, swap for real imported mesh later
    const building = BABYLON.MeshBuilder.CreateBox(meshId, {
      width: TILE_SIZE * 0.8,
      height: TILE_SIZE * 0.5,
      depth: TILE_SIZE * 0.8
    }, scene);

    building.position = new BABYLON.Vector3(isoX, isoY + TILE_SIZE * 0.25, isoZ);
    building.parent = playerLayer;

    // Material placeholder
    const mat = new BABYLON.StandardMaterial(`${meshId}_mat`, scene);
    mat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.8); // light blue-ish
    building.material = mat;

    // Label (TextPlane)
    const labelPlane = BABYLON.MeshBuilder.CreatePlane(`label_${playerId}`, {
      width: 10,
      height: 2
    }, scene);

    labelPlane.position = new BABYLON.Vector3(isoX, isoY + TILE_SIZE * 0.6, isoZ);
    labelPlane.parent = playerLayer;

    const labelMat = new BABYLON.StandardMaterial(`labelMat_${playerId}`, scene);
    const dynamicTexture = new BABYLON.DynamicTexture(`labelTexture_${playerId}`, { width: 512, height: 256 }, scene);
    dynamicTexture.drawText(name, null, 140, "bold 60px Arial", "white", "transparent", true);

    labelMat.diffuseTexture = dynamicTexture;
    labelMat.emissiveColor = new BABYLON.Color3.White();
    labelMat.backFaceCulling = false;

    labelPlane.material = labelMat;
    labelPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    // Center camera on local player
    if (playerId === playerData.playerUid) {

    }
  }

  return playerLayer;
}
