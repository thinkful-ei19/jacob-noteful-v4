'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const User = require('../models/user');

/*const passport = require('passport');*/
/*const authjwt = passport.authenticate('jwt', { session: false, failWithError: true });*/

router.get('/users', /*authjwt,*/ (req, res, next) => {

  User.find()
    .sort('username')
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

// POST ENDPOINT TO CREATE A USER
router.post('/users', (req, res, next) => {
  const { fullname, username, password } = req.body;

  if (username === '') {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Must be atleast 1 characters long',
    });
  }

  if (!username) {

    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'username required',
      location: 'username'
    });
  }

  if (!password) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'password required',
      location: 'password'
    });
  }

  if (typeof username !== 'string') {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'expecting string for username',
      location: 'username'
    });
  }

  if (typeof password !== 'string') {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'expecting string for password',
      location: 'password'
    });
  }
  
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }
  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }
  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname: fullname.trim()
      };
      return User.create(newUser)
        .then(result => {
          return res.status(201).location(`/api/users/${result.id}`).json(result);
        })
        .catch(err => {
          if (err.code === 11000) {
            err = new Error('The username already exists');
            err.status = 400;
          }
          next(err);
        });
    });
});

module.exports = router;