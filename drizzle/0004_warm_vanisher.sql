CREATE TABLE "dependency_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" integer NOT NULL,
	"source_path" text NOT NULL,
	"target_path" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dependency_edges" ADD CONSTRAINT "dependency_edges_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE no action ON UPDATE no action;