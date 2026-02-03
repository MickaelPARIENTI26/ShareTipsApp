-- Update LastMatchTime for all existing tickets based on their selections
-- This calculates the MAX match start time from the ticket's selections

UPDATE "Tickets" t
SET "LastMatchTime" = subquery.max_time
FROM (
    SELECT 
        ts."TicketId",
        MAX(m."StartTime") as max_time
    FROM "TicketSelections" ts
    INNER JOIN "Matches" m ON ts."MatchId" = m."Id"
    GROUP BY ts."TicketId"
) as subquery
WHERE t."Id" = subquery."TicketId"
AND (t."LastMatchTime" IS NULL OR t."LastMatchTime" = '0001-01-01 00:00:00+00');

-- For tickets without selections, set LastMatchTime = FirstMatchTime
UPDATE "Tickets"
SET "LastMatchTime" = "FirstMatchTime"
WHERE "LastMatchTime" IS NULL OR "LastMatchTime" = '0001-01-01 00:00:00+00';
