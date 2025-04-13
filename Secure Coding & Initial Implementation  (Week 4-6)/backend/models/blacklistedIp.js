const mongoose = require('mongoose');

const blacklistedIpSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlacklistedIp', blacklistedIpSchema);
