
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
import { loadOrCreatePlayer, initGameScene,
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
  getTileDataAt  } from 'https://rw-501.github.io/theGame/game/js/map.js';


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

    console.log("initPlayerRealtimeSync  scene...  ", scene);

  if (!playerData?.playerUid) {
    console.error("❌ playerData.playerUid is missing");
    return;
  }

  console.log("✅ Realtime sync initialized for playerUid:", playerData.playerUid);

  // 🔁 Watch own player document
  const playerRef = doc(db, "players", playerData.playerUid);
  onSnapshot(playerRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();

      // Update position and move player sprite if changed
      const pos = data.location;
      if (pos && (pos.x !== playerX || pos.y !== playerY)) {
        playerX = pos.x;
        playerY = pos.y;
        movePlayerSmoothly(scene, playerX, playerY);
      }

      // Merge new data into playerData
      playerData = {
        ...playerData,
        ...data
      };

      // Update UI
      updateStatsUI(data);
    }
  });

  // 🔁 Watch all players collection
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

        // Optional: Update self again from collection (if desired)
        if (playerData.playerUid === data.playerUid) {
          updateStatsUI(data);
        }

        console.log("🧠 Updated playerState:", Array.from(playerState.entries()));

        renderAllPlayers(scene); // or this, if inside a Scene
      }
    });
  });
}



async function initializeMap(scene) {
  // Assuming graphics and playerSprite are globals or declared elsewhere
  graphics = scene.add.graphics();
   cam = scene.cameras.main;

  // Await loading map data before drawing
  await loadMapFromFirebase();

  // Draw the map based on loaded data
  drawMap(scene);



  const mapWidth = MAP_SIZE * TILE_SIZE;
  const mapHeight = MAP_SIZE * TILE_SIZE;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Calculate zoom to fit entire map inside screen
  const zoomX = screenWidth / mapWidth;
  const zoomY = screenHeight / mapHeight;
  const zoom = Math.min(zoomX, zoomY, 1); // Limit max zoom to 1 (optional)

  // Set camera bounds to map size
  cam.setBounds(0, 0, mapWidth, mapHeight);

  // Set camera zoom to fit map
  cam.setZoom(zoom);

  // Center camera on map
  // This centers by scrollX/Y, not centerOn (better control)
  cam.scrollX = (mapWidth / 2) - (screenWidth / (2 * zoom));
  cam.scrollY = (mapHeight / 2) - (screenHeight / (2 * zoom));

 // updateStatsUI();
}





function clearTileSelection() {
  selectedTile = null;

  if (tileHighlightRect && selectedTile) {
    tileHighlightRect.destroy();
    tileHighlightRect = null;
  }


  document.getElementById("statsBox").style.display = "block";
}


function returnToPlayerLocation(scene) {
  const cam = scene.cameras.main;
  const targetX = playerX * TILE_SIZE + TILE_SIZE / 2;
  const targetY = playerY * TILE_SIZE + TILE_SIZE / 2;

  cam.pan(targetX, targetY, 500, 'Sine.easeInOut');
}


