import { SetMetadata } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Connection } from 'typeorm';
import { MyLogger } from '../core/my-logger/my-logger';

export interface ScheduleMeta {
    params: ScheduleDecoratorParam,
    provider: ScheduleProvider
}

export interface ScheduleDecoratorParam {
    name: string,
    cron: string,
}

export const ScheduleDecorator = (d: ScheduleDecoratorParam) => SetMetadata('ScheduleHandler', d);

export interface ScheduleContext {
    conn: Connection;
    client: ClientProxy;
    logger: MyLogger;
}

export interface ScheduleProvider {
    handle(data: object | string, context: ScheduleContext): Promise<string>;
}
