const express = require("express");
const router = express.Router();
const Analytics = require("../models/Analytics");
const Url = require("../models/Url");

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

// Get URL Analytics
router.get("/analytics/:alias", async (req, res) => {
  const { alias } = req.params;

  try {
    const url = await Url.findOne({ shortUrl: alias });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    const analytics = await Analytics.find({ shortUrl: alias });

    const totalClicks = analytics.length;
    const uniqueUsers = new Set(analytics.map(a => a.ipAddress)).size;

    const clicksByDate = analytics.reduce((acc, curr) => {
      const date = curr.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const osType = analytics.reduce((acc, curr) => {
      const osName = curr.userAgent.split(' ')[0]; // Simplified OS extraction
      if (!acc[osName]) {
        acc[osName] = { uniqueClicks: 0, uniqueUsers: new Set() };
      }
      acc[osName].uniqueClicks += 1;
      acc[osName].uniqueUsers.add(curr.ipAddress);
      return acc;
    }, {});

    const deviceType = analytics.reduce((acc, curr) => {
      const deviceName = curr.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
      if (!acc[deviceName]) {
        acc[deviceName] = { uniqueClicks: 0, uniqueUsers: new Set() };
      }
      acc[deviceName].uniqueClicks += 1;
      acc[deviceName].uniqueUsers.add(curr.ipAddress);
      return acc;
    }, {});

    res.status(200).json({
      totalClicks,
      uniqueUsers,
      clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
      osType: Object.entries(osType).map(([osName, data]) => ({
        osName,
        uniqueClicks: data.uniqueClicks,
        uniqueUsers: data.uniqueUsers.size,
      })),
      deviceType: Object.entries(deviceType).map(([deviceName, data]) => ({
        deviceName,
        uniqueClicks: data.uniqueClicks,
        uniqueUsers: data.uniqueUsers.size,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Topic-Based Analytics
router.get("/analytics/topic/:topic", async (req, res) => {
  const { topic } = req.params;

  try {
    const urls = await Url.find({ topic });

    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found for this topic" });
    }

    const analytics = await Analytics.find({ shortUrl: { $in: urls.map(url => url.shortUrl) } });

    const totalClicks = analytics.length;
    const uniqueUsers = new Set(analytics.map(a => a.ipAddress)).size;

    const clicksByDate = analytics.reduce((acc, curr) => {
      const date = curr.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const urlsAnalytics = urls.map(url => {
      const urlAnalytics = analytics.filter(a => a.shortUrl === url.shortUrl);
      return {
        shortUrl: url.shortUrl,
        totalClicks: urlAnalytics.length,
        uniqueUsers: new Set(urlAnalytics.map(a => a.ipAddress)).size,
      };
    });

    res.status(200).json({
      totalClicks,
      uniqueUsers,
      clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
      urls: urlsAnalytics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Overall Analytics
router.get("/analytics/overall", isAuthenticated, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id });

    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found for this user" });
    }

    const analytics = await Analytics.find({ shortUrl: { $in: urls.map(url => url.shortUrl) } });

    const totalUrls = urls.length;
    const totalClicks = analytics.length;
    const uniqueUsers = new Set(analytics.map(a => a.ipAddress)).size;

    const clicksByDate = analytics.reduce((acc, curr) => {
      const date = curr.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const osType = analytics.reduce((acc, curr) => {
      const osName = curr.userAgent.split(' ')[0]; // Simplified OS extraction
      if (!acc[osName]) {
        acc[osName] = { uniqueClicks: 0, uniqueUsers: new Set() };
      }
      acc[osName].uniqueClicks += 1;
      acc[osName].uniqueUsers.add(curr.ipAddress);
      return acc;
    }, {});

    const deviceType = analytics.reduce((acc, curr) => {
      const deviceName = curr.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
      if (!acc[deviceName]) {
        acc[deviceName] = { uniqueClicks: 0, uniqueUsers: new Set() };
      }
      acc[deviceName].uniqueClicks += 1;
      acc[deviceName].uniqueUsers.add(curr.ipAddress);
      return acc;
    }, {});

    res.status(200).json({
      totalUrls,
      totalClicks,
      uniqueUsers,
      clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
      osType: Object.entries(osType).map(([osName, data]) => ({
        osName,
        uniqueClicks: data.uniqueClicks,
        uniqueUsers: data.uniqueUsers.size,
      })),
      deviceType: Object.entries(deviceType).map(([deviceName, data]) => ({
        deviceName,
        uniqueClicks: data.uniqueClicks,
        uniqueUsers: data.uniqueUsers.size,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;