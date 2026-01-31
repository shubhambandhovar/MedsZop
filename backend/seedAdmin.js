require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

require("dotenv").config({ path: "./.env" });

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE;
  const name = process.env.ADMIN_NAME;
  const role = process.env.ADMIN_ROLE;

  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      phone,
    });

    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }
  mongoose.disconnect();
}

seedAdmin();
