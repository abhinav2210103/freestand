// lib/mongodb.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(" Missing MONGODB_URI in .env.local");
}

let client: MongoClient | null = null;

export async function connectToDatabase() {
  if (!client) {
    client = await MongoClient.connect(uri!);
  }

  return client.db();
}
