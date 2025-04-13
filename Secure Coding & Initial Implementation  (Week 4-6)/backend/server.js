require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const RequestLog = require('./models/requestLog');
const User = require('./models/user');
const BlacklistedIp = require('./models/blacklistedIp');
const Threat = require('./models/threat');

console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('tiny'));

// ✅ Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP. Try again later.",
});
app.use(limiter);

