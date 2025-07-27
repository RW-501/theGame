export function createScene(engine, canvas, firebaseTimeSeconds = 0) {
  const scene = new BABYLON.Scene(engine);

  // CAMERA (ArcRotate for 3D nav, angled like isometric)
  const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 3.2, 50, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 20;
  camera.upperRadiusLimit = 200;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 50;

  // LIGHTING - Sunlight with Day/Night 30min cycle (day 20m, night 10m)
  const light = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
  light.position = new BABYLON.Vector3(0, 50, 0);
  light.intensity = 1.0;

  // Animate light intensity for day/night cycle
let serverStartTime = firebaseTimeSeconds;
  const fullCycleMinutes = 30;
  const dayMinutes = 20;
  const nightMinutes = 10;
  const cycleSeconds = fullCycleMinutes * 60;
  const nightStart = (dayMinutes / fullCycleMinutes) * cycleSeconds;

  scene.onBeforeRenderObservable.add(() => {
const now = Math.floor(Date.now() / 1000); // current timestamp in seconds
const timeElapsed = (now - serverStartTime) % cycleSeconds;


    // Light dims during night
    const isNight = timeElapsed >= nightStart;
    const nightProgress = isNight ? (timeElapsed - nightStart) / (nightMinutes * 60) : 0;
    const intensity = isNight
      ? BABYLON.Scalar.Lerp(1.0, 0.3, Math.sin(nightProgress * Math.PI))
      : BABYLON.Scalar.Lerp(0.3, 1.0, Math.sin((timeElapsed / (dayMinutes * 60)) * Math.PI));

    light.intensity = intensity;
  });

  // GROUND PLANE - Large and ready for tiles
  const groundSize = 100;
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);
  ground.position.y = 0;

  // MATERIAL (grid for visual debug)
  const groundMat = new BABYLON.GridMaterial("groundMat", scene);
  groundMat.gridRatio = 1;
  groundMat.mainColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  groundMat.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  groundMat.opacity = 0.4;
  ground.material = groundMat;

  // PARENT LAYER CONTAINERS
  const mapLayer = new BABYLON.TransformNode("mapLayer", scene);
  const playerLayer = new BABYLON.TransformNode("playerLayer", scene);
  const objectLayer = new BABYLON.TransformNode("objectLayer", scene);
  const zoneLayer = new BABYLON.TransformNode("zoneLayer", scene);

  return {
    scene,
    camera,
    light,
    mapLayer,
    playerLayer,
    objectLayer,
    zoneLayer
  };
}
