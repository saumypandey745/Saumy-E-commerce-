const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('@ecommerce/shared');

const app = express();
const PORT = process.env.PORT || 8001;

// Connect Database
connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', authRoutes); // Gateway maps /api/auth to /

// Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
