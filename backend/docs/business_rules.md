# BUSINESS RULES – Application communautaire de pronostics sportifs

## 1. OBJECTIF DU PRODUIT
Plateforme communautaire permettant aux utilisateurs :
- de créer des tickets de pronostics sportifs
- de vendre ou partager ces tickets
- d’acheter des tickets d’autres utilisateurs
- de gagner/perdre des crédits selon les résultats

L’application **ne propose pas de paris directs** mais une **vente de pronostics**.

---

## 2. UTILISATEURS

### 2.1 Rôles
- USER : utilisateur standard
- ADMIN : gestion, retraits, modération

### 2.2 Compte utilisateur
- Email unique
- Mot de passe hashé
- Compte actif / suspendu
- Date de création

Un utilisateur peut :
- créer des tickets
- acheter des tickets
- recevoir des crédits
- demander un retrait

---

## 3. WALLET & CRÉDITS

### 3.0 Dépôts
- Les dépôts sont effectués via un prestataire externe (ex : MoonPay)
- Le paiement est effectué en euros
- Conversion automatique : 1 € = 10 crédits
- Une fois le paiement validé, une transaction DEPOSIT est créée
- Aucun dépôt manuel côté admin

### 3.1 Principe
- Monnaie interne = crédits
- 1 € = 10 crédits
- Aucun solde modifiable directement
- Solde = somme des transactions

### 3.2 Types de transactions
- DEPOSIT (via MoonPay)
- PURCHASE (achat de ticket)
- COMMISSION (commission plateforme)
- WIN (gain ticket)
- WITHDRAW_REQUEST
- WITHDRAW_APPROVED
- WITHDRAW_REJECTED
- DEPOSIT
- PURCHASE
- WIN
- WITHDRAW_REQUEST
- WITHDRAW_APPROVED
- WITHDRAW_REJECTED

Chaque transaction est :
- horodatée
- immuable
- liée à un utilisateur

### 3.3 Règles
- Solde ne peut jamais être négatif
- Toute action financière crée une transaction
- Historique accessible par l’utilisateur

---

## 4. MATCHS & SPORTS

### 4.1 Données matchs
- Récupération via API sportive
- Zone : Europe
- Fenêtre : aujourd’hui → J+7

### 4.2 Normalisation
Chaque match contient :
- Sport (football, basket, tennis, etc.)
- Compétition / ligue
- Équipe domicile / extérieur
- Date / heure

Un match = une seule entrée en base

---

## 5. TICKETS DE PRONOSTICS

### 5.1 Création
Un ticket contient :
- Créateur
- Liste de picks (pronostics)
- Cote de chaque pick
- Cote moyenne (calculée automatiquement)
- Prix en crédits (aucune limite minimale ou maximale)
- Visibilité : PUBLIC / PRIVATE
- Indice de confiance (1 à 10)
- Multisport détecté automatiquement
- Date de création
Un ticket contient :
- Créateur
- Liste de picks (pronostics)
- Cote de chaque pick
- Cote moyenne (calculée automatiquement)
- Prix en crédits
- Visibilité : PUBLIC / PRIVATE
- Indice de confiance (1 à 10)
- Multisport détecté automatiquement
- Date de création

### 5.2 Picks
Un pick est défini par :
- Match
- Type de pari (ex: victoire domicile, nul, over, etc.)
- Cote

### 5.3 Calcul automatique
- Sport(s) du ticket = déduits des picks
- Cote moyenne = moyenne des cotes des picks

---

## 6. VISIBILITÉ DES TICKETS

### PUBLIC
- Visible par tous
- Supprimable tant que le premier match n'a pas commencé
- Modifiable uniquement avant deadline

### PRIVATE
- Visible uniquement via lien ou achat
- Peut être supprimé s’il n’a jamais été acheté

---

## 7. RÈGLES DE MODIFICATION / SUPPRESSION

### 7.1 Modification
- Possible uniquement si :
  - ticket non acheté
  - avant l’heure de début du premier match du ticket

