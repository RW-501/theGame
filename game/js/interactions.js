
// Firebase core & Firestore
import { auth, db, onAuthStateChanged, signInAnonymously } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";
import {
  getFirestore, query, where, limit, addDoc,
  arrayRemove, increment, serverTimestamp,
  arrayUnion, collection, doc, getDoc, getDocs,
  onSnapshot, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Notifications and Toast UI
import { initLiveNotifications, sendNotification } from 'https://rw-501.github.io/theGame/game/includes/notifications.js';
import { showToast, dismissToast, showMessageAndFadeBtn } from 'https://rw-501.github.io/theGame/game/includes/showToast.js';


// Map drawing and interactions
import { drawMap } from 'https://rw-501.github.io/theGame/game/js/drawMap.js';

// Helpers and utilities
import {
  createButton, createProgressBar, showCustomModal, showMessageModal, animateNumber,
  launchConfetti, sleep, getRandomEmptyTile, isAdjacent, formatCurrency,
  calculateTotalTaxes, calculateTotalIncome, calculateTotalPropertyValue, movePlayerSmoothly
} from 'https://rw-501.github.io/theGame/game/js/helpers.js';



// Players and profile UI
import { renderAllPlayers } from 'https://rw-501.github.io/theGame/game/js/renderPlayers.js';

// Game rules and player progression
import {
  rules, checkRuleLimit, refillTradesIfNeeded, tryTrade, getPlayerTitle,
  updatePlayerName, savePlayerData, updateAndPersist, tryLevelUp, processHourlyIncomeAndTax
} from 'https://rw-501.github.io/theGame/game/js/rulesAndRegulations.js';

// Tile actions and UI updates
import { showTileActionModal } from 'https://rw-501.github.io/theGame/game/js/showTileAction.js';
import { updateStatsUI } from 'https://rw-501.github.io/theGame/game/js/updateStatsUI.js';

// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';


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


let selectedTile = null;
let tileHighlightRect = null;
let game;
let scene;
let cam;
let newZoom;
let cursors; 


let graphics;

const allUsersMap = new Map();


let playerX;
let playerY;

let isPointerDown = false;
let pointerDownTime = 0;
let initialPointer = null;


function initPlayerRealtimeSync(scene, playerData) {
  if (!playerData?.playerUid) {
    console.error("❌ playerData.playerUid is missing");
    return;
  }

  console.log("✅ Realtime sync initialized for playerUid:", playerData.playerUid);

  const playerRef = doc(db, "players", playerData.playerUid);
  onSnapshot(playerRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const pos = data.location;

if (pos && (pos.x !== playerX || pos.y !== playerY)) {
  playerX = pos.x;
  playerY = pos.y;

  const isoPos = toIsometric(playerX, playerY);
  movePlayerSmoothly(scene, isoPos.x, isoPos.y);
}


      playerData = { ...playerData, ...data };
      updateStatsUI(data);
    }
  });

  const playersRef = collection(db, "players");
  onSnapshot(playersRef, (querySnapshot) => {
    console.log("🔥 Received Firestore snapshot for all players");

    playerState.clear();
    allUsersMap.clear();

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      allUsersMap.set(id, data);

      if (Array.isArray(data.location) && data.location.length === 2) {
        playerState.set(id, {
          playerUid: data.playerUid,
          x: data.location[0],
          y: data.location[1],
          bank: data.bank ?? 0,
          crypto: data.crypto ?? 0,
          level: data.level ?? 0,
          xp: data.xp ?? 0,
          health: data.health ?? 100,
          techStrength: data.techStrength ?? 0,
          securityStrength: data.securityStrength ?? 0,
          ...data
        });

        if (playerData.playerUid === data.playerUid) {
          updateStatsUI(data);
        }

        renderAllPlayers(scene);
      }
    });
  });
}

async function initializeMap(scene) {
  graphics = scene.add.graphics();
  cam = scene.cameras.main;

  await loadMapFromFirebase();
  drawMap(scene);

  const mapWidth = MAP_SIZE * TILE_SIZE;
  const mapHeight = MAP_SIZE * TILE_SIZE * 2;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const zoomX = screenWidth / mapWidth;
  const zoomY = screenHeight / mapHeight;
  const zoom = Math.min(zoomX, zoomY, 3);

  cam.setBounds(0, 0, mapWidth, mapHeight);
  cam.setZoom(zoom);

  const centerIso = toIsometric(MAP_SIZE / 2, MAP_SIZE / 2);
  cam.centerOn(centerIso.x, centerIso.y);
}


function clearTileSelection() {
  selectedTile = null;
  if (tileHighlightRect) {
    tileHighlightRect.destroy();
    tileHighlightRect = null;
  }
  document.getElementById("statsBox").style.display = "block";
}


