import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
export const DB_NAME = process.env.MONGODB_DB || "janvi";
if (!uri) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Please add it to your .env.local"
  );
}

const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise ?? (() => {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
  return global._mongoClientPromise;
})();

export default clientPromise;
