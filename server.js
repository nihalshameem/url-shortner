const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const connectDB = require('./src/config');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
require('dotenv').config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// User schema and model
const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
});
const User = mongoose.model('User', userSchema);

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
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
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then((user) => done(null, user)));

// home route
app.get("/", async (req, res) => {

  try {
    res
      .status(200)
      .json({ message: "App works", status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", status: "error" });
  }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

app.get('/profile', (req, res) => {
  if (!req.user) return res.redirect('/auth/google');
  res.json({ user: req.user });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
