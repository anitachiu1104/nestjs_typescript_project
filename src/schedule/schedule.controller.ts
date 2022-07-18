import { Body, Controller, Get, Inject, Post, Query, ValidationPipe } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { MgTasklistEntity } from '../model/mg-tasklist.entity';
import { ScheduleDto } from './schedule.dto';

@Controller('/schedule')
export class ScheduleController {
    @Inject()
    private readonly scheduleService: ScheduleService;

    @Get('/getAllTasks')
    async getAllTasks(): Promise<MgTasklistEntity[]> {
        return await this.scheduleService.findAllTasks();
    }
    @Get('/startTask')
    async startTask(@Query('id')id:number): Promise<string> {
        return this.scheduleService.startTask(id);
    }
    @Get('/stopTask')
    async stopTask(@Query('id')id:number): Promise<string> {
        return this.scheduleService.stopTask(id);
    }
    @Get('/runTaskOnce')
    async runTaskOnce(@Query('id')id:number): Promise<string> {
        return this.scheduleService.runTaskOnce(id);
    }
    @Post('/editTask')
    async editTask(@Body(new ValidationPipe())data: ScheduleDto): Promise<string> {
        return this.scheduleService.editTask(data);
    }
}