-- pg_trgm powers typo-tolerant name search. It is a "trusted" extension, so the database
-- owner can enable it without superuser rights.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "businesses_name_trgm_idx" ON "businesses" USING GIN ("name" gin_trgm_ops);
