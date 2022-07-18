import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as _ from 'lodash';
import * as moment from 'moment';
import { EntityManager } from 'typeorm';
import { Redirect } from '../../core/interceptor/redirect';
import { isTestOrDevEnv } from '../../core/tenant/tenant.util';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import { HotDeskingCheckInEntity } from '../../model/hot-desking-checkin.entity';
import { MgEquipmentEntity } from '../../model/mg-equipment.entity';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { StaffEntity } from '../../model/staff.entity';
import { SysAreaEntity } from '../../model/sys-area.entity';
import { SysBuildEntity } from '../../model/sys-build.entity';
import { SysFloorEntity } from '../../model/sys-floor.entity';
import { ProfileService } from '../../profile/profile.service';
import { UserService } from '../../user/user.service';
import { BookingService } from '../booking/booking.service';
import { dateFormat } from '../common/const';
import { SendDelayService } from '../send/send-delay.service';
import { CheckInDto } from './dto/checkin.dto';
import { MyDeskingCheckinDto } from './dto/my-desking-checkin.dto';
import { MyCheckinVo } from './vo/mycheckin.vo';
import { AuthService } from '../../auth/auth.service';
import * as querystring from 'querystring';

@Injectable()
export class CheckinService {

    @Inject()
    private readonly client: ClientProxy;

    @Inject()
    private readonly conn: EntityManager;

    @Inject()
    private readonly userService : UserService;

    @Inject()
    private readonly sendService: SendDelayService;
    @Inject()
    private  readonly bookingservice: BookingService;
    @Inject()
    private readonly profileService: ProfileService;
    @Inject()
    private readonly authService: AuthService;

    private async getSettingTime(code: string): Promise<number> {
        const mgProfileEntity = await this.profileService.getProfile(code);
        if (!mgProfileEntity.value1) {
            return Promise.reject(`${code} Not Exist!`);
        }
        return Number(mgProfileEntity.value1);
    }

