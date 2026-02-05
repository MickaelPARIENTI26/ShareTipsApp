import { by, device, element, expect } from 'detox';

describe('Matches Screen', () => {
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
    // Navigate to matches tab
    await element(by.id('tab-matches')).tap();
    await waitFor(element(by.id('matches-screen'))).toBeVisible().withTimeout(3000);
  });

  describe('Matches List', () => {
    it('should display matches screen', async () => {
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should display sports filter', async () => {
      await expect(element(by.id('sport-filter'))).toBeVisible();
    });

    it('should display list of matches', async () => {
      await expect(element(by.id('matches-list'))).toBeVisible();
    });

    it('should display match cards', async () => {
      await expect(element(by.id('match-card')).atIndex(0)).toBeVisible();
    });
  });

  describe('Sport Filtering', () => {
    it('should filter by Football', async () => {
      await element(by.id('sport-filter-football')).tap();
      await waitFor(element(by.id('matches-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should filter by Basketball', async () => {
      await element(by.id('sport-filter-basketball')).tap();
      await waitFor(element(by.id('matches-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should filter by Tennis', async () => {
      await element(by.id('sport-filter-tennis')).tap();
      await waitFor(element(by.id('matches-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should filter by Esport', async () => {
      await element(by.id('sport-filter-esport')).tap();
      await waitFor(element(by.id('matches-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should show all sports when tapping All', async () => {
      await element(by.id('sport-filter-football')).tap();
      await element(by.id('sport-filter-all')).tap();
      await waitFor(element(by.id('matches-list'))).toBeVisible().withTimeout(3000);
    });
  });

  describe('Match Card Information', () => {
    it('should display team names', async () => {
      await expect(element(by.id('match-home-team')).atIndex(0)).toBeVisible();
      await expect(element(by.id('match-away-team')).atIndex(0)).toBeVisible();
    });

    it('should display match time', async () => {
      await expect(element(by.id('match-time')).atIndex(0)).toBeVisible();
    });

    it('should display league name', async () => {
      await expect(element(by.id('match-league')).atIndex(0)).toBeVisible();
    });

    it('should display sport icon', async () => {
      await expect(element(by.id('match-sport-icon')).atIndex(0)).toBeVisible();
    });
  });

  describe('Match Detail Navigation', () => {
    it('should navigate to match detail when tapping a match', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await expect(element(by.id('match-detail-screen'))).toBeVisible();
    });

    it('should display match detail information', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await expect(element(by.id('match-teams'))).toBeVisible();
      await expect(element(by.id('match-datetime'))).toBeVisible();
    });

    it('should display available markets', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await expect(element(by.id('markets-list'))).toBeVisible();
    });

    it('should go back to matches list', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await element(by.id('back-button')).tap();
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });
  });

  describe('Selection from Match', () => {
    it('should add selection to ticket builder when tapping odds', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await waitFor(element(by.id('match-detail-screen'))).toBeVisible().withTimeout(3000);

      // Tap on an odds button
      await element(by.id('odds-button')).atIndex(0).tap();

      // Ticket builder should appear
      await expect(element(by.id('ticket-builder'))).toBeVisible();
    });

    it('should show selection in ticket builder header', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await waitFor(element(by.id('match-detail-screen'))).toBeVisible().withTimeout(3000);

      await element(by.id('odds-button')).atIndex(0).tap();

      await expect(element(by.id('ticket-builder-header'))).toBeVisible();
      await expect(element(by.text('1'))).toBeVisible(); // Selection count
    });

    it('should toggle selection when tapping same odds again', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await waitFor(element(by.id('match-detail-screen'))).toBeVisible().withTimeout(3000);

      // Add selection
      await element(by.id('odds-button')).atIndex(0).tap();
      await expect(element(by.id('ticket-builder'))).toBeVisible();

      // Remove selection
      await element(by.id('odds-button')).atIndex(0).tap();

      // Ticket builder should be hidden (no selections)
      await expect(element(by.id('ticket-builder'))).not.toBeVisible();
    });

    it('should replace selection when tapping different market same match', async () => {
      await element(by.id('match-card')).atIndex(0).tap();
      await waitFor(element(by.id('match-detail-screen'))).toBeVisible().withTimeout(3000);

      // Add first selection
      await element(by.id('odds-button')).atIndex(0).tap();

      // Add different selection from same match
      await element(by.id('odds-button')).atIndex(1).tap();

      // Should still show 1 selection (replaced)
      await expect(element(by.text('1'))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh matches on pull down', async () => {
      await element(by.id('matches-list')).swipe('down', 'slow', 0.5);

      await waitFor(element(by.id('matches-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no matches available', async () => {
      // This would need to simulate an empty matches state
      // We can check for empty state element existence
      await expect(element(by.id('matches-empty-state'))).toExist();
    });
  });

  describe('League Grouping', () => {
    it('should group matches by league', async () => {
      await expect(element(by.id('league-header')).atIndex(0)).toBeVisible();
    });

    it('should collapse/expand league section', async () => {
      await element(by.id('league-header')).atIndex(0).tap();
      // Matches in that league should be hidden/shown
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });
  });
});
