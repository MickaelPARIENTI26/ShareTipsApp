# ShareTips - Checklist de Production

## Statut Global

| Section | Progression |
|---------|-------------|
| Code & Tests | **100%** |
| Stripe Connect | **100%** |
| Audits | **85%** (5/7) |
| Push Notifications | 0% (config externe) |
| Infrastructure | 0% (config externe) |
| App Stores | 0% (config externe) |

---

## PRIORITE 1 - Configuration Externe Requise

### Stripe (Production)

- [x] Compte Stripe cree
- [x] Cles API test configurees
- [x] Integration Stripe Connect complete (backend + frontend)
- [ ] **Configurer webhook Stripe production**
  - URL: `https://api.sharetips.app/api/stripe/webhook`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `payout.paid`, `payout.failed`
- [ ] **Passer en mode live** (cles production)

### Infrastructure Production

- [ ] **Hebergement backend** (Azure, AWS, Railway, etc.)
- [ ] **PostgreSQL production** avec backups automatiques
- [ ] **Domaine + SSL** pour `api.sharetips.app`
- [ ] **Variables d'environnement production**:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET` (min 32 caracteres)
  - `STRIPE_SECRET_KEY` (live)
  - `STRIPE_WEBHOOK_SECRET`
  - `ODDS_API_KEY`

---

## PRIORITE 2 - Services Complementaires

### Push Notifications (EAS)

- [ ] Creer compte Expo: https://expo.dev
- [ ] `npx expo login`
- [ ] `cd frontend && npx eas init`
- [ ] Verifier `projectId` dans `app.json`

**iOS:**
- [ ] Compte Apple Developer ($99/an)
- [ ] `npx eas credentials`
- [ ] Activer Push Notifications dans App Store Connect

**Android:**
- [ ] Projet Firebase Console
- [ ] Telecharger `google-services.json`
- [ ] Configurer FCM

### Sentry (Crash Monitoring)

- [ ] Creer projet sur https://sentry.io
- [ ] Recuperer DSN
- [ ] Ajouter dans `app.json` → `extra.sentryDsn`
- [ ] Configurer `SENTRY_DSN` backend

### Email (SMTP)

- [ ] Choisir fournisseur (SendGrid, Mailgun, AWS SES)
- [ ] Configurer SPF, DKIM, DMARC
- [ ] Variables: `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, etc.

---

## PRIORITE 3 - Publication Stores

### Apple App Store

- [ ] Compte Apple Developer actif
- [ ] Creer app dans App Store Connect
- [ ] Assets: icon 1024x1024, splash, screenshots
- [ ] Metadonnees: titre, description, mots-cles
- [ ] Classification age, politique confidentialite
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios`

### Google Play Store

- [ ] Compte Google Play Developer ($25)
- [ ] Creer app dans Play Console
- [ ] Keystore de signature
- [ ] Metadonnees + screenshots
- [ ] `eas build --platform android --profile production`
- [ ] `eas submit --platform android`

### Pages Legales (heberger sur web)

- [ ] CGU: `https://sharetips.app/cgu`
- [ ] CGV: `https://sharetips.app/cgv`
- [ ] Politique confidentialite: `https://sharetips.app/privacy`

---

## COMPLETE - Code & Audits

### Stripe Connect Integration
- [x] Package Stripe.net backend
- [x] Package @stripe/stripe-react-native frontend
- [x] Entites: StripePayment, StripePayout
- [x] Service: StripeConnectService
- [x] Controller: StripeController (onboarding, webhooks, payouts)
- [x] Frontend: StripeProvider, WalletScreen, TicketDetailScreen, TipsterProfileScreen

### Audits Securite & Accessibilite
- [x] Securite: tokens JWT, SecureStore, pas de secrets dans le code (9/10)
- [x] Accessibilite: accessibilityLabel sur Login, Register, TicketDetail, Wallet
- [x] Console.log: wrapes avec `__DEV__` (4 fichiers)
- [x] CORS: configure dans appsettings.Production.json
- [x] Contraste: textSecondary ameliore (WCAG AA)
- [ ] Performance: temps de chargement (a mesurer)
- [ ] Tests E2E: VoiceOver/TalkBack sur device reel

### Tests
- [x] 139 tests unitaires frontend passent
- [x] TypeScript: 0 erreurs
- [x] Build backend: 0 erreurs

### Securite Backend (deja implemente)
- [x] JWT avec expiration
- [x] Rate limiting (100 req/min global, 10 req/min auth)
- [x] Password hashing (bcrypt)
- [x] CORS restrictif production
- [x] Headers securite (X-Frame-Options, CSP, etc.)
- [x] HTTPS obligatoire (HSTS)
- [x] Validation FluentValidation
- [x] Global exception handler

---

## Commandes Utiles

```bash
# Backend
cd backend/ShareTipsBackend
dotnet build
dotnet ef database update

# Frontend
cd frontend
npm test
npx tsc --noEmit
npx expo start

# EAS Build
eas build --platform all --profile production
eas submit --platform all
```

---

*Derniere mise a jour: 6 fevrier 2026*
