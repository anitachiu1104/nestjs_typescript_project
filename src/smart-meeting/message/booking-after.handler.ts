import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { BookingAfterMessage } from './booking-after.message';
import { MqConsumersEntity } from '../../model/mq_consumers.entity'
import * as moment from 'moment';
import { SmartMeetingBooking } from '../../model/smart-meeting-booking.entity';
import { MgSpaceEntity } from '../../model/mg-space.entity';
const  dateFormat = 'YYYY-MM-DD HH:mm:ss';

@Injectable()
@DlxMessageDecorator('smart-meeting.booking.after')
export class BookingAfterHandler implements DlxMessageProvider {

    async handle(data: BookingAfterMessage, context: RabbitmqContext): Promise<string> {
        console.debug('签到前提醒!ss ------------>' + JSON.stringify(data));
        const { id, message, updateTime, email, phone } = data;
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id:context.contextId});
        if (mqConsumer && moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return ;
        }

        const booking = await context.conn
            .getRepository(SmartMeetingBooking)
            .findOne(id);

        if (booking.state !== 1) {
            return Promise.reject('状态不匹配');
        }
        const space = await context.conn.getRepository(MgSpaceEntity).findOne(booking.spaceId);
        if (mqConsumer.isDelete === 0) {
            //无论什么时候都发企业微信
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
                case 3:
                    break;
            }
        }
        return 'success';
    }

}
