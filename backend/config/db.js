const mongoose = require('mongoose');
// const monbodburl="mongodb://localhost:27017/";
const monbodburl="mongodb+srv://loguser:Athvaitha%40%2B06@cluster0.9m18apu.mongodb.net/invent?retryWrites=true&w=majority";
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