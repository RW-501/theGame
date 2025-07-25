
export function updateStatsUI(state) {
  if (!state) {
    state = playerData;
  }
  const level = state.level?.toString() || "1";
  const levelRules = rules.levels[level];

  document.getElementById("playerAvatar").src = state.avatarUrl || "https://via.placeholder.com/48";
  document.getElementById("playerName").textContent = state.playerName || "Unknown";
  document.getElementById("level").textContent = `${state.level ?? 0}`;
  animateNumber("xp", state.xp ?? 0);
  animateNumber("bank", state.bank ?? 0, formatCurrency);
  document.getElementById("crypto").textContent = `${state.crypto ?? 5}`;

  const health = Math.max(0, Math.min(100, state.health ?? 100));
  const healthBar = document.getElementById("healthBar");
  if (healthBar) {
    healthBar.style.width = `${health}%`;
    healthBar.textContent = `${health}%`;
    healthBar.classList.toggle("bg-danger", health < 40);
    healthBar.classList.toggle("bg-warning", health >= 40 && health < 70);
    healthBar.classList.toggle("bg-success", health >= 70);
  }

//  document.getElementById("zoneName").innerHTML = `📍 Zone: <span>${mapData[playerY]?.[playerX] || "Unknown"}</span>`;

  const xpStats = document.getElementById("xpStats");
  xpStats.innerHTML =
    createProgressBar("xpBar", state.xp, levelRules.xpToNext, "XP", state.level, "💰");

  const securityStats = document.getElementById("securityStats");
  securityStats.innerHTML =
    createProgressBar("securityXPBar", state.securityStrengthXP ?? 0, levelRules.securityStrengthXPToNext, "Security XP", state.securityStrength ?? 1, "🛡️");

  const techStats = document.getElementById("techStats");
  techStats.innerHTML =
    createProgressBar("techXPBar", state.techStrengthXP ?? 0, levelRules.techStrengthXPToNext, "Tech XP", state.techStrength ?? 1, "🧠");

  const tradeStats = document.getElementById("tradeStats");
  tradeStats.innerHTML =
    createProgressBar("tradeBar", state.trades ?? 0, levelRules.tradeLimit, "Trades", state.level ?? 1, "🔁");

  tryLevelUp();

  scene.load.on("complete", () => {
    loadingText.setText("Loading Complete!");
  });
}
