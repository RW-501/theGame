
// Firebase Firestore imports
import { 
  getFirestore, query, where, limit, addDoc, 
  arrayRemove, increment, serverTimestamp, 
  arrayUnion, collection, doc, getDoc, getDocs, 
  onSnapshot, updateDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Other module imports
import { initLiveNotifications, sendNotification } from 'https://rw-501.github.io/theGame/game/includes/notifications.js';
import { showToast, dismissToast, showMessageAndFadeBtn } from 'https://rw-501.github.io/theGame/game/includes/showToast.js';

// Your own helpers and state modules (update paths as needed)
import { getRandomEmptyTile } from 'https://rw-501.github.io/theGame/game/includes/js/map.js';
import { processHourlyIncomeAndTax } from 'https://rw-501.github.io/theGame/game/includes/js/economy.js';
import { initPlayerRealtimeSync, playerState } from 'https://rw-501.github.io/theGame/game/includes/js/playerSync.js';








// === Firebase Login Check ===
export function initGameScene() {
  const MapWidth = (TILE_SIZE * MAP_SIZE) / 2;

  const config = {
    type: Phaser.AUTO,
    width: MapWidth,
    height: MapWidth,
    parent: "game-container",
    backgroundColor: "#222222",
    scene: { preload, create }
  };

  return new Phaser.Game(config);
}


export async function loadOrCreatePlayer(uid) {
  const q = query(collection(db, "players"), where("userID", "==", uid), where("server", "==", "main"), limit(1));
  const snapshot = await getDocs(q);

  const randomLocation = getRandomEmptyTile(mapData);
  const [x, y] = randomLocation;

  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    data.id = docSnap.id;
    data.isNew = false;

    if (data.location === 'start') {
      const docRef = doc(db, "players", data.id);
      await updateDoc(docRef, { location: randomLocation, playerX: x, playerY: y });
      data.location = randomLocation;
      data.playerX = x;
      data.playerY = y;
    }

    return data;
  }

  // Otherwise create new player
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
      createdAt: Date.now()
    };

    await setDoc(tileRef, defaultTileData);
  }

  await updateDoc(doc(db, "players", playerUid), { landOwned: [tileId] });
}



export async function finalizePlayerSetup(playerData, scene) {
  const playerRef = doc(db, "players", playerData.playerUid);

  localStorage.setItem("theGame_currentPlayerData", JSON.stringify(playerData));
  playerState.set(playerData.userID, playerData);

  await processHourlyIncomeAndTax(playerData);
  setInterval(() => processHourlyIncomeAndTax(playerData), 15 * 60 * 1000);

  initPlayerRealtimeSync(scene);
}


