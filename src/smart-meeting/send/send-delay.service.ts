import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RabbitmqService } from '../../core/rabbitmq/rabbitmq.service';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { StaffEntity } from '../../model/staff.entity';
import * as moment from 'moment';
import { signRemindMessage } from '../booking/booking.const';
import { SendDelayRequest } from './send-delay.request';
import { BookingAfterRequestInterface } from './interface/booking-after-request.interface';
import { CheckinTimeoutRequestInterface } from './interface/checkin-timeout-request.interface';
import { MeetingInExtendRequest } from './interface/meeting-in-extend-request';
import { WulianRequestInterface } from './interface/wulian-request.interface';

@Injectable()
export class SendDelayService {
    @Inject()
    private readonly rabbitmqService: RabbitmqService;
    @Inject()
    private readonly conn: EntityManager;


    //预定会议后通知
    async doWhenBookingAfter(sendDelayRequest: SendDelayRequest<BookingAfterRequestInterface>): Promise<void> {
        const { data, ttl }  = sendDelayRequest;
        const space = await this.conn.getRepository(MgSpaceEntity).findOne(data.spaceId);
        const user = await this.conn.getRepository(StaffEntity).findOne(data.userId);
        const messageVo = {
            startTime: moment(data.startTime).format('HH:mm'),
            endTime: moment(data.endTime).format('HH:mm'),
            date: moment(data.startTime).format('YYYY-MM-DD'),
            deskCode: space.code,
            signTimes: 5,
            editTimes: 3,
            signBeforeTimes: 3,
            useRemainTimes: 3,
        };
        //预定后通知
        await this.rabbitmqService.producerDLX('smart-meeting.booking.after', {
            message: {
                thirdPartyId: user.thirdPartyId,
                appName: 'smart-meeting',
                content: signRemindMessage(messageVo),
            },
            id: data.bookingId,
            updateTime: data.updateTime,
            email: data.email,
            phone: data.phone
        }, ttl,data.bookingId);
    }

    //会议中延长之后推送通知消息
    async doWhenMeetingInAfter(sendDelayRequest: SendDelayRequest<MeetingInExtendRequest>): Promise<void> {
        const { data, ttl }  = sendDelayRequest;
        const space = await this.conn.getRepository(MgSpaceEntity).findOne(data.spaceId);
        const user = await this.conn.getRepository(StaffEntity).findOne(data.userId);
        const messageVo = {
            startTime: moment(data.startTime).format('HH:mm'),
            endTime: moment(data.endTime).format('HH:mm'),
            date: moment(data.startTime).format('YYYY-MM-DD'),
            deskCode: space.code,
            signTimes: 5,
            editTimes: 3,
            signBeforeTimes: 3,
            useRemainTimes: 3,
        };
        //预定后通知
        await this.rabbitmqService.producerDLX('smart-meeting.booking.after', {
            message: {
                thirdPartyId: user.thirdPartyId,
                appName: 'smart-meeting',
                content: signRemindMessage(messageVo),
            },
            id: data.bookingId,
            updateTime: data.updateTime,
        }, ttl,data.bookingId);
    }

    //签到超时处理
    async doWhenCheckinTimeout(sendDelayRequest: SendDelayRequest<CheckinTimeoutRequestInterface>): Promise<void>  {
        const { data, ttl } = sendDelayRequest
        await this.rabbitmqService.producerDLX('smart-meeting.sign.timeout', {
            id: data.bookingId,
            updateTime: data.updateTime
        }, ttl,data.bookingId);
    }
    //结束前通知
    async doWhenUseEndBefore(sendDelayRequest: SendDelayRequest<BookingAfterRequestInterface>): Promise<void> {
        const { data, ttl }  = sendDelayRequest;
        const space = await this.conn.getRepository(MgSpaceEntity).findOne(data.spaceId);
        const user = await this.conn.getRepository(StaffEntity).findOne(data.userId);
        const messageVo = {
            startTime: moment(data.startTime).format('HH:mm'),
            endTime: moment(data.endTime).format('HH:mm'),
            date: moment(data.startTime).format('YYYY-MM-DD'),
            deskCode: space.code,
            signTimes: 5,
            editTimes: 3,
            signBeforeTimes: 3,
            useRemainTimes: 3,
        };
        //预定后通知
        await this.rabbitmqService.producerDLX('smart-meeting.use.end.before', {
            message: {
                thirdPartyId: user.thirdPartyId,
                appName: 'smart-meeting',
                content: signRemindMessage(messageVo),
            },
            id: data.bookingId,
            updateTime: data.updateTime,
            email: data.email,
            phone: data.phone
        }, ttl,data.bookingId);
    }
    async doWhenUseStart(sendDelayRequest: SendDelayRequest<WulianRequestInterface>){
        const { data, ttl } = sendDelayRequest
        await this.rabbitmqService.producerDLX('smart-meeting.use.start', {
            spaceId: data.spaceId,
            bookingId: data.bookingId,
            updateTime: data.updateTime
        }, ttl,data.bookingId);
    }
    async doWhenUseEnd(sendDelayRequest: SendDelayRequest<WulianRequestInterface>){
        const { data, ttl } = sendDelayRequest
        await this.rabbitmqService.producerDLX('smart-meeting.use.end', {
            spaceId: data.spaceId,
            bookingId: data.bookingId,
            updateTime: data.updateTime
        }, ttl,data.bookingId);
    }
    async doWhenApprovalTimeout(sendDelayRequest: SendDelayRequest<CheckinTimeoutRequestInterface>){
        const { data, ttl } = sendDelayRequest
        await this.rabbitmqService.producerDLX('smart-meeting.approval.timeout', {
            id: data.bookingId,
            updateTime: data.updateTime
        }, ttl,data.bookingId);
    }
 }
