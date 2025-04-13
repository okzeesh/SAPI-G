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

// ✅ IP Blacklist Middleware
app.use(async (req, res, next) => {
    try {
        const blacklistedIp = await BlacklistedIp.findOne({ ip: req.ip });
        if (blacklistedIp) {
            return res.status(403).json({ message: "Your IP is blacklisted", reason: blacklistedIp.reason });
        }
        next();
    } catch (error) {
        console.error("Error checking blacklisted IP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: "Access Denied - No Token Provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        console.error("Token Verification Failed:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// ✅ Role-Based Access Control (Only Admins can access certain routes)
const authorizeRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: "Access Denied - Insufficient Permissions" });
    }
    next();
};

// ✅ Request Logging Middleware (Logs After Response is Sent)
app.use(async (req, res, next) => {
    res.on('finish', async () => {
        try {
            const log = new RequestLog({
                ip: req.ip,
                endpoint: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode
            });
            await log.save();
            console.log("Request logged:", req.originalUrl);
        } catch (error) {
            console.error("Error logging request:", error);
        }
    });
    next();
});

// ✅ Secure API Endpoint
app.get('/secure-data', authenticateJWT, (req, res) => {
    res.json({ message: "Secure Data Accessed!", user: req.user });
});