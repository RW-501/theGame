


function createUILayer(scene, engine, canvas, serverStartTime) {
  const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  // Toolbar container
  const toolbar = new BABYLON.GUI.Rectangle("toolbar");
  toolbar.height = "50px";
  toolbar.width = "100%";
  toolbar.background = "#eaeaeaff";
toolbar.thickness = 2;
toolbar.color = "red";
  toolbar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  toolbar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
  ui.addControl(toolbar);

  // Game Time Text
  const gameTimeText = new BABYLON.GUI.TextBlock();
  gameTimeText.text = "🕒 Game Time: ";
  gameTimeText.color = "white";
  gameTimeText.fontSize = 16;
  gameTimeText.paddingLeft = "10px";
  gameTimeText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  toolbar.addControl(gameTimeText);

  // Pointer Position Text
  const pointerText = new BABYLON.GUI.TextBlock();
  pointerText.text = "🖱️ X: -, Y: -";
  pointerText.color = "white";
  pointerText.fontSize = 16;
  pointerText.paddingRight = "10px";
  pointerText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  toolbar.addControl(pointerText);

  // Game time loop
  const fullCycleMinutes = 30;
  const cycleSeconds = fullCycleMinutes * 60;

  scene.onBeforeRenderObservable.add(() => {
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = (now - serverStartTime) % cycleSeconds;
    const gameHours = Math.floor((timeElapsed / cycleSeconds) * 24);
    const gameMinutes = Math.floor(((timeElapsed / cycleSeconds) * 24 * 60) % 60);

    gameTimeText.text = `🕒 Game Time: ${gameHours.toString().padStart(2, '0')}:${gameMinutes.toString().padStart(2, '0')}`;
  });

  // Update pointer info
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (pickResult?.hit && pickResult.pickedMesh?.name.startsWith("tile_")) {
        const { gridX, gridY } = pickResult.pickedMesh.metadata;
        pointerText.text = `🖱️ X: ${gridX}, Y: ${gridY}`;
      } else {
        pointerText.text = `🖱️ X: -, Y: -`;
      }
    }
  });
console.log(ui.getDescendants());

  return ui;
}
