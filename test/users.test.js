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

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    // noop
    return User.ensureIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };

        let res;
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('username required');
            expect(res.body.location).to.equal('username');
          });
      });

      /**
       * COMPLETE ALL THE FOLLOWING TESTS
       */
      it('Should reject users with missing password', function () {
        const testUser = { username, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('password required');
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string username', function () {
        const testUser = { username: 5, fullname, password };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('expecting string for username');
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with non-string password', function () {
        const testUser = { username, fullname, password:5 };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('expecting string for password');
            expect(res.body.location).to.equal('password');
          });
      });

      it('Should reject users with non-trimmed username', function () {
        const badUsername = ` ${username} `;
        const testUser = { username: badUsername, fullname, password };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
          });
      });
      it('Should reject users with non-trimmed password', function () {
        const badPassword = ` ${password} `;
        const testUser = { username, fullname, password:badPassword };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
          });
      });
      it('Should reject users with empty username', function () {
        const testUser = { username:'', fullname, password };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Must be atleast 1 characters long');
          });
      });
      it('Should reject users with password less than 8 characters', function () {
        const testUser = { username, fullname, password:'abc' };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Must be at least 8 characters long');
          });
      });
      it('Should reject users with password greater than 72 characters', function() {
        const testUser = { username, fullname, password:'thispasswordiswaytoolonglikewhywouldyouhaveapasswordthislonghahahahahahahahahahaha? wowthe password is still going omg get a life with your long password' };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Must be at most 72 characters long');
          });
      });
      it('Should reject users with duplicate username', function() {
        const testUser = { username, password, fullname };
        return User.create(testUser)
          .then(function() {
            return chai.request(app).post('/api/users').send(testUser);
          })
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('The username already exists');
          });
      });
      it('Should trim fullname', function() {
        const testUser = { username, fullname:' Example User ', password };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.fullname).to.equal(fullname);
            return User.findOne({ username });
          })
          .then(res => {
            expect(res.fullname).to.equal(fullname);
          });
      });
    });

    describe('GET', function () {
      let jwt;
      const username = 'exampleUser';
      const password = 'examplePass';
      const fullname = 'Example User';
      before(function () {
        const user = User.create({username, password, fullname});
        jwt = createJWT(user);
      });
      it('Should return an empty array initially', function () {
        return chai.request(app).get('/api/users').set('Bearer', jwt)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body).to.have.length(1);
          });
      });
      it('Should return an array of users', function () {
        const testUser0 = {
          username: `${username}`,
          password: `${password}`,
          fullname: `${fullname}`
        };
        const testUser1 = {
          username: `${username}1`,
          password: `${password}1`,
          fullname: `${fullname}1`
        };
        const testUser2 = {
          username: `${username}2`,
          password: `${password}2`,
          fullname: `${fullname}2`
        };
        const testArr = [testUser0, testUser1, testUser2];
        return chai.request(app).post('/api/users').send(testArr[0])
          .then(() => {return chai.request(app).post('/api/users').send(testArr[1]);})
          .then(() => {return chai.request(app).post('/api/users').send(testArr[2]);})
          .then(() => {
            return chai.request(app).get('/api/users').set('Bearer', jwt);
          })
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0].username).to.equal(testUser0.username);
            expect(res.body[0].fullname).to.equal(testUser0.fullname);
            expect(res.body[1].username).to.equal(testUser1.username);
            expect(res.body[1].fullname).to.equal(testUser1.fullname);
            expect(res.body[2].username).to.equal(testUser2.username);
            expect(res.body[2].fullname).to.equal(testUser2.fullname);
          });
      });
    });
  });
});