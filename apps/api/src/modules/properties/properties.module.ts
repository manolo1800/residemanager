import { Module } from "@nestjs/common";
import { PropertiesFacade } from "./properties.facade";
import { CondominiumsModule } from "../condominiums/condominiums.module";
import { PersonService } from "./application/services/person.service";
import { OwnershipService } from "./application/services/ownership.service";
import { ResidentLinkService } from "./application/services/resident-link.service";
import { PersonRepository } from "./infrastructure/repositories/person.repository";
import { UnitOwnershipRepository } from "./infrastructure/repositories/unit-ownership.repository";
import { OwnershipTransferRepository } from "./infrastructure/repositories/ownership-transfer.repository";
import { ResidentLinkRepository } from "./infrastructure/repositories/resident-link.repository";
import { PersonController } from "./presentation/controllers/person.controller";
import { OwnershipController } from "./presentation/controllers/ownership.controller";
import { ResidentLinkController } from "./presentation/controllers/resident-link.controller";

@Module({
  imports: [CondominiumsModule],
  controllers: [
    PersonController,
    OwnershipController,
    ResidentLinkController,
  ],
  providers: [
    PropertiesFacade,
    PersonService,
    OwnershipService,
    ResidentLinkService,
    PersonRepository,
    UnitOwnershipRepository,
    OwnershipTransferRepository,
    ResidentLinkRepository,
  ],
  exports: [PropertiesFacade],
})
export class PropertiesModule {}
