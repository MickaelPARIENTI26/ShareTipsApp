# DATA_MODEL.md

## 1. Choix de la base de données

👉 **PostgreSQL** (recommandé)

Raisons :
- Argent / wallet / transactions → ACID obligatoire
- Relations fortes (users, tickets, achats)
- Intégrité référentielle
- Index avancés

ORM recommandé : **Prisma** ou **TypeORM**

---

## 2. User

```sql
User
- id (UUID, PK)
- email (unique, index)
- username (unique)
- passwordHash
- role (USER | ADMIN)
- isVerified
- createdAt
- updatedAt
- deletedAt (soft delete)
```

---

## 3. Wallet

```sql
Wallet
- id (UUID, PK)
- userId (FK User, unique)
- balanceCredits (int)
- lockedCredits (int)
- createdAt
- updatedAt
```

---

## 4. WalletTransaction

```sql
WalletTransaction
- id (UUID, PK)
- walletId (FK Wallet)
- type (DEPOSIT | PURCHASE | SALE | COMMISSION | WITHDRAW_REQUEST | WITHDRAW_APPROVED | REFUND)
- amountCredits (int)
- referenceId (nullable)
- status (PENDING | COMPLETED | FAILED)
- createdAt
```

Indexes:
- walletId
- type

---

## 5. Sport

```sql
Sport
- code (PK)
- name
```

---

## 6. League

```sql
League
- id (UUID, PK)
- sportCode (FK Sport)
- name
- country
```

---

## 7. Team

```sql
Team
- id (UUID, PK)
- name
- sportCode
```

---

## 8. Player

```sql
Player
- id (UUID, PK)
- teamId (FK Team)
- name
- position
- isActive
```

---

## 9. Match

```sql
Match
- id (UUID, PK)
- sportCode
- leagueId (FK League)
- homeTeamId (FK Team)
- awayTeamId (FK Team)
- startTime
- status (SCHEDULED | LIVE | FINISHED | CANCELED)
- createdAt
```

Indexes:
- startTime
- leagueId

---

## 10. Market

```sql
Market
- id (UUID, PK)
- matchId (FK Match)
- marketType
- label
- params (JSONB)
```

---

## 11. MarketSelection

```sql
MarketSelection
- id (UUID, PK)
- marketId (FK Market)
- label
- odds (decimal)
- playerId (nullable FK Player)
```

---

## 12. Ticket

```sql
Ticket
- id (UUID, PK)
- creatorId (FK User)
- title
- isPublic
- priceCredits
- confidenceIndex (1-10)
- avgOdds
- sports (array)
- firstMatchTime
- status (OPEN | LOCKED | FINISHED)
- result (PENDING | WIN | LOSE)
- createdAt
- deletedAt
```

### Status (cycle de vie)
- **OPEN** : ticket créé, modifiable, achetable
- **LOCKED** : premier match commencé, plus modifiable
- **FINISHED** : tous les matchs terminés

### Result (résultat)
- **PENDING** : résultat pas encore connu
- **WIN** : tous les picks gagnants
- **LOSE** : au moins un pick perdant

Indexes:
- creatorId
- status
- firstMatchTime

---

## 13. TicketSelection (Snapshot)

```sql
TicketSelection
- id (UUID, PK)
- ticketId (FK Ticket)
- matchId
- marketType
- selectionLabel
- odds
- playerName (nullable)
```

---

## 14. TicketPurchase

```sql
TicketPurchase
- id (UUID, PK)
- ticketId (FK Ticket)
- buyerId (FK User)
- priceCredits
- commissionCredits
- createdAt
```

Indexes:
- ticketId
- buyerId

---

## 15. Subscription

```sql
Subscription
- id (UUID, PK)
- subscriberId (FK User)
- tipsterId (FK User)
- startDate
- endDate
- isActive
```

Unique:
- subscriberId + tipsterId

---

## 16. Withdrawal

```sql
Withdrawal
- id (UUID, PK)
- userId (FK User)
- amountCredits
- method (CRYPTO | BANK)
- status (PENDING | APPROVED | REJECTED)
- requestedAt
- processedAt
```

---

## 17. RankingSnapshot

```sql
RankingSnapshot
- id (UUID, PK)
- userId
- period (DAILY | WEEKLY | MONTHLY)
- rank
- winRate
- avgOdds
- roi
- createdAt
```

---

## 18. AuditLog (sécurité)

```sql
AuditLog
- id (UUID, PK)
- userId
- action
- metadata (JSONB)
- createdAt
```

---

## 19. Règles d’intégrité critiques

- Wallet.balanceCredits >= 0
- Ticket verrouillé à firstMatchTime
- Achat ticket = transaction atomique
- Odds figées dans TicketSelection
- Soft delete uniquement

---

## 20. Ce modèle permet

- Tous types de markets (buteur, score exact, etc.)
- Sécurité financière
- Scalabilité
- Historique complet

---

## 21. Validation avant dev

- Création user + wallet auto
- Transaction wallet OK
- Match + markets + selections OK
- Ticket snapshot OK
- Achat atomique OK

