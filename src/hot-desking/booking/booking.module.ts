import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../core/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../core/redis/redis.module';
import { SendModule } from '../send/send.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { DeviceModule } from '../device/device.module';
import { ProfileModule } from '../../profile/profile.module';

@Module({
    imports: [RabbitmqModule, RedisModule, SendModule, DeviceModule, ProfileModule],
    controllers: [
        BookingController
    ],
    providers: [
        BookingService,
    ],
    exports: [BookingService]
})
export class BookingModule { }
