
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



// Helpers and utilities
import {
  createButton, createProgressBar, showCustomModal, showMessageModal, animateNumber,
  launchConfetti, sleep, getRandomEmptyTile, isAdjacent, formatCurrency,
  calculateTotalTaxes, calculateTotalIncome, calculateTotalPropertyValue, movePlayerSmoothly
} from 'https://rw-501.github.io/theGame/game/js/helpers.js';

// Render / UI modules
import { renderBankLedger } from 'https://rw-501.github.io/theGame/game/js/renderBank.js';
import { showEmployeesModal } from 'https://rw-501.github.io/theGame/game/js/renderEmployees.js';
import { showManageHomeModal } from 'https://rw-501.github.io/theGame/game/js/renderHomeManage.js';
import { openManageCompanyModal } from 'https://rw-501.github.io/theGame/game/js/renderManageCompany.js';

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

// Owned properties UI
import {
  openOwnedModal, refreshOwnedTiles, highlightTile, centerCameraOnTile,
  openTileDetails, renderOwnedList
} from 'https://rw-501.github.io/theGame/game/js/renderOwnedProperty.js';
import { getOwnedTiles, renderAllOwnedTiles } from 'https://rw-501.github.io/theGame/game/js/renderOwnedTiles.js';

// Players and profile UI
import { renderAllPlayers } from 'https://rw-501.github.io/theGame/game/js/renderPlayers.js';
import { loadAvatars, selectAvatar, showPlayerInfo } from 'https://rw-501.github.io/theGame/game/js/renderProfile.js';

// Stores and markets
import { renderStockMarket } from 'https://rw-501.github.io/theGame/game/js/renderStockMarket.js';
import { renderPowerUpStore } from 'https://rw-501.github.io/theGame/game/js/renderStore.js';

// Game rules and player progression
import {
  rules, checkRuleLimit, refillTradesIfNeeded, tryTrade, getPlayerTitle,
  updatePlayerName, savePlayerData, updateAndPersist, tryLevelUp, processHourlyIncomeAndTax
} from 'https://rw-501.github.io/theGame/game/js/rulesAndRegulations.js';


// Startup functions
import { loadOrCreatePlayer, initGameScene,
   ensureHomeTileExists, finalizePlayerSetup } from 'https://rw-501.github.io/theGame/game/js/startUp.js';




async function purchaseTile(x, y, overrideType = null, shouldMove = false) {
  try {
    const tileInfo = mapData[y]?.[x] || "empty";
    const info = zoneInfo[tileInfo] || zoneInfo.empty;
    const type = overrideType || info.type;

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not logged in");

    const tileId = `${x}_${y}`;
    const tileRef = doc(db, "tiles", tileId);
    const tileSnap = await getDoc(tileRef);

    let tileData;
    if (tileSnap.exists()) {
      console.log(`📄 Loaded existing tile from Firestore at ${tileId}`);
      tileData = tileSnap.data();
    } else {
      console.log(`🆕 Creating new tile at ${tileId}`);
      tileData = info;
    }

    // Tile already owned by another player
    if (tileData.ownerID && tileData.ownerID !== playerData.playerUid) {
      return showMessageModal("Oops!", "Tile already owned by someone else.");
    }

    // Check if player can afford it
    const cost = tileData?.price ?? info.price;
    if (playerData.bank < cost) {
      return showMessageModal("Insufficient Funds", "You don't have enough funds.");
    }

    // Prepare new tile data
    const newValue = info.price + playerData.level * 500;
    const updatedBank = playerData.bank - cost;

    const newTile = {
      ownerID: playerData.userID,
      ownerName: playerData.playerName || 'Player',
      status: "owned",
      note: 'new',
      tileImage: '',
      color: info.color,
      label: info.label,
      type: type,
      icon: info.icon,
      price: shouldMove ? newValue : info.price,
      originalCost: shouldMove ? newValue : info.price,
      income: info.income,
      taxRate: info.taxRate,
      value: info.value,
      forSale: false,
      unlocked: true,
      level: 1,
      x,
      y,
      tileHistory: info,
      tileLevelXP: increment(info.value * 1.25),

    };

const updates = [
  updateDoc(doc(db, "players", playerData.playerUid), {
    bank: updatedBank,
    ...(shouldMove ? { location: [x, y] } : {}),
    ...(type === 'land' ? { landOwned: arrayUnion(tileId) } : {}),
    ...(type === 'company' ? { companiesOwned: arrayUnion(tileId) } : {}),
    xp: increment(info.value * 1.25),
   securityStrengthXP: increment(info.value * 1.25),
    techStrengthXP: increment(info.value * 1.25),
  }),
  setDoc(tileRef, newTile, { merge: true })
];


    await Promise.all(updates);

    // Update local memory/player state
    if (!playerData.landOwned) playerData.landOwned = [];
    if (!playerData.companiesOwned) playerData.companiesOwned = [];

    if (type === 'land' && !playerData.landOwned.includes(tileId)) {
      playerData.landOwned.push(tileId);
    }

    if (type === 'company' && !playerData.companiesOwned.includes(tileId)) {
      playerData.companiesOwned.push(tileId);
    }

    playerData.bank = updatedBank;

    if (shouldMove) {
      playerData.location = [x, y];
      playerX = x;
      playerY = y;
      movePlayerSmoothly(scene, x, y);
    }

    showMessageModal("Success", `You purchased a ${type} tile!`);

  } catch (err) {
    console.error("❌ Purchase failed:", err.message);
    showMessageModal("Error", err.message);
  }
}

