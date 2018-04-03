'use strict';

const express = require('express');
const router = express.Router();

const passport = require('passport');

const jwt = require('jsonwebtoken');
const config = require('../config');

const { JWT_SECRET, JWT_EXPIRY } = config;

function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);
// const jwtAuth = passport.authenticate('jwt', options);
// POST USER INFO TO LOGIN TO SERVER, USES LOCAL FILE ../passport/local.js
router.post('/login', localAuth, function (req, res) {
  const authToken = createAuthToken(req.user);
  return res.json({ authToken });
});

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;