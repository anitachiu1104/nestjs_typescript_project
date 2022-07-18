import { Inject, Injectable, Query } from "@nestjs/common";
import { BookingDto } from "./dto/booking.dto";
import * as moment from "moment";
import { RedisClient } from "../../core/redis/redis.client";
import { MyLogger } from "../../core/my-logger/my-logger";
import { EntityManager, SelectQueryBuilder, UpdateResult } from "typeorm";
import { SmartMeetingBooking } from "../../model/smart-meeting-booking.entity";
import { SmartMeetingAttendee } from "../../model/smart-meeting-attendee.entity";
import { SmartMeetingService } from "../../model/smart-meeting-service.entity";
import { MgCustomTypes } from 'src/model/mg-custom-types.entity';
import { CustomTypeVo } from './vo/customtype.vo';
import { MyBookingDto } from './dto/my-booking.dto';
import { MgSpaceEntity } from 'src/model/mg-space.entity';
import { SysBuildEntity } from '../../model/sys-build.entity';
import { SysFloorEntity } from '../../model/sys-floor.entity';
import { SysAreaEntity } from '../../model/sys-area.entity';
import { MgSpaceVo } from './vo/mgspace.vo';
import { MyBookingVo } from './vo/mybooking.vo';
import { SendDelayService } from '../send/send-delay.service';
import { PositionQueryDto } from './dto/position-query.dto';
import { PositionVo } from './vo/position.vo';
import { ClientProxy } from '@nestjs/microservices';
import { MyMeetingDto } from './dto/my-meeting.dto';
import { MyMeetingVo } from './vo/mymeeting.vo';
import { MeetingStateDto } from './dto/meetingstate.dto';
import { dateFormat } from '../../hot-desking/common/const';
import { extendMeetingDto } from './dto/extend-meeting.dto'
import { StaffEntity } from '../../model/staff.entity';
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { FileUtil } from '../../core/util/file.util';
import * as fs from "fs";
import { meetingPictureVo } from './vo/meetingpicture.vo';
import { ConfigService } from '../../core/config/config.service';
import { ProfileService } from '../../profile/profile.service';
import { MeetingDetailsVo } from './vo/meetingdetails.vo';
import { MgEquipmentEntity } from '../../model/mg-equipment.entity';
import { SmartMeetingEquipmentEntity } from '../../model/smart-meeting-equipment.entity';
import { MyBookingHistory } from './dto/my-booking-history';
import * as _ from 'lodash';
import { MqConsumersEntity } from '../../model/mq_consumers.entity';
import { PageHelper } from '../../core/page/page.helper';
import { PageResultInterface } from '../../core/page/page-result.interface';
import { MeetingSpaceNameDto } from './dto/meeting-spaceName.dto';
import * as crypto from 'crypto';
import { smartMeetingRoutes } from '../smart-meeting.module';
import { CheckinService } from '../checkin/checkin.service';
import { Redirect } from '../../core/interceptor/redirect';
import { isTestOrDevEnv } from '../../core/tenant/tenant.util';
import { CheckinDto } from '../checkin/dto/checkin.dto';
import { UserService } from '../../user/user.service';
import { MgRoleEntity } from '../../model/mg-role.entity';
import { MgStaffRoleEntity } from '../../model/mg-staff-role.entity';
import { MgRepairEntity } from '../../model/mg-repair.entity';
import * as Socket from 'ws';


@Injectable()
export class BookingService {
    @Inject()
    private readonly redisClient: RedisClient;
    @Inject()
    private readonly logger: MyLogger;
    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private readonly sendService: SendDelayService;
    @Inject()
    private readonly client: ClientProxy;
    @Inject()
    private configService: ConfigService;
    @Inject()
    private readonly profileService: ProfileService;
    @Inject()
    private readonly checkinService: CheckinService;
    @Inject()
    private readonly userService : UserService;



    async saveOrUpdateBooking(bookingDto: BookingDto): Promise<string> {
        const ws = new Socket("ws://localhost:3010");
        let nowMoment = moment();
        let nowStr = nowMoment.format('YYYY-MM-DD HH:mm:ss');
        let {
            id, topic, spaceId, checkinType, remindType, startTime, endTime,isCycle, moderators,
            inUsers, outUsers, ctypes, comment, buId, flId, areaId, userName, user2Id, userId,effectiveCheckMinutes,serviceComment,equipmentConf
        } = bookingDto;
        ctypes = ctypes || [];
        inUsers = inUsers || [];
        outUsers = outUsers || [];
        let needCheckIn = checkinType? 1:0;
        let confirm = 1;

        try{
            const spaceData = await this.conn.getRepository(MgSpaceEntity).findOne({id: spaceId});
            if (ctypes.length > 0 || equipmentConf.length > 0 || spaceData.attr1 === '1'){
                confirm = 2;
            }
            this.checkBookRequest(startTime, endTime);
            await this.lock(spaceId);
            if (nowMoment.diff(startTime) > 0) {
                return Promise.reject('预约起始时间已过，请刷新页面!');
            }
            //检查预定时间是否冲突
            let buliderArr = this.createBookingQuery(bookingDto);
            for (let bookedQueryBuilder of buliderArr){

                if (id) {
                    bookedQueryBuilder.andWhere('id!=:id', { id });
                }

                const bookedRecord = await bookedQueryBuilder.getOne();

                if (bookedRecord) {
                    return Promise.reject('会议室已被预定, 请刷新重试!');
                }
            }
            //拼接主持人姓名
            let moderatorName = '';
            for (let i = 0;i<moderators.length;i++){
                moderatorName+=moderators[i].stName;
                if (i < moderators.length-1){
                    moderatorName+=',';
                }
            }
            let bookingId;
            await this.conn.transaction(async m => {
                let newBooking;
                if (!id) {//新增
                    // 插入主表
                    newBooking = await m
                        .getRepository(SmartMeetingBooking)
                        .save({
                            buildingId: Number(buId),
                            floorId: Number(flId),
                            areaId,
                            spaceId,
                            createTime: nowStr,
                            updateTime: nowStr,
                            createBy: userName,
                            userId,
                            state: 1,
                            startTime,
                            endTime,
                            user2Id: user2Id || userId,
                            topic,
                            checkinType,
                            remindType,
                            moderator: moderatorName,
                            needCheckIn,
                            confirm: confirm,
                            type:1,
                            effectiveCheckMinutes: effectiveCheckMinutes,
                            isDelete: 0,
                            releaseType: 0,
                            comment: comment,
                            serviceComment: serviceComment
                        });
                } else {//编辑
                    await m.getRepository(SmartMeetingBooking)
                        .update({
                            id
                        }, {
                            startTime,
                            endTime,
                            updateTime: nowStr,
                            topic,
                            checkinType,
                            remindType,
                            moderator:moderatorName,
                            needCheckIn,
                            effectiveCheckMinutes,
                            confirm: confirm,
                            serviceComment
                        })
                    await m.getRepository(SmartMeetingAttendee)
                        .update({
                            bookingId:id
                        }, {
                            updateTime: nowStr,
                            isDelete: 1
                        })
                    await m.getRepository(SmartMeetingService)
                        .update({
                            bookingId:id
                        }, {
                            updateTime: nowStr,
                            isDelete: 1
                        })
                    await m.getRepository(SmartMeetingEquipmentEntity)
                        .update({
                            bookingId:id
                            }, {
                            updateTime: nowStr,
                            isDelete: 1
                        })
                }
                bookingId = id ? id : newBooking.id;
                //插入会议设备表
                let equipmentValues = [];
                if (equipmentConf){
                    for (let v of equipmentConf){
                        equipmentValues.push({bookingId,ctypeCode: v.ctypeCode,equipmentCode: v.equipmentCode,attr1: v.attr1,attr2: v.attr2,attr3: v.attr3,attr4: v.attr4,
                            attr5: v.attr5,attr6: v.attr6,createTime:nowStr,updateTime:nowStr,createBy:userName,isDelete:0})
                    }
                }
                await m.getRepository(SmartMeetingEquipmentEntity)
                    .createQueryBuilder()
                    .insert()
                    .values(equipmentValues)
                    .execute();
                //插入人员表
                //常用联系人数据放入redis
                let attendValues = [];
                for (let moderator of moderators){//主持人
                    await this.redisClient.zincrby('smart_meeting:booking:top_contacts:' + String(userId),1,JSON.stringify({stId:moderator.stId,stName:moderator.stName,email:moderator.email,phone:moderator.phone || null}));
                    attendValues.push({bookingId:bookingId,inviteId: userId,userId: moderator.stId,userName:moderator.stName,email:moderator.email,phone:moderator.phone
                        ,userType:1,createTime:nowStr,updateTime:nowStr,createBy:userName,isDelete:0, role: 2})
                }
                if (inUsers){
                    for(let inUser of inUsers || []){
                        //常用联系人数据放入redis
                        await this.redisClient.zincrby('smart_meeting:booking:top_contacts:' + String(userId),1,JSON.stringify({stId: inUser.stId,stName:inUser.stName,email:inUser.email,phone:inUser.phone || null}));
                        attendValues.push({bookingId:bookingId,inviteId: userId,userId: inUser.stId,userName:inUser.stName,email:inUser.email,phone:inUser.phone
                            ,userType:1,createTime:nowStr,updateTime:nowStr,createBy:userName,isDelete:0, role: 1})
                    }
                }
                if (outUsers){

                    for(let outUser of outUsers || []){
                        //外部联系人放入接口
                        await this.redisClient.zincrby('smart_meeting:booking:out_contacts:' + String(userId),1,JSON.stringify({stName:outUser.stName,email:outUser.email,phone:outUser.phone}));
                        attendValues.push({bookingId:bookingId,inviteId: userId,userId: null,userName:outUser.stName,email:outUser.email,phone:outUser.phone
                            ,userType:2,createTime:nowStr,updateTime:nowStr,createBy:userName,isDelete:0,role: 1})
                    }
                }
                await m.getRepository(SmartMeetingAttendee)
                    .createQueryBuilder()
                    .insert()
                    .values(attendValues)
                    .execute();
                //插入服务表
                let serviceValues = [];
                for (let ctype of ctypes){
                    serviceValues.push({bookingId: bookingId,ctypeId:ctype.ctypeId,comment,createTime:nowStr,updateTime:nowStr,createBy:userName,isDelete:0,cost:0})
                }
                await m.getRepository(SmartMeetingService)
                    .createQueryBuilder()
                    .insert()
                    .values(serviceValues)
                    .execute();


                if(confirm === 1){
                    const ttl = moment(startTime).diff(moment()) + 5 * 60 * 1000;
                    for (let inUser of inUsers){
                        let data = { bookingId, updateTime: nowStr, startTime, endTime, userId: inUser.stId, spaceId,email: inUser.email,phone: inUser.phone }
                        await this.sendService.doWhenBookingAfter({
                            data: data,
                            ttl: moment(startTime).diff(moment()) - await this.getSettingTime('smartmeeting_booking_after_ms')
                        });
                        if(!needCheckIn){//不需要签到发会议结束前通知
                            await this.sendService.doWhenUseEndBefore({
                                data: data,
                                ttl: moment(endTime).diff(moment()) - await this.getSettingTime('smartmeeting_useend_before_ms')
                            });
                        }
                    }
                    for (let outUser of outUsers){
                        let data = { bookingId, updateTime: nowStr, startTime, endTime, userId: outUser.id, spaceId,email: outUser.email,phone: outUser.phone };
                        await this.sendService.doWhenBookingAfter({
                            data,
                            ttl: moment(startTime).diff(moment()) - await this.getSettingTime('smartmeeting_booking_after_ms')
                        });
                        if(!needCheckIn){//不需要签到发会议结束前通知
                            await this.sendService.doWhenUseEndBefore({
                                data,
                                ttl: moment(endTime).diff(moment()) - await this.getSettingTime('smartmeeting_useend_before_ms')
                            });
                        }
                    }
                    //常用联系人保持在10个
                    let numbers = await this.redisClient.zcard('smart_meeting:booking:top_contacts:' +String(userId));
                    if (numbers > 10){
                        await this.redisClient.zremrangebyrank('smart_meeting:booking:top_contacts:' +String(userId),0,numbers-10-1);
                    }
                    //外部联系人保持在10个
                    let outNumbers = await this.redisClient.zcard('smart_meeting:booking:out_contacts:' +String(userId));
                    if (outNumbers > 10){
                        await this.redisClient.zremrangebyrank('smart_meeting:booking:out_contacts:' +String(userId),0,numbers-10-1);
                    }
                    if(needCheckIn){
                        await this.sendService.doWhenCheckinTimeout({
                            data: {bookingId: bookingId, updateTime: nowStr},
                            ttl
                        });
                    }else {
                        await this.sendService.doWhenUseStart({
                            data: { bookingId,spaceId: spaceId,updateTime: nowStr },
                            ttl: moment(startTime).diff(moment())
                        });
                        await this.sendService.doWhenUseEnd({
                            data: { bookingId,spaceId: spaceId,updateTime: nowStr },
                            ttl: moment(endTime).diff(moment()) - 60000
                        });
                    }
                }else {
                    await this.sendService.doWhenApprovalTimeout({
                        data: { bookingId, updateTime: nowStr },
                        ttl:  moment(startTime).diff(moment()) - await this.getSettingTime('smartmeeting_approval_timeout_ms')
                    });
                }
                //调用查询会议室预约信息接口数据
                let bookingEndTime = moment().format('YYYY-MM-DD 23:59:59');
                let bookingStartTime = moment().format("YYYY-MM-DD HH:mm:ss");
                const resultBookingData = await this.padFindMeetingBookingList({spaceId,buId,flId,areaId,startTime:bookingStartTime,endTime:bookingEndTime});
                let sendData = { event:"booking",data:{spaceId,resultBookingData}};
                let resultData = JSON.stringify(sendData);
                //发送socket数据
                ws.send(resultData);
                //scoket断开连接
                ws.close();
                return 'success'
            })
        }catch (e) {
            return Promise.reject(e);
        }finally {
            this.unlock(spaceId).then().catch(e => {
                this.logger.error(e);
            });
        }
    }

