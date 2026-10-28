ALTER TABLE "entries" ADD COLUMN "study_type" text;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "study_type" text;--> statement-breakpoint
UPDATE "entries" SET "study_type" = 'theory' WHERE "study_topic_id" IS NOT NULL OR "category_id" IN (SELECT "category_id" FROM "study_topics" WHERE "category_id" IS NOT NULL);--> statement-breakpoint
UPDATE "routines" SET "study_type" = 'theory' WHERE "study_topic_id" IS NOT NULL OR "category_id" IN (SELECT "category_id" FROM "study_topics" WHERE "category_id" IS NOT NULL);
