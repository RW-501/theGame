
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

// Startup functions
import { loadOrCreatePlayer, initGameScene,
   ensureHomeTileExists, finalizePlayerSetup, playerData } from 'https://rw-501.github.io/theGame/game/js/startUp.js';

export function renderBankLedger() {

const income = calculateTotalIncome(playerData.playerUid);
const value = calculateTotalPropertyValue(playerData.playerUid);
const taxes = calculateTotalTaxes(playerData.playerUid);


  const ledgerHTML = `
    <p><strong>Balance:</strong> $${(playerData.bank || 0).toLocaleString()}</p>
    <p><strong>Loans:</strong> $${(playerData.loans || 0).toLocaleString()}</p>

    <p><strong>Income /hr:</strong> ${income}</p>
    <p><strong>Taxs Owed /hr:</strong> ${taxes}</p>
    <p><strong>Property Value:</strong> ${value}</p>
    <hr>
    <p><strong>Vault Items:</strong> ${playerData.inventory?.join(", ") || "None"}</p>

  `;
  document.getElementById("bankLedgerContent").innerHTML = ledgerHTML;

}
