import { Module } from '@nestjs/common';
import { PadGateway } from './pad.gateway';

@Module({
    imports: [],
    controllers: [],
    providers: [PadGateway],
    exports: [PadGateway]
})
export class WebsocketModule {}
