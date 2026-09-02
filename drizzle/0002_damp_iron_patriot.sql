ALTER TABLE "analyzed_files" ADD COLUMN "in_degree" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "analyzed_files" ADD COLUMN "out_degree" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "analyzed_files" ADD COLUMN "importance_score" integer DEFAULT 0;