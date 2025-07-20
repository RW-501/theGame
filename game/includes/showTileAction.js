






async function showTileActionModal(x, y, tileTypeFromCaller, otherPlayerId) {
  if (isDraggingMap) return; // Prevent modal while dragging map

  const modalEl = document.getElementById("tileActionModal");
  const modalBody = document.getElementById("tileActionBody");
  const modalFooter = document.getElementById("tileActionFooter");

  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return;

    const dbTileInfo = await getTileDataAt(x, y);

const tileInfo = mapData[y]?.[x] || "empty";
const info = dbTileInfo ? dbTileInfo : zoneInfo[tileInfo] || zoneInfo.empty;

const trueType = info.type;
const now = Date.now();

// Optional checks
const isUnlocked = info.unlocked ?? true; // fallback to true if not specified
const income = info.income ?? 0;
const value = info.value ?? info.price ?? 0;
const taxRate = info.taxRate ?? 0;

modalBody.innerHTML = `
  <div>
    <p><strong>📍 Coordinates:</strong> (${x}, ${y})</p>
    <p><strong>🗺️ Tile Type:</strong> ${info.label} ${info.icon ?? ''}</p>
    <p><strong>💰 Price:</strong> $${info.price?.toLocaleString() ?? 'N/A'}</p>
    <p><strong>📈 Value:</strong> $${value.toLocaleString()}</p>
    <p><strong>🏦 Income:</strong> $${income.toLocaleString()} / Weekly</p>
    <p><strong>💸 Tax Rate:</strong> ${taxRate}%</p>
    <p><strong>🎖️ Level:</strong> ${info.level || 1}</p>
    <p><strong> Owner:</strong> ${info.ownerName || "None"}</p>
    <p><strong>🔓 Status:</strong> ${isUnlocked ? "Unlocked" : "<span style='color:red'>Locked</span>"}</p>
  </div>
`;

  modalFooter.innerHTML = "";

  if (trueType === "blocked") {
    modalBody.innerHTML += "<p>This area is blocked. No actions available.</p>";
    return new bootstrap.Modal(modalEl).show();
  }

  const isInCombat = playerData?.inCombat ?? false;
  const hasActions = playerData?.actionsLeft > 0;

  function isOnCooldown(action) {
    return playerData?.cooldowns?.[action] && playerData.cooldowns[action] > now;
  }

  function cooldownLeft(action) {
    return isOnCooldown(action) ? Math.ceil((playerData.cooldowns[action] - now) / 1000) : 0;
  }

  // === Player tile interaction ===
  if (otherPlayerId) {
  const playersRef = collection(db, "players");
  const q = query(playersRef, where("userID", "==", otherPlayerId));

  const otherSnap = await getDocs(q);
    const data = otherSnap.exists() ? otherSnap.data() : {};
    const info = {
      playerName: data.playerName ?? otherPlayerId.substring(0, 6),
      health: data.health ?? "??",
      level: data.level ?? "?",
      techStrength: data.techStrength ?? "?",
      security: data.security ?? "?",
      bank: data.bank ?? "?",
    };

    modalBody.innerHTML += `
      <p>Player <strong>${info.playerName}</strong> is here.</p>
      <p>Level: ${info.level}</p>
      <p>Bank: ${info.bank}</p>

      <p>Health: ${info.health}</p>
      <p>Tech Strength: ${info.techStrength}</p>
      <p>Security: ${info.security}</p>
    `;

    const attackBtn = createButton(
      `Attack${isOnCooldown("attack") ? ` (${cooldownLeft("attack")}s)` : ""}`,
      "btn btn-danger",
      async () => {
        if (isInCombat || !hasActions || isOnCooldown("attack")) return;
        await performAttack(otherPlayerId);
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }
    );
    attackBtn.disabled = isInCombat || !hasActions || isOnCooldown("attack");
    modalFooter.appendChild(attackBtn);

    const talkBtn = createButton("Talk", "btn btn-primary", () => {
      alert(`Talking to ${info.playerName}...`);
      bootstrap.Modal.getInstance(modalEl)?.hide();
    });
    talkBtn.disabled = isInCombat;
    modalFooter.appendChild(talkBtn);
  }



    // === Buy Land button ===
if (!otherPlayerId && trueType === "zone" || trueType === "empty") {
  const buyLandBtn = createButton(`Buy Land $${info.price}`, "btn btn-success", async () => {
    await purchaseTile(x, y, "zone", false);
    bootstrap.Modal.getInstance(modalEl)?.hide();
  });
  modalFooter.appendChild(buyLandBtn);
}

if (!otherPlayerId && trueType === "company") {
  const buyCompanyBtn = createButton(`Buy Company $${info.price}`, "btn btn-warning", async () => {
    await purchaseTile(x, y, "company", false);
    bootstrap.Modal.getInstance(modalEl)?.hide();
  });
  modalFooter.appendChild(buyCompanyBtn);
}

if (!otherPlayerId && trueType === "zone" || trueType === "empty") {
  const moveAndBuyBtn = createButton(`Move Here (Buy for $${info.price})`, "btn btn-primary", async () => {
    await purchaseTile(x, y, "zone", true);
    bootstrap.Modal.getInstance(modalEl)?.hide();
  });
  modalFooter.appendChild(moveAndBuyBtn);
}

if (info.ownerName === playerData.username && info.unlocked && (trueType === "zone" || trueType === "empty")) {
  const startCompanyBtn = createButton(`Start Company $${info.value}`, "btn btn-success", () => {
    // Store coords globally or in a modal data attr
    document.getElementById("confirmStartCompanyBtn").dataset.tile = `${x}_${y}`;
    new bootstrap.Modal(document.getElementById("startCompanyModal")).show();
  });
  modalFooter.appendChild(startCompanyBtn);
}

if (info.ownerName !== playerData.username && trueType === "company") {
  createWorkForCompanyButton(info, playerData, modalFooter, x, y);
}

  new bootstrap.Modal(modalEl).show();
}


async function createWorkForCompanyButton(info, playerData, modalFooter, x, y) {
  const trueType = info.type;
  const jobLimit = 3;

  if (info.ownerName !== playerData.username && trueType === "company") {
    const currentJobs = Array.isArray(playerData.jobs) ? playerData.jobs.length : 0;

    if (currentJobs < jobLimit) {
      const payPerDay = Math.floor(info.value / 20);

      const workBtn = createButton(
        `Work for company for $${payPerDay} /day`,
        "btn btn-success",
        async () => {
          // Prepare job object
          const job = {
            companyName: info.label || "Unknown Company",
            companyCoords: [x, y],
            pay: payPerDay,
            startedOn: Date.now()
          };

          // Ensure jobs array exists
          if (!Array.isArray(playerData.jobs)) playerData.jobs = [];
          playerData.jobs.push(job);

          // Update player document
          const playerRef = doc(db, "players", playerData.playerUid);
          await updateDoc(playerRef, { jobs: playerData.jobs });

          // Update tile's employsIDs array
          const tileId = `${x},${y}`;
          const tileRef = doc(db, "tiles", tileId);
          const tileSnap = await getDoc(tileRef);

          if (tileSnap.exists()) {
            const tileData = tileSnap.data();
            let employsIDs = Array.isArray(tileData.employsIDs) ? tileData.employsIDs : [];

            // Avoid duplicate entry
            if (!employsIDs.includes(playerData.playerUid)) {
              employsIDs.push(playerData.playerUid);
              await updateDoc(tileRef, { employsIDs });
            }
          }

          showMessageModal(`🎉 You’re now working at ${job.companyName}!`, "success");
          closeModal();
        }
      );

      modalFooter.appendChild(workBtn);
    } else {
      const msg = createButton(
        "💼 Job limit reached (3)", 
        "btn btn-secondary disabled"
      );
      modalFooter.appendChild(msg);
    }
  }
}




function createButton({ text, onClick, id, className, parent = document.body, styles = {} }) {
  const button = document.createElement('button');

  // Set basic properties
  button.textContent = text;
  button.id = id || '';
  button.className = className || 'game-button';

  // Apply custom inline styles if any
  Object.assign(button.style, {
    padding: '8px 16px',
    margin: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    ...styles,
  });

  // Attach the click event
  if (typeof onClick === 'function') {
    button.addEventListener('click', onClick);
  }

  // Append to parent
  parent.appendChild(button);

  return button;
}

async function startCompany(x, y, tileData, uid, sector, name, symbol) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerUid);
  const info = getTileDataAt(x, y);
  const now = Date.now();

  const companyPrice = info.value * 2;
  const min = parseFloat((companyPrice * 0.7).toFixed(2));
  const max = parseFloat((companyPrice * 2).toFixed(2));
  const randomPrice = parseFloat((Math.random() * (max - min) + min).toFixed(2));

  const updatedTile = {
    type: "company",
    name,
    stockSymbol: symbol,
    stockMarketListed: true,
    value: tileData.value * 2,
    level: tileData.level,
    sector,
    employsIDs: [],
    ownerID: uid,
    createdAt: now,
    event: "bigChange",
    eventTimestamp: now,
    stockLastPrice: randomPrice,
    price: companyPrice,
    stockPrice: companyPrice / 10,
    stockMinPrice: min,
    stockMaxPrice: max,
    stockMaxChangePercent: 0.05,
    stockPriceHistory: [companyPrice],
    companyStartedAt: now,
  };

  const newBankValue = playerData.bank - tileData.value;

  await Promise.all([
    updateDoc(tileRef, updatedTile),
    updateDoc(playerRef, {
      bank: newBankValue,
      companiesOwned: arrayUnion(tileId)
    })
  ]);

  playerData.bank = newBankValue;
  playerData.companiesOwned = playerData.companiesOwned || [];
  playerData.companiesOwned.push(tileId);

  console.log(`Company '${name}' (${symbol}) started at tile ${tileId} in sector '${sector}'`);
}


document.getElementById("confirmStartCompanyBtn").addEventListener("click", async () => {
  const sector = document.getElementById("sectorSelect").value;
  const name = document.getElementById("companyNameInput").value.trim();
  const symbol = document.getElementById("stockSymbolInput").value.trim().toUpperCase();

  if (!name || !symbol || symbol.length < 3 || symbol.length > 5 || !/^[A-Z]+$/.test(symbol)) {
    showMessageModal("Please enter a valid company name and a stock symbol (3–5 uppercase letters).");
    return;
  }

  // Replace these with your actual tile context values
  const x = selectedTileX;
  const y = selectedTileY;
  const tileData = await getTileDataAt(x, y);
  const uid = currentUser?.uid;

  if (!uid) return alert("User not logged in.");

  await startCompany(x, y, tileData, uid, sector, name, symbol);

  // Hide the modal
  bootstrap.Modal.getInstance(document.getElementById("startCompanyModal"))?.hide();
});



async function purchaseTile(x, y, overrideType = null, shouldMove = false) {
  try {
    const tileInfo = mapData[y]?.[x] || "empty";
    const info = zoneInfo[tileInfo] || zoneInfo.empty;

    const type = overrideType || info.type;
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not logged in");

    const tileRef = doc(db, "tiles", `${x}_${y}`);
    const tileSnap = await getDoc(tileRef);
    const tileData = tileSnap.exists() ? tileSnap.data() : info;

    if (tileData.owner && tileData.owner !== playerData.userID) {
      return showMessageModal("Oops!", "Tile already owned by someone else.");
    }

    const cost = tileData?.price ?? info.price;
    if (playerData.bank < cost) {
      return showMessageModal("Insufficient Funds", "You don't have enough funds.");
    }

    // Deduct money and write tile data
    const updatedBank = playerData.bank - cost;
    const newTile = {
      ownerID: playerData.userID,
      status: "owned",
      note: 'new',
      ownerName: playerData.playerName || 'Player',
      tileImage: '',
      color: info.color,
      label: info.label,
      type: "blocked", // prevent re-buying
      icon:  info.icon,
      price:  info.price,
      originalCost: info.price,
      income:  info.income,
      taxRate:  info.taxRate,
      value:  info.value,
      forSale: false,
      unlocked: true,
      level: 1,
      x,
      y,
      tileHistory: info,
    };

const tileId = `${x}_${y}`;

// Update Firestore
const updates = [
  updateDoc(doc(db, "players", playerData.userID), {
    bank: updatedBank,
    ...(shouldMove ? { location: [x, y] } : {}),
    landOwned: arrayUnion(tileId)
  }),
  setDoc(tileRef, newTile, { merge: true })
];

await Promise.all(updates);

// Update local playerData
if (!playerData.landOwned) playerData.landOwned = [];
if (!playerData.companiesOwned) playerData.companiesOwned = [];

if (type === 'zone' && !playerData.landOwned.includes(tileId)) {
  playerData.landOwned.push(tileId);
}

if (type === 'company' && !playerData.companiesOwned.includes(tileId)) {
  playerData.companiesOwned.push(tileId);
}

    playerData.bank = updatedBank;
    if (shouldMove) {
      playerData.location = [x, y];
      playerX = x;
      playerY = y;
      movePlayerSmoothly(scene, x, y);
    }

    updateStatsUI();
    showMessageModal("Success", `You purchased a ${type} tile!`);
  } catch (err) {
    console.error("Purchase failed:", err.message);
    showMessageModal("Error", err.message);
  }
}

window.purchaseTile = purchaseTile;



async function getTileDataAt(x, y) {
  try {
    // Get the tile type from mapData
    const tileType = mapData[y]?.[x] || "empty";

    // Get static zone info (default fallback data)
    const defaultInfo = zoneInfo[tileType] || zoneInfo.empty;

    // Get live data from Firestore (tiles collection)
    const tileRef = doc(db, "tiles", `${x}_${y}`);
    const tileSnap = await getDoc(tileRef);

    // If Firestore has data, merge it with static info
    if (tileSnap.exists()) {
      const firestoreData = tileSnap.data();
      return { ...defaultInfo, ...firestoreData, x, y };
    } else {
      // Use default zone info if no Firestore document exists
      return { ...defaultInfo, x, y };
    }

  } catch (error) {
    console.error("Error fetching tile data:", error);
    return { ...zoneInfo.empty, x, y };
  }
}



let ownedTiles = [];///  = [ playerData.companiesOwned playerData.landOwned]; // Loaded from player data

function openOwnedModal() {
  renderOwnedList();
  
  bootstrap.Modal.getInstance(document.getElementById("ownedModal"))?.show();
}

document.getElementById("openOwnedBtn").addEventListener("click", openOwnedModal);

window.openOwnedModal = openOwnedModal;




document.getElementById("sortFilter").addEventListener("change", renderOwnedList);

function renderOwnedList() {
  const listEl = document.getElementById("ownedList");
  const sortBy = document.getElementById("sortFilter").value;

  let sorted = [...ownedTiles];
  sorted.sort((a, b) => {
    if (sortBy === "value") return b.value - a.value;
    if (sortBy === "tax") return b.taxRate - a.taxRate;
    return 0;
  });

  listEl.innerHTML = "";
  sorted.forEach(tile => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${tile.name}</strong> (${tile.x}, ${tile.y})<br>
      💰 Value: $${tile.value} | 📊 Tax: ${tile.taxRate}% | 🔓 ${tile.unlocked ? "Unlocked" : "Locked"}
      <br>
      <button class="view-btn" data-x="${tile.x}" data-y="${tile.y}">View</button>
      <button class="sell-btn" data-id="${tile.id}">Sell</button>
      <button class="upgrade-btn" data-id="${tile.id}">Upgrade</button>
    `;
    listEl.appendChild(li);
  });

  attachOwnedListeners();
}

function attachOwnedListeners() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const x = parseInt(e.target.dataset.x);
      const y = parseInt(e.target.dataset.y);
      centerCameraOnTile(x, y);
      openTileDetails(x, y);
      highlightTile(x, y);
    });
  });

  document.querySelectorAll(".sell-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const tileId = e.target.dataset.id;
      await sellTile(tileId);
      showMessageModal("Success","Tile sold!");
      refreshOwnedTiles();
    });
  });

  document.querySelectorAll(".upgrade-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const tileId = e.target.dataset.id;
      await upgradeTile(tileId);
      showMessageModal("Success","Tile upgraded!");
      refreshOwnedTiles();
    });
  });
}

function highlightTile(x, y) {
  // Optional: remove previous highlights
  document.querySelectorAll(".tile-highlight").forEach(el => el.classList.remove("tile-highlight"));

  const tileEl = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  if (tileEl) tileEl.classList.add("tile-highlight");
}

function centerCameraOnTile(x, y) {
  playerX = x;
  playerY = y;
  drawBoard();
}

function openTileDetails(x, y) {
  const tile = getTileDataAt(x, y); // implement this based on your tile structure
  showTileModal(tile); // your modal function
}


async function upgradeTile(tileId) {
  // Firebase logic to apply upgrades
  const ref = doc(db, "tiles", tileId);
  await updateDoc(ref, { level: increment(1) });
}

async function refreshOwnedTiles() {
  // Pull owned tiles again
  const snap = await getDocs(query(collection(db, "tiles"), where("ownerId", "==", playerData.userID)));
  ownedTiles = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  renderOwnedList();
}


async function sellTile(x, y, playerData) {
  const tile = await getTileDataAt(x, y);
  const tileId = tile.tileId;
  const ref = doc(db, "tiles", tileId);
  const playerRef = doc(db, "players", playerData.userID);

   // Build update payload (merge style)
    const updatePayload = {
      ownerID: null,
      status: "available",
      note: "Sold",
      tileHistory: `${tile.tileHistory || ""} | Sold on ${new Date().toLocaleDateString()}`,
      type: tile.type || "empty",
      ...newData, // allow overrides or additions
    };


  try {
    // Determine which array to remove from
    const isCompany = tile.type === "market" || tile.type === "company"; // adjust types as needed
    const fieldToRemove = isCompany ? "companiesOwned" : "landOwned";

    // Remove from player data and update bank
    await updateDoc(playerRef, {
      [fieldToRemove]: arrayRemove(tileId),
      bank: increment(tile.value || 100), // Default fallback value
    });

   
    
 
    // Update Firestore
    await updateDoc(ref, updatePayload);
    console.log(`Tile ${x},${y} updated successfully.`);
    console.log(`Tile ${tileId} sold and removed from ${fieldToRemove}`);
  } catch (error) {
    console.error("Error selling tile:", error);
  }
}





export {
  showTileActionModal,
  getTileDataAt,
  startCompany,
  createWorkForCompanyButton,
  purchaseTile,
  openOwnedModal,
  renderOwnedList,
  refreshOwnedTiles,
  sellTile
};

