import { Module } from '@nestjs/common';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';

@Module({
    imports: [],
    exports: [BuildingService],
    providers: [BuildingService],
    controllers: [BuildingController]
})
export class BuildingModule {}
