const mongoose = require("mongoose");
require("dotenv").config();

const collections = [
  "users",
  "sellers",
  "products",
  "orders",
  "carts",
];

const getDatabaseUri = (dbName) => {
  return process.env.MONGODB_URI.replace(
    /\/[^/?]+(\?|$)/,
    `/${dbName}$1`
  );
};

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "object" && value.$oid) {
    return value.$oid;
  }

  return value.toString();
};

const inspectDatabase = async (connection, databaseName) => {
  console.log(`\n========== ${databaseName.toUpperCase()} ==========`);

  for (const collectionName of collections) {
    const collection = connection.db.collection(collectionName);

    const documents = await collection.find({}).limit(20).toArray();

    console.log(`\n${collectionName}: ${documents.length} checked`);

    for (const document of documents) {
      const importantFields = {};

      if (document._id) {
        importantFields._id = getId(document._id);
      }

      if (document.user) {
        importantFields.user = getId(document.user);
      }

      if (document.seller) {
        importantFields.seller = getId(document.seller);
      }

      if (document.product) {
        importantFields.product = getId(document.product);
      }

      if (document.buyer) {
        importantFields.buyer = getId(document.buyer);
      }

      if (document.order) {
        importantFields.order = getId(document.order);
      }

      if (document.userId) {
        importantFields.userId = getId(document.userId);
      }

      if (document.sellerId) {
        importantFields.sellerId = getId(document.sellerId);
      }

      if (document.productId) {
        importantFields.productId = getId(document.productId);
      }

      if (Object.keys(importantFields).length > 1) {
        console.log(importantFields);
      }
    }
  }
};

const run = async () => {
  let testDb;
  let vendoraDb;

  try {
    console.log("Connecting to MongoDB...");

    testDb = await mongoose
      .createConnection(getDatabaseUri("test"))
      .asPromise();

    vendoraDb = await mongoose
      .createConnection(getDatabaseUri("vendora"))
      .asPromise();

    console.log("MongoDB connected.");

    await inspectDatabase(testDb, "test");
    await inspectDatabase(vendoraDb, "vendora");

    console.log("\nRelationship check completed.");
    console.log("No data was changed.");
  } catch (error) {
    console.error("\nError:", error.message);
  } finally {
    if (testDb) {
      await testDb.close();
    }

    if (vendoraDb) {
      await vendoraDb.close();
    }
  }
};

run();