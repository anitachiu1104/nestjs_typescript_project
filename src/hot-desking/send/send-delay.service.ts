import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { EntityManager } from 'typeorm';
import { RabbitmqService } from '../../core/rabbitmq/rabbitmq.service';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { StaffEntity } from '../../model/staff.entity';
import { signRemindMessage, useEndRemindMessage } from '../booking/booking.const';
import { ProfileService } from './../../profile/profile.service';
import { CheckinBeforeRequestInterface } from './interface/checkin-before-request.interface';
import { CheckinTimeoutRequestInterface } from './interface/checkin-timeout-request.interface';
import { UseEndBeforeRequestInterface } from './interface/useend-before-request.interface';
import { UseendRequestInterface } from './interface/useend-request.interface';
import { SendDelayRequest } from './send-delay.request';

@Injectable()
export class SendDelayService {
    @Inject()
    private readonly rabbitmqService: RabbitmqService;
    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private readonly profileService: ProfileService;

    async doWhenUseEnd(sendDelayRequest: SendDelayRequest<UseendRequestInterface>): Promise<void> {
        const { data, ttl }  = sendDelayRequest;
        await this.rabbitmqService.producerDLX('hot-desking.use.end', {
            id: data.bookingId,
            updateTime: data.updateTime
        }, ttl);
    }

    async doWhenUseEndBefore(sendDelayRequest: SendDelayRequest<UseEndBeforeRequestInterface>) {
        const { data, ttl }  = sendDelayRequest;

        const checkinTimeoutProfile = await this.profileService.getProfile('hotdesking_checkin_timeout_ms');
        const editProfile = await this.profileService.getProfile('hotdesking_edit_before_ms');
        const checkinBeforeProfile = await this.profileService.getProfile('hotdesking_checkin_before_ms');
        const useendBeforeProfile = await this.profileService.getProfile('hotdesking_useend_before_ms');

        const messageVo = {
            startTime: moment(data.startTime).format('HH:mm'),
            endTime: moment(data.endTime).format('HH:mm'),
            date: moment(data.startTime).format('YYYY-MM-DD'),
            deskCode: data.spaceCode,
            signTimes: Math.ceil(Number(checkinBeforeProfile.value1)/60000),
            editTimes: Math.ceil(Number(editProfile.value1)/60000),
            signBeforeTimes: Math.ceil(Number(checkinTimeoutProfile.value1)/60000),
            useRemainTimes: Math.ceil(Number(useendBeforeProfile.value1)/60000)
        };
        await this.rabbitmqService.producerDLX('hot-desking.use.end.before', {
            message: {
                thirdPartyId: data.thirdPartyId,
                appName: 'hot-desking',
                content: useEndRemindMessage(messageVo),
            },
            updateTime: data.updateTime,
            id: data.bookingId
        }, ttl);
    }

    async doWhenCheckinBefore(sendDelayRequest: SendDelayRequest<CheckinBeforeRequestInterface>): Promise<void> {
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
            useRemainTimes: 3
        };
        //签到前提醒
        await this.rabbitmqService.producerDLX('hot-desking.sign.before', {
            message: {
                thirdPartyId: user.thirdPartyId,
                appName: 'hot-desking',
                content: signRemindMessage(messageVo),
            },
            id: data.bookingId,
            updateTime: data.updateTime
        }, ttl);
    }

    async doWhenCheckinTimeout(sendDelayRequest: SendDelayRequest<CheckinTimeoutRequestInterface>): Promise<void>  {
        const { data, ttl } = sendDelayRequest
        await this.rabbitmqService.producerDLX('hot-desking.sign.timeout', {
            id: data.bookingId,
            updateTime: data.updateTime
        }, ttl);
    }
 }
