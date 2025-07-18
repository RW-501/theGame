const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function to update stock prices every 2 minutes
 */
exports.updateStockPrices = functions.pubsub.schedule("every 2 minutes").onRun(async () => {
  const snapshot = await db.collection("stocks").get();

  const updates = snapshot.docs.map(async (doc) => {
    const symbol = doc.id;
    const currentData = doc.data();
    const newPrice = generateRandomPrice(
      currentData.minPrice || 100,
      currentData.maxPrice || 500
    );

    await db.collection("stocks").doc(symbol).set({
      price: newPrice,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Updated ${symbol} to $${newPrice}`);
  });

  await Promise.all(updates);
  return null;
});

/**
 * Generates a random stock price between min and max, with a slight fluctuation.
 */
function generateRandomPrice(min, max) {
  const base = Math.random() * (max - min) + min;
  const change = (Math.random() - 0.5) * 10; // +/- 5
  return Math.round((base + change) * 100) / 100;
}
