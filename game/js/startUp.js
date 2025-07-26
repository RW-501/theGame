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
import {
  initPlayerRealtimeSync, initializeMap, clearTileSelection, returnToPlayerLocation,
  centerCameraOnPlayer, setupMapInteraction, setupMapMovement
} from 'https://rw-501.github.io/theGame/game/js/interactions.js';

// Helpers and utilities
import {
  createButton, createProgressBar, showCustomModal, showMessageModal, animateNumber,
  launchConfetti, sleep, getRandomEmptyTile, isAdjacent, formatCurrency,
  calculateTotalTaxes, calculateTotalIncome, calculateTotalPropertyValue, movePlayerSmoothly
} from 'https://rw-501.github.io/theGame/game/js/helpers.js';


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


// Game rules and player progression
import {
  rules, checkRuleLimit, refillTradesIfNeeded, tryTrade, getPlayerTitle,
  updatePlayerName, savePlayerData, updateAndPersist, tryLevelUp, processHourlyIncomeAndTax
} from 'https://rw-501.github.io/theGame/game/js/rulesAndRegulations.js';



let scene;
let MapWidth;




export async function loadOrCreatePlayer(uid) {
  const existingPlayer = await fetchPlayerFromDB(uid);

  if (existingPlayer) {
    console.log("✅ Load Player");

    if (existingPlayer.location === 'start') {
      await assignRandomLocation(existingPlayer);
    }

    return existingPlayer;
  } else {
    console.log("✅ Create Player");
    const newPlayer = await createNewPlayer(uid);
    return newPlayer;
  }
}

async function fetchPlayerFromDB(uid) {
  const q = query(
    collection(db, "players"),
    where("userID", "==", uid),
    where("server", "==", "main"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    data.id = docSnap.id;
    data.isNew = false;
    return data;
  }

  return null;
}

async function assignRandomLocation(playerData) {
  const randomLocation = getRandomEmptyTile(mapData);
  const [x, y] = randomLocation;

  const docRef = doc(db, "players", playerData.id);
  await updateDoc(docRef, {
    location: randomLocation,
    playerX: x,
    playerY: y
  });

  playerData.location = randomLocation;
  playerData.playerX = x;
  playerData.playerY = y;
}

async function createNewPlayer(uid) {
  const randomLocation = getRandomEmptyTile(mapData);
  const [x, y] = randomLocation;

  const newPlayer = {
    userID: uid,
    playerName: "Player" + Math.floor(Math.random() * 1000),
    avatarUrl: 'https://robohash.org/1?size=50x50',
    avatarImage: 'avatar1',
    status: "active",
    lastUpdate: serverTimestamp(),
    online: true,
    server: "main",
    location: randomLocation,
    playerX: x,
    playerY: y,
    isNew: true,
    trainingMode: true,
    crypto: 5,
    xp: 0,
    level: 1,
    bank: 1000,
    vault: [],
    loans: [],
    health: 100,
    techStrength: 1,
    securityStrength: 1,
    securityStrengthXP: 0,
    techStrengthXP: 0,
    trades: 0,
    tradesTotal: 0,
    tradesAvailable: 5,
    lastTradeRefill: Date.now(),
    landOwned: [],
    jobs: [],
    companiesOwned: [],
    stocks: [],
    portfolio: [],
    inCombat: false,
    attacks: 0,
    attacked: 0,
    inventory: [],
    history: [],
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "players"), newPlayer);
  await updateDoc(docRef, { playerUid: docRef.id });

  newPlayer.id = docRef.id;
  newPlayer.playerUid = docRef.id;

  return newPlayer;
}



export async function ensureHomeTileExists(playerData) {
  const { playerX, playerY, playerUid, playerName } = playerData;
  const tileId = `${playerX}_${playerY}`;
  const tileRef = doc(db, "tiles", tileId);
  const snap = await getDoc(tileRef);

  if (!snap.exists()) {
    const defaultTileData = {
      color: 0x90caf9,
      label: "Home Base",
      type: "home",
      subType: "home",
      level: 1,
      tileLevelXP: 0,
      icon: "🏠",
      tileImage: "https://rw-501.github.io/theGame/game/images/tile_images/suburban/building-type-0.png",
      price: 0,
      income: 100,
      taxRate: 10,
      value: 1000,
      unlocked: false,
      ownerID: playerUid,
      ownerName: playerName,
      createdAt: Date.now(),
      x: playerX,
      y: playerY,
    };

    await setDoc(tileRef, defaultTileData);
  }

  await updateDoc(doc(db, "players", playerUid), { landOwned: [tileId] });
}


let playerData;
export async function finalizePlayerSetup(playerInfo, gameScene) {
  
  playerData = playerInfo;
  scene = gameScene;

  localStorage.setItem("theGame_currentPlayerData", JSON.stringify(playerData));
  playerState.set(playerData.userID, playerData);

  await processHourlyIncomeAndTax(playerData);
  setInterval(() => processHourlyIncomeAndTax(playerData), 15 * 60 * 1000);

  initPlayerRealtimeSync(scene, playerData);
}


export { playerData, scene };