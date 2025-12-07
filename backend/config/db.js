const mongoose = require('mongoose');

const monbodburl = "mongodb+srv://vishnumanikandan:y9CF5NWxWDWErRTJ@cluster0.dt9pqrb.mongodb.net/test?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(monbodburl);
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
