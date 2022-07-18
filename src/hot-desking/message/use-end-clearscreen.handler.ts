import {Injectable} from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { UseEndClearScreenMessage } from './use-end-clearscreen.message';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import * as moment from 'moment';
import * as _ from "lodash";
import { dateFormat } from '../common/const';

/**
 *  mqtt水墨屏信息定时清除
 */
@Injectable()
@DlxMessageDecorator('hot-desking.timeend.pushclearscreen')
export class UseEndClearScreenHandler implements DlxMessageProvider {
    async handle(message: UseEndClearScreenMessage, context: RabbitmqContext): Promise<string> {
        const bookingId = message.id;
        const row = await context.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
            .innerJoin(MgSpaceEntity,'s','b.space_id = s.id')
            .select('b.end_time','endTime')
            .addSelect('b.state', 'state')
            .addSelect('b.start_time','startTime')
            .addSelect('s.id', 'spaceId')
            .addSelect('s.code', 'spaceCode')
            .andWhere('b.id=:bookingId',{ bookingId })
            .getRawOne<{ endTime: string, spaceCode: string, spaceId: number, startTime: string, state: number }>();
            const expireTime = moment(row.endTime).format(dateFormat);

        if (row.state !== 2) {
            return;
        }

        if (expireTime === message.endTime &&
            moment(row.startTime).format(dateFormat) === message.startTime)
        {
            const rows = await context.conn.getRepository(HotDeskingBooking).createQueryBuilder()
                .where('start_time >= :endTime', { endTime: expireTime })
                .andWhere('start_time <= :todayEnd', { todayEnd: moment().format('YYYY-MM-DD 23:59:59') })
                .andWhere('space_id=:spaceId', { spaceId: row.spaceId })
                .andWhere('state in (1)')
                .limit(3)
                .orderBy('start_time', 'ASC')
                .getMany();
            const startTimes = [];
            const endTimes = [];
            const screenTimeData = {} ;
            for (const timeData of rows){
                startTimes.push(timeData.startTime);
                endTimes.push(timeData.endTime);
            }
            for (let i=0; i<3; i++) {
                if (!startTimes[i]) {
                    screenTimeData[`time${i}`] = '';
                } else {
                    screenTimeData[`time${i}`] = `${moment(startTimes[i]).format('HH:mm')} - ${moment(endTimes[i]).format('HH:mm')}`;
                }
            }
            await context.client.send({ cmd: 'wism_dms.hanshow.push' }, _.defaults({
                spaceCode: row.spaceCode,
                station: row.spaceCode,
                state: '空闲',
            }, screenTimeData)).toPromise();
        }
        return 'success';
    }
}
