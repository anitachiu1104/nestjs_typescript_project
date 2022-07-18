import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as _ from 'lodash';
import * as moment from 'moment';
import { HotDeskingBooking } from 'src/model/hot-desking-booking.entity';
import { MgSpaceEntity } from 'src/model/mg-space.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class DeviceService {
    @Inject()
    private readonly conn: EntityManager;

    @Inject()
    private readonly client: ClientProxy;
     /**
     * 调用水墨屏服务推送数据
     */
    public async pushScreen(
        spaceCode: string,
        stName: string,
        stPart: string,
        startTime: string,
        endTime: string
        ): Promise<string>{
    /**
     * 信息推送水墨屏
     */
        const screenTime = await this.findNextBookings(startTime, endTime, spaceCode);
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
    public async findNextBookings(startTime: string, endTime: string, spaceCode: string):Promise<any>{
        const todayEndTime = moment().format('YYYY-MM-DD 23:59:59');
        const hotDeskingBookingData = await this.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
            .innerJoin(MgSpaceEntity, 's', 'b.space_id=s.id')
            .select('b.user_id','userId')
            .addSelect('b.start_Time','startTime')
            .addSelect('b.end_Time','endTime')
            .where('b.start_time between :startTime and :endTime', { startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: moment(todayEndTime).format('YYYY-MM-DD HH:mm:ss') })
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
        screenTimeData['time0'] = `${moment(startTime).format('HH:mm')} - ${moment(endTime).format('HH:mm')}`;
        return screenTimeData;
    }

    public async openAllDevicesBySpaceId(spaceId: number): Promise<void> {
        console.log('设备已全部开启!');
    }
}