window.purchaseTile = purchaseTile;



async function startCompany(x, y, tileData, uid, sector, name, symbol) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);
  const info = getTileDataAt(x, y);
  const now = Date.now();

  const companyPrice = info.value * 2;
  const min = parseFloat((companyPrice * 0.7).toFixed(2));
  const max = parseFloat((companyPrice * 2).toFixed(2));
  const randomPrice = parseFloat((Math.random() * (max - min) + min).toFixed(2));

  const updatedTile = {
    type: "company",
    name,
    x,
    y,
    stockSymbol: symbol,
    stockMarketListed: true,
    value: tileData.value * 2,
    level: tileData.level,
    sector,
    employsIDs: [],
    ownerID: uid,
    createdAt: now,
    event: "bigChange",
    eventTimestamp: now,
    stockLastPrice: randomPrice,
    price: companyPrice,
    stockPrice: companyPrice / 10,
    stockMinPrice: min,
    stockMaxPrice: max,
    stockMaxChangePercent: 0.05,
    stockPriceHistory: [companyPrice],
    companyStartedAt: now,
    tileLevelXP: increment(tileData.value),
  };

  const newBankValue = playerData.bank - tileData.value;

await Promise.all([
  updateDoc(tileRef, updatedTile),
  updateDoc(playerRef, {
    bank: newBankValue,
    companiesOwned: arrayUnion(tileId),
    xp: increment(tileData.value),
            securityStrengthXP: increment(tileData.value),
            techStrengthXP: increment(tileData.value),
  })
]);

  playerData.bank = newBankValue;
  playerData.companiesOwned = playerData.companiesOwned || [];
  playerData.companiesOwned.push(tileId);

  showMessageModal(`Company ${name}`,`${name} Symbol: (${symbol}) on the Stock Market in sector '${sector}'
  <br> invite players to work for you... () <br> Manage ${name} <br> ${createButton({
  text: "Manage Company",
  className: "btn manage-company-btn",
  onClick: () => openManageCompanyModal(updatedTile, x, y, playerData)
})} `);
}



