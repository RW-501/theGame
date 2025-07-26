
 
 // 📥 IMPORTS
import { zoneInfo } from 'https://rw-501.github.io/theGame/game/js/map.js';
// import { sleep } from 'https://rw-501.github.io/theGame/game/js/helpers.js'; // if used

 
 let loadingText;

// === Phaser Scene Methods ===
function preload() {
  // Add loading text or a bar
   loadingText = this.add.text(
    this.cameras.main.centerX,
    this.cameras.main.centerY,
    'Loading...',
    { font: '32px Arial', fill: '#ffffff' }
  ).setOrigin(0.5);

  const usedImages = new Set(); // avoid duplicate loads

this.load.image("concrete", "https://rw-501.github.io/theGame/game/images/tile_images/sk.png"); // or wherever the file is
this.load.image("dirt", "https://rw-501.github.io/theGame/game/images/tile_images/dk.png"); // or wherever the file is


this.load.image("commercial", "https://rw-501.github.io/theGame/game/images/tile_images/commercial/building-3.png"); // or wherever the file is
this.load.image("industrial", "https://rw-501.github.io/theGame/game/images/tile_images/industrial/building-5.png"); // or wherever the file is


this.load.image("house_Lv_1", "https://rw-501.github.io/theGame/game/images/tile_images/house/house-1.PNG");
this.load.image("house_Lv_2", "https://rw-501.github.io/theGame/game/images/tile_images/house/house-2.PNG");
this.load.image("house_Lv_3", "https://rw-501.github.io/theGame/game/images/tile_images/house/house-3.PNG");
this.load.image("house_Lv_4", "https://rw-501.github.io/theGame/game/images/tile_images/house/house-4.PNG");

this.load.image("building_Lv_1", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-1.PNG");
this.load.image("building_Lv_2", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-2.PNG");
this.load.image("building_Lv_3", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-3.PNG");
this.load.image("building_Lv_4", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-4.PNG");

this.load.image("apartment_Lv_1", "https://rw-501.github.io/theGame/game/images/tile_images/apartment/apartment-1.PNG");
this.load.image("apartment_Lv_2", "https://rw-501.github.io/theGame/game/images/tile_images/apartment/apartment-2.PNG");
this.load.image("apartment_Lv_3", "https://rw-501.github.io/theGame/game/images/tile_images/apartment/apartment-3.PNG");
this.load.image("apartment_Lv_4", "https://rw-501.github.io/theGame/game/images/tile_images/apartment/apartment-4.PNG");

this.load.image("townhouse_Lv_1", "https://rw-501.github.io/theGame/game/images/tile_images/townhouse/townhouse-1.PNG");
this.load.image("townhouse_Lv_2", "https://rw-501.github.io/theGame/game/images/tile_images/townhouse/townhouse-2.PNG");
this.load.image("townhouse_Lv_3", "https://rw-501.github.io/theGame/game/images/tile_images/townhouse/townhouse-3.PNG");
this.load.image("townhouse_Lv_4", "https://rw-501.github.io/theGame/game/images/tile_images/townhouse/townhouse-4.PNG");

this.load.image("bigHouse_Lv_1", "https://rw-501.github.io/theGame/game/images/tile_images/bigHouse/house-1.PNG");
this.load.image("bigHouse_Lv_2", "https://rw-501.github.io/theGame/game/images/tile_images/bigHouse/house-2.PNG");
this.load.image("bigHouse_Lv_3", "https://rw-501.github.io/theGame/game/images/tile_images/bigHouse/house-3.PNG");
this.load.image("bigHouse_Lv_4", "https://rw-501.github.io/theGame/game/images/tile_images/bigHouse/house-4.PNG");

this.load.image("land_type-billboard", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-billboard.PNG");
this.load.image("land_type-cellTower", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-cellTower.PNG");
this.load.image("land_type-crop", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-crop.PNG");
this.load.image("land_type-dirt", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-dirt.PNG");
this.load.image("land_type-grass", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-grass.PNG");
this.load.image("land_type-parkingLot", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-parkingLot.PNG");
this.load.image("land_type-trees", "https://rw-501.github.io/theGame/game/images/tile_images/land/type-trees.PNG");

this.load.image("building_Lv_1", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-1.PNG");
this.load.image("building_Lv_2", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-2.PNG");
this.load.image("building_Lv_3", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-3.PNG");
this.load.image("building_Lv_4", "https://rw-501.github.io/theGame/game/images/tile_images/building/building-4.PNG");




  for (const zoneKey in zoneInfo) {
    const tileData = zoneInfo[zoneKey];
    if (tileData.tileImage && !usedImages.has(tileData.tileImage)) {

      const imageKey = zoneKey + "_" + tileData.type; // already correct, just confirm uniqueness
      this.load.image(imageKey, tileData.tileImage);
      tileData.imageKey = imageKey; // store it for drawMap()
      usedImages.add(tileData.tileImage);

      console.log("imageKey ",imageKey);
      console.log("zoneKey ",zoneKey);
      console.log("tileData ",tileData);
    }
  }
this.load.image('avatar1', "https://rw-501.github.io/theGame/game/images/avatars/avatar1.png");
this.load.image('avatar2', "https://rw-501.github.io/theGame/game/images/avatars/avatar2.png");
this.load.image('avatar3', "https://rw-501.github.io/theGame/game/images/avatars/avatar3.png");
this.load.image('avatar4', "https://rw-501.github.io/theGame/game/images/avatars/avatar4.png");
this.load.image('avatar5', "https://rw-501.github.io/theGame/game/images/avatars/avatar5.png");
this.load.image('avatar6', "https://rw-501.github.io/theGame/game/images/avatars/avatar6.png");
this.load.image('avatar7', "https://rw-501.github.io/theGame/game/images/avatars/avatar7.png");


  
  // Optional: Simulate longer loading for testing
  for (let i = 0; i < 100; i++) {
   // this.load.image(`dummy${i}`, 'path/to/dummy.png');
  }

  // Display loading progress
  this.load.on('progress', (value) => {
    loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
  });
/*
  this.load.on('complete', () => {
    loadingText.setText('Loading Complete!');
  });

  */
}


export { preload };


