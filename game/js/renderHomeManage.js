

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

// Game action functions
import {
  purchaseTile, startCompany, workForCompany, upgradeLand, upgradeHomeBase, upgradeHomeStat,
  repairHomeHealth, handleHackPlayer, fireEmployee, upgradeCompany, upgradeTile, sellTile
} from 'https://rw-501.github.io/theGame/game/js/actions.js';

// Startup functions
import { loadOrCreatePlayer, 
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';

function showManageHomeModal(x, y) {
  const modalEl = document.getElementById("manageHomeModal");
  const modalBody = modalEl.querySelector(".modal-body");
  const modalFooter = modalEl.querySelector(".modal-footer");
  
  modalBody.innerHTML = `
    <p>Upgrade different aspects of your home tile.</p>
    <ul>
      <li><strong>Tech Strength</strong>: Improves hacking defense.</li>
      <li><strong>Security Strength</strong>: Adds guard presence & alert systems.</li>
      <li><strong>Health Repair</strong>: Restores structural integrity.</li>
    </ul>
  `;

  modalFooter.innerHTML = ""; // clear previous buttons

const options = [
  {
    text: "Upgrade Tech Strength",
    onClick: async () => {
      await upgradeHomeStat(x, y, "techStrengthXP");
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
  },
  {
    text: "Upgrade Security",
    onClick: async () => {
      await upgradeHomeStat(x, y, "securityStrengthXP");
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
  },
  {
    text: "Repair Health",
    onClick: async () => {
      await repairHomeHealth(x, y, 'health');
      bootstrap.Modal.getInstance(modalEl)?.hide();
    },
  }
];


  options.forEach(({ text, onClick }) => {
    createButton({
      text,
      className: "btn btn-outline-primary me-2",
      onClick,
      parent: modalFooter
    });
  });

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

export { showManageHomeModal };
