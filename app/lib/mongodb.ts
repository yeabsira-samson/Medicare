import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!

declare global {
  var _mongoClientPromise: Promise<MongoClient> 
}
const client = new MongoClient(uri)
const clientPromise: Promise<MongoClient> = globalThis._mongoClientPromise || client.connect()

if (!globalThis._mongoClientPromise) {
  globalThis._mongoClientPromise = clientPromise
}

export async function connectDb() {
  const client = await clientPromise
  return client.db(dbName)
}