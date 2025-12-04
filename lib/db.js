import mongoose from "mongoose";

async function connectToDatabase() {
    const uri = process.env.MONGO_URI;
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
        autoIndex: true,
    });
    return mongoose.connection;
}

export default {connectToDatabase};