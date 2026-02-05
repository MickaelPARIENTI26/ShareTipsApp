import { by, device, element, expect } from 'detox';

describe('Main Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first (assuming we have a test user)
    await element(by.text('Connexion')).tap();
    await element(by.id('email-input')).typeText('testuser@example.com');
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.text('Se connecter')).tap();
    // Wait for main app to load
    await expect(element(by.text('Accueil'))).toBeVisible();
  });

  describe('Tab Navigation', () => {
    it('should show all tab items', async () => {
      await expect(element(by.text('Accueil'))).toBeVisible();
      await expect(element(by.text('Marché'))).toBeVisible();
      await expect(element(by.text('Matchs'))).toBeVisible();
      await expect(element(by.text('Classement'))).toBeVisible();
      await expect(element(by.text('Profil'))).toBeVisible();
    });

    it('should navigate to Marketplace tab', async () => {
      await element(by.text('Marché')).tap();
      // Should show marketplace content
      await expect(element(by.id('marketplace-screen'))).toBeVisible();
    });

    it('should navigate to Matches tab', async () => {
      await element(by.text('Matchs')).tap();
      // Should show matches screen
      await expect(element(by.id('matches-screen'))).toBeVisible();
    });

    it('should navigate to Ranking tab', async () => {
      await element(by.text('Classement')).tap();
      // Should show ranking screen
      await expect(element(by.id('ranking-screen'))).toBeVisible();
    });

    it('should navigate to Profile tab', async () => {
      await element(by.text('Profil')).tap();
      // Should show profile screen with username
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should return to Home tab', async () => {
      await element(by.text('Accueil')).tap();
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Home Screen', () => {
    beforeEach(async () => {
      await element(by.text('Accueil')).tap();
    });

    it('should show user greeting', async () => {
      await expect(element(by.id('user-greeting'))).toBeVisible();
    });

    it('should show quick action buttons', async () => {
      await expect(element(by.text('Mes tickets'))).toBeVisible();
      await expect(element(by.text('Mes favoris'))).toBeVisible();
    });

    it('should navigate to My Tickets', async () => {
      await element(by.text('Mes tickets')).tap();
      await expect(element(by.text('Mes tickets'))).toBeVisible();
      await device.pressBack();
    });

    it('should navigate to Sports list', async () => {
      await element(by.text('Voir les sports')).tap();
      await expect(element(by.text('Sports'))).toBeVisible();
      await device.pressBack();
    });
  });

  describe('Profile Screen', () => {
    beforeEach(async () => {
      await element(by.text('Profil')).tap();
    });

    it('should show user info', async () => {
      await expect(element(by.id('profile-username'))).toBeVisible();
    });

    it('should show profile menu items', async () => {
      await expect(element(by.text('Mes tickets'))).toBeVisible();
      await expect(element(by.text('Mes favoris'))).toBeVisible();
      await expect(element(by.text('Mes achats'))).toBeVisible();
      await expect(element(by.text('Mes abonnements'))).toBeVisible();
    });

    it('should navigate to wallet', async () => {
      await element(by.text('Portefeuille')).tap();
      await expect(element(by.text('Portefeuille'))).toBeVisible();
      await device.pressBack();
    });

    it('should navigate to settings/notifications', async () => {
      await element(by.text('Notifications')).tap();
      await expect(element(by.text('Notifications'))).toBeVisible();
      await device.pressBack();
    });

    it('should show logout button', async () => {
      await expect(element(by.text('Déconnexion'))).toBeVisible();
    });

    it('should logout when pressing logout button', async () => {
      await element(by.text('Déconnexion')).tap();
      // Confirm logout
      await element(by.text('Confirmer')).tap();
      // Should return to welcome screen
      await expect(element(by.text('Connexion'))).toBeVisible();
    });
  });
});
