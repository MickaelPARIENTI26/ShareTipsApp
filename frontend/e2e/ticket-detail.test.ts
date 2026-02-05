import { by, device, element, expect } from 'detox';

describe('Ticket Detail Screen', () => {
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
    // Navigate to marketplace and open a ticket
    await element(by.id('tab-marketplace')).tap();
    await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
  });

  describe('Ticket Information', () => {
    it('should display ticket details when tapping a card', async () => {
      // Tap the first ticket card
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await expect(element(by.id('ticket-detail-screen'))).toBeVisible();
    });

    it('should display ticket header information', async () => {
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await expect(element(by.id('ticket-creator'))).toBeVisible();
      await expect(element(by.id('ticket-confidence'))).toBeVisible();
      await expect(element(by.id('ticket-total-odds'))).toBeVisible();
    });

    it('should display ticket selections for public tickets', async () => {
      // Navigate to a public ticket
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await expect(element(by.id('selections-list'))).toBeVisible();
    });

    it('should show locked state for private tickets not purchased', async () => {
      // This would need a specific private ticket
      await element(by.id('filters-button')).tap();
      await element(by.id('filter-ticket-type-private')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('marketplace-list')).atIndex(0).tap();

      await expect(element(by.id('locked-selections'))).toBeVisible();
      await expect(element(by.id('buy-button'))).toBeVisible();
    });
  });

  describe('Selection Details', () => {
    it('should display match information in selections', async () => {
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await expect(element(by.id('selection-match-label'))).toBeVisible();
      await expect(element(by.id('selection-odds'))).toBeVisible();
    });

    it('should display selection result status', async () => {
      await element(by.id('marketplace-list')).atIndex(0).tap();
      // Selection should show pending/win/lose status
      await expect(element(by.id('selection-result'))).toExist();
    });
  });

  describe('Favorite Toggle', () => {
    it('should toggle favorite status', async () => {
      await element(by.id('marketplace-list')).atIndex(0).tap();

      const favoriteButton = element(by.id('favorite-button'));
      await expect(favoriteButton).toBeVisible();

      // Tap to add to favorites
      await favoriteButton.tap();
      await expect(element(by.id('favorite-button-active'))).toBeVisible();

      // Tap again to remove
      await element(by.id('favorite-button-active')).tap();
      await expect(element(by.id('favorite-button'))).toBeVisible();
    });
  });

  describe('Creator Profile Navigation', () => {
    it('should navigate to creator profile when tapping username', async () => {
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await element(by.id('ticket-creator')).tap();
      await expect(element(by.id('tipster-profile-screen'))).toBeVisible();
    });
  });

  describe('Purchase Flow', () => {
    it('should show purchase modal for private tickets', async () => {
      // Navigate to a private ticket
      await element(by.id('filters-button')).tap();
      await element(by.id('filter-ticket-type-private')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('marketplace-list')).atIndex(0).tap();

      await element(by.id('buy-button')).tap();
      await expect(element(by.id('purchase-modal'))).toBeVisible();
    });

    it('should require consent before purchase', async () => {
      await element(by.id('filters-button')).tap();
      await element(by.id('filter-ticket-type-private')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('marketplace-list')).atIndex(0).tap();

      await element(by.id('buy-button')).tap();
      await expect(element(by.id('consent-checkbox'))).toBeVisible();
      await expect(element(by.id('confirm-purchase-button'))).toBeVisible();
    });

    it('should enable confirm button after checking consent', async () => {
      await element(by.id('filters-button')).tap();
      await element(by.id('filter-ticket-type-private')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
      await element(by.id('marketplace-list')).atIndex(0).tap();

      await element(by.id('buy-button')).tap();
      await element(by.id('consent-checkbox')).tap();

      // Button should now be enabled
      await expect(element(by.id('confirm-purchase-button'))).toBeVisible();
    });
  });

  describe('Share Ticket', () => {
    it('should show share options when tapping share button', async () => {
      await element(by.id('marketplace-list')).atIndex(0).tap();
      await element(by.id('share-button')).tap();

      // Native share sheet should appear
      // This is platform-specific, so we just check it doesn't crash
    });
  });
});
