ALTER TABLE "products"
ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'B')
) STORED;

CREATE INDEX "products_searchVector_idx" ON "products" USING GIN ("searchVector");