    public async checkIn(checkInDto : CheckInDto, res): Promise<Redirect>{
        let wechatConf;
        let authQuery;
        try {
            wechatConf = await this.client.send({
                cmd: 'wism_wechatwork.getConfig'
            }, {
                name: 'hot-desking'
            }).toPromise();

            if (!wechatConf || !wechatConf.mainUrl) {
                throw new Error('请先配置mainUrl');
            }

            const spaceCode = checkInDto.spaceCode;

            if (!spaceCode) {
                throw new Error('spaceCode require!');
            }

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

            if (!userId) {
                throw new Error('userInfo get failed!');
            }

            const {stId, stName, stPart} = await this.userService.findUserByThirdPartyId(userId) || {};

            if (!stId) {
                throw new Error('no this user!');
            }

            authQuery = await this.authService.validateWechatworkUser({ thirdId: userId });
            const now = moment();
            const nowStr = moment().format(dateFormat);

            let hotDeskingBooking = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
                .innerJoin(MgSpaceEntity, 's', 's.id=b.space_id')
                .where('start_time>=:todayStart and start_time<=:now and end_time>:now', {
                    todayStart: now.format('YYYY-MM-DD 00:00:00'),
                    now: now.format('YYYY-MM-DD HH:mm:ss')
                })
                // .andWhere('start_time>=:signMaxTime', { signMaxTime })
                .andWhere('user_id=:userId', {userId: Number(stId)})
                .andWhere('code=:spaceCode', {spaceCode})
                .andWhere('state=1')
                .orderBy('start_time', 'ASC')
                .getOne();

                return await this.conn.transaction(async manager => {
                    if (!hotDeskingBooking) {//立即预约
                        let endTime = moment(nowStr).add(1, 'hours').format(dateFormat);
                        let result = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
                            .innerJoin(MgSpaceEntity, 's', 's.id=b.space_id')
                            .where('start_time>=:todayStart', {todayStart: moment().format('YYYY-MM-DD 00:00:00')})
                            .andWhere('(start_time<:et and end_time>:st)', {
                                st: nowStr,
                                et: endTime
                            })
                            .andWhere('code=:spaceCode', {spaceCode})
                            .andWhere('state in (1,2)')
                            .getMany()
                        if (result && result.length > 0) {
                            // return {'checkinState': '当前时段已有预约或已使用', 'expiration': null};
                            throw new Error('当前时段已有预约或已使用');
                        } else {
                            let spaceInfo = await this.bookingservice.findCoordinateBySpaceCode(spaceCode);
                            hotDeskingBooking = await this.conn.getRepository(HotDeskingBooking)
                                .save({
                                    buildingId: Number(spaceInfo[0].buId),
                                    floorId: Number(spaceInfo[0].flId),
                                    spaceId: Number(spaceInfo[0].spaceId),
                                    createTime: nowStr,
                                    updateTime: nowStr,
                                    createBy: '',
                                    userId: stId,
                                    state: 1,
                                    startTime: nowStr,
                                    endTime: endTime,
                                    user2Id: stId
                                });
                        }
                    }

                    if (hotDeskingBooking) {
                        if (hotDeskingBooking.state === 2) {
                            return new Redirect(`${wechatConf.mainUrl}pages/common/success?title=已签到&type=success&${querystring.stringify(authQuery as any)}`, res);
                        }

                        const checkinTimeoutMs = await this.getSettingTime('hotdesking_checkin_timeout_ms');
                        if (now.diff(moment(hotDeskingBooking.startTime)) > checkinTimeoutMs) {
                            throw new Error('签到超时');
                        }

                        if (hotDeskingBooking.state === 3) {
                            throw new Error('预约已取消');
                        }

                        //推送水墨屏
                        await this.pushScreen(spaceCode, stName, stPart, hotDeskingBooking.startTime);
                        //开启智能插座
                        await this.openSocket(spaceCode);

                        await this.sendService.doWhenUseEndBefore({
                            data: {
                                startTime: moment(hotDeskingBooking.startTime).format(dateFormat),
                                endTime: moment(hotDeskingBooking.endTime).format(dateFormat),
                                updateTime: nowStr,
                                thirdPartyId: userId,
                                spaceCode,
                                bookingId: hotDeskingBooking.id
                            },
                            ttl: moment(hotDeskingBooking.endTime).diff(moment()) - await this.getSettingTime('hotdesking_useend_before_ms')
                        });

                        await this.sendService.doWhenUseEnd({
                            data: {bookingId: hotDeskingBooking.id, updateTime: nowStr},
                            ttl: moment(hotDeskingBooking.endTime).diff(moment()) - await this.getSettingTime('hotdesking_useend_ms')
                        });

                        const result = await manager
                            .getRepository(HotDeskingBooking)
                            .update({
                                    id: hotDeskingBooking.id,
                                    isDelete: 0
                                }, {
                                    state: 2,
                                    useStartTime: nowStr,
                                    updateTime: nowStr
                                }
                            );

                        if (result.affected > 0) {
                            await manager.getRepository(HotDeskingCheckInEntity).save({
                                userId: stId,
                                bookingId: hotDeskingBooking.id,
                                createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                                createBy: userId,
                                isDelete: 0
                            });
                        }
                        return new Redirect(`${wechatConf.mainUrl}pages/common/success?title=签到成功&type=success&${querystring.stringify(authQuery as any)}`, res);
                    } else {
                        throw new Error('请检查此工位是否有预约');
                    }
                });
        } catch (e) {
            return new Redirect(`${wechatConf.mainUrl}pages/common/success?title=${e.message || e}&type=fail&${querystring.stringify(authQuery as any)}`, res);
        }
    }

    /**
     * 调用物联智能插座
     */
    public async openSocket(spaceCode: string): Promise<string> {
        const MgSpaceEntityData = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('s')
            .innerJoin(MgEquipmentEntity, 'e', 's.id = e.space_id')
            .select('e.code', 'code')
            .where('s.code=:spaceCode', { spaceCode })
            .getRawMany();
        console.log(MgSpaceEntityData);
        let code = '';
        for (const resultData of MgSpaceEntityData) {
            code = resultData.code;
        }
        return this.client.send({ cmd: 'wism_dms.wulian.open.socket' }, code).toPromise();
    }


    /**
     * 调用水墨屏服务推送数据
     */
    public async pushScreen(spaceCode: string, stName: string, stPart: string, startTime: string): Promise<string>{
        /**
         * 信息推送水墨屏
         */
        const screenTime = await this.findUserDayBookingTime(startTime, spaceCode);
        return this.client.send({ cmd: 'wism_dms.hanshow.push' }, _.defaults({
            username: stName,
            spaceCode,
            station: spaceCode,
            department: stPart,
            state: '占用',
        }, screenTime)).toPromise();
    }

