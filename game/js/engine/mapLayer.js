//mapLayer.js
// 



export async function buildMapLayer(scene, mapLayer, tileMapData = [], tileAssets = {}, config = {}, onTileClick) {
  const tileSize = 10;
  const halfTile = tileSize;// / 5;

const engine = scene.getEngine();
const canvas = engine.getRenderingCanvas();
const worldMatrix = BABYLON.Matrix.Identity();



  const defaultMat = new BABYLON.StandardMaterial("defaultMat", scene);
  defaultMat.diffuseColor = new BABYLON.Color3(1, 0, 1);

  const camera = scene.activeCamera;
  camera.lowerBetaLimit = 0.3;        // Prevent camera flipping underneath
camera.upperBetaLimit = Math.PI / 2; // Limit vertical rotation to top-down view
camera.lowerRadiusLimit = 5;       // Prevent zooming in too close
camera.upperRadiusLimit = 150;      // Prevent zooming too far out

  const glowLayer = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 32 });

  const getZoneAt = (x, y) => {
    if (!config.restrictedZones) return null;
    return config.restrictedZones.find(zone =>
      x >= zone.x &&
      x < zone.x + zone.width &&
      y >= zone.y &&
      y < zone.y + zone.height
    );
  };

  const tiles = [];

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

      // Tile center
const center = tile.position.clone();





      tiles.push(tile);
    }
  }

  // 🔦 Pulsing border
  let borderMesh = null;
  let pulseAnim = null;
  let clickCooldown = false;

  function createBorder() {
    const mat = new BABYLON.StandardMaterial("borderMat", scene);
    mat.emissiveColor = BABYLON.Color3.FromHexString(config.clickHighlight?.color || "#00ff00");
    mat.disableLighting = true;
    mat.alpha = 0.6;

    const border = BABYLON.MeshBuilder.CreateBox("tileBorder", {
      width: tileSize * 1.05,
      height: 0.1,
      depth: tileSize * 1.05,
    }, scene);
    border.material = mat;
    border.isPickable = false;
    border.visibility = 0;

    glowLayer.addIncludedOnlyMesh(border);
    return border;
  }

  borderMesh = createBorder();

function hidePulseBorder() {
    if (pulseAnim && typeof pulseAnim.stop === "function") {
  pulseAnim.stop();
}
}

  function pulseBorder() {
hidePulseBorder();

    const intensity = config.clickHighlight?.intensity || 0.7;
    const speed = config.clickHighlight?.pulseSpeed || 500;

    const keys = [
      { frame: 0, value: 0.2 },
      { frame: 30, value: intensity },
      { frame: 60, value: 0.2 }
    ];

    pulseAnim = new BABYLON.Animation("pulse", "material.emissiveColor", 60, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    const baseColor = BABYLON.Color3.FromHexString(config.clickHighlight?.color || "#00ff00");

    pulseAnim.setKeys(keys.map(k => ({
      frame: k.frame,
      value: baseColor.scale(k.value)
    })));

    borderMesh.animations = [pulseAnim];
    scene.beginAnimation(borderMesh, 0, 60, true);
  }

  // 🔘 Click logic
  scene.onPointerObservable.add((pointerInfo) => {
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
    const picked = pointerInfo.pickInfo;
    if (picked?.hit && picked.pickedMesh?.name?.startsWith("tile_")) {
      const tile = picked.pickedMesh;
      const meta = tile.metadata;

      if (config.clickHighlight?.enabled && !clickCooldown) {
        borderMesh.position.set(tile.position.x, tile.position.y + 0.1, tile.position.z);
        borderMesh.visibility = 1;
        pulseBorder();
        clickCooldown = true;
        setTimeout(() => { clickCooldown = false; }, config.clickHighlight.cooldown || 500);
      }

      // ✅ Show tooltip
      showTooltip(tile, meta, scene, camera);

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

      if (onTileClick) onTileClick(tile, meta);
    } else {
      // Hide tooltip if clicked elsewhere
      hideTooltip();
      hidePulseBorder();

    }
  }
});

  console.log(`[MapLayer] Built ${tileMapData.length * tileMapData[0].length} tiles`);

}


      /*
////////////////////////////////////
TOOL TIPS
//////////////////////////////////////
*/




// Tooltip DOM reference
/*
const tooltip = document.getElementById("tileTooltip");
const canvasRect = scene.getEngine().getRenderingCanvasClientRect();
*/
export const tooltipConfig = {
  autoHide: false,
  autoHideDelay: 5000,
  pauseOnHover: true,
  hoverDelayExtension: 3000,
  offsetX: 10,
  offsetY: -10
};

let tooltipTimeout;

export function showTooltip(tile, meta, scene, camera) {
  const tooltip = document.getElementById("tileTooltip");
  const infoDiv = tooltip.querySelector(".tile-info");
  const canvasRect = scene.getEngine().getRenderingCanvasClientRect();

  infoDiv.innerHTML = `
    <strong>Tile Info</strong><br>
    Type: ${meta.tileType}<br>
    Grid: (${meta.gridX}, ${meta.gridY})<br>
    Zone: ${meta.zone || "None"}<br>
    Buildable: ${meta.buildable ? "✅" : "❌"}<br>

        <div class="tile-actions">
      <button onclick="handleTileAction('buy')">Buy</button>
      <button onclick="handleTileAction('build')">Build</button>
      <button onclick="handleTileAction('upgrade')">Upgrade</button>
      <button onclick="handleTileAction('view')">View</button>
      </div>
  `;

  // Compute screen position
  const screenPos = BABYLON.Vector3.Project(
    tile.position.clone().add(new BABYLON.Vector3(0, 0.3, 0)),
    BABYLON.Matrix.Identity(),
    scene.getTransformMatrix(),
    camera.viewport.toGlobal(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight())
  );

  tooltip.style.left = `${screenPos.x + canvasRect.left + tooltipConfig.offsetX}px`;
  tooltip.style.top = `${screenPos.y + canvasRect.top + tooltipConfig.offsetY}px`;
  tooltip.style.display = "block";

  clearTimeout(tooltipTimeout);

  if (tooltipConfig.autoHide) {
    tooltipTimeout = setTimeout(() => {
      tooltip.style.display = "none";
    }, tooltipConfig.autoHideDelay);
  }
}

// Hover listener for pause-on-hover feature
function setupTooltipHoverEvents() {
  const tooltip = document.getElementById("tileTooltip");

  if (tooltipConfig.pauseOnHover) {
    tooltip.addEventListener("mouseenter", () => {
      clearTimeout(tooltipTimeout);
    });

    tooltip.addEventListener("mouseleave", () => {
      if (tooltipConfig.autoHide) {
        tooltipTimeout = setTimeout(() => {
          tooltip.style.display = "none";
        }, tooltipConfig.hoverDelayExtension);
      }
    });
  }
}

export function hideTooltip() {
  document.getElementById("tileTooltip").style.display = "none";
}

export function handleTileAction(action) {
  const infoDiv = document.getElementById("tileTooltip").querySelector(".tile-info");
  console.log(`Action "${action}" clicked for:`);
  console.log(infoDiv.textContent);

  alert(`🔧 ${action.toUpperCase()} - coming soon...`);

  hideTooltip();
}

// Run once at app start
setupTooltipHoverEvents();
window.handleTileAction = handleTileAction;

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