async function workForCompany(info, playerData, modalFooter, x, y) {
  const trueType = info.type;
  const jobLimit = 3;

    const currentJobs = Array.isArray(playerData.jobs) ? playerData.jobs.length : 0;

    if (currentJobs < jobLimit) {
      const payPerDay = Math.floor(info.value / 20);


          // Prepare job object
          const job = {
            companyName: info.label || "Unknown Company",
            companyCoords: [x, y],
            pay: payPerDay,
            startedOn: Date.now()
          };

          // Ensure jobs array exists
          if (!Array.isArray(playerData.jobs)) playerData.jobs = [];
          playerData.jobs.push(job);

          // Update player document
          const playerRef = doc(db, "players", playerData.playerUid);
          await updateDoc(playerRef, { jobs: playerData.jobs,
            securityStrengthXP: increment(payPerDay * 2),
            techStrengthXP: increment(payPerDay * 2),
 });

          // Update tile's employsIDs array
          const tileId = `${x}_${y}`;
          const tileRef = doc(db, "tiles", tileId);
          const tileSnap = await getDoc(tileRef);

          if (tileSnap.exists()) {
            const tileData = tileSnap.data();
            let employsIDs = Array.isArray(tileData.employsIDs) ? tileData.employsIDs : [];

            // Avoid duplicate entry
            if (!employsIDs.includes(playerData.playerUid)) {
              employsIDs.push(playerData.playerUid);
              await updateDoc(tileRef, { employsIDs, tileLevelXP: increment(payPerDay * 2), });
            }
          }

          showMessageModal(`🎉 You’re now working at ${job.companyName}!`, "success");
   
      

    } else {
          showMessageModal(`💼 Job limit reached`, "success");

    }
  
}


async function upgradeLand(x, y, options = {}) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);

  const [tileSnap, playerSnap] = await Promise.all([
    getDoc(tileRef),
    getDoc(playerRef)
  ]);

  if (!tileSnap.exists() || !playerSnap.exists()) return;

  const tileData = tileSnap.data();
  const player = playerSnap.data();

  const currentLevel = tileData.level || 1;
  const upgradeCost = (currentLevel + 1) * 500;

  if (player.bank < upgradeCost) {
    showMessageModal("Not enough money to upgrade.");
    return;
  }

  const newLevel = currentLevel + 1;
  const newValue = tileData.value + newLevel * 500;

  // Determine land type based on level
  let landType = "Plot";
  if (newLevel > 5) landType = "Farm";
  if (newLevel > 10) landType = "Estate";

  // Allow optional custom label override
  const customLabel = options.getLabel?.(newLevel, tileData) 
                    || `${landType} (Lv ${newLevel})`;

  await Promise.all([
    updateDoc(tileRef, {
      level: newLevel,
      value: newValue,
      label: customLabel
    }),
    updateDoc(playerRef, {
      bank: player.bank - upgradeCost,
      securityStrengthXP: increment(upgradeCost / 4),
      xp: increment(upgradeCost)
    })
  ]);

  showMessageModal(`Land upgraded to ${customLabel}.`);
}

const BASE_COST = 1000;
const XP_PER_LEVEL = 50;

function calculateUpgradeStats(currentLevel, statType = "default") {
  let costMultiplier = 1;
  let xpMultiplier = 1;

  // Optional: different stat types could have different multipliers
  switch (statType) {
    case "techStrengthXP":
      costMultiplier = 1.2;
      xpMultiplier = 1.5;
      break;
    case "securityStrengthXP":
      costMultiplier = 1.4;
      xpMultiplier = 1.3;
      break;
    case "health":
      costMultiplier = 1.1;
      xpMultiplier = 1.2;
      break;
    default:
      break;
  }

  const cost = Math.floor(BASE_COST * (currentLevel + 1) * costMultiplier);
  const xpGain = Math.floor(XP_PER_LEVEL * (currentLevel + 1) * xpMultiplier);

  return { cost, xpGain };
}

async function upgradeHomeBase(x, y) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);

  const [tileSnap, playerSnap] = await Promise.all([
    getDoc(tileRef),
    getDoc(playerRef)
  ]);

  if (!tileSnap.exists() || !playerSnap.exists()) return;

  const tileData = tileSnap.data();
  const player = playerSnap.data();

  const currentLevel = tileData.level || 1;
  const upgradeCost = (currentLevel + 1) * 500;

  if (player.bank < upgradeCost) {
    showMessageModal("Not enough money to upgrade.");
    return;
  }

  const newLevel = currentLevel + 1;
  const newValue = tileData.value + newLevel * 500;

  let homeType = "Apartment";
  if (newLevel > 5) homeType = "House";
  if (newLevel > 10) homeType = "Estate";

  await Promise.all([
    updateDoc(tileRef, {
      level: newLevel,
      value: newValue,
      label: `${homeType} (Lv ${newLevel})`
    }),
    updateDoc(playerRef, {
      bank: player.bank - upgradeCost,
      xp: increment(upgradeCost),
      securityStrengthXP: increment(upgradeCost / 4),


    })
  ]);

  showMessageModal(`Home upgraded to ${homeType} level ${newLevel}.`);
}


