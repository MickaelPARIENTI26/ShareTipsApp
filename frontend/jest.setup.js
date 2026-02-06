// Jest setup for unit tests (non-React Native)

// Mock localStorage for Node.js test environment
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null),
};
global.localStorage = localStorageMock;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-push-token' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MAX: 5 },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  modelId: 'mock-model-id',
  deviceName: 'Mock Device',
  modelName: 'Mock Model',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'mock-project-id',
      },
    },
  },
}));

// Mock push notifications service
jest.mock('./src/services/pushNotifications', () => ({
  registerForPushNotificationsAsync: jest.fn(() => Promise.resolve('mock-push-token')),
  registerDeviceTokenWithBackend: jest.fn(() => Promise.resolve(true)),
  unregisterDeviceToken: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => Promise.resolve(null)),
  clearBadgeCount: jest.fn(() => Promise.resolve()),
  setBadgeCount: jest.fn(() => Promise.resolve()),
}));

// Provide axios mock with AxiosError class
jest.mock('axios', () => {
  // Create a proper AxiosError mock class
  class MockAxiosError extends Error {
    isAxiosError = true;
    response;
    code;
    config;

    constructor(message, code, config, request, response) {
      super(message);
      this.name = 'AxiosError';
      this.code = code;
      this.config = config;
      this.response = response;
    }
  }

  const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
    AxiosError: MockAxiosError,
    isAxiosError: (error) => error?.isAxiosError === true,
  };
  return mockAxios;
});
