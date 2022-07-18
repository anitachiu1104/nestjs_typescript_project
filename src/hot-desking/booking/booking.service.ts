import { Body, Inject, Injectable, Logger, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as moment from 'moment';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { MyLogger } from '../../core/my-logger/my-logger';
import { PageResultInterface } from "../../core/page/page-result.interface";
import { PageHelper } from "../../core/page/page.helper";
import { RedisClient } from '../../core/redis/redis.client';
import { MgEquipmentEntity } from '../../model/mg-equipment.entity';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import { StaffEntity } from '../../model/staff.entity';
import { SysAreaEntity } from '../../model/sys-area.entity';
import { SysBuildEntity } from '../../model/sys-build.entity';
import { SysFloorEntity } from '../../model/sys-floor.entity';
import { ProfileService } from '../../profile/profile.service';
import { dateFormat } from '../common/const';
import { DeviceService } from '../device/device.service';
import { UseEndHandleInterface } from '../message/interface/use-end-handle.interface';
import { UseEndHandler } from '../message/use-end.handler';
import { SendDelayService } from '../send/send-delay.service';
import { HotDeskingBooking } from './../../model/hot-desking-booking.entity';
import { BookingDto } from './dto/booking.dto';
import { FloorBookingDto } from './dto/floor-booking.dto';
import { MyBookingDto } from './dto/my-booking.dto';
import { MyhistoryBookingDto } from './dto/my-historybooking.dto';
import { StationQueryDto } from './dto/station-query.dto';
import { MgspaceVo } from './vo/mgspace.vo';
import { MgStaffVo } from './vo/mgstaff.vo';
import { MybookingVo } from './vo/mybooking.vo';
import { StationVo } from './vo/station.vo';

@Injectable()
export class BookingService {
    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private readonly redisClient: RedisClient;
    @Inject()
    private readonly sendService: SendDelayService;
    @Inject()
    private readonly client: ClientProxy;
    @Inject()
    private readonly deviceService: DeviceService;
    @Inject()
    private readonly logger: MyLogger;
    @Inject()
    private readonly profileService: ProfileService;

    async lock(spaceId: number): Promise<void> {
        const lock = await this.redisClient.setNx(`hot-desking:booking:save:${spaceId}`, 'running');
        if (lock !== 'OK') {
            return Promise.reject('工位锁定中，请刷新重试!');
        }
    }

    async unlock(spaceId: number): Promise<void> {
        await this.redisClient.del(`hot-desking:booking:save:${spaceId}`);
    }

    checkBookRequest(startTime: string, endTime: string) {
        const startMoment = moment(startTime);
        const endMoment = moment(endTime)
        const ms = endMoment.diff(startMoment);

        if (startMoment.diff(moment()) < 0) {
            throw new Error('预约起始时间已过，请刷新页面!');
        }

        if (ms <= 0 || ms > 30 * 24 * 3600 * 1000) {
            throw new Error('预约时段不能跨天!');
        }
    }

    createBookingQuery(bookingDto: BookingDto): SelectQueryBuilder<HotDeskingBooking>[] {
        const { startTime, endTime }  = bookingDto;
        let { buId, flId, spaceId } = bookingDto;
        buId = Number(buId);
        flId = Number(flId);
        spaceId = Number(spaceId);

        return [this.conn
            .getRepository(HotDeskingBooking)
            .createQueryBuilder()
            .where('start_time>=:todayStart', { todayStart: moment().format('YYYY-MM-DD 00:00:00') })
            .andWhere('(start_time<:et and end_time>:st)', {
                    st: startTime,
                    et: endTime
                })
            .andWhere('building_id=:buId', { buId })
            .andWhere('floor_id=:flId', { flId })
            .andWhere('space_id=:spaceId', { spaceId })
            .andWhere('state=1')
        ];
    }

    async extendBooking(bookingDto: BookingDto): Promise<string> {
        const nowMoment = moment();
        const nowStr = nowMoment.format(dateFormat);
        const {
            id,
            spaceId,
            startTime,
            endTime,
        } = bookingDto;

        try {
            const startMoment = moment(startTime);
            const endMoment = moment(endTime)
            const ms = endMoment.diff(startMoment);
            if (ms <= 0 || ms > 30 * 24 * 3600 * 1000) {
                throw new Error('预约时段不能跨天!');
            }
            await this.lock(spaceId);
            const oldBooking = await this.conn.getRepository(HotDeskingBooking).findOne(id);

            if (nowMoment.diff(moment(oldBooking.endTime)) >= 0) {
                return Promise.reject('预约已结束，请重新预约!');
            }

            let buliderArr = this.createBookingQuery(bookingDto);
            for (let bulider of buliderArr){
                let bookedRecord = await bulider
                    .andWhere('id!=:id', { id })
                    .getOne();

                if (bookedRecord) {
                    return Promise.reject('工位已被预约，延长时间失败!');
                }
            }


            await this.conn.transaction(async m => {
                await m
                    .getRepository(HotDeskingBooking)
                    .update({
                        id
                    }, {
                        endTime,
                        updateTime: nowStr
                    });

                await this.sendService.doWhenUseEnd({
                    data: { bookingId: id, updateTime: nowStr },
                    ttl: moment(endTime).diff(moment()) - await this.getSettingTime('hotdesking_useend_ms')
                });

                const space = await m.getRepository(MgSpaceEntity).findOne(spaceId);
                const user  = await m.getRepository(StaffEntity).findOne(bookingDto.userId);

                await this.sendService.doWhenUseEndBefore({
                    data: {
                        bookingId: id,
                        startTime,
                        endTime,
                        updateTime: nowStr,
                        spaceCode: space.code,
                        thirdPartyId: user.thirdPartyId,
                    },
                    ttl: moment(endTime).diff(moment()) - await this.getSettingTime('hotdesking_useend_before_ms')
                });
                await this.deviceService.pushScreen(space.code, user.stName, user.stPart, startTime, endTime);
            });
            return 'success';
        } catch (e) {
            return Promise.reject(e);
        } finally {
            this.unlock(spaceId).then().catch(e => {
                this.logger.error(e);
            });
        }
    }

    private async getSettingTime(code: string): Promise<number> {
        const mgProfileEntity = await this.profileService.getProfile(code);
        if (!mgProfileEntity.value1) {
            return Promise.reject(`${code} Not Exist!`);
        }
        return Number(mgProfileEntity.value1);
    }

    /**
     *  批量添加全天预约记录
     *  @param spaceId          工位Id
     *  @param bookingDtoList   预约信息数组
     */
    async saveBatchBooking(spaceId: number,bookingDtoList: BookingDto[]): Promise<void> {
        //创建当前时间
        const nowMoment = moment();
        const nowStr = nowMoment.format(dateFormat);
        try {
            await this.conn.transaction(async m => {
                //事务锁
                await this.lock(spaceId);
                for (let bookingDto of bookingDtoList) {
                    const {
                        id,
                        buId,
                        flId,
                        areaId,
                        spaceId,
                        userId,
                        startTime,
                        endTime,
                        userName,
                        user2Id,
                    } = bookingDto;
                    this.checkBookRequest(startTime, endTime);
                    if (nowMoment.diff(startTime) > 0) {
                        return Promise.reject('预约起始时间已过，请刷新页面!');
                    }
                    let buliderArr = this.createBookingQuery(bookingDto);
                    for (let bulider of buliderArr){
                        const bookedRecord = await bulider.getOne();
                        if (bookedRecord) {
                            return Promise.reject('工位已被预定, 请刷新重试!');
                        }
                    }
                    //添加预约记录操作
                    const newBooking = await m
                        .getRepository(HotDeskingBooking)
                        .save({
                            buildingId: buId,
                            floorId: flId,
                            areaId,
                            spaceId,
                            createTime: nowStr,
                            updateTime: nowStr,
                            createBy: userName,
                            userId,
                            state: 1,
                            type: 2,
                            startTime,
                            endTime,
                            user2Id: user2Id || userId
                        });
                    //推送企业信息预定消息
                    await this.sendService.doWhenCheckinBefore({
                        data: { bookingId: String(newBooking.id), updateTime: nowStr, startTime, endTime, userId, spaceId },
                        ttl: moment(startTime).diff(nowMoment) - await this.getSettingTime('hotdesking_checkin_before_ms')
                    });
                    //推送企业信息预定即将到期消息
                    await this.sendService.doWhenCheckinTimeout({
                        data: { bookingId: newBooking.id, updateTime: nowStr },
                        ttl: moment(startTime).diff(moment()) + await this.getSettingTime('hotdesking_checkin_timeout_ms')
                    });

                }
            });
        } catch (e) {
            return Promise.reject(e)
        } finally {
            this.unlock(spaceId).then().catch(e => {
                this.logger.error(e);
            });
        }
    }

    async saveOrUpdateBooking(bookingDto: BookingDto): Promise<string> {
        const nowMoment = moment();
        const nowStr = nowMoment.format(dateFormat);
        const {
            id,
            buId,
            flId,
            areaId,
            spaceId,
            userId,
            startTime,
            endTime,
            userName,
            user2Id,
        } = bookingDto;

        try {
            this.checkBookRequest(startTime, endTime);
            //检查是否可以编辑
            if (id) {
                const oldBooking = await this.conn.getRepository(HotDeskingBooking).findOne(Number(id));
                if ((moment(oldBooking.startTime).valueOf() - moment().valueOf()) < await this.getSettingTime('hotdesking_edit_before_ms')) {
                    return Promise.reject('编辑时间已过，不可编辑!');
                }
            }
            await this.lock(spaceId);

            if (nowMoment.diff(startTime) > 0) {
                return Promise.reject('预约起始时间已过，请刷新页面!');
            }
            let buliderArr = this.createBookingQuery(bookingDto);
            for (let bookedQueryBuilder of buliderArr){

                if (id) {
                    bookedQueryBuilder.andWhere('id!=:id', { id });
                }

                const bookedRecord = await bookedQueryBuilder.getOne();

                if (bookedRecord) {
                    return Promise.reject('工位已被预定, 请刷新重试!');
                }
            }


            await this.conn.transaction(async m => {
                let newBooking;
                if (!id) {
                    newBooking = await m
                        .getRepository(HotDeskingBooking)
                        .save({
                            buildingId: buId,
                            floorId: flId,
                            areaId,
                            spaceId,
                            createTime: nowStr,
                            updateTime: nowStr,
                            createBy: userName,
                            userId,
                            state: 1,
                            startTime,
                            endTime,
                            user2Id: user2Id || userId
                        });
                } else {
                     await m
                        .getRepository(HotDeskingBooking)
                        .update({
                            id
                        }, {
                            startTime,
                            endTime,
                            updateTime: nowStr
                        })
                }
                const bookingId = id ? id : newBooking.id;

                await this.sendService.doWhenCheckinBefore({
                    data: { bookingId, updateTime: nowStr, startTime, endTime, userId, spaceId },
                    ttl: moment(startTime).diff(nowMoment) - await this.getSettingTime('hotdesking_checkin_before_ms')
                });
                await this.sendService.doWhenCheckinTimeout({
                    data: { bookingId, updateTime: nowStr },
                    ttl: moment(startTime).diff(moment()) + await this.getSettingTime('hotdesking_checkin_timeout_ms')
                });
            });
            return 'success';
        } catch (e) {
            return Promise.reject(e);
        } finally {
            this.unlock(spaceId).then().catch(e => {
                this.logger.error(e);
            });
        }
    }

    async findWorkStations(stationQueryDto: StationQueryDto): Promise<StationVo[]> {
        const queryStationBuild = this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
            .innerJoin(SysFloorEntity, 'f', 'space.floor_id=f.fl_id')
            .select('space.id', 'spaceId')
            .addSelect('space.dimension_x', 'x')
            .addSelect('space.dimension_y', 'y')
            .addSelect(`concat(f.fl_name, '-' , space.code)`, 'positionName')
            .addSelect('space.width', 'width')
            .addSelect('space.length', 'length')
            .addSelect('space.degree', 'degree')
            .where('building_id=:buId', { buId: Number(stationQueryDto.buId) })
            .andWhere('floor_id=:flId', { flId: Number(stationQueryDto.flId) })
            .andWhere('space.category=1')
            .andWhere('space.category_second=2')
            .andWhere('space.is_delete=0');


        if (stationQueryDto.areaId) {
            queryStationBuild.andWhere('area_id=:areaId', { areaId: Number(stationQueryDto.areaId) });
        }
        return await queryStationBuild.getRawMany<StationVo>();
    }

    async findFloorBookings(@Body(new ValidationPipe()) floorBookingDto: FloorBookingDto) :Promise<BookingDto[]> {
        const { startTime, endTime, buId, flId } = floorBookingDto;

        const sql = `
        select 
                id,
                building_id as buildingId,
                floor_id as floorId,
                space_id as spaceId,
                start_time as startTime,
                end_time as endTime,
                user_id as userId,
                (select st_name from mg_staff where st_id=user_id) as userName,
                case state when 1 then '已预定' when 2 then '使用中' end as state
                from hot_desking_booking
                where 
                start_time>=?
                and start_time<? and end_time>?
                and building_id=?
                and floor_id=?
                and state in (1,2)
            `;

        const todayStart = moment().format('YYYY-MM-DD 00:00:00');
        const params = [todayStart, endTime,startTime, Number(buId), Number(flId),];
        const rs =  await this.conn.getRepository(HotDeskingBooking).query(`
            ${sql}
        `, [
            ...params
        ]);
        return rs;
    }

    public async findAllMyReservation(userId : number):Promise<MyBookingDto[]>{
        return await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('t')
            .innerJoin(SysFloorEntity, 's', 't.floor_id = s.fl_id ')
            .innerJoin(SysBuildEntity,'b','b.bu_id = t.building_id ')
            .innerJoin(MgSpaceEntity,'m','m.id = t.space_id')
            .innerJoin(StaffEntity,'st','t.user_id = st.st_id')
            .innerJoin(HotDeskingBooking,'h','t.id = h.id')
            .select('b.bu_name','buName')
            .addSelect('s.fl_name','flName')
            .addSelect('m.NAME','name')
            .addSelect('m.CODE','code')
            .addSelect('st.st_name','stName')
            .addSelect(`CASE WHEN t.type = 1 THEN '立即使用' WHEN t.type = 2 THEN '时段预约' WHEN t.type = 3 THEN '全天预约' END as type`)
            .addSelect('t.create_time','createTime')
            .addSelect('h.start_time','startTime')
            .addSelect('t.real_end_time','realEndTime')
            .addSelect(`CASE WHEN t.state = 1 THEN '已预定'  WHEN t.state = 2 THEN '使用中' END as state`)
            .where('t.is_delete = 0 and s.is_delete = 0 and b.is_delete = 0 and m.is_delete = 0 and st.is_delete = 0 and h.is_delete = 0' )
            .andWhere('h.user_id =:userId',{userId})
            .orderBy('t.create_time','ASC')
            .getRawMany<MyBookingDto>()
    }

    /**
     *  通过用户Id查询历史预约信息-默认全部
     */
    public async findUserByIdHistoryReservation(body:MyhistoryBookingDto):Promise<PageResultInterface<MybookingVo>>{
            const  { userId,buId,flId,areaId,type,type2,timeType,page } = body;
            const  queryBuilderHistoryData = this.conn.getRepository(HotDeskingBooking).createQueryBuilder('booking')
            queryBuilderHistoryData.innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
                .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
                .innerJoin(MgSpaceEntity,'space','space.id = booking.space_id')
                .leftJoin(SysAreaEntity,'area','area.id = space.area_id')
                .innerJoin(StaffEntity,'staff','staff.st_id = booking.user_id')
                .select('build.bu_name','buName')
                .addSelect('floor.fl_name','flName')
                .addSelect('area.name','areaName')
                .addSelect('space.code','code')
                .addSelect('staff.st_name','stName')
                .addSelect(`case when booking.type = 1 then '时段预约' when booking.type = 2 then '全天预约' end as type`)
                .addSelect('booking.start_time','startTime')
                .addSelect('booking.end_time','endTime')
                .addSelect('booking.create_time','createTime')
                .addSelect('booking.update_time','useEndTime')
                .addSelect(`case when booking.state = 4 then '已使用' when booking.state = 3 then '已取消' end as state`)
                .where('booking.user_id=:userId',{ userId: Number(userId) })
                .andWhere('booking.state in (3,4)')
            if(buId){
                queryBuilderHistoryData.andWhere('build.bu_id=:buId',{ buId: Number(buId) })
            }
            if(flId){
                queryBuilderHistoryData.andWhere('floor.fl_id=:flId',{ flId: Number(flId) })
            }
            if (areaId){
                queryBuilderHistoryData.andWhere('area.id=:areaId',{ areaId: Number(areaId) })
            }
            if(type2){
                queryBuilderHistoryData.andWhere('booking.type2=:type2',{ type2: Number(type2) })
            }
            if(type){
                queryBuilderHistoryData.andWhere('booking.type=:type',{ type: Number(type) })
            }
            //timeType = 1 一周
            if(timeType === 1){
                let startTime;
                let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',6).format('YYYY-MM-DD HH:mm:ss');
                if(startTime){
                    queryBuilderHistoryData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
                }
          }
          //timeType = 2 一个月
            if(timeType === 2){
            let startTime;
            let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',30).format('YYYY-MM-DD HH:mm:ss');
            if(startTime){
                queryBuilderHistoryData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
            }
         }
         //timeType = 3 三个月
            if(timeType === 3){
            let startTime;
            let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
                startTime = moment().subtract('days',60).format('YYYY-MM-DD HH:mm:ss');
            console.log(startTime);
            if(startTime){
                queryBuilderHistoryData.andWhere('booking.update_time>=:startTime and booking.update_time<:endTime', { startTime, endTime })
            }
         }
        const total = await queryBuilderHistoryData.getCount();
        const data = await queryBuilderHistoryData
            .orderBy('useEndTime','DESC')
            .limit(page.pageSize)
            .offset(PageHelper.getSkip(page))
            .getRawMany<MybookingVo>();
        return {
            total,
            data
        };
    }


    /**
     * 工位模糊检索查询
     * @param spaceCode  工位编号
     */
    public async findSpaceCodePosition(spaceCode: string):Promise<MgspaceVo[]>{
        if(!spaceCode){
            return Promise.reject('spaceCode is null');
        }else {
            const resultData = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
                .innerJoin(SysBuildEntity,'build','build.bu_id = space.building_id')
                .innerJoin(SysFloorEntity,'floor','floor.fl_id = space.floor_id')
                .leftJoin(SysAreaEntity,'area','area.id = space.area_id')
                .select('space.code','spaceCode')
                .addSelect('build.bu_id','buId')
                .addSelect('build.bu_name','buName')
                .addSelect('floor.fl_id','flId')
                .addSelect('floor.fl_name','flName')
                .addSelect('space.dimension_x','dimensionX')
                .addSelect('space.dimension_y','dimensionY')
                .addSelect('space.width','width')
                .addSelect('space.height','height')
                .addSelect('space.id','spaceId')
                .where('space.code like :spaceCode',{ spaceCode:'%'+spaceCode+'%' })
                .getRawMany<MgspaceVo>();
            return resultData;
        }
    }

    /**
     * 工位模糊精准匹配查询
     * @param spaceCode  工位编号
     */
    public async findCoordinateBySpaceCode(spaceCode: string):Promise<MgspaceVo[]>{
        if(!spaceCode){
            return Promise.reject('spaceCode is null');
        }else {
            const resultData = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder('space')
                .innerJoin(SysBuildEntity,'build','build.bu_id = space.building_id')
                .innerJoin(SysFloorEntity,'floor','floor.fl_id = space.floor_id')
                .leftJoin(SysAreaEntity,'area','area.id = space.area_id')
                .select('space.code','spaceCode')
                .addSelect('build.bu_id','buId')
                .addSelect('build.bu_name','buName')
                .addSelect('floor.fl_id','flId')
                .addSelect('floor.fl_name','flName')
                .addSelect('space.dimension_x','dimensionX')
                .addSelect('space.dimension_y','dimensionY')
                .addSelect('space.width','width')
                .addSelect('space.height','height')
                .addSelect('space.id','spaceId')
                .where('space.code =:spaceCode',{ spaceCode })
                .getRawMany<MgspaceVo>();
            return resultData;
        }
    }



    /**
     * 用户名模糊检索查询所在楼层和工位个数
     * @param userName   用户名称
     */
    public async findBookingByUserName(userName: string): Promise<MgStaffVo[]>{
       if(!userName){
           return Promise.reject('userName is null');
       }else {
           const startTime = moment().format('YYYY-MM-DD HH:mm:ss');
           const resultData = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('booking')
               .innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
               .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
               .innerJoin(StaffEntity,'staff','staff.st_id = booking.user_id')
               .select('build.bu_name','buName')
               .addSelect('floor.fl_name','flName')
               .addSelect('build.bu_id','buId')
               .addSelect('floor.fl_id','flId')
               .addSelect('COUNT(DISTINCT booking.space_id)','spaceNumber')
               .where('staff.st_name=:userName',{ userName })
               //.where('staff.st_name like :userName',{ userName:'%'+userName+'%' })
               .andWhere('end_time >:startTime',{startTime})
               .andWhere('booking.state in (1,2)')
               .groupBy('build.bu_name,floor.fl_name,build.bu_id,floor.fl_id')
               .getRawMany<MgStaffVo>();
               return resultData;
       }
    }

    /**
     * 模糊查询姓名
     * @param userName
     */
    public async findBookingUserName(userName: string):Promise<MgStaffVo[]>{
        if (!userName){
            return Promise.reject('userName is null');
        }else {
            const resultDataUserName = this.conn.getRepository(StaffEntity).createQueryBuilder()
                .select('st_name','userName')
                .where('st_name like :userName',{ userName:userName+'%' })
                .getRawMany<MgStaffVo>();
            return resultDataUserName;
        }
    }

    /**
     * 通过用户名查询所在工位的预约信息记录
     * @param userName
     */
    public async findBookingSpaceByUserName(userName: string, buId: string, flId: string):Promise<MgStaffVo[]>{
        if(!userName){
            return Promise.reject('userName is null');
        }
        const startTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const resultData = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('booking')
            .innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
            .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
            .innerJoin(StaffEntity,'staff','staff.st_id = booking.user_id')
            .innerJoin(MgSpaceEntity,'space','space.id = booking.space_id')
            .select('floor.fl_name','flName')
            .addSelect('booking.space_id','spaceId')
            .addSelect('space.code','spaceCode')
            .addSelect('space.dimension_x','dimensionX')
            .addSelect('space.dimension_y','dimensionY')
            .addSelect('space.width','width')
            .addSelect('space.height','height')
            .addSelect('staff.st_name','userName')
            .addSelect('start_time','startTime')
            .addSelect('end_time','endTime')
            //.where('staff.st_name=:userName',{ userName })
            .where('staff.st_name = :userName',{ userName: userName })
            .andWhere('booking.building_id=:buId',{ buId: Number(buId) })
            .andWhere('booking.floor_id=:flId',{ flId: Number(flId) })
            .andWhere('end_time >:startTime',{ startTime })
            .andWhere('booking.state in (1,2)')
            .getRawMany<MgStaffVo>();
        if(resultData.length === 0){
            return Promise.reject('bookingRecordData is null');
        }
        return resultData;
    }

    /**
     * 通过工位查询所预约信息记录
     * @param spaceCode
     * @param buId
     * @param flId
     */
    public async findBookingBySpace(spaceCode: string, buId: string, flId: string):Promise<MgStaffVo[]>{
        if(!spaceCode){
            return Promise.reject('spaceCode is null');
        }
        const startTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const resultData = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('booking')
            .innerJoin(SysBuildEntity,'build','build.bu_id = booking.building_id')
            .innerJoin(SysFloorEntity,'floor','floor.fl_id = booking.floor_id')
            .innerJoin(StaffEntity,'staff','staff.st_id = booking.user_id')
            .innerJoin(MgSpaceEntity,'space','space.id = booking.space_id')
            .select('floor.fl_name','flName')
            .addSelect('floor.fl_id','flId')
            .addSelect('build.bu_id','buId')
            .addSelect('build.bu_name','buName')
            .addSelect('booking.space_id','spaceId')
            .addSelect('booking.type','type')
            .addSelect('space.code','spaceCode')
            .addSelect('space.dimension_x','dimensionX')
            .addSelect('space.dimension_y','dimensionY')
            .addSelect('space.width','width')
            .addSelect('space.height','height')
            .addSelect('staff.st_name','userName')
            .addSelect('start_time','startTime')
            .addSelect('end_time','endTime')
            .where('space.code = :spaceCode',{ spaceCode })
            .andWhere('booking.building_id=:buId',{ buId: Number(buId) })
            .andWhere('booking.floor_id=:flId',{ flId: Number(flId) })
            .andWhere('end_time >:startTime',{ startTime })
            .andWhere('booking.state in (1,2)')
            .getRawMany<MgStaffVo>();
        if(resultData.length === 0){
            return resultData;
        }
        return resultData;
    }


    async findMyBooking(body:MyBookingDto) :Promise<PageResultInterface<MybookingVo>>{
        let {userId,buId,flId,areaId,timeType,type,type2,page} = body;
        let queryBuilder =  this.conn.getRepository(HotDeskingBooking).createQueryBuilder('book');
        queryBuilder.innerJoin(SysBuildEntity, 'building', 'building.bu_id = book.building_id')
        .innerJoin(SysFloorEntity, 'floor', 'floor.fl_id = book.floor_id')
        .leftJoin(SysAreaEntity, 'area', 'area.id = book.area_id')
        .innerJoin(MgSpaceEntity, 'space', 'space.id = book.space_id')
        .innerJoin(StaffEntity, 'staff', 'staff.st_id = book.user_id')
        .select('book.id','bookingId')
        .addSelect('building.bu_name','buName')
        .addSelect('book.building_id','buId')
        .addSelect('book.type','type')
        .addSelect('book.space_id','spaceId')
        .addSelect('book.floor_id','flId')
        .addSelect('floor.fl_name','flName')
        .addSelect('area.name','areaName')
        .addSelect('space.code','spaceCode')
        .addSelect('book.start_time','startTime')
        .addSelect('book.end_time','endTime')
        .addSelect('book.use_end_time','useEndTime')
        .addSelect('staff.st_name','stName')
        .addSelect('book.create_time','bookTime')
        .addSelect('book.state','state')
        .where('book.user_id=:userId', { userId })
            .andWhere('book.state in (1,2)');
        if(buId){
            queryBuilder.andWhere('book.building_id = :buId',{buId: Number(buId)})
        }
        if(flId){
            queryBuilder.andWhere('book.floor_id = :flId',{flId: Number(flId)})
        }
        if(areaId){
            queryBuilder.andWhere('book.area_id = :areaId',{areaId: Number(areaId)})
        }
        if(timeType){
            let startTime;
            let endTime = moment().format('YYYY-MM-DD HH:mm:ss');
            switch (timeType){
                case 1:{
                    break;
                }
                case 2:{
                    startTime =  moment().subtract('days', 6).format('YYYY-MM-DD HH:mm:ss');
                    break;
                }
                case 3:{
                    startTime =  moment().subtract('days', 30).format('YYYY-MM-DD HH:mm:ss');
                    break;
                }
                case 4:{
                    startTime =  moment().subtract('days', 90).format('YYYY-MM-DD HH:mm:ss');
                    break;
                }
            }
            if(startTime){
                queryBuilder.andWhere('book.create_time>=:startTime and book.create_time<:endTime', { startTime, endTime })
            }
        }
        if(type){
            queryBuilder.andWhere('book.type = :type',{type: Number(type)})
        }
        if(type2){
            queryBuilder.andWhere('book.type2 = :type2',{type2: Number(type2)})
        }
        const total = await queryBuilder.getCount();
        const data = await queryBuilder.orderBy('book.start_time','DESC').offset(PageHelper.getSkip(page)).limit(page.pageSize).getRawMany<MybookingVo>();

        return {
            total,
            data
        }
    }

    async cancelMyReservation(bookingId:number){
        return this.conn.getRepository(HotDeskingBooking).createQueryBuilder()
        .update()
        .set({ state: 3})
        .where("id = :bookingId", {bookingId})
        .execute();
    }

    async endMyReservation(bookingId:number): Promise<void>{
        const row = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
            .innerJoin(MgSpaceEntity, 's', 'b.space_id = s.id')
            .leftJoin(MgEquipmentEntity, 'e', 'e.space_id=b.space_id')
            .select('b.end_time', 'endTime')
            .addSelect('b.state', 'state')
            .addSelect('b.update_time', 'updateTime')
            .addSelect('b.start_time', 'startTime')
            .addSelect('s.id', 'spaceId')
            .addSelect('s.code', 'spaceCode')
            .addSelect('e.code', 'equipmentCode')
            .andWhere('b.id=:bookingId', {bookingId})
            .getRawOne<UseEndHandleInterface>();

        await this.conn.transaction(async m => {
            await m.getRepository(HotDeskingBooking).createQueryBuilder()
            .update()
            .set({
                state: 4,
                useEndTime: moment().format(dateFormat)
            })
            .where("id = :bookingId", {bookingId})
            .execute();

            const useEndHandler = new UseEndHandler();
            const context = {
                conn: this.conn,
                client: this.client,
                logger: new Logger()
            };
            await useEndHandler.closeSocket(context, row);
            await useEndHandler.clearScreen(context, row);
        });
    }

}
