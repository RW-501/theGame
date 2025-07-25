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


// Stores and markets
import { renderStockMarket } from 'https://rw-501.github.io/theGame/game/js/renderStockMarket.js';

// Game rules and player progression
import {
  rules, checkRuleLimit, refillTradesIfNeeded, tryTrade, getPlayerTitle,
  updatePlayerName, savePlayerData, updateAndPersist, tryLevelUp, processHourlyIncomeAndTax
} from 'https://rw-501.github.io/theGame/game/js/rulesAndRegulations.js';



const boosts = [
  { id: 'health', label: '❤️ Health Boost', price: 500 },
  { id: 'security', label: '🛡️ Security Boost', price: 750 },
  { id: 'tech', label: '🧠 Tech Boost', price: 1000 },
  // Add more boosts here easily
];

// Render boost options dynamically
export function renderPowerUpStore() {
  const boostList = document.getElementById('boostList');
  boostList.innerHTML = ''; // Clear previous list

  boosts.forEach(boost => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    li.innerHTML = `
      ${boost.label}
      <button class="btn btn-sm btn-outline-primary" onclick="buyBoost('${boost.id}', ${boost.price})">
        $${boost.price}
      </button>
    `;

    boostList.appendChild(li);
  });
   const modal = new bootstrap.Modal(document.getElementById('levelStoreModal'));
  modal.show();
}

// Called when modal opens
document.getElementById("level").addEventListener("click", renderPowerUpStore);


// Purchase logic (stub, you can add your logic here)
function buyBoost(type, price) {
  if (playerData.bank >= price) {
    playerData.bank -= price;

    if (type === 'health') playerData.health += 50;
    if (type === 'security') playerData.securityStrength += 1;
    if (type === 'tech') playerData.techStrength += 1;

    showMessageModal("Success",`${type} boost purchased!`);
    updatePlayerStats(); // your existing update function
  } else {
    showMessageModal("alert","Not enough bank money!");
  }
}