function returnToPlayerLocation(scene) {
  const cam = scene.cameras.main;
  const iso = toIsometric(playerX, playerY);
  cam.pan(iso.x, iso.y, 500, 'Sine.easeInOut');
}


function centerCameraOnPlayer() {
  cam.setZoom(newZoom);
  const iso = toIsometric(playerX, playerY);
  cam.centerOn(iso.x, iso.y);
}


function setupMapInteraction(scene) {
  cursors = scene.input.keyboard.createCursorKeys();

  scene.input.keyboard.on("keydown", event => {
    if (isMoving) return;
    switch (event.code) {
      case "ArrowLeft": tryMove(-1, 0, scene); break;
      case "ArrowRight": tryMove(1, 0, scene); break;
      case "ArrowUp": tryMove(0, -1, scene); break;
      case "ArrowDown": tryMove(0, 1, scene); break;
    }
  });

  clearTileSelection();

  // Handle tap vs drag
  scene.input.on("pointerdown", pointer => {
    isPointerDown = true;
    pointerDownTime = Date.now();
    initialPointer = { x: pointer.x, y: pointer.y };
  });

  scene.input.on("pointerup", pointer => {
    if (!isPointerDown) return;
    isPointerDown = false;

    const timeHeld = Date.now() - pointerDownTime;
    const movedDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, initialPointer.x, initialPointer.y);
    const maxTapTime = 300;
    const maxMoveDistance = 10;

    if (timeHeld <= maxTapTime && movedDistance <= maxMoveDistance) {
      const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const isoClicked = fromIsometric(worldPoint.x, worldPoint.y);
      const clickedX = Math.floor(isoClicked.x);
      const clickedY = Math.floor(isoClicked.y);

      if (clickedX < 0 || clickedX >= MAP_SIZE || clickedY < 0 || clickedY >= MAP_SIZE) return;

      document.getElementById("statsBox").style.display = "block";

      let otherPlayerId = null;
      const entries = playerState instanceof Map ? Array.from(playerState.entries()) : Object.entries(playerState);
      for (const [pid, pos] of entries) {
        if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") continue;
        if (pid !== playerData.playerUid && Number(pos.x) === clickedX && Number(pos.y) === clickedY) {
          otherPlayerId = pid;
          break;
        }
      }

      const tileType = mapData[clickedY]?.[clickedX] || "empty";
      showTileActionModal(clickedX, clickedY, tileType, otherPlayerId);
    }
  });

  // Tooltip on hover
  scene.input.on("pointermove", pointer => {
    cam = scene.cameras.main;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const iso = fromIsometric(worldPoint.x, worldPoint.y);
    const x = Math.floor(iso.x);
    const y = Math.floor(iso.y);

    if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
      const zoneType = mapData[y]?.[x] || "empty";
      const info = zoneInfo[zoneType] || zoneInfo.empty;

      tileTooltip.style.left = pointer.event.clientX + 15 + "px";
      tileTooltip.style.top = pointer.event.clientY + 15 + "px";
      tileTooltip.innerHTML = `${info.icon} <strong>${info.label}</strong> (${x},${y})`;
      tileTooltip.style.display = "block";
    } else {
      tileTooltip.style.display = "none";
    }
  });

  scene.input.on("pointerout", () => {
    tileTooltip.style.display = "none";
  });
}


function setupMapMovement(scene) {
  const cam = scene.cameras.main;

  // Drag to pan (desktop + mobile)
  scene.input.on("pointermove", pointer => {
    if (pointer.isDown && isPointerDown) {
      cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
      cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
      clearTileSelection();
    }
  });

  // Mouse wheel zoom (desktop)
  scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
    newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.5, 2);
    cam.setZoom(newZoom);
    clearTileSelection();
  });

  // Mobile pinch-zoom support
scene.input.addPointer(2); // Allow up to 2 simultaneous pointers
let lastDistance = 0;

scene.input.on("pointermove", () => {
  const activePointers = scene.input.pointers.filter(p => p && p.isDown);

  if (activePointers.length >= 2) {
    const pointer1 = activePointers[0];
    const pointer2 = activePointers[1];

    if (
      typeof pointer1.worldX === 'number' &&
      typeof pointer2.worldX === 'number'
    ) {
      const dist = Phaser.Math.Distance.Between(
        pointer1.worldX, pointer1.worldY,
        pointer2.worldX, pointer2.worldY
      );

      if (lastDistance > 0) {
        const zoomFactor = dist / lastDistance;
        cam.setZoom(Phaser.Math.Clamp(cam.zoom * zoomFactor, 0.5, 2));
      }

      lastDistance = dist;
    }
  } else {
    lastDistance = 0;
  }
});


}


export {
  initPlayerRealtimeSync,
  initializeMap,
  clearTileSelection,
  returnToPlayerLocation,
  centerCameraOnPlayer,
  setupMapInteraction,
  setupMapMovement,
  allUsersMap
};
