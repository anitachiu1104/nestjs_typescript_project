import { Controller, Inject } from '@nestjs/common';
import { ScheduleService } from '../../schedule/schedule.service';

@Controller('/tasks')
export class TasksController {

    @Inject()
    private readonly scheduleService: ScheduleService;
    // @Get('/user/find')
    // async startFindUsersTask()  {
    //     this.scheduleService.runTask('hot-desking.user.find', null);
    // }
    // @Get('/mq/check')
    // async startCheckMqTask()  {
    //     this.scheduleService.runTask('hot-desking.mq.check', null);
    // }
}
