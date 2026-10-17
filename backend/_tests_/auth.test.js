require('dotenv').config();
const request = require('supertest'); // pretends to be a browser visiting the shop
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../Models/User');

// A made-up email so we don't clash with real people
const email = `test${Date.now()}@mail.com`;

// Before the tests: connect to the database
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// After the tests: clean up the fake person and hang up
afterAll(async () => {
  await User.deleteOne({ email });
  await mongoose.disconnect();
});

describe('Auth', () => {
  // Test 1: can a new person sign up?
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email, password: 'secret123' });
    
    expect(res.statusCode).toBe(201);      // we expect "created!"
    expect(res.body.token).toBeDefined();  // we expect a wristband
  });

  // Test 2: is a WRONG password refused?
  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);      // we expect "who are you?"
  });
});