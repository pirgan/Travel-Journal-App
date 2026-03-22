import mongoose from 'mongoose';

let connected = false;

export async function connectOnce() {
  if (connected || mongoose.connection.readyState === 1) {
    connected = true;
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  connected = true;
}
