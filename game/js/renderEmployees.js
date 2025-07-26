
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


export async function showEmployeesModal(tileId) {
  const modalEl = document.getElementById("employeesModal");
  const modalBody = modalEl.querySelector(".modal-body");
  const modalFooter = modalEl.querySelector(".modal-footer");
  modalBody.innerHTML = "Loading...";

  // Always try to show the modal
  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  try {
    const tileRef = doc(db, "tiles", tileId);
    const tileSnap = await getDoc(tileRef);

    if (!tileSnap.exists()) {
      modalBody.innerHTML = "No data found for this tile.";
      return;
    }

    const tileData = tileSnap.data();
    const employsIDs = Array.isArray(tileData.employsIDs) ? tileData.employsIDs : [];

    if (employsIDs.length === 0) {
      modalBody.innerHTML = "No employees yet.";
      return;
    }

    let html = `<ul class="list-group">`;

    for (const uid of employsIDs) {
      const empRef = doc(db, "players", uid);
      const empSnap = await getDoc(empRef);

      if (empSnap.exists()) {
        const empData = empSnap.data();
        const job = (empData.jobs || []).find(j => j.companyCoords?.join("_") === tileId);
        const startDate = job ? new Date(job.startedOn).toLocaleDateString() : "Unknown";

        html += `
          <li class="list-group-item d-flex align-items-center">
            <img src="${empData.avatarUrl || empData.avatarImage}" alt="Avatar"
                 class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
            <div>
              <strong>${empData.playerName || 'Unnamed'}</strong><br>
              <small class="text-muted">Started: ${startDate}</small>
            </div>
          </li>
        `;
      }
    }

    html += `</ul>`;
    modalBody.innerHTML = html;
const viewBtn = createButton("📄 View Company Details", "btn btn-info", () => {
  viewCompanyDetailsModal(x, y);
});
modalFooter.appendChild(viewBtn);

  } catch (error) {
    modalBody.innerHTML = "An error occurred loading employees.";
    console.error("showEmployeesModal error:", error);
  }
}
