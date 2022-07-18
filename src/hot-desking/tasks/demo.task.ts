import { ScheduleContext, ScheduleDecorator, ScheduleProvider } from '../../schedule/schedule.decorator';

@ScheduleDecorator({ name: 'demo.test', cron: '* * * * * ?' })
export class DemoTask implements ScheduleProvider {
    handle(data: object | string, context: ScheduleContext): Promise<string> {
        console.log(111);
        return Promise.resolve('');
    }
}
