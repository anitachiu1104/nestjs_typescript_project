import { Inject, Injectable } from '@nestjs/common';
import { ApprovalsDto } from './dto/approvals.dto';
import { ApprovalsVo } from './vo/approvals.vo';
import { EntityManager } from 'typeorm';
import { SmartMeetingBooking } from '../../model/smart-meeting-booking.entity';
import { StaffEntity } from '../../model/staff.entity';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { isArray } from 'util';
import * as moment from 'moment';
import { SmartMeetingAttendee } from '../../model/smart-meeting-attendee.entity';
import { SendDelayService } from '../send/send-delay.service';
import { RefuseDto } from './dto/refuse.dto';
import { dateFormat } from '../../hot-desking/common/const';
import { ProfileService } from '../../profile/profile.service';
import { PageHelper } from '../../core/page/page.helper';
import { MyMeetingVo } from '../booking/vo/mymeeting.vo';
import { PageResultInterface } from '../../core/page/page-result.interface';

@Injectable()
export class ApprovalService {
    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private readonly sendService: SendDelayService;
    @Inject()
    private readonly profileService: ProfileService;

    /*获取审批的会议*/
    async getApprivals(approvals: ApprovalsDto): Promise<PageResultInterface<ApprovalsVo>> {

        let {spaceId, userId, topic, bookingTime, confirm, page, moderatorName} = approvals;
        let queryBulider = this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('t1')
            .leftJoin(StaffEntity, 't2', 't1.userId=t2.st_id')
            .leftJoin(MgSpaceEntity, 't3', 't1.space_id=t3.id')
            .select('t1.id', 'id')
            .addSelect('t1.userId', 'userId').addSelect('t2.st_name', 'userName')
            .addSelect('t1.space_id', 'spaceId').addSelect('t3.name', 'spaceName')
            .addSelect('t1.topic', 'topic').addSelect('t1.create_time', 'bookingName')
            .addSelect('t1.start_time', 'startTime').addSelect('t1.end_time', 'endTime');
        if (confirm === 3 ){
            queryBulider.where('t1.confirm in (3,4)');
        }else {
            queryBulider.where('t1.confirm = :confirm', {confirm});
        }
        //会议室
        if (spaceId) {
            queryBulider.andWhere('t1.space_id=:spaceId', {spaceId})
        }
        //预订人
        if (userId && isArray(userId) && userId.length>0) {
            queryBulider.andWhere('t1.user_id in(:...userId)', {userId})
        }
        //主题
        if (topic) {
            queryBulider.andWhere(`t1.topic like :topic`, {topic: "%" + topic + "%"})
        }
        //主持人
        if (moderatorName) {
            queryBulider.andWhere('exists(select 1 from smart_meeting_attendee t4 where t4.booking_id = t1.id and t4.role = 2 and t4.user_name like :moderatorName)',{moderatorName: "%" + moderatorName + "%"});
        }
        //预定时间
        switch (bookingTime) {
            case 1:
                queryBulider.andWhere('t1.create_time >= DATE_SUB(NOW(),INTERVAL 1 week)')
                break;
            case 2:
                queryBulider.andWhere('t1.create_time >= DATE_SUB(NOW(),INTERVAL 1 month)')
                break;
            case 3:
                queryBulider.andWhere('t1.create_time >= DATE_SUB(NOW(),INTERVAL 3 month)')
                break;
            case 4:
                queryBulider.andWhere('t1.create_time >= DATE_SUB(NOW(),INTERVAL 1 year)')
                break;
            default:
                break;
        }
        //分页
        const total = await queryBulider.getCount();
        const data = await queryBulider.
        orderBy('endTime','DESC')
            .limit(page.pageSize)
            .offset(PageHelper.getSkip(page))
            .getRawMany<ApprovalsVo>();
        for(let row of data){
            let moderators = await this.conn.getRepository(StaffEntity).createQueryBuilder('t1').select('t1.st_id','stId')
                .addSelect('t1.st_name','stName')
                .addSelect('t1.email','email')
                .addSelect('t1.phone','phone')
                .where('t1.st_id in (select t2.user_id from smart_meeting_attendee t2 where t2.booking_id = :bookingId and t2.role = 2)',{bookingId:row.id})
                .getRawMany();
            row.moderators = moderators;
        }
        return { total,data };
    }

    /*会议审核通过*/
    async pass(id: number) {
        await this.conn.transaction(async m => {
            let booking = await this.conn.getRepository(SmartMeetingBooking).findOne({id})
            if (booking.confirm !== 2)return Promise.reject("当前预约记录不能审批")
            let nowMoment = moment();
            let nowStr = nowMoment.format('YYYY-MM-DD HH:mm:ss');
            //修改主表
            await this.conn.getRepository(SmartMeetingBooking)
                .update({
                    id
                }, {
                    updateTime: nowStr,
                    confirm: 3
                })

            //发送通知
            const ttl = moment(booking.startTime).diff(moment()) + 5 * 60 * 1000;
            let users = await this.conn.getRepository(SmartMeetingAttendee).createQueryBuilder().where('booking_id = :id', {id}).getMany();
            for (let user of users) {
                let data = {
                    bookingId: id,
                    updateTime: nowStr,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    userId: user.userId,
                    spaceId: booking.spaceId,
                    email: user.email,
                    phone: user.phone
                }

                await this.sendService.doWhenBookingAfter({
                    data,
                    ttl: moment(booking.startTime).diff(moment()) - await this.getSettingTime('smartmeeting_booking_after_ms')
                });
                if(!booking.needCheckIn){//不需要签到发会议结束前通知
                    await this.sendService.doWhenUseEndBefore({
                        data: data,
                        ttl: moment(booking.endTime).diff(moment()) - await this.getSettingTime('smartmeeting_useend_before_ms')
                    });
                }

            }
            if(booking.needCheckIn){
                await this.sendService.doWhenCheckinTimeout({
                    data: {bookingId: id, updateTime: nowStr},
                    ttl
                });
            }else {
                await this.sendService.doWhenUseStart({
                    data: { bookingId: id,spaceId: booking.spaceId,updateTime: nowStr },
                    ttl: moment(booking.startTime).diff(moment())
                });
                await this.sendService.doWhenUseEnd({
                    data: { bookingId: id,spaceId: booking.spaceId,updateTime: nowStr },
                    ttl: moment(booking.endTime).diff(moment()) - 60000
                });
            }
        })
    }

    async refuse(data: RefuseDto) {
        let {id,comment} = data;
        let booking = await this.conn.getRepository(SmartMeetingBooking).findOne({id});
        if (booking.confirm !== 2)return Promise.reject("当前预约记录不能审批");

        let nowMoment = moment();
        let nowStr = nowMoment.format('YYYY-MM-DD HH:mm:ss');
        //修改主表
        await this.conn.getRepository(SmartMeetingBooking)
            .update({
                id
            }, {
                updateTime: nowStr,
                confirm: 4,
                comment: comment || 'comment',
                releaseType: 6,
                state: 4
            })
    }
    async passAll(ids: number[]){
        console.log(ids);
        for (let id of ids){
            await this.pass(id);
        }
        return ;
    }
    private async getSettingTime(code: string): Promise<number> {
        const mgProfileEntity = await this.profileService.getProfile(code);
        if (!mgProfileEntity.value1) {
            return Promise.reject(`${code} Not Exist!`);
        }
        return Number(mgProfileEntity.value1);
    }
}