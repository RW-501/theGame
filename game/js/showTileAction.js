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

// Game action functions
import {
  purchaseTile, startCompany, workForCompany, upgradeLand, upgradeHomeBase, upgradeHomeStat,
  repairHomeHealth, handleHackPlayer, fireEmployee, upgradeCompany, upgradeTile, sellTile
} from 'https://rw-501.github.io/theGame/game/js/actions.js';

// Helpers and utilities
import {
  createButton, createProgressBar, showCustomModal, showMessageModal, animateNumber,
  launchConfetti, sleep, getRandomEmptyTile, isAdjacent, formatCurrency,
  calculateTotalTaxes, calculateTotalIncome, calculateTotalPropertyValue, movePlayerSmoothly
} from 'https://rw-501.github.io/theGame/game/js/helpers.js';

// Render / UI modules
import { preload } from 'https://rw-501.github.io/theGame/game/js/preload.js';
import { renderBankLedger } from 'https://rw-501.github.io/theGame/game/js/renderBank.js';
import { showEmployeesModal } from 'https://rw-501.github.io/theGame/game/js/renderEmployees.js';
import { showManageHomeModal } from 'https://rw-501.github.io/theGame/game/js/renderHomeManage.js';
import { openManageCompanyModal } from 'https://rw-501.github.io/theGame/game/js/renderManageCompany.js';

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
import { getOwnedTiles, renderAllOwnedTiles } from 'https://rw-501.github.io/theGame/game/js/renderOwnedTiles.js';

// Stores and markets
import { renderStockMarket } from 'https://rw-501.github.io/theGame/game/js/renderStockMarket.js';
import { renderPowerUpStore } from 'https://rw-501.github.io/theGame/game/js/renderStore.js';

// Game rules and player progression
import {
  rules, checkRuleLimit, refillTradesIfNeeded, tryTrade, getPlayerTitle,
  updatePlayerName, savePlayerData, updateAndPersist, tryLevelUp, processHourlyIncomeAndTax
} from 'https://rw-501.github.io/theGame/game/js/rulesAndRegulations.js';

// Tile actions and UI updates
import { updateStatsUI } from 'https://rw-501.github.io/theGame/game/js/updateStatsUI.js';

// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData, scene } from 'https://rw-501.github.io/theGame/game/js/startUp.js';

   import {
  initPlayerRealtimeSync, initializeMap,  
   setupMapInteraction, setupMapMovement, allUsersMap
} from 'https://rw-501.github.io/theGame/game/js/interactions.js';

let selectedTile = null;
let tileHighlightRect = null;
let clickedX, clickedY; 

