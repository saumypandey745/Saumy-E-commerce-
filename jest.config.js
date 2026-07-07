module.exports = {
  testEnvironment: 'node',
  verbose: true,
  clearMocks: false,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/config/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFiles: ['dotenv/config']
};
