const {onSchedule} = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions"); // still needed for other features
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.updateStockPrices = onSchedule("every 2 minutes", async () => {
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
    }, {merge: true});

    console.log(`Updated ${symbol} to $${newPrice}`);
  });

  await Promise.all(updates);
  return null;
});
