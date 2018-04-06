'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

const createJWT = require('../utils/create-auth-token');

describe('Noteful API - Login', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';
  const exampleUser = { username, password, fullname };
  
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  
  beforeEach(function () {
    // noop
    return User.create(exampleUser);
  });
  
  afterEach(function () {
      //alternatively you can remove a user... return User.remove()
    return mongoose.connection.db.dropDatabase();
  });
  
  after(function () {
    return mongoose.disconnect();
  });
});