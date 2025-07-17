const boardTiles = [
  { id: 0, label: "Start", type: "start", description: "Game begins here." },
  { id: 1, label: "Go for a Run", type: "action", description: "Improve health by jogging.", cardId: "card001" },
  { id: 2, label: "Family Challenge", type: "family_poll", description: "Group Cook-off challenge!" },
  // ... fill all 40 tiles similarly
];

// Sample cards JSON
const cards = {
  card001: {
    id: "card001",
    title: "Go for a Run",
    description: "Improve your health by jogging around the block.",
    effects: { health: +15, money: 0, engagement: -5 },
    category: "activity"
  },
  card002: {
    id: "card002",
    title: "Go Out to Eat",
    description: "Costs $20, lowers health but boosts engagement.",
    effects: { health: -10, money: -20, engagement: +15 },
    category: "activity"
  },
  // add more cards
};

const canvas = document.getElementById("gameBoard");
const ctx = canvas.getContext("2d");

const tileSize = 70;
const player = { name: "Player 1", position: 0, color: "#000", stats: { health: 80, money: 100, engagement: 50, karma: 0 } };

function getTileCoordinates() {
  const coords = [];
  for (let i = 0; i < 40; i++) {
    let x = 0, y = 0;
    if (i < 10) {
      x = canvas.width - tileSize - i * tileSize;
      y = canvas.height - tileSize;
    } else if (i < 20) {
      x = 0;
      y = canvas.height - tileSize - (i - 10) * tileSize;
    } else if (i < 30) {
      x = (i - 20) * tileSize;
      y = 0;
    } else {
      x = canvas.width - tileSize;
      y = (i - 30) * tileSize;
    }
    coords.push({ x, y });
  }
  return coords;
}

const positions = getTileCoordinates();
let animating = false;

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  boardTiles.forEach((tile, i) => {
    const { x, y } = positions[i];
    drawTile(x, y, tile);
    if (player.position === i) drawPlayer(x, y, player);
  });
}

function drawTile(x, y, tile) {
  ctx.fillStyle = tileTypes[tile.type] || "#ccc";
  ctx.fillRect(x, y, tileSize, tileSize);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, tileSize, tileSize);

  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText(tile.label, x + 5, y + 20);
}

function drawPlayer(x, y, player) {
  ctx.beginPath();
  ctx.arc(x + tileSize / 2, y + tileSize / 2, 12, 0, 2 * Math.PI);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function showTileDetails(tile) {
  const details = document.getElementById("tileDetails");
  document.getElementById("tileTitle").textContent = tile.label;
  document.getElementById("tileDesc").textContent = tile.description || "No description";
  details.style.display = "block";
}

function movePlayerBy(steps) {
  if(animating) return; // prevent double moves

  animating = true;
  let targetPos = (player.position + steps) % boardTiles.length;

  let stepCount = 0;
  function animateStep() {
    if (stepCount < steps) {
      player.position = (player.position + 1) % boardTiles.length;
      drawBoard();
      stepCount++;
      setTimeout(animateStep, 300); // smooth step delay
    } else {
      animating = false;
      showTileDetails(boardTiles[player.position]);
    }
  }
  animateStep();
}

document.getElementById("rollDiceBtn").addEventListener("click", () => {
  if(animating) return;
  const diceRoll = Math.floor(Math.random() * 6) + 1;
  alert(`You rolled a ${diceRoll}!`);
  movePlayerBy(diceRoll);
});

document.getElementById("viewStatsBtn").addEventListener("click", () => {
  alert(`Stats:\nHealth: ${player.stats.health}\nMoney: ${player.stats.money}\nEngagement: ${player.stats.engagement}\nKarma: ${player.stats.karma}`);
});

document.getElementById("playCardBtn").addEventListener("click", () => {
  // For demo: pick a random card and apply effects
  const cardKeys = Object.keys(cards);
  const card = cards[cardKeys[Math.floor(Math.random() * cardKeys.length)]];
  alert(`Playing card: ${card.title}\n${card.description}`);
  applyCardEffects(card.effects);
  drawBoard();
});

function applyCardEffects(effects) {
  Object.entries(effects).forEach(([key, val]) => {
    if (player.stats[key] !== undefined) {
      player.stats[key] += val;
      // Clamp values if needed, e.g. between 0-100
      if(player.stats[key] < 0) player.stats[key] = 0;
      if(player.stats[key] > 100) player.stats[key] = 100;
    }
  });
}

// Initial draw & show start tile
drawBoard();
showTileDetails(boardTiles[0]);

const boardSize = 10; // 10x10 loop
const padding = 10;

// Sample tile data
const tileTypes = {
  start: "#4CAF50",
  action: "#2196F3",
  chance: "#FFC107",
  quiz: "#FF5722",
  goal: "#9C27B0",
  story: "#00BCD4",
  family_poll: "#E91E63",
  challenge: "#795548"
};

// Sample board loop (40 tiles around a square)
const tiles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  label: `Tile ${i}`,
  type: Object.keys(tileTypes)[i % Object.keys(tileTypes).length]
}));




function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const positions = getTileCoordinates();

  tiles.forEach((tile, index) => {
    const { x, y } = positions[index];
    drawTile(x, y, tile);
    if (player.position === index) {
      drawPlayer(x, y, player);
    }
  });
}

function getTileCoordinates() {
  const coords = [];
  const n = 10;
  for (let i = 0; i < 40; i++) {
    let x = 0, y = 0;

    if (i < 10) {
      x = canvas.width - tileSize - i * tileSize;
      y = canvas.height - tileSize;
    } else if (i < 20) {
      x = 0;
      y = canvas.height - tileSize - (i - 10) * tileSize;
    } else if (i < 30) {
      x = (i - 20) * tileSize;
      y = 0;
    } else {
      x = canvas.width - tileSize;
      y = (i - 30) * tileSize;
    }

    coords.push({ x, y });
  }
  return coords;
}

function drawTile(x, y, tile) {
  const radius = 15;
  // Create gradient background based on tile type color
  const color = tileTypes[tile.type] || "#999";
  const gradient = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
  gradient.addColorStop(0, shadeColor(color, 20));
  gradient.addColorStop(1, shadeColor(color, -20));

  // Rounded rect fill
  roundRect(ctx, x, y, tileSize, tileSize, radius, true, false, gradient);

  // Tile shadow border
  ctx.strokeStyle = shadeColor(color, -50);
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, tileSize, tileSize, radius, false, true);

  // Tile label with shadow
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 4;
  ctx.fillText(tile.label, x + 10, y + 25);

  // Draw emoji icon for tile type (you can replace with images if desired)
  const icon = tileIcon(tile.type);
  ctx.shadowBlur = 0;
  ctx.font = "24px Arial";
  ctx.fillText(icon, x + tileSize - 30, y + 35);
}

// Helper to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke, fillStyle) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (let side in defaultRadius) radius[side] = radius[side] || defaultRadius[side];
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    if (fillStyle) ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (stroke) ctx.stroke();
}

// Shade color helper (lighten/darken)
function shadeColor(color, percent) {
  // Convert hex to rgb
  let f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent;
  let R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
  return "#" + (0x1000000 + (Math.round((t-R)*p/100)+R)*0x10000 
    + (Math.round((t-G)*p/100)+G)*0x100 + (Math.round((t-B)*p/100)+B)).toString(16).slice(1);
}

// Emoji icon picker for tile types
function tileIcon(type) {
  switch(type) {
    case "start": return "🏁";
    case "action": return "🎯";
    case "chance": return "🎲";
    case "quiz": return "❓";
    case "goal": return "🏆";
    case "story": return "📖";
    case "family_poll": return "👪";
    case "challenge": return "⚔️";
    default: return "⬜";
  }
}


function drawPlayer(x, y, player) {
  const cx = x + tileSize / 2;
  const cy = y + tileSize / 2;
  const radius = 14;

  // Glow shadow
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();

  // Reset shadow for stroke
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Player initial letter
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px 'Segoe UI'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(player.name.charAt(0), cx, cy);
}


// TEMP: Move player every second for testing
setInterval(() => {
  player.position = (player.position + 1) % tiles.length;
  drawBoard();
}, 1000);

// Initial draw
drawBoard();
