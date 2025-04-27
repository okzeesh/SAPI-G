require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
require("./config/passport");


const RequestLog = require('./models/requestLog');
const User = require('./models/user');
const BlacklistedIp = require('./models/blacklistedIp');
const Threat = require('./models/threat');
const threatRoutes = require('./routes/threatRoute');

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

// ✅ Register a New User
app.post('/api/register', async (req, res) => {
    try {
      const { email, password, role } = req.body;
  
      // Check if email or password is missing
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
  
      // Check if the email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already taken" });
      }
  
      // Hash the password before saving it
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Hashed password during registration:", hashedPassword); // Log the hashed password
      


      // Create the new user
      const newUser = new User({
        email,
        password: hashedPassword, // Store the hashed password
        role: role || "user"
      });

      console.log("User to be saved:", newUser);
  
      // Save the new user to the database
      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Error registering user" });
    }
  });

  // ✅ Login User & Generate JWT Token
  app.post('/api/login', async (req, res) => {
    console.log("Login payload:", req.body);
  
    const { email, password } = req.body;
  
    try {
      // Find the user based on the email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid Email' });
      }
  
      console.log("Stored hash:", user.password); // Log the stored hash from the DB
      console.log("Password to compare:", password); // Log the plaintext password for comparison
      
      // Compare the entered password with the hashed password stored in the database
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Password match:", isMatch); // Log whether the password comparison is successful
  
      // If the passwords do not match, return an error
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
  
      // Generate a JWT token for the user
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ✅ Log Threats
app.post('/api/threats', authenticateJWT, async (req, res) => {
    try {
        const { ip, threatType } = req.body;
        const newThreat = new Threat({ ip, threatType });
        await newThreat.save();
        res.status(201).json({ message: "Threat logged successfully" });
    } catch (error) {
        console.error("Error logging threat:", error);
        res.status(500).json({ message: "Error logging threat" });
    }
});

// ✅ Get Request Logs (Only Admins)
app.get('/api/logs', authenticateJWT, authorizeRole("admin"), async (req, res) => {
    try {
        const logs = await RequestLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (error) {
        console.error("Error retrieving logs:", error);
        res.status(500).json({ message: "Error retrieving logs" });
    }
});

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

  // ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
