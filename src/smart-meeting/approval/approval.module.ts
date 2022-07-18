import { Module } from '@nestjs/common';
import { RedisModule } from "../../core/redis/redis.module";
import { SendModule } from "../send/send.module";
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ProfileModule } from '../../profile/profile.module';


@Module({
    imports: [RedisModule, SendModule,ProfileModule],
    providers: [ApprovalService],
    controllers: [ApprovalController],
    exports: [ApprovalService],
})
export class ApprovalModule {
}
