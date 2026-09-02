CREATE TABLE "approvals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"incident_id" varchar(255) NOT NULL,
	"quote_id" varchar(255) NOT NULL,
	"approver_id" varchar(255) NOT NULL,
	"approver_name" varchar(255) NOT NULL,
	"approver_role" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"amount_minor_units" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"explicit_ack" boolean NOT NULL,
	"notes" text,
	"decided_at" timestamp NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	CONSTRAINT "approvals_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"estate_id" varchar(255) NOT NULL,
	"estate_label" varchar(255) NOT NULL,
	"space_id" varchar(255) NOT NULL,
	"space_label" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"next_scheduled_service" timestamp NOT NULL,
	"location" varchar(255) NOT NULL,
	"serial_number" varchar(255) NOT NULL,
	"specifications" text NOT NULL,
	"last_service_date" timestamp NOT NULL,
	"telemetry" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"sequence_number" serial NOT NULL,
	"aggregate_type" varchar(100) NOT NULL,
	"aggregate_id" varchar(255) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"action" varchar(255) NOT NULL,
	"previous_hash" varchar(100) NOT NULL,
	"hash" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"location" varchar(255) NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"active_incidents_count" integer NOT NULL,
	"total_assets_count" integer NOT NULL,
	"monthly_budget_minor_units" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"reference_number" varchar(100) NOT NULL,
	"estate_id" varchar(255) NOT NULL,
	"estate_label" varchar(255) NOT NULL,
	"asset_id" varchar(255),
	"asset_name" varchar(255),
	"severity" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"reported_by" varchar(255) NOT NULL,
	"reported_by_role" varchar(100) NOT NULL,
	"reported_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"triage" jsonb NOT NULL,
	"selected_quote_id" varchar(255),
	"work_order_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"policy_set_id" varchar(255) NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"incident_id" varchar(255) NOT NULL,
	"vendor_id" varchar(255) NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"vendor_rating" integer NOT NULL,
	"total_amount_minor_units" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"breakdown" jsonb NOT NULL,
	"eta_hours" integer NOT NULL,
	"estimated_arrival_timestamp" timestamp NOT NULL,
	"warranty_months" integer NOT NULL,
	"scope_description" text NOT NULL,
	"risk_rating" varchar(50) NOT NULL,
	"ai_recommendation_score" integer NOT NULL,
	"ai_recommendation_rationale" text NOT NULL,
	"is_ai_recommended" boolean NOT NULL,
	"compliance_verified" boolean NOT NULL,
	"submitted_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"primary_contact" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"service_regions" jsonb NOT NULL,
	"average_sla_minutes" integer NOT NULL,
	"compliance" jsonb NOT NULL,
	"rating" integer NOT NULL,
	"completed_jobs_count" integer NOT NULL,
	"active_status" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"work_order_number" varchar(100) NOT NULL,
	"incident_id" varchar(255) NOT NULL,
	"quote_id" varchar(255) NOT NULL,
	"estate_id" varchar(255) NOT NULL,
	"vendor_id" varchar(255) NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"assigned_technician" varchar(255),
	"technician_contact" varchar(255),
	"scheduled_arrival" timestamp NOT NULL,
	"dispatched_at" timestamp NOT NULL,
	"acknowledged_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"outbox_dispatched" boolean DEFAULT false NOT NULL,
	"outbox_attempts" integer DEFAULT 0 NOT NULL,
	"sla_target_minutes" integer NOT NULL,
	"notes" text,
	CONSTRAINT "work_orders_work_order_number_unique" UNIQUE("work_order_number")
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estates" ADD CONSTRAINT "estates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;