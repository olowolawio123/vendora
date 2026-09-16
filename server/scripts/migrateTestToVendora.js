const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { EJSON } = require("bson");
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

const createBackup = async (connection) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupDirectory = path.join(
    __dirname,
    "..",
    "backups",
    `vendora-before-migration-${timestamp}`
  );

  fs.mkdirSync(backupDirectory, {
    recursive: true,
  });

  console.log("\nCreating backup of current vendora database...");

  for (const collectionName of collections) {
    const collection = connection.db.collection(
      collectionName
    );

    const documents = await collection
      .find({})
      .toArray();

    const filePath = path.join(
      backupDirectory,
      `${collectionName}.json`
    );

    fs.writeFileSync(
      filePath,
      EJSON.stringify(documents, null, 2),
      "utf8"
    );

    console.log(
      `Backup created: ${collectionName} (${documents.length} documents)`
    );
  }

  return backupDirectory;
};

const readTestData = async (connection) => {
  const data = {};

  console.log("\nReading data from test database...");

  for (const collectionName of collections) {
    const collection = connection.db.collection(
      collectionName
    );

    data[collectionName] = await collection
      .find({})
      .toArray();

    console.log(
      `Read ${collectionName}: ${data[collectionName].length} documents`
    );
  }

  return data;
};

const migrate = async () => {
  let testDb;
  let vendoraDb;
  let session;

  try {
    console.log("Connecting to MongoDB...");

    testDb = await mongoose
      .createConnection(getDatabaseUri("test"))
      .asPromise();

    vendoraDb = await mongoose
      .createConnection(getDatabaseUri("vendora"))
      .asPromise();

    console.log("MongoDB connected.");

    /*
     * STEP 1:
     * Read all old data before changing anything.
     */
    const testData = await readTestData(testDb);

    /*
     * STEP 2:
     * Create a backup of the current vendora database.
     */
    const backupDirectory = await createBackup(
      vendoraDb
    );

    console.log("\nBackup location:");
    console.log(backupDirectory);

    /*
     * STEP 3:
     * Start a MongoDB transaction.
     */
    session = await vendoraDb.startSession();

    session.startTransaction();

    console.log("\nMigration transaction started.");

    /*
     * STEP 4:
     * Clear the current vendora collections.
     *
     * The old test database is NOT modified.
     */
    for (const collectionName of collections) {
      const collection = vendoraDb.db.collection(
        collectionName
      );

      await collection.deleteMany({}, { session });

      console.log(
        `Cleared vendora.${collectionName}`
      );
    }

    /*
     * STEP 5:
     * Insert the old test data while preserving
     * the original MongoDB _id values.
     */
    for (const collectionName of collections) {
      const documents = testData[collectionName];

      if (documents.length === 0) {
        continue;
      }

      const collection = vendoraDb.db.collection(
        collectionName
      );

      await collection.insertMany(documents, {
        session,
        ordered: true,
      });

      console.log(
        `Migrated ${collectionName}: ${documents.length} documents`
      );
    }

    /*
     * STEP 6:
     * Commit everything together.
     */
    await session.commitTransaction();

    console.log("\n=================================");
    console.log("MIGRATION COMPLETED SUCCESSFULLY");
    console.log("=================================");

    console.log("\nFinal migrated records:");

    for (const collectionName of collections) {
      console.log(
        `${collectionName}: ${testData[collectionName].length}`
      );
    }

    console.log("\nBackup:");
    console.log(backupDirectory);

    console.log(
      "\nThe test database was not changed."
    );
  } catch (error) {
    console.error("\n=================================");
    console.error("MIGRATION FAILED");
    console.error("=================================");

    console.error(error.message);

    if (session) {
      try {
        await session.abortTransaction();

        console.log(
          "\nTransaction rolled back."
        );
        console.log(
          "The vendora database should be unchanged."
        );
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError.message
        );
      }
    }
  } finally {
    if (session) {
      await session.endSession();
    }

    if (testDb) {
      await testDb.close();
    }

    if (vendoraDb) {
      await vendoraDb.close();
    }
  }
};

migrate();