const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions"); // for other features
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

function generateRandomPrice(lastPrice, minPrice, maxPrice, maxChangePercent = 0.05) {
  if (!lastPrice || lastPrice <= 0) {
    lastPrice = (minPrice + maxPrice) / 2;
  }
  const maxDelta = lastPrice * maxChangePercent;
  const delta = (Math.random() * 2 - 1) * maxDelta;
  let newPrice = lastPrice + delta;
  newPrice = Math.min(Math.max(newPrice, minPrice), maxPrice);
  return Math.round(newPrice * 100) / 100;
}

// Normal update every 1 minutes (small changes)
exports.updateStockPrices = onSchedule("every 1 minutes", async () => {
  try {
    const snapshot = await db.collection("stocks").get();
    if (snapshot.empty) {
      console.log("No stocks found to update.");
      return null;
    }

    const updates = snapshot.docs.map(async (doc) => {
      const symbol = doc.id;
      const data = doc.data();
      const {
        price: lastPrice = 0,
        minPrice = 100,
        maxPrice = 500,
        maxChangePercent = 0.05,
        manualPrice = null,
        priceHistory = []
      } = data;

      let newPrice;
      if (
        manualPrice !== null &&
        typeof manualPrice === "number" &&
        manualPrice >= minPrice &&
        manualPrice <= maxPrice
      ) {
        newPrice = manualPrice;
      } else {
        newPrice = generateRandomPrice(lastPrice, minPrice, maxPrice, maxChangePercent);
      }

      // Keep only the last 4 prices and append the new one (total of 5)
      const updatedHistory = [...priceHistory.slice(-4), newPrice];

      await db.collection("stocks").doc(symbol).set({
        price: newPrice,
        lastPrice, // store the previous price
        priceHistory: updatedHistory,
        manualPrice: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`Updated ${symbol} from $${lastPrice} to $${newPrice} | History: [${updatedHistory.join(", ")}]`);
    });

    await Promise.all(updates);
    return null;
  } catch (error) {
    console.error("Error updating stock prices:", error);
    return null;
  }
});

// Big event every 4 hours
exports.marketEventBigChange = onSchedule("every 4 hours", async () => {
  try {
    console.log("Running big market event!");

    const snapshot = await db.collection("stocks").get();
    if (snapshot.empty) {
      console.log("No stocks found for market event.");
      return null;
    }

    const bigChangePercent = 0.20; // 20% max change for big event
    const updates = snapshot.docs.map(async (doc) => {
      const symbol = doc.id;
      const data = doc.data();
      const { price: lastPrice, minPrice = 100, maxPrice = 500 } = data;

      // Force a large positive or negative dip/spike
      // Randomly choose -20% to +20%
      const delta = (Math.random() * 2 - 1) * (lastPrice * bigChangePercent);
      let newPrice = lastPrice + delta;
      newPrice = Math.min(Math.max(newPrice, minPrice), maxPrice);
      newPrice = Math.round(newPrice * 100) / 100;

      await db.collection("stocks").doc(symbol).set({
        price: newPrice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        event: "bigChange",
        eventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`Market event updated ${symbol} price to $${newPrice}`);
    });

    await Promise.all(updates);
    return null;
  } catch (error) {
    console.error("Error in market event big change:", error);
    return null;
  }
});


// firebase deploy --only functions
// firebase functions:log
