const mongoose = require("mongoose");
require("dotenv").config();

const collections = [
  "users",
  "sellers",
  "products",
  "orders",
  "carts",
];

const getDatabase = async (dbName) => {
  const uri = process.env.MONGODB_URI.replace(
    /\/[^/?]+(\?|$)/,
    `/${dbName}$1`
  );

  const connection = await mongoose.createConnection(uri).asPromise();

  return connection;
};

const countCollections = async (connection, dbName) => {
  console.log(`\n${dbName}:`);

  for (const collectionName of collections) {
    try {
      const collection = connection.db.collection(collectionName);
      const count = await collection.countDocuments();

      console.log(`${collectionName}: ${count}`);
    } catch (error) {
      console.log(`${collectionName}: unable to check`);
    }
  }
};

const compareDatabases = async () => {
  let testConnection;
  let vendoraConnection;

  try {
    console.log("Connecting to MongoDB...");

    testConnection = await getDatabase("test");
    vendoraConnection = await getDatabase("vendora");

    console.log("MongoDB connected.");

    await countCollections(testConnection, "test");
    await countCollections(vendoraConnection, "vendora");

    console.log("\nComparison completed.");
  } catch (error) {
    console.error("\nComparison failed:");
    console.error(error.message);
  } finally {
    if (testConnection) {
      await testConnection.close();
    }

    if (vendoraConnection) {
      await vendoraConnection.close();
    }

    process.exit(0);
  }
};

compareDatabases();