ALTER TABLE "entries" ADD COLUMN "external_source" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "study_topics" ADD COLUMN "external_source" text;--> statement-breakpoint
ALTER TABLE "study_topics" ADD COLUMN "external_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "entries_external_idx" ON "entries" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_topics_external_idx" ON "study_topics" USING btree ("external_source","external_id");