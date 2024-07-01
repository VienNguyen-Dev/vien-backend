import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';


const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected !! DB host: ${connectionInstance.connection.host}/${DB_NAME}`)
  } catch (error) {
    console.log("MongoDB connected FAILED", error);
    process.exit(1);
  }
}

export default connectDB;