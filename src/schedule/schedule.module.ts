import { Module, OnModuleInit } from "@nestjs/common";
import { DiscoveryModule, DiscoveryService } from "@nestjs/core";
import { ConfigModule } from "../core/config/config.module";
import { RedisModule } from '../core/redis/redis.module';
import { ScheduleDecoratorParam } from "./schedule.decorator";
import { ScheduleManager } from "./schedule.manager";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from './schedule.controller';

@Module({
    imports: [DiscoveryModule, ConfigModule, RedisModule],
    controllers: [ScheduleController],
    providers: [ScheduleManager, ScheduleService],
    exports: [ScheduleService]
})
export class ScheduleModule implements OnModuleInit {
    private readonly discoveryService: DiscoveryService;
    private readonly scheduleManager: ScheduleManager;

    constructor(discoveryService: DiscoveryService, scheduleManager: ScheduleManager) {
        this.discoveryService = discoveryService;
        this.scheduleManager = scheduleManager;
    }

    onModuleInit() {
        const wrappers = this.discoveryService.getProviders();
        for (let wrapper of wrappers) {
            if (wrapper.metatype) {
                const scheduleParams: ScheduleDecoratorParam = Reflect.getMetadata('ScheduleHandler', wrapper.metatype);
                if (!scheduleParams) continue;
                this.scheduleManager.registerScheduleProvider(scheduleParams.name, {
                    provider: wrapper.instance,
                    params: scheduleParams
                });
            }
        }
    }
}
