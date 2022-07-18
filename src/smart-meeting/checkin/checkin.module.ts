import { Module } from '@nestjs/common';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { UserModule } from '../../user/user.module';
import { SendModule } from '../send/send.module';
import { DeviceModule } from '../../hot-desking/device/device.module';

@Module({
    imports: [UserModule, SendModule, DeviceModule],
    controllers: [CheckinController],
    providers: [CheckinService],
    exports: [CheckinService],
})
export class CheckinModule {

}