    createBookingQuery(bookingDto: BookingDto): SelectQueryBuilder<SmartMeetingBooking>[] {
        const { startTime, endTime, buId, flId, spaceId } = bookingDto;
        return [this.conn
            .getRepository(SmartMeetingBooking)
            .createQueryBuilder()
            .where('start_time>=:todayStart', { todayStart: moment().format('YYYY-MM-DD 00:00:00') })
            .andWhere('(start_time<=:st and end_time>=:et)', {
                st: startTime,
                et: endTime
            })
            .andWhere('building_id=:buId', { buId })
            .andWhere('floor_id=:flId', { flId })
            .andWhere('space_id=:spaceId', { spaceId })
            .andWhere('state=1'),
            this.conn
                .getRepository(SmartMeetingBooking)
                .createQueryBuilder()
                .where('start_time>=:todayStart', { todayStart: moment().format('YYYY-MM-DD 00:00:00') })
                .andWhere('(end_time>:st and end_time<=:et)', {
                    st: startTime,
                    et: endTime
                })
                .andWhere('building_id=:buId', { buId })
                .andWhere('floor_id=:flId', { flId })
                .andWhere('space_id=:spaceId', { spaceId })
                .andWhere('state=1'),
            this.conn
                .getRepository(SmartMeetingBooking)
                .createQueryBuilder()
                .where('start_time>=:todayStart', { todayStart: moment().format('YYYY-MM-DD 00:00:00') })
                .andWhere('(start_time>=:st and start_time<:et)', {
                    st: startTime,
                    et: endTime
                })
                .andWhere('building_id=:buId', { buId })
                .andWhere('floor_id=:flId', { flId })
                .andWhere('space_id=:spaceId', { spaceId })
                .andWhere('state=1'),
        ];
    }

    checkBookRequest(startTime: string, endTime: string) {
        const startMoment = moment(startTime);
        const endMoment = moment(endTime)
        const ms = endMoment.diff(startMoment);
        if (ms <= 0 || ms > 30 * 24 * 3600 * 1000) {
            throw new Error('invalid operation!');
        }
    }
    async lock(spaceId: number): Promise<void> {
        const lock = await this.redisClient.setNx(`hot-desking:booking:save:${spaceId}`, 'running');
        if (lock !== 'OK') {
            return Promise.reject('工位锁定中，请刷新重试!');
        }
    }
    async unlock(spaceId: number): Promise<void> {
        await this.redisClient.del(`hot-desking:booking:save:${spaceId}`);
    }

    /**
     * 查询设备信息
     * @param type 类型
     */
    public async findCustomType():Promise<CustomTypeVo[]>{
            const type = 1;
            return await this.conn.getRepository(MgCustomTypes).createQueryBuilder()
                .select('name','customName')
                .addSelect('id','ctypeId')
                .andWhere('type=:type',{ type })
                .getRawMany<CustomTypeVo>();
    }
    /**
     * 查询服务信息
     * @param type 类型
     */
    public async findServices():Promise<CustomTypeVo[]>{
        const type = 5;
        return await this.conn.getRepository(MgCustomTypes).createQueryBuilder()
            .select('name','customName')
            .addSelect('id','ctypeId')
            .andWhere('type=:type',{ type })
            .getRawMany<CustomTypeVo>();
    }

    /**
     * 查询服务信息 -->Pad
     * @param type 类型
     */
    public async padFindServices():Promise<CustomTypeVo[]>{
        const type = 5;
        return await this.conn.getRepository(MgCustomTypes).createQueryBuilder()
            .select('name','customName')
            .addSelect('id','ctypeId')
            .andWhere('type=:type',{ type })
            .getRawMany<CustomTypeVo>();
    }

    /**
     * 查询会议室设备类型
     * @param type 类型
     */
    public async findCustomTypeBySpaceId(spaceId: number){
        const type = 1;
        return await this.conn.getRepository(MgCustomTypes).createQueryBuilder('t1')
            .innerJoin(MgEquipmentEntity,'t2','t1.id = t2.ctype_id')
            .select('t1.code','customCode')
            .addSelect('max(t1.name)','customName')
            .andWhere('t2.space_id = :spaceId',{spaceId})
            .andWhere('t1.type=:type',{ type })
            .groupBy('t1.code')
            .getRawMany<CustomTypeVo>();
    }

    /**
     * 通过会议室名称搜索
     * @param code
     */
    public async findMeetingPosition(body:MeetingSpaceNameDto):Promise<PageResultInterface<MgSpaceVo>>{
        const { spaceCode,page } = body;
        if (!spaceCode){
            return Promise.reject('parameter is null');
        }else {
            const todayStart = moment().format('YYYY-MM-DD 00:00:00');
            const resultData = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
                .innerJoin(SysBuildEntity,'build','space.building_id = build.bu_id')
                .innerJoin(SysFloorEntity,'floor','space.floor_id = floor.fl_id')
                .leftJoin(SysAreaEntity,'area','space.area_id = area.id')
                .select('space.id','spaceId')
                .addSelect('space.code','positionName')
                .addSelect('space.dimension_x','dimensionX')
                .addSelect('space.dimension_y','dimensionY')
                .addSelect('space.seating_capacity','seatingCapacity')
                .addSelect('build.bu_id','buId')
                .addSelect('build.bu_name','buName')
                .addSelect('floor.fl_id','flId')
                .addSelect('floor.fl_name','flName')
                .addSelect(`case when (select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) > 0 then '使用中' else '空闲' end as state`)
                .where('space.category = 2')
                .andWhere('space.category_second = 2')
                .andWhere('space.code like :spaceCode',{ spaceCode:spaceCode+'%' });
            //分页
            const total = await resultData.getCount();
            let data = await resultData
                .limit(page.pageSize)
                .offset(PageHelper.getSkip(page))
                .getRawMany<MgSpaceVo>();
            return { total, data };
        }
    }

    /**
     * 查询会议室列表信息
     * @param positionQueryDto
     */
    public async findMeetingPositionList(body:PositionQueryDto):Promise<PageResultInterface<PositionVo>>{
            const { buId,flId,areaId,ctypeIdList,seatingCapacity,state,spaceName,page} = body;
            const todayStart = moment().format('YYYY-MM-DD 00:00:00');
            const queryBuilderMeetingList = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space');
            queryBuilderMeetingList.innerJoin(SysBuildEntity,'build','space.building_id = build.bu_id')
                .innerJoin(SysFloorEntity,'floor','space.floor_id = floor.fl_id')
                .select('space.id','spaceId')
                .addSelect('space.code','positionName')
                //.addSelect('space.name','positionName')
                .addSelect('build.bu_id','buId')
                .addSelect('build.bu_name','buName')
                .addSelect('floor.fl_id','flId')
                .addSelect('floor.fl_name','flName')
                .addSelect('space.width','width')
                .addSelect('space.length','length')
                .addSelect('space.dimension_x','dimensionX')
                .addSelect('space.dimension_y','dimensionY')
                .addSelect('space.seating_capacity','seatingCapacity')
                .addSelect(`CASE WHEN space.attr1 = 1 THEN '预定需审核' WHEN space.attr1 = 0 THEN '预定无需审核' END as auditStatus`)
                .addSelect(`case when (select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) > 0 then '使用中' else '空闲' end as state`)
                .where('space.category = 2')
                .andWhere('space.category_second = 2')
                .orderBy('space.seating_capacity','ASC')
                if (spaceName){
                     queryBuilderMeetingList.andWhere('space.name like :spaceName',{spaceName:spaceName+'%'})
                }
                if(buId){
                    queryBuilderMeetingList.andWhere('space.building_id =:buId',{ buId:Number(buId) })
                }
                if(flId){
                    queryBuilderMeetingList.andWhere('space.floor_id =:flId',{ flId:Number(flId) })
                }
                if(areaId){
                    queryBuilderMeetingList.andWhere('space.area_id =:areaId',{ areaId:Number(areaId) })
                }
                if(seatingCapacity){
                    if(seatingCapacity>0 && seatingCapacity<=5){
                        const minNumber = 0;
                        const maxNumber = 5;
                        queryBuilderMeetingList.andWhere('space.seating_capacity >:minNumber and space.seating_capacity <=:maxNumber',{ minNumber,maxNumber})
                    }
                    if (seatingCapacity>5 && seatingCapacity<=10){
                        const minNumber = 5;
                        const maxNumber = 10;
                        queryBuilderMeetingList.andWhere('space.seating_capacity >:minNumber and space.seating_capacity <=:maxNumber',{ minNumber,maxNumber })
                    }
                    if (seatingCapacity>10 && seatingCapacity<=50){
                        const minNumber = 10;
                        const maxNumber = 50;
                        queryBuilderMeetingList.andWhere('space.seating_capacity >:minNumber and space.seating_capacity <=:maxNumber',{ minNumber,maxNumber })
                    }
                }
                if(ctypeIdList){
                    if (ctypeIdList.length>0){
                        queryBuilderMeetingList.andWhere(`(select count(DISTINCT ctype_id) from mg_equipment where ctype_id in (${ctypeIdList.join(',')}) and space_id = space.id)=${ctypeIdList.length}`,{ ctypeId:ctypeIdList })
                    }
                }
                //筛选会议状态
                if (state === 2){
                    queryBuilderMeetingList.andWhere(`(select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) > 0`,{state});
                }else if(state === 1){
                    queryBuilderMeetingList.andWhere(`(select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) = 0`,{state});
                }
                //分页
                const total = await queryBuilderMeetingList.getCount();
                let data = await queryBuilderMeetingList
                    .limit(page.pageSize)
                    .offset(PageHelper.getSkip(page))
                    .getRawMany<PositionVo>();
                return { total, data };
    }

