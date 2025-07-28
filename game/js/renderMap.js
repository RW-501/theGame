
import {  auth, db , onAuthStateChanged, signInAnonymously } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";

import {   getFirestore,  query,
  where, limit, addDoc ,
  arrayRemove, increment, serverTimestamp, 
  arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getOwnedTiles, renderAllOwnedTiles } from 'https://rw-501.github.io/theGame/game/js/renderOwnedTiles.js';

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
  movePlayerSmoothly } from 'https://rw-501.github.io/theGame/game/js/helpers.js';
  import {   getTileDataAt, toIsometric } from 'https://rw-501.github.io/theGame/game/js/map.js';

// === Game Constants ===
const TILE_SIZE = 64; 
const MAP_SIZE = 25;
const platformURL = "https://rw-501.github.io/theGame/game/platform/";

let uid;
let playerData = {};
let playerSprite;
let isMoving = false;
let playerX = 5, playerY = 5; // Default fallback
let graphics, cursors;
let mapData = [];
let otherPlayerSprites = new Map();

let tileDataMap; 

const playerState = new Map();

// === Zone Metadata ===
// === Zone Metadata ===
const zoneInfo = {
  empty: {
    color: 0xffffff,
    label: "Wilderness",
    type: "empty",
    icon: "🌲",
    tileImage: 'https://rw-501.github.io/theGame/game/images/tile_images/dk.png',//'https://rw-501.github.io/theGame/game/images/tile_images/trees/tree-small.png', // fixed slashes and removed extra quotes
    price: 1000,
    income: 0,
    taxRate: 0.8,
    value: 500,
    unlocked: true
  },
  playerHome: {
    color: 0x90caf9,
    label: "Home Base",
    type: "home",
    icon: "🏠",
    tileImage: 'https://rw-501.github.io/theGame/game/images/tile_images/suburban/building-type-0.png', // fixed slashes and removed extra quotes
    price: 0,
    income: 1,
    taxRate: 0.5,
    value: 100,
    unlocked: true
  },
  company: {
    color: 0x90caf9,
    label: "Company",
    type: "company",
    icon: "🏢",
    tileImage:'https://rw-501.github.io/theGame/game/images/tile_images/sk.png',// 'https://rw-501.github.io/theGame/game/images/tile_images/industrial/building-5.png', // fixed slashes and removed extra quotes
    price: 1500,
    income: 0,
    taxRate: 10,
    value: 500,
    unlocked: false
  },
  blocked: {
    color: 0x555555,
    label: "Blocked Area",
    type: "blocked",
    icon: "🚧",
    price: 0,
    income: 0,
    taxRate: 0,
    value: 0,
    unlocked: false
  },
  stockMarket: {
    color: 0xffd54f,
    label: "Stock Exchange",
    type: "stockMarket",
    icon: "📈",
    tileImage: 'https://rw-501.github.io/theGame/game/images/tile_images/building.png', // fixed slashes and removed extra quotes
    price: 50000000,
    income: 100000,
    taxRate: 0.25,
    value: 10000000,
    unlocked: false
  },
  // 12 Custom Zones with Incremental Pricing
  ...(() => {
    const zones = {};
    const basePrice = 5000;      // start price at 5000 for Zone 1
    const priceStep = -400;      // negative step to decrease price per zone (adjust as needed)

    const incomeStep = 25;
    const valueStep = 500;
    const baseTax = 0.1;

    const zoneColors = [
      0x9575cd, 0x4fc3f7, 0x4db6ac, 0x81c784, 0xffb74d,
      0xa1887f, 0xe57373, 0xba68c8, 0x64b5f6, 0x81c784,
      0xff8a65, 0xaed581
    ];

    const zoneIcons = [
      "🌆", "🏙️", "🌃", "🏗️", "🏬",
      "🏢", "🏠", "🏘️", "🏚️", "🏛️",
      "🏨", "🕌"
    ];

    for (let i = 1; i <= 12; i++) {
      const price = basePrice + priceStep * (i - 1);  // decreases price for each subsequent zone
      zones[`zone${i}`] = {
        color: zoneColors[i - 1] || 0xcccccc,
        label: `Zone ${i} Company`,
        type: "company",
        icon: zoneIcons[i - 1] || "🏙️",
        tileImage: 'https://rw-501.github.io/theGame/game/images/tile_images/dk.png', // fixed slashes and removed extra quotes
        price,
        level: 1,
        income: 50 + incomeStep * (i - 1),
        taxRate: parseFloat((baseTax + i * 0.01).toFixed(2)),
        value: price + valueStep * (i - 1),
        unlocked: i > 3 // unlock first 3 zones by default
      };
    }

    return zones;
  })()
};

async function loadMapFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "mapTiles"));
    if (snapshot.empty) {
      setDefaultMapData();
      return;
    }

    mapData = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill("empty"));

    snapshot.forEach(doc => {
      const { x, y, type } = doc.data();
      if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
        mapData[y][x] = type || "empty";
      }
    });
  } catch (e) {
    console.error("Failed to load map from Firebase, using default.", e);
    setDefaultMapData();
  }
}

function setDefaultMapData() {
  mapData = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill("empty"));

  const centerX = Math.floor(MAP_SIZE / 2);
  const centerY = Math.floor(MAP_SIZE / 2);
  mapData[centerY][centerX] = "stockMarket";

  for (let y = centerY - 6; y <= centerY + 6; y++) {
    for (let x = centerX - 6; x <= centerX + 6; x++) {
      if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) continue;
      if (x === centerX && y === centerY) continue;

      const dist = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));
      if (dist >= 1 && dist <= 12) {
        mapData[y][x] = `zone${dist}`;
      }
    }
  }
}

async function loadTileDataAndRender(scene) {
  await loadTileData();
  if (!tileDataMap) {
    console.error("❌ tileDataMap failed to load.");
    return;
  }
  renderAllOwnedTiles(scene);
}

async function loadTileData() {
  const tilesSnapshot = await getDocs(collection(db, "tiles"));
  tileDataMap = new Map();

  tilesSnapshot.forEach(doc => {
    const data = doc.data();
    tileDataMap.set(doc.id, data);
  });

  return tileDataMap;
}


export {
  TILE_SIZE,
  MAP_SIZE,
  zoneInfo,
  mapData,
  loadMapFromFirebase,
  setDefaultMapData,
  loadTileDataAndRender,
  loadTileData,
  playerState,
  otherPlayerSprites,
  getTileDataAt,
  tileDataMap,
  toIsometric
};