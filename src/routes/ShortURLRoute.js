const express = require("express");
const router = express.Router();
const shortid = require("shortid");
const rateLimit = require("express-rate-limit");
const Url = require("../models/Url"); // Import the URL model
const Analytics = require("../models/Analytics"); // Import the Analytics model

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

// Custom rate limit for shorten route
const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests
  message: { message: "Too many shorten requests, please try again later." },
});

// Custom rate limit for fetch URLs route
const fetchUrlsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests
  message: {
    message: "Too many requests to fetch URLs, please try again later.",
  },
});

// Generate short URL
/**
 * @swagger
 * /shorten:
 *   post:
 *     summary: Generate a short URL
 *     tags: [URL]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 example: https://example.com
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *                 originalUrl:
 *                   type: string
 *       400:
 *         description: Missing or invalid input
 *       500:
 *         description: Server error
 */
router.post("/shorten", shortenLimiter, isAuthenticated, async (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ message: "Original URL is required" });
  }

  const shortUrl = shortid.generate();

  try {
    const newUrl = new Url({
      userId: req.user.id,
      originalUrl,
      shortUrl,
    });

    await newUrl.save();

    res.status(201).json({ shortUrl, originalUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all short URLs for a user
/**
 * @swagger
 * /urls:
 *   get:
 *     summary: Retrieve all short URLs for the authenticated user
 *     tags: [URL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       originalUrl:
 *                         type: string
 *                       shortUrl:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/urls", fetchUrlsLimiter, isAuthenticated, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id });
    res.status(200).json({ urls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Redirect short URL
router.get("/shorten/:alias", async (req, res) => {
  const { alias } = req.params;

  try {
    const url = await Url.findOne({ shortUrl: alias });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Log analytics data
    const analytics = new Analytics({
      shortUrl: alias,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
      // Add geolocation data if available
    });

    await analytics.save();

    res.redirect(url.originalUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
