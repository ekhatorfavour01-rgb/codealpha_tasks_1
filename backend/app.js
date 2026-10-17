const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./Middleware/errorMiddleware');

const app = express();

app.use(cors());

app.use(express.json());

// ---- THE DOORS ----
// Each line says: "if the URL starts with this, send the visitor to that file"
app.use('/api/auth', require('./Routes/authRoute'));         // sign up and log in
app.use('/api/users', require('./Routes/userRoute'));        // profile
app.use('/api/products', require('./Routes/productRoute'));  // products
app.use('/api/orders', require('./Routes/orderRoute'));      // orders
app.use('/api/payments', require('./Routes/paymentRoute'));  // paying (fake)
app.use('/api/admin', require('./Routes/adminRoute'));       // admin-only stuff


app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api', notFound);

app.use(errorHandler);

module.exports = app;