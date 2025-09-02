const mongoose = require('mongoose');
const { mongo } = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(mongo.uri);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;