function centerCameraOnPlayer() {
  cam.setZoom(newZoom);

cam.centerOn(playerX * TILE_SIZE + TILE_SIZE / 2, playerY * TILE_SIZE + TILE_SIZE / 2);
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


scene.input.on("pointerdown", pointer => {
  isPointerDown = true;
  pointerDownTime = Date.now();
  initialPointer = { x: pointer.x, y: pointer.y };
});

    let clickedX;
    let clickedY;

scene.input.on("pointerup", pointer => {
  if (!isPointerDown) return;
  isPointerDown = false;
 

    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
     clickedX = Math.floor(worldPoint.x / TILE_SIZE);
     clickedY = Math.floor(worldPoint.y / TILE_SIZE);



/*

// ✅ Modal Pop-up Container (centered in camera view)
const modalWidth = 100;
const modalHeight = 100;
const modalX = scene.cameras.main.centerX;
const modalY = scene.cameras.main.centerY;

// Background rectangle for modal
const modalBg = scene.add.rectangle(0, 0, modalWidth, modalHeight, 0x000000, 0.8)
  .setStrokeStyle(3, 0x00ff00)
  .setOrigin(0.5);

  const graphics = scene.add.graphics();
graphics.fillStyle(0x000000, 0.8);
graphics.lineStyle(3, 0x00ff00);
graphics.fillRoundedRect(0, 0, modalWidth, modalHeight, 12);
graphics.strokeRoundedRect(0, 0, modalWidth, modalHeight, 12);


// Text inside modal
const modalText = scene.add.text(0, -40, "Tile Options", {
  fontSize: '20px',
  color: '#ffffff',
  fontStyle: 'bold',
  align: 'center'
}).setOrigin(0.5);

// Example Button
const buttonBg = scene.add.rectangle(0, 30, 100, 40, 0x00aa00, 1)
  .setStrokeStyle(2, 0xffffff)
  .setInteractive({ useHandCursor: true })
  .on('pointerdown', () => {
    console.log('Button clicked for tile', selectedTile);
    modalContainer.destroy(); // Close modal
  });

const buttonText = scene.add.text(0, 30, 'OK', {
  fontSize: '9px',
  color: '#ffffff',
}).setOrigin(0.5);

// Group all into a container
const modalContainer = scene.add.container(modalX, modalY, [
  modalBg,
  modalText,
  buttonBg,
  buttonText
])
  .setDepth(1000) // Ensure it's on top
  .setAlpha(0) // Start hidden
  .setScale(0.8)
  .setScrollFactor(0) // Stick to screen

// Animate modal in
scene.tweens.add({
  targets: modalContainer,
  alpha: 1,
  scale: 1,
  ease: 'Back.Out',
  duration: 300
});

*/








  // Hide statsBox while moving
  document.getElementById("statsBox").style.display = "none";

  const timeHeld = Date.now() - pointerDownTime;
  const movedDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, initialPointer.x, initialPointer.y);

  const maxTapTime = 300;       // max press time in ms
  const maxMoveDistance = 10;   // max movement in px before cancel

  if (timeHeld <= maxTapTime && movedDistance <= maxMoveDistance) {

    if (clickedX < 0 || clickedX >= MAP_SIZE || clickedY < 0 || clickedY >= MAP_SIZE) return;

let otherPlayerId = null;

const entries = playerState instanceof Map
  ? Array.from(playerState.entries())
  : Object.entries(playerState);
/*
console.log("Entries to check:", entries);
console.log("Clicked position:", clickedX, clickedY);
*/
console.log("Current user:", playerData.playerUid);

for (const [pid, pos] of entries) {
  // Defensive checks
  if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
    console.warn(`Skipping invalid player data for ${pid}:`, pos);
    continue;
  }


  // Compare position and exclude current user
  if (
    pid !== playerData.playerUid &&
    Number(pos.x) === Number(clickedX) &&
    Number(pos.y) === Number(clickedY)
  ) {
    otherPlayerId = pid;
    console.log(`✅ Found other player at this tile: ${otherPlayerId}`);
    break;
  }
}

    console.log(`clicked position: ${otherPlayerId}`);

    if (!isPointerDown) {
      const tileType = mapData[clickedY]?.[clickedX] || "empty";
      showTileActionModal(clickedX, clickedY, tileType, otherPlayerId);
    }
  }
});

scene.input.on("pointermove", pointer => {

  cam = scene.cameras.main;

  const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
  const x = Math.floor(worldPoint.x / TILE_SIZE);
  const y = Math.floor(worldPoint.y / TILE_SIZE);

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

  // Drag to move camera

let pointer;


scene.input.on("pointermove", pointer => {
  if (pointer.isDown && isPointerDown) {
    cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
    cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
         clearTileSelection();

  }

});

  // Mouse wheel zoom
  scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
     newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.5, 2);
    cam.setZoom(newZoom);
     clearTileSelection();

  });


  //  
}

// Bottom
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