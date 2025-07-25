import {   getFirestore,  query,
  where, limit, addDoc ,
  arrayRemove, increment, serverTimestamp, 
  arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initLiveNotifications, sendNotification  } from 'https://rw-501.github.io/theGame/game/includes/notifications.js';
import { showToast, dismissToast, showMessageAndFadeBtn } from 'https://rw-501.github.io/theGame/game/includes/showToast.js'; 
import {   createButton,
  createProgressBar,
  showCustomModal,
  showMessageModal,
  animateNumber,
  launchConfetti,
  sleep,
  getRandomEmptyTile,
  isAdjacent,
  formatCurrency,
  calculateTotalTaxes,
  calculateTotalIncome,
  calculateTotalPropertyValue,
  movePlayerSmoothly } from 'https://rw-501.github.io/theGame/game/includes/js/helpers.js';



export function renderStockMarket() {
  document.getElementById("stockMarketContent").innerHTML = `
    <p>📈 Stocks coming soon...</p>
    <!-- Add chart, buy/sell buttons here -->
  `;
}
