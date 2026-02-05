import { by, device, element, expect, waitFor } from 'detox';

describe('Ticket Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first
    await element(by.text('Connexion')).tap();
    await element(by.id('email-input')).typeText('testuser@example.com');
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.text('Se connecter')).tap();
    await expect(element(by.text('Accueil'))).toBeVisible();
  });

  describe('Browse Matches and Add Selections', () => {
    it('should navigate to Matches tab', async () => {
      await element(by.text('Matchs')).tap();
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should show list of matches', async () => {
      await waitFor(element(by.id('match-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should tap on a match to see odds', async () => {
      await element(by.id('match-card-0')).tap();
      await expect(element(by.text('Détails du match'))).toBeVisible();
    });

    it('should show available markets', async () => {
      await expect(element(by.text('1X2'))).toBeVisible();
    });

    it('should add a selection to ticket builder', async () => {
      // Tap on a selection (e.g., Home win)
      await element(by.id('selection-home')).tap();
      // Ticket builder should appear
      await expect(element(by.id('ticket-builder'))).toBeVisible();
    });

    it('should show selection in ticket builder', async () => {
      await expect(element(by.id('ticket-builder-selection-0'))).toBeVisible();
    });

    it('should add another selection', async () => {
      await device.pressBack();
      // Tap on another match
      await element(by.id('match-card-1')).tap();
      await element(by.id('selection-away')).tap();
      // Should now have 2 selections
      await expect(element(by.text('2 sélections'))).toBeVisible();
    });

    it('should remove a selection', async () => {
      await element(by.id('remove-selection-0')).tap();
      // Should now have 1 selection
      await expect(element(by.text('1 sélection'))).toBeVisible();
    });
  });

  describe('Ticket Builder', () => {
    beforeAll(async () => {
      // Ensure we have at least one selection
      await element(by.text('Matchs')).tap();
      await element(by.id('match-card-0')).tap();
      await element(by.id('selection-home')).tap();
    });

    it('should show total odds', async () => {
      await expect(element(by.id('total-odds'))).toBeVisible();
    });

    it('should expand ticket builder', async () => {
      await element(by.id('ticket-builder-header')).tap();
      // Expanded view should show all details
      await expect(element(by.id('ticket-builder-expanded'))).toBeVisible();
    });

    it('should collapse ticket builder', async () => {
      await element(by.id('ticket-builder-header')).tap();
      // Should collapse
    });

    it('should navigate to ticket preview', async () => {
      await element(by.text('Valider')).tap();
      await expect(element(by.text('Confirmer le ticket'))).toBeVisible();
    });
  });

  describe('Ticket Preview and Confirmation', () => {
    it('should show ticket summary', async () => {
      await expect(element(by.id('ticket-preview'))).toBeVisible();
      await expect(element(by.id('preview-selections'))).toBeVisible();
      await expect(element(by.id('preview-total-odds'))).toBeVisible();
    });

    it('should show confidence slider', async () => {
      await expect(element(by.text('Indice de confiance'))).toBeVisible();
      await expect(element(by.id('confidence-slider'))).toBeVisible();
    });

    it('should set confidence level', async () => {
      // Slide to set confidence
      await element(by.id('confidence-slider')).swipe('right', 'slow', 0.5);
    });

    it('should show visibility toggle', async () => {
      await expect(element(by.text('Visibilité'))).toBeVisible();
    });

    it('should toggle to private ticket', async () => {
      await element(by.text('Payant')).tap();
      // Price input should appear
      await expect(element(by.id('price-input'))).toBeVisible();
    });

    it('should set price for private ticket', async () => {
      await element(by.id('price-input')).typeText('5');
    });

    it('should toggle back to public', async () => {
      await element(by.text('Gratuit')).tap();
      // Price input should disappear
      await expect(element(by.id('price-input'))).not.toBeVisible();
    });

    it('should create ticket', async () => {
      await element(by.text('Créer le ticket')).tap();
      // Should show success or navigate to ticket detail
      await waitFor(element(by.text('Ticket créé')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should navigate to my tickets after creation', async () => {
      await element(by.text('Voir mes tickets')).tap();
      await expect(element(by.text('Mes tickets'))).toBeVisible();
    });
  });

  describe('Cancel Ticket Creation', () => {
    beforeAll(async () => {
      // Add a selection
      await element(by.text('Matchs')).tap();
      await element(by.id('match-card-0')).tap();
      await element(by.id('selection-home')).tap();
    });

    it('should clear all selections', async () => {
      await element(by.id('clear-selections')).tap();
      // Confirm clear
      await element(by.text('Confirmer')).tap();
      // Ticket builder should disappear
      await expect(element(by.id('ticket-builder'))).not.toBeVisible();
    });

    it('should cancel from preview screen', async () => {
      // Add selection again
      await element(by.id('match-card-0')).tap();
      await element(by.id('selection-home')).tap();
      await element(by.text('Valider')).tap();
      // Cancel
      await element(by.text('Annuler')).tap();
      // Should go back
      await expect(element(by.text('Confirmer le ticket'))).not.toBeVisible();
    });
  });
});
