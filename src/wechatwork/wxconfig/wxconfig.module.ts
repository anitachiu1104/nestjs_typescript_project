import { Module } from '@nestjs/common';
import { WxconfigController } from './wxconfig.controller';
import { WxconfigService } from './wxconfig.service';


@Module({
    imports: [],
    controllers: [WxconfigController],
    providers: [WxconfigService],
    exports: []
})
export class WxconfigModule {}
