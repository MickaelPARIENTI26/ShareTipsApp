# DEV_ROADMAP.md

## Objectif

Construire l’application mobile (Android / iOS) + backend de manière **sécurisée, incrémentale et testée**, en utilisant **ASP.NET Core (.NET 8)** comme backend.

Stack cible :
- Backend : **ASP.NET Core Web API (.NET 8)**
- DB : PostgreSQL
- ORM : Entity Framework Core
- Front mobile : React Native (Expo)

---

## Règle d’or

👉 **On ne passe JAMAIS à l’étape suivante tant que :**
- les tests manuels sont OK
- les endpoints fonctionnent
- la sécurité est respectée

---

## SPRINT 0 – Setup projet

### Backend
- Init repo
- ASP.NET Core Web API
- EF Core + PostgreSQL
- Env dev / prod
- Clean architecture setup

### Tests de validation
- Server démarre
- Connexion DB OK

### Prompt Claude
> Initialise un backend ASP.NET Core Web API avec EF Core et PostgreSQL, structure Clean Architecture, env configuré

---

## SPRINT 1 – Authentification & User

### Backend
- User entity + migration
- Hash password (bcrypt)
- JWT access + refresh token
- Register / Login / Refresh endpoints
- Middleware de protection routes

### Tests obligatoires
- Register OK
- Login OK
- Route protégée OK
- Token expiré refusé

### Prompt Claude
> Implémente l’authentification JWT complète selon SECURITY_RULES.md en ASP.NET Core

---

## SPRINT 2 – Wallet

### Backend
- Wallet auto à l’inscription
- WalletTransaction entity
- Débit / Crédit atomique via EF Core transaction

### Tests
- Crédit OK
- Débit OK
- Solde jamais négatif

### Prompt Claude
> Implémente le wallet sécurisé avec transactions atomiques en ASP.NET Core

---

## SPRINT 3 – Sports / Leagues / Teams / Players

### Backend
- CRUD admin pour sports, leagues, teams, players
- Seed data initiale pour NBA, Tennis, Football, e-sport

### Tests
- Lecture sports OK
- Lecture joueurs OK
- Seed automatique OK

---

## SPRINT 4 – Matchs & Markets

### Backend
- Import API externe pour matchs à venir (J+7)
- Stockage matchs + markets + selections

### Tests
- Match visible
- Markets et cotes visibles
- Sélection correcte par sport

---

## SPRINT 5 – Tickets

### Backend
- Création ticket (public / privé)
- Snapshot selections dans TicketSelection
- Calcul avg odds et confidenceIndex
- Validation règles business (lock, suppression, modification)

### Tests
- Ticket créé correctement
- Snapshot figé
- Modification / suppression OK selon règles

---

## SPRINT 6 – Achat & Commission

### Backend
- Achat ticket par un utilisateur
- Commission plateforme 10%
- Transaction atomique : débit acheteur, crédit vendeur, crédit plateforme
- Historique TicketPurchase

### Tests
- Achat unique OK
- Débit / crédit correct
- Commission calculée correctement

---

## SPRINT 7 – Abonnements

### Backend
- Subscribe / Unsubscribe à un tipster
- Accès tickets privés selon abonnement

### Tests
- Accès bloqué sans abonnement
- Accès autorisé avec abonnement actif
- Vérification unique par tipster

---

## SPRINT 8 – Classements

### Backend
- Batch calcul ranking (daily / weekly / monthly)
- Snapshot utilisateur avec ROI, winRate, avgOdds

### Tests
- Classement correct
- Historique complet

---

## SPRINT 9 – Retraits

### Backend
- WithdrawalRequest endpoint
- Validation admin (APPROVED / REJECTED)
- Déplacement crédits entre balance / lockedCredits

### Tests
- Crédit bloqué correctement
- Validation / rejet OK
- Historique retrait correct

---

## SPRINT 10 – Mobile App

### Frontend (React Native)
- Auth (login / register)
- Liste des matchs
- Création tickets (sélection markets)
- Achat tickets
- Wallet / crédits
- Mes tickets (achetés / vendus / en cours)
- Classements / abonnements

### Tests
- Login mobile OK
- Achat ticket mobile OK
- Affichage wallet et tickets correct

---

## SPRINT 11 – Sécurité finale

- Rate limit API
- Audit logs immuables
- Tests abus et double-spend
- Validation JWT et refresh

---

## Ready for PROD checklist

- Aucun TODO
- Logs audit OK
- Backup DB OK
- Retraits testés
- Front + Back correctement connectés