    /**
     * 查询当前用户当天预约的时间
     */
    public async findUserDayBookingTime(startTime: string, spaceCode: string):Promise<any>{
        const endTime = moment().format('YYYY-MM-DD 23:59:59');
        const hotDeskingBookingData = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
            .innerJoin(MgSpaceEntity, 's', 'b.space_id=s.id')
            .select('b.user_id','userId')
            .addSelect('b.start_Time','startTime')
            .addSelect('b.end_Time','endTime')
            .where('b.start_time between :startTime and :endTime', { startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: moment(endTime).format('YYYY-MM-DD HH:mm:ss') })
            .andWhere('s.code=:spaceCode',{spaceCode})
            .andWhere('b.state in (1,2)')
            .limit(3)
            .orderBy('start_time', 'ASC')
            .getRawMany<HotDeskingBooking>();
        const startTimes = [];
        const endTimes = [];
        for (const timeData of hotDeskingBookingData){
            startTimes.push(timeData.startTime);
            endTimes.push(timeData.endTime);
        }
        const screenTimeData = {} ;
        for (let i=0; i<3; i++) {
            if (!startTimes[i]) {
                screenTimeData[`time${i}`] = '';
            } else {
                screenTimeData[`time${i}`] = `${moment(startTimes[i]).format('HH:mm')} - ${moment(endTimes[i]).format('HH:mm')}`;
            }
        }
        return screenTimeData;
    }


    public async findClearScreen1(spaceCode: string, bookingId: number):Promise<string>{
        const resultData = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
            .innerJoin(MgSpaceEntity,'s','b.space_id = s.id')
            .select('b.end_time','endTime')
            .where('s.code=:spaceCode',{ spaceCode })
            .andWhere('b.id=:bookingId',{bookingId})
            .getRawOne<HotDeskingBooking>();
        console.log(resultData);
        return 'success';
    }


    //查询当前用户的签到记录
    public async findUserMyCheckInRecord(body:MyDeskingCheckinDto):Promise<MyCheckinVo[]>{
        const  { userId,buId,flId,areaId,type,type2,timeType } = body;
        const  queryBuilderMySignRecordData = this.conn.getRepository(HotDeskingCheckInEntity).createQueryBuilder('checkin');
        queryBuilderMySignRecordData.innerJoin(HotDeskingBooking,'booking','booking.id = checkin.booking_id')
            .innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
            .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
            .innerJoin(MgSpaceEntity,'space','space.id = booking.space_id')
            .leftJoin(SysAreaEntity,'area','area.id = space.area_id')
            .innerJoin(StaffEntity,'staff','staff.st_id = booking.user_id')
            .select('build.bu_name','buName')
            .addSelect('floor.fl_name','flName')
            .addSelect('area.name','areaName')
            .addSelect('space.code','code')
            .addSelect('staff.st_name','stName')
            .addSelect(`case when booking.type = 1 then '时段' when booking.type = 2 then '全天' when booking.type = 3 then '立即' end as type`)
            .addSelect('checkin.create_time','createTime')
            .addSelect(`case when booking.state = 4 then '已使用' when booking.state = 2 then '使用中' end as state`)
            .where('booking.user_id=:userId',{ userId })
            .andWhere('booking.state in (2,4)')
            .orderBy('checkin.createTime','DESC');
        if(buId){
            queryBuilderMySignRecordData.andWhere('build.bu_id=:buId',{ buId: Number(buId) })
        }
        if(flId){
            queryBuilderMySignRecordData.andWhere('floor.fl_id=:flId',{ flId: Number(flId) })
        }
        if (areaId){
            queryBuilderMySignRecordData.andWhere('area.id=:areaId',{ areaId: Number(areaId) })
        }
        if(type2){
            queryBuilderMySignRecordData.andWhere('booking.type2=:type2',{ type2: Number(type2) })
        }
        if(type){
            queryBuilderMySignRecordData.andWhere('booking.type=:type',{ type: Number(type) })
        }
        //timeType = 1 一周
        if(timeType === 1){
            let startTime;
            let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
            startTime = moment().subtract('days',6).format('YYYY-MM-DD HH:mm:ss');
            if(startTime){
                queryBuilderMySignRecordData.andWhere('booking.start_time>=:startTime and booking.end_time<:endTime', { startTime, endTime })
            }
        }
        //timeType = 2 一个月
        if(timeType === 2){
            let startTime;
            let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
            startTime = moment().subtract('days',30).format('YYYY-MM-DD HH:mm:ss');
            if(startTime){
                queryBuilderMySignRecordData.andWhere('booking.start_time>=:startTime and booking.end_time<:endTime', { startTime, endTime })
            }
        }
        //timeType = 3 三个月
        if(timeType === 3){
            let startTime;
            let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
            startTime = moment().subtract('days',60).format('YYYY-MM-DD HH:mm:ss');
            if(startTime){
                queryBuilderMySignRecordData.andWhere('booking.start_time>=:startTime and booking.end_time<:endTime', { startTime, endTime })
            }
        }
        return  await queryBuilderMySignRecordData.getRawMany<MyCheckinVo>();
    }

    //签到跳转QrCodeUrl
    public async turnToQrCodeUrl(spaceCode: string, res: any){
        const url = await this.client.send({ cmd: 'wism_dms.hanshow.findQrCodeUrl' }, {
            spaceCode,
        }).toPromise();
        return new Redirect(url, res);
    }
}
