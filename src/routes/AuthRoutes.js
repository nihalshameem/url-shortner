const express = require('express');
const passport = require('passport');

const router = express.Router();

// Route: Google authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Route: Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// Route: Profile
router.get('/profile', (req, res) => {
  if (!req.user) return res.redirect('/auth/google');
  res.json({ user: req.user });
});

module.exports = router;
