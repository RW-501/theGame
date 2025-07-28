
// Map state and data
import {
  TILE_SIZE, MAP_SIZE, zoneInfo, mapData,
  loadMapFromFirebase, setDefaultMapData, loadTileDataAndRender,
  loadTileData, getTileDataAt, playerState, otherPlayerSprites, toIsometric 
} from 'https://rw-501.github.io/theGame/game/js/renderMap.js';

// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';

   import {
  initPlayerRealtimeSync, initializeMap,  
   setupMapInteraction, setupMapMovement, allUsersMap
} from 'https://rw-501.github.io/theGame/game/js/interactions.js';


// Render other players except local player
function renderAllPlayers(scene) {
  for (const [playerId, pos] of playerState.entries()) {
    if (!pos || pos.x === undefined || pos.y === undefined) continue;

    let sprite = otherPlayerSprites.get(playerId);
    const { x: isoX, y: isoY } = toIsometric(pos.x, pos.y);

    if (!sprite) {
      sprite = scene.add.container(isoX, isoY);
      otherPlayerSprites.set(playerId, sprite);
      scene.add.existing(sprite);

        console.log(`continue: playerId  ${playerId}, || ${playerState} at (${isoX}, ${isoY})`);

   // if (playerId === playerData.playerUid) continue;
    if (!pos || pos.x === undefined || pos.y === undefined) {
      console.warn(`⚠️ Invalid pos for ${playerId}:`, pos);
      continue;
    }



  //const avatarKey = playerData?.avatarImage || "avatar1"; // default
 // const avatarImage = scene.add.image(0, -10, avatarKey )


    // Get player data (e.g., from allUsersMap or Firestore cache)
    const otherPlayerData = allUsersMap.get(playerId); 
    const displayName = otherPlayerData?.playerName || "Player";
    const online = otherPlayerData?.online || true;
    const level = otherPlayerData?.level || 1;
    const bank = otherPlayerData?.bank || 1;
    const playersUid = otherPlayerData?.playerUid || 1;

    const securityStrength = otherPlayerData?.securityStrength || 1;
    const techStrength = otherPlayerData?.techStrength || 1;
    const health = otherPlayerData?.health || 100;
    const inCombat = otherPlayerData?.inCombat || false;
    const trainingMode = otherPlayerData?.trainingMode || true;


    console.log("health ", health, " bank ", bank, " playerData.location ",otherPlayerData.location ," X ",pos.x, " Y ",pos.y)

    console.log(`${level}, ${displayName} Drawing: ${playerId} || ${playersUid} || ${playerData.playerUid} at (${pos.x}, ${pos.y})`);




  if (!scene.add || typeof scene.add.container !== "function") {
    console.error("scene.add.container is not a function");
    return;
  }

  // ✅ Create container sprite
const isoPos = toIsometric(pos.x, pos.y);
sprite = scene.add.container(isoPos.x, isoPos.y);

  console.log("level   ",level);



const levelToImageKey = {
  1: "apartment_Lv_1",
  2: "apartment_Lv_2",
  3: "apartment_Lv_3",
  4: "apartment_Lv_4",

  5: "house_Lv_1",
  6: "house_Lv_2",
  7: "house_Lv_3",
  8: "house_Lv_4",

  9: "townhouse_Lv_1",
  10: "townhouse_Lv_2",
  11: "townhouse_Lv_3",
  12: "townhouse_Lv_4",

  13: "bigHouse_Lv_1",
  14: "bigHouse_Lv_2",
  15: "bigHouse_Lv_3",
  16: "bigHouse_Lv_4",
};

let userHomeImage;

// Check if the image is available
if (levelToImageKey[level]) {

const imageKey = levelToImageKey[level] || "apartment_Lv_1"; // fallback
userHomeImage = scene.add.image(0, TILE_SIZE * -0.15, imageKey)
  .setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8)
  .setOrigin(0.5, 1); // bottom center origin

  console.log("imageKey   ",imageKey);

}
  console.log("userHomeImage   ",userHomeImage);

const isLocalPlayer = playersUid === playerData.playerUid;
const nameLabel = isLocalPlayer ? "My Home" : displayName;

const labelPadding = 4;
const labelFontSize = 9;
const labelFontStyle = {
  fontSize: `${labelFontSize}px`,
  color: '#ffffff',
  fontStyle: 'bold',
  align: 'center'
};

// 🎖️ Level Tag
const levelText = scene.add.text(0, 0, `Lv ${level}`, labelFontStyle).setOrigin(0.5);
levelText.setWordWrapWidth(TILE_SIZE * 0.8 - labelPadding * 2);

const levelWidth = levelText.width + labelPadding * 2;
const levelHeight = levelText.height + labelPadding * 2;

const levelBg = scene.add.graphics();

const radius = 4;
const left = -levelWidth / 2;
const top = -levelHeight / 2;
const right = levelWidth / 2;
const bottom = levelHeight / 2;


levelBg.fillStyle(0x4444aa, 1);
levelBg.lineStyle(1, 0xffffff, 1);
levelBg.beginPath();


// 🔹 Top-left corner (rounded)
levelBg.moveTo(left + radius, top);
levelBg.arc(left + radius, top + radius, radius, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(180), true);

// 🔹 Left side
levelBg.lineTo(left, bottom - radius);

// 🔹 Bottom-left corner (rounded)
levelBg.arc(left + radius, bottom - radius, radius, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(90), true);

// 🔹 Bottom side (straight)
levelBg.lineTo(right, bottom);

// 🔹 Right side up (straight)
levelBg.lineTo(right, top);

// 🔹 Top side back to start
levelBg.lineTo(left + radius, top);

levelBg.closePath();
levelBg.fillPath();
levelBg.strokePath();


// 🏠 Name/Home Tag
const nameText = scene.add.text(0, 0, nameLabel, labelFontStyle).setOrigin(0.5);
nameText.setWordWrapWidth(TILE_SIZE * 0.8 - labelPadding * 2);

// Optional: increase name container width to feel more balanced
const nameExtraWidth = 0;
const nameWidth = nameText.width + labelPadding * 2 + nameExtraWidth;
const nameHeight = nameText.height + labelPadding * 2;

// Recalculate BEFORE drawing shape
const nameLeft = -nameWidth / 2;
const nameRight = nameWidth / 2;
const nameTop = -nameHeight / 2;
const nameBottom = nameHeight / 2;


const nameBg = scene.add.graphics();
nameBg.fillStyle(0x222222, 1);
nameBg.lineStyle(1, 0xffffff, 1);


nameBg.beginPath();

nameBg.moveTo(nameLeft, nameTop);

// Top-right corner (rounded)
nameBg.lineTo(nameRight - radius, nameTop);
nameBg.arc(nameRight - radius, nameTop + radius, radius, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360));

// Right side down
nameBg.lineTo(nameRight, nameBottom - radius);

// Bottom-right corner (rounded)
nameBg.arc(nameRight - radius, nameBottom - radius, radius, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90));

// Bottom side (straight to bottom-left)
nameBg.lineTo(nameLeft, nameBottom);

// Left side up (straight)
nameBg.lineTo(nameLeft, nameTop);


nameBg.closePath();
nameBg.fillPath();
nameBg.strokePath();


// 📦 Combine in container and position at bottom of tile
const labelContainer = scene.add.container(0, TILE_SIZE * 0.35);


// 🧠 Side-by-side X offset
const levelOffsetX = -nameWidth / 2;
const nameOffsetX = levelOffsetX + levelWidth;


// Both on same horizontal line (Y = 0)
const labelY = 0;

levelBg.setPosition(levelOffsetX, labelY);
levelText.setPosition(levelOffsetX, labelY);
nameBg.setPosition(nameOffsetX, labelY);
nameText.setPosition(nameOffsetX, labelY);



// Add children in order
labelContainer.add([levelBg, levelText, nameBg, nameText]);
labelContainer.setSize(nameOffsetX + nameWidth, nameHeight);


// 🔧 Add to sprite
const objectsToAdd = [];

if (userHomeImage) objectsToAdd.push(userHomeImage);
if (labelContainer) objectsToAdd.push(labelContainer);

sprite.add(objectsToAdd);

// Store or render accordingly
  otherPlayerSprites.set(playerId, sprite);
  scene.add.existing(sprite);



} else {
  // update position here if needed
}


sprite.setPosition(isoX, isoY);

if(playerData.playerUid == playerId){
 centerCameraOnPlayer(pos.x, pos.y);

}

}




loadTileDataAndRender(scene);

 

  console.log("✅ Render Complete. Current Sprites:", Array.from(otherPlayerSprites.keys()));


  }


export { renderAllPlayers };
