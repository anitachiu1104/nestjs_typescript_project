import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import * as moment from 'moment';
import { UseEndMessage } from './use-end.message';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import * as _ from 'lodash';
import { UseEndHandleInterface } from './interface/use-end-handle.interface';
import { MgEquipmentEntity } from '../../model/mg-equipment.entity';
import { dateFormat } from '../common/const';
import {MqConsumersEntity} from "../../model/mq_consumers.entity";


@Injectable()
@DlxMessageDecorator('hot-desking.use.end')
export class UseEndHandler implements DlxMessageProvider {

    async handle(message: UseEndMessage, context: RabbitmqContext): Promise<string> {
        console.debug('使用结束! ------------>' + JSON.stringify(message));
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id:context.contextId});
        if (moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return ;
        }
        const bookingId = message.id;
        const row = await context.conn.getRepository(HotDeskingBooking).createQueryBuilder('b')
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

        if (row.state !== 2) {
            console.error('hot-desking.use.end error: ');
            return;
        }

        if (message.updateTime === moment(row.updateTime).format(dateFormat)) {
            await context.conn
                .getRepository(HotDeskingBooking)
                .update({id: message.id}, {
                    state: 4,
                    useEndTime: moment().format(dateFormat)
                });
            await this.clearScreen(context, row);
            await this.closeSocket(context, row);
        }

        return 'success';
    }

    async closeSocket(context, row: UseEndHandleInterface): Promise<void> {
        if (!row.equipmentCode) return;
        await context.client.send({ cmd: 'wism_dms.wulian.close.socket' }, row.equipmentCode).toPromise();
    }

    async clearScreen(context, row: UseEndHandleInterface): Promise<void> {
        const rows = await context.conn.getRepository(HotDeskingBooking).createQueryBuilder()
            .where('start_time >= :endTime', {endTime: moment(row.endTime).format(dateFormat)})
            .andWhere('start_time <= :todayEnd', {todayEnd: moment().format('YYYY-MM-DD 23:59:59')})
            .andWhere('space_id=:spaceId', {spaceId: row.spaceId})
            .andWhere('state in (1)')
            .limit(3)
            .orderBy('start_time', 'ASC')
            .getMany();
        const startTimes = [];
        const endTimes = [];
        const screenTimeData = {};
        for (const timeData of rows) {
            startTimes.push(timeData.startTime);
            endTimes.push(timeData.endTime);
        }
        for (let i = 0; i < 3; i++) {
            if (!startTimes[i]) {
                screenTimeData[`time${i}`] = '';
            } else {
                screenTimeData[`time${i}`] = `${moment(startTimes[i]).format('HH:mm')} - ${moment(endTimes[i]).format('HH:mm')}`;
            }
        }
        await context.client.send({cmd: 'wism_dms.hanshow.push'}, _.defaults({
            spaceCode: row.spaceCode,
            station: row.spaceCode,
            state: '空闲',
        }, screenTimeData)).toPromise();
    }
}



