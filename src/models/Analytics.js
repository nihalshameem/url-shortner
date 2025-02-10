const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
  shortUrl: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  // Add more fields for geolocation data if needed
});

module.exports = mongoose.model("Analytics", AnalyticsSchema);
