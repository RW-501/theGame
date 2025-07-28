// main.js

import { auth, db, onAuthStateChanged, signInAnonymously } from "https://rw-501.github.io/theGame/firebase/firebase-config.js";



import "https://cdn.babylonjs.com/babylon.js"; // Make sure Babylon core is loaded
import "https://cdn.babylonjs.com/materialsLibrary/babylon.gridMaterial.min.js"; // ✅ This enables GridMaterial

import { createScene } from "https://rw-501.github.io/theGame/game/js/engine/createScene.js";
import { buildMapLayer } from "https://rw-501.github.io/theGame/game/js/engine/mapLayer.js";
import { createUILayer } from "https://rw-501.github.io/theGame/game/js/engine/uiLayer.js";
import { getServerTimestampInSeconds } from "https://rw-501.github.io/theGame/game/js/engine/utils/firebaseTime.js"; // you’ll need this file
import { scene } from "../startUp";

const canvas = document.getElementById("mainCanvas");
const engine = new BABYLON.Engine(canvas, true);


const config = {
  enableFog: true,
  fogDensity: 0.02,
  fogColor: new BABYLON.Color3(0.05, 0.05, 0.1),

  zoomOnClick: {
  enabled: true,
  cameraTargetOffset: { x: 0, y: 2, z: -4 }, // offset from tile
  animationDuration: 1000, // milliseconds
  fov: 0.6 // optional field of view change (or leave camera as-is)
},

clickHighlight: {
  enabled: true,
  color: "#00ff00", // Green
  pulseSpeed: 500,  // ms for one pulse cycle
  intensity: 0.7,   // max glow
    cooldown: 300,
  },


  performance: {
    hardwareScaling: 1.5
  },

  environment: {
    clearColor: new BABYLON.Color3(0.02, 0.02, 0.03),
    toneMapping: true,
    toneMappingType: BABYLON.TonemappingOperator.Hable,
    exposure: 0.8
  },

  restrictedZones: [
    /*
    { name: "central_plaza", x: 0, y: 0, width: 10, height: 10 },
    { name: "admin_building", x: 20, y: -10, width: 5, height: 5 }
     */
  ]
};

    console.log("config   ",config);

function startGame() {

// Get Firebase time first
getServerTimestampInSeconds().then((firebaseTimeSeconds) => {


// Destructure to get all layers
const { scene, mapLayer, playerLayer, objectLayer, zoneLayer } = createScene(engine, canvas, firebaseTimeSeconds, config);


const tileMapData = [
  ["grass", "concrete", "road", "road", "water"],
  ["grass", "road", "road", "water", "water"],
  ["grass", "grass", "grass", "grass", "water"],
  ["dirt", "dirt", "grass", "stone", "stone"],
  ["dirt", "stone", "concrete", "stone", "stone"]
];

    console.log("scene   ",scene);


// Optional: Define materials for tile types
const tileAssets = {
  grass: new BABYLON.StandardMaterial("grassMat", scene),
  water: new BABYLON.StandardMaterial("waterMat", scene),
  road: new BABYLON.StandardMaterial("roadMat", scene),
  //dirt: new BABYLON.StandardMaterial("dirtMat", scene),
  stone: new BABYLON.StandardMaterial("stoneMat", scene),
};

tileAssets.grass.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
tileAssets.water.diffuseColor = new BABYLON.Color3(0.1, 0.2, 0.8);
tileAssets.road.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
//tileAssets.dirt.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
tileAssets.stone.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);


const concreteMat = new BABYLON.StandardMaterial("concreteMat", scene);
concreteMat.diffuseTexture = new BABYLON.Texture("https://rw-501.github.io/theGame/game/images/tile_images/sk.png", scene);
concreteMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // reduce shine
tileAssets["concrete"] = concreteMat;


const dirtMat = new BABYLON.StandardMaterial("dirtMat", scene);
dirtMat.diffuseTexture = new BABYLON.Texture("https://rw-501.github.io/theGame/game/images/tile_images/dk.png", scene);
dirtMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // reduce shine
tileAssets["dirt"] = dirtMat;

buildMapLayer(
  scene,
  mapLayer,
  tileMapData,
  tileAssets,
  config,
  (tile, meta) => {
    // 🏗️ Example: Show a message or open a build UI
    console.log("Clicked tile data:", meta);

    if (!meta.buildable) {
      alert(`🚫 You can't build in ${meta.zone}`);
      return;
    }

    // Otherwise, allow building...
    alert(`You can build on ${meta.tileType} at (${meta.gridX}, ${meta.gridY})`);
  }
);


  engine.runRenderLoop(() => {
    scene.render();
  let ui =  createUILayer(scene, engine, canvas, firebaseTimeSeconds);
   // console.log("createUILayer   ",ui);

  });


window.addEventListener("resize", () => {
  engine.resize();
});

});

return scene;
}

export {createScene, startGame };