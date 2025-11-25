CREATE TYPE "public"."upload_status" AS ENUM('uploaded', 'failed');--> statement-breakpoint
CREATE TABLE "attendance_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"department_id" integer NOT NULL,
	"blob_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"status" "upload_status" DEFAULT 'uploaded' NOT NULL,
	"error" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_uploads" ADD CONSTRAINT "attendance_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_uploads" ADD CONSTRAINT "attendance_uploads_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;