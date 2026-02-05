import { by, device, element, expect } from 'detox';

describe('Profile Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('main-tabs'))).toBeVisible().withTimeout(5000);
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Navigate to profile tab
    await element(by.id('tab-profile')).tap();
  });

  describe('Profile Display', () => {
    it('should display user profile information', async () => {
      await expect(element(by.id('profile-screen'))).toBeVisible();
      await expect(element(by.id('profile-username'))).toBeVisible();
      await expect(element(by.id('profile-stats'))).toBeVisible();
    });

    it('should display user statistics', async () => {
      await expect(element(by.id('stat-tickets-created'))).toBeVisible();
      await expect(element(by.id('stat-roi'))).toBeVisible();
      await expect(element(by.id('stat-followers'))).toBeVisible();
    });

    it('should display ranking badges', async () => {
      await expect(element(by.id('ranking-daily'))).toBeVisible();
      await expect(element(by.id('ranking-weekly'))).toBeVisible();
      await expect(element(by.id('ranking-monthly'))).toBeVisible();
    });
  });

  describe('Profile Menu Navigation', () => {
    it('should navigate to My Tickets screen', async () => {
      await element(by.id('menu-my-tickets')).tap();
      await expect(element(by.id('my-tickets-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });

    it('should navigate to My Purchases screen', async () => {
      await element(by.id('menu-my-purchases')).tap();
      await expect(element(by.id('my-purchases-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });

    it('should navigate to My Favorites screen', async () => {
      await element(by.id('menu-my-favorites')).tap();
      await expect(element(by.id('my-favorites-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });

    it('should navigate to My Subscriptions screen', async () => {
      await element(by.id('menu-my-subscriptions')).tap();
      await expect(element(by.id('my-subscriptions-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });

    it('should navigate to Wallet screen', async () => {
      await element(by.id('menu-wallet')).tap();
      await expect(element(by.id('wallet-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });

    it('should navigate to Statistics screen', async () => {
      await element(by.id('menu-statistics')).tap();
      await expect(element(by.id('statistics-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });

    it('should navigate to Notifications screen', async () => {
      await element(by.id('menu-notifications')).tap();
      await expect(element(by.id('notifications-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });
  });

  describe('Settings', () => {
    it('should open settings menu', async () => {
      await element(by.id('settings-button')).tap();
      await expect(element(by.id('settings-menu'))).toBeVisible();
    });

    it('should toggle dark mode', async () => {
      await element(by.id('settings-button')).tap();
      await element(by.id('dark-mode-toggle')).tap();
      // Theme should change
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should navigate to legal pages', async () => {
      await element(by.id('settings-button')).tap();
      await element(by.id('menu-cgu')).tap();
      await expect(element(by.id('cgu-screen'))).toBeVisible();
      await element(by.id('back-button')).tap();
    });
  });

  describe('Logout', () => {
    it('should show logout confirmation', async () => {
      await element(by.id('logout-button')).tap();
      await expect(element(by.text('Déconnexion'))).toBeVisible();
      await expect(element(by.text('Annuler'))).toBeVisible();
    });

    it('should cancel logout when pressing cancel', async () => {
      await element(by.id('logout-button')).tap();
      await element(by.text('Annuler')).tap();
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });
  });
});
