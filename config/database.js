const mongoose = require('mongoose');

// Fail fast on queries issued while disconnected instead of buffering them indefinitely.
mongoose.set('bufferTimeoutMS', 15000);
mongoose.set('strictQuery', true);

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
  mongoose.connection.on('error', (error) => console.error(`MongoDB error: ${error.message}`));

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // Building indexes on boot is fine for this data size; disable with MONGODB_AUTO_INDEX=false.
      autoIndex: process.env.MONGODB_AUTO_INDEX !== 'false',
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
