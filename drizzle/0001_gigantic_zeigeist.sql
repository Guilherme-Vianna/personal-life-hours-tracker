ALTER TABLE "routines" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "end_date" date;--> statement-breakpoint
UPDATE "routines" r SET "start_date" = COALESCE(
	(SELECT min(e."date") FROM "entries" e WHERE e."routine_id" = r."id"),
	(r."created_at" AT TIME ZONE 'America/Sao_Paulo')::date
);--> statement-breakpoint
ALTER TABLE "routines" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
DELETE FROM "entries" e USING "routines" r
WHERE e."routine_id" = r."id"
	AND e."activity" = r."activity"
	AND e."category_id" = r."category_id"
	AND e."hours" = r."hours"
	AND e."study_topic_id" IS NOT DISTINCT FROM r."study_topic_id";--> statement-breakpoint
ALTER TABLE "entries" DROP CONSTRAINT "entries_routine_id_routines_id_fk";--> statement-breakpoint
ALTER TABLE "entries" DROP COLUMN "routine_id";
