module.exports = {
  preset: 'jest-expo',
  // services/sync/__tests__ uses node:test, not Jest; it runs via `npm run test:sync`.
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/services/sync/__tests__/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'services/**/*.ts',
    'db/**/*.ts',
    'auth/**/*.ts',
    '!**/*.d.ts',
  ],
};
