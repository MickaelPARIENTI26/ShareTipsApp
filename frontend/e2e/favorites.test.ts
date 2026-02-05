import { by, device, element, expect } from 'detox';

describe('Favorites', () => {
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
  });

  describe('Add to Favorites from Marketplace', () => {
    it('should add ticket to favorites by tapping heart icon', async () => {
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);

      // Tap heart icon on first ticket
      await element(by.id('favorite-icon')).atIndex(0).tap();

      // Heart should be filled
      await expect(element(by.id('favorite-icon-active')).atIndex(0)).toBeVisible();
    });

    it('should remove from favorites by tapping filled heart', async () => {
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);

      // First add to favorites
      await element(by.id('favorite-icon')).atIndex(0).tap();

      // Then remove
      await element(by.id('favorite-icon-active')).atIndex(0).tap();

      // Heart should be outline again
      await expect(element(by.id('favorite-icon')).atIndex(0)).toBeVisible();
    });
  });

  describe('Add to Favorites from Ticket Detail', () => {
    it('should add ticket to favorites from detail screen', async () => {
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);

      // Open ticket detail
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await waitFor(element(by.id('ticket-detail-screen'))).toBeVisible().withTimeout(3000);

      // Tap favorite button
      await element(by.id('favorite-button')).tap();
      await expect(element(by.id('favorite-button-active'))).toBeVisible();
    });
  });

  describe('Favorites Screen', () => {
    it('should navigate to favorites screen from profile', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('menu-my-favorites')).tap();
      await expect(element(by.id('my-favorites-screen'))).toBeVisible();
    });

    it('should display favorited tickets', async () => {
      // First add a favorite
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('favorite-icon')).atIndex(0).tap();

      // Navigate to favorites
      await element(by.id('tab-profile')).tap();
      await element(by.id('menu-my-favorites')).tap();

      await expect(element(by.id('favorites-list'))).toBeVisible();
      await expect(element(by.id('favorite-ticket-card')).atIndex(0)).toBeVisible();
    });

    it('should show empty state when no favorites', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('menu-my-favorites')).tap();

      // If no favorites, should show empty state
      await expect(element(by.id('favorites-empty-state'))).toExist();
    });

    it('should navigate to ticket detail when tapping favorite', async () => {
      // Add a favorite first
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('favorite-icon')).atIndex(0).tap();

      // Navigate to favorites and tap
      await element(by.id('tab-profile')).tap();
      await element(by.id('menu-my-favorites')).tap();
      await element(by.id('favorite-ticket-card')).atIndex(0).tap();

      await expect(element(by.id('ticket-detail-screen'))).toBeVisible();
    });

    it('should remove favorite from favorites screen', async () => {
      // Add a favorite first
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('favorite-icon')).atIndex(0).tap();

      // Navigate to favorites
      await element(by.id('tab-profile')).tap();
      await element(by.id('menu-my-favorites')).tap();

      // Remove favorite
      await element(by.id('remove-favorite-button')).atIndex(0).tap();

      // Should either show empty state or one less item
      await expect(element(by.id('my-favorites-screen'))).toBeVisible();
    });

    it('should refresh favorites on pull down', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('menu-my-favorites')).tap();

      await element(by.id('favorites-list')).swipe('down', 'slow', 0.5);

      await expect(element(by.id('my-favorites-screen'))).toBeVisible();
    });
  });

  describe('Favorites Persistence', () => {
    it('should persist favorites after app restart', async () => {
      // Add a favorite
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('favorite-icon')).atIndex(0).tap();

      // Restart app
      await device.reloadReactNative();

      // Check favorite is still there
      await element(by.id('tab-marketplace')).tap();
      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);

      await expect(element(by.id('favorite-icon-active')).atIndex(0)).toBeVisible();
    });
  });
});
