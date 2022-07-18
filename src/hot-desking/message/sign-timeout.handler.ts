import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import { MgOperationEntity } from '../../model/mg-operation.entity';
import { MqConsumersEntity } from '../../model/mq_consumers.entity'
import { SignTimeoutMessage } from './sign-timeout.message';
import { dateFormat } from '../common/const';

@Injectable()
@DlxMessageDecorator('hot-desking.sign.timeout')
export class SignTimeoutHandler implements DlxMessageProvider {

    async handle(message: SignTimeoutMessage, context: RabbitmqContext): Promise<string> {
        console.debug('签到超时! ------------>' + JSON.stringify(message));
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id:context.contextId});
        if (moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return ;
        }

        const booking = await context.conn
            .getRepository(HotDeskingBooking)
            .findOne(message.id);

       if (booking.state !== 1) {
           return;
       }

       if (moment(booking.updateTime).format(dateFormat) === message.updateTime) {
        await context.conn
            .getRepository(HotDeskingBooking)
            .update({ id: message.id }, { state: 3 });

        await context.conn
            .getRepository(MgOperationEntity)
            .save({
                userId: null,
                type: 'release',
                comment: 'checkin.timeout',
                createTime: moment().format(dateFormat),
                createBy: 'sys',
                updateTime: moment().format(dateFormat)
            });
       }

       return 'release success';
   }

}
