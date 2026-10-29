ALTER TABLE "profile" ALTER COLUMN "locale" SET DEFAULT 'es';--> statement-breakpoint
ALTER TABLE "lesson_language" ALTER COLUMN "locale" SET DEFAULT 'es';--> statement-breakpoint
ALTER TABLE "course_import_draft" ALTER COLUMN "locale" SET DEFAULT 'es';--> statement-breakpoint
UPDATE "profile" SET "locale" = 'es' WHERE "locale" = 'en';
