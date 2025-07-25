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


// Stores and markets
import { renderPowerUpStore } from 'https://rw-501.github.io/theGame/game/js/renderStore.js';

// Game rules and player progression
import {
  rules, checkRuleLimit, refillTradesIfNeeded, tryTrade, getPlayerTitle,
  updatePlayerName, savePlayerData, updateAndPersist, tryLevelUp, processHourlyIncomeAndTax
} from 'https://rw-501.github.io/theGame/game/js/rulesAndRegulations.js';


export function renderStockMarket() {
  document.getElementById("stockMarketContent").innerHTML = `
    <p>📈 Stocks coming soon...</p>
    <!-- Add chart, buy/sell buttons here -->
  `;
}
