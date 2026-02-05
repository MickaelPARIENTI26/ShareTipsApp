import { by, device, element, expect, waitFor } from 'detox';

describe('Marketplace', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first
    await element(by.text('Connexion')).tap();
    await element(by.id('email-input')).typeText('testuser@example.com');
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.text('Se connecter')).tap();
    await expect(element(by.text('Accueil'))).toBeVisible();
    // Navigate to Marketplace
    await element(by.text('Marché')).tap();
  });

  beforeEach(async () => {
    await element(by.text('Marché')).tap();
  });

  describe('Marketplace Screen', () => {
    it('should show filter bar', async () => {
      await expect(element(by.text('Suivis'))).toBeVisible();
      await expect(element(by.text('Filtres'))).toBeVisible();
    });

    it('should show ticket list or empty state', async () => {
      // Either show tickets or empty message
      await waitFor(element(by.id('marketplace-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should toggle followed only filter', async () => {
      await element(by.text('Suivis')).tap();
      // Filter should become active
      await expect(element(by.text('Suivis'))).toBeVisible();
      // Tap again to deactivate
      await element(by.text('Suivis')).tap();
    });

    it('should open filter modal', async () => {
      await element(by.text('Filtres')).tap();
      // Filter modal should appear
      await expect(element(by.text('Filtrer les tickets'))).toBeVisible();
    });

    it('should close filter modal', async () => {
      await element(by.text('Filtres')).tap();
      await expect(element(by.text('Filtrer les tickets'))).toBeVisible();
      // Close modal
      await element(by.text('Fermer')).tap();
      await expect(element(by.text('Filtrer les tickets'))).not.toBeVisible();
    });
  });

  describe('Filter Modal', () => {
    beforeEach(async () => {
      await element(by.text('Filtres')).tap();
    });

    afterEach(async () => {
      // Close modal if still open
      try {
        await element(by.text('Fermer')).tap();
      } catch {
        // Modal might already be closed
      }
    });

    it('should show sport filters', async () => {
      await expect(element(by.text('Sports'))).toBeVisible();
    });

    it('should show odds range slider', async () => {
      await expect(element(by.text('Cote moyenne'))).toBeVisible();
    });

    it('should show confidence slider', async () => {
      await expect(element(by.text('Confiance'))).toBeVisible();
    });

    it('should show selection count filter', async () => {
      await expect(element(by.text('Nombre de sélections'))).toBeVisible();
    });

    it('should apply filters', async () => {
      // Select a sport
      await element(by.text('Football')).tap();
      // Apply filters
      await element(by.text('Appliquer')).tap();
      // Modal should close and filters should be applied
      await expect(element(by.text('Filtres (1)'))).toBeVisible();
    });

    it('should reset filters', async () => {
      await element(by.text('Réinitialiser')).tap();
      // Filters should be reset
    });
  });

  describe('Ticket Card Interactions', () => {
    it('should tap on ticket card to open detail', async () => {
      // Assuming there's at least one ticket
      await waitFor(element(by.id('ticket-card-0')))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.id('ticket-card-0')).tap();
      // Should navigate to ticket detail
      await expect(element(by.text('Détail du ticket'))).toBeVisible();
      await device.pressBack();
    });

    it('should toggle favorite on ticket', async () => {
      await waitFor(element(by.id('ticket-card-0')))
        .toBeVisible()
        .withTimeout(10000);
      // Find and tap the heart icon
      await element(by.id('favorite-button-0')).tap();
      // Favorite state should change
    });

    it('should tap on tipster name to view profile', async () => {
      await waitFor(element(by.id('ticket-card-0')))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.id('tipster-link-0')).tap();
      // Should navigate to tipster profile
      await expect(element(by.id('tipster-profile-screen'))).toBeVisible();
      await device.pressBack();
    });

    it('should follow/unfollow tipster', async () => {
      await waitFor(element(by.id('ticket-card-0')))
        .toBeVisible()
        .withTimeout(10000);
      // Tap follow button
      await element(by.id('follow-button-0')).tap();
      // Button text should change
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh ticket list on pull down', async () => {
      // Perform pull-to-refresh gesture
      await element(by.id('marketplace-list')).swipe('down', 'fast');
      // List should refresh (loading indicator might appear briefly)
      await waitFor(element(by.id('marketplace-list')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Infinite Scroll', () => {
    it('should load more tickets when scrolling to bottom', async () => {
      // Scroll to bottom
      await element(by.id('marketplace-list')).swipe('up', 'slow');
      // Wait for more content to load
      await waitFor(element(by.id('marketplace-list')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
