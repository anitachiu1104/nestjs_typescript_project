import { Injectable } from '@nestjs/common';
import { DlxMessageDecorator, DlxMessageProvider, RabbitmqContext } from '../../core/rabbitmq/rabbitmq.decorator';

@Injectable()
@DlxMessageDecorator('hot-desking.sign.start')
export class SignStartHandler implements DlxMessageProvider {

    async handle(message: object, context: RabbitmqContext): Promise<string> {
        await context.client.send({ cmd: 'wism_wechatwork.sendMessage' }, message).toPromise();
        return 'success';
    }

}
