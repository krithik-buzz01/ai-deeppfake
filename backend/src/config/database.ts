import mongoose from "mongoose";
import { env } from "./env.js";

let mongodInstance: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = env.MONGODB_URI;

  try {
    // Attempt standard connection
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose;
  } catch (err: any) {
    console.warn(`[Database] External MongoDB connection failed (${err.message}). Initializing isolated in-memory Mongo engine for local/test execution...`);
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] In-memory MongoDB initialized successfully at ${inMemoryUri}`);
      return mongoose;
    } catch (inMemErr: any) {
      console.error(`[Database] Fatal: Unable to initialize in-memory MongoDB: ${inMemErr.message}`);
      throw inMemErr;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

export function getDatabaseStatus(): { status: string; host?: string; dbName?: string } {
  const state = mongoose.connection.readyState;
  const stateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  return {
    status: stateMap[state] || "unknown",
    host: mongoose.connection.host,
    dbName: mongoose.connection.name
  };
}
