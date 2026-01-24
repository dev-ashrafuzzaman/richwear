import "./env.js"; 
import { MongoClient } from "mongodb";

let db;
let client;

export const connectDB = async () => {
  client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  db = client.db(process.env.DB_NAME);

  // 🔑 attach client for session usage
  db.client = client;

  console.log("✅ MongoDB connected");
};

export const getDB = () => db;
