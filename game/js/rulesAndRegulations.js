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

// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';


// Tile actions and UI updates
import { showTileActionModal } from 'https://rw-501.github.io/theGame/game/js/showTileAction.js';
import { updateStatsUI } from 'https://rw-501.github.io/theGame/game/js/updateStatsUI.js';



const rules = {
  levels: {
    "1": {
      title: "Intern",
      xpToNext: 1000,
      securityStrengthXPToNext: 1000,
      techStrengthXPToNext: 1000,
      startingMoney: 1500,
      maxJobs: 2,
      payPercent: 0.01,
      internetUpdateInterval: 20,
          tradeLimit: 5,
    tradeCooldownMins: 20,
      canAttack: false,
      healthAboveToAttack: 0.3,
      canBeAttacked: true,
      educationRequiredForTierUpgrade: true,
      requires: {
        healthcare: true,
        transportation: true,
        crypto: false
      }
    },
    "2": {
      title: "Junior Analyst",
      xpToNext: 3000,
      securityStrengthXPToNext: 1000,
      techStrengthXPToNext: 1000,
      maxJobs: 3,
      payPercent: 0.03,
      internetUpdateInterval: 15,
      canAttack: true,
      healthAboveToAttack: 0.3,
          tradeLimit: 7,
    tradeCooldownMins: 20,
      canBeAttacked: true,
      requires: {
        healthcare: true,
        transportation: true,
        crypto: false
      }
    },
    "3": {
      title: "Senior Engineer",
      xpToNext: 6000,
      securityStrengthXPToNext: 1000,
      techStrengthXPToNext: 1000,
      maxJobs: 4,
      payPercent: 0.05,
      internetUpdateInterval: 10,
          tradeLimit: 9,
    tradeCooldownMins: 20,
      canAttack: true,
      healthAboveToAttack: 0.35,
      canBeAttacked: true,
      requires: {
        healthcare: true,
        transportation: true,
        crypto: false
      }
    },
    "4": {
      title: "Tech Lead",
      xpToNext: 12000,
      securityStrengthXPToNext: 1000,
      techStrengthXPToNext: 1000,
      maxJobs: 5,
      payPercent: 0.07,
      internetUpdateInterval: 5,
      canAttack: true,
      healthAboveToAttack: 0.4,
          tradeLimit: 12,
    tradeCooldownMins: 20,
      canBeAttacked: true,
      requires: {
        healthcare: true,
        transportation: true,
        crypto: true
      }
    }
  }
};

function checkRuleLimit(player, actionType, value) {
  const level = player.level?.toString() || "1";
  const levelRules = rules.levels[level];

  switch (actionType) {
    case "xpToLevelUp":
      return player.xp >= levelRules.xpToNext &&
             player.securityStrengthXP >= levelRules.securityStrengthXPToNext &&
             player.techStrengthXP >= levelRules.techStrengthXPToNext;

    case "jobCount":
      return value <= levelRules.maxJobs;

    case "payPercent":
      return value <= levelRules.payPercent;

    case "internetSpeed":
      return value >= levelRules.internetUpdateInterval;

    case "requiresHealthcare":
      return !levelRules.requires.healthcare || player.hasHealthcare;

    case "requiresTransportation":
      return !levelRules.requires.transportation || player.hasTransportation;

    case "requiresCrypto":
      return !levelRules.requires.crypto || player.hasCrypto;

    case "canUpgradeTier":
      return !levelRules.educationRequiredForTierUpgrade || player.educationLevel >= "mid";

    case "canAttack":
      return levelRules.canAttack && player.health >= levelRules.healthAboveToAttack;

    case "canBeAttacked":
      return levelRules.canBeAttacked && player.health >= levelRules.healthAboveToAttack;

    default:
      console.warn("Unknown rule:", actionType);
      return false;
  }
}


function refillTradesIfNeeded(player) {
  const levelRules = rules.levels[player.level.toString()];
  const maxTrades = levelRules.tradeLimit;
  const cooldown = levelRules.tradeCooldownMins * 60 * 1000;

  const now = Date.now();
  const elapsed = now - (player.lastTradeRefill || 0);

  const tradesToAdd = Math.floor(elapsed / cooldown);
  if (tradesToAdd > 0) {
    player.tradesAvailable = Math.min(maxTrades, player.tradesAvailable + tradesToAdd);
    player.lastTradeRefill = now;
    savePlayerData();
  }
}

function tryTrade(player) {
  refillTradesIfNeeded(player);

  if (player.tradesAvailable <= 0) {
    showMessageModal("Alert","Trade limit reached. Wait for cooldown.");
    return;
  }

  player.tradesAvailable--;
  savePlayerData();
  executeTrade(); // your custom trade logic
}

function getPlayerTitle(level) {
  return rules.levels[level?.toString()]?.title || "Unknown";
}


function updatePlayerName(newName) {
  if (newName.length > 20) {
    showMessageModal("Alert","Name too long! Max 20 characters.");
    return;
  }
  player.name = newName;
  savePlayerData();
}




/**
 * Persist key fields of playerData to Firestore
 */
async function savePlayerData() {
  if (!playerData?.playerUid) {
    console.warn("No player UID available – cannot save data");
    return;
  }
  const docRef = doc(db, "players", playerData.playerUid);
  const payload = {
    xp: playerData.xp,
    level: playerData.level,
    tradesAvailable: playerData.tradesAvailable,
    lastTradeRefill: playerData.lastTradeRefill,
    techStrengthXP: playerData.techStrengthXP,
    securityStrengthXP: playerData.securityStrengthXP,
    bank: playerData.bank,
    health: playerData.health,
    securityStrength: playerData.securityStrength,
    techStrength: playerData.techStrength,
    playerName: playerData.playerName,
    avatarUrl: playerData.avatarUrl,
    avatarImage: playerData.avatarImage
    // Add other fields as needed
  };
  await updateDoc(docRef, payload);
}

/**
 * Call savePlayerData() and optionally refresh UI
 */
async function updateAndPersist(updates = {}) {
  Object.assign(playerData, updates);
  await savePlayerData();
  updateStatsUI();
}





// Example usage for leveling up:
async function tryLevelUp() {
  if (checkRuleLimit(playerData, "xpToLevelUp")) {
    playerData.level++;
    playerData.xp = 0;
    playerData.techStrengthXP = 0;
    playerData.securityStrengthXP = 0;
    playerData.tradesAvailable = rules.levels[playerData.level.toString()].tradeLimit;
    playerData.lastTradeRefill = Date.now();

    await updateAndPersist({
      level: playerData.level,
      xp: 0,
      techStrengthXP: 0,
      securityStrengthXP: 0,
      tradesAvailable: playerData.tradesAvailable,
      lastTradeRefill: playerData.lastTradeRefill
    });


setTimeout(() => {
  launchConfetti();
  showMessageModal("🎉 Level Up!", `You’re now a ${rules.levels[playerData.level].title}`);
}, 100);

}
}








export async function processHourlyIncomeAndTax(playerData) {
  if (!playerData?.playerUid) return;

  const now = Date.now();
  const lastPayout = playerData.lastPayoutTimestamp || 0;

  const oneHour = 60 * 60 * 1000;
  if (now - lastPayout < oneHour) {
    console.log("Not enough time passed. Skipping income/tax update.");
    return;
  }

  const q = query(collection(db, "tiles"), where("owner", "==", playerData.playerUid));
  const tilesSnap = await getDocs(q);

  let totalIncome = 0;
  let totalTax = 0;

  tilesSnap.forEach(docSnap => {
    const tile = docSnap.data();
    totalIncome += tile.income || 0;
    totalTax += tile.taxRate || 0;
  });

  const netChange = totalIncome - totalTax;
  const newBank = (playerData.bank || 0) + netChange;

  // Update player
  const playerRef = doc(db, "players", playerData.playerUid);
  await updateDoc(playerRef, {
    bank: newBank,
    lastPayoutTimestamp: now
  });

  // Notification
  const message = `
💰 Hourly Payout Summary:
+ Income: $${totalIncome.toLocaleString()}
- Taxes: $${totalTax.toLocaleString()}
= Net: $${netChange.toLocaleString()}
`;

  await sendNotification({
    toUid: playerData.playerUid,
    message,
    type: "earnings",
    fromDisplayName: "System",
    fromuserAvatar: "https://rw-501.github.io/theGame/game/images/adminAvatar.png"
  });

  console.log("✅ Income and tax processed for", playerData.displayName || playerData.playerUid);
}

export {
  rules,
  checkRuleLimit,
  refillTradesIfNeeded,
  tryTrade,
  getPlayerTitle,
  updatePlayerName,
  savePlayerData,
  updateAndPersist,
  tryLevelUp,
};
