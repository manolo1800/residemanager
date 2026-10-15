CREATE TABLE IF NOT EXISTS "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_type" varchar(20) NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unit_ownerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_primary_residence" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ownership_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"from_person_id" uuid NOT NULL,
	"to_person_id" uuid NOT NULL,
	"contract_file_url" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resident_link_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"unit_code" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resident_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persons" ADD CONSTRAINT "persons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_ownerships" ADD CONSTRAINT "unit_ownerships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_ownerships" ADD CONSTRAINT "unit_ownerships_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_ownerships" ADD CONSTRAINT "unit_ownerships_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_ownerships" ADD CONSTRAINT "unit_ownerships_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_from_person_id_persons_id_fk" FOREIGN KEY ("from_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_to_person_id_persons_id_fk" FOREIGN KEY ("to_person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_link_requests" ADD CONSTRAINT "resident_link_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_link_requests" ADD CONSTRAINT "resident_link_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_link_requests" ADD CONSTRAINT "resident_link_requests_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_link_requests" ADD CONSTRAINT "resident_link_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_profiles" ADD CONSTRAINT "resident_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_profiles" ADD CONSTRAINT "resident_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resident_profiles" ADD CONSTRAINT "resident_profiles_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_persons_tenant" ON "persons" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_persons_tenant_document" ON "persons" USING btree ("tenant_id","document_type","document_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_persons_tenant_name" ON "persons" USING btree ("tenant_id","full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_ownerships_tenant" ON "unit_ownerships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_ownerships_condo" ON "unit_ownerships" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_ownerships_unit" ON "unit_ownerships" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_ownerships_person" ON "unit_ownerships" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_ownerships_unit_status" ON "unit_ownerships" USING btree ("unit_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfers_tenant" ON "ownership_transfers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfers_condo" ON "ownership_transfers" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfers_unit" ON "ownership_transfers" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfers_status" ON "ownership_transfers" USING btree ("condominium_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_reqs_tenant" ON "resident_link_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_reqs_condo" ON "resident_link_requests" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_reqs_user" ON "resident_link_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_reqs_status" ON "resident_link_requests" USING btree ("condominium_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resident_profiles_tenant" ON "resident_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resident_profiles_user" ON "resident_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resident_profiles_person" ON "resident_profiles" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_resident_profiles_user_person" ON "resident_profiles" USING btree ("user_id","person_id");