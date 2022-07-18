import { ScheduleContext, ScheduleDecorator, ScheduleProvider } from '../../schedule/schedule.decorator';
import { MqConsumersEntity } from '../../model/mq_consumers.entity';
import * as moment from "moment";
import { SignBeforeHandler } from '../message/sign-before.handler';
import { SignTimeoutHandler } from '../message/sign-timeout.handler';
import { UseEndHandler } from '../message/use-end.handler';
import { UseEndBeforeHandler } from '../message/use-end-before.handler';


@ScheduleDecorator({ name: 'hot-desking.mq.check', cron: '59 * * * * ?' })
export class CheckMqTask implements ScheduleProvider {
    async handle(data: object | string, context: ScheduleContext): Promise<string> {
        console.debug('running hot-desking.mq.check');
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(now);
        let results = await context.conn.getRepository(MqConsumersEntity).createQueryBuilder().select(['event','data','id'])
            .where(`trigger_time <=:now`, { now: now }).andWhere(`trigger_time >SUBDATE(:now,interval 1 minute)`, { now: now }).andWhere('state=0').getRawMany();
        console.log("未发mq:",results);

        for(let result of results){
            //根据event判断使用哪个方法
            let handler;
            switch (result.event) {
                case 'hot-desking.sign.before':
                    handler = new SignBeforeHandler();
                    break;
                case 'hot-desking.sign.timeout':
                    handler = new SignTimeoutHandler();
                    break;
                case 'hot-desking.use.end':
                    handler = new UseEndHandler();
                    break;
                case 'hot-desking.use.end.before':
                    handler = new UseEndBeforeHandler();
                    break;
                default:
                    return Promise.reject('无效event');
            }
            //重新调用相应方法
            //写context参数
            let contexta = {
                conn: context.conn,
                client: context.client,
                logger: context.logger,
                contextId: result.id
            }
            await handler.handle(JSON.parse(result.data),contexta);
        }
        return Promise.resolve('success');
    }
}
