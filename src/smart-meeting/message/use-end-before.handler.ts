import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { UseEndBeforeMessage } from './use-end-before.message';
// import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import * as moment from 'moment';
import {MqConsumersEntity} from "../../model/mq_consumers.entity";
import { SmartMeetingBooking } from "../../model/smart-meeting-booking.entity"
import { dateFormat } from '../common/const';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { BookingAfterMessage } from './booking-after.message';

@Injectable()
@DlxMessageDecorator('smart-meeting.use.end.before')
export class UseEndBeforeHandler implements DlxMessageProvider {

    async handle(data: BookingAfterMessage, context: RabbitmqContext): Promise<string> {
        console.debug('使用结束提醒! ------------>' + JSON.stringify(data));
        const { id, message, updateTime, email, phone } = data;
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id: context.contextId});
        if (moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return;
        }
        const booking = await context.conn
            .getRepository(SmartMeetingBooking)
            .findOne(id);

        if (booking.state !== 2) {
            return Promise.reject('状态不匹配');
        }
        if (mqConsumer.isDelete !== 0) return Promise.reject('记录已被修改');
        // if (moment(booking.updateTime).format(dateFormat) === message.updateTime) {
        //     await context.client.send({cmd: 'wism_wechatwork.sendMessage'}, message.message).toPromise();
        // }
        const space = await context.conn.getRepository(MgSpaceEntity).findOne(booking.spaceId);
        if (moment(booking.updateTime).format(dateFormat) === updateTime) {
            await context.client.send({ cmd: 'wism_wechatwork.sendMessage' }, message).toPromise();
            switch (booking.remindType) {
                case 1:
                    if (phone){
                        await context.client.send({
                            cmd: 'wism_sms.sendVerifyCode'
                        }, {
                            phoneNumber: phone,
                            code: space.name,
                        }).toPromise();
                    }
                    break;
                case 2:
                    if (email){
                        await context.client.send({
                            cmd: 'wism_sms.sendMail'
                        }, {
                            to: email,
                            subject: '智能工位预定',
                            //text:'用户Jack您好,',
                            html:`<span>假装我有文案</span>`,
                        }).toPromise();
                    }
                    break;
            }
        }
        return 'success';
    }

}
