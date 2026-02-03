# SECURITY_RULES.md

## 1. Objectifs de sécurité

- Protection de l’argent (wallet, crédits, retraits)
- Protection des comptes utilisateurs
- Prévention de la fraude et des abus
- Traçabilité complète (audit)
- Séparation stricte USER / ADMIN

---

## 2. Authentification

### 2.1 JWT

- Access Token (durée : 15 minutes)
- Refresh Token (durée : 30 jours)
- Algorithme : RS256
- Rotation des refresh tokens
- Révocation immédiate en cas de suspicion

### 2.2 Stockage

- Mobile : Secure Storage (Keychain / Keystore)
- Web : HTTP-only cookie (si web plus tard)
- Jamais en localStorage

---

## 3. Mots de passe

- Hash : bcrypt (min 12 rounds)
- Politique :
  - min 8 caractères
  - 1 majuscule
  - 1 chiffre
- Blocage après 5 tentatives échouées

---

## 4. Autorisations (RBAC)

### Rôles

- USER
- ADMIN

### Règles

- USER :
  - CRUD sur ses tickets
  - Achat tickets
  - Wallet personnel
- ADMIN :
  - Validation retraits
  - Accès audit
  - Blocage comptes

---

## 5. Sécurité Wallet (CRITIQUE)

### 5.1 Principes

- Toute opération financière = transaction DB atomique
- Aucun calcul côté client
- Jamais de solde négatif

### 5.2 Double-spend protection

- Verrou pessimiste sur wallet lors :
  - achat ticket
  - retrait
- Idempotency key sur chaque requête financière

---

## 6. Achat de ticket

- Vérification :
  - ticket OPEN
  - wallet >= prix
  - ticket non acheté par l’utilisateur
- Débit acheteur
- Crédit vendeur (90%)
- Crédit plateforme (10%)
- Une seule transaction DB

---

## 7. Tickets & modifications

- Ticket verrouillé automatiquement à `firstMatchTime`
- Modification possible uniquement si :
  - pas acheté
  - avant firstMatchTime
- Suppression :
  - non acheté (public ou privé) : jusqu'à l'heure du premier match
  - acheté : jamais supprimable

---

## 8. Abonnements

- Accès aux tickets privés uniquement si abonnement actif
- Pas de double abonnement
- Vérification à chaque accès

---

## 9. Retraits

### 9.1 Règles

- Solde disponible >= montant
- Création d’une demande PENDING
- Crédit déplacé vers lockedCredits

### 9.2 Validation admin

- APPROVED : débit définitif
- REJECTED : crédits restitués

---

## 10. Anti-fraude & abus

- Rate limit API (IP + user)
- Anti spam tickets
- Détection comportements anormaux :
  - créations massives
  - achats circulaires

---

## 11. Audit & logs

- Toute action sensible loggée :
  - login
  - achat
  - retrait
  - admin action
- Logs immuables

---

## 12. Sécurité API

- HTTPS obligatoire
- CORS strict
- Validation stricte des inputs (Zod / Joi)
- Sanitization anti injection

---

## 13. Sauvegardes & incidents

- Backup DB quotidien
- Chiffrement au repos
- Plan de rollback

---

## 14. Tests de sécurité obligatoires

- Double achat impossible
- Retrait simultané bloqué
- Token expiré refusé
- USER bloqué sur routes admin
- Ticket modifié après lock refusé

