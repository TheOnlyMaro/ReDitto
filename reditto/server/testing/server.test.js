const mongoose = require('mongoose');
require('dotenv').config();

describe('Database Connection Tests', () => {
  beforeAll(async () => {
    // Use test database URI
    const testUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/reditto-test';
    await mongoose.connect(testUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Database should connect successfully', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('Database name should be correct', () => {
    expect(mongoose.connection.name).toBeDefined();
  });
});

describe('Server Health Tests', () => {
  test('Environment variables should be loaded', () => {
    expect(process.env.PORT).toBeDefined();
  });
});
