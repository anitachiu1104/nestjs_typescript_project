import { DeviceService } from './device.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [DeviceService],
    exports: [DeviceService]
})
export class DeviceModule {}
