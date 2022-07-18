import * as moment from 'moment';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';
import { HotDeskingBooking } from '../../model/hot-desking-booking.entity';
import { MgEquipmentEntity } from '../../model/mg-equipment.entity';
import { UseEndCloseSocketMessage } from './use-end-closesocket.message';
import { dateFormat } from '../common/const';

@DlxMessageDecorator('hot-desking.use.end.closesocket')
export class UseEndCloseSocketHandler implements DlxMessageProvider {

    async handle(message: UseEndCloseSocketMessage, context: RabbitmqContext): Promise<string> {
        const row = await context.conn
            .getRepository(HotDeskingBooking)
            .createQueryBuilder('h')
            .select('e.code', 'code')
            .addSelect('h.state', 'state')
            .addSelect('h.start_time', 'startTime')
            .addSelect('h.end_time', 'endTime')
            .innerJoin(MgEquipmentEntity, 'e', 'e.space_id=h.space_id')
            .where('h.id=:id', { id: message.id })
            .getRawOne<{ code: string, endTime: string, startTime: string, state: number }>();

        if (!row.code || row.state !== 2) return;
        const endTime = moment(row.endTime).format('YYYY-MM-DD HH:mm:ss');

        if (endTime === message.endTime &&
            moment(row.startTime).format(dateFormat) === message.startTime) {
            await context.client.send({ cmd: 'wism_dms.wulian.close.socket' }, row.code).toPromise();
        }

        return Promise.resolve('success');
    }
}
