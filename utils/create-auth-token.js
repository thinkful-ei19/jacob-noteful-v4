'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

const { JWT_SECRET, JWT_EXPIRY } = config;

function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY
  });
}

module.exports = createAuthToken;