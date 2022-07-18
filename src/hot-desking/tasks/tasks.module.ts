import { Module } from '@nestjs/common';
import { DemoTask } from './demo.task';
import { ScheduleModule } from '../../schedule/schedule.module';
import { MessageModule } from '../message/message.module';
import { TasksController } from './tasks.controller';
import { FindUsersTask } from './find-users.task';
import { CheckMqTask } from './check-mq.task';


@Module({
    controllers: [TasksController],
    imports: [ScheduleModule,MessageModule],
    providers: [
        DemoTask,
        FindUsersTask,
        CheckMqTask
    ]
})
export class TasksModule {

}
