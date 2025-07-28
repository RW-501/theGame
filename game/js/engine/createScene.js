import { buildPlayerLayer } from "https://rw-501.github.io/theGame/game/js/engine/playerLayer.js";

let gameScene;

export function createScene(engine, canvas, firebaseTimeSeconds = 0, config = {}) {
  const scene = new BABYLON.Scene(engine);


  gameScene = scene;

  // Global ENVIRONMENT Config
  const environment = {
    clearColor: config.environment?.clearColor || new BABYLON.Color3(0.01, 0.01, 0.01),
    toneMapping: config.environment?.toneMapping ?? true,
    toneMappingType: config.environment?.toneMappingType || BABYLON.TonemappingOperator.Hable
  };
  scene.clearColor = environment.clearColor;

  if (environment.toneMapping) {
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = environment.toneMappingType;
    scene.imageProcessingConfiguration.exposure = config.environment?.exposure || 1.0;
  }

  // CAMERA (ArcRotate isometric-style)
  const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 3.2, 50, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
 //camera.lowerRadiusLimit = 20;
 // camera.upperRadiusLimit = 200;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 50;

  camera.lowerBetaLimit = 1;        // Prevent camera flipping underneath Try 0.5 or 0.6 for a higher flyover
camera.upperBetaLimit = Math.PI / 2; // Limit vertical rotation to top-down view
camera.lowerRadiusLimit = 50;       // Prevent zooming in too close
camera.upperRadiusLimit = 150;      // Prevent zooming too far out
camera.setTarget(new BABYLON.Vector3(0, 5, 0)); // Hover 5 units above ground

camera.inertia = 0.7;
camera.panningInertia = 0.7;
// camera.panningAxis = new BABYLON.Vector3(1, 0, 1); // Only allow panning in X and Z

  // PERFORMANCE OPTIONS
  if (config.performance?.hardwareScaling) {
    engine.setHardwareScalingLevel(config.performance.hardwareScaling);
  }

  // LIGHTING - with day/night cycle
  const light = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
  light.position = new BABYLON.Vector3(0, 50, 0);
  light.intensity = 1.0;

  const fullCycleMinutes = 30;
  const dayMinutes = 20;
  const nightMinutes = 10;
  const cycleSeconds = fullCycleMinutes * 60;
  const nightStart = (dayMinutes / fullCycleMinutes) * cycleSeconds;
  const serverStartTime = firebaseTimeSeconds;

  scene.onBeforeRenderObservable.add(() => {
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = (now - serverStartTime) % cycleSeconds;

    const isNight = timeElapsed >= nightStart;
    const nightProgress = isNight ? (timeElapsed - nightStart) / (nightMinutes * 60) : 0;
    const intensity = isNight
      ? BABYLON.Scalar.Lerp(1.0, 0.3, Math.sin(nightProgress * Math.PI))
      : BABYLON.Scalar.Lerp(0.3, 1.0, Math.sin((timeElapsed / (dayMinutes * 60)) * Math.PI));
    
    light.intensity = intensity;
  });

  // OPTIONAL FOG
  if (config.enableFog) {
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = config.fogDensity || 0.01;
    scene.fogColor = config.fogColor || new BABYLON.Color3(0.1, 0.1, 0.1);
  }

  // GROUND PLANE
  const groundSize = 100;
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);
  ground.position.y = 0;

  const groundMat = new BABYLON.GridMaterial("groundMat", scene);
  groundMat.gridRatio = 1;
  groundMat.mainColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  groundMat.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  groundMat.opacity = 0.4;
  ground.material = groundMat;

  // RESTRICTED ZONES (visual / logical blocks)
  const restrictedZones = (config.restrictedZones || []).map(zone => {
    const box = BABYLON.MeshBuilder.CreateBox(`zone_${zone.name}`, {
      width: zone.width,
      height: 0.1,
      depth: zone.height
    }, scene);
    box.position = new BABYLON.Vector3(zone.x, 0.05, zone.y);
    box.isPickable = false;
    box.visibility = 0.2;
    const mat = new BABYLON.StandardMaterial(`mat_${zone.name}`, scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    mat.alpha = 0.2;
    box.material = mat;
    return box;
  });

  // LAYERS
  const mapLayer = new BABYLON.TransformNode("mapLayer", scene);
  //const playerLayer = new BABYLON.TransformNode("playerLayer", scene);
  const objectLayer = new BABYLON.TransformNode("objectLayer", scene);
  const zoneLayer = new BABYLON.TransformNode("zoneLayer", scene);

  // inside createScene()
const playerLayer = buildPlayerLayer(scene);


  return {
    scene,
    camera,
    light,
    mapLayer,
    playerLayer,
    objectLayer,
    zoneLayer,
    restrictedZones
  };
}
