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