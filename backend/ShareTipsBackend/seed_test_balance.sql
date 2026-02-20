-- Add 100 EUR (10000 cents) to all wallets for testing
UPDATE "Wallets" 
SET "TipsterBalanceCents" = "TipsterBalanceCents" + 10000,
    "TotalEarnedCents" = "TotalEarnedCents" + 10000,
    "UpdatedAt" = NOW();

-- Show results
SELECT u."Username", w."TipsterBalanceCents" / 100.0 as "BalanceEUR", w."TotalEarnedCents" / 100.0 as "TotalEarnedEUR"
FROM "Wallets" w
JOIN "Users" u ON w."UserId" = u."Id";