async function showTileActionModal(x, y, tileTypeFromCaller, otherPlayerId) {


  const modalEl = document.getElementById("tileActionModal");
  const modalBody = document.getElementById("tileActionBody");
  const modalFooter = document.getElementById("tileActionFooter");

  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return;

    const dbTileInfo = await getTileDataAt(x, y);

const tileInfo = mapData[y]?.[x] || "empty";
const info = dbTileInfo ? dbTileInfo : zoneInfo[tileInfo] || zoneInfo.empty;

const trueType = info.type;
const now = Date.now();
console.log("Check Tile info:", info);

// Optional checks
const isUnlocked = info.unlocked ?? true; // fallback to true if not specified
const level = info.level ?? 1;
const income = info.income ?? 0;
const value = info.value ?? info.price ?? 0;
const taxRate = info.taxRate ?? 0;

modalBody.innerHTML = `
  <div class="card border-0 shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">📍 Tile Info</h5>
      <div class="row g-2">
        <div class="col-6"><strong>Coordinates:</strong><br>(${x}, ${y})</div>
        <div class="col-6"><strong>Tile Type:</strong><br>${info.label} ${info.icon ?? ''}</div>
        <div class="col-6"><strong>Price:</strong><br>$${info.price?.toLocaleString() ?? 'N/A'}</div>
        <div class="col-6"><strong>Value:</strong><br>$${value.toLocaleString()}</div>
        <div class="col-6"><strong>Income:</strong><br>$${income.toLocaleString()} / Weekly</div>
        <div class="col-6"><strong>Tax Rate:</strong><br>${taxRate}%</div>
        <div class="col-6"><strong>Level:</strong><br>${level}</div>
        <div class="col-6"><strong>Owner:</strong><br>${info.ownerName || "None"}</div>
        <div class="col-6">
          <strong>Status:</strong><br>
          ${isUnlocked ? `<span class="text-success">Unlocked</span>` : `<span class="text-danger">Locked</span>`}
        </div>
      </div>
    </div>
  </div>
`;


  modalFooter.innerHTML = "";

  if (trueType === "blocked") {
    modalBody.innerHTML += "<p>This area is blocked. No actions available.</p>";
    return new bootstrap.Modal(modalEl).show();
  }

  if (otherPlayerId || info.ownerName) {

  // Clear any existing highlight
if (tileHighlightRect) {
  tileHighlightRect.destroy();
  tileHighlightRect = null;
}

// Store selected tile
selectedTile = { x, y };

// ✅ 1. Zoom in slightly (animated)
const targetX = x * TILE_SIZE + TILE_SIZE / 2;
const targetY = y * TILE_SIZE + TILE_SIZE / 2;

// Zoom to 2x
scene.cameras.main.zoomTo(2, 500, 'Sine.easeInOut');

// Pan to the center of the tile
scene.cameras.main.pan(targetX, targetY, 500, 'Sine.easeInOut');


// ✅ 2. Draw lime green tile highlight
// Add the green highlight rectangle
tileHighlightRect = scene.add.rectangle(
  clickedX * TILE_SIZE + TILE_SIZE / 2,
  clickedY * TILE_SIZE + TILE_SIZE / 2,
  TILE_SIZE, TILE_SIZE,
  0x00ff00, 0.25 // Light green fill
).setStrokeStyle(3, 0x00ff00).setDepth(999); // Make sure it's on top

// Pulse animation (tweening the fill alpha)
scene.tweens.add({
  targets: tileHighlightRect,
  alpha: { from: 0.25, to: 0.5 },
  strokeAlpha: { from: 0.5, to: 1 }, // not directly supported, but we can trick it with tint if needed
  duration: 600,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1
});

// Optional: pulse the stroke width using scale trick (visual effect only)
scene.tweens.add({
  targets: tileHighlightRect,
  scaleX: { from: 1, to: 1.05 },
  scaleY: { from: 1, to: 1.05 },
  duration: 600,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1
});

let greenShades = [0x00ff00, 0x66ff66, 0x99ff99];
let current = 0;

scene.time.addEvent({
  delay: 800,
  loop: true,
  callback: () => {
    tileHighlightRect.setFillStyle(greenShades[current], 0.3);
    current = (current + 1) % greenShades.length;
  }
});

}
  
  // === Player tile interaction ===
  if (otherPlayerId) {

const data = allUsersMap.get(otherPlayerId) || {};


    modalBody.innerHTML += `
      <p>Player <strong>${data.playerName}</strong> is here.</p>
      <p>Level: ${data.level}</p>
      <p>Bank: ${data.bank}</p>

      <p>Health: ${data.health}</p>
      <p>Tech Strength: ${data.techStrength}</p>
      <p>Security Strength: ${data.securityStrength}</p>
    `;

 const hackBtn = createButton({
  text: "Hack",
  className: "btn btn-danger",
  onClick: async () => {
    await handleHackPlayer(playerData, data);
    bootstrap.Modal.getInstance(modalEl)?.hide();
  },
  parent: modalFooter
});
hackBtn.disabled = data.isInCombat;

const talkBtn = createButton({
  text: "Talk",
  className: "btn btn-primary",
  onClick: () => {
    showMessageModal(`Talking to ${data.playerName}...`);
    bootstrap.Modal.getInstance(modalEl)?.hide();
  },
  parent: modalFooter
});
talkBtn.disabled = data.isInCombat;

  }



if (!otherPlayerId && trueType === "land" && info.ownerID == playerData.playerUid ) {
  let landType = level > 1 ? "Property" : "Land";

  createButton({
    text: `Upgrade ${landType}`,
    className: "btn btn-success",
    onClick: async () => {
      await upgradeLand(x, y, "land", false);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}


if (!otherPlayerId && trueType === "home" && info.ownerID == playerData.playerUid) {
  let homeType = level > 5 ? "House" : "Appartment";

  createButton({
    text: `Upgrade ${homeType}`,
    className: "btn btn-success",
    onClick: async () => {
      await upgradeHomeBase(x, y, "home", false);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });

  // 🔧 New Button: Open Upgrade/Repair Modal
  createButton({
    text: "Manage Home Systems",
    className: "btn btn-warning",
    onClick: () => {
      showManageHomeModal(x, y);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}


if (!otherPlayerId && isUnlocked && (trueType === "zone" || trueType === "empty")) {
  createButton({
    text: `Buy Land $${info.price}`,
    className: "btn btn-success",
    onClick: async () => {
      await purchaseTile(x, y, "land", false);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });

  const newValue = info.price + playerData.level * 500;
  createButton({
    text: `Move Here (Buy for $${newValue})`,
    className: "btn btn-primary",
    onClick: async () => {
      await purchaseTile(x, y, "home", true);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}

if (!otherPlayerId && isUnlocked && trueType === "company") {
  createButton({
    text: `Buy Company $${info.price}`,
    className: "btn btn-warning",
    onClick: async () => {
      await purchaseTile(x, y, "company", false);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}

const currentJobs = Array.isArray(playerData.jobs) ? playerData.jobs.length : 0;

  const alreadyWorkingHere = Array.isArray(playerData.jobs)
    ? playerData.jobs.some(job => job.companyCoords[0] === x && job.companyCoords[1] === y)
    : false;


if (trueType === "company" ) {
  createButton({
    text: "View Company Details",
    className: "btn btn-primary",
    onClick: async () => {
await viewCompanyDetailsModal(x, y);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}

if (trueType === "company" && !alreadyWorkingHere ) {
  createButton({
    text: "View Employees",
    className: "btn btn-primary",
    onClick: async () => {
      await showEmployeesModal(`${x}_${y}`);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}

if (
  info.ownerID &&
  isUnlocked &&
  info.ownerID === playerData.playerUid &&
  (trueType === "property" || trueType === "land")
) {
  createButton({
    text: `Start Company $${info.value}`,
    className: "btn btn-success",
    onClick: () => {
const confirmBtn = document.getElementById("confirmStartCompanyBtn");
confirmBtn.dataset.selectedTileX = x;
confirmBtn.dataset.selectedTileY = y;
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
    parent: modalFooter
  });
}


if (
  //info.ownerID &&
  isUnlocked &&
   info.ownerID != playerData.playerUid &&
  trueType === "company"  && !alreadyWorkingHere
) {
        const payPerDay = Math.floor(info.value / 20);

  createButton({
     text: `Work for company for $${payPerDay} /day`,
       className: "btn btn-success",
    onClick: () => {
 workForCompany(info, playerData, modalFooter, x, y);
      bootstrap.Modal.getInstance(modalEl)?.hide();
      new bootstrap.Modal(document.getElementById("startCompanyModal")).show();
    },
    parent: modalFooter
  });
}




  new bootstrap.Modal(modalEl).show();
}

export { showTileActionModal };
