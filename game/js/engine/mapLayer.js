//mapLayer.js
// 

export async function buildMapLayer(scene, mapLayer, tileMapData = [], tileAssets = {}, config = {}, onTileClick) {
  const tileSize = 2;
  const halfTile = tileSize / 2;
  const defaultMat = new BABYLON.StandardMaterial("defaultMat", scene);
  defaultMat.diffuseColor = new BABYLON.Color3(1, 0, 1);

  const camera = scene.activeCamera;
  let lastHighlightMesh = null;
  let pulseAnim = null;
  let lastClickTime = 0;

  const highlightConfig = {
    enabled: config.clickHighlight?.enabled ?? true,
    color: config.clickHighlight?.color ?? "#00ff00",
    pulseSpeed: config.clickHighlight?.pulseSpeed ?? 500,
    intensity: config.clickHighlight?.intensity ?? 0.7,
    cooldown: config.clickHighlight?.cooldown ?? 300,
  };

  const getZoneAt = (x, y) => {
    if (!config.restrictedZones) return null;
    return config.restrictedZones.find(zone =>
      x >= zone.x &&
      x < zone.x + zone.width &&
      y >= zone.y &&
      y < zone.y + zone.height
    );
  };

  for (let y = 0; y < tileMapData.length; y++) {
    for (let x = 0; x < tileMapData[y].length; x++) {
      const tileType = tileMapData[y][x] || "grass";
      const zone = getZoneAt(x, y);
      const isBuildable = !zone;

      const tile = BABYLON.MeshBuilder.CreateGround(`tile_${x}_${y}`, {
        width: tileSize,
        height: tileSize,
        subdivisions: 1,
      }, scene);

      tile.position.x = (x - y) * halfTile;
      tile.position.z = (x + y) * halfTile;
      tile.position.y = 0.01;

      tile.material = tileAssets[tileType] || defaultMat;
      tile.parent = mapLayer;

      tile.metadata = {
        gridX: x,
        gridY: y,
        worldX: tile.position.x,
        worldZ: tile.position.z,
        tileType,
        buildable: isBuildable,
        zone: zone ? zone.name : null
      };
    }
  }

  const createPulsingBorder = (tile) => {
    if (lastHighlightMesh) {
      lastHighlightMesh.dispose();
      lastHighlightMesh = null;
    }
    if (pulseAnim) {
      scene.stopAnimation(pulseAnim.target);
      pulseAnim = null;
    }

    const border = BABYLON.MeshBuilder.CreateTiledBox("tileHighlight", {
      width: tileSize,
      height: 0.1,
      depth: tileSize,
      pattern: 1,
      tileSize: 1,
    }, scene);
    border.position = tile.position.clone();
    border.position.y += 0.1;
    border.parent = tile;

    const borderMat = new BABYLON.StandardMaterial("highlightMat", scene);
    const highlightColor = BABYLON.Color3.FromHexString(highlightConfig.color);
    borderMat.emissiveColor = highlightColor.scale(highlightConfig.intensity);
    border.material = borderMat;

    // Pulse animation
    const anim = new BABYLON.Animation("pulse", "material.emissiveColor", 60,
      BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    const frameRate = 60;
    const pulseFrames = frameRate * (highlightConfig.pulseSpeed / 1000);
    const dimColor = highlightColor.scale(0.1);
    const brightColor = highlightColor.scale(highlightConfig.intensity);

    anim.setKeys([
      { frame: 0, value: dimColor },
      { frame: pulseFrames / 2, value: brightColor },
      { frame: pulseFrames, value: dimColor },
    ]);

    pulseAnim = anim;
    border.animations = [pulseAnim];
    scene.beginAnimation(border, 0, pulseFrames, true);

    lastHighlightMesh = border;
  };

  // Handle tile click
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
      const now = Date.now();
      if (now - lastClickTime < highlightConfig.cooldown) return;

      const picked = pointerInfo.pickInfo;
      if (picked?.hit && picked.pickedMesh?.name?.startsWith("tile_")) {
        const tile = picked.pickedMesh;
        const meta = tile.metadata;
        lastClickTime = now;

        // 🧭 Smooth zoom to clicked tile
        if (config.zoomOnClick?.enabled && camera) {
          const offset = config.zoomOnClick.cameraTargetOffset || { x: 0, y: 2, z: -4 };
          const targetPos = tile.position.add(new BABYLON.Vector3(offset.x, offset.y, offset.z));
          const animDuration = config.zoomOnClick.animationDuration || 1000;

          BABYLON.Animation.CreateAndStartAnimation(
            "camMove",
            camera,
            "position",
            60,
            (60 * animDuration) / 1000,
            camera.position,
            targetPos,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );

          if (camera.setTarget) camera.setTarget(tile.position);
          if (config.zoomOnClick.fov) camera.fov = config.zoomOnClick.fov;
        }

        // 🌟 Highlight clicked tile
        if (highlightConfig.enabled) createPulsingBorder(tile);

        if (onTileClick) onTileClick(tile, meta);
      }
    }
  });

  console.log(`[MapLayer] Built ${tileMapData.length * tileMapData[0].length} tiles`);
}


      /*

{
  "gridX": 2,
  "gridY": 4,
  "worldX": 4,
  "worldZ": 6,
  "tileType": "stone",
  "buildable": false,
  "zone": "admin_building"
}


*/