# TECH ARCHITECTURE – Application mobile de pronostics sportifs

## 1. VUE D’ENSEMBLE

Architecture orientée API sécurisée, consommée par une application mobile iOS / Android.

```
[ Mobile App (React Native) ]
            |
            v
[ API Backend ASP.NET Core ]
            |
            v
[ PostgreSQL ]
```

Le backend est **l’unique source de vérité**.
Aucune logique financière ou métier critique côté mobile.

---

## 2. STACK TECHNIQUE

### 2.1 Backend
- ASP.NET Core Web API
- .NET 8
- Architecture Clean / Hexagonale
- Authentification JWT + Refresh Token
- ORM : Entity Framework Core
- Tests : xUnit

### 2.2 Base de données
- PostgreSQL
- Migrations EF Core
- Données financières immuables

### 2.3 Application Mobile
- React Native
- Expo (build iOS / Android)
- TypeScript
- Navigation : React Navigation
- State : Context API (Redux possible plus tard)

### 2.4 Outils
- Postman / Insomnia : tests API
- Git + GitHub
- CI simple (plus tard)

---

## 3. ARCHITECTURE BACKEND

### 3.1 Découpage par modules

```
/Api
 /Auth
 /Users
 /Wallet
 /Transactions
 /Matches
 /Tickets
 /Purchases
 /Results
 /Leaderboards
 /Withdraws
 /Subscriptions (POST-MVP)

/Core
 /Entities
 /Enums
 /Interfaces
 /ValueObjects

/Infrastructure
 /Persistence
 /ExternalApis
 /Security

/Tests
```

---

## 4. SÉCURITÉ

### 4.1 Authentification
- JWT Access Token (court)
- Refresh Token (long)
- Stockage sécurisé

### 4.2 Autorisations
- Vérification ownership sur chaque ressource
- Rôles USER / ADMIN

### 4.3 Sécurité financière
- Aucune écriture directe du solde
- Solde calculé via transactions
- Logs obligatoires

---

## 5. API SPORTIVE

### 5.1 Récupération matchs
- API sportive européenne
- Sports multiples
- Fenêtre : J → J+7

### 5.2 Cache
- Cache serveur (15 minutes)
- Normalisation données

---

## 6. INTÉGRATION MOONPAY

### 6.1 Principe
- L’utilisateur paie en euros via MoonPay
- Webhook MoonPay → Backend
- Validation paiement
- Conversion 1 € = 10 crédits

### 6.2 Sécurité
- Vérification signature webhook
- Création transaction DEPOSIT

---

## 7. RETRAITS

### 7.1 Processus
- Demande utilisateur
- Solde bloqué
- Validation admin sous 24h
- Paiement manuel (virement ou crypto)

---

## 8. MOBILE APP

### 8.1 Communication
- HTTPS uniquement
- JWT stocké en Secure Storage

### 8.2 Écrans principaux
- Login / Register
- Dashboard
- **Liste des matchs (création de ticket)**
- Création ticket (à partir des matchs)
- Achat ticket
- Wallet
- **Mes tickets**
  - Tickets créés
  - Tickets vendus
  - Tickets achetés
- Résultats
- Classements
- Profil
- Login / Register
- Dashboard
- Wallet
- Création ticket
- Achat ticket
- Résultats
- Classements
- Profil

---

## 9. ADMINISTRATION

- Interface admin séparée (plus tard)
- Validation retraits
- Suspension comptes
- Modération tickets

---

## 10. PRINCIPES NON NÉGOCIABLES

- Backend first
- API testée avant mobile
- Sécurité prioritaire
- Tests obligatoires
- Évolutivité (abonnements, payouts automatiques)

