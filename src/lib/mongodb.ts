import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
export const DB_NAME = process.env.MONGODB_DB || "janvi";
if (!uri) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Please add it to your .env.local"
  );
}

const options = {};

let client;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: any;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
