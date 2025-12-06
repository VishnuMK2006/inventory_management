const mongoose = require('mongoose');
const monbodburl="mongodb://localhost:27017/";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(monbodburl);
    console.log(`MongoDB Connected: ${monbodburl}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;