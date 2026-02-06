# ShareTips - Checklist de déploiement

## Push Notifications (EAS)

- [ ] Créer un compte Expo sur https://expo.dev
- [ ] Se connecter via CLI : `npx expo login`
- [ ] Lier le projet à Expo : `cd frontend && npx eas init`
- [ ] Vérifier que le `projectId` est ajouté dans `app.json`

### iOS
- [ ] Créer un compte Apple Developer ($99/an)
- [ ] Configurer les credentials dans EAS : `npx eas credentials`
- [ ] Activer Push Notifications dans App Store Connect

### Android
- [ ] Créer un projet Firebase Console
- [ ] Télécharger `google-services.json` et le placer dans `frontend/`
- [ ] Configurer FCM (Firebase Cloud Messaging)

---

## Stripe

- [x] Créer un compte Stripe
- [x] Configurer les clés API (test) dans `.env`
- [ ] Configurer le webhook Stripe pour production
  - URL : `https://api.sharetips.app/api/stripe/webhook`
  - Events : `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `payout.paid`, `payout.failed`
- [ ] Passer en mode production (clés live)

---

## Sentry (Crash Monitoring)

- [ ] Créer un projet sur https://sentry.io
- [ ] Récupérer le DSN
- [ ] Ajouter le DSN dans `app.json` → `extra.sentryDsn`
- [ ] Installer `@sentry/react-native` si pas déjà fait

---

## App Store (iOS)

- [ ] Compte Apple Developer actif
- [ ] Créer l'app dans App Store Connect
- [ ] Configurer les métadonnées (description, screenshots)
- [ ] Soumettre pour review

---

## Play Store (Android)

- [ ] Compte Google Play Developer ($25 one-time)
- [ ] Créer l'app dans Google Play Console
- [ ] Générer le keystore de signature
- [ ] Configurer les métadonnées
- [ ] Soumettre pour review

---

## Audits (voir AUDIT_REPORT.md)

- [x] Sécurité : tokens, données sensibles (Score: 9/10)
- [x] Accessibilité : ajouter accessibilityLabel aux boutons (Login, Register, TicketDetail, Wallet)
- [x] Supprimer console.log en production (4 fichiers wrappés avec __DEV__)
- [x] Vérification CORS production (appsettings.Production.json OK)
- [ ] Améliorer contraste textSecondary
- [ ] Performance : temps de chargement
- [ ] Tests E2E sur device réel avec VoiceOver/TalkBack

---

## Infrastructure Production

- [ ] Hébergement backend (Azure, AWS, etc.)
- [ ] Base de données PostgreSQL production
- [ ] Domaine et SSL pour `api.sharetips.app`
- [ ] Variables d'environnement production
