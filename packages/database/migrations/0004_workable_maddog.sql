CREATE TABLE IF NOT EXISTS "fee_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"mode" varchar(20) DEFAULT 'fixed' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"applies_to" varchar(20) DEFAULT 'all' NOT NULL,
	"structure_id" uuid,
	"unit_id" uuid,
	"tax_applies" boolean DEFAULT true NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"requires_meeting" boolean DEFAULT false NOT NULL,
	"minute_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unit_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"fee_plan_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"amount_base" numeric(14, 2) NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"mora_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "uq_unit_charges_unit_plan_period" UNIQUE("unit_id","fee_plan_id","period")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mora_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"applies_after_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currency_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"from_currency" varchar(10) NOT NULL,
	"to_currency" varchar(10) NOT NULL,
	"rate" numeric(18, 6) NOT NULL,
	"source" text,
	"effective_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_structure_id_condo_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."condo_structures"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_charges" ADD CONSTRAINT "unit_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_charges" ADD CONSTRAINT "unit_charges_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_charges" ADD CONSTRAINT "unit_charges_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unit_charges" ADD CONSTRAINT "unit_charges_fee_plan_id_fee_plans_id_fk" FOREIGN KEY ("fee_plan_id") REFERENCES "public"."fee_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mora_rules" ADD CONSTRAINT "mora_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mora_rules" ADD CONSTRAINT "mora_rules_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "currency_rates" ADD CONSTRAINT "currency_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "currency_rates" ADD CONSTRAINT "currency_rates_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_plans_tenant" ON "fee_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_plans_condo" ON "fee_plans" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_plans_condo_status" ON "fee_plans" USING btree ("condominium_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_plans_structure" ON "fee_plans" USING btree ("structure_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_plans_unit" ON "fee_plans" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_charges_tenant" ON "unit_charges" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_charges_condo" ON "unit_charges" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_charges_unit" ON "unit_charges" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_charges_period" ON "unit_charges" USING btree ("period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_charges_status" ON "unit_charges" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_unit_charges_due_date" ON "unit_charges" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mora_rules_tenant" ON "mora_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mora_rules_condo" ON "mora_rules" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_currency_rates_tenant" ON "currency_rates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_currency_rates_condo" ON "currency_rates" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_currency_rates_currencies" ON "currency_rates" USING btree ("condominium_id","from_currency","to_currency");