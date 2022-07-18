import { Inject, Injectable } from '@nestjs/common';
import { CheckinDto } from './dto/checkin.dto';
import { isTestOrDevEnv } from '../../core/tenant/tenant.util';
import * as moment from 'moment';
import { ClientProxy } from '@nestjs/microservices';
import { UserService } from '../../user/user.service';
import { EntityManager } from 'typeorm';
import { SmartMeetingBooking } from '../../model/smart-meeting-booking.entity';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { SendDelayService } from '../send/send-delay.service';
import { DeviceService } from '../../hot-desking/device/device.service';
import { dateFormat } from '../common/const';
import { Redirect } from '../../core/interceptor/redirect';
import { SmartMeetingAttendee } from '../../model/smart-meeting-attendee.entity';
import { SmartMeetingCheckinEntity } from '../../model/smart-meeting-checkin.entity';

@Injectable()
export class CheckinService {
    @Inject()
    private readonly client: ClientProxy;
    @Inject()
    private readonly userService : UserService;
    @Inject()
    private readonly m: EntityManager;
    @Inject()
    private readonly sendService: SendDelayService;
    @Inject()
    private readonly deviceService: DeviceService;

    async checkin(checkInDto: CheckinDto): Promise<string> {
        let userId;
        if (isTestOrDevEnv() && checkInDto.userId) {
            userId = checkInDto.userId;
        } else {
            userId = await this.client.send({
                cmd: 'wism_wechatwork.userInfo'
            }, {
                name: 'hot-desking',
                code: checkInDto.code
            }).toPromise();
        }

        if (!userId) return Promise.reject('userInfo get failed!');
        console.log(userId);
        const { stId, stName, stPart } = await this.userService.findUserByThirdPartyId(userId) || {};
        if (!stId) return Promise.reject('no this user!');

        const now = moment();
        const checkInRange = 15;
        const nowBefore = moment().add(checkInRange * -1, 'minutes').format(dateFormat);
        const nowAfter = moment().add(checkInRange, 'minutes').format(dateFormat);

        const booking = await this.m.getRepository(SmartMeetingBooking).createQueryBuilder('sb')
          .innerJoin(MgSpaceEntity, 's', 's.id=sb.space_id')
          .where('start_time>:nowBefore and start_time<:nowAfter', {
              nowBefore,
              nowAfter
          })
          .andWhere('code=:spaceCode', { spaceCode: checkInDto.spaceCode })
          .andWhere('state in (1,2)')
          .andWhere('confirm in (1, 3)')
          .orderBy('start_time', 'DESC')
          .getOne();

        if (!booking) {
            return Promise.reject('当前没有预约');
        }

        if (booking.needCheckIn === 0) {
            return Promise.reject('当前会议不需要签到');
        }

        if (now.diff(moment(booking.startTime)) > booking.effectiveCheckMinutes * 60 * 1000) {
            return Promise.reject('签到超时!');
        }

        if (moment(booking.startTime).diff(now) > booking.effectiveCheckMinutes * 60 * 1000) {
            return Promise.reject(`请在前后${booking.effectiveCheckMinutes}分钟内签到!`);
        }

        const attend = await this.m
          .getRepository(SmartMeetingAttendee)
          .createQueryBuilder()
          .where('booking_id=:bookingId', { bookingId: booking.id })
          .andWhere('user_id=:stId', { stId })
          .getOne();

        if (!attend) {
            return Promise.reject('未参与此会议!');
        }

        await this.m.transaction(async m => {
            await m.getRepository(SmartMeetingCheckinEntity).save({
                bookingId: booking.id,
                attendeeId: attend.id,
                createTime: now.format(dateFormat),
                createBy: null,
                isDelete: 0
            });
            if (!booking.useStartTime) {
                const sendDelayBody = {
                    spaceId: booking.spaceId,
                    bookingId: booking.id,
                    updateTime: moment().format(dateFormat)
                };
                //开启设备
                await this.sendService.doWhenUseStart({
                    data: sendDelayBody,
                    ttl: 1000
                });
                //会议到时间关闭设备
                await this.sendService.doWhenUseEnd({
                    data: sendDelayBody,
                    ttl: moment(booking.endTime).diff(moment()) - 60000
                });
                // await this.m
                //   .getRepository(SmartMeetingBooking)
                //   .update({
                //       id: booking.id
                //   }, {
                //       state: 2,
                //       useStartTime: now.format(dateFormat)
                //   });
            }
        });
        return '签到成功';
    }

    public async turnToQrCodeUrl(spaceCode: string, res: any){
        const url = await this.client.send({ cmd: 'wism_dms.pad.findQrCodeUrl' }, {
            spaceCode,
        }).toPromise();
        return new Redirect(url, res);
    }
}