### 7.2 Suppression
- Ticket non acheté (PUBLIC ou PRIVATE) : supprimable jusqu'à l'heure de début du premier match
- Ticket acheté : jamais supprimable

### 7.1 Modification
- Possible uniquement si :
  - ticket non acheté
  - ticket encore OPEN
  - avant 5 minutes du premier match

---

## 8. ACHAT DE TICKET

### 8.1 Conditions
- Solde suffisant obligatoire
- Ticket OPEN
- Achat interdit de ses propres tickets

### 8.2 Effets
- Débit immédiat du wallet acheteur
- Calcul et prélèvement automatique de la commission plateforme (17%)
- Crédit du créateur = prix ticket - commission
- Création transaction PURCHASE pour l’acheteur
- Création transaction COMMISSION pour la plateforme
- Ticket verrouillé après premier achat

### 8.1 Conditions
- Solde suffisant obligatoire
- Ticket OPEN

### 8.2 Effets
- Débit immédiat du wallet
- Ticket verrouillé
- Création transaction PURCHASE

---

## 9. RÉSULTATS & ÉVALUATION

### 9.1 Résultats matchs
- Récupérés automatiquement
- Mis à jour régulièrement

### 9.2 Statut ticket (cycle de vie)
- **OPEN** : ticket créé, modifiable, achetable
- **LOCKED** : premier match commencé, plus modifiable
- **FINISHED** : tous les matchs terminés

### 9.3 Résultat ticket
- **PENDING** : résultat pas encore connu
- **WIN** : tous les picks gagnants
- **LOSE** : au moins un pick perdant

Un ticket est WIN si **tous les picks sont gagnants**

### 9.3 Gains
- Crédités automatiquement
- Transaction WIN créée

---

## 10. CLASSEMENTS

Classements basés sur :
- Gains
- Taux de réussite
- Cote moyenne

Périodes :
- Jour
- Semaine
- Mois

---

## 11. RETRAITS

### 11.1 Demande
- L’utilisateur demande un retrait
- Création transaction WITHDRAW_REQUEST
- Solde correspondant bloqué

### 11.2 Validation admin
- Toute demande doit être traitée sous 24h maximum
- APPROVED → paiement manuel (virement bancaire ou crypto)
- Création transaction WITHDRAW_APPROVED
- REJECTED → solde débloqué + transaction WITHDRAW_REJECTED

### 11.1 Demande
- L’utilisateur demande un retrait
- Création transaction WITHDRAW_REQUEST
- Solde bloqué

### 11.2 Validation admin
- APPROVED → paiement manuel → transaction WITHDRAW_APPROVED
- REJECTED → solde débloqué

---

## 12. SÉCURITÉ

- JWT obligatoire sur toutes les routes sensibles
- Aucun endpoint ne modifie directement un solde
- Vérification ownership sur chaque ressource
- Logs sur toutes les actions financières

---

## 13. ANTI-FRAUDE & LIMITES

- Pas d’auto-achat de ses propres tickets
- Limite de créations abusives
- Historique immuable
- Admin peut suspendre un compte

---

## 14. PRINCIPES NON NÉGOCIABLES

- Backend first
- Tests obligatoires
- Pas de logique financière côté client
- Toute règle métier est appliquée côté serveur
- Commission plateforme obligatoire (17%)

---

## 15. ABONNEMENTS (FEATURE ÉVOLUTIVE)

### 15.1 Principe
- Un utilisateur peut s’abonner à un pronostiqueur
- L’abonnement donne accès à tous ses tickets PRIVATE
- Aucun paiement par ticket pour les abonnés

### 15.2 Règles
- Abonnement mensuel
- Prix défini par le pronostiqueur
- Paiement en crédits
- Commission plateforme applicable (17%)
- Résiliation possible à tout moment

⚠️ Cette feature sera développée après le MVP


- Backend first
- Tests obligatoires
- Pas de logique financière côté client
- Toute règle métier est appliquée côté serveur

