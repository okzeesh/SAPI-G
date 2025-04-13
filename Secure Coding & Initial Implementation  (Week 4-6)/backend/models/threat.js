const mongoose = require('mongoose');

const threatSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    threatType: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Threat', threatSchema);