    /**
     * 查询会议室列表信息-->Pad
     * @param positionQueryDto
     */
    public async padFindMeetingPositionList(body:PositionQueryDto):Promise<PositionVo[]>{
        const { buId,flId,areaId,ctypeIdList,seatingCapacity,state,spaceName} = body;
        const todayStart = moment().format('YYYY-MM-DD 00:00:00');
        const queryBuilderMeetingList = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space');
        queryBuilderMeetingList.innerJoin(SysBuildEntity,'build','space.building_id = build.bu_id')
            .innerJoin(SysFloorEntity,'floor','space.floor_id = floor.fl_id')
            .select('space.id','spaceId')
            .addSelect('space.code','positionName')
            //.addSelect('space.name','positionName')
            .addSelect('build.bu_id','buId')
            .addSelect('build.bu_name','buName')
            .addSelect('floor.fl_id','flId')
            .addSelect('floor.fl_name','flName')
            .addSelect('space.width','width')
            .addSelect('space.length','length')
            .addSelect('space.dimension_x','dimensionX')
            .addSelect('space.dimension_y','dimensionY')
            .addSelect('space.seating_capacity','seatingCapacity')
            .addSelect(`CASE WHEN space.attr1 = 1 THEN '预定需审核' WHEN space.attr1 = 0 THEN '预定无需审核' END as auditStatus`)
            .addSelect(`case when (select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) > 0 then '使用中' else '空闲' end as state`)
            .where('space.category = 2')
            .andWhere('space.category_second = 2')
            .orderBy('space.seating_capacity','ASC')
        if (spaceName){
            queryBuilderMeetingList.andWhere('space.name like :spaceName',{spaceName:'%'+spaceName+'%'})
        }
        if(buId){
            queryBuilderMeetingList.andWhere('space.building_id =:buId',{ buId:Number(buId) })
        }
        if(flId){
            queryBuilderMeetingList.andWhere('space.floor_id =:flId',{ flId:Number(flId) })
        }
        if(areaId){
            queryBuilderMeetingList.andWhere('space.area_id =:areaId',{ areaId:Number(areaId) })
        }
        if(seatingCapacity){
            if(seatingCapacity>0 && seatingCapacity<=5){
                const minNumber = 0;
                const maxNumber = 5;
                queryBuilderMeetingList.andWhere('space.seating_capacity >:minNumber and space.seating_capacity <=:maxNumber',{ minNumber,maxNumber})
            }
            if (seatingCapacity>5 && seatingCapacity<=10){
                const minNumber = 5;
                const maxNumber = 10;
                queryBuilderMeetingList.andWhere('space.seating_capacity >:minNumber and space.seating_capacity <=:maxNumber',{ minNumber,maxNumber })
            }
            if (seatingCapacity>10 && seatingCapacity<=50){
                const minNumber = 10;
                const maxNumber = 50;
                queryBuilderMeetingList.andWhere('space.seating_capacity >:minNumber and space.seating_capacity <=:maxNumber',{ minNumber,maxNumber })
            }
        }
        if(ctypeIdList){
            if (ctypeIdList.length>0){
                queryBuilderMeetingList.andWhere(`(select count(DISTINCT ctype_id) from mg_equipment where ctype_id in (${ctypeIdList.join(',')}) and space_id = space.id)=${ctypeIdList.length}`,{ ctypeId:ctypeIdList })
            }
        }
        //筛选会议状态
        if (state === 2){
            queryBuilderMeetingList.andWhere(`(select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) > 0`,{state});
        }else if(state === 1){
            queryBuilderMeetingList.andWhere(`(select count(1) from smart_meeting_booking where space_id=space.id AND start_time >= '${todayStart}' and start_time<=now() and end_time>=now() and state=2) = 0`,{state});
        }
        return queryBuilderMeetingList.getRawMany<PositionVo>();
    }

    /**
     * 查询会议室详情
     * @param spaceId  会议室Id
     */
    public async findMeetingDetails(spaceId: number):Promise<MeetingDetailsVo>{
        const resultData = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
            .innerJoin(SysBuildEntity,'build','space.building_id = build.bu_id')
            .innerJoin(SysFloorEntity,'floor','space.floor_id = floor.fl_id')
            .select('build.bu_name','buName')
            .addSelect('build.bu_id','buId')
            .addSelect('floor.fl_name','flName')
            .addSelect('floor.fl_id','flId')
            .addSelect('space.id','spaceId')
            .addSelect('space.name','spaceName')
            .addSelect('space.attr5','adminName')
            .addSelect(`CASE WHEN space.attr1 = 1 THEN '预定需审核' WHEN space.attr1 = 0 THEN '预定无需审核' END as auditStatus`)
            .addSelect(`CASE WHEN space.attr3 = 1 THEN '无需签到' WHEN space.attr3 = 2 THEN '人脸识别' WHEN space.attr3 = 3 THEN '二维码签到' WHEN space.attr3 = 4 THEN '密码签到'END as checkInType`)
            .addSelect(`CASE WHEN space.seating_capacity = 5 THEN '1-5' WHEN space.seating_capacity = 10 THEN '6-10' WHEN space.seating_capacity >=11 and space.seating_capacity <= 50 THEN '11-50' END as seating_capacity`)
            .where('space.id =:spaceId',{ spaceId })
            .getRawOne<MeetingDetailsVo>();

        if (!resultData) return Promise.reject('会议室不存在!');

        const resultStaffData = await this.conn
            .getRepository(StaffEntity)
            .createQueryBuilder()
            .select('st_name', 'stName')
            .where(`st_id in (${resultData.adminName})`)
            .getRawMany<{stName: string}>();
        resultData.adminName = resultStaffData.map(item => item.stName).join(',');

        const equipmentName = [];
        const resultEquipmentData = await this.conn
            .getRepository(MgEquipmentEntity).createQueryBuilder()
            .select('name','equipmentName')
            .where(`space_id =:spaceId`,{spaceId})
            .getRawMany<{equipmentName:string}>();
        for (let i=0;i<resultEquipmentData.length;i++){
            equipmentName.push(resultEquipmentData[i]['equipmentName']);
        }
        resultData.equipmentName = equipmentName.join(',');
        return resultData;
    }

    /**
     * 查询预约会议详情
     * @param bookingId  会议预定Id
     */
    public async findMeetingBookingDetails(bookingId: number):Promise<{
        resultMeetingData: MeetingDetailsVo,
        innerAttendees: SmartMeetingAttendee[],
        outerAttendees: SmartMeetingAttendee[],
        moderatorList: SmartMeetingAttendee[],
        serviceList: SmartMeetingService[],
        equipmentList: SmartMeetingEquipmentEntity[]}>{
        const resultMeetingData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('meeting')
            .innerJoin(MgSpaceEntity,'space','space.id = meeting.space_id')
            .select('meeting.id','meetingId')
            .addSelect('meeting.building_id','buId')
            .addSelect('meeting.floor_id','flId')
            .addSelect('space.id','spaceId')
            .addSelect('space.code','spaceCode')
            .addSelect(`CASE WHEN meeting.need_checkin = 0 THEN '否' WHEN meeting.need_checkin = 1 THEN '是' END as needCheckin`)
            .addSelect('meeting.remind_type','remindType')
            .addSelect(`CASE WHEN meeting.checkin_type = 1 THEN '二维码签到' WHEN meeting.checkin_type = 2 THEN '人脸识别' WHEN meeting.checkin_type = 3 THEN '密码签到' END as checkInType`)
            .addSelect('meeting.checkin_type','checkinType')
            .addSelect('meeting.comment','comment')
            .addSelect('meeting.service_comment','serviceComment')
            .addSelect('meeting.start_time','startTime')
            .addSelect('meeting.end_time','endTime')
            .addSelect('meeting.moderator','moderator')
            .addSelect(`case when meeting.state = 1 and meeting.confirm in (1,3) then '未开始' when meeting.state = 2 then '会议中' when meeting.state = 1 and meeting.confirm in (2) then '待审核' end as state`)
            .addSelect('meeting.topic','topic')
            .where('meeting.id =:bookingId',{ bookingId })
            .andWhere('meeting.state in (1,2)')
            .getRawOne<MeetingDetailsVo>();

        if (!resultMeetingData){
            return Promise.reject('会议不存在!');
        }
        //内部人员
        const innerAttendees = await this.conn
            .getRepository(SmartMeetingAttendee)
            .createQueryBuilder()
            .select('user_id','stId')
            .addSelect('user_name','stName')
            .addSelect('email','email')
            .addSelect('phone','phone')
            .where('booking_id=:bookingId and user_type = 1 and role = 1', { bookingId })
            .andWhere('is_delete = 0')
            .getRawMany();
        //外部人员
        const outerAttendees = await this.conn
            .getRepository(SmartMeetingAttendee)
            .createQueryBuilder()
            .select('user_name','stName')
            .addSelect('email','email')
            .addSelect('phone','phone')
            .where('booking_id=:bookingId and user_type=2', { bookingId })
            .andWhere('is_delete = 0')
            .getRawMany();
        //主持人
        const moderatorList = await this.conn.getRepository(SmartMeetingAttendee)
            .createQueryBuilder()
            .select('user_id','stId')
            .addSelect('user_name','stName')
            .addSelect('email','email')
            .addSelect('phone','phone')
            .where('role = 2')
            .andWhere('booking_id =:bookingId',{ bookingId })
            .andWhere('is_delete = 0')
            .getRawMany();
        //服务列表
        const serviceList = await this.conn.getRepository(SmartMeetingService)
            .createQueryBuilder('meeting')
            .select('custom.name','customName')
            .addSelect('custom.id','ctypeId')
            .innerJoin(MgCustomTypes,'custom','meeting.ctype_id = custom.id')
            .where('meeting.booking_id =:bookingId',{ bookingId })
            .getRawMany();
        //设备列表
        const equipmentList = await this.conn.getRepository(SmartMeetingEquipmentEntity)
            .createQueryBuilder('meeting')
            .innerJoin(MgCustomTypes,'custom','meeting.ctype_code = custom.code')
            .select('custom.name','customName')
            .addSelect('custom.code','ctypeCode')
            .addSelect('meeting.attr1','attr1')
            .addSelect('meeting.attr2','attr2')
            .addSelect('meeting.attr3','attr3')
            .addSelect('meeting.attr4','attr4')
            .addSelect('meeting.attr5','attr5')
            .addSelect('meeting.attr6','attr6')
            .where('meeting.booking_id =:bookingId',{ bookingId })
            .getRawMany();
        return { resultMeetingData, innerAttendees, outerAttendees, moderatorList,serviceList,equipmentList };
    }

    /**
     * 查询预约会议详情 -->Pad
     * @param bookingId  会议预定Id
     */
    public async padFindMeetingBookingDetails(bookingId: number):Promise<{
        resultMeetingData: MeetingDetailsVo,
        innerAttendees: SmartMeetingAttendee[],
        outerAttendees: SmartMeetingAttendee[],
        moderatorList: SmartMeetingAttendee[],
        serviceList: SmartMeetingService[],
        equipmentList: SmartMeetingEquipmentEntity[]}>{
        const resultMeetingData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('meeting')
            .innerJoin(MgSpaceEntity,'space','space.id = meeting.space_id')
            .select('meeting.id','meetingId')
            .addSelect('meeting.building_id','buId')
            .addSelect('meeting.floor_id','flId')
            .addSelect('space.id','spaceId')
            .addSelect('space.code','spaceCode')
            .addSelect(`CASE WHEN meeting.need_checkin = 0 THEN '否' WHEN meeting.need_checkin = 1 THEN '是' END as needCheckin`)
            .addSelect('meeting.remind_type','remindType')
            .addSelect(`CASE WHEN meeting.checkin_type = 1 THEN '二维码签到' WHEN meeting.checkin_type = 2 THEN '人脸识别' WHEN meeting.checkin_type = 3 THEN '密码签到' END as checkInType`)
            .addSelect('meeting.checkin_type','checkinType')
            .addSelect('meeting.comment','comment')
            .addSelect('meeting.service_comment','serviceComment')
            .addSelect('meeting.start_time','startTime')
            .addSelect('meeting.end_time','endTime')
            .addSelect('meeting.moderator','moderator')
            .addSelect(`case when meeting.state = 1 and meeting.confirm in (1,3) then '未开始' when meeting.state = 2 then '会议中' when meeting.state = 1 and meeting.confirm in (2) then '待审核' end as state`)
            .addSelect('meeting.topic','topic')
            .where('meeting.id =:bookingId',{ bookingId })
            .andWhere('meeting.state in (1,2)')
            .getRawOne<MeetingDetailsVo>();

        if (!resultMeetingData){
            return Promise.reject('会议不存在!');
        }
        //内部人员
        const innerAttendees = await this.conn
            .getRepository(SmartMeetingAttendee)
            .createQueryBuilder()
            .select('user_id','stId')
            .addSelect('user_name','stName')
            .addSelect('email','email')
            .addSelect('phone','phone')
            .where('booking_id=:bookingId and user_type = 1 and role = 1', { bookingId })
            .getRawMany();
        //外部人员
        const outerAttendees = await this.conn
            .getRepository(SmartMeetingAttendee)
            .createQueryBuilder()
            .select('user_name','stName')
            .addSelect('email','email')
            .addSelect('phone','phone')
            .where('booking_id=:bookingId and user_type=2', { bookingId })
            .getRawMany();
        //主持人
        const moderatorList = await this.conn.getRepository(SmartMeetingAttendee)
            .createQueryBuilder()
            .select('user_id','stId')
            .addSelect('user_name','stName')
            .addSelect('email','email')
            .addSelect('phone','phone')
            .where('role = 2')
            .andWhere('booking_id =:bookingId',{ bookingId })
            .getRawMany();
        //服务列表
        const serviceList = await this.conn.getRepository(SmartMeetingService)
            .createQueryBuilder('meeting')
            .select('custom.name','customName')
            .addSelect('custom.id','ctypeId')
            .innerJoin(MgCustomTypes,'custom','meeting.ctype_id = custom.id')
            .where('meeting.booking_id =:bookingId',{ bookingId })
            .getRawMany();
        //设备列表
        const equipmentList = await this.conn.getRepository(SmartMeetingEquipmentEntity)
            .createQueryBuilder('meeting')
            .innerJoin(MgCustomTypes,'custom','meeting.ctype_code = custom.code')
            .select('custom.name','customName')
            .addSelect('custom.code','ctypeCode')
            .addSelect('meeting.attr1','attr1')
            .addSelect('meeting.attr2','attr2')
            .addSelect('meeting.attr3','attr3')
            .addSelect('meeting.attr4','attr4')
            .addSelect('meeting.attr5','attr5')
            .addSelect('meeting.attr6','attr6')
            .where('meeting.booking_id =:bookingId',{ bookingId })
            .getRawMany();
        return { resultMeetingData, innerAttendees, outerAttendees, moderatorList,serviceList,equipmentList };
    }

