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
  otherPlayerSprites, tileDataMap  } from 'https://rw-501.github.io/theGame/game/js/renderMap.js'; 

// Firebase core & Firestore
import { auth, db, onAuthStateChanged, signInAnonymously } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";
import {
  getFirestore, query, where, limit, addDoc,
  arrayRemove, increment, serverTimestamp,
  arrayUnion, collection, doc, getDoc, getDocs,
  onSnapshot, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


function fromIsometric(isoX, isoY) {
  const x = Math.floor((isoY / (TILE_SIZE / 4) + isoX / (TILE_SIZE / 2)) / 2);
  const y = Math.floor((isoY / (TILE_SIZE / 4) - isoX / (TILE_SIZE / 2)) / 2);
  return { x, y };
}


function toIsometric(x, y) {
  const isoX = (x - y) * (TILE_SIZE / 2);
  const isoY = (x + y) * (TILE_SIZE / 4);
  return { x: isoX, y: isoY };
}

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
  otherPlayerSprites, tileDataMap,toIsometric, fromIsometric }; 
 

  /*
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


  */