const canvas = document.getElementById("gameBoard");
const ctx = canvas.getContext("2d");

const boardSize = 10; // 10x10 loop
const tileSize = 70;
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

const player = {
  name: "Player 1",
  position: 0,
  color: "#000"
};

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

// TEMP: Move player every second for testing
setInterval(() => {
  player.position = (player.position + 1) % tiles.length;
  drawBoard();
}, 1000);

// Initial draw
drawBoard();
