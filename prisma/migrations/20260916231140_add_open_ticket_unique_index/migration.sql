CREATE UNIQUE INDEX "support_tickets_one_open_per_user"
  ON "support_tickets" ("userId")
  WHERE "status" = 'OPEN' AND "userId" IS NOT NULL;

CREATE UNIQUE INDEX "support_tickets_one_open_per_guest"
  ON "support_tickets" ("guestEmail")
  WHERE "status" = 'OPEN' AND "userId" IS NULL AND "guestEmail" IS NOT NULL;
