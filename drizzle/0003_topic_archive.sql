ALTER TABLE "study_topics" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "study_topics" ADD COLUMN "archive_reason" text;