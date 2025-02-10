const express = require("express");
const passport = require("passport");
const session = require("express-session");
const setupSwagger = require('./utils/swaggerConfig');
const ShortURLRoute = require('./routes/ShortURLRoute');
const connectDB = require("./config");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const authRoutes = require("./routes/AuthRoutes"); // Import AuthRoute
const analyticRoute = require("./routes/AnalyticRoute");
const User = require("./models/User"); // Import the User model
require("dotenv").config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails } = profile;
      try {
        let user = await User.findOne({ googleId: id });
        if (!user) {
          user = await User.create({
            googleId: id,
            displayName,
            email: emails[0].value,
          });
        }
        done(null, user);
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id).then((user) => done(null, user))
);

// Routes
// home route
app.get("/", async (req, res) => {
  try {
    res.status(200).json({ message: "App works", status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", status: "error" });
  }
});
// auth routes
app.use("/auth", authRoutes); // Use the auth routes
// short URL routes
app.use("/api", ShortURLRoute);
app.use("/api", analyticRoute);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // Export the Express app instance
