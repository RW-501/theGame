const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions"); // for other features
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Generates a new price based on last price and config
 * @param {number} lastPrice - last known price
 * @param {number} minPrice - minimum allowed price
 * @param {number} maxPrice - maximum allowed price
 * @param {number} maxChangePercent - max percent change allowed (0.05 = 5%)
 * @returns {number} new price, rounded to 2 decimals
 */
function generateRandomPrice(lastPrice, minPrice, maxPrice, maxChangePercent = 0.05) {
  if (!lastPrice || lastPrice <= 0) {
    // Start in the middle of min and max if no valid lastPrice
    lastPrice = (minPrice + maxPrice) / 2;
  }

  const maxDelta = lastPrice * maxChangePercent;
  // Random change between -maxDelta and +maxDelta
  const delta = (Math.random() * 2 - 1) * maxDelta;
  let newPrice = lastPrice + delta;

  // Clamp new price within min and max
  newPrice = Math.min(Math.max(newPrice, minPrice), maxPrice);

  // Round to 2 decimals
  return Math.round(newPrice * 100) / 100;
}

exports.updateStockPrices = onSchedule("every 2 minutes", async () => {
  try {
    const snapshot = await db.collection("stocks").get();
    if (snapshot.empty) {
      console.log("No stocks found to update.");
      return null;
    }

    const updates = snapshot.docs.map(async (doc) => {
      const symbol = doc.id;
      const data = doc.data();

      // Destructure with defaults
      const {
        price: lastPrice,
        minPrice = 100,
        maxPrice = 500,
        maxChangePercent = 0.05,
        manualPrice = null
      } = data;

      let newPrice;

      if (manualPrice !== null && typeof manualPrice === "number" && manualPrice >= minPrice && manualPrice <= maxPrice) {
        // Use manual override price and reset manualPrice after applying
        newPrice = manualPrice;
        await db.collection("stocks").doc(symbol).set({
          price: newPrice,
          manualPrice: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`Manual price set for ${symbol}: $${newPrice}`);
      } else {
        // Generate a new price based on random fluctuation
        newPrice = generateRandomPrice(lastPrice, minPrice, maxPrice, maxChangePercent);
        await db.collection("stocks").doc(symbol).set({
          price: newPrice,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`Updated ${symbol} price to $${newPrice}`);
      }
    });

    await Promise.all(updates);
    return null;

  } catch (error) {
    console.error("Error updating stock prices:", error);
    return null;
  }
});
