import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { SignBeforeMessage } from './sign-before.message';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import { MqConsumersEntity } from '../../model/mq_consumers.entity'
import * as moment from 'moment';
import { dateFormat } from '../common/const';

@Injectable()
@DlxMessageDecorator('hot-desking.sign.before')
export class SignBeforeHandler implements DlxMessageProvider {

    async handle(data: SignBeforeMessage, context: RabbitmqContext): Promise<string> {
        console.debug('签到前提醒! ------------>' + JSON.stringify(data));
        const { id, message, updateTime } = data;
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id:context.contextId});
        if (moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return ;
        }

        const booking = await context.conn
            .getRepository(HotDeskingBooking)
            .findOne(id);

        if (booking.state !== 1) {
            return ;
        }

        if (moment(booking.updateTime).format(dateFormat) === updateTime) {
            await context.client.send({ cmd: 'wism_wechatwork.sendMessage' }, message).toPromise();
        }

        return 'success';
    }

}
