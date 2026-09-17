-- Account contact number. This is intentionally separate from Address.phone,
-- which belongs to an individual shipping address.
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
