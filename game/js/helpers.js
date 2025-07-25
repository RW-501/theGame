   import {      TILE_SIZE,
  MAP_SIZE,
  zoneInfo,
  mapData,
  loadMapFromFirebase,
  setDefaultMapData,
  loadTileDataAndRender,
  loadTileData,
  playerState,
  otherPlayerSprites,
  getTileDataAt  } from 'https://rw-501.github.io/theGame/game/js/map.js';


function createButton({ text, className, onClick, parent = document.body, styles = {} }) {
  if (!text) {
    console.trace("createButton called with no text");
    return;
  }

  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  button.onclick = onClick;

  Object.assign(button.style, styles);
  parent.appendChild(button);
  return button;
}



// Generate a custom progress bar (reusable)
function createProgressBar(id, value, max, label = "", level = 1, symbol = "") {
  const percent = Math.min(100, (value / max) * 100).toFixed(1);
    animateNumber(id+'xp', value);

  return `
    <div class="mb-2">
      <div class="d-flex justify-content-between mb-1">
        <small><strong>${symbol} ${label} Lv. ${level}</strong></small>
        <small id='${id}xp'>${value} / ${max}</small>
      </div>
      <div class="custom-progress" >
        <div class="custom-progress-bar bg-info text-white" style="width: ${percent}%;">
          ${percent}%
        </div>
      </div>
    </div>
  `;
}


function showCustomModal({ title = "", body = "", footerButtons = [] }) {
  const modalEl = document.getElementById("customModal");
  const titleEl = document.getElementById("customModalTitle");
  const bodyEl = document.getElementById("customModalBody");
  const footerEl = document.getElementById("customModalFooter");

  titleEl.innerHTML = title;
  bodyEl.innerHTML = typeof body === "string" ? body : "";
  footerEl.innerHTML = "";

  // If body is a DOM node or element
  if (typeof body !== "string" && body instanceof HTMLElement) {
    bodyEl.innerHTML = "";
    bodyEl.appendChild(body);
  }

  // Build buttons
  footerButtons.forEach(({ text, className, onClick }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className || "btn btn-primary";
    btn.textContent = text;

    if (typeof onClick === "function") {
      btn.addEventListener("click", onClick);
    }

    footerEl.appendChild(btn);
  });

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}


function showMessageModal(title, message) {
  document.getElementById("messageModalTitle").textContent = title;
  document.getElementById("messageModalBody").innerHTML = message;

  const modal = new bootstrap.Modal(document.getElementById('messageModal'));
  modal.show();
   // updateStatsUI();
}



function animateNumber(id, newValue, formatter = val => val) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.dataset?.value || el.textContent.replace(/[^\d]/g, ''), 10);
  const target = parseInt(newValue, 10);
  if (current === target) return;

  const duration = 500;
  const stepTime = 30;
  let frame = 0;
  const frames = Math.ceil(duration / stepTime);
  const step = (target - current) / frames;

  const interval = setInterval(() => {
    frame++;
    const val = Math.round(current + step * frame);
    el.textContent = formatter(val);
    el.dataset.value = val;
    if (frame >= frames) {
      clearInterval(interval);
    }
  }, stepTime);
}

function launchConfetti() {
  if (!document.getElementById("confettiCanvas")) {
    const confettiCanvas = document.createElement("createConfettiCanvas");
    confettiCanvas.id = "confettiCanvas";
    confettiCanvas.style.position = "fixed";
    confettiCanvas.style.top = "0";
    confettiCanvas.style.left = "0";
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    confettiCanvas.style.pointerEvents = "none";
    confettiCanvas.style.zIndex = "9999999";
    document.body.appendChild(confettiCanvas);
  }

  const myConfetti = confetti.create(document.getElementById("confettiCanvas"), {
    resize: true,
    useWorker: true
  });

  myConfetti({
    particleCount: 320,
    spread: 90,
    origin: { y: 0.6 }
  });
}



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomEmptyTile(mapData) {
  const emptyTiles = [];

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (mapData[y][x] === "empty") {
        emptyTiles.push([x, y]);
      }
    }
          //  console.log("emptyTiles   ", emptyTiles);

  }

  if (emptyTiles.length === 0) {
    console.warn("⚠️ No empty tiles found. Defaulting to [5, 5].");
    return [5, 5];
  }

  return emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
}



function isAdjacent(x1, y1, x2, y2) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx + dy) === 1;
}



function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}


function calculateTotalTaxes(ownerId) {
  let totalTax = 0;

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = mapData[y][x];

      if (tile?.ownerID === ownerId) {
        const price = tile.value || 0;
        const value = tile.taxRate || 0; // Assume 0.05 for 5% if not set
        totalTax += value * taxRate;
      }
    }
  }

  return totalTax;
}

function calculateTotalIncome(ownerId) {
  let totalIncome = 0;

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = mapData[y][x];

      if (tile?.ownerID === ownerId) {
        const income = tile.income || 0;
        totalIncome += income;
      }
    }
  }

  return totalIncome;
}

function calculateTotalPropertyValue(ownerId) {
  let totalValue = 0;

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = mapData[y][x];

      if (tile?.ownerID === ownerId) {
        const value = tile.value || 0;
        totalValue += value;
      }
    }
  }

  return totalValue;
}



let moveTween;

function movePlayerSmoothly(scene, x, y) {
  return new Promise(resolve => {
    if (moveTween) moveTween.stop();

    moveTween = scene.tweens.add({
      targets: playerSprite,
      x: x * TILE_SIZE + TILE_SIZE/2,
      y: y * TILE_SIZE + TILE_SIZE/2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        resolve();
      }
    });
  });
}


export {
  createButton,
  createProgressBar,
  showCustomModal,
  showMessageModal,
  animateNumber,
  launchConfetti,
  sleep,
  getRandomEmptyTile,
  isAdjacent,
  formatCurrency,
  calculateTotalTaxes,
  calculateTotalIncome,
  calculateTotalPropertyValue,
  movePlayerSmoothly
};
