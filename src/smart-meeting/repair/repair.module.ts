import { RepairService } from '../repair/repair.service';
import { Module } from '@nestjs/common';
import { RepairController } from '../repair/repair.controller';
import {ConfigModule} from "../../core/config/config.module";
@Module({
    imports: [ConfigModule],
    controllers: [RepairController],
    providers: [RepairService],
    exports: [RepairService],
})
export class RepairModule {

}