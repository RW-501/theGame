// map.js

import {   TILE_SIZE,
  MAP_SIZE,
  zoneInfo,
  mapData,
  loadMapFromFirebase,
  setDefaultMapData,
  loadTileDataAndRender,
  loadTileData,
  playerState,
  otherPlayerSprites  } from 'https://rw-501.github.io/theGame/game/js/renderMap.js'; 




export async function getTileDataAt(x, y) {
  try {
    // Get the tile type from mapData
    const tileType = mapData[y]?.[x] || "empty";

    // Get static zone info (default fallback data)
    const defaultInfo = zoneInfo[tileType] || zoneInfo.empty;

    // Get live data from Firestore (tiles collection)
    const tileRef = doc(db, "tiles", `${x}_${y}`);
    const tileSnap = await getDoc(tileRef);

    // If Firestore has data, merge it with static info
    if (tileSnap.exists()) {
      const firestoreData = tileSnap.data();
      return { ...defaultInfo, ...firestoreData, x, y };
    } else {
      // Use default zone info if no Firestore document exists
      return { ...defaultInfo, x, y };
    }

  } catch (error) {
    console.error("Error fetching tile data:", error);
    return { ...zoneInfo.empty, x, y };
  }
}


export  {  
     TILE_SIZE,
  MAP_SIZE,
  zoneInfo,
  mapData,
  loadMapFromFirebase,
  setDefaultMapData,
  loadTileDataAndRender,
  loadTileData,
  playerState,
  otherPlayerSprites }; 
 

  /*
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
  getTileDataAt  } from 'https://rw-501.github.io/theGame/game/js/map.js';


  */