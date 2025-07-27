// main.js
import { createScene } from "https://rw-501.github.io/theGame/game/js/engine/createScene.js";
import { getServerTimestampInSeconds } from "https://rw-501.github.io/theGame/game/js/engine/utils/firebaseTime.js"; // you’ll need this file

const canvas = document.getElementById("mainCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Get Firebase time first
getServerTimestampInSeconds().then((firebaseTimeSeconds) => {
// Destructure to get all layers
const { scene, mapLayer, playerLayer, objectLayer, zoneLayer } = createScene(engine, canvas);

  engine.runRenderLoop(() => {
    scene.render();
  });


window.addEventListener("resize", () => {
  engine.resize();
});

});
