import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../core/rabbitmq/rabbitmq.module';
import { UserModule } from '../../user/user.module';
import { BookingModule } from '../booking/booking.module';
import { SendModule } from '../send/send.module';
import { ProfileModule } from '../../profile/profile.module';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [
        BookingModule,
        UserModule,
        RabbitmqModule,
        SendModule,
        ProfileModule,
        AuthModule,
    ],
    controllers: [
        CheckinController
    ],
    providers: [CheckinService],
})
export class CheckinModule { }
