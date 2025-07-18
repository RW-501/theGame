exports.updateStockPrices = functions.pubsub.schedule("every 2 minutes").onRun(async () => {
  const snapshot = await db.collection("stocks").get();

  const updates = snapshot.docs.map(async (doc) => {
    const symbol = doc.id;
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