    /**
     * 根据条件查询会议室预约信息
     */
    public async findMeetingBookingList(body:MyBookingDto):Promise<MyBookingVo[]>{
        const { buId,flId,areaId,startTime,spaceId} = body;
        let endTime = moment().format('YYYY-MM-DD 23:59:59');
        const queryBuilderMeetingData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking')
        queryBuilderMeetingData.innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
            .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
            .leftJoin(SysAreaEntity,'area','area.id = booking.area_id')
            .innerJoin(MgSpaceEntity,'space','space.id = booking.space_id')
            .select('build.bu_name','buName')
            .addSelect('booking.id','bookingId')
            .addSelect('floor.fl_name','flName')
            .addSelect('space.id','spaceId')
            .addSelect('space.name','spaceName')
            .addSelect('space.dimension_x','dimensionX')
            .addSelect('space.dimension_y','dimensionY')
            .addSelect('space.seating_capacity','seatingCapacity')
            .addSelect('booking.user_id','userId')
            .addSelect(`CASE WHEN booking.type = 1 THEN '立即使用' WHEN booking.type = 2 THEN '时段预约' WHEN booking.type = 3 THEN '全天预约' END as type`)
            .addSelect('booking.moderator','moderator')
            .addSelect('booking.topic','topic')
            .addSelect('booking.start_time','startTime')
            .addSelect('booking.end_time','endTime')
            .addSelect('booking.use_start_time','useStartTime')
            .addSelect('booking.use_end_time','useEndTime')
            .addSelect(`CASE WHEN booking.state = 1 THEN '已预定'  WHEN booking.state = 2 THEN '会议中' END as state`)
            .where('booking.state in (1,2)')
            .andWhere('space.id =:spaceId',{spaceId})
            .andWhere('booking.end_time>=:startTime and booking.end_time<:endTime', { startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: moment(endTime).format('YYYY-MM-DD HH:mm:ss') })
            if(buId){
                queryBuilderMeetingData.andWhere('booking.building_id =:buId',{ buId:Number(buId) })
            }
            if(flId){
                queryBuilderMeetingData.andWhere('booking.floor_id =:flId',{ flId:Number(flId) })
            }
            if(areaId){
                queryBuilderMeetingData.andWhere('booking.area_id =:areaId',{ areaId:Number(areaId) })
            }
             return queryBuilderMeetingData.getRawMany<MyBookingVo>();
    }

    /**
     * 根据条件查询会议室预约信息 -->Pad
     */
    public async padFindMeetingBookingList(body:MyBookingDto):Promise<MyBookingVo[]>{
        const { buId,flId,areaId,startTime,spaceId} = body;
        let endTime = moment().format('YYYY-MM-DD 23:59:59');
        const queryBuilderMeetingData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking')
        queryBuilderMeetingData.innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
            .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
            .leftJoin(SysAreaEntity,'area','area.id = booking.area_id')
            .innerJoin(MgSpaceEntity,'space','space.id = booking.space_id')
            .select('build.bu_name','buName')
            .addSelect('booking.id','bookingId')
            .addSelect('floor.fl_name','flName')
            .addSelect('space.id','spaceId')
            .addSelect('space.name','spaceName')
            .addSelect('space.dimension_x','dimensionX')
            .addSelect('space.dimension_y','dimensionY')
            .addSelect('space.seating_capacity','seatingCapacity')
            .addSelect('booking.user_id','userId')
            .addSelect(`CASE WHEN booking.type = 1 THEN '立即使用' WHEN booking.type = 2 THEN '时段预约' WHEN booking.type = 3 THEN '全天预约' END as type`)
            .addSelect('booking.moderator','moderator')
            .addSelect('booking.topic','topic')
            .addSelect('booking.start_time','startTime')
            .addSelect('booking.end_time','endTime')
            .addSelect('booking.use_start_time','useStartTime')
            .addSelect('booking.use_end_time','useEndTime')
            .addSelect(`CASE WHEN booking.state = 1 THEN '已预定'  WHEN booking.state = 2 THEN '会议中' END as state`)
            .where('booking.state in (1,2)')
            .andWhere('space.id =:spaceId',{spaceId})
            .andWhere('booking.end_time>=:startTime and booking.end_time<:endTime', { startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: moment(endTime).format('YYYY-MM-DD HH:mm:ss') })
            .orderBy('booking.start_time', 'DESC')
        if(buId){
            queryBuilderMeetingData.andWhere('booking.building_id =:buId',{ buId:Number(buId) })
        }
        if(flId){
            queryBuilderMeetingData.andWhere('booking.floor_id =:flId',{ flId:Number(flId) })
        }
        if(areaId){
            queryBuilderMeetingData.andWhere('booking.area_id =:areaId',{ areaId:Number(areaId) })
        }
        return queryBuilderMeetingData.getRawMany<MyBookingVo>();
    }

    /**
     *  根据条件查询我的会议记录 --> web
     */
    public async findMyMeetingBookingRecord(body:MyMeetingDto, userId: number):Promise<MyMeetingVo[]>{
        const { meetingName,meetingState,timeType,moderator,topic,belongingType } = body;
        const resultMeetingBookingData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking');
        resultMeetingBookingData.innerJoin(MgSpaceEntity,'space','booking.space_id = space.id')
            .select('space.name','spaceName')
            .addSelect('booking.moderator','moderator')
            .addSelect('booking.topic','topic')
            .addSelect('booking.create_time','createTime')
            .addSelect('booking.start_time','startTime')
            .addSelect('booking.end_time','endTime')
            .addSelect(`case when booking.type = 1 then '普通会议' when booking.type = 2 then '普通会议' when booking.type = 3 then '立即会议' end as type`)
            .addSelect(`case when booking.state = 1 then '未开始' when booking.state = 2 then '会议中' when booking.state =3 then '已结束' when booking.state = 4 then '已取消' when booking.state = 5 then '已失效' end as state`)
            .addSelect(`case when booking.release_type = 1 then '提前结束' when booking.release_type = 2 then '正常结束' when booking.release_type = 3 then '延长后结束' when booking.release_type = 4 then '未签到自动释放' when booking.release_type = 5 
             then '未审核自动释放' when booking.release_type = 6 then '审核未通过释放' when booking.release_type is null then booking.release_type else '--' end as releaseType`)
            .addSelect(`case when booking.need_checkin = 0 then '无需签到' when booking.need_checkin = 1 then '认证签到' end as checkin`)
            if(belongingType == 1){
                //预定
                resultMeetingBookingData.where('booking.user_id =:userId',{ userId })
            }
            if(belongingType == 2){
                //参与
                resultMeetingBookingData.andWhere('exists (select 1 from smart_meeting_attendee attendee where booking.id = attendee.booking_id and booking.user_id=attendee.user_id and attendee.user_id =:userId)',{ userId })
            }
            if(meetingState){
                resultMeetingBookingData.andWhere('booking.state =:meetingState',{ meetingState })
            }
            if(meetingName){
                resultMeetingBookingData.andWhere('space.name =:meetingName',{ meetingName })
            }
            if(moderator){
                resultMeetingBookingData.andWhere('booking.moderator =:moderator',{ moderator })
            }
            if(topic){
                resultMeetingBookingData.andWhere('booking.topic =:topic',{ topic })
            }
            //timeType = 1 一周
            if(timeType === 1){
                let startTime;
                let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',6).format('YYYY-MM-DD HH:mm:ss');
                if(startTime){
                    resultMeetingBookingData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
                }
            }
            //timeType = 2 两周
            if(timeType === 2){
                let startTime;
                let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',12).format('YYYY-MM-DD HH:mm:ss');
                if(startTime){
                    resultMeetingBookingData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
                }
            }
            //timeType = 3 一个月
            if(timeType === 3){
                let startTime;
                let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',30).format('YYYY-MM-DD HH:mm:ss');
                if(startTime){
                    resultMeetingBookingData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
                }
            }
            //timeType = 4 三个月
            if(timeType === 4){
                let startTime;
                let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',60).format('YYYY-MM-DD HH:mm:ss');
                if(startTime){
                    resultMeetingBookingData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
                }
            }
            return resultMeetingBookingData.getRawMany<MyMeetingVo>();
    }

    /**
     *
     * @param body  根据条件查询我的会议记录 --> Mobile
     * @param userId  根据条件查询我的会议记录 --> 用户id
     */
    public async queryMyMeetingBookingRecord(body:MyMeetingDto,userId: number):Promise<PageResultInterface<MyMeetingVo>>{
        const { meetingName,meetingState,timeType,moderator,topic,belongingType,page } = body;
        let startTime = moment().format('YYYY-MM-DD 00:00:00');
        let endTime = moment().add('days',90).format('YYYY-MM-DD HH:mm:ss');
        //let endTime = moment().format('YYYY-MM-DD 23:59:59');
        const resultMeetingBookingData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking');
        resultMeetingBookingData.innerJoin(MgSpaceEntity,'space','booking.space_id = space.id')
            .select('space.name','spaceName')
            .addSelect('booking.id','bookingId')
            .addSelect('booking.user_id','userId')
            .addSelect('booking.moderator','moderator')
            .addSelect('booking.topic','topic')
            .addSelect('booking.create_time','createTime')
            .addSelect('booking.start_time','startTime')
            .addSelect('booking.end_time','endTime')
            .addSelect('booking.need_checkin','needCheckIn')
            .addSelect(`case when booking.state = 1 and booking.confirm in (1,3) then '未开始' when booking.state = 2 then '会议中' when booking.state = 1 and booking.confirm in (2) then '待审核' end as state`)
            .addSelect(`case when booking.release_type = 1 then '提前结束' when booking.release_type = 2 then '正常结束' when booking.release_type = 3 then '延长后结束' when booking.release_type = 4 then '未签到自动释放' when booking.release_type = 5 
             then '未审核自动释放' when booking.release_type = 6 then '审核未通过释放' when booking.release_type is null then booking.release_type else '--' end as releaseType`)
            .addSelect(`case when booking.need_checkin = 0 then '无需签到' when booking.need_checkin = 1 then '认证签到' end as checkin`)
            .where('booking.end_time>:startTime and booking.end_time<:endTime', { startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: moment(endTime).format('YYYY-MM-DD HH:mm:ss') })
            .andWhere('booking.state in (1,2)')
        if(topic){
            resultMeetingBookingData.andWhere('booking.topic like :topic',{ topic:topic+'%' })
        }
        switch (meetingState) {
            //会议状态筛选
            case 1:
                //1，进行中的会议
                resultMeetingBookingData.andWhere('booking.state = 2');
                resultMeetingBookingData.andWhere('booking.confirm in (1,3)');
                break;
            case 2:
                //2，待开始会议
                resultMeetingBookingData.andWhere('booking.state = 1');
                resultMeetingBookingData.andWhere('booking.confirm in (1,3)');
                break;
            case 3:
                //3，待审核会议
                resultMeetingBookingData.andWhere('booking.state = 1');
                resultMeetingBookingData.andWhere('booking.confirm = 2');
                break;
        }
        if(belongingType === 2){
            //参与 --不是我预定的,但是我参与了
            resultMeetingBookingData.andWhere('exists (select 1 from smart_meeting_attendee attendee where booking.id = attendee.booking_id  and attendee.user_id =:userId and booking.user_id !=:userId)',{ userId })
        }else {
            //默认我预定的会议
            resultMeetingBookingData.andWhere('booking.user_id =:userId',{ userId })
        }
        if(meetingName){
            resultMeetingBookingData.andWhere('space.name =:meetingName',{ meetingName })
        }
        if(moderator){
            resultMeetingBookingData.andWhere('booking.moderator =:moderator',{ moderator })
        }
        if(topic){
            resultMeetingBookingData.andWhere('booking.topic =:topic',{ topic })
        }
        //queryBuilder.andWhere('book.create_time>=:startTime and book.create_time<:endTime', { startTime, endTime })
        //timeType = 1 当天
        if(timeType === 1){
            let toDayStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
            let toDayEndTime = moment().format('YYYY-MM-DD 23:59:59');
            resultMeetingBookingData.andWhere('booking.create_time<=:toDayStartTime and booking.end_time<:toDayEndTime', { toDayStartTime, toDayEndTime })
        }
        //timeType = 2 一周
        if(timeType === 2){
            let aWeekStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
            let aWeekEndTime= moment().add('days',6).format('YYYY-MM-DD HH:mm:ss');
            resultMeetingBookingData.andWhere('booking.create_time<=:aWeekStartTime and booking.end_time<:aWeekEndTime', { aWeekEndTime, aWeekStartTime })
        }
        //timeType = 3 一个月
        if(timeType === 3){
            let JanuaryStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
            let JanuaryEndTime = moment().add('days',30).format('YYYY-MM-DD HH:mm:ss');
            resultMeetingBookingData.andWhere('booking.create_time<=:JanuaryStartTime and booking.end_time<:JanuaryEndTime', { JanuaryStartTime, JanuaryEndTime })
        }
        //分页
        const total = await resultMeetingBookingData.getCount();
        let data = await resultMeetingBookingData
            .orderBy('startTime,spaceName','ASC')
            .limit(page.pageSize)
            .offset(PageHelper.getSkip(page))
            .getRawMany<MyMeetingVo>();
        if(belongingType === 2){
            //参与 --不是我预定的,但是我参与了
            data.map(item=>{
                item['belongingType']=2
            })
        }else {
            //默认我预定的会议
            data.map(item=>{
                item['belongingType']=1
            })
        }
        return { total, data };
    }

    /**
     * 历史会议查询接口
     * @param body
     * @param userId
     */
    public async queryMyMeetingBookingHistory(body:MyBookingHistory, userId: number):Promise<PageResultInterface<MyMeetingVo>>{
        const { releaseType,belongingType,timeType,page,topic } = body;
        let startTime = moment().format('YYYY-MM-DD 23:59:59');
        let endTime = moment().add('days',90).format('YYYY-MM-DD HH:mm:ss');
        const resultMeetingBookingHistoryData = await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking');
        resultMeetingBookingHistoryData.innerJoin(MgSpaceEntity,'space','booking.space_id = space.id')
            .select('space.name','spaceName')
            .addSelect('booking.userId','userId')
            .addSelect('booking.moderator','moderator')
            .addSelect('booking.topic','topic')
            .addSelect('booking.create_time','createTime')
            .addSelect('booking.start_time','startTime')
            .addSelect('booking.end_time','endTime')
            .addSelect(`case when booking.type = 1 then '普通会议' when booking.type = 2 then '普通会议' when booking.type = 3 then '立即会议' end as type`)
            .addSelect(`case when booking.state = 1 then '未开始' when booking.state = 2 then '会议中' when booking.state =3 then '已结束' when booking.state = 4 then '已取消' end as state`)
            .addSelect(`case when booking.release_type = 1 then '提前结束' when booking.release_type = 2 then '正常结束' when booking.release_type = 3 then '延长后结束' when booking.release_type = 4 then '未签到自动释放' when booking.release_type = 5 
             then '未审核自动释放' when booking.release_type = 6 then '审核未通过释放' when booking.release_type = 7 then '正常取消' when booking.release_type is null then booking.release_type else '--' end as releaseType`)
            .addSelect(`case when booking.need_checkin = 0 then '无需签到' when booking.need_checkin = 1 then '认证签到' end as checkin`)
            .where('booking.create_time<=:startTime and booking.update_time<:endTime', { startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: moment(endTime).format('YYYY-MM-DD HH:mm:ss') })
            .andWhere('booking.state in (3,4)')
            .andWhere('booking.userId =:userId',{ userId });
        if(topic){
            resultMeetingBookingHistoryData.andWhere('booking.topic like :topic',{ topic:topic+'%' })
        }
        switch (releaseType) {
            //释放方式 1.未过审的会议 2.已结束的会议 3.已取消的会议 4.已经失效的会议
            case 1:
                //1，未过审的会议
                resultMeetingBookingHistoryData.andWhere('booking.release_type in (5,6)');
                break;
            case 2:
                //2，已结束的会议
                resultMeetingBookingHistoryData.andWhere('booking.release_type in (1,2,3)');
                break;
            case 3:
                //3，已取消的会议
                resultMeetingBookingHistoryData.andWhere('booking.release_type = 7');
                break;
            case 4:
                //4，已经失效的会议
                resultMeetingBookingHistoryData.andWhere('booking.release_type = 4');
                break;
        }
        if(belongingType == 1){
            //预定
            resultMeetingBookingHistoryData.andWhere('booking.user_id =:userId',{ userId })
        }
        if(belongingType == 2){
            //参与
            resultMeetingBookingHistoryData.andWhere('exists (select 1 from smart_meeting_attendee attendee where booking.id = attendee.booking_id and booking.user_id=attendee.user_id and attendee.user_id =:userId)',{ userId })
        }
        //timeType = 1 当天
        if(timeType === 1){
            let toDayStartTime = moment().format('YYYY-MM-DD 00:00:00');
            let toDayEndTime = moment().format('YYYY-MM-DD 23:59:59');
            resultMeetingBookingHistoryData.andWhere('booking.start_time>:toDayStartTime and booking.start_time<:toDayEndTime', { toDayStartTime, toDayEndTime })
        }
        //timeType = 2 一周
        if(timeType === 2){
            let aWeekEndTime = moment().format('YYYY-MM-DD 23:59:59');
            let aWeekStartTime= moment().subtract('days',6).format('YYYY-MM-DD 23:59:59');
            resultMeetingBookingHistoryData.andWhere('booking.start_time>:aWeekStartTime and booking.start_time<:aWeekEndTime', { aWeekEndTime, aWeekStartTime })
        }
        //timeType = 3 一个月
        if(timeType === 3){
            let JanuaryEndTime = moment().format('YYYY-MM-DD 23:59:59');
            let JanuaryStartTime= moment().subtract('days',30).format('YYYY-MM-DD 23:59:59');
            resultMeetingBookingHistoryData.andWhere('booking.start_time>:JanuaryStartTime and booking.start_time<:JanuaryEndTime', { JanuaryStartTime, JanuaryEndTime })
        }
        //分页
        const total = await resultMeetingBookingHistoryData.getCount();
        const data = await resultMeetingBookingHistoryData.
            orderBy('endTime','DESC')
            .limit(page.pageSize)
            .offset(PageHelper.getSkip(page))
            .getRawMany<MyMeetingVo>();
        return { total,data };
    }

    /**
     * 取消会议
     * @param bookingId   会议Id
     * @param comment    取消原因
     */
    public async cancelMeetingByState(bookingId: number, comment: string):Promise<string>{
         if(!bookingId){
            return Promise.reject('parameter is null');
         }else {
             //查询会议状态是否未开始
             const resultMeetingStateData = await this.conn.getRepository(SmartMeetingBooking).findOne(bookingId);
             //查询RabbitEventMQ_id,isDelete修改其状态
             const rabbitEvent = 'smart-meeting.use.end';
             const rabbitEventNotReviewed = 'smart-meeting.approval.timeout';
             const resultRabbitMqData = await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                 .innerJoin(SmartMeetingBooking,'meeting','consumer.businessId = meeting.id')
                 .select('consumer.id','consumerId')
                 .where ('consumer.businessId =:bookingId',{ bookingId })
                 .andWhere('consumer.event in (:...rabbitEventNames)',{ rabbitEventNames:[rabbitEvent,rabbitEventNotReviewed] })
                 .getRawMany();
             const consumerList = [];
             let consumerId = '';
             for (let i=0;i<resultRabbitMqData.length;i++){
                 consumerList.push(resultRabbitMqData[i]['consumerId']);
                 for (let j = 0;j<consumerList.length;j++){
                     consumerId = consumerList[0];
                 }
             }

             //会议未开始取消
             if (resultMeetingStateData.state===1 && resultMeetingStateData.confirm !== 2 ){
                 //开启事务
                 await this.conn.transaction(async m=>{
                     await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking')
                         .update()
                         .set({state : 4,comment : comment || comment,releaseType : 7})
                         .where('id =:bookingId',{ bookingId })
                         .execute();
                     //修改MQ状态
                     if(resultRabbitMqData.length > 0){
                         await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                             .update()
                             .set( { isDelete: 1 } )
                             .where ('id =:consumerId',{ consumerId })
                             .execute();
                     }else {
                         return Promise.reject('not find Data');
                     }
                 });
                 return 'cancel booking state success';
                 //会议待审核取消操作
             }else if (resultMeetingStateData.state === 1 && resultMeetingStateData.confirm === 2) {
                 //开启事务
                 await this.conn.transaction(async m=>{
                     await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking')
                         .update()
                         .set({state : 4,comment : comment || comment,releaseType : 7})
                         .where('id =:bookingId',{ bookingId })
                         .execute();
                     //修改MQ状态
                     if(resultRabbitMqData.length > 0){
                         await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                             .update()
                             .set( { isDelete: 1 } )
                             .where ('id =:consumerId',{ consumerId })
                             .execute();
                     }else {
                         return Promise.reject('not find Data');
                     }
                 });
                 return 'cancel booking state success';
             }
             else {
                 return Promise.reject('会议不是未开始状态,无法取消!');
             }
         }
    }

    /**
     * 批量取消会议
     * @param body
     */
    public async batchCancelMeetingByState(body: MeetingStateDto):Promise<string>{
        const { bookingIdList } = body;
        if (bookingIdList.length == 0){
            return Promise.reject('parameter is null');
        }else {
            //开启事务
            await this.conn.transaction(async m => {
                for (let i = 0; i<bookingIdList.length; i++){
                    const bookingId = bookingIdList[i];
                    await this.conn.getRepository(SmartMeetingBooking).createQueryBuilder('booking')
                        .update()
                        .set({state : 4})
                        .where('id =:bookingId',{ bookingId })
                        .execute();
                }
            });
            return 'batch Cancel booking success';
        }
    }

    createMeetingBookingQuery(extendMeetingDto: extendMeetingDto): SelectQueryBuilder<SmartMeetingBooking> {
        const { startTime, endTime }  = extendMeetingDto;
        let { buId, flId, spaceId } = extendMeetingDto;
        //console.log('startTime\t'+startTime+'\n'+'endTime\t'+endTime+'\n'+'buId\t'+buId+'\n'+'flId\t'+flId+'\n'+'spaceId\t'+spaceId+'\n');
        buId = Number(buId);
        flId = Number(flId);
        spaceId = Number(spaceId);
        return this.conn
            .getRepository(SmartMeetingBooking)
            .createQueryBuilder()
            .where('start_time>=:todayStart', { todayStart: moment().format('YYYY-MM-DD 00:00:00') })
            .andWhere('(start_time<:et and end_time>:st)', {
                st: startTime,
                et: endTime
            })
            .andWhere('building_id=:buId', { buId })
            .andWhere('floor_id=:flId', { flId })
            .andWhere('space_id=:spaceId', { spaceId })
            .andWhere('state=2');
    }

    /**
     * 延长(会议中)会议的结束时间
     * @param extendMeetingDto
     */
    public async extendMeetingBooking(extendMeetingDto: extendMeetingDto):Promise<string>{
       const nowMoment = moment();
       const nowStr = nowMoment.format(dateFormat);
       const { bookingId,userId,spaceId,extendTime} = extendMeetingDto;
       //console.log(id+'\n'+'extendTime\n'+extendTime+'userId\n'+userId);
       try {
            const alreadyBooking = await this.conn.getRepository(SmartMeetingBooking).findOne(bookingId);
           //比较开始时间和结束时间参数
            if (nowMoment.diff(moment(alreadyBooking.endTime)) >=0 ){
                return Promise.reject('会议已结束,请重新预约!');
            }
            //判断会议是否结束
            if (alreadyBooking.state==2){
                extendMeetingDto.startTime = alreadyBooking.endTime;
                extendMeetingDto.endTime = moment(alreadyBooking.endTime).add(extendTime,'hours').format('YYYY-MM-DD HH:mm:ss');
                const extendEndTime = extendMeetingDto.endTime;
                extendMeetingDto.buId = alreadyBooking.buildingId;
                extendMeetingDto.flId = alreadyBooking.floorId;
                extendMeetingDto.spaceId = alreadyBooking.spaceId;
                let bookingQueryList = this.createMeetingBookingQuery(extendMeetingDto);
                //查询RabbitEventMQ_id,isDelete修改其状态
                const rabbitEvent = 'smart-meeting.use.end';
                const resultRabbitMqData = await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                    .innerJoin(SmartMeetingBooking,'meeting','consumer.businessId = meeting.id')
                    .select('consumer.id','consumerId')
                    .where ('consumer.businessId =:bookingId',{ bookingId })
                    .andWhere('consumer.event =:rabbitEvent',{ rabbitEvent })
                    .getRawMany();
                const consumerList = [];
                let consumerId = '';
                for (let i=0;i<resultRabbitMqData.length;i++){
                    consumerList.push(resultRabbitMqData[i]['consumerId']);
                    for (let j = 0;j<consumerList.length;j++){
                        consumerId = consumerList[0];
                    }
                }
                //创建事务-->延长会议时间
                await this.conn.transaction(async m=>{
                    await m
                        .getRepository(SmartMeetingBooking)
                        .update({
                            id:bookingId
                        },{
                            endTime:extendEndTime,
                            updateTime: nowStr
                        });
                    //修改MQ状态
                    if(resultRabbitMqData.length > 0){
                        await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                            .update()
                            .set( { isDelete: 1 } )
                            .where ('id =:consumerId',{ consumerId })
                            .execute();
                    } else {
                        return Promise.reject('not find Data');
                    }
                    const ttl = moment(extendEndTime).diff(moment()) - 60000;
                    //延长之后重新发送MQ信息,延长物联设备时间
                    await this.sendService.doWhenUseEnd({
                        data: { bookingId,spaceId:spaceId,updateTime:nowStr },
                        ttl: ttl
                    });
                });
            }else {
                return Promise.reject('会议未开始!');
            }
       }catch (e) {
           this.logger.error(e);
           return Promise.reject(e);
       }
       return 'meeting extend success';
    }

    /**
     * 延长(会议中)会议的结束时间-->pad
     * @param extendMeetingDto
     */
    public async padExtendMeetingBooking(extendMeetingDto: extendMeetingDto):Promise<string>{
        const nowMoment = moment();
        const nowStr = nowMoment.format(dateFormat);
        const { bookingId,userId,spaceId,extendTime} = extendMeetingDto;
        //console.log(id+'\n'+'extendTime\n'+extendTime+'userId\n'+userId);
        try {
            const alreadyBooking = await this.conn.getRepository(SmartMeetingBooking).findOne(bookingId);
            //比较开始时间和结束时间参数
            if (nowMoment.diff(moment(alreadyBooking.endTime)) >=0 ){
                return Promise.reject('会议已结束,请重新预约!');
            }
            //判断会议是否结束
            if (alreadyBooking.state==2){
                extendMeetingDto.startTime = alreadyBooking.endTime;
                extendMeetingDto.endTime = moment(alreadyBooking.endTime).add(extendTime,'hours').format('YYYY-MM-DD HH:mm:ss');
                const extendEndTime = extendMeetingDto.endTime;
                extendMeetingDto.buId = alreadyBooking.buildingId;
                extendMeetingDto.flId = alreadyBooking.floorId;
                extendMeetingDto.spaceId = alreadyBooking.spaceId;
                let bookingQueryList = this.createMeetingBookingQuery(extendMeetingDto);
                //查询RabbitEventMQ_id,isDelete修改其状态
                const rabbitEvent = 'smart-meeting.use.end';
                const resultRabbitMqData = await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                    .innerJoin(SmartMeetingBooking,'meeting','consumer.businessId = meeting.id')
                    .select('consumer.id','consumerId')
                    .where ('consumer.businessId =:bookingId',{ bookingId })
                    .andWhere('consumer.event =:rabbitEvent',{ rabbitEvent })
                    .getRawMany();
                const consumerList = [];
                let consumerId = '';
                for (let i=0;i<resultRabbitMqData.length;i++){
                    consumerList.push(resultRabbitMqData[i]['consumerId']);
                    for (let j = 0;j<consumerList.length;j++){
                        consumerId = consumerList[0];
                    }
                }
                //创建事务-->延长会议时间
                await this.conn.transaction(async m=>{
                    await m
                        .getRepository(SmartMeetingBooking)
                        .update({
                            id:bookingId
                        },{
                            endTime:extendEndTime,
                            updateTime: nowStr
                        });
                    //修改MQ状态
                    if(resultRabbitMqData.length > 0){
                        await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                            .update()
                            .set( { isDelete: 1 } )
                            .where ('id =:consumerId',{ consumerId })
                            .execute();
                    } else {
                        return Promise.reject('not find Data');
                    }
                    const ttl = moment(extendEndTime).diff(moment()) - 60000;
                    //延长之后重新发送MQ信息,延长物联设备时间
                    await this.sendService.doWhenUseEnd({
                        data: { bookingId,spaceId:spaceId,updateTime:nowStr },
                        ttl: ttl
                    });
                });
            }else {
                return Promise.reject('会议未开始!');
            }
        }catch (e) {
            this.logger.error(e);
            return Promise.reject(e);
        }
        return 'meeting extend success';
    }

    /**
     * 结束(会议中)的会议
     * @param extendMeetingDto
     */
    public async endMeetingBooking(extendMeetingDto: extendMeetingDto):Promise<string>{
        const { bookingId,endTime } = extendMeetingDto;
        const nowMoment = moment();
        const nowStrEndTime = nowMoment.format(dateFormat);
        try {
            const alreadyBookingData = await this.conn.getRepository(SmartMeetingBooking).findOne(bookingId);
            //判断会议是否结束
            if (nowMoment.diff(moment(alreadyBookingData.endTime)) >=0 ){
                //console.log(moment(alreadyBookingData.endTime).format('YYYY-MM-DD HH:mm:ss'));
                return Promise.reject('会议已结束,请重新预约!');
            }
            //查询RabbitEventMQ_id,isDelete修改其状态
            const rabbitEvent = 'smart-meeting.use.end';
            const resultRabbitMqData = await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                .innerJoin(SmartMeetingBooking,'meeting','consumer.businessId = meeting.id')
                .select('consumer.id','consumerId')
                .where ('consumer.businessId =:bookingId',{ bookingId })
                .andWhere('consumer.event =:rabbitEvent',{ rabbitEvent })
                .getRawMany();
            const consumerList = [];
            let consumerId = '';
            for (let i=0;i<resultRabbitMqData.length;i++){
                consumerList.push(resultRabbitMqData[i]['consumerId']);
                for (let j = 0;j<consumerList.length;j++){
                    consumerId = consumerList[0];
                }
            }

            //查询当前会议状态
            if(alreadyBookingData.state==2){
                //创建事务-->结束会议
                await this.conn.transaction(async m=>{
                    await m
                        .getRepository(SmartMeetingBooking)
                        .update({
                            id:bookingId
                        },{
                            state:3,
                            releaseType:1,
                            useEndTime:nowStrEndTime,
                            updateTime: nowStrEndTime
                        });

                    //修改MQ状态
                    if(resultRabbitMqData.length > 0){
                        await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                            .update()
                            .set( { isDelete: 1 } )
                            .where ('id =:consumerId',{ consumerId })
                            .execute();
                    }else {
                        return Promise.reject('not find Data');
                    }
                    //时间延迟
                    const ttl = moment(endTime).diff(moment()) - 60000;
                    //结束后关闭物联设备，先查询当前会议有哪些设备
                    const resultequipmentData = [];
                    const booking = await this.conn.getRepository(SmartMeetingBooking).findOne(extendMeetingDto.bookingId);
                    const ctypes = await this.conn.getRepository(SmartMeetingEquipmentEntity)
                        .createQueryBuilder('sc')
                        .select('(select id from mg_custom_types where code=sc.ctype_code)', 'ctypeId')
                        .where('booking_id=:bookingId', { bookingId: booking.id })
                        .getRawMany<{ ctypeId: number }>();
                    const ctypeIds = ctypes.map(item => item.ctypeId).join(',');

                    const equipmentData = ctypeIds ? await this.conn.getRepository(MgEquipmentEntity).createQueryBuilder()
                        .where('space_id=:spaceId', { spaceId: booking.spaceId })
                        .andWhere(`ctype_id in (${ctypeIds})`)
                        .getMany() : [];
                    if (equipmentData.length>0){
                        for (let i = 0;i<equipmentData.length;i++){
                            resultequipmentData.push(equipmentData[i]['name']+'-'+equipmentData[i]['code']);
                            if (equipmentData[i]['name']=='空调'){
                                const devID = equipmentData[i]['code'];
                                //关空调
                                await this.client.send({ cmd: 'wism_dms.wulian.close.airconditioning' }, _.defaults({
                                    spaceId: booking.spaceId,
                                    devID:devID,
                                }, )).toPromise();
                            }
                            if(equipmentData[i]['name']=='三路开关'){
                                const devID = equipmentData[i]['code'];
                                //关三路开关
                                await this.client.send({ cmd: 'wism_dms.wulian.close.switches' }, _.defaults({
                                    spaceId: booking.spaceId,
                                    endpointNumber:4,
                                    devID:devID
                                }, )).toPromise();
                            }
                        }
                    }else{
                           return 'equipmentData is null';
                    }
                });
            }else {
                return Promise.reject('当前会议未开始!');
            }
        }catch (e) {
            this.logger.error(e);
            return Promise.reject(e);
        }
        return 'meeting end success';
    }

    /**
     * 结束(会议中)的会议-->pad
     * @param extendMeetingDto
     */
    public async padEndMeetingBooking(extendMeetingDto: extendMeetingDto):Promise<string>{
        const { bookingId,endTime } = extendMeetingDto;
        const nowMoment = moment();
        const nowStrEndTime = nowMoment.format(dateFormat);
        try {
            const alreadyBookingData = await this.conn.getRepository(SmartMeetingBooking).findOne(bookingId);
            //判断会议是否结束
            if (nowMoment.diff(moment(alreadyBookingData.endTime)) >=0 ){
                //console.log(moment(alreadyBookingData.endTime).format('YYYY-MM-DD HH:mm:ss'));
                return Promise.reject('会议已结束,请重新预约!');
            }
            //查询RabbitEventMQ_id,isDelete修改其状态
            const rabbitEvent = 'smart-meeting.use.end';
            const resultRabbitMqData = await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                .innerJoin(SmartMeetingBooking,'meeting','consumer.businessId = meeting.id')
                .select('consumer.id','consumerId')
                .where ('consumer.businessId =:bookingId',{ bookingId })
                .andWhere('consumer.event =:rabbitEvent',{ rabbitEvent })
                .getRawMany();
            const consumerList = [];
            let consumerId = '';
            for (let i=0;i<resultRabbitMqData.length;i++){
                consumerList.push(resultRabbitMqData[i]['consumerId']);
                for (let j = 0;j<consumerList.length;j++){
                    consumerId = consumerList[0];
                }
            }

            //查询当前会议状态
            if(alreadyBookingData.state==2){
                //创建事务-->结束会议
                await this.conn.transaction(async m=>{
                    await m
                        .getRepository(SmartMeetingBooking)
                        .update({
                            id:bookingId
                        },{
                            state:3,
                            releaseType:1,
                            useEndTime:nowStrEndTime,
                            updateTime: nowStrEndTime
                        });

                    //修改MQ状态
                    if(resultRabbitMqData.length > 0){
                        await this.conn.getRepository(MqConsumersEntity).createQueryBuilder('consumer')
                            .update()
                            .set( { isDelete: 1 } )
                            .where ('id =:consumerId',{ consumerId })
                            .execute();
                    }else {
                        return Promise.reject('not find Data');
                    }
                    //时间延迟
                    const ttl = moment(endTime).diff(moment()) - 60000;
                    //结束后关闭物联设备，先查询当前会议有哪些设备
                    const resultequipmentData = [];
                    const booking = await this.conn.getRepository(SmartMeetingBooking).findOne(extendMeetingDto.bookingId);
                    const ctypes = await this.conn.getRepository(SmartMeetingEquipmentEntity)
                        .createQueryBuilder('sc')
                        .select('(select id from mg_custom_types where code=sc.ctype_code)', 'ctypeId')
                        .where('booking_id=:bookingId', { bookingId: booking.id })
                        .getRawMany<{ ctypeId: number }>();
                    const ctypeIds = ctypes.map(item => item.ctypeId).join(',');

                    const equipmentData = ctypeIds ? await this.conn.getRepository(MgEquipmentEntity).createQueryBuilder()
                        .where('space_id=:spaceId', { spaceId: booking.spaceId })
                        .andWhere(`ctype_id in (${ctypeIds})`)
                        .getMany() : [];
                    if (equipmentData.length>0){
                        for (let i = 0;i<equipmentData.length;i++){
                            resultequipmentData.push(equipmentData[i]['name']+'-'+equipmentData[i]['code']);
                            if (equipmentData[i]['name']=='空调'){
                                const devID = equipmentData[i]['code'];
                                //关空调
                                await this.client.send({ cmd: 'wism_dms.wulian.close.airconditioning' }, _.defaults({
                                    spaceId: booking.spaceId,
                                    devID:devID,
                                }, )).toPromise();
                            }
                            if(equipmentData[i]['name']=='三路开关'){
                                const devID = equipmentData[i]['code'];
                                //关三路开关
                                await this.client.send({ cmd: 'wism_dms.wulian.close.switches' }, _.defaults({
                                    spaceId: booking.spaceId,
                                    endpointNumber:4,
                                    devID:devID
                                }, )).toPromise();
                            }
                        }
                    }else{
                        return 'equipmentData is null';
                    }
                });
            }else {
                return Promise.reject('当前会议未开始!');
            }
        }catch (e) {
            this.logger.error(e);
            return Promise.reject(e);
        }
        return 'meeting end success';
    }

    /**
     * 上传会议室图片
     * @param files   文件
     * @param spaceId  会议室Id
     * @param avatarPath  图片路径
     */
    public async uploadFileMeeting(files, spaceId: number, avatarPath: string):Promise<void>{
        const destPath = this.configService.get('MEETING_FILE_UPLOAD_PATH');
        //图片上传目标路径
        for (let file of files) {
            let destFullPath = '';
            let originalFileName = uuidv4() + '.jpg';
            let destFullPathOne = path.join(destPath,originalFileName);
            destFullPath = destFullPathOne;
            await FileUtil.uploadOneFile(destFullPath,file.buffer,destPath);
            await this.updateMeetingBySpaceId(spaceId,destFullPathOne);
        }
    }

    /**
     *  读取会议室照片
     */
    public async readMeetingPicture(spaceId: number):Promise<fs.ReadStream>{
        const destPath = this.configService.get('MEETING_FILE_UPLOAD_PATH');
        //图片上传目标路径
        const meetingPictureVo = await this.findMeetingAvatarPathById(spaceId);
        let avatarPath =  path.join(meetingPictureVo.avatarPath);
        return await FileUtil.exists(avatarPath) ? fs.createReadStream(avatarPath) : Promise.reject('no picture');
    }

    /**
     * 查询会议室图片路径
     * @param spaceId
     */
    public async findMeetingAvatarPathById(spaceId: number): Promise<meetingPictureVo> {
        return await this.conn.getRepository(MgSpaceEntity).createQueryBuilder()
            .select('attr2', 'avatarPath')
            .where('is_delete=0')
            .andWhere('id=:spaceId',{ spaceId })
            .getRawOne<meetingPictureVo>();
    }

    /**
     * 会议室上传路径存入数据库
     * @param spaceId
     * @param avatarPath
     */
    public async updateMeetingBySpaceId(spaceId: number, avatarPath: string): Promise<UpdateResult> {
        return await this.conn.getRepository(MgSpaceEntity).update({
            id: spaceId,
            isDelete: 0
        },{
            attr2: avatarPath
        });
    }

    /**
     * 身份方式-->密码验证
     * @param userId  用户Id
     * @param password 用户输入密码
     * @param spaceId 会议室Id
     */
    public async verificationPasswordByUserId(userId: string, password: string, spaceId: number, operationType: number):Promise<string>{
        if(!userId||!password||!spaceId){
            return Promise.reject('parameter is null');
        }else {
            //前端传入密码转换
            const pwd = password;
            //初始化MD5模块
            const md5 = crypto.createHash('md5');
            //将传过来的密码进行转换操作
            const userLoginPassWord = md5.update(pwd).digest('hex');
            //查询用户密码
            const email = userId;
            const userPassWord = await this.conn.getRepository(StaffEntity).createQueryBuilder('staff')
                .select('staff.st_id','userId')
                .addSelect('staff.third_party_id','thirdPartyId')
                .addSelect('staff.password','password')
                .where('staff.email =:email',{ email })
                .getRawOne();
            if(userLoginPassWord === userPassWord.password){

             //查询会议室的code
             const resultSpaceCode = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
                 .select('space.code','spaceCode')
                 .where('space.id =:spaceId',{spaceId})
                 .getRawOne();
             //进入签到操作
             if(operationType === 1){
                 //认证成功之后调用签到接口
                 await this.checkinService.checkin({
                     spaceCode:resultSpaceCode.spaceCode,
                     code:null,
                     userId:userPassWord.thirdPartyId,
                 });
                 return 'checkIn success';
             }else if (operationType === 2){
                 //认证通过后其他操作
                 return 'operation success';
             }
                 return 'userLoginPassWord success';
            }else {
                 return 'verificationPassword fail';
            }
        }
    }

    /**
     * 身份方式-->密码验证-->返回userId
     * @param userId  用户Id
     * @param password 用户输入密码
     * @param spaceId 会议室Id
     */
    public async verificationPasswordFindUserId(userId: string, password: string, spaceId: number, operationType: number):Promise<string>{
        if(!userId||!password||!spaceId){
            return Promise.reject('parameter is null');
        }else {
            //前端传入密码转换
            const pwd = password;
            //初始化MD5模块
            const md5 = crypto.createHash('md5');
            //将传过来的密码进行转换操作
            const userLoginPassWord = md5.update(pwd).digest('hex');
            //查询用户密码
            const email = userId;
            const userPassWord = await this.conn.getRepository(StaffEntity).createQueryBuilder('staff')
                .select('staff.st_id','userId')
                .addSelect('staff.third_party_id','thirdPartyId')
                .addSelect('staff.password','password')
                .where('staff.email =:email',{ email })
                .getRawOne();
            if(userLoginPassWord === userPassWord.password){
                return userPassWord.userId;
            }else {
                return 'verificationPassword fail';
            }
        }
    }

    /**
     * 身份方式-->人脸识别认证
     * @param images 传入的图片
     */
    public async verificationFaceComparison(imageBase64: string, spaceId: number, operationType: number):Promise<string>{
        if (imageBase64!=null){
            let base64Images = null;
            base64Images = imageBase64;
            //远程调用wism_dms人脸识别接口
            const userId = await this.compareFaceFindUserId(base64Images);
            if (userId!=null){
                //认证成功之后调用签到接口
                if(Number(operationType) === 1){
                    //查询第三方id
                    const userInfo = await this.conn.getRepository(StaffEntity).createQueryBuilder('staff')
                        .select('staff.st_id','userId')
                        .addSelect('staff.third_party_id','thirdPartyId')
                        .addSelect('staff.password','password')
                        .where('staff.st_id =:userId',{ userId })
                        .getRawOne();

                    //查询会议室的code
                    const resultSpaceCode = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
                        .select('space.code','spaceCode')
                        .where('space.id =:spaceId',{spaceId})
                        .getRawOne();

                    //进行签到操作
                    await this.checkinService.checkin({
                        spaceCode:resultSpaceCode.spaceCode,
                        code:null,
                        userId:userInfo.thirdPartyId,
                    });
                    return 'checkIn success';
                }else if (Number(operationType) === 2){
                    //认证通过后其他操作
                    return 'operation success';
                }
            }else{
                return 'find user is null';
            }
        }else{
            return 'images is null';
        }
        return 'face verification success';
    }

    /**
     * 身份方式-->人脸识别认证-->获取userId
     * @param images 传入的图片
     */
    public async verificationFaceComparisonFindUserId(imageBase64: string, spaceId: number, operationType: number):Promise<string>{
        if (imageBase64!=null){
            let base64Images = null;
            base64Images = imageBase64;
            //远程调用wism_dms人脸识别接口
            const userId = await this.compareFaceFindUserId(base64Images);
            if (userId!=null){
                return userId.toString();
            }
            else{
                return 'find user is null';
            }
        }else{
            return 'images is null';
        }
        return 'face verification success';
    }

    /**
     * 二维码跳转接口
     * @param spaceCode
     * @param res
     */
    public async turnToQrCodeUrl(spaceCode: string, res: any){
        const url = await this.client.send({ cmd: 'wism_dms.pad.findQrCodeUrl3' }, {
            spaceCode,
        }).toPromise();
        return new Redirect(url, res);
    }

    //扫描二维码之后进行用户查询操作-->获取userId
    public async verificationQrCodeFindUserId(checkInDto: CheckinDto):Promise<string>{
        let userId;
        let spaceCode = checkInDto.spaceCode;
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

        if(!userId){
            return Promise.reject('userInfo get failed!');
        }else{
            const { stId, stName, stPart } = await this.userService.findUserByThirdPartyId(userId) || {};
            if (!stId){
                return Promise.reject('no this user!');
            }else {
                //认证成功之后查询用户userId,返回userId
                return stId.toString();
            }
        }
    }

    //扫描二维码之后进行用户查询操作
    public async verificationQrCode(checkInDto: CheckinDto):Promise<string>{
        let userId;
        let spaceCode = checkInDto.spaceCode;
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

        if(!userId){
            return Promise.reject('userInfo get failed!');
        }else{
            const { stId, stName, stPart } = await this.userService.findUserByThirdPartyId(userId) || {};
            if (!stId){
                return Promise.reject('no this user!');
            }else {
                //认证成功之后调用签到接口
                //查询第三方id
                const userInfo = await this.conn.getRepository(StaffEntity).createQueryBuilder('staff')
                    .select('staff.st_id', 'userId')
                    .addSelect('staff.third_party_id', 'thirdPartyId')
                    .addSelect('staff.password', 'password')
                    .where('staff.st_id =:stId', { stId })
                    .getRawOne();

                //查询会议室的code
                const resultSpaceCode = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
                    .select('space.code', 'spaceCode')
                    .where('space.code =:spaceCode', {spaceCode})
                    .getRawOne();

                //进行签到操作
                await this.checkinService.checkin({
                    spaceCode: resultSpaceCode.spaceCode,
                    code: null,
                    userId: userInfo.thirdPartyId,
                });
                return 'checkIn success';
            }
        }
    }

    /**
     * 远程调用wism_dms人脸识别接口
     * @param base64Images
     */
    public async compareFaceFindUserId(base64Images:string):Promise<number>{
        const userId = await this.client.send({
            cmd: 'wism_dms.compareface.finduserid'
        }, {
            images: base64Images,
        }).toPromise();
        /*const staff = await this.conn.getRepository(StaffEntity).findOne(userId);
        console.log(staff.stName);*/
        return userId;
    }

    /**
     *
     * @param spaceCode  会议室名称
     * @param equipmentCode 设备名称
     * @param equipmentNumber  三路开关节点   开关节点号  1,2,3, 4 = 全部节点
     * @param type             开/关  1/0
     * @param mode             空调模式   0制热 1制冷 2通风
     * @param windPower        空调风力   0关闭 1低风 2中风 3高风 4自动
     * @param coldWindTemperature  空调冷风温度   范围 >=10 <=32
     * @param hotAirTemperature    空调热风温度   范围 >=10 <=32
     */
    public async unionEquipmentByCode(spaceCode: string, equipmentCode: string, equipmentNumber: number, type: number, mode: string, windPower: string, Temperature:String,coldWindTemperature: string, hotAirTemperature: string):Promise<string>{
        let resultState;
        if(type == 1){
            switch (equipmentCode) {
                //打开三路开关
                case 'threeway-switch': resultState = await this.openThreeWaySwitchesBySpaceCode(spaceCode, equipmentCode, equipmentNumber);
                    break;
                //打开空调
                case 'air-conditioning':
                    if(mode == "0"){
                        Temperature = coldWindTemperature
                        resultState = await this.openAirConditionBySpaceCode(spaceCode, equipmentCode, mode, windPower, coldWindTemperature, hotAirTemperature);
                    }else if (mode == "1"){
                        Temperature = hotAirTemperature
                        resultState = await this.openAirConditionBySpaceCode(spaceCode, equipmentCode, mode, windPower, coldWindTemperature, hotAirTemperature);
                    }
                    break;
            }
        }else if (type == 0){
            switch (equipmentCode) {
                //关闭三路开关
                case 'threeway-switch': resultState = await this.closeThreeWaySwitchesBySpaceCode(spaceCode, equipmentCode, equipmentNumber);
                    break;
                //关闭空调
                case 'air-conditioning':resultState = await this.closeAirConditionBySpaceCode(spaceCode,equipmentCode);
                    break;
            }
        }
        return resultState;
    }

    /**
     * 三路开关-->开启
     * @param spaceCode  会议室Id
     * @param equipmentCode  开关节点号  1,2,3, 4 = 全部节点
     */
    public async openThreeWaySwitchesBySpaceCode(spaceCode: string, equipmentCode: string, equipmentNumber: number):Promise<string>{
        //通过spaceCode查询会议室设备
        const requestEquipment = await this.conn.getRepository(MgEquipmentEntity).createQueryBuilder('equipment')
            .innerJoin(MgSpaceEntity,'space','equipment.space_id = space.id')
            .innerJoin(MgCustomTypes,'custom','equipment.name = custom.name')
            .select('equipment.code','equipmentCode')
            .addSelect('custom.code','customCode')
            .where('space.code =:spaceCode',{ spaceCode })
            .andWhere('custom.code =:equipmentCode',{ equipmentCode })
            .getRawMany();
        if(requestEquipment.length === 0){
            return Promise.reject('Equipment is null');
        }else{
            const devId = [];
            for (let i = 0;i<requestEquipment.length;i++){
                devId.push(requestEquipment[i]['equipmentCode'])
            }
            //发送wim_dms开启-->三路开关请求
            await this.client.send({
                cmd: 'wism_dms.wulian.open.switches'
            }, {
                spaceId: String(spaceCode),
                endpointNumber: 4,
                devID: devId.toString()
            }).toPromise();
            return 'open ThreeWaySwitches success';
        }
    }

    /**
     * 三路开关--关闭
     * @param spaceCode  会议室Id
     * @param equipmentCode  开关节点号  1,2,3
     */
    public async closeThreeWaySwitchesBySpaceCode(spaceCode: string, equipmentCode: string, equipmentNumber: number):Promise<string>{
        //console.log('三路开关--->开启'+spaceCode+'\t'+'equipmentCode'+'\t'+equipmentNumber);
        //通过spaceCode查询会议室设备
        const requestEquipment = await this.conn.getRepository(MgEquipmentEntity).createQueryBuilder('equipment')
            .innerJoin(MgSpaceEntity,'space','equipment.space_id = space.id')
            .innerJoin(MgCustomTypes,'custom','equipment.name = custom.name')
            .select('equipment.code','equipmentCode')
            .addSelect('custom.code','customCode')
            .where('space.code =:spaceCode',{ spaceCode })
            .andWhere('custom.code =:equipmentCode',{ equipmentCode })
            .getRawMany();
        if(requestEquipment.length === 0){
            return Promise.reject('Equipment is null');
        }else{
            const devId = [];
            for (let i = 0;i<requestEquipment.length;i++){
                devId.push(requestEquipment[i]['equipmentCode'])
            }
            //发送wim_dms关闭-->三路开关请求
            await this.client.send({
                cmd: 'wism_dms.wulian.close.switches'
            }, {
                spaceId: String(spaceCode),
                endpointNumber: 4,
                devID: devId.toString()
            }).toPromise();
            return 'close ThreeWaySwitches success';
        }
    }

    /**
     * 空调--打开
     * @param spaceCode 会议室名称
     * @param equipmentCode 开关名称
     * @param mode          空调模式   0制热 1制冷 2通风
     * @param windPower     空调风力   0关闭 1低风 2中风 3高风 4自动
     * @param coldWindTemperature 空调冷风温度   范围 >=10 <=32
     * @param hotAirTemperature   空调热风温度   范围 >=10 <=32
     */
    public async openAirConditionBySpaceCode(spaceCode: string, equipmentCode: string, mode: string, windPower: string, coldWindTemperature: string, hotAirTemperature: string):Promise<string>{
        //通过spaceCode查询会议室设备
        const requestEquipment = await this.conn.getRepository(MgEquipmentEntity).createQueryBuilder('equipment')
            .innerJoin(MgSpaceEntity,'space','equipment.space_id = space.id')
            .innerJoin(MgCustomTypes,'custom','equipment.name = custom.name')
            .select('equipment.code','equipmentCode')
            .addSelect('custom.code','customCode')
            .where('space.code =:spaceCode',{ spaceCode })
            .andWhere('custom.code =:equipmentCode',{ equipmentCode })
            .getRawMany();
        if(requestEquipment.length === 0){
            return Promise.reject('Equipment is null');
        }else{
            const devId = [];
            for (let i = 0;i<requestEquipment.length;i++){
                devId.push(requestEquipment[i]['equipmentCode'])
            }
            //发送wim_dms关闭-->三路开关请求
            await this.client.send({
                cmd: 'wism_dms.wulian.open.airconditioning'
            }, {
                spaceId: String(spaceCode),
                devID: devId.toString()
            }).toPromise();
            //控制空调模式
            if(mode!=null){
                await this.client.send({
                    cmd: 'wism_dms.wulian.set.airconditioning.mode'
                }, {
                    spaceId: String(spaceCode),
                    mode:mode,
                    devID: devId.toString()
                }).toPromise();
            }
            //控制空调风力
            if(windPower!=null){
                await this.client.send({
                    cmd: 'wism_dms.wulian.set.airwindstength'
                }, {
                    spaceId: String(spaceCode),
                    strength:windPower,
                    devID: devId.toString()
                }).toPromise();
            }
            //控制控制冷风温度
            if(coldWindTemperature!=null){
                await this.client.send({
                    cmd: 'wism_dms.wulian.set.airconditioncoldtemperature'
                }, {
                    spaceId: String(spaceCode),
                    temperature:coldWindTemperature,
                    devID: devId.toString()
                }).toPromise();
            }
            //控制控制热风温度
            if(hotAirTemperature!=null){
                await this.client.send({
                    cmd: 'wism_dms.wulian.set.airconditonWarmtemperature'
                }, {
                    spaceId: String(spaceCode),
                    temperature:hotAirTemperature,
                    devID: devId.toString()
                }).toPromise();
            }
            return 'open AirCondition success';
        }
    }

    /**
     * 空调--关闭
     * @param spaceCode
     * @param equipmentCode
     */
    public async closeAirConditionBySpaceCode(spaceCode: string, equipmentCode: string):Promise<string>{
        //通过spaceCode查询会议室设备
        const requestEquipment = await this.conn.getRepository(MgEquipmentEntity).createQueryBuilder('equipment')
            .innerJoin(MgSpaceEntity,'space','equipment.space_id = space.id')
            .innerJoin(MgCustomTypes,'custom','equipment.name = custom.name')
            .select('equipment.code','equipmentCode')
            .addSelect('custom.code','customCode')
            .where('space.code =:spaceCode',{ spaceCode })
            .andWhere('custom.code =:equipmentCode',{ equipmentCode })
            .getRawMany();
        if(requestEquipment.length === 0){
            return Promise.reject('Equipment is null');
        }else{
            const devId = [];
            for (let i = 0;i<requestEquipment.length;i++){
                devId.push(requestEquipment[i]['equipmentCode'])
            }
            //发送wim_dms关闭-->三路开关请求
            await this.client.send({
                cmd: 'wism_dms.wulian.close.airconditioning'
            }, {
                spaceId: String(spaceCode),
                devID: devId.toString()
            }).toPromise();
            return 'close AirCondition success';
        }
    }

    /**
     * 清洁通知
     * @param cleanTime 时间
     * @param date 通知时间范围  0 今天 1 明天
     */
    public async cleanNoticeByCleanTime(cleanTime: string, date: number, explain: string):Promise<string>{
        if (!cleanTime||!date){
            return Promise.reject('parameter is null');
        }else{
            //查找清洁人员
            const resultData = await this.conn.getRepository(MgRoleEntity).createQueryBuilder('role')
                .innerJoin(MgStaffRoleEntity,'staff_role','role.id = staff_role.role_id')
                .innerJoin(StaffEntity,'staff','staff_role.user_id = staff.st_id')
                .select('staff.email','email')
                .addSelect('staff.phone','phone')
                .where('role.id = 3')
                .getRawOne();
            const comment = explain;
            if (!resultData){
                return Promise.reject('Cleaner is null');
            }else{
                if (resultData.email!=null){
                    const timeSlot = cleanTime;
                    let dateTime = null;
                    switch (date) {
                        case 0:dateTime = '今天:';
                        break;
                        case 1:dateTime = '明天:';
                        break;
                    }
                    await this.client.send({
                        cmd: 'wism_sms.sendMail'
                    }, {
                        to: resultData.email,
                        subject: '智能会议预定',
                        //text:'用户Jack您好,',
                        html:`<span>你好,请在${dateTime}${timeSlot}期间打扫会议室。</span><br><span>补充说明:${comment}</span>`,
                    }).toPromise();
                }
                if (resultData.phone!=null){
                    let dateTime = null;
                    switch (date) {
                        case 0:dateTime = '今天:';
                            break;
                        case 1:dateTime = '明天:';
                            break;
                    }
                    const timeSlot = cleanTime;
                    const messages = dateTime+timeSlot;
                    await this.client.send({
                        cmd: 'wism_sms.sendVerifyCode'
                    }, {
                        phoneNumber: resultData.phone,
                        code: messages,
                    }).toPromise();
                }
                return 'clean notice success';
            }
        }
    }

    private async getSettingTime(code: string): Promise<number> {
        const mgProfileEntity = await this.profileService.getProfile(code);
        if (!mgProfileEntity.value1) {
            return Promise.reject(`${code} Not Exist!`);
        }
        return Number(mgProfileEntity.value1);
    }

    async getTopContacts(userId: number){
        let result = await this.redisClient.zrevrange('smart_meeting:booking:top_contacts:' + String(userId),0,-1,false);
        result = result.map((v,k)=>{
            return JSON.parse(v);
        });
        return result;
    }

    async getOutContacts(userId: number){
        let result = await this.redisClient.zrevrange('smart_meeting:booking:out_contacts:' + String(userId),0,-1,false);
        result = result.map((v,k)=>{
            return JSON.parse(v);
        });
        return result;
    }
}