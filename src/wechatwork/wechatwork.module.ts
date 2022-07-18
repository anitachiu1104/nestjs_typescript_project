import { Module } from '@nestjs/common';
import { WxconfigModule } from './wxconfig/wxconfig.module';


@Module({
    imports: [WxconfigModule],
    controllers: [],
    providers: [],
    exports: []
})
export class WechatworkModule {}
