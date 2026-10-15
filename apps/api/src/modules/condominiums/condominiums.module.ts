import { Module } from "@nestjs/common";
import { CondominiumsFacade } from "./condominiums.facade";
import { CondominiumService } from "./application/services/condominium.service";
import { StructureService } from "./application/services/structure.service";
import { UnitService } from "./application/services/unit.service";
import { CommonAreaService } from "./application/services/common-area.service";
import { ParkingSpotService } from "./application/services/parking-spot.service";
import { CondominiumRepository } from "./infrastructure/repositories/condominium.repository";
import { StructureRepository } from "./infrastructure/repositories/structure.repository";
import { UnitRepository } from "./infrastructure/repositories/unit.repository";
import { CommonAreaRepository } from "./infrastructure/repositories/common-area.repository";
import { ParkingSpotRepository } from "./infrastructure/repositories/parking-spot.repository";
import { CondominiumController } from "./presentation/controllers/condominium.controller";
import { StructureController } from "./presentation/controllers/structure.controller";
import { UnitController } from "./presentation/controllers/unit.controller";
import { CommonAreaController } from "./presentation/controllers/common-area.controller";
import { ParkingSpotController } from "./presentation/controllers/parking-spot.controller";

@Module({
  controllers: [
    CondominiumController,
    StructureController,
    UnitController,
    CommonAreaController,
    ParkingSpotController,
  ],
  providers: [
    CondominiumsFacade,
    CondominiumService,
    StructureService,
    UnitService,
    CommonAreaService,
    ParkingSpotService,
    CondominiumRepository,
    StructureRepository,
    UnitRepository,
    CommonAreaRepository,
    ParkingSpotRepository,
  ],
  exports: [CondominiumsFacade],
})
export class CondominiumsModule {}
