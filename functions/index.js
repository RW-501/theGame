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
    // Update stocks collection
    const stockSnapshot = await db.collection("stocks").get();
    if (stockSnapshot.empty) {
      console.log("No stocks found to update.");
    } else {
      const stockUpdates = stockSnapshot.docs.map(async (doc) => {
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

        const updatedHistory = [...priceHistory.slice(-4), newPrice];

        await db.collection("stocks").doc(symbol).set({
          price: newPrice,
          lastPrice,
          priceHistory: updatedHistory,
          manualPrice: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`Updated ${symbol} from $${lastPrice} to $${newPrice} | History: [${updatedHistory.join(", ")}]`);
      });

      await Promise.all(stockUpdates);
    }

    // Update tiles with stockMarketListed: true
    const tileSnapshot = await db.collection("tiles").where("stockMarketListed", "==", true).get();
    if (tileSnapshot.empty) {
      console.log("No stockMarketListed tiles found.");
    } else {
      const tileUpdates = tileSnapshot.docs.map(async (doc) => {
        const tileData = doc.data();
        const docRef = doc.ref;

        const {
          stockPrice = tileData.value,

          stockMaxChangePercent = 0.05,
          stockPriceHistory = []
        } = tileData;

        const newPrice = generateRandomPrice(stockPrice, stockMaxChangePercent);
        const updatedHistory = [...stockPriceHistory.slice(-4), newPrice];

        await docRef.set({
          stockLastPrice: stockPrice,
          stockPrice: newPrice,
          stockPriceHistory: updatedHistory,
          stockMinPrice: tileData.value / 2,
          stockMaxPrice: tileData.value * 2,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`Updated tile ${doc.id} stockPrice to $${newPrice} | History: [${updatedHistory.join(", ")}]`);
      });

      await Promise.all(tileUpdates);
    }

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



exports.payEmployeesDaily = onSchedule("every 24 hours", async (event) => {
  const playersSnapshot = await db.collection("players").get();
  const tilesSnapshot = await db.collection("tiles").get();

  const tilesMap = {};
  tilesSnapshot.forEach(doc => {
    tilesMap[doc.id] = doc.data();
  });

  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  for (const playerDoc of playersSnapshot.docs) {
    const player = playerDoc.data();
    const playerRef = playerDoc.ref;
    const jobs = player.jobs || [];

    let totalPay = 0;

    jobs.forEach(job => {
      const [x, y] = job.companyCoords;
      const tileId = `x${x}-y${y}`;
      const tile = tilesMap[tileId];

      if (tile && tile.type === "company") {
        const pay = Math.floor(tile.value / 20);
        totalPay += pay;
      }
    });

    if (totalPay > 0) {
      // Update bank
      const newBank = (player.bank || 0) + totalPay;
      batch.update(playerRef, { bank: newBank });

      // Create notification
      const notifRef = db.collection("notifications").doc(); // or use playerRef.collection("notifications") if you use subcollections
      batch.set(notifRef, {
        uid: playerDoc.id,
        type: "payday",
        title: "Pay Received 💰",
        message: `You earned $${totalPay.toLocaleString()} from your jobs today.`,
        amount: totalPay,
        read: false,
        createdAt: timestamp,
      });
    }
  }

  await batch.commit();
  console.log("✅ Daily pay and notifications processed.");
  return null;
});


// firebase deploy --only functions
// firebase functions:log
