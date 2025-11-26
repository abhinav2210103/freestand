import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function connectToDatabase() {
  // ensure the client is connected; the modern driver no longer exposes `topology`
  await client.connect();

  const db = client.db(); // uses database from URI
  return { client, db };  // return object
}
