# ShareTips - Checklist de Mise en Production

Ce document liste toutes les tâches à effectuer avant de lancer l'application ShareTips en production.

---

## 1. Variables d'Environnement (Backend)

### Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_HOST` | Hôte PostgreSQL | `db.sharetips.app` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom de la base de données | `sharetips_prod` |
| `DB_USER` | Utilisateur PostgreSQL | `sharetips_user` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `motdepasse_tres_securise` |
| `JWT_SECRET` | Clé secrète JWT (min 32 caractères) | `Clé_très_longue_et_aléatoire_min_32_chars!` |
| `ODDS_API_KEY` | Clé API The Odds API | `abc123...` |

### Recommandées

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SENTRY_DSN` | DSN Sentry pour le monitoring | `https://xxx@sentry.io/123` |
| `MOONPAY_WEBHOOK_SECRET` | Secret webhook MoonPay | `whsec_xxx` |
| `EMAIL_SMTP_HOST` | Serveur SMTP | `smtp.sendgrid.net` |
| `EMAIL_SMTP_PORT` | Port SMTP | `587` |
| `EMAIL_SMTP_USERNAME` | Utilisateur SMTP | `apikey` |
| `EMAIL_SMTP_PASSWORD` | Mot de passe SMTP | `SG.xxx` |
| `EMAIL_FROM_ADDRESS` | Email expéditeur | `noreply@sharetips.app` |
| `EMAIL_FROM_NAME` | Nom expéditeur | `ShareTips` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Chemin vers credentials Firebase | `/app/firebase-credentials.json` |

---

## 2. Variables d'Environnement (Frontend)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL de l'API backend | `https://api.sharetips.app` |

### Configuration app.json

```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://xxx@sentry.io/456",
      "eas": {
        "projectId": "votre-project-id-eas"
      }
    }
  }
}
```

---

## 3. Services Externes à Configurer

### 3.1 Base de Données PostgreSQL

- [ ] Créer une instance PostgreSQL 16+ (ex: AWS RDS, Digital Ocean, Railway)
- [ ] Activer les backups automatiques quotidiens
- [ ] Configurer SSL/TLS pour les connexions
- [ ] Créer un utilisateur dédié avec droits limités
- [ ] Tester la connexion depuis le serveur d'application

### 3.2 The Odds API

