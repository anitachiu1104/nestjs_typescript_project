import { ProfileModule } from './../../profile/profile.module';
import { SendDelayService } from './send-delay.service';
import { Module } from '@nestjs/common';
import { RabbitmqModule } from 'src/core/rabbitmq/rabbitmq.module';

@Module({
    imports: [RabbitmqModule, ProfileModule],
    providers: [SendDelayService],
    exports: [SendDelayService],

})
export class SendModule {

}
