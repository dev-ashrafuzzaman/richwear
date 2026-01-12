import { MongoClient } from "mongodb";

let db;

export const connectDB = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("✅ MongoDB connected");
};

export const getDB = () => db;
