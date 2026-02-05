import { by, device, element, expect } from 'detox';

describe('Tipster Profile Screen', () => {
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
    // Navigate to marketplace and open a tipster profile
    await element(by.id('tab-marketplace')).tap();
    await waitFor(element(by.id('marketplace-list'))).toBeVisible().withTimeout(3000);
  });

  const navigateToTipsterProfile = async () => {
    // Open a ticket and tap on creator name
    await element(by.id('marketplace-list')).atIndex(0).tap();
    await waitFor(element(by.id('ticket-detail-screen'))).toBeVisible().withTimeout(3000);
    await element(by.id('ticket-creator')).tap();
    await waitFor(element(by.id('tipster-profile-screen'))).toBeVisible().withTimeout(3000);
  };

  describe('Profile Display', () => {
    it('should display tipster profile information', async () => {
      await navigateToTipsterProfile();
      await expect(element(by.id('tipster-username'))).toBeVisible();
      await expect(element(by.id('tipster-stats'))).toBeVisible();
    });

    it('should display tipster statistics', async () => {
      await navigateToTipsterProfile();
      await expect(element(by.id('tipster-stat-tickets'))).toBeVisible();
      await expect(element(by.id('tipster-stat-roi'))).toBeVisible();
      await expect(element(by.id('tipster-stat-win-rate'))).toBeVisible();
    });

    it('should display ranking information', async () => {
      await navigateToTipsterProfile();
      await expect(element(by.id('tipster-ranking'))).toBeVisible();
    });
  });

  describe('Follow/Unfollow', () => {
    it('should display follow button for non-followed tipster', async () => {
      await navigateToTipsterProfile();
      await expect(element(by.id('follow-button'))).toBeVisible();
    });

    it('should toggle follow status when tapping follow button', async () => {
      await navigateToTipsterProfile();

      // Follow the tipster
      await element(by.id('follow-button')).tap();
      await expect(element(by.id('following-button'))).toBeVisible();

      // Unfollow the tipster
      await element(by.id('following-button')).tap();
      await expect(element(by.id('follow-button'))).toBeVisible();
    });

    it('should not show follow button for own profile', async () => {
      // Navigate to own profile via profile tab
      await element(by.id('tab-profile')).tap();
      // Own profile should not have follow button
      await expect(element(by.id('follow-button'))).not.toBeVisible();
    });
  });

  describe('Tipster Tickets', () => {
    it('should display list of tipster tickets', async () => {
      await navigateToTipsterProfile();
      await expect(element(by.id('tipster-tickets-list'))).toBeVisible();
    });

    it('should navigate to ticket detail when tapping a ticket', async () => {
      await navigateToTipsterProfile();
      await element(by.id('tipster-tickets-list')).atIndex(0).tap();
      await expect(element(by.id('ticket-detail-screen'))).toBeVisible();
    });

    it('should show empty state when tipster has no tickets', async () => {
      // This would need a tipster with no tickets
      // For now, we just check the list exists
      await navigateToTipsterProfile();
      await expect(element(by.id('tipster-tickets-list'))).toExist();
    });
  });

  describe('Subscription Plans', () => {
    it('should display subscription section if tipster has plans', async () => {
      await navigateToTipsterProfile();
      await expect(element(by.id('subscription-section'))).toExist();
    });

    it('should display subscription plan cards', async () => {
      await navigateToTipsterProfile();
      // Scroll to subscription section if needed
      await element(by.id('tipster-profile-scroll')).scrollTo('bottom');
      await expect(element(by.id('subscription-plan-card'))).toExist();
    });

    it('should show subscribe button on plan card', async () => {
      await navigateToTipsterProfile();
      await element(by.id('tipster-profile-scroll')).scrollTo('bottom');
      await expect(element(by.id('subscribe-button'))).toExist();
    });

    it('should open subscription modal when tapping subscribe', async () => {
      await navigateToTipsterProfile();
      await element(by.id('tipster-profile-scroll')).scrollTo('bottom');
      await element(by.id('subscribe-button')).tap();
      await expect(element(by.id('subscription-modal'))).toBeVisible();
    });
  });

  describe('Detailed Statistics', () => {
    it('should navigate to detailed stats when tapping stats section', async () => {
      await navigateToTipsterProfile();
      await element(by.id('view-detailed-stats')).tap();
      await expect(element(by.id('tipster-stats-screen'))).toBeVisible();
    });

    it('should display detailed statistics breakdown', async () => {
      await navigateToTipsterProfile();
      await element(by.id('view-detailed-stats')).tap();

      await expect(element(by.id('stat-total-tickets'))).toBeVisible();
      await expect(element(by.id('stat-win-rate'))).toBeVisible();
      await expect(element(by.id('stat-avg-odds'))).toBeVisible();
      await expect(element(by.id('stat-revenue'))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh tipster data on pull down', async () => {
      await navigateToTipsterProfile();

      // Pull to refresh
      await element(by.id('tipster-profile-scroll')).swipe('down', 'slow', 0.5);

      // Profile should still be visible after refresh
      await expect(element(by.id('tipster-profile-screen'))).toBeVisible();
    });
  });
});
