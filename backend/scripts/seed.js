require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../Models/Product');
const User = require('../Models/User');
const products = require('../data/products'); // the shopping list of sample products

// An "async" function wrapped in ( ) and called right away
(async () => {
  // Connect to the database
  await mongoose.connect(process.env.MONGO_URI);

  // STEP 1: clear the shelf, then put all the sample products on it
  await Product.deleteMany();
  await Product.insertMany(products);
  console.log(`${products.length} products added`);

  // STEP 2: create the admin, using the details from the .env file
  const email = (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase();
  const exists = await User.findOne({ email }); // is there already an admin?

  if (!exists) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin', // THIS is what makes them the boss
    });
    console.log(`Admin created: ${email}`);
  } else {
    console.log('Admin already exists');
  }

  // Hang up the database phone
  await mongoose.disconnect();
})();