

// If you're using shared game state or constants from other modules:
import { TILE_SIZE, MAP_SIZE, mapData, zoneInfo } from 'https://rw-501.github.io/theGame/game/includes/js/map.js';


// If `graphics` is defined outside this file:
import { graphics } from './graphics.js'; // only if needed

// If you're importing Phaser scenes or images (only if not globally preloaded)
import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.esm.js';



function drawMap(scene) {
  graphics.clear();

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {

      // Skip the player’s tile

      const zoneType = mapData[y][x] || "empty";
      const info = zoneInfo[zoneType] || zoneInfo.empty;

      // Background fill
      graphics.fillStyle(info.color, 1);
      graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);



          // Draw base concrete if not empty
    if (zoneType != "empty") {
      scene.add.image(
        x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
           "concrete").setDisplaySize(TILE_SIZE, TILE_SIZE).setOrigin(0.5);
    }



        if (zoneType == "empty") {
      scene.add.image(
        x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
           "dirt").setDisplaySize(TILE_SIZE, TILE_SIZE).setOrigin(0.5);
    }


    // Retrieve and parse the player data from localStorage
const storedData = JSON.parse(localStorage.getItem("theGame_currentPlayerData"));

// Safely extract playerX and playerY
const playerX = storedData?.location?.[0]; // assuming location = [x, y]
const playerY = storedData?.location?.[1];

if (x === playerX && y === playerY) continue;
if (info.x === "home" ) continue;



            if (zoneType == "zone2" || zoneType == "zone4" || zoneType == "zone6") {
      scene.add.image(
        x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
           "commercial").setDisplaySize(TILE_SIZE, TILE_SIZE).setOrigin(0.5);
    }
                if (zoneType == "zone3" || zoneType == "zone5") {
      scene.add.image(
        x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
           "industrial").setDisplaySize(TILE_SIZE, TILE_SIZE).setOrigin(0.5);
    }

      // Draw image if available
      if (info.imageKey) {
        scene.add.image(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          info.imageKey
        ).setDisplaySize(TILE_SIZE, TILE_SIZE).setOrigin(0.5);
      } 
      
      if (!info.icon) {
        scene.add.text(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          info.icon,
          { font: `${TILE_SIZE * 0.3}px Arial`, align: 'center' }
        ).setOrigin(0.5);
      }


    }
  }

}

export { drawMap };
