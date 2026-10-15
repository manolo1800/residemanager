CREATE TABLE IF NOT EXISTS "condo_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"floors" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"structure_id" uuid,
	"code" varchar(50) NOT NULL,
	"floor" integer,
	"type" varchar(20) NOT NULL,
	"area_m2" numeric(10, 2),
	"aliquot_pct" numeric(6, 3),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "common_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(30) NOT NULL,
	"capacity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parking_spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"condominium_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"assigned_unit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "date_format" varchar(20) DEFAULT 'DD/MM/YYYY' NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "foreign_currency" varchar(10);--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "foreign_currency_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "tax_exempt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "tax_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "tax_included_in_fee" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "ordinary_fee_mode" varchar(20) DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "extraordinary_requires_meeting" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "mora_type" varchar(20) DEFAULT 'percentage' NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "mora_value" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "partial_payments_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "partial_payment_interest_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "terms_own_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "condominiums" ADD COLUMN "terms_own_content" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "condo_structures" ADD CONSTRAINT "condo_structures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "condo_structures" ADD CONSTRAINT "condo_structures_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "units" ADD CONSTRAINT "units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "units" ADD CONSTRAINT "units_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "units" ADD CONSTRAINT "units_structure_id_condo_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."condo_structures"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "common_areas" ADD CONSTRAINT "common_areas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "common_areas" ADD CONSTRAINT "common_areas_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_assigned_unit_id_units_id_fk" FOREIGN KEY ("assigned_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_structures_tenant" ON "condo_structures" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_structures_condo" ON "condo_structures" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_structures_condo_name" ON "condo_structures" USING btree ("condominium_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_units_tenant" ON "units" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_units_condo" ON "units" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_units_structure" ON "units" USING btree ("structure_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_units_condo_code" ON "units" USING btree ("condominium_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_common_areas_tenant" ON "common_areas" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_common_areas_condo" ON "common_areas" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parking_spots_tenant" ON "parking_spots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parking_spots_condo" ON "parking_spots" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parking_spots_unit" ON "parking_spots" USING btree ("assigned_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parking_spots_condo_code" ON "parking_spots" USING btree ("condominium_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_condominiums_name" ON "condominiums" USING btree ("tenant_id","name");--> statement-breakpoint
ALTER TABLE "condo_structures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "common_areas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "parking_spots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY tenant_isolation ON "condo_structures"
    USING (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    WITH CHECK (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY tenant_isolation ON "units"
    USING (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    WITH CHECK (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY tenant_isolation ON "common_areas"
    USING (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    WITH CHECK (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY tenant_isolation ON "parking_spots"
    USING (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    WITH CHECK (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;