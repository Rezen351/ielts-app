import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    // Opsi khusus untuk Azure Cosmos DB for MongoDB agar lebih stabil
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 detik
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Cosmos DB memerlukan SSL/TLS
      tls: true,
      minPoolSize: 1,
      maxPoolSize: 10,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[MongoDB] Connected to Cosmos DB");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("[MongoDB] Connection Error:", e);
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;