async function upgradeHomeStat(x, y, stat) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);

  const [tileSnap, playerSnap] = await Promise.all([getDoc(tileRef), getDoc(playerRef)]);
  if (!tileSnap.exists() || !playerSnap.exists()) {
    showMessageModal("Tile or player not found.");
    return;
  }

  const tileData = tileSnap.data();
  const player = playerSnap.data();

  const currentLevel = tileData[`${stat}`] || 0;

  // 🧮 Use the new logic
  const { cost, xpGain } = calculateUpgradeStats(currentLevel, stat);

const statLabels = {
  techStrengthXP: "Tech Strength",
  securityStrengthXP: "Security Strength",
  health: "Health"
};



  if (player.bank < cost) {
    showMessageModal(`Not enough money to upgrade ${statLabels[stat] || stat}. Cost: $${cost}`);
    return;
  }


  const updates = {};
  updates[`${stat}`] = currentLevel + 1;

  await Promise.all([
    updateDoc(tileRef, updates),
    updateDoc(playerRef, {
      bank: player.bank - cost,
      xp: (player.xp || 0) + xpGain,
    }),
  ]);



showMessageModal(`✅ Upgraded ${statLabels[stat] || stat} to level ${currentLevel + 1}. Spent $${cost}, gained ${xpGain} XP.`);
}




async function repairHomeHealth(x, y) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);

  const [tileSnap, playerSnap] = await Promise.all([getDoc(tileRef), getDoc(playerRef)]);
  if (!tileSnap.exists() || !playerSnap.exists()) {
    showMessageModal("Tile or player not found.");
    return;
  }

 // const tileData = getTileDataAt(x, y); 
  const tileData = tileSnap.data();
  const player = playerSnap.data();

  const maxHealth = 100; // max health cap, adjust if you want
  const currentHealth = tileData.health;
  if (currentHealth >= maxHealth) {
    showMessageModal('info', "Health is already full.");
    return;
  }

  // Repair cost proportional to damage
  const healthToRepair = maxHealth - currentHealth;
  const costPerHealth = 100; // adjust cost per health point repaired
  const repairCost = healthToRepair * costPerHealth;

  if (player.bank < repairCost) {
    showMessageModal('info',`Not enough money to repair health. Cost: $${repairCost}`);
    return;
  }

  await Promise.all([
    updateDoc(tileRef, { health: maxHealth }),
    updateDoc(playerRef, {
      bank:   increment(player.bank - repairCost),
      xp:  increment((player.xp || 0) + healthToRepair / 10),
      securityStrengthXP: increment(healthToRepair / 10)
    }),
  ]);

  showMessageModal('info',`Repaired health to full for $${repairCost}.`);
}



async function handleHackPlayer(attacker, defender) {
  console.log("🛠️ Hacking...", attacker.playerName, "vs", defender.playerName);

  const [dx, dy] = defender.location || [];
  const tile = document.querySelector(`[data-x="${dx}"][data-y="${dy}"]`);
  if (tile) {
    const overlay = document.createElement("div");
    overlay.className = "hack-overlay";
    overlay.style.left = `${tile.offsetLeft}px`;
    overlay.style.top = `${tile.offsetTop}px`;
    overlay.style.position = "absolute";
    tile.parentNode.appendChild(overlay);
    setTimeout(() => overlay.remove(), 700);
  }

  const attackerStrength = (attacker.techStrength || 1) + (attacker.techStrengthXP || 0) / 100;
  const defenderSecurity = (defender.securityStrength || 1) + (defender.securityStrengthXP || 0) / 100;

  const attackerLevel = attacker.level || 1;
  const defenderLevel = defender.level || 1;
  const attackerBank = attacker.bank || 0;
  const defenderBank = defender.bank || 0;

  const damage = 10 + attackerLevel * 2;
  const xpGain = 5 + Math.abs(attackerLevel - defenderLevel);
  const stealAmount = Math.min(defenderBank, 100 + attackerLevel * 20);

  const attackerRef = doc(db, "players", attacker.playerUid);
  const defenderRef = doc(db, "players", defender.playerUid);

  const attackerWins = attackerStrength >= defenderSecurity;

  const tileSelector = `[data-x="${dx}"][data-y="${dy}"]`;
  const tileEl = document.querySelector(tileSelector);
  if (tileEl) {
    tileEl.classList.add("tile-zoom", "electric-shock");
    setTimeout(() => tileEl.classList.remove("tile-zoom", "electric-shock"), 1200);
  }

  const xpStealBonus = Math.floor((attacker.techStrengthXP || 0) / 50);
  const xpDefendBonus = Math.floor((defender.securityStrengthXP || 0) / 50);

  await Promise.all([
    updateDoc(attackerRef, {
      inCombat: true,
      xp: increment(xpGain + (attackerWins ? xpStealBonus : 0)),
      bank: increment(attackerWins ? stealAmount : -stealAmount / 2),
      attacks: increment(1),
      techStrengthXP: increment(attackerWins ? stealAmount : stealAmount / 4),
    }),
    updateDoc(defenderRef, {
      inCombat: true,
      health: increment(attackerWins ? -damage : -damage / 2),
      bank: increment(attackerWins ? -stealAmount : -stealAmount / 2),
      attacked: increment(1),
      techStrengthXP: increment(attackerWins ? -stealAmount / 2 : stealAmount / 2),
    })
  ]);

const title = attackerWins ? "💥 Success!" : "❌ Hack failed!";
const message = attackerWins
  ? `You hacked ${defender.playerName} and stole $${stealAmount}.`
  : `${defender.playerName} defended successfully.`;

showMessageModal(title, message);


}


function initStartCompanyButton() {
  const confirmBtn = document.getElementById("confirmStartCompanyBtn");

  if (!confirmBtn) {
    console.error("❌ Button with ID 'confirmStartCompanyBtn' not found.");
    return;
  }

  confirmBtn.addEventListener("click", async () => {
    const sector = document.getElementById("sectorSelect").value;
    const name = document.getElementById("companyNameInput").value.trim();
    const symbol = document.getElementById("stockSymbolInput").value.trim().toUpperCase();

    if (!name || !symbol || symbol.length < 3 || symbol.length > 5 || !/^[A-Z]+$/.test(symbol)) {
      showMessageModal("Please enter a valid company name and a stock symbol (3–5 uppercase letters).");
      return;
    }

    const x = parseInt(confirmBtn.dataset.selectedTileX, 10);
    const y = parseInt(confirmBtn.dataset.selectedTileY, 10);

    const tileData = await getTileDataAt(x, y);
    const uid = auth.currentUser?.uid;

    if (!uid) {
      alert("User not logged in.");
      return;
    }

    await startCompany(x, y, tileData, uid, sector, name, symbol);

    // Hide the modal
    const modalEl = document.getElementById("startCompanyModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance?.hide();
  });
}
  initStartCompanyButton();

async function fireEmployee(companyName, uid) {
  if (!uid) return;

  const confirmFire = confirm(`Are you sure you want to fire this employee?`);
  if (!confirmFire) return;

  const companyTile = await findTileByCompanyName(companyName);
  if (!companyTile) return alert("Company not found.");

  const tileRef = doc(db, "tiles", companyTile.id);
  const tileSnap = await getDoc(tileRef);

  if (!tileSnap.exists()) return;

  const tileData = tileSnap.data();
  const updatedEmployees = tileData.employsIDs.filter(id => id !== uid);
  await updateDoc(tileRef, { employsIDs: updatedEmployees,  tileLevelXP: increment(100), });

  showMessageModal("Employee Removed", `Employee (${uid.slice(0, 6)}...) has been fired from ${companyName}.`);

  // Refresh modal
  openManageCompanyModal({ ...tileData, name: companyName });
}

async function findTileByCompanyName(name) {
  const q = query(collection(db, "tiles"), where("name", "==", name));
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

window.fireEmployee = fireEmployee;


async function upgradeCompany(x, y) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);

  const [tileSnap, playerSnap] = await Promise.all([
    getDoc(tileRef),
    getDoc(playerRef)
  ]);

  if (!tileSnap.exists() || !playerSnap.exists()) return;

  const tileData = tileSnap.data();
  const player = playerSnap.data();

  const currentLevel = tileData.level || 1;
  const upgradeCost = (currentLevel + 1) * 1500; // Companies cost more

  if (player.bank < upgradeCost) {
    showMessageModal("Not enough money to upgrade your company.");
    return;
  }

  const newLevel = currentLevel + 1;
  const newValue = tileData.value + newLevel * 2000;

  let companyType = "Startup";
  if (newLevel > 3) companyType = "Tech Firm";
  if (newLevel > 6) companyType = "Enterprise";
  if (newLevel > 10) companyType = "Conglomerate";

  await Promise.all([
    updateDoc(tileRef, {
      level: newLevel,
      value: newValue,
      label: `${companyType} (Lv ${newLevel})`,
       tileLevelXP: increment(upgradeCost * 1.25),
    }),
    updateDoc(playerRef, {
      bank: player.bank - upgradeCost,
      xp: increment(upgradeCost * 1.25), // Slight XP bonus for company upgrades
      securityStrengthXP: increment(upgradeCost * 1.25),
      techStrengthXP: increment(upgradeCost * 1.25),
    })
  ]);

  showMessageModal(`Company upgraded to ${companyType} level ${newLevel}.`);
}
window.upgradeCompany = upgradeCompany;



