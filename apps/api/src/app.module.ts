import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./common/database/database.module";
import { SecurityModule } from "./common/security/security.module";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { CondominiumsModule } from "./modules/condominiums/condominiums.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { BillingModule } from "./modules/billing/billing.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { StaffPayrollModule } from "./modules/staff-payroll/staff-payroll.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    DatabaseModule,
    SecurityModule,
    HealthModule,
    IdentityModule,
    CondominiumsModule,
    PropertiesModule,
    BillingModule,
    PaymentsModule,
    ExpensesModule,
    StaffPayrollModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
