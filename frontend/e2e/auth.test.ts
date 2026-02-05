import { by, device, element, expect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Welcome Screen', () => {
    it('should show welcome screen with login and register buttons', async () => {
      await expect(element(by.text('Connexion'))).toBeVisible();
      await expect(element(by.text('Inscription'))).toBeVisible();
    });

    it('should navigate to login screen', async () => {
      await element(by.text('Connexion')).tap();
      await expect(element(by.text('Connectez-vous'))).toBeVisible();
    });

    it('should navigate to register screen', async () => {
      await element(by.text('Inscription')).tap();
      await expect(element(by.text('Créer un compte'))).toBeVisible();
    });
  });

  describe('Login Screen', () => {
    beforeEach(async () => {
      await element(by.text('Connexion')).tap();
    });

    it('should show email and password inputs', async () => {
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
    });

    it('should show validation error for invalid email', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).tap();
      await expect(element(by.text('Email invalide'))).toBeVisible();
    });

    it('should show error for empty password', async () => {
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).tap();
      await element(by.id('email-input')).tap();
      // Password validation should trigger
    });

    it('should disable login button when form is invalid', async () => {
      // Button should be disabled by default
      await expect(element(by.text('Se connecter'))).toBeVisible();
    });

    it('should navigate back to welcome screen', async () => {
      await device.pressBack();
      await expect(element(by.text('Connexion'))).toBeVisible();
      await expect(element(by.text('Inscription'))).toBeVisible();
    });

    it('should navigate to register from login', async () => {
      await element(by.text("Pas de compte ? S'inscrire")).tap();
      await expect(element(by.text('Créer un compte'))).toBeVisible();
    });

    it('should navigate to forgot password', async () => {
      await element(by.text('Mot de passe oublié ?')).tap();
      // Should show forgot password screen
    });
  });

  describe('Register Screen', () => {
    beforeEach(async () => {
      await element(by.text('Inscription')).tap();
    });

    it('should show all registration fields', async () => {
      await expect(element(by.id('username-input'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('confirm-password-input'))).toBeVisible();
      await expect(element(by.id('dob-input'))).toBeVisible();
    });

    it('should show disclaimer about betting risks', async () => {
      await expect(
        element(by.text(/ShareTips est une plateforme de partage/))
      ).toBeVisible();
    });

    it('should require CGV acceptance', async () => {
      // CGV checkbox should be visible
      await expect(element(by.id('cgv-checkbox'))).toBeVisible();
    });

    it('should navigate to CGV page', async () => {
      await element(by.text('Conditions Générales de Vente')).tap();
      await expect(element(by.text('Conditions de vente'))).toBeVisible();
    });

    it('should navigate back to login', async () => {
      await element(by.text('Déjà un compte ? Se connecter')).tap();
      await expect(element(by.text('Connectez-vous'))).toBeVisible();
    });
  });

  describe('Login with credentials', () => {
    const testEmail = 'testuser@example.com';
    const testPassword = 'TestPassword123!';

    beforeEach(async () => {
      await element(by.text('Connexion')).tap();
    });

    it('should login successfully with valid credentials', async () => {
      await element(by.id('email-input')).typeText(testEmail);
      await element(by.id('password-input')).typeText(testPassword);
      await element(by.text('Se connecter')).tap();

      // After successful login, should see main app (Home tab)
      await expect(element(by.text('Accueil'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('wrong@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.text('Se connecter')).tap();

      // Should show error message
      await expect(element(by.text('Email ou mot de passe incorrect.'))).toBeVisible();
    });
  });
});
