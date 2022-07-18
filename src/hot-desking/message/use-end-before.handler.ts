import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { UseEndBeforeMessage } from './use-end-before.message';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import * as moment from 'moment';
import { dateFormat } from '../common/const';
import {MqConsumersEntity} from "../../model/mq_consumers.entity";

@Injectable()
@DlxMessageDecorator('hot-desking.use.end.before')
export class UseEndBeforeHandler implements DlxMessageProvider {

    async handle(message: UseEndBeforeMessage, context: RabbitmqContext): Promise<string> {
        console.debug('使用结束提醒! ------------>' + JSON.stringify(message));
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id:context.contextId});
        if (moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return ;
        }
        const booking = await context.conn
            .getRepository(HotDeskingBooking)
            .findOne(message.id);

        if (booking.state !== 2) {
            return;
        }

        if (moment(booking.updateTime).format(dateFormat) === message.updateTime) {
            await context.client.send({ cmd: 'wism_wechatwork.sendMessage' }, message.message).toPromise();
        }

        return 'success';
    }

}
