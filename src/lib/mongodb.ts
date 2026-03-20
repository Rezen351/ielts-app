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
  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // Bersihkan URI dari parameter retryWrites yang mungkin ada
  if (MONGODB_URI.includes('retrywrites=true')) {
    MONGODB_URI = MONGODB_URI.replace('retrywrites=true', 'retrywrites=false');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // Tingkatkan ke 30 detik
      socketTimeoutMS: 120000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: false,
      tls: true,
      minPoolSize: 1,
      maxPoolSize: 10,
      family: 4 // Paksa IPv4 untuk menghindari error ENETUNREACH pada IPv6
    };

    console.log("[MongoDB] Attempting to connect to Cosmos DB...");
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[MongoDB] Connected successfully to Cosmos DB");
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
