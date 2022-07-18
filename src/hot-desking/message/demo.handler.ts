import { HotDeskingBooking } from 'src/model/hot-desking-booking.entity';
import { Injectable } from "@nestjs/common";
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';

@Injectable()
@DlxMessageDecorator('demo')
export class DemoHandler implements DlxMessageProvider {
    async handle(message: string, context: RabbitmqContext): Promise<string> {
        await context.conn.getRepository(HotDeskingBooking).findOne();
        return 'success';
    }
}
