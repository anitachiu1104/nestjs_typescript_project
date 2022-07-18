import { Controller, Get, Inject, Response, UseGuards, Request } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EntityManager } from 'typeorm';
import { RabbitmqService } from './core/rabbitmq/rabbitmq.service';
import { RedisClient } from './core/redis/redis.client';
import { ScheduleService } from './schedule/schedule.service';
import { join } from 'path'
import { JwtAuthGuard } from './auth/jwt-auth.guard';
@Controller()
export class AppController {
    @Inject()
    private readonly client: ClientProxy;
    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private readonly rabbitmqService: RabbitmqService;
    @Inject()
    private readonly redisClient: RedisClient;
    @Inject()
    private readonly scheduleService: ScheduleService;
    constructor() {
    }
    @Get()
    root(@Response() res): any {
        res.set("Content-Security-Policy", "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'")
        res.sendFile(join(__dirname, '../view/', 'index.html'))
    }

    @Get('/test')
    // @UseGuards(JwtAuthGuard)
    async test(@Request() req) {
        await this.client.send({
            cmd: 'wism_office.get_events'
        }, {
            name: 'smart-meeting'
        }).toPromise();

        // return req.user.userId;
    }
}
