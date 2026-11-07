-- Add features introduced after the original Prisma schema.
-- IF NOT EXISTS also supports databases that received the former upgrade SQL.
BEGIN;

ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "allow_member_expense_edit" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "allow_member_polls" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "allow_member_quests" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ(6);
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "availability_deadline" DATE;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "theme" TEXT;
ALTER TABLE "trips" ALTER COLUMN "allow_member_invite" SET DEFAULT true;
ALTER TABLE "itinerary_activities" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "trip_templates" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "item_comments" (
  "id" UUID NOT NULL,
  "trip_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "item_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quests" (
  "id" UUID NOT NULL,
  "trip_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "targets" TEXT[] NOT NULL,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quest_progress" (
  "quest_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "completed" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "quest_progress_pkey" PRIMARY KEY ("quest_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "trip_templates_user_id_idx" ON "trip_templates"("user_id");
CREATE INDEX IF NOT EXISTS "item_comments_trip_id_target_type_target_id_idx" ON "item_comments"("trip_id", "target_type", "target_id");
CREATE INDEX IF NOT EXISTS "quests_trip_id_idx" ON "quests"("trip_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'trip_templates'::regclass AND conname = 'trip_templates_user_id_fkey') THEN
    ALTER TABLE "trip_templates" ADD CONSTRAINT "trip_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'item_comments'::regclass AND conname = 'item_comments_trip_id_fkey') THEN
    ALTER TABLE "item_comments" ADD CONSTRAINT "item_comments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'item_comments'::regclass AND conname = 'item_comments_user_id_fkey') THEN
    ALTER TABLE "item_comments" ADD CONSTRAINT "item_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'quests'::regclass AND conname = 'quests_trip_id_fkey') THEN
    ALTER TABLE "quests" ADD CONSTRAINT "quests_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'quest_progress'::regclass AND conname = 'quest_progress_quest_id_fkey') THEN
    ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'quest_progress'::regclass AND conname = 'quest_progress_user_id_fkey') THEN
    ALTER TABLE "quest_progress" ADD CONSTRAINT "quest_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
