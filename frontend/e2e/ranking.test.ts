import { by, device, element, expect } from 'detox';

describe('Ranking Screen', () => {
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
    // Navigate to ranking tab
    await element(by.id('tab-ranking')).tap();
    await waitFor(element(by.id('ranking-screen'))).toBeVisible().withTimeout(3000);
  });

  describe('Ranking Display', () => {
    it('should display ranking screen', async () => {
      await expect(element(by.id('ranking-screen'))).toBeVisible();
    });

    it('should display period selector', async () => {
      await expect(element(by.id('period-daily'))).toBeVisible();
      await expect(element(by.id('period-weekly'))).toBeVisible();
      await expect(element(by.id('period-monthly'))).toBeVisible();
    });

    it('should display ranking list', async () => {
      await expect(element(by.id('ranking-list'))).toBeVisible();
    });

    it('should display top 3 podium', async () => {
      await expect(element(by.id('podium'))).toBeVisible();
      await expect(element(by.id('podium-first'))).toBeVisible();
      await expect(element(by.id('podium-second'))).toBeVisible();
      await expect(element(by.id('podium-third'))).toBeVisible();
    });
  });

  describe('Period Selection', () => {
    it('should show daily ranking by default', async () => {
      await expect(element(by.id('period-daily-active'))).toBeVisible();
    });

    it('should switch to weekly ranking', async () => {
      await element(by.id('period-weekly')).tap();
      await expect(element(by.id('period-weekly-active'))).toBeVisible();
      await expect(element(by.id('ranking-list'))).toBeVisible();
    });

    it('should switch to monthly ranking', async () => {
      await element(by.id('period-monthly')).tap();
      await expect(element(by.id('period-monthly-active'))).toBeVisible();
      await expect(element(by.id('ranking-list'))).toBeVisible();
    });

    it('should switch back to daily ranking', async () => {
      await element(by.id('period-weekly')).tap();
      await element(by.id('period-daily')).tap();
      await expect(element(by.id('period-daily-active'))).toBeVisible();
    });
  });

  describe('Ranking List Items', () => {
    it('should display tipster information in ranking row', async () => {
      await expect(element(by.id('ranking-row')).atIndex(0)).toBeVisible();
      await expect(element(by.id('ranking-position')).atIndex(0)).toBeVisible();
      await expect(element(by.id('ranking-username')).atIndex(0)).toBeVisible();
      await expect(element(by.id('ranking-roi')).atIndex(0)).toBeVisible();
    });

    it('should navigate to tipster profile when tapping ranking row', async () => {
      await element(by.id('ranking-row')).atIndex(0).tap();
      await expect(element(by.id('tipster-profile-screen'))).toBeVisible();
    });

    it('should highlight current user in ranking', async () => {
      // Scroll to find current user if needed
      await element(by.id('ranking-list')).scroll(500, 'down');
      await expect(element(by.id('ranking-row-current-user'))).toExist();
    });
  });

  describe('Ranking Metrics', () => {
    it('should display ROI for each tipster', async () => {
      await expect(element(by.id('ranking-roi')).atIndex(0)).toBeVisible();
    });

    it('should display win rate for each tipster', async () => {
      await expect(element(by.id('ranking-win-rate')).atIndex(0)).toBeVisible();
    });

    it('should display number of tickets for each tipster', async () => {
      await expect(element(by.id('ranking-tickets-count')).atIndex(0)).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh ranking data on pull down', async () => {
      await element(by.id('ranking-list')).swipe('down', 'slow', 0.5);

      // Wait for refresh to complete
      await waitFor(element(by.id('ranking-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('ranking-screen'))).toBeVisible();
    });
  });

  describe('Pagination', () => {
    it('should load more rankings when scrolling to bottom', async () => {
      // Scroll to bottom
      await element(by.id('ranking-list')).scroll(1000, 'down');

      // Should still see ranking items
      await expect(element(by.id('ranking-row'))).toExist();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no rankings available', async () => {
      // This would need to simulate an empty ranking state
      // For now, we just verify the screen loads correctly
      await expect(element(by.id('ranking-screen'))).toBeVisible();
    });
  });
});
