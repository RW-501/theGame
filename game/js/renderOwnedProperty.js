
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

// Chat (currently empty import, remove if unused)
import { } from 'https://rw-501.github.io/theGame/game/includes/chat.js';

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


// Map state and data
import {
  TILE_SIZE, MAP_SIZE, zoneInfo, mapData,
  loadMapFromFirebase, setDefaultMapData, loadTileDataAndRender,
  loadTileData, getTileDataAt, playerState, otherPlayerSprites
} from 'https://rw-501.github.io/theGame/game/js/renderMap.js';


let ownedTiles = [];///  = [ playerData.companiesOwned playerData.landOwned]; // Loaded from player data

function openOwnedModal() {
        refreshOwnedTiles();

  renderOwnedList();
  console.log("Opening owned assets modal");

  const modalEl = document.getElementById("ownedModal");

  // Try to get existing instance
  let modalInstance = bootstrap.Modal.getInstance(modalEl);

  // If no instance, create one
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalEl);
  }

  modalInstance.show();
}

document.getElementById("openOwnedBtn").addEventListener("click", openOwnedModal);

// Expose to global if needed
window.openOwnedModal = openOwnedModal;



document.getElementById("sortFilter").addEventListener("change", renderOwnedList);

function renderOwnedList() {
  const listEl = document.getElementById("ownedList");
  const sortBy = document.getElementById("sortFilter").value;

  let sorted = [...ownedTiles];
  sorted.sort((a, b) => {
    if (sortBy === "value") return b.value - a.value;
    if (sortBy === "tax") return b.taxRate - a.taxRate;
    return 0;
  });

  listEl.innerHTML = "";

  if (sorted.length === 0) {
    listEl.innerHTML = `<div class="text-center text-muted p-3">
      🏚️ You don't own any properties yet.
    </div>`;
    return;
  }

  sorted.forEach(tile => {
    const li = document.createElement("li");
    li.innerHTML = `
<div class="d-flex align-items-center mb-3">
    <img id="propertyAvatar" src="${tile.tileImage}" alt="propertyAvatar" class="rounded-circle me-2" width="48" height="48">
    <div>
      <strong>${tile.label}</strong> (${tile.x}, ${tile.y})<br>
      💰 Value: $${tile.value} | 📊 Tax: ${tile.taxRate}% | 🔓 ${tile.unlocked ? "Unlocked" : "Locked"}
      <br>
      </div>
      </div>

      <button class="view-btn" data-x="${tile.x}" data-y="${tile.y}">View</button>
      <button class="sell-btn" data-id="${tile.id}">Sell</button>
      <button class="upgrade-btn" data-id="${tile.id}">Upgrade</button>

      <details>
        <summary>More Details</summary>
        <ul style="margin-left:1rem;">
          <li><strong>Type:</strong> ${tile.type || "N/A"}</li>
          <li><strong>Original Cost:</strong> $${tile.originalCost || "N/A"}</li>
          <li><strong>For Sale:</strong> ${tile.forSale ? "Yes" : "No"}</li>
          <li><strong>Income:</strong> $${tile.income || 0}</li>
          <li><strong>Level:</strong> ${tile.level || 1}</li>
          <li><strong>Note:</strong> ${tile.note || ''}</li>

          <li><strong>History:</strong>
            <ul>
              ${(tile.tileHistory || []).map(h => `<li>${h}</li>`).join("") || "<li>No history</li>"}
            </ul>
          </li>
        </ul>
      </details>
    `;
    listEl.appendChild(li);
  });

  attachOwnedListeners();
}

function attachOwnedListeners() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const x = parseInt(e.target.dataset.x);
      const y = parseInt(e.target.dataset.y);
      centerCameraOnTile(x, y);
      openTileDetails(x, y);
      highlightTile(x, y);
    });
  });

  document.querySelectorAll(".sell-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const tileId = e.target.dataset.id;
      await sellTile(tileId);
      showMessageModal("Success","Tile sold!");
      refreshOwnedTiles();
    });
  });

  document.querySelectorAll(".upgrade-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const tileId = e.target.dataset.id;
      await upgradeTile(tileId);
      showMessageModal("Success","Tile upgraded!");
      refreshOwnedTiles();
    });
  });
}

function highlightTile(x, y) {
  // Optional: remove previous highlights
  document.querySelectorAll(".tile-highlight").forEach(el => el.classList.remove("tile-highlight"));

  const tileEl = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  if (tileEl) tileEl.classList.add("tile-highlight");
}

function centerCameraOnTile(x, y) {
  playerX = x;
  playerY = y;
  drawBoard();
}

function openTileDetails(x, y) {
  const tile = getTileDataAt(x, y); // implement this based on your tile structure
  showTileModal(tile); // your modal function
}


async function refreshOwnedTiles() {
  // Pull owned tiles again
  const snap = await getDocs(query(collection(db, "tiles"), where("ownerID", "==", playerData.playerUid)));
  ownedTiles = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  renderOwnedList();
}

export {
  openOwnedModal,
  refreshOwnedTiles,
  highlightTile,
  centerCameraOnTile,
  openTileDetails,
  renderOwnedList
};