async function upgradeTile(tileId) {
  // Firebase logic to apply upgrades
  const ref = doc(db, "tiles", tileId);
  await updateDoc(ref, { tileLevelXP: increment(100),  });
}


async function sellTile(x, y, playerData) {
  const tile = await getTileDataAt(x, y);
  const tileId = tile.tileId;
  const ref = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.playerUid);

   // Build update payload (merge style)
    const updatePayload = {
      ownerID: null,
      status: "available",
      note: "Sold",
      tileHistory: `${tile.tileHistory || ""} | Sold on ${new Date().toLocaleDateString()}`,
      type: tile.type || "empty",
      ...newData, // allow overrides or additions
    };


  try {
    // Determine which array to remove from
    const isCompany = tile.type === "market" || tile.type === "company"; // adjust types as needed
    const fieldToRemove = isCompany ? "companiesOwned" : "landOwned";

    // Remove from player data and update bank
    await updateDoc(playerRef, {
      [fieldToRemove]: arrayRemove(tileId),
      bank: increment(tile.value || 100), // Default fallback value
      xp: increment(tile.value * 1.2)

    });

   
    
 
    // Update Firestore
    await updateDoc(ref, updatePayload);
    console.log(`Tile ${x},${y} updated successfully.`);
    console.log(`Tile ${tileId} sold and removed from ${fieldToRemove}`);
  } catch (error) {
    console.error("Error selling tile:", error);
  }
}
window.sellTile = sellTile;


export {
  purchaseTile,
  startCompany,
  workForCompany,
  upgradeLand,
  upgradeHomeBase,
  upgradeHomeStat,
  repairHomeHealth,
  handleHackPlayer,
  fireEmployee,
  upgradeCompany,
  upgradeTile,
  sellTile
};


/*
import {   purchaseTile,
  startCompany,
  workForCompany,
  upgradeLand,
  upgradeHomeBase,
  upgradeHomeStat,
  repairHomeHealth,
  handleHackPlayer,
  fireEmployee,
  upgradeCompany,
  upgradeTile,
  sellTile  } from 'https://rw-501.github.io/theGame/game/includes/js/actions.js'; 

  */