const mongoose = require("mongoose");
require("dotenv").config();

const getDatabaseUri = (dbName) => {
  return process.env.MONGODB_URI.replace(
    /\/[^/?]+(\?|$)/,
    `/${dbName}$1`
  );
};

const run = async () => {
  let testDb;
  let vendoraDb;

  try {
    testDb = await mongoose
      .createConnection(getDatabaseUri("test"))
      .asPromise();

    vendoraDb = await mongoose
      .createConnection(getDatabaseUri("vendora"))
      .asPromise();

    const fields = {
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
    };

    const testUsers = await testDb.db
      .collection("users")
      .find({}, { projection: fields })
      .toArray();

    const vendoraUsers = await vendoraDb.db
      .collection("users")
      .find({}, { projection: fields })
      .toArray();

    console.log("\nTEST USERS:");
    console.table(testUsers);

    console.log("\nVENDORA USERS:");
    console.table(vendoraUsers);

    console.log("\nNo data was changed.");
  } catch (error) {
    console.error("Error:", error.message);
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