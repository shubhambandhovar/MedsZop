const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
  const email = "admin@medszop.com";
  const password = "admin123";
  const name = "Admin";
  const role = "admin";

  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({ email, password: hashedPassword, name, role });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }
  mongoose.disconnect();
}

seedAdmin();
