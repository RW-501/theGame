const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const stockSymbols = ["AAPL", "TSLA", "GME"];

exports.updateStockPrices = functions.pubsub.schedule("every 2 minutes").onRun(async () => {
  const updates = stockSymbols.map(async (symbol) => {
    const newPrice = generateRandomPrice(100, 500);
    await db.collection("stocks").doc(symbol).set({
      price: newPrice,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Updated ${symbol} to $${newPrice}`);
  });
  await Promise.all(updates);
  return null;
});

function generateRandomPrice(min, max) {
  const base = Math.random() * (max - min) + min;
  const change = (Math.random() - 0.5) * 10;
  return Math.round((base + change) * 100) / 100;
}
