import mongoose from "mongoose";
import { DB_URI,NODE_ENV } from "../config/env.js";

if(!DB_URI){
    throw new Error("DB_URI is not defined in environment variables");

}
const connectToDB = async () => {
    try {
        await mongoose.connect(DB_URI);
       
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process with failure
    }
}
if (NODE_ENV !== 'production') {
    mongoose.set('debug', true);
}

export default connectToDB;