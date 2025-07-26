
import {   createButton,
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
  movePlayerSmoothly } from 'https://rw-501.github.io/theGame/game/js/helpers.js';

  import {   getFirestore,  query,
  where, limit, addDoc ,
  arrayRemove, increment, serverTimestamp, 
  arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';


export async function viewCompanyDetailsModal(x, y) {
  const tileId = `${x}_${y}`;
  const tileRef = doc(db, "tiles", tileId);
  const tileSnap = await getDoc(tileRef);

  if (!tileSnap.exists()) {
    showMessageModal(`${tileId}  `+"❌ Company not found at this location.", "danger");
    return;
  }

  const company = tileSnap.data();

  // Optional: fallback if some properties are missing
  const companyName = company.name || "Unknown Company";
  const sector = company.sector || "Unknown Sector";
  const ownerID = company.ownerID || "N/A";
  const employees = Array.isArray(company.employsIDs) ? company.employsIDs.length : 0;
  const price = company.price || company.value || 0;
  const stockPrice = company.stockPrice || 0;
  const startedAt = company.companyStartedAt
    ? new Date(company.companyStartedAt).toLocaleString()
    : "N/A";

  // Create modal content
  const modalBody = `
    <h5>${companyName}</h5>
    <p><strong>Sector:</strong> ${sector}</p>
    <p><strong>Owner:</strong> ${ownerID}</p>
    <p><strong>Location:</strong> (${x}, ${y})</p>
    <p><strong>Company Value:</strong> $${price.toLocaleString()}</p>
    <p><strong>Stock Price:</strong> $${stockPrice.toFixed(2)}</p>
    <p><strong>Employees:</strong> ${employees}</p>
    <p><strong>Founded:</strong> ${startedAt}</p>
  `;

  // Show it in your existing modal system
  showCustomModal({
    title: "📊 Company Details",
    body: modalBody,
    footerButtons: [
      {
        text: "Close",
        className: "btn btn-secondary",
        onClick: closeModal,
      },
    ],
  });
}

