# API_CONTRACT.md

## 1. Principes généraux

- API REST JSON
- Authentification via JWT (access + refresh)
- Toutes les routes privées nécessitent `Authorization: Bearer <token>`
- Timezone : UTC
- Monnaie interne : **crédits** (1€ = 10 crédits)
- Commission plateforme : **10%**
- Tous les montants sont stockés en **crédits** côté backend

---

## 2. Authentification

### POST /auth/register
Création de compte utilisateur

**Body**
```json
{
  "email": "user@email.com",
  "password": "password123",
  "username": "pseudo"
}
```

**Response**
```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

---

### POST /auth/login
Connexion utilisateur

---

### POST /auth/refresh
Rafraîchissement du token

---

## 3. Utilisateur

### GET /users/me

```json
{
  "id": "uuid",
  "username": "pseudo",
  "email": "user@email.com",
  "credits": 320,
  "stats": {
    "ticketsCreated": 42,
    "ticketsSold": 18,
    "roi": 12.5,
    "avgOdds": 2.34
  }
}
```

---

### GET /users/{id}/profile
Profil public d’un pronostiqueur

```json
{
  "id": "uuid",
  "username": "tipsterPro",
  "ranking": {
    "daily": 3,
    "weekly": 12,
    "monthly": 28
  },
  "stats": {
    "winRate": 61,
    "avgOdds": 2.1
  }
}
```

---

## 4. Sports

### GET /sports

```json
[
  { "code": "FOOTBALL", "name": "Football" },
  { "code": "BASKETBALL", "name": "Basketball" }
]
```

---

## 5. Compétitions / Ligues

### GET /leagues

Query:
- sport

```json
[
  {
    "id": "uuid",
    "sport": "FOOTBALL",
    "name": "Ligue 1",
    "country": "FR"
  }
]
```

---

## 6. Matchs

### GET /matches

**Query params**
- sport
- leagueId
- fromDate
- toDate

```json
[
  {
    "id": "uuid",
    "sport": "FOOTBALL",
    "league": "Ligue 1",
    "homeTeam": {
      "id": "uuid",
      "name": "PSG"
    },
    "awayTeam": {
      "id": "uuid",
      "name": "OM"
    },
    "startTime": "2026-02-01T20:00:00Z",
    "status": "SCHEDULED",
    "markets": [
      {
        "marketType": "MATCH_RESULT",
        "selections": [
          { "code": "HOME_WIN", "label": "Victoire domicile", "odds": 1.85 },
          { "code": "DRAW", "label": "Match nul", "odds": 3.4 },
          { "code": "AWAY_WIN", "label": "Victoire extérieur", "odds": 4.2 }
        ]
      },
      {
        "marketType": "OVER_UNDER",
        "line": 2.5,
        "selections": [
          { "code": "OVER", "odds": 1.9 },
          { "code": "UNDER", "odds": 1.9 }
        ]
      }
    ]
  }
]
```

---

### GET /matches/{id}
Détail complet d’un match (temps réel plus tard)

---

## 7. Tickets (Paris)

### POST /tickets

```json
{
  "isPublic": true,
  "priceCredits": 150,
  "confidenceIndex": 8,
  "selections": [
    {
      "matchId": "uuid",
      "sport": "FOOTBALL",
      "marketType": "MATCH_RESULT",
      "selectionCode": "HOME_WIN",
      "odds": 1.85
    }
  ]
}
```

**Backend calcule automatiquement**
- sports inclus
- cote moyenne
- date de début (premier match)

---

### GET /tickets/public

Query:
- sport
- minOdds
- maxOdds
- confidenceIndex

---

### GET /tickets/my

Retourne :
- créés
- achetés
- vendus

---

### PATCH /tickets/{id}
Modification ticket

**Rules**
- Avant le début du premier match
- Impossible si déjà acheté

---

### DELETE /tickets/{id}

**Rules**
- Non acheté (public ou privé) : supprimable jusqu'à l'heure du premier match
- Acheté : jamais supprimable

---

## 8. Achat de ticket

### POST /tickets/{id}/buy

```json
{
  "paymentMethod": "CREDITS"
}
```

**Effets**
- Débit acheteur
- Crédit vendeur (90%)
- Crédit plateforme (10%)

---

## 9. Abonnements

### POST /subscriptions/{tipsterId}

### GET /subscriptions/my

### DELETE /subscriptions/{tipsterId}

---

## 10. Wallet

### GET /wallet

```json
{
  "credits": 420,
  "pendingWithdrawals": 100
}
```

---

### POST /wallet/deposit

```json
{ "amountEUR": 50 }
```

---

### POST /wallet/withdraw

```json
{ "amountCredits": 200, "method": "CRYPTO" }
```

---

## 11. Classements

### GET /rankings

Query:
- period: DAILY | WEEKLY | MONTHLY

---

## 12. Admin

### GET /admin/withdrawals

### POST /admin/withdrawals/{id}/approve

### POST /admin/withdrawals/{id}/reject

---

## 13. Enums

### MatchStatus
- SCHEDULED
- LIVE
- FINISHED
- CANCELED

### MarketType
- MATCH_RESULT
- OVER_UNDER
- BOTH_TEAMS_SCORE

---

## 14. Tests obligatoires avant suite

- Auth OK
- Wallet crédit/débit OK
- Match + cotes affichées
- Ticket calc auto OK
- Achat OK
- Commission OK
- Blocage suppression OK

