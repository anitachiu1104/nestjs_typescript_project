import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from "./booking.service";
import { RedisModule } from "../../core/redis/redis.module";
import { SendModule } from "../send/send.module";
import { ConfigModule } from '../../core/config/config.module';
import { ProfileModule } from '../../profile/profile.module';
import { CheckinModule } from '../checkin/checkin.module'
import { UserModule } from '../../user/user.module';
import { WebsocketModule } from '../../websocket/websocket.module';


@Module({
    imports: [RedisModule,SendModule,ConfigModule,ProfileModule,CheckinModule,UserModule,WebsocketModule],
    providers: [BookingService],
    controllers: [BookingController],
    exports: [BookingService],
})
export class BookingModule {}