- [ ] Créer un compte sur [the-odds-api.com](https://the-odds-api.com)
- [ ] Obtenir une clé API
- [ ] Vérifier les quotas (requests/mois selon plan)
- [ ] Configurer `ODDS_API_KEY`

### 3.3 Sentry (Monitoring/Erreurs)

- [ ] Créer un projet backend sur [sentry.io](https://sentry.io)
- [ ] Créer un projet frontend (React Native)
- [ ] Configurer `SENTRY_DSN` (backend)
- [ ] Configurer `sentryDsn` dans app.json (frontend)
- [ ] Configurer les alertes email pour les erreurs critiques

### 3.4 Firebase (Push Notifications)

- [ ] Créer un projet Firebase
- [ ] Activer Firebase Cloud Messaging (FCM)
- [ ] Télécharger le fichier `google-services.json` (Android)
- [ ] Télécharger le fichier `GoogleService-Info.plist` (iOS)
- [ ] Générer une clé de service account JSON
- [ ] Configurer `GOOGLE_APPLICATION_CREDENTIALS`

### 3.5 Email (SMTP)

Choisir un fournisseur SMTP et configurer:
- [ ] SendGrid (recommandé) ou Mailgun ou AWS SES
- [ ] Vérifier le domaine d'envoi (SPF, DKIM, DMARC)
- [ ] Configurer les variables `EMAIL_SMTP_*`
- [ ] Tester l'envoi d'emails (reset password, notifications)

### 3.6 MoonPay (Paiements - Optionnel)

- [ ] Créer un compte MoonPay Business
- [ ] Configurer le webhook URL: `https://api.sharetips.app/api/payments/moonpay/webhook`
- [ ] Récupérer le secret webhook
- [ ] Configurer `MOONPAY_WEBHOOK_SECRET`

---

## 4. Déploiement Backend

### 4.1 Docker

- [ ] Construire l'image Docker:
  ```bash
  cd backend
  docker build -t sharetips-api:latest .
  ```
- [ ] Pousser vers le registry:
  ```bash
  docker tag sharetips-api:latest ghcr.io/VOTRE_ORG/sharetips-api:latest
  docker push ghcr.io/VOTRE_ORG/sharetips-api:latest
  ```

### 4.2 Base de Données

- [ ] Exécuter les migrations EF Core:
  ```bash
  dotnet ef database update --connection "Host=...;Database=...;Username=...;Password=..."
  ```

### 4.3 Reverse Proxy (Nginx/Traefik)

- [ ] Configurer HTTPS avec certificat SSL (Let's Encrypt)
- [ ] Configurer le proxy vers le container API (port 8080)
- [ ] Activer HTTP/2
- [ ] Configurer les en-têtes de sécurité

### 4.4 Monitoring

- [ ] Configurer les health checks:
  - `/api/health` - État général
  - `/api/health/ready` - Base de données
  - `/api/health/live` - Application
- [ ] Configurer un uptime monitor (UptimeRobot, Pingdom)
- [ ] Configurer les alertes

---

## 5. Déploiement Frontend (App Stores)

### 5.1 Expo/EAS Build

- [ ] Créer un compte Expo et configurer EAS:
  ```bash
  eas login
  eas build:configure
  ```
- [ ] Configurer `eas.json` pour les builds production

### 5.2 Assets et Branding

- [ ] Icône de l'app (`icon.png` - 1024x1024)
- [ ] Splash screen (`splash.png`)
- [ ] Icône adaptive Android (foreground, background, monochrome)
- [ ] Screenshots pour les stores (6.5", 5.5", iPad)
- [ ] Bannière promotionnelle (1024x500 pour Google Play)

### 5.3 Apple App Store

- [ ] Créer un compte Apple Developer ($99/an)
- [ ] Créer l'App ID dans App Store Connect
- [ ] Configurer les Push Notifications capability
- [ ] Créer les certificats de distribution
- [ ] Préparer les métadonnées:
  - [ ] Titre (30 caractères max)
  - [ ] Sous-titre (30 caractères max)
  - [ ] Description (4000 caractères max)
  - [ ] Mots-clés (100 caractères max)
  - [ ] Catégorie (Sports)
  - [ ] Classification d'âge
  - [ ] URL politique de confidentialité
  - [ ] URL support
- [ ] Build et soumettre via EAS:
  ```bash
  eas build --platform ios --profile production
  eas submit --platform ios
  ```

### 5.4 Google Play Store

- [ ] Créer un compte Google Play Developer ($25 one-time)
- [ ] Créer l'application dans la Play Console
- [ ] Préparer les métadonnées:
  - [ ] Titre (50 caractères max)
  - [ ] Description courte (80 caractères max)
  - [ ] Description complète (4000 caractères max)
  - [ ] Catégorie (Sports)
  - [ ] Classification du contenu (questionnaire)
  - [ ] URL politique de confidentialité
- [ ] Build et soumettre via EAS:
  ```bash
  eas build --platform android --profile production
  eas submit --platform android
  ```

---

## 6. Pages Légales

### 6.1 Politique de Confidentialité

- [ ] Vérifier le contenu de `PrivacyPolicyScreen.tsx`
- [ ] Héberger une version web sur `https://sharetips.app/privacy`
- [ ] Contenu requis:
  - Données collectées
  - Utilisation des données
  - Partage avec tiers
  - Conservation des données
  - Droits des utilisateurs (RGPD)
  - Cookies et trackers
  - Contact DPO

### 6.2 Conditions Générales d'Utilisation (CGU)

- [ ] Vérifier le contenu de `CGUScreen.tsx`
- [ ] Héberger une version web sur `https://sharetips.app/cgu`
- [ ] Contenu requis:
  - Définition du service
  - Conditions d'inscription
  - Règles d'utilisation
  - Propriété intellectuelle
  - Responsabilités
  - Sanctions possibles
  - Modification des CGU

### 6.3 Conditions Générales de Vente (CGV)

- [ ] Créer les CGV pour l'achat de crédits
- [ ] Héberger sur `https://sharetips.app/cgv`
- [ ] Contenu requis:
  - Prix et modalités de paiement
  - Droit de rétractation (ou non pour services numériques)
  - Livraison (crédits instantanés)
  - Réclamations et remboursements

---

## 7. Sécurité

### 7.1 Backend (Déjà implémenté)

- [x] JWT avec expiration
- [x] Rate limiting (100 req/min global, 10 req/min auth)
- [x] Password hashing (bcrypt)
- [x] CORS restrictif en production
- [x] Headers de sécurité (X-Frame-Options, CSP, etc.)
- [x] HTTPS obligatoire (HSTS)
- [x] Validation des entrées (FluentValidation)
- [x] Global exception handler (pas de stack traces)

### 7.2 À vérifier

- [ ] Aucun secret dans le code source
- [ ] `.env` dans `.gitignore`
- [ ] Credentials Firebase dans `.gitignore`
- [ ] Logs ne contiennent pas de données sensibles
- [ ] Base de données non exposée publiquement

### 7.3 Tests de sécurité

- [ ] Scanner les dépendances vulnérables:
  ```bash
  # Backend
  dotnet list package --vulnerable --include-transitive

  # Frontend
  npm audit
  ```
- [ ] Tester les injections SQL (paramètres)
- [ ] Tester les XSS (si applicable)
- [ ] Vérifier les autorisations (un user ne peut pas voir les données d'un autre)

---

## 8. Performance

### 8.1 Backend

- [x] Response compression (Gzip + Brotli)
- [x] Caching en mémoire
- [x] Pagination des listes
- [ ] Vérifier les index de base de données
- [ ] Configurer connection pooling PostgreSQL

### 8.2 Frontend

- [ ] Optimiser les images (compression, formats modernes)
- [ ] Lazy loading des écrans
- [ ] Minimiser les re-renders inutiles

---

## 9. CI/CD

### 9.1 GitHub Actions (Déjà configuré)

- [x] Build backend
- [x] Tests unitaires
- [x] TypeScript check frontend
- [x] Lint frontend
- [x] Build Docker
- [x] Scan de sécurité

### 9.2 Secrets GitHub à configurer

- [ ] `DOCKER_USERNAME`
- [ ] `DOCKER_PASSWORD` ou `GHCR_TOKEN`
- [ ] Autres secrets si déploiement automatique

---

## 10. Checklist Finale Avant Lancement

### Infrastructure

- [ ] Serveur de production provisionné
- [ ] PostgreSQL production configuré
- [ ] DNS configuré (`api.sharetips.app`, `sharetips.app`)
- [ ] Certificats SSL actifs
- [ ] Backups automatiques activés

### Application

- [ ] Toutes les variables d'environnement configurées
- [ ] Migrations de base de données appliquées
- [ ] Health checks fonctionnels
- [ ] Logs centralisés et accessibles
- [ ] Sentry reçoit les erreurs

### Stores

- [ ] App iOS soumise et approuvée
- [ ] App Android soumise et approuvée
- [ ] Pages store complètes (screenshots, descriptions)
- [ ] Liens légaux fonctionnels

### Monitoring

- [ ] Alertes configurées (downtime, erreurs critiques)
- [ ] Dashboard de métriques accessible
- [ ] Procédure de rollback documentée

### Légal

- [ ] CGU publiées
- [ ] CGV publiées
- [ ] Politique de confidentialité publiée
- [ ] Mentions légales sur le site web

---

## 11. Post-Lancement

- [ ] Surveiller les erreurs Sentry les premières 48h
- [ ] Surveiller la charge serveur
- [ ] Répondre rapidement aux avis utilisateurs
- [ ] Préparer les hotfixes si nécessaire
- [ ] Documenter les incidents

---

## Contacts Utiles

| Service | Contact | Notes |
|---------|---------|-------|
| Support ShareTips | support@sharetips.app | - |
| The Odds API | support@the-odds-api.com | - |
| Sentry | [sentry.io/support](https://sentry.io/support) | - |
| Firebase | [Firebase Console](https://console.firebase.google.com) | - |

---

*Document créé le 2 février 2026*
*Dernière mise à jour: 2 février 2026*
