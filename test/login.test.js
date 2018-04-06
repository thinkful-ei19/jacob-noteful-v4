'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const seedUsers = require('../db/seed/users');

const expect = chai.expect;

chai.use(chaiHttp);

const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

describe('Noteful API - Login', function () {
  const username = 'user0';
  const fullname = 'User Zero';
  const id = '333333333333333333333300';
  const password = 'password';
  
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  
  beforeEach(function () {
    // noop
    return User.insertMany(seedUsers);
  });
  
  afterEach(function () {
    //alternatively you can remove a user... return User.remove()
    return mongoose.connection.db.dropDatabase();
  });
  
  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/login', function () {
    describe('POST', function () {
      it('Should return a valid auth token', function () {
        return chai.request(app)
          .post('/api/login')
          .send({ username, password })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.authToken).to.be.a('string');

            const payload = jwt.verify(res.body.authToken, JWT_SECRET);

            expect(payload.user).to.not.have.property('password');
            expect(payload.user).to.deep.equal({ id, username, fullname });
          });
      });
      it('Should reject requests with no credentials', function () {
        return chai.request(app)
          .post('/api/login')
          .send()
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Bad Request');
          });
      });
      it('Should reject requests with incorrect usernames', function () {
        const exLoginUser = { username:'incorrect', password };
        return chai.request(app)
          .post('/api/login')
          .send(exLoginUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(401);
            expect(res.body.message).to.equal('Unauthorized');
          });
      });
      it('Should reject requests with incorrect passwords', function () {
        const exLoginUser = { username, password:'wrong pass dummy'};
        return chai.request(app)
          .post('/api/login')
          .send(exLoginUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(401);
            expect(res.body.message).to.equal('Unauthorized');
          });
      });
    });
  });
});