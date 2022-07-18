import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { UseEndMessage } from './use-end.message';
import { SmartMeetingBooking } from '../../model/smart-meeting-booking.entity';
import * as moment from 'moment';
import { MgOperationEntity } from '../../model/mg-operation.entity';
import { MqConsumersEntity } from '../../model/mq_consumers.entity';
import { SmartMeetingEquipmentEntity } from '../../model/smart-meeting-equipment.entity';
import { MgEquipmentEntity } from '../../model/mg-equipment.entity';
import { MgCustomTypes } from '../../model/mg-custom-types.entity';
const dateFormat = 'YYYY-MM-DD HH:mm:ss';

@Injectable()
@DlxMessageDecorator('smart-meeting.use.start')
export class UseStartHandler implements DlxMessageProvider {
    async handle(data: UseEndMessage, context: RabbitmqContext): Promise<string> {
        //判断当前消息时效性,过一分钟不发
        const mqConsumer = await context.conn.getRepository(MqConsumersEntity).findOne({id: context.contextId});
        if (moment().subtract(1, 'm') > moment(mqConsumer.triggerTime)) {
            context.logger.log('mq超时');
            return;
        }
        //修改数据库
        const booking = await context.conn
            .getRepository(SmartMeetingBooking)
            .findOne(data.bookingId);
        if (booking.state !== 1) {
            return Promise.reject('状态不匹配');
        }
        if (mqConsumer.isDelete !== 0) return Promise.reject('记录已被修改');
        //查询会议用到的设备
        let equipmentConfs = await context.conn.getRepository(SmartMeetingEquipmentEntity).createQueryBuilder().where('booking_id = :bookingId',{bookingId: data.bookingId}).getMany();
        for (let equipmentConf of equipmentConfs ){
            if (equipmentConf.ctypeCode === 'threeway-switch'){
                let devIdRes = await context.conn.getRepository(MgEquipmentEntity).createQueryBuilder('t1').innerJoin(MgCustomTypes,'t2',' t1.ctype_id = t2.id')
                    .where('t2.code = "threeway-switch"').andWhere('t1.space_id = :spaceId',{spaceId:data.spaceId}).getOne();
                let devId = devIdRes.code;
                await context.client.send({
                    cmd: 'wism_dms.wulian.open.switches'
                }, {
                    spaceId: String(data.spaceId),
                    endpointNumber: 4,
                    devID: devId
                }).toPromise();
            }
            if (equipmentConf.ctypeCode === 'air-conditioning'){
                let devIdRes = await context.conn.getRepository(MgEquipmentEntity).createQueryBuilder('t1').innerJoin(MgCustomTypes,'t2',' t1.ctype_id = t2.id')
                    .where('t2.code = "air-conditioning"').andWhere('t1.space_id = :spaceId',{spaceId:data.spaceId}).getOne();
                let devId = devIdRes.code;
                //开空调
                await context.client.send({
                    cmd: 'wism_dms.wulian.open.airconditioning'
                }, {
                    spaceId: String(data.spaceId),
                    devID: devId
                }).toPromise();
                //调整温度
                await context.client.send({
                    cmd: 'wism_dms.wulian.set.airconditioning.mode'
                }, {
                    spaceId: String(data.spaceId),
                    devID: devId,
                    mode: equipmentConf.attr4
                }).toPromise();
                //调整风力
                await context.client.send({
                    cmd: 'wism_dms.wulian.set.airwindstength'
                }, {
                    spaceId: String(data.spaceId),
                    devID: devId,
                    strength: equipmentConf.attr3
                }).toPromise();
                if(equipmentConf.attr4==='0'){
                    //热风温度
                    await context.client.send({
                        cmd: 'wism_dms.wulian.set.airconditonWarmtemperature'
                    }, {
                        spaceId: String(data.spaceId),
                        devID: devId,
                        temperature: Number(equipmentConf.attr2)
                    }).toPromise();
                }
                if(equipmentConf.attr4==='1'){
                    //冷风温度
                    await context.client.send({
                        cmd: 'wism_dms.wulian.set.airconditioncoldtemperature'
                    }, {
                        spaceId: String(data.spaceId),
                        devID: devId,
                        temperature: Number(equipmentConf.attr2)
                    }).toPromise();
                }

            }
        }






        await context.conn
            .getRepository(SmartMeetingBooking)
            .update({id: data.bookingId}, {state: 2,useStartTime: moment().format(dateFormat), updateTime: moment().format(dateFormat)});

        await context.conn
            .getRepository(MgOperationEntity)
            .save({
                userId: null,
                type: 'start',
                comment: '',
                createTime: moment().format(dateFormat),
                createBy: 'sys',
                updateTime: moment().format(dateFormat)
            });
        return 'success';
    }
}