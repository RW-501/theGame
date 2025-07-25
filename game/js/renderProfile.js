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


// Players and profile UI
import { renderAllPlayers } from 'https://rw-501.github.io/theGame/game/js/renderPlayers.js';
import { loadAvatars, selectAvatar, showPlayerInfo } from 'https://rw-501.github.io/theGame/game/js/renderProfile.js';



const predefinedAvatars = [
  { avatarImage: "avatar1", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar1.png" },
  { avatarImage: "avatar2", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar2.png" },
  { avatarImage: "avatar3", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar3.png" },
  { avatarImage: "avatar4", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar4.png" },
  { avatarImage: "avatar5", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar5.png" },
  { avatarImage: "avatar6", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar6.png" },
  { avatarImage: "avatar7", avatarUrl: "https://rw-501.github.io/theGame/game/images/avatars/avatar7.png" },
];


function loadAvatars() {
  const gallery = document.getElementById("avatarGallery");
  gallery.innerHTML = "";

  predefinedAvatars.forEach((avatar, i) => {
    const isSelected = playerData.avatarUrl === avatar.avatarUrl;

    const div = document.createElement("div");
    div.className = "avatar-option text-center";
    div.innerHTML = `
      <div class="avatar-wrapper ${isSelected ? 'selected-avatar' : ''}" onclick="selectAvatar('${avatar.avatarUrl}', '${avatar.avatarImage}', this)">
        <img src="${avatar.avatarUrl}" alt="Avatar ${i}">
        <div class="mt-1 small text-muted">${avatar.avatarImage}</div>
      </div>
    `;
    gallery.appendChild(div);
  });
}

function selectAvatar(url, image, wrapperEl) {
  playerData.avatarUrl = url;
  playerData.avatarImage = image;
  document.getElementById("playerAvatar").src = url;

  // Remove highlight from all
  document.querySelectorAll(".avatar-wrapper").forEach(wrap => {
    wrap.classList.remove("selected-avatar");
  });

  // Highlight selected
  wrapperEl.classList.add("selected-avatar");

  if (auth.currentUser) {
    const playerRef = doc(db, "players", playerData.playerUid);
    updateDoc(playerRef, { avatarUrl: url, avatarImage: image });
  }

  bootstrap.Modal.getInstance(document.getElementById("avatarModal")).hide();
}
window.selectAvatar = selectAvatar; 

// Open avatar modal and load avatars
document.getElementById("playerAvatar").addEventListener("click", () => {
  loadAvatars();
  new bootstrap.Modal(document.getElementById("avatarModal")).show();
});

let state;

function showPlayerInfo() {
const uid = playerData.playerUid;

const income = calculateTotalIncome(uid);
const value = calculateTotalPropertyValue(uid);
const taxes = calculateTotalTaxes(uid);



  state = playerData;
  const content = `
    <p><strong>Name:</strong> ${state.playerName}</p>
    <p><strong>XP:</strong> ${state.xp}</p>
    <p><strong>Level:</strong> ${state.level}</p>
<hr>
    <p><strong>Bank:</strong> $${state.bank.toLocaleString()}</p>
    <p><strong>Income /hr:</strong> ${income}</p>
    <p><strong>Taxs Owed /hr:</strong> ${taxes}</p>
    <p><strong>Property Value:</strong> ${value}</p>

    <p><strong>Loans:</strong> ${state.loans || 0}</p>
    <hr>
    <p><strong>Trades Left:</strong> ${state.trades}</p>
    <p><strong>Total Trades:</strong> ${state.tradesTotal || 0}</p>

<hr>
    <p><strong>Crypto:</strong> ${state.crypto}</p>
    <p><strong>Zone:</strong> ${zoneInfo[mapData[playerY]?.[playerX]]?.label || 'Unknown'}</p>
    <p><strong>Location:</strong> [${playerX}, ${playerY}]</p>
    <hr>
    <p><strong>Companies Owned:</strong> ${state.companiesOwned?.length || 0}</p>
    <p><strong>Land Owned:</strong> ${state.landOwned?.length || 0}</p>
    <hr>
    <p><strong>Attacks Made:</strong> ${state.attacks || 0}</p>
    <p><strong>Times Attacked:</strong> ${state.attacked || 0}</p>
  `;

  document.getElementById("playerInfoContent").innerHTML = content;

  const modal = new bootstrap.Modal(document.getElementById('playerInfoModal'));
  modal.show();
}


document.getElementById("playerName").addEventListener("click", showPlayerInfo);

export { loadAvatars, selectAvatar, showPlayerInfo